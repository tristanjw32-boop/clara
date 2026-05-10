/**
 * Persistent Telegram session store — backed by Postgres.
 * Replaces the in-memory Map in telegram.js.
 * Sessions survive server restarts.
 */

import { query } from './db.js';

export async function getSession(chatId) {
  const { rows } = await query(
    'SELECT * FROM telegram_sessions WHERE chat_id = $1',
    [chatId]
  );
  if (rows.length === 0) {
    await query(
      `INSERT INTO telegram_sessions (chat_id, stage) VALUES ($1, 'welcome')
       ON CONFLICT (chat_id) DO NOTHING`,
      [chatId]
    );
    return { chatId, stage: 'welcome', muted: false, customStickies: [], partialFields: null };
  }
  const r = rows[0];
  return {
    chatId:         Number(r.chat_id),
    stage:          r.stage,
    businessId:     r.business_id,
    ownerName:      r.owner_name,
    muted:          r.muted,
    customStickies: r.custom_stickies || [],
    followUpAt:     r.follow_up_at,
    partialFields:  r.partial_fields,
  };
}

export async function saveSession(chatId, fields) {
  await query(
    `INSERT INTO telegram_sessions
       (chat_id, stage, business_id, owner_name, muted, custom_stickies, follow_up_at, partial_fields, updated_at)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,NOW())
     ON CONFLICT (chat_id) DO UPDATE SET
       stage           = EXCLUDED.stage,
       business_id     = EXCLUDED.business_id,
       owner_name      = EXCLUDED.owner_name,
       muted           = EXCLUDED.muted,
       custom_stickies = EXCLUDED.custom_stickies,
       follow_up_at    = EXCLUDED.follow_up_at,
       partial_fields  = EXCLUDED.partial_fields,
       updated_at      = NOW()`,
    [
      chatId,
      fields.stage,
      fields.businessId   || null,
      fields.ownerName    || null,
      fields.muted        || false,
      JSON.stringify(fields.customStickies || []),
      fields.followUpAt   || null,
      fields.partialFields ? JSON.stringify(fields.partialFields) : null,
    ]
  );
}

export async function deleteSession(chatId) {
  await query('DELETE FROM telegram_sessions WHERE chat_id = $1', [chatId]);
}
