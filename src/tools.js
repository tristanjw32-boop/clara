import { loadBusiness, listBusinesses } from './data.js';
import { claraAnalyze } from './analysis.js';
import { validateBusinessId, validateQuestion, validateDays, validateShortString } from './validate.js';
import { runAgents } from './agents/index.js';
import { getOrGenerateFramework } from './capabilities/generator.js';
import { getAssessmentScores, mergeScores, prioritisedRoadmap } from './capabilities/scorer.js';
import { computeVigilScore, CAP_LABELS } from './scoring/engine.js';
import { loadAnswers, saveScore, getLatestScore } from './scoring/store.js';

// ── Helpers ──────────────────────────────────────────────────────────────────

function fmt(n) { return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n); }
function pct(n) { return `${n.toFixed(1)}%`; }

function cashBurnRate(d) {
  // Average daily burn based on 90-day cash decline
  const decline = d.cash['90d_ago'] - d.cash.current_balance;
  return decline / 90;
}

// ── Tool: get_financial_briefing ──────────────────────────────────────────────

export async function getFinancialBriefing({ business_id, owner_name, wiki_context = null }) {
  const d = await loadBusiness(validateBusinessId(business_id));
  const { business, cash, revenue, margin, ar } = d;
  if (owner_name) business.owner = owner_name;

  const revenueChange = ((revenue.last_30d - revenue.last_60d) / revenue.last_60d * 100).toFixed(1);
  const yoyChange = ((revenue.ytd - revenue.ytd_prior_year) / revenue.ytd_prior_year * 100).toFixed(1);
  const cashChange = cash.current_balance - cash['30d_ago'];
  const overdue = ar.total_outstanding - ar.current;

  const payablesDueShortly = (cash.upcoming_payables || [])
    .filter(p => p.days_until_due <= 7)
    .sort((a, b) => a.days_until_due - b.days_until_due);
  const totalDueSoon = payablesDueShortly.reduce((s, p) => s + p.amount, 0);
  const cashAfterBills = cash.current_balance - totalDueSoon;

  const topOverdue = (ar.invoices || [])
    .filter(i => i.days_outstanding > 0)
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 5);

  const urgentAlert = totalDueSoon > cash.current_balance
    ? `CASH CRISIS: ${fmt(totalDueSoon)} in bills due within 7 days but only ${fmt(cash.current_balance)} in the bank. Net position: -${fmt(Math.abs(cashAfterBills))} if nothing is collected.`
    : overdue > 20000
      ? `${fmt(overdue)} in overdue AR`
      : cashChange < -10000
        ? `Cash dropped ${fmt(Math.abs(cashChange))} in the last 30 days`
        : `Gross margin is ${margin.gross_pct_30d < margin.gross_pct_prior_year ? 'compressing' : 'stable'}`;

  const context = {
    owner: business.owner,
    business: business.name,
    cash_current: fmt(cash.current_balance),
    cash_30d_change: fmt(Math.abs(cashChange)),
    cash_direction: cashChange >= 0 ? 'up' : 'down',
    revenue_30d: fmt(revenue.last_30d),
    revenue_mom_change_pct: revenueChange,
    revenue_yoy_change_pct: yoyChange,
    gross_margin_pct: pct(margin.gross_pct_30d),
    gross_margin_vs_prior_year: pct(margin.gross_pct_prior_year),
    net_margin_pct: pct(margin.net_pct_30d),
    ar_total_overdue: fmt(overdue),
    ar_top_overdue_invoices: topOverdue.map(i => `${i.customer}: ${fmt(i.amount)} (${i.days_outstanding}d overdue)`),
    bills_due_within_7_days: payablesDueShortly.map(p => `${p.vendor}: ${fmt(p.amount)} due in ${p.days_until_due}d`),
    cash_after_imminent_bills: fmt(cashAfterBills),
    most_urgent_alert: urgentAlert,
  };

  const insight = await claraAnalyze(
    `Write a morning financial briefing for ${business.owner} at ${business.name}. Lead with the single most important signal in one sentence. Then give 4-5 lines covering cash position, revenue trend, margin, and the most urgent alert — each as a bold label followed by the value, like: **Cash:** $14,200 — down $8K this month. No bullet points. End with a "Key Action Items" header and exactly 2-3 numbered actions they can take this week. No waffle, no padding.`,
    context,
    wiki_context
  );

  return { business: business.name, snapshot_date: d.snapshot_date, briefing: insight, raw: context };
}

