/**
 * Vigil Customer Intelligence Curator
 *
 * Runs after each conversation goes idle (5-min trigger from telegram.js).
 * Reads the conversation transcript, decides which wiki pages need updating,
 * and rewrites them. Uses Haiku for speed and cost.
 *
 * Inspired by Karpathy's wiki pattern: immutable sources → LLM-curated pages
 * → query against the wiki. Knowledge compounds across sessions.
 */

import Anthropic from '@anthropic-ai/sdk';
import {
  readPage, writePage, readAllPages,
  appendConversationLog, extractActionItems,
} from './wiki.js';
import { logChatEvent } from './events.js';

let _client = null;
function getClient() {
  if (!_client) _client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  return _client;
}

// ── Curator system prompt ─────────────────────────────────────────────────────

const CURATOR_SYSTEM = `You are the Vigil Customer Intelligence Curator. You maintain a structured wiki about each business owner Vigil advises.

You receive a conversation transcript and the current content of a specific wiki page. Your job is to rewrite that page to incorporate everything new learned in the conversation.

Rules:
- Preserve existing accurate content — do not delete information unless the conversation contradicts it
- Add new information clearly — use bullet points under the relevant section
- Mark confirmed facts as "Confirmed [date]" when the conversation reaffirms something already on the page
- If the conversation reveals nothing new for this page, return the page unchanged
- Never invent information not present in the conversation
- Be concise — each fact needs one line, not a paragraph
- Return ONLY the updated markdown page content, no preamble or explanation`;

const TRIAGE_SYSTEM = `You are a routing assistant. Given a conversation transcript, output a JSON array of wiki page filenames that contain new or updated information.

Choose from: profile.md, business.md, financials.md, psychology.md, ambitions.md, relationships.md, action_tracker.md

Rules:
- conversation_log.md is ALWAYS updated — do not include it in the array (it's handled separately)
- action_tracker.md should be included if Vigil gave any "Key Action Items" OR the user mentioned completing or ignoring a previous action
- Include a page only if the conversation contains genuinely new information for it
- Return ONLY a valid JSON array of strings, e.g. ["profile.md","psychology.md"]`;

// ── Curator entry point ───────────────────────────────────────────────────────

export async function runCurator(businessId, transcript) {
  if (!transcript || transcript.length === 0) return;

  const transcriptText = formatTranscript(transcript);
  logChatEvent({ event: 'curator_start', businessId, turns: transcript.length });

  try {
    // Step 1: triage — which pages need updating?
    const pagesToUpdate = await triagePages(transcriptText);
    logChatEvent({ event: 'curator_triage', businessId, pages: pagesToUpdate });

    // Step 2: update each flagged page in parallel
    await Promise.all(pagesToUpdate.map(filename =>
      updatePage(businessId, filename, transcriptText)
    ));

    // Step 3: always append a summary to the conversation log
    const summary = await buildLogSummary(transcriptText);
    appendConversationLog(businessId, summary);

    // Step 4: extract and persist any new action items
    await syncActionItems(businessId, transcript, transcriptText);

    logChatEvent({ event: 'curator_done', businessId, pagesUpdated: pagesToUpdate.length });
  } catch (err) {
    logChatEvent({ event: 'curator_error', businessId, error: err.message });
  }
}

// ── Step 1: triage ────────────────────────────────────────────────────────────

async function triagePages(transcriptText) {
  const response = await getClient().messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 128,
    system: TRIAGE_SYSTEM,
    messages: [{ role: 'user', content: `Conversation:\n${transcriptText}` }],
  });
  const raw = response.content[0].text.trim();
  const match = raw.match(/\[[\s\S]*\]/);
  if (!match) return ['psychology.md', 'action_tracker.md']; // safe fallback
  return JSON.parse(match[0]).filter(f => f.endsWith('.md') && f !== 'conversation_log.md');
}

// ── Step 2: update individual page ───────────────────────────────────────────

async function updatePage(businessId, filename, transcriptText) {
  const current = (await readPage(businessId, filename)) || '';
  const date = new Date().toISOString().slice(0, 10);

  const response = await getClient().messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 1024,
    system: CURATOR_SYSTEM,
    messages: [{
      role: 'user',
      content: `Today's date: ${date}

Current page (${filename}):
"""
${current}
"""

Conversation transcript:
"""
${transcriptText}
"""

Rewrite the page incorporating new information from the conversation.`,
    }],
  });

  const updated = response.content[0].text.trim();
  if (updated && updated !== current.trim()) {
    await writePage(businessId, filename, updated + '\n');
  }
}

// ── Step 3: conversation log summary ─────────────────────────────────────────

async function buildLogSummary(transcriptText) {
  const response = await getClient().messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 256,
    system: `Summarise a Vigil conversation for a customer wiki log. Output 4-6 bullet points (use "-") covering: topics discussed, key numbers mentioned, emotional tone, anything the customer committed to or avoided. Be specific and factual. No preamble.`,
    messages: [{ role: 'user', content: transcriptText }],
  });
  return response.content[0].text.trim();
}

// ── Step 4: action item sync ──────────────────────────────────────────────────

