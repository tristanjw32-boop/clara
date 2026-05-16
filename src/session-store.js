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
    businessType:   r.business_type,
    muted:          r.muted,
    customStickies: r.custom_stickies || [],
    followUpAt:     r.follow_up_at,
    partialFields:  r.partial_fields,
    pendingProbe:   r.pending_probe,
    lastProbeAt:    r.last_probe_at,
  };
}

export async function saveSession(chatId, fields) {
  await query(
    `INSERT INTO telegram_sessions
       (chat_id, stage, business_id, owner_name, business_type, muted, custom_stickies,
        follow_up_at, partial_fields, pending_probe, last_probe_at, updated_at)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,NOW())
     ON CONFLICT (chat_id) DO UPDATE SET
       stage           = EXCLUDED.stage,
       business_id     = EXCLUDED.business_id,
       owner_name      = EXCLUDED.owner_name,
       business_type   = EXCLUDED.business_type,
       muted           = EXCLUDED.muted,
       custom_stickies = EXCLUDED.custom_stickies,
       follow_up_at    = EXCLUDED.follow_up_at,
       partial_fields  = EXCLUDED.partial_fields,
       pending_probe   = EXCLUDED.pending_probe,
       last_probe_at   = EXCLUDED.last_probe_at,
       updated_at      = NOW()`,
    [
      chatId,
      fields.stage,
      fields.businessId    || null,
      fields.ownerName     || null,
      fields.businessType  || null,
      fields.muted         || false,
      JSON.stringify(fields.customStickies || []),
      fields.followUpAt    || null,
      fields.partialFields ? JSON.stringify(fields.partialFields) : null,
      fields.pendingProbe  ? JSON.stringify(fields.pendingProbe) : null,
      fields.lastProbeAt   || null,
    ]
  );
}

export async function deleteSession(chatId) {
  await query('DELETE FROM telegram_sessions WHERE chat_id = $1', [chatId]);
}