// ── Tool: get_cash_forecast ───────────────────────────────────────────────────

export async function getCashForecast({ business_id, days, owner_name, wiki_context = null }) {
  const d = await loadBusiness(validateBusinessId(business_id));
  days = validateDays(days);
  const { business, cash } = d;
  if (owner_name) business.owner = owner_name;

  const dailyBurn = cashBurnRate(d);
  const expectedArCollections = d.ar.total_outstanding * 0.7; // conservative 70% collection

  const projections = [30, 60, 90].filter(n => n <= days).map(horizon => {
    const outflows = (cash.upcoming_payables || [])
      .filter(p => (p.days_until_due ?? p.due_in_days ?? 0) <= horizon)
      .reduce((s, p) => s + p.amount, 0);
    const inflows = horizon <= 45 ? expectedArCollections * 0.6 : expectedArCollections;
    const projected = cash.current_balance - outflows + inflows;
    return { horizon_days: horizon, projected_balance: projected, outflows, inflows };
  });

  const gapPoint = projections.find(p => p.projected_balance < 10000);

  const context = {
    owner: business.owner,
    current_cash: fmt(cash.current_balance),
    daily_burn_rate: fmt(dailyBurn),
    upcoming_payables: (cash.upcoming_payables || []).map(p => ({
      ...p,
      amount_fmt: fmt(p.amount),
    })),
    projections: projections.map(p => ({
      ...p,
      projected_balance_fmt: fmt(p.projected_balance),
    })),
    gap_warning: gapPoint
      ? `Cash may drop below $10K in approximately ${gapPoint.horizon_days} days`
      : null,
    ar_collectible: fmt(expectedArCollections),
  };

  const insight = await claraAnalyze(
    `Write a cash flow forecast for ${business.owner}. One sentence opener naming the biggest cash risk or opportunity. Then 4-5 lines with specific numbers — each as a bold label followed by the value, like: **Balance now:** $14,200 | **30 days:** $6,400 | **Payroll due:** $16,800 in 3 days. No bullet points. End with "Key Action Items" and 2-3 numbered actions. If there's a crunch coming, say exactly when and how much. Be direct.`,
    context,
    wiki_context
  );

  return {
    business: business.name,
    current_balance: cash.current_balance,
    projections,
    gap_warning: gapPoint ? gapPoint : null,
    forecast: insight,
    raw: context,
  };
}

// ── Tool: get_margin_analysis ─────────────────────────────────────────────────

