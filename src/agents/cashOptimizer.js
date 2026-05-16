import { claraAnalyze } from '../analysis.js';

export async function runCashOptimizer(d, ownerName) {
  const { business, cash } = d;
  const owner = ownerName || business.owner;

  // Only fires when there's real cash pressure: urgent bills that exceed 25% of cash balance
  const NON_NEGOTIABLE = /payroll|salary|salaries|wages|tax|irs|hmrc|insurance|loan|mortgage/i;

  const urgentBills = (cash.upcoming_payables || [])
    .map(p => ({
      ...p,
      days_until_due: p.days_until_due ?? p.due_in_days ?? 999,
      vendor: p.vendor ?? p.description ?? 'vendor',
    }))
    .filter(p => p.days_until_due <= 14 && p.amount > 500 && !NON_NEGOTIABLE.test(p.vendor))
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 1);

  if (urgentBills.length === 0) return [];

  const totalUrgent = urgentBills.reduce((s, p) => s + p.amount, 0);
  if (totalUrgent < cash.current_balance * 0.25) return []; // no meaningful pressure

  const bill = urgentBills[0];

  const body = await claraAnalyze(
    `Draft a polite payment timing request from ${owner} at ${business.name} to their vendor ${bill.vendor}. They have a $${bill.amount.toFixed(2)} bill due in ${bill.days_until_due} days and need to request a 14–21 day extension. Write ONLY the email body — open with a greeting to ${bill.vendor}. Under 100 words. Professional, brief, direct — no over-explaining or excessive apology. A simple "we're managing cash flow timing this month" framing is fine. Sign off as ${owner}. Output only the email text — no subject line, no commentary.`,
    null
  );

  return [{
    type: 'vendor_terms',
    agent: 'cash_optimizer',
    title: `Payment extension: ${bill.vendor} — $${bill.amount.toFixed(2)} due in ${bill.days_until_due}d`,
    subject: `Payment timing — ${business.name}`,
    recipient: bill.vendor,
    body: body.trim(),
    context: {
      vendor: bill.vendor,
      amount: bill.amount,
      days_until_due: bill.days_until_due,
      cash_balance: cash.current_balance,
    },
  }];
}
