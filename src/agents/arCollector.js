import { claraAnalyze } from '../analysis.js';

export async function runArCollector(d, ownerName) {
  const { business, ar } = d;
  const owner = ownerName || business.owner;

  const overdue = (ar.invoices || [])
    .map(inv => ({ ...inv, days_overdue: inv.days_overdue ?? inv.days_outstanding ?? 0 }))
    .filter(inv => inv.days_overdue > 14) // only chase invoices more than 2 weeks out
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 3);

  if (overdue.length === 0) return [];

  const drafts = [];
  for (const inv of overdue) {
    const body = await claraAnalyze(
      `Draft a polite but direct payment follow-up email from ${owner} at ${business.name} to ${inv.customer} for an invoice of $${inv.amount.toFixed(2)} that is ${inv.days_overdue} days overdue. Write ONLY the email body — start with the customer's first name or "Hi ${inv.customer}". Under 100 words. Friendly but firm. Mention the specific amount, offer to answer questions about the invoice, and give them an easy out ("let me know if anything needs clarifying"). Sign off as ${owner}. Output only the email text — no subject line, no commentary.`,
      null
    );
    drafts.push({
      type: 'ar_followup',
      agent: 'ar_collector',
      title: `Follow-up: ${inv.customer} — $${inv.amount.toFixed(2)} (${inv.days_overdue}d overdue)`,
      subject: `Following up — ${business.name}`,
      recipient: inv.customer,
      body: body.trim(),
      context: {
        customer: inv.customer,
        amount: inv.amount,
        days_overdue: inv.days_overdue,
      },
    });
  }
  return drafts;
}