export async function getMarginAnalysis({ business_id, owner_name, wiki_context = null }) {
  const d = await loadBusiness(validateBusinessId(business_id));
  const { business, customers, margin, industry_benchmarks, service_rates } = d;
  if (owner_name) business.owner = owner_name;

  const hasCustomers = Array.isArray(customers) && customers.length > 0;
  const hasServiceRates = Array.isArray(service_rates) && service_rates.length > 0;

  let context;
  let prompt;

  if (hasCustomers) {
    // Fixture path: full per-customer margin breakdown
    const sorted = [...customers].sort((a, b) => b.revenue_90d - a.revenue_90d);
    const totalRevenue = customers.reduce((s, c) => s + (c.revenue_90d || 0), 0);
    const topTwo = sorted.slice(0, 2);
    const topTwoRevenuePct = totalRevenue > 0
      ? ((topTwo.reduce((s, c) => s + (c.revenue_90d || 0), 0) / totalRevenue) * 100).toFixed(1)
      : '0.0';
    const topTwoMarginPct = topTwo.length === 2
      ? (((topTwo[0].revenue_90d * topTwo[0].margin_pct / 100) + (topTwo[1].revenue_90d * topTwo[1].margin_pct / 100)) / (topTwo[0].revenue_90d + topTwo[1].revenue_90d) * 100).toFixed(1)
      : null;
    const unprofitable = customers.filter(c => c.margin_pct < 0);
    const dragClients  = customers.filter(c => c.margin_pct < (margin.gross_pct_90d || margin.gross_pct_30d) - 10);

    context = {
      owner: business.owner,
      business: business.name,
      overall_gross_margin_30d: pct(margin.gross_pct_30d),
      overall_gross_margin_prior_year: pct(margin.gross_pct_prior_year),
      benchmark_gross_margin: pct(industry_benchmarks.gross_margin_pct),
      gap_to_benchmark: pct(industry_benchmarks.gross_margin_pct - margin.gross_pct_30d),
      customers: sorted.map(c => ({
        name: c.name,
        revenue_90d: fmt(c.revenue_90d),
        revenue_share_pct: pct((c.revenue_90d || 0) / totalRevenue * 100),
        margin_pct: pct(c.margin_pct),
        profit_90d: fmt((c.revenue_90d || 0) * c.margin_pct / 100),
      })),
      top_two_revenue_pct: `${topTwoRevenuePct}%`,
      top_two_margin_pct: topTwoMarginPct ? `${topTwoMarginPct}%` : null,
      unprofitable_clients: unprofitable.map(c => c.name),
      drag_clients: dragClients.map(c => ({ name: c.name, margin_pct: pct(c.margin_pct), notes: c.notes })),
    };
    prompt = `Analyse the customer margin breakdown for ${business.owner} at ${business.name}. One sentence naming the single most important margin finding. Then one line per key customer as a bold label followed by the numbers, like: **Grand Meridian:** 12% margin, $4,200 profit. Call out anyone unprofitable or dragging the average. No bullet points. End with "Key Action Items" and 2-3 numbered actions with specific numbers. Name names — no vague "one client" language.`;
  } else {
    // QBO live path: no per-customer data — use service-rate breakdown instead
    const totalServiceRevenue = hasServiceRates
      ? service_rates.reduce((s, r) => s + (r.total_revenue || 0), 0)
      : 0;
    const underpricedServices = hasServiceRates
      ? service_rates.filter(r => r.gap_pct !== null && r.gap_pct > 10)
      : [];
    const annualGap = underpricedServices.reduce((s, r) => {
      if (!r.benchmark_rate || !r.avg_rate || !r.job_count) return s;
      return s + (r.benchmark_rate - r.avg_rate) * r.job_count * 4; // annualise from 90d
    }, 0);

    context = {
      owner: business.owner,
      business: business.name,
      overall_gross_margin_30d: pct(margin.gross_pct_30d),
      overall_gross_margin_prior_year: pct(margin.gross_pct_prior_year),
      benchmark_gross_margin: pct(industry_benchmarks.gross_margin_pct),
      gap_to_benchmark: pct(industry_benchmarks.gross_margin_pct - margin.gross_pct_30d),
      service_breakdown: hasServiceRates ? service_rates.map(r => ({
        service: r.service,
        avg_rate: fmt(r.avg_rate),
        total_revenue_90d: fmt(r.total_revenue),
        job_count: r.job_count,
        benchmark_rate: r.benchmark_rate ? fmt(r.benchmark_rate) : 'no benchmark',
        gap_pct: r.gap_pct !== null ? `${r.gap_pct}% below market` : null,
      })) : [],
      total_service_revenue_90d: fmt(totalServiceRevenue),
      underpriced_services: underpricedServices.map(r => r.service),
      estimated_annual_pricing_gap: annualGap > 0 ? fmt(annualGap) : null,
      note: 'Per-customer margin breakdown is not available for this account. Analysis is based on overall margin and service-level pricing data.',
    };
    prompt = `Analyse the margin picture for ${business.owner} at ${business.name} using their overall margin and service-rate data (per-customer breakdown not available). Open with one sentence on the most important margin finding. Then one line per service as a bold label: rate charged, benchmark rate if available, and what the gap means in dollars. No bullet points. End with "Key Action Items" and 2-3 numbered actions with specific dollar amounts where possible.`;
  }

  const insight = await claraAnalyze(prompt, context, wiki_context);

  return {
    business: business.name,
    overall_margin: { gross_30d: margin.gross_pct_30d, gross_prior_year: margin.gross_pct_prior_year, benchmark: industry_benchmarks.gross_margin_pct },
    customers: hasCustomers ? customers : [],
    analysis: insight,
    raw: context,
  };
}

