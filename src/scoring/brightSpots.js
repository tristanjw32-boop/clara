/**
 * Bright spot peer stories — one per Vigil capability.
 * These are the Switch framework "Elephant" move: emotional proof
 * that the gap is closeable, from a business just like theirs.
 */

const BRIGHT_SPOTS = {
  pricing_strategy: {
    business: 'A 3-person electrical contractor in Ohio',
    story: "Hadn't raised rates in 3 years. Vigil flagged a $41K annual gap vs local peers. They raised prices 12% across the board and lost exactly one customer. Revenue was up $38K by Q2.",
  },
  cash_cycle: {
    business: 'A 6-person landscaping company in Texas',
    story: 'Was running Net 45 with no late fees. Vigil showed a 68-day average collection time was creating a $22K float gap each quarter. They switched to Net 15 with a 1.5% late fee. Collection time dropped to 24 days within 90 days.',
  },
  concentration_risk: {
    business: 'A 4-person marketing consultancy',
    story: 'Had one client at 58% of revenue — a single-point-of-failure. Vigil identified it. They ran a 90-day pipeline sprint, signed 3 new retainer clients, and had top concentration below 30% within 6 months.',
  },
  gross_margin: {
    business: 'A dental practice in Colorado',
    story: 'Gross margin was 47% vs 55% peer median. The gap came from one high-volume, low-fee procedure category. Vigil identified it. They adjusted the service mix and hit 54% gross margin within a year.',
  },
  labor_efficiency: {
    business: 'An HVAC contractor with 11 technicians',
    story: 'Revenue per employee was $112K vs $140K benchmark. The difference was route efficiency — techs were averaging 4 jobs/day vs 6 for comparable firms. New routing software added $180K annual revenue with zero new hires.',
  },
  revenue_mix: {
    business: 'A pest control company with 8 staff',
    story: 'Was 90% one-time jobs, no contracts. Vigil surfaced the revenue volatility risk. They introduced an annual maintenance agreement. 60% of existing customers converted. Revenue variance dropped 40%.',
  },
  collection_discipline: {
    business: 'A plumbing contractor in Michigan',
    story: 'Average AR days was 54. They set up automated QBO reminders at Day 7, 14, and 21. Days outstanding dropped to 19 within 60 days. They also recovered $31K of aged receivables they\'d written off mentally.',
  },
  cost_structure: {
    business: 'A marketing agency with 12 staff',
    story: 'Revenue grew 18% but net margin fell from 21% to 14%. Costs were outpacing growth. Vigil flagged the compression early. They instituted a hiring freeze and focused on higher-margin work. Net margin was back to 20% within 8 months.',
  },
};

export function getBrightSpot(capabilityId) {
  return BRIGHT_SPOTS[capabilityId] || null;
}
