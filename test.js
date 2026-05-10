/**
 * Clara synthetic data test runner
 * Tests all 6 tools against all 5 fixtures and prints results.
 *
 * Usage: node test.js [business_id] [tool_name]
 *   node test.js                        # all businesses, all tools
 *   node test.js acme-plumbing           # all tools for one business
 *   node test.js peak-fitness identify_value_gaps  # one tool
 */
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, '.env') });

import {
  getFinancialBriefing,
  getCashForecast,
  getMarginAnalysis,
  identifyValueGaps,
  getArAlerts,
  askClara,
  onboardClara,
} from './src/tools.js';

const ALL_BUSINESSES = ['acme-plumbing', 'riverside-consulting', 'metro-bakery', 'peak-fitness', 'summit-hvac'];

const ALL_TOOLS = {
  onboard_clara:          (_id) => onboardClara({ owner_name: 'Tristan', business_type: 'management consulting firm', biggest_concern: 'some clients are not profitable but I am not sure which ones', annual_revenue: '$2.1M' }),
  get_financial_briefing: (id) => getFinancialBriefing({ business_id: id }),
  get_cash_forecast:      (id) => getCashForecast({ business_id: id }),
  get_margin_analysis:    (id) => getMarginAnalysis({ business_id: id }),
  identify_value_gaps:    (id) => identifyValueGaps({ business_id: id }),
  get_ar_alerts:          (id) => getArAlerts({ business_id: id }),
  ask_clara:              (id) => askClara({ business_id: id, question: "What's the single most important thing I should fix in my business right now?" }),
};

// Primary insight field for each tool (what to print in summary mode)
const INSIGHT_FIELD = {
  onboard_clara:          (r) => r.welcome,
  get_financial_briefing: (r) => r.briefing,
  get_cash_forecast:      (r) => r.forecast,
  get_margin_analysis:    (r) => r.analysis,
  identify_value_gaps:    (r) => r.analysis,
  get_ar_alerts:          (r) => r.alert || r.message,
  ask_clara:              (r) => r.answer,
};

const SEP = '─'.repeat(72);

async function runTest(businessId, toolName) {
  const fn = ALL_TOOLS[toolName];
  if (!fn) { console.error(`Unknown tool: ${toolName}`); process.exit(1); }

  console.log(`\n${SEP}`);
  console.log(`BUSINESS : ${businessId}`);
  console.log(`TOOL     : ${toolName}`);
  console.log(SEP);

  try {
    const result = await fn(businessId);
    const insight = INSIGHT_FIELD[toolName]?.(result);
    if (insight) {
      console.log('\nCLARA SAYS:\n');
      console.log(insight);
    } else {
      console.log(JSON.stringify(result, null, 2));
    }
  } catch (err) {
    console.error(`FAILED: ${err.message}`);
  }
}

const argBusiness = process.argv[2];
const argTool = process.argv[3];

const businesses = argBusiness ? [argBusiness] : ALL_BUSINESSES;
const tools = argTool ? [argTool] : Object.keys(ALL_TOOLS);

for (const biz of businesses) {
  for (const tool of tools) {
    await runTest(biz, tool);
  }
}

console.log(`\n${SEP}\nDone.\n`);