// ── Tool: identify_value_gaps ─────────────────────────────────────────────────

const CAPABILITY_LABELS = {
  pricing_strategy: 'Pricing Strategy',
  financial_visibility: 'Financial Visibility',
  operations_efficiency: 'Operations Efficiency',
  customer_acquisition: 'Customer Acquisition',
  customer_retention: 'Customer Retention',
  talent_management: 'Talent Management',
  technology_automation: 'Technology & Automation',
  sales_process: 'Sales Process',
  cash_flow_management: 'Cash Flow Management',
  strategic_planning: 'Strategic Planning',
};

export async function identifyValueGaps({ business_id, owner_name, wiki_context = null }) {
  const d = await loadBusiness(validateBusinessId(business_id));
  const { business, capability_scores, margin, revenue, industry_benchmarks } = d;
  if (owner_name) business.owner = owner_name;

  const annualRevenue = revenue.last_90d * 4;
  const currentNetMarginPct = margin.net_pct_90d / 100;
  const benchmarkNetMarginPct = industry_benchmarks.net_margin_pct / 100;
  const currentProfit = annualRevenue * currentNetMarginPct;
  const benchmarkProfit = annualRevenue * benchmarkNetMarginPct;
  const totalGap = benchmarkProfit - currentProfit;

  const gaps = Object.entries(capability_scores)
    .filter(([, score]) => score <= 2)
    .map(([key, score]) => {
      const label = CAPABILITY_LABELS[key] || key;
      const weight = (3 - score) / Object.values(capability_scores).filter(s => s <= 2).reduce((sum, s) => sum + (3 - s), 0);
      const dollarImpact = Math.round(totalGap * weight);
      return { capability: label, current_score: score, target_score: score + 2, estimated_annual_value: dollarImpact };
    })
    .sort((a, b) => b.estimated_annual_value - a.estimated_annual_value)
    .slice(0, 3);

  // Service-level underpricing gaps (from QBO invoice line data if available)
  const serviceGaps = (d.service_rates || [])
    .filter(s => s.benchmark_rate && s.gap_pct > 10)
    .map(s => {
      const annualJobs  = Math.round(s.job_count * (365 / 90));
      const avgHrs      = s.total_qty > 0 ? s.total_revenue / s.avg_rate / s.job_count : 1;
      const annualGap   = Math.round(annualJobs * avgHrs * (s.benchmark_rate - s.avg_rate));
      return {
        service:        s.service,
        current_rate:   s.avg_rate,
        benchmark_rate: s.benchmark_rate,
        gap_pct:        s.gap_pct,
        job_count_90d:  s.job_count,
        estimated_annual_gap: annualGap,
      };
    })
    .sort((a, b) => b.estimated_annual_gap - a.estimated_annual_gap);

  const context = {
    owner: business.owner,
    business: business.name,
    annual_revenue_estimate: fmt(annualRevenue),
    current_net_margin: pct(margin.net_pct_90d),
    benchmark_net_margin: pct(industry_benchmarks.net_margin_pct),
    total_gap_vs_benchmark: fmt(totalGap),
    top_capability_gaps: gaps.map(g => ({ ...g, dollar_value: fmt(g.estimated_annual_value) })),
    capability_score_sources: d.capability_score_sources || {},
    service_pricing_gaps: serviceGaps.map(g => ({
      ...g,
      annual_gap_value: fmt(g.estimated_annual_gap),
      summary: `${g.service}: charging $${g.current_rate}/hr vs $${g.benchmark_rate}/hr market — ${g.job_count_90d} jobs in 90 days, leaving ${fmt(g.estimated_annual_gap)}/yr on the table`,
    })),
    market_data: d.market_data || null,
  };

  const insight = await claraAnalyze(
    `Identify the top value gaps for ${business.owner} at ${business.name}. Capability scores are auto-derived from live financial data — capability_score_sources explains what drove each score. If there are service pricing gaps, lead with those — they're the most actionable. One sentence opener on the biggest opportunity. Then one line per gap as a bold label followed by the numbers, like: **Pest Control Underpricing:** $35/hr vs $65/hr market — costs you $6,000/yr. For capability gaps, cite the underlying data (e.g. "47-day average AR collection" for an AR score of 2). No bullet points. End with "Key Action Items" — one specific first step per gap with a dollar value attached.`,
    context,
    wiki_context
  );

  return {
    business: business.name,
    total_gap_vs_benchmark: totalGap,
    top_gaps: gaps,
    analysis: insight,
    raw: context,
  };
}

