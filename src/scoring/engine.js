/**
 * Vigil Score engine.
 * Combines QBO financial data + owner-answered questions into 8 capability
 * scores, a 1.0–5.0 composite, per-capability dollar gaps, and a top action.
 *
 * answers — plain object { questionId: answerKey } (loaded from vigil_answers DB)
 * qboData — output of loadBusiness() / loadFromQuickBooks()
 */

import { getBenchmarks } from './benchmarks.js';
import { getAction } from './actions.js';
import { getBrightSpot } from './brightSpots.js';

export const CAP_IDS = [
  'pricing_strategy',
  'cash_cycle',
  'concentration_risk',
  'gross_margin',
  'labor_efficiency',
  'revenue_mix',
  'collection_discipline',
  'cost_structure',
];

export const CAP_LABELS = {
  pricing_strategy:     'Pricing Strategy',
  cash_cycle:           'Cash Cycle',
  concentration_risk:   'Customer Concentration',
  gross_margin:         'Gross Margin',
  labor_efficiency:     'Labor Efficiency',
  revenue_mix:          'Revenue Mix',
  collection_discipline:'Collection Discipline',
  cost_structure:       'Cost Structure',
};

export function computeVigilScore(qboData, answers) {
  const industryCode = answers.industry_type || 'other';
  const bench = getBenchmarks(industryCode);
  const annualRevenue = (qboData?.revenue?.last_90d || 0) * 4;

  const scores      = {};
  const sources     = {};
  const dollar_gaps = {};

  // 1. Pricing Strategy
  {
    const qboScore = qboData?.capability_scores?.pricing_strategy ?? 3;
    const recency  = answers.pricing_recency;
    let score = qboScore;
    if (recency === '2+yr')   score = Math.min(score, 2);
    else if (recency === '<6mo') score = Math.min(5, score + 1);
    scores.pricing_strategy = clamp(score);

    let src = qboData?.capability_score_sources?.pricing_strategy || 'Estimated from QBO service rates';
    if (recency) src += ` · Pricing last reviewed: ${recency}`;
    sources.pricing_strategy = src;

    const serviceGap = (qboData?.service_rates || [])
      .filter(s => s.benchmark_rate && s.gap_pct > 10)
      .reduce((sum, s) => sum + (s.benchmark_rate - s.avg_rate) * s.job_count * 4, 0);
    dollar_gaps.pricing_strategy = serviceGap > 0
      ? Math.round(serviceGap)
      : Math.round(Math.max(0, bench.gross_margin_pct - (qboData?.margin?.gross_pct_30d || 0)) / 100 * annualRevenue * 0.3);
  }

  // 2. Cash Cycle Management
  {
    const qboScore = qboData?.capability_scores?.cash_management ?? 3;
    const terms    = answers.payment_terms;
    let score = qboScore;
    if (terms === 'net7')  score = Math.min(5, score + 1);
    if (terms === 'net60') score = Math.max(1, score - 1);
    if (terms === 'none')  score = Math.max(1, score - 2);
    scores.cash_cycle = clamp(score);

    let src = qboData?.capability_score_sources?.cash_management || 'Estimated from cash runway';
    if (terms) src += ` · Payment terms: ${terms}`;
    sources.cash_cycle = src;

    const arDays = weightedAvgArDays(qboData?.ar?.invoices || []);
    const extraDays = Math.max(0, arDays - bench.avg_collection_days);
    dollar_gaps.cash_cycle = Math.round(extraDays / 365 * (qboData?.ar?.total_outstanding || 0) * 8);
  }

  // 3. Customer Concentration Risk
  {
    scores.concentration_risk = clamp(qboData?.capability_scores?.client_mix ?? 3);
    sources.concentration_risk = qboData?.capability_score_sources?.client_mix || 'Estimated from invoice revenue distribution';
    dollar_gaps.concentration_risk = scores.concentration_risk <= 2
      ? Math.round(annualRevenue * 0.05)
      : 0;
  }

  // 4. Gross Margin by Segment
  {
    const actual = qboData?.margin?.gross_pct_30d || 0;
    const target = bench.gross_margin_pct;
    const gap    = actual - target;
    let score;
    if (gap > 10)       score = 5;
    else if (gap > 0)   score = 4;
    else if (gap > -5)  score = 3;
    else if (gap > -15) score = 2;
    else                score = 1;
    scores.gross_margin = clamp(score);
    sources.gross_margin = `${actual.toFixed(1)}% gross margin vs ${target}% industry benchmark`;
    dollar_gaps.gross_margin = Math.round(Math.max(0, target - actual) / 100 * annualRevenue);
  }

  // 5. Labor Efficiency
  {
    const empStr   = answers.employee_count;
    const empCount = empStr ? parseInt(empStr, 10) : null;
    if (!empCount || empCount < 1 || !annualRevenue) {
      scores.labor_efficiency   = 3;
      sources.labor_efficiency  = 'Employee count not provided — using median estimate';
      dollar_gaps.labor_efficiency = 0;
    } else {
      const revPerEmp = annualRevenue / empCount;
      const benchRev  = bench.revenue_per_employee;
      const ratio     = revPerEmp / benchRev;
      let score;
      if (ratio > 1.5)      score = 5;
      else if (ratio > 1.1) score = 4;
      else if (ratio > 0.8) score = 3;
      else if (ratio > 0.5) score = 2;
      else                  score = 1;
      scores.labor_efficiency   = clamp(score);
      sources.labor_efficiency  = `$${Math.round(revPerEmp / 1000)}K revenue/employee vs $${Math.round(benchRev / 1000)}K benchmark`;
      dollar_gaps.labor_efficiency = Math.round(Math.max(0, benchRev - revPerEmp) * empCount);
    }
  }

  // 6. Revenue Mix (Recurring vs One-Time)
  {
    const recurringKey = answers.recurring_revenue_pct;
    const recurringPct = recurringKey === '>75'   ? 0.80
      : recurringKey === '50-75' ? 0.625
      : recurringKey === '25-50' ? 0.375
      : recurringKey === '<25'   ? 0.15
      : null;

    if (recurringPct === null) {
      scores.revenue_mix   = 2;
      sources.revenue_mix  = 'Recurring revenue % not answered — conservative default';
      dollar_gaps.revenue_mix = 0;
    } else {
      let score;
      if (recurringPct > 0.75)      score = 5;
      else if (recurringPct > 0.50) score = 4;
      else if (recurringPct > 0.25) score = 3;
      else                          score = 2;
      scores.revenue_mix   = clamp(score);
      sources.revenue_mix  = `${Math.round(recurringPct * 100)}% recurring revenue`;
      const benchRecurring = bench.recurring_revenue_pct / 100;
      dollar_gaps.revenue_mix = recurringPct < benchRecurring
        ? Math.round((benchRecurring - recurringPct) * annualRevenue * 0.10)
        : 0;
    }
  }

  // 7. Collection Discipline
  {
    const qboScore = qboData?.capability_scores?.ar_management ?? 3;
    const process  = answers.collections_process;
    let score = qboScore;
    if (process === 'auto')   score = Math.min(5, score + 1);
    if (process === 'wait')   score = Math.max(1, score - 1);
    if (process === 'agency') score = Math.max(1, score - 2);
    scores.collection_discipline = clamp(score);

    let src = qboData?.capability_score_sources?.ar_management || 'Estimated from AR days outstanding';
    if (process) src += ` · Collections: ${process}`;
    sources.collection_discipline = src;

    const arDays    = weightedAvgArDays(qboData?.ar?.invoices || []);
    const extraDays = Math.max(0, arDays - bench.avg_collection_days);
    dollar_gaps.collection_discipline = Math.round(extraDays / 365 * (qboData?.ar?.total_outstanding || 0) * 12);
  }

  // 8. Cost Structure vs Revenue Growth
  {
    const rev30   = qboData?.revenue?.last_30d  || 0;
    const revPY   = qboData?.revenue?.ytd_prior_year || 0;
    const gross30 = qboData?.margin?.gross_pct_30d  || 0;
    const grossPY = qboData?.margin?.gross_pct_prior_year || 0;

    const revAnnualized   = rev30 * 12;
    const revGrowth       = revPY > 0 ? (revAnnualized / revPY - 1) : 0;
    const marginImproving = gross30 >= grossPY;

    let score;
    if (revGrowth > 0.15 && marginImproving) score = 5;
    else if (revGrowth > 0.05 && marginImproving) score = 4;
    else if (revGrowth >= 0) score = 3;
    else if (revGrowth > -0.10) score = 2;
    else score = 1;

    scores.cost_structure = clamp(score);
    sources.cost_structure = revPY > 0
      ? `${(revGrowth * 100).toFixed(1)}% YoY revenue growth; margin ${marginImproving ? 'stable/improving' : 'compressing'}`
      : 'Insufficient prior-year data';
    dollar_gaps.cost_structure = revGrowth < 0
      ? Math.round(Math.abs(revGrowth) * annualRevenue * 0.5)
      : 0;
  }

  // ── Composite (weak caps get 1.5× weight to push focus there) ────────────────
  const sorted    = CAP_IDS.map(k => [k, scores[k]]).sort((a, b) => a[1] - b[1]);
  const weakest2  = new Set(sorted.slice(0, 2).map(([k]) => k));
  let weightedSum = 0;
  let totalWeight = 0;
  for (const cap of CAP_IDS) {
    const w = weakest2.has(cap) ? 1.5 : 1.0;
    weightedSum += scores[cap] * w;
    totalWeight += w;
  }
  const composite = Math.round((weightedSum / totalWeight) * 10) / 10;

  // ── Top action (highest dollar gap; tie-break: lowest score) ─────────────────
  const gapRanked = CAP_IDS
    .filter(k => dollar_gaps[k] > 0)
    .sort((a, b) => dollar_gaps[b] - dollar_gaps[a] || scores[a] - scores[b]);
  const topCapId = gapRanked[0] || sorted[0]?.[0];
  const topAction = topCapId ? {
    capability:  CAP_LABELS[topCapId],
    dollar_gap:  dollar_gaps[topCapId],
    ...getAction(topCapId, scores[topCapId]),
  } : null;

  const topBrightSpot = topCapId ? getBrightSpot(topCapId) : null;

  return {
    composite,
    industry_code: industryCode,
    benchmarks:    getBenchmarks(industryCode),
    scores:        Object.fromEntries(
      CAP_IDS.map(k => [k, {
        score:     scores[k],
        label:     CAP_LABELS[k],
        source:    sources[k],
        dollar_gap: dollar_gaps[k],
      }])
    ),
    dollar_gaps,
    top_action:      topAction,
    top_bright_spot: topBrightSpot,
  };
}

function clamp(score) {
  return Math.max(1, Math.min(5, Math.round(score)));
}

function weightedAvgArDays(invoices) {
  const total = invoices.reduce((s, i) => s + i.amount, 0);
  if (total === 0) return 0;
  return invoices.reduce((s, i) => s + i.days_outstanding * i.amount, 0) / total;
}
