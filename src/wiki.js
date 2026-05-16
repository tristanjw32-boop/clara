/**
 * Clara Customer Wiki — Postgres-backed storage.
 * One row per user in customer_wikis, pages stored as JSONB.
 * Replaces the previous file-based implementation.
 */

import { query } from './db.js';

// ── Page templates ────────────────────────────────────────────────────────────

export const TEMPLATES = {
  'profile.md': `# Profile\n\n## Identity\n_Not yet known_\n\n## Communication Style\n_Not yet known_\n\n## Background\n_Not yet known_\n`,
  'business.md': `# Business\n\n## Type & Stage\n_Not yet known_\n\n## Size & Geography\n_Not yet known_\n\n## Products & Services\n_Not yet known_\n\n## Key Metrics\n_Not yet known_\n`,
  'financials.md': `# Financial Fingerprint\n\n## Revenue & Cash Position\n_Not yet known_\n\n## Patterns & Seasonality\n_Not yet known_\n\n## KPIs They Care About\n_Not yet known_\n\n## Known Data Gaps\n_Not yet known_\n`,
  'psychology.md': `# Psychology\n\n## Stated Anxieties\n_Not yet known_\n\n## Recurring Worries\n_Not yet known_\n\n## Avoidance Patterns\n_Not yet known_\n\n## Risk Tolerance\n_Not yet known_\n\n## Emotional Tone\n_Not yet known_\n`,
  'ambitions.md': `# Ambitions & Aspirations\n\n## Short-term Goals\n_Not yet known_\n\n## Long-term Vision\n_Not yet known_\n\n## Exit Plan\n_Not yet known_\n\n## Lifestyle vs Growth\n_Not yet known_\n`,
  'relationships.md': `# Relationships\n\n## Key Clients\n_Not yet known_\n\n## Key Suppliers\n_Not yet known_\n\n## Key Staff\n_Not yet known_\n\n## Advisors\n_Not yet known_\n`,
  'action_tracker.md': `# Action Tracker\n\n## Open Actions\n_None yet_\n\n## Completed Actions\n_None yet_\n\n## Ignored / Not Followed Through\n_None yet_\n`,
  'pricing.md': `# Pricing History\n\n## Service Rates (QBO observed)\n_No observations yet_\n\n## Rate Changes Tracked\n_None yet_\n\n## Benchmark Gaps\n_Not yet assessed_\n`,
  'conversation_log.md': `# Conversation Log\n\n_Append-only. Newest entry first._\n\n`,
};

// ── Core I/O — keyed by business_id so all channels share one wiki ────────────

async function getWikiRow(businessId) {
  const { rows } = await query(
    'SELECT pages FROM business_wikis WHERE business_id = $1',
    [String(businessId)]
  );
  return rows[0]?.pages || null;
}

async function ensureWikiRow(businessId) {
  const existing = await getWikiRow(businessId);
  if (existing) return existing;
  const pages = Object.fromEntries(
    Object.entries(TEMPLATES).map(([k, v]) => [k, v])
  );
  await query(
    `INSERT INTO business_wikis (business_id, pages) VALUES ($1, $2)
     ON CONFLICT (business_id) DO NOTHING`,
    [String(businessId), JSON.stringify(pages)]
  );
  return pages;
}

export async function readPage(businessId, filename) {
  const pages = await getWikiRow(businessId);
  return pages?.[filename] || null;
}

export async function writePage(businessId, filename, content) {
  await query(
    `INSERT INTO business_wikis (business_id, pages, updated_at)
     VALUES ($1, jsonb_build_object($2::text, $3::text), NOW())
     ON CONFLICT (business_id) DO UPDATE SET
       pages      = business_wikis.pages || jsonb_build_object($2::text, $3::text),
       updated_at = NOW()`,
    [String(businessId), filename, content]
  );
}

export async function readAllPages(businessId) {
  return (await getWikiRow(businessId)) || {};
}

export async function appendConversationLog(businessId, summary) {
  const current = (await readPage(businessId, 'conversation_log.md')) || TEMPLATES['conversation_log.md'];
  const date = new Date().toISOString().slice(0, 16).replace('T', ' ');
  const entry = `\n---\n\n### ${date}\n\n${summary}\n`;
  const headerEnd = current.indexOf('_Append-only') + current.slice(current.indexOf('_Append-only')).indexOf('\n\n') + 2;
  const updated = current.slice(0, headerEnd) + entry + current.slice(headerEnd);
  await writePage(businessId, 'conversation_log.md', updated);
}

export async function seedWiki(businessId, { ownerName, businessType, concern }) {
  await ensureWikiRow(businessId);
  await writePage(businessId, 'profile.md', `# Profile\n\n## Identity\nName: ${ownerName}\n\n## Communication Style\n_Not yet known — observe over coming conversations_\n\n## Background\n_Not yet known_\n`);
  await writePage(businessId, 'business.md', `# Business\n\n## Type & Stage\n${businessType}\n\n## Size & Geography\n_Not yet known_\n\n## Products & Services\n_Not yet known_\n\n## Key Metrics\nLinked business profile: ${businessId}\n`);
  await writePage(businessId, 'psychology.md', `# Psychology\n\n## Stated Anxieties\n- ${concern}\n\n## Recurring Worries\n_Watch for patterns across conversations_\n\n## Avoidance Patterns\n_Not yet known_\n\n## Risk Tolerance\n_Not yet known_\n\n## Emotional Tone\n_Not yet known_\n`);
}

export async function deleteWiki(businessId) {
  await query('DELETE FROM business_wikis WHERE business_id = $1', [String(businessId)]);
}

// ── Helpers used by curator ───────────────────────────────────────────────────

export async function readContextPages(businessId) {
  const pages = await getWikiRow(businessId);
  if (!pages) return {};
  const keys = ['profile.md', 'psychology.md', 'ambitions.md', 'action_tracker.md'];
  return Object.fromEntries(keys.filter(k => pages[k]).map(k => [k, pages[k]]));
}

export function extractActionItems(responseText) {
  const match = responseText.match(/Key Action Items[\s\S]*?(?=\n\n\n|\n---|\n#|$)/i);
  if (!match) return [];
  return match[0]
    .split('\n')
    .filter(l => /^\d+\./.test(l.trim()))
    .map(l => l.replace(/^\d+\.\s*/, '').trim());
}

// ── File-based wiki migration ─────────────────────────────────────────────────
// Run once to migrate any wikis written before the Postgres migration.

import { existsSync, readdirSync, readFileSync, rmSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const WIKI_ROOT = join(__dirname, '..', 'wikis');

export async function migrateFileWikis() {
  if (!existsSync(WIKI_ROOT)) return;
  const chatIds = readdirSync(WIKI_ROOT, { withFileTypes: true })
    .filter(d => d.isDirectory())
    .map(d => d.name);

  if (chatIds.length === 0) return;

  for (const chatId of chatIds) {
    const dir = join(WIKI_ROOT, chatId);
    const pages = {};
    for (const f of readdirSync(dir)) {
      if (f.endsWith('.md')) {
        pages[f] = readFileSync(join(dir, f), 'utf8');
      }
    }
    await query(
      `INSERT INTO customer_wikis (chat_id, pages) VALUES ($1, $2)
       ON CONFLICT (chat_id) DO UPDATE SET pages = EXCLUDED.pages, updated_at = NOW()`,
      [chatId, JSON.stringify(pages)]
    );
    rmSync(dir, { recursive: true });
    console.log(`Migrated wiki for chatId ${chatId}`);
  }
  console.log(`Wiki migration complete: ${chatIds.length} users`);
}