// ── Tool: get_ar_alerts ───────────────────────────────────────────────────────

export async function getArAlerts({ business_id, owner_name, wiki_context = null }) {
  const d = await loadBusiness(validateBusinessId(business_id));
  const { business, ar } = d;
  if (owner_name) business.owner = owner_name;

  if (!ar.invoices || ar.invoices.length === 0) {
    return { business: business.name, message: 'No outstanding invoices. AR is clear.', invoices: [] };
  }

  const overdue = ar.invoices
    .filter(inv => inv.days_outstanding > 30)
    .sort((a, b) => (b.days_outstanding * b.amount) - (a.days_outstanding * a.amount));

  const totalOverdue = overdue.reduce((s, i) => s + i.amount, 0);
  const oldest = overdue[0];

  const context = {
    owner: business.owner,
    business: business.name,
    total_outstanding: fmt(ar.total_outstanding),
    total_overdue_30_plus: fmt(totalOverdue),
    overdue_invoices: overdue.map(inv => ({
      ...inv,
      amount_fmt: fmt(inv.amount),
      risk_score: Math.round(inv.days_outstanding * inv.amount / 1000),
    })),
    oldest_invoice: oldest
      ? { customer: oldest.customer, amount: fmt(oldest.amount), days: oldest.days_outstanding, id: oldest.id }
      : null,
  };

  const insight = await claraAnalyze(
    `Write an AR alert for ${business.owner} at ${business.name}. One sentence on the total overdue amount and the cash risk. Then one line per overdue invoice as a bold label followed by the details, like: **Lakeside Suites:** $8,400 — 62 days overdue. No bullet points. End with "Key Action Items": first item should be a ready-to-send follow-up message for the most urgent invoice (write the actual message, in quotes, that ${business.owner} can copy and send right now). Then 1-2 more numbered actions.`,
    context,
    wiki_context
  );

  return {
    business: business.name,
    total_outstanding: ar.total_outstanding,
    total_overdue: totalOverdue,
    invoices: overdue,
    alert: insight,
    raw: context,
  };
}

// ── Tool: ask_clara ───────────────────────────────────────────────────────────

export async function askClara({ business_id, question, owner_name, wiki_context = null }) {
  const d = await loadBusiness(validateBusinessId(business_id));
  const { business } = d;
  if (owner_name) business.owner = owner_name;

  if (question === 'onboard') {
    return {
      message: `To set up Vigil for your business, please use the onboard_clara tool instead — it will ask you 3 quick questions and return a personalised first insight. Call onboard_clara with: owner_name, business_type, and biggest_concern.`,
    };
  }

  const safeQuestion = validateQuestion(question);

  // Pass full financial context for open-ended questions
  const fullContext = {
    business: d.business,
    snapshot_date: d.snapshot_date,
    cash: d.cash,
    revenue: d.revenue,
    margin: d.margin,
    customers: d.customers,
    ar: d.ar,
    capability_scores: d.capability_scores,
    capability_score_sources: d.capability_score_sources || {},
    industry_benchmarks: d.industry_benchmarks,
  };

  const answer = await claraAnalyze(
    `${business.owner} at ${business.name} sent you this message: """${safeQuestion}"""\n\nFirst, read the tone:\n- If it's an ACTION COMMITMENT ("I'm calling them now", "on it", "doing it", "will do") — respond with ONE short encouraging sentence and nothing else. No numbers, no new concerns.\n- If it's a thank-you or acknowledgement — open with a warm one-sentence reply, then weave in anything urgent very softly.\n- If it's a financial question — answer directly with specific numbers from the data.\nUse only the financial data provided.`,
    fullContext,
    wiki_context
  );

  return { business: business.name, question, answer };
}

// ── Tool: get_action_drafts ───────────────────────────────────────────────────

