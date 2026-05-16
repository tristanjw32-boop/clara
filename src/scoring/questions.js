/**
 * Owner-answered questions for Vigil Score computation.
 * Covers data QBO cannot provide: industry type, headcount,
 * pricing recency, recurring revenue mix, collections process, payment terms.
 */

export const QUESTIONS = [
  {
    id: 'industry_type',
    text: 'What type of business do you run?',
    options: [
      { key: 'hvac',         label: 'Trades (HVAC, plumbing, electrical)' },
      { key: 'landscaping',  label: 'Field services (landscaping, pest control, cleaning)' },
      { key: 'pro_services', label: 'Professional services (consulting, accounting, legal)' },
      { key: 'healthcare',   label: 'Healthcare or wellness' },
      { key: 'construction', label: 'Construction or contracting' },
      { key: 'other',        label: 'Something else' },
    ],
  },
  {
    id: 'employee_count',
    text: 'How many people work in your business (including yourself)?',
    options: [
      { key: '1',  label: 'Just me (1)' },
      { key: '3',  label: '2–4 people' },
      { key: '8',  label: '5–10 people' },
      { key: '18', label: '11–25 people' },
      { key: '40', label: '26–50 people' },
      { key: '75', label: 'More than 50' },
    ],
  },
  {
    id: 'pricing_recency',
    text: 'When did you last review and update your prices?',
    options: [
      { key: '<6mo',   label: 'Within the last 6 months' },
      { key: '6-12mo', label: '6–12 months ago' },
      { key: '1-2yr',  label: '1–2 years ago' },
      { key: '2+yr',   label: 'More than 2 years ago' },
    ],
  },
  {
    id: 'recurring_revenue_pct',
    text: 'What percentage of your revenue is recurring (contracts, retainers, subscriptions)?',
    options: [
      { key: '>75',   label: 'More than 75% recurring' },
      { key: '50-75', label: '50–75% recurring' },
      { key: '25-50', label: '25–50% recurring' },
      { key: '<25',   label: 'Less than 25% recurring' },
    ],
  },
  {
    id: 'collections_process',
    text: 'How do you handle overdue invoices?',
    options: [
      { key: 'auto',   label: 'Automated reminders (software handles it)' },
      { key: 'manual', label: 'I follow up manually when I notice one is late' },
      { key: 'wait',   label: 'I wait — most eventually pay' },
      { key: 'agency', label: "I've had to use a collections agency" },
    ],
  },
  {
    id: 'payment_terms',
    text: 'What payment terms do you typically offer?',
    options: [
      { key: 'net7',  label: 'Due on receipt or Net 7' },
      { key: 'net30', label: 'Net 15–30 (standard)' },
      { key: 'net60', label: 'Net 45–60 (extended)' },
      { key: 'none',  label: 'No formal terms — customers pay when they pay' },
    ],
  },
];

export function getQuestion(id) {
  return QUESTIONS.find(q => q.id === id);
}

export function getNextQuestion(answeredIds) {
  return QUESTIONS.find(q => !answeredIds.includes(q.id));
}

export function allQuestionsAnswered(answeredIds) {
  return QUESTIONS.every(q => answeredIds.includes(q.id));
}

// Returns the option key for a given letter (A=0, B=1...) or null if invalid
export function letterToKey(question, letter) {
  const idx = letter.toUpperCase().charCodeAt(0) - 65;
  if (idx < 0 || idx >= question.options.length) return null;
  return question.options[idx].key;
}

// Formats a question for Telegram (letter-choice format)
export function formatQuestion(question) {
  const letters = 'ABCDEF';
  const opts = question.options.map((o, i) => `${letters[i]} — ${o.label}`).join('\n');
  return `${question.text}\n\n${opts}\n\nReply with a letter (${letters.slice(0, question.options.length).split('').join('–')})`;
}
