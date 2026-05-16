/**
 * Industry benchmarks for the 8 Vigil capabilities.
 * All percentages are absolute (not fractions).
 */

export const INDUSTRY_CODES = {
  hvac:          'Trades (HVAC, plumbing, electrical)',
  landscaping:   'Field services (landscaping, pest control, cleaning)',
  pro_services:  'Professional services (consulting, accounting, legal)',
  healthcare:    'Healthcare or wellness',
  construction:  'Construction or contracting',
  other:         'Other',
};

const BENCHMARKS = {
  hvac: {
    gross_margin_pct:      42,
    net_margin_pct:        12,
    avg_collection_days:   20,
    top_customer_pct_max:  20,
    recurring_revenue_pct: 30,
    revenue_per_employee:  140000,
  },
  landscaping: {
    gross_margin_pct:      48,
    net_margin_pct:        14,
    avg_collection_days:   18,
    top_customer_pct_max:  25,
    recurring_revenue_pct: 50,
    revenue_per_employee:  85000,
  },
  pro_services: {
    gross_margin_pct:      65,
    net_margin_pct:        22,
    avg_collection_days:   28,
    top_customer_pct_max:  20,
    recurring_revenue_pct: 45,
    revenue_per_employee:  200000,
  },
  healthcare: {
    gross_margin_pct:      55,
    net_margin_pct:        18,
    avg_collection_days:   35,
    top_customer_pct_max:  15,
    recurring_revenue_pct: 60,
    revenue_per_employee:  180000,
  },
  construction: {
    gross_margin_pct:      35,
    net_margin_pct:        8,
    avg_collection_days:   35,
    top_customer_pct_max:  35,
    recurring_revenue_pct: 15,
    revenue_per_employee:  170000,
  },
  other: {
    gross_margin_pct:      40,
    net_margin_pct:        12,
    avg_collection_days:   25,
    top_customer_pct_max:  25,
    recurring_revenue_pct: 30,
    revenue_per_employee:  130000,
  },
};

export function getBenchmarks(industryCode) {
  return BENCHMARKS[industryCode] || BENCHMARKS.other;
}