export async function getActionDrafts({ business_id, owner_name, chat_id = null }) {
  const d = await loadBusiness(validateBusinessId(business_id));
  const { business } = d;
  if (owner_name) business.owner = owner_name;

  const drafts = await runAgents(d, owner_name, chat_id);

  if (drafts.length === 0) {
    return {
      business: business.name,
      drafts: [],
      message: 'No actions needed right now — your AR, pricing, and cash position are all in good shape.',
    };
  }

  return {
    business: business.name,
    draft_count: drafts.length,
    drafts: drafts.map(({ agent, context, ...rest }) => rest), // strip internal fields from MCP response
    governance_note: 'These are drafts only. Nothing has been sent. Review before copying.',
  };
}

// ── Tool: get_growth_roadmap ──────────────────────────────────────────────────

export async function getGrowthRoadmap({ business_id, business_type, owner_name, wiki_context = null }) {
  const d = await loadBusiness(validateBusinessId(business_id));
  const { business } = d;
  if (owner_name) business.owner = owner_name;

  const type = business_type || d.business.business_type || 'small business';
  const framework = await getOrGenerateFramework(type);

  if (!framework) {
    return { business: business.name, message: "I'm still building your capability profile — check back in a moment." };
  }

  const layer2Scores = await getAssessmentScores(business_id);
  const merged = mergeScores(d.capability_scores || {}, layer2Scores, framework);
  const roadmap = prioritisedRoadmap(framework, merged);

  const scoredCount = roadmap.filter(r => r.scored).length;
  const unscoredCount = roadmap.filter(r => !r.scored).length;
  const top3 = roadmap.slice(0, 3);

  const context = {
    owner: business.owner,
    business: business.name,
    business_type: type,
    scored_capabilities: scoredCount,
    unscored_capabilities: unscoredCount,
    top_priorities: top3.map(r => ({
      capability: r.name,
      domain: r.domain,
      current_level: r.current_score,
      current_state: r.current_description,
      target_level: r.target_score,
      target_state: r.target_description,
      source: r.source,
      ai_use_case: r.ai_use_case,
    })),
    assessment_complete: unscoredCount === 0,
  };

  const insight = await claraAnalyze(
    `Write a growth roadmap for ${business.owner} at ${business.name}. They run a ${type} business.

Present the top 3 capability priorities. For each:
- One bold label line: **[Capability Name] — Level [N]/5**
- One line on what their current state looks like (use current_state if available)
- One line on what Level [target] looks like and what changes
- One line on the specific AI use case that closes this gap

End with: if there are unscored capabilities (${unscoredCount} remaining), tell ${business.owner} that Vigil will ask about those over the next few days through normal conversation — not a survey.

No bullet points within sections. Keep it tight — this is a roadmap, not a report.`,
    context,
    wiki_context
  );

  return {
    business: business.name,
    roadmap: insight,
    raw: { top3, scored: scoredCount, unscored: unscoredCount },
  };
}

// ── Tool: onboard_clara ───────────────────────────────────────────────────────

// Maps user-described concern + industry to the best matching fixture.
// This is the synthetic-phase stand-in for real QuickBooks data.
function matchFixture(concern, businessType) {
  const c = (concern || '').toLowerCase();
  const t = (businessType || '').toLowerCase();

  if (c.includes('cash') || c.includes('runway') || c.includes('payroll') || t.includes('food') || t.includes('bakery') || t.includes('retail'))
    return 'metro-bakery';
  if (c.includes('margin') || c.includes('profit') || c.includes('customer') || t.includes('consult') || t.includes('service') || t.includes('agency'))
    return 'riverside-consulting';
  if (c.includes('invoice') || c.includes('collect') || c.includes('ar') || c.includes('payment') || t.includes('plumb') || t.includes('trade') || t.includes('contractor'))
    return 'acme-plumbing';
  if (c.includes('pric') || c.includes('undercharg') || c.includes('rate') || t.includes('fitness') || t.includes('gym') || t.includes('wellness'))
    return 'peak-fitness';
  // Default: HVAC / general trades — hidden cost drain is the most universally surprising insight
  return 'summit-hvac';
}

