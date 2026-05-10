/**
 * Clara Customer Intelligence Curator
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

const CURATOR_SYSTEM = `You are the Clara Customer Intelligence Curator. You maintain a structured wiki about each business owner Clara advises.

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
- action_tracker.md should be included if Clara gave any "Key Action Items" OR the user mentioned completing or ignoring a previous action
- Include a page only if the conversation contains genuinely new information for it
- Return ONLY a valid JSON array of strings, e.g. ["profile.md","psychology.md"]`;

// ── Curator entry point ───────────────────────────────────────────────────────

export async function runCurator(chatId, transcript) {
  if (!transcript || transcript.length === 0) return;

  const transcriptText = formatTranscript(transcript);
  logChatEvent({ event: 'curator_start', chatId, turns: transcript.length });

  try {
    // Step 1: triage — which pages need updating?
    const pagesToUpdate = await triagePages(transcriptText);
    logChatEvent({ event: 'curator_triage', chatId, pages: pagesToUpdate });

    // Step 2: update each flagged page in parallel
    await Promise.all(pagesToUpdate.map(filename =>
      updatePage(chatId, filename, transcriptText)
    ));

    // Step 3: always append a summary to the conversation log
    const summary = await buildLogSummary(transcriptText);
    appendConversationLog(chatId, summary);

    // Step 4: extract and persist any new action items
    await syncActionItems(chatId, transcript, transcriptText);

    logChatEvent({ event: 'curator_done', chatId, pagesUpdated: pagesToUpdate.length });
  } catch (err) {
    logChatEvent({ event: 'curator_error', chatId, error: err.message });
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

async function updatePage(chatId, filename, transcriptText) {
  const current = readPage(chatId, filename) || '';
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
    writePage(chatId, filename, updated + '\n');
  }
}

// ── Step 3: conversation log summary ─────────────────────────────────────────

async function buildLogSummary(transcriptText) {
  const response = await getClient().messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 256,
    system: `Summarise a Clara conversation for a customer wiki log. Output 4-6 bullet points (use "-") covering: topics discussed, key numbers mentioned, emotional tone, anything the customer committed to or avoided. Be specific and factual. No preamble.`,
    messages: [{ role: 'user', content: transcriptText }],
  });
  return response.content[0].text.trim();
}

// ── Step 4: action item sync ──────────────────────────────────────────────────

async function syncActionItems(chatId, transcript, transcriptText) {
  // Extract new action items from Clara's tool responses in this conversation
  const newActions = [];
  for (const turn of transcript) {
    if (turn.speaker === 'clara') {
      const items = extractActionItems(turn.text);
      newActions.push(...items);
    }
  }
  if (newActions.length === 0) return;

  const current = readPage(chatId, 'action_tracker.md') || '';
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

  writePage(chatId, 'action_tracker.md', updated);
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatTranscript(transcript) {
  return transcript
    .map(t => `[${t.ts.slice(11, 16)}] ${t.speaker === 'user' ? 'Owner' : 'Clara'}: ${t.text}`)
    .join('\n');
}

// ── Context builder (used by telegram.js before askClara) ─────────────────────

export async function buildWikiContext(chatId) {
  const [profile, psychology, ambitions, actionTracker] = await Promise.all([
    readPage(chatId, 'profile.md'),
    readPage(chatId, 'psychology.md'),
    readPage(chatId, 'ambitions.md'),
    readPage(chatId, 'action_tracker.md'),
  ]);

  const sections = [
    ['profile.md', profile],
    ['psychology.md', psychology],
    ['ambitions.md', ambitions],
    ['action_tracker.md', actionTracker],
  ]
    .filter(([, v]) => v && !v.includes('_Not yet known_'))
    .map(([k, v]) => `### ${k}\n${v.trim()}`);

  if (sections.length === 0) return null;

  return `## What Clara knows about this owner\n\n${sections.join('\n\n')}`;
}
