/**
 * Per-user MCP API key management.
 * Keys are prefixed clr_ and stored as SHA-256 hashes — the raw key is shown once at creation.
 */

import { createHash, randomBytes } from 'crypto';
import { query } from './db.js';

export function generateRawKey() {
  return 'clr_' + randomBytes(24).toString('hex');
}

function hashKey(raw) {
  return createHash('sha256').update(raw).digest('hex');
}

export async function createKey({ ownerLabel, chatId = null, realmId = null }) {
  const raw  = generateRawKey();
  const hash = hashKey(raw);
  const prefix = raw.slice(0, 12); // "clr_" + first 8 hex chars — enough to identify

  await query(
    `INSERT INTO mcp_api_keys (key_hash, key_prefix, owner_label, chat_id, realm_id)
     VALUES ($1, $2, $3, $4, $5)`,
    [hash, prefix, ownerLabel, chatId || null, realmId || null]
  );

  return { raw, prefix }; // raw shown once, never stored
}

export async function validateKey(raw) {
  if (!raw || !raw.startsWith('clr_')) return null;
  const hash = hashKey(raw);

  const { rows } = await query(
    `UPDATE mcp_api_keys
     SET last_used_at = NOW()
     WHERE key_hash = $1 AND revoked_at IS NULL
     RETURNING id, owner_label, chat_id, realm_id`,
    [hash]
  );

  return rows[0] || null;
}

export async function getKeysForChat(chatId) {
  const { rows } = await query(
    `SELECT key_prefix, owner_label, created_at, last_used_at, revoked_at
     FROM mcp_api_keys WHERE chat_id = $1 ORDER BY created_at DESC`,
    [chatId]
  );
  return rows;
}

export async function revokeKeysForChat(chatId) {
  await query(
    `UPDATE mcp_api_keys SET revoked_at = NOW() WHERE chat_id = $1 AND revoked_at IS NULL`,
    [chatId]
  );
}

// ── Key pickup (for MCP callers with no Telegram) ────────────────────────────

export async function createPickupToken() {
  const token = randomBytes(24).toString('hex');
  await query(`INSERT INTO key_pickups (token) VALUES ($1)`, [token]);
  return token;
}

export async function storePickupKey(token, rawKey, realmId) {
  await query(
    `UPDATE key_pickups SET raw_key = $1, realm_id = $2
     WHERE token = $3 AND claimed_at IS NULL`,
    [rawKey, realmId, token]
  );
}

// Returns { raw_key, realm_id } once then nulls the raw_key. Returns null if token
// is unknown, already claimed, or older than 1 hour.
export async function claimPickup(token) {
  const { rows } = await query(
    `UPDATE key_pickups
     SET claimed_at = NOW(), raw_key = NULL
     WHERE token = $1
       AND claimed_at IS NULL
       AND raw_key IS NOT NULL
       AND created_at > NOW() - INTERVAL '1 hour'
     RETURNING raw_key, realm_id`,
    [token]
  );
  return rows[0] || null;
}