export async function onboardClara({ owner_name, business_type, biggest_concern, annual_revenue }) {
  const name    = validateShortString(owner_name, 'owner_name');
  const type    = validateShortString(business_type, 'business_type');
  const concern = validateShortString(biggest_concern, 'biggest_concern');
  const revenue = annual_revenue ? validateShortString(String(annual_revenue), 'annual_revenue') : 'not provided';

  const fixtureId = matchFixture(concern, type);
  const d = await loadBusiness(fixtureId);

  // Build a personalised context that substitutes the owner's name and business type
  // while using the matched fixture's financial data as the model
  const context = {
    owner: name,
    business_type: type,
    biggest_concern: concern,
    annual_revenue_estimate: revenue,
    matched_profile: d.business.name,
    cash: d.cash,
    revenue: d.revenue,
    margin: d.margin,
    customers: d.customers,
    ar: d.ar,
    capability_scores: d.capability_scores,
    industry_benchmarks: d.industry_benchmarks,
    note: 'This is a representative financial profile for a similar business. Real data will be available after QuickBooks connection.',
  };

  const insight = await claraAnalyze(
    `You are onboarding ${name}, who runs a ${type} business. Their biggest concern is: "${concern}".

Write a warm, brief welcome message (3–4 sentences max). Do NOT use any financial numbers — you don't have their real data yet.

1. Acknowledge their concern directly and by name — make them feel heard.
2. Tell them in one sentence what Vigil will be able to show them once connected (cash timing, margin by client, overdue invoices — whatever fits their concern best).
3. End with one encouraging line that frames connecting their accounting software as the obvious next step — something like "Thousands of ${type} owners have the same concern. Let's get your actual numbers in front of you."

No fake data. No placeholders. No disclaimers. Sound like a trusted advisor who just met them, not a product demo.`,
    null
  );

  return {
    welcome: insight,
    business_id: fixtureId,
    next_step: {
      action: 'connect_accounting_software',
      url: 'https://vigilcfo.com/connect',
      message: `To see your actual numbers instead of this representative profile, connect your accounting software at https://vigilcfo.com/connect — takes about 2 minutes.`,
    },
    available_tools: [
      'get_financial_briefing — your daily financial pulse',
      'get_cash_forecast — 30/60/90-day cash projection',
      'get_margin_analysis — profitability by customer',
      'identify_value_gaps — where you\'re leaving money on the table',
      'get_ar_alerts — overdue invoices ranked by urgency',
      'ask_clara — any financial question in plain English',
      'get_vigil_score — 1–5 composite score across 8 capabilities with dollar gaps and top action',
    ],
  };
}

// ── Tool: get_vigil_score ─────────────────────────────────────────────────────

export async function getVigilScore({ business_id, owner_name }) {
  const realmId = validateBusinessId(business_id);
  const d       = await loadBusiness(realmId);
  const answers = await loadAnswers(realmId);

  const result = computeVigilScore(d, answers);

  // Persist this score snapshot
  await saveScore(realmId, result, d, answers).catch(() => {});

  const { business } = d;
  if (owner_name) business.owner = owner_name;

  const capLines = Object.entries(result.scores)
    .sort((a, b) => a[1].score - b[1].score)
    .map(([, v]) => {
      const stars = '★'.repeat(v.score) + '☆'.repeat(5 - v.score);
      const gap   = v.dollar_gap > 0 ? ` — $${Math.round(v.dollar_gap / 1000)}K gap` : '';
      return `${stars}  ${v.label}${gap}`;
    })
    .join('\n');

  const action = result.top_action;
  const actionText = action
    ? `**Top action — ${action.capability}:** ${action.action}\n${action.instruction}`
    : 'All capabilities at benchmark — no critical action right now.';

  const bs = result.top_bright_spot;
  const bsText = bs ? `**Bright spot:** ${bs.business} — ${bs.story}` : '';

  return {
    business:        business.name || realmId,
    composite:       result.composite,
    composite_label: `${result.composite} / 5.0`,
    industry:        result.industry_code,
    scores:          result.scores,
    capabilities:    capLines,
    top_action:      action,
    top_bright_spot: result.top_bright_spot,
    summary: [
      `**Vigil Score: ${result.composite} / 5.0** — ${business.owner || 'Your business'} vs ${result.industry_code} peers`,
      '',
      capLines,
      '',
      actionText,
      '',
      bsText,
    ].filter(Boolean).join('\n'),
  };
}
