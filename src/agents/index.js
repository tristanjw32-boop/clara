import { runArCollector } from './arCollector.js';
import { runPriceAnalyst } from './priceAnalyst.js';
import { runCashOptimizer } from './cashOptimizer.js';
import { query } from '../db.js';

// Governance rules — what Clara's agents may and may not do in Phase A
export const GOVERNANCE = {
  allowed_action_types: ['ar_followup', 'rate_increase', 'vendor_terms'],
  max_drafts_per_run: 5,
  auto_send: false,       // never — owner must always manually copy and send
  must_cite_data: true,   // every draft logged with the source data that drove it
  no_fabrication: true,   // all amounts/names/dates must come from live business data
};

export async function runAgents(d, ownerName, chatId) {
  const [arResults, priceResults, cashResults] = await Promise.allSettled([
    runArCollector(d, ownerName),
    runPriceAnalyst(d, ownerName),
    runCashOptimizer(d, ownerName),
  ]);

  const drafts = [
    ...(arResults.status === 'fulfilled' ? arResults.value : []),
    ...(priceResults.status === 'fulfilled' ? priceResults.value : []),
    ...(cashResults.status === 'fulfilled' ? cashResults.value : []),
  ].slice(0, GOVERNANCE.max_drafts_per_run);

  // Audit trail — log every draft regardless of whether owner uses it
  for (const draft of drafts) {
    query(
      `INSERT INTO agent_actions (chat_id, business_id, action_type, agent, context, draft_text)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [chatId || null, d.business.id || d.business.name, draft.type, draft.agent,
       JSON.stringify(draft.context), draft.body]
    ).catch(err => console.error('agent_audit_log_error:', err.message));
  }

  return drafts;
}
