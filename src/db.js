/**
 * Postgres connection pool — shared across all Clara modules.
 * DATABASE_URL must be set in .env before this module is imported.
 */

import pg from 'pg';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, '..', '.env') });

const { Pool } = pg;

let _pool = null;

export function getPool() {
  if (!_pool) {
    _pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      max: 10,
      idleTimeoutMillis: 30000,
    });
    _pool.on('error', (err) => {
      console.error('Postgres pool error:', err.message);
    });
  }
  return _pool;
}

export async function query(sql, params = []) {
  const pool = getPool();
  const client = await pool.connect();
  try {
    return await client.query(sql, params);
  } finally {
    client.release();
  }
}

// ── Schema bootstrap ──────────────────────────────────────────────────────────
// Called once on server startup. Safe to run multiple times (IF NOT EXISTS).

export async function bootstrapSchema() {
  await query(`
    CREATE TABLE IF NOT EXISTS businesses (
      id            TEXT PRIMARY KEY,
      owner_name    TEXT,
      business_type TEXT,
      realm_id      TEXT UNIQUE,
      created_at    TIMESTAMPTZ DEFAULT NOW(),
      updated_at    TIMESTAMPTZ DEFAULT NOW()
    )
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS qbo_tokens (
      realm_id           TEXT PRIMARY KEY,
      access_token       TEXT NOT NULL,
      refresh_token      TEXT NOT NULL,
      expires_at         TIMESTAMPTZ NOT NULL,
      refresh_expires_at TIMESTAMPTZ NOT NULL,
      created_at         TIMESTAMPTZ DEFAULT NOW(),
      updated_at         TIMESTAMPTZ DEFAULT NOW()
    )
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS telegram_sessions (
      chat_id         BIGINT PRIMARY KEY,
      stage           TEXT NOT NULL DEFAULT 'welcome',
      business_id     TEXT,
      owner_name      TEXT,
      muted           BOOLEAN DEFAULT FALSE,
      custom_stickies JSONB DEFAULT '[]',
      follow_up_at    TIMESTAMPTZ,
      partial_fields  JSONB,
      created_at      TIMESTAMPTZ DEFAULT NOW(),
      updated_at      TIMESTAMPTZ DEFAULT NOW()
    )
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS customer_wikis (
      chat_id    BIGINT PRIMARY KEY,
      pages      JSONB NOT NULL DEFAULT '{}',
      updated_at TIMESTAMPTZ DEFAULT NOW()
    )
  `);

  console.log('DB schema ready');
}
