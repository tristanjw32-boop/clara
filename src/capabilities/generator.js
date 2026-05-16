/**
 * Generates a business-type-specific capability framework once, stores in DB.
 * Every subsequent business of the same type reuses the same framework.
 */

import Anthropic from '@anthropic-ai/sdk';
import { query } from '../db.js';
import { logChatEvent } from '../events.js';

let _client = null;
function getClient() {
  if (!_client) _client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  return _client;
}

export async function getOrGenerateFramework(businessType) {
  if (!businessType) return null;

  const normalised = businessType.toLowerCase().trim();

  // Check DB cache first
  const existing = await query(
    'SELECT framework FROM capability_frameworks WHERE business_type = $1',
    [normalised]
  );
  if (existing.rows.length > 0) return existing.rows[0].framework;

  // Generate fresh
  logChatEvent({ event: 'framework_generate_start', businessType: normalised });
  const framework = await generateFramework(normalised);

  await query(
    'INSERT INTO capability_frameworks (business_type, framework) VALUES ($1, $2) ON CONFLICT (business_type) DO UPDATE SET framework = $2',
    [normalised, JSON.stringify(framework)]
  );

  logChatEvent({ event: 'framework_generate_done', businessType: normalised, capabilities: framework.capabilities?.length });
  return framework;
}

async function generateFramework(businessType) {
  const response = await getClient().messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 4096,
    system: `You are a business operations expert. Return only valid JSON — no prose, no markdown fences. Keep all string values concise (under 20 words each).`,
    messages: [{
      role: 'user',
      content: `Generate a capability framework for a "${businessType}" business. Pick exactly 6 capabilities that are the biggest operational levers. Order by impact (highest first).

Return this exact JSON shape (keep all strings under 20 words):
{
  "business_type": "${businessType}",
  "capabilities": [
    {
      "id": "snake_case",
      "name": "Short Name",
      "domain": "financial_health|operations|customer|workforce|procurement|admin",
      "impact_weight": 0.10,
      "data_scoreable": false,
      "rubric": {
        "1": "brief level 1 description",
        "2": "brief level 2 description",
        "3": "brief level 3 description",
        "4": "brief level 4 description",
        "5": "brief level 5 description"
      },
      "probe_question": "conversational question for owner",
      "ai_use_case": "specific AI application and impact"
    }
  ]
}

Impact weights must sum to 1.0. data_scoreable=true only for AR days, cash flow, pricing, margins.`,
    }],
  });

  const text = response.content[0].text.trim();

  // Extract JSON robustly
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) throw new Error('Framework generator returned no JSON');

  const parsed = JSON.parse(match[0]);
  if (!parsed.capabilities || !Array.isArray(parsed.capabilities)) {
    throw new Error('Framework missing capabilities array');
  }

  return parsed;
}