async function syncActionItems(businessId, transcript, transcriptText) {
  // Extract new action items from Vigil's tool responses in this conversation
  const newActions = [];
  for (const turn of transcript) {
    if (turn.speaker === 'clara') {
      const items = extractActionItems(turn.text);
      newActions.push(...items);
    }
  }
  if (newActions.length === 0) return;

  const current = (await readPage(businessId, 'action_tracker.md')) || '';
  const date = new Date().toISOString().slice(0, 10);

  // Append new actions under "Open Actions" without duplicating
  const newLines = newActions
    .filter(a => !current.includes(a.slice(0, 40))) // rough dedup
    .map(a => `- [ ] ${a} _(added ${date})_`)
    .join('\n');

  if (!newLines) return;

  const updated = current.replace(
    '## Open Actions\n_None yet_',
    `## Open Actions\n${newLines}`
  ).replace(
    /## Open Actions\n([\s\S]*?)(?=\n## )/,
    (_, existing) => `## Open Actions\n${existing.trim()}\n${newLines}\n`
  );

  await writePage(businessId, 'action_tracker.md', updated);
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatTranscript(transcript) {
  return transcript
    .map(t => `[${t.ts.slice(11, 16)}] ${t.speaker === 'user' ? 'Owner' : 'Vigil'}: ${t.text}`)
    .join('\n');
}

// ── Snapshot curator (runs after each QBO tool call) ─────────────────────────

export async function runSnapshotCurator(businessId, toolName, rawContext) {
  if (!businessId || !rawContext) return;
  const date = new Date().toISOString().slice(0, 10);

  try {
    const current = (await readPage(businessId, 'financials.md')) || '';
    const snapshot = {
      date,
      tool: toolName,
      cash_current: rawContext.cash_current,
      cash_direction: rawContext.cash_direction,
      revenue_30d: rawContext.revenue_30d,
      gross_margin: rawContext.gross_margin_pct,
      net_margin: rawContext.net_margin_pct,
      ar_total_overdue: rawContext.ar_total_overdue,
      most_urgent_alert: rawContext.most_urgent_alert,
      // forecast and margin raw shapes
      current_cash: rawContext.current_cash,
      projections: rawContext.projections,
      overall_gross_margin_30d: rawContext.overall_gross_margin_30d,
    };

    const response = await getClient().messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 512,
      system: `You maintain the Financial History wiki page for a business owner's advisor. You receive a new live data snapshot and the current page. Your job:
1. Add a new dated observation entry under "## Snapshot History" — include cash, AR, margin, any alerts. Be specific, one line each.
2. Update the "## Observed Patterns" section if you see a clear trend across 2+ snapshots (e.g. "Cash has declined in 2 consecutive observations", "AR improving").
3. Do NOT invent information not in the snapshot.
4. Return ONLY the updated markdown. No preamble.`,
      messages: [{
        role: 'user',
        content: `Date: ${date}\n\nCurrent financials.md:\n"""\n${current || '# Financial History\n\n## Snapshot History\n_No observations yet_\n\n## Observed Patterns\n_Not enough data yet_\n'}\n"""\n\nNew QBO snapshot:\n${JSON.stringify(snapshot, null, 2)}`,
      }],
    });

    const updated = response.content[0].text.trim();
    if (updated && updated !== current.trim()) {
      await writePage(businessId, 'financials.md', updated + '\n');
      logChatEvent({ event: 'snapshot_curator_done', businessId, tool: toolName });
    }
  } catch (err) {
    logChatEvent({ event: 'snapshot_curator_error', businessId, error: err.message });
  }
}

// ── Pricing page update (runs after identify_value_gaps) ──────────────────────

export async function updatePricingPage(businessId, serviceGaps) {
  if (!businessId || !serviceGaps || serviceGaps.length === 0) return;
  const date = new Date().toISOString().slice(0, 10);

  try {
    const current = (await readPage(businessId, 'pricing.md')) || '';

    const response = await getClient().messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 512,
      system: `You maintain the Pricing History wiki page for a business owner's advisor. You receive current service rate observations from live QBO data and the existing page. Your job:
1. Update "## Service Rates (QBO observed)" with today's observed rate for each service — one line per service: "Service: $X/hr (observed DATE, benchmark $Y/hr, GAP%)"
2. Under "## Rate Changes Tracked", add an entry ONLY if today's rate differs from the most recent prior observation for the same service.
3. Under "## Benchmark Gaps", summarise which services remain below market and which have reached or exceeded benchmark.
4. Return ONLY the updated markdown. No preamble.`,
      messages: [{
        role: 'user',
        content: `Date: ${date}\n\nCurrent pricing.md:\n"""\n${current}\n"""\n\nCurrent service rate observations:\n${JSON.stringify(serviceGaps, null, 2)}`,
      }],
    });

    const updated = response.content[0].text.trim();
    if (updated && updated !== current.trim()) {
      await writePage(businessId, 'pricing.md', updated + '\n');
      logChatEvent({ event: 'pricing_page_updated', businessId, services: serviceGaps.length });
    }
  } catch (err) {
    logChatEvent({ event: 'pricing_page_error', businessId, error: err.message });
  }
}

// ── Context builder (used by telegram.js before askClara) ─────────────────────

export async function buildWikiContext(businessId) {
  const [profile, psychology, ambitions, actionTracker, financials, pricing] = await Promise.all([
    readPage(businessId, 'profile.md'),
    readPage(businessId, 'psychology.md'),
    readPage(businessId, 'ambitions.md'),
    readPage(businessId, 'action_tracker.md'),
    readPage(businessId, 'financials.md'),
    readPage(businessId, 'pricing.md'),
  ]);

  const sections = [
    ['profile.md', profile],
    ['psychology.md', psychology],
    ['ambitions.md', ambitions],
    ['action_tracker.md', actionTracker],
    ['financials.md', financials],
    ['pricing.md', pricing],
  ]
    .filter(([, v]) => v && !v.includes('_Not yet known_') && !v.includes('_No observations yet_') && !v.includes('_None yet_'))
    .map(([k, v]) => `### ${k}\n${v.trim()}`);

  if (sections.length === 0) return null;

  return `## What Vigil knows about this owner\n\n${sections.join('\n\n')}`;
}
