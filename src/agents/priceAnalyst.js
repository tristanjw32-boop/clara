import { claraAnalyze } from '../analysis.js';

export async function runPriceAnalyst(d, ownerName) {
  const { business } = d;
  const owner = ownerName || business.owner;

  const underpriced = (d.service_rates || [])
    .filter(s => s.benchmark_rate && s.gap_pct > 10)
    .sort((a, b) => b.gap_pct - a.gap_pct)
    .slice(0, 1);

  if (underpriced.length === 0) return [];

  const s = underpriced[0];
  const annualJobs = Math.round(s.job_count * (365 / 90));
  const avgHrs = s.total_qty > 0 ? s.total_revenue / s.avg_rate / s.job_count : 1;
  const annualGap = Math.round(annualJobs * avgHrs * (s.benchmark_rate - s.avg_rate));

  const body = await claraAnalyze(
    `Draft a brief, professional rate adjustment notice from ${owner} at ${business.name} to their clients. They are raising the rate for "${s.service}" from $${s.avg_rate}/hr to $${s.benchmark_rate}/hr to align with market rates. Write ONLY the email body — open with "[Client Name]". Under 120 words. Acknowledge the relationship, frame this as reflecting the true market value of the service, give 30 days notice before the new rate takes effect. Don't over-apologise. Sign off as ${owner}. Output only the email text — no subject line, no commentary.`,
    null
  );

  return [{
    type: 'rate_increase',
    agent: 'price_analyst',
    title: `Rate adjustment: ${s.service} $${s.avg_rate} → $${s.benchmark_rate}/hr (+$${annualGap.toLocaleString()}/yr)`,
    subject: `A note on our service rates — ${business.name}`,
    recipient: 'All active clients',
    body: body.trim(),
    context: {
      service: s.service,
      current_rate: s.avg_rate,
      benchmark_rate: s.benchmark_rate,
      gap_pct: s.gap_pct,
      estimated_annual_gain: annualGap,
    },
  }];
}
