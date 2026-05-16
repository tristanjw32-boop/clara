/**
 * Scripted one-action library — one clear instruction per capability per score level.
 * Score 1 = critical (hardest change), score 5 = maintain (no action needed).
 */

const ACTIONS = {
  pricing_strategy: {
    1: { action: 'Run a price audit this week', instruction: "List your 5 most common services. Find 2 competitor prices for each — check trade association data, local competitor websites, or just ask a peer. Mark any where you're more than 10% below market. Raise those immediately." },
    2: { action: 'Set a pricing review calendar date', instruction: 'Block 2 hours next month to review all service rates. Set the calendar invite now. Announce a 5–8% rate increase to take effect in 60 days — most customers will barely notice.' },
    3: { action: 'Test a premium tier on one service', instruction: "Pick one service and create a 'priority' version at 20% higher that includes faster turnaround or a written guarantee. Add it to 3 proposals this month and track take-up. You'll be surprised." },
    4: { action: 'Lock in an annual pricing calendar', instruction: 'Schedule a price review every January. Set a baseline minimum of 3% annual increase to track inflation. Document your current rates today so next year\'s comparison takes 15 minutes, not a day.' },
  },
  cash_cycle: {
    1: { action: 'Require deposits on all new work starting today', instruction: 'Starting now, require a 30% deposit before beginning any new project. Update your quote template to state this. Tell customers it\'s standard practice — most won\'t push back.' },
    2: { action: 'Shorten payment terms to Net 15', instruction: 'Change all new invoices to Net 15. Add "1.5% monthly late fee on unpaid balances after 15 days" to your invoice terms. Update the template in QBO today.' },
    3: { action: 'Add a 2% early-pay discount', instruction: 'Offer 2/10 Net 30 on your next 10 invoices: 2% discount if paid within 10 days. This often accelerates payment more than late fees because it feels like a reward rather than a penalty.' },
    4: { action: 'Automate same-day invoice delivery', instruction: 'Set up QBO to auto-send invoices the day work is completed. Same-day delivery vs end-of-week reduces average collection time by 8–12 days with zero extra effort.' },
  },
  concentration_risk: {
    1: { action: 'Contact 5 prospective clients this week', instruction: 'Identify 10 businesses that look like your best existing customer. Call or email 5 of them this week. Even landing one new client at $30K/year meaningfully reduces your concentration risk.' },
    2: { action: 'Pitch your top client a retainer contract', instruction: 'Approach your largest client about a monthly retainer for ongoing services — offer 5–8% below their current per-project cost. It converts volatile revenue to recurring AND frees you to pursue other clients.' },
    3: { action: 'Write down a 25% concentration ceiling rule', instruction: 'Decide no single client will exceed 25% of revenue. Once any client hits 20%, you trigger a new-business sprint. Write it down, share it with anyone involved in sales, and hold to it.' },
    4: { action: 'Run a referral campaign to your top 5 clients', instruction: 'Email your top 5 clients asking for one referral each. Offer a $200 service credit for any referral that converts to a paying customer. This is almost always your cheapest lead source.' },
  },
  gross_margin: {
    1: { action: 'Kill your lowest-margin service line this month', instruction: 'Pull QBO P&L by service line or class. Find the single line with the lowest gross margin. Either reprice it to your target or stop selling it. One cut here can swing your overall margin by several points.' },
    2: { action: 'Negotiate one supplier or subcontractor cost down', instruction: 'Identify your highest-revenue service. Find one supplier, sub, or input where you could reduce cost 5–10% through volume negotiation or getting a second quote. Even a single win compounds annually.' },
    3: { action: 'Reprice loss leaders to cover their full cost', instruction: 'Find any service where you\'re making less than half your average margin. Calculate the break-even price. Then either raise to that price or let that customer know rates are changing.' },
    4: { action: 'Implement a margin floor on new quotes', instruction: 'Set a minimum gross margin threshold for any new quote — e.g. 40%. If a job can\'t hit it, either price it up or decline the work. Track it in QBO by service class to hold the line.' },
  },
  labor_efficiency: {
    1: { action: 'Track billable hours for one week', instruction: 'Have every employee (or yourself) log their time for 5 working days. Calculate billable hours as a % of total hours. If it\'s below 70%, that\'s the gap. Identify the top 3 time drains and eliminate one of them.' },
    2: { action: 'Add one billable output per person per day', instruction: 'Find the single process that limits daily job count — scheduling, travel, setup, admin. Fix just that one thing. One extra job per tech per day at average ticket value can add $100K+ in revenue with no new hires.' },
    3: { action: 'Review output per employee for last 90 days', instruction: 'Calculate revenue generated per employee for the last quarter. Find the biggest outlier on the low end. Have a direct conversation about output expectations and what\'s getting in the way.' },
    4: { action: 'Define the output benchmark for your next hire', instruction: 'Your next hire should multiply the output of your highest-revenue employees, not replace them. Write a job description that proves that before you post it. If you can\'t write it, the role isn\'t ready.' },
  },
  revenue_mix: {
    1: { action: 'Design one recurring revenue product this month', instruction: "Pick your most common one-time service. Build a subscription version: monthly visits, annual contract, retainer. Price it at 85% of what the one-time equivalent would cost over a year. Pitch it to your next 10 customers." },
    2: { action: 'Offer maintenance contracts to your top 20 customers', instruction: "Email your top 20 customers from the last 12 months. Offer an annual maintenance contract at 10% less than they'd pay visit-by-visit. You're looking to convert 3–5 of them — that's a meaningful revenue floor." },
    3: { action: "Add a 'priority client' retainer to your pricing", instruction: "Create a retainer tier priced at your average monthly billing. Pitch it as reserved capacity + a 5% discount. Even 3 retainer clients smooths your revenue volatility significantly." },
    4: { action: 'Compare margin on recurring vs one-time work', instruction: "Calculate gross margin on contracts vs project work separately. If recurring is lower-margin (it usually isn't), reprice at renewal. If it's higher-margin (most common), invest in converting more one-time buyers." },
  },
  collection_discipline: {
    1: { action: 'Turn on automated reminders in QBO today', instruction: 'Go to QBO → Settings → Reminders. Enable automatic invoice reminders at Day 3, Day 7, and Day 14 after due date. This single change typically reduces overdue AR by 30–40% within 60 days.' },
    2: { action: 'Call (not email) your top 3 overdue accounts this week', instruction: 'Pull invoices overdue 30+ days. Phone the top 3 by dollar amount. A 5-minute call has a 70% higher payment response than an email. Offer a payment plan if needed — partial payment is better than none.' },
    3: { action: 'Add a late fee to your standard invoice terms', instruction: 'Add "1.5% monthly late fee on invoices unpaid after 30 days" to your QBO invoice template. You\'ll rarely charge it — but stating it upfront signals you\'re tracking and it changes how quickly customers prioritize payment.' },
    4: { action: 'Set a 90-day escalation policy', instruction: 'Any invoice over 90 days with no payment plan gets a final demand letter, then small claims or a collections referral. Communicate this policy upfront in your terms. It prevents the 180-day stall almost entirely.' },
  },
  cost_structure: {
    1: { action: 'Freeze all non-essential spending for 60 days', instruction: "List every recurring expense over $100/month. Cut anything that doesn't directly generate or protect revenue. Run lean for 60 days while you fix the top-line. Don't add headcount." },
    2: { action: 'Find the 2 fastest-growing cost categories and cap them', instruction: "Pull QBO expenses by category for the last 12 months. Find the 2 categories with the highest year-over-year growth %. Set a budget ceiling for each and assign someone to own it." },
    3: { action: 'Tie your next hire to a revenue milestone', instruction: "Don't add headcount until you've pre-sold the work. Set a revenue trigger for your next hire — write it down: 'We hire when monthly revenue exceeds $X for 3 consecutive months.' Then hold to it." },
    4: { action: 'Build a monthly P&L review habit', instruction: "Review your P&L on the 5th of every month. Track 3 numbers: gross margin %, operating expenses as % of revenue, and net margin %. Trend direction matters more than absolute values. One hour a month protects everything." },
  },
};

export function getAction(capabilityId, score) {
  const cap = ACTIONS[capabilityId];
  if (!cap) return null;
  const level = Math.max(1, Math.min(4, Math.round(score)));
  return cap[level] || null;
}
