/**
 * DB read/write for Vigil answers and scores.
 */

import { query } from '../db.js';

// ── Answers ───────────────────────────────────────────────────────────────────

export async function saveAnswer(realmId, questionId, answer) {
  await query(
    `INSERT INTO vigil_answers (realm_id, question_id, answer)
     VALUES ($1, $2, $3)
     ON CONFLICT (realm_id, question_id) DO UPDATE SET answer = $3, answered_at = NOW()`,
    [realmId, questionId, answer]
  );
}

// Returns plain object { questionId: answerKey }
export async function loadAnswers(realmId) {
  const { rows } = await query(
    `SELECT question_id, answer FROM vigil_answers WHERE realm_id = $1`,
    [realmId]
  );
  return Object.fromEntries(rows.map(r => [r.question_id, r.answer]));
}

export async function getAnsweredIds(realmId) {
  const { rows } = await query(
    `SELECT question_id FROM vigil_answers WHERE realm_id = $1`,
    [realmId]
  );
  return rows.map(r => r.question_id);
}

// ── Scores ────────────────────────────────────────────────────────────────────

export async function saveScore(realmId, scoreResult, rawSnapshot, answerSnapshot) {
  const { composite, industry_code, scores, dollar_gaps, top_action } = scoreResult;
  await query(
    `INSERT INTO vigil_scores
       (realm_id, industry_code, scores, composite, dollar_gaps, top_action, raw_snapshot, answer_snapshot)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
    [
      realmId,
      industry_code,
      JSON.stringify(scores),
      composite,
      JSON.stringify(dollar_gaps),
      JSON.stringify(top_action),
      JSON.stringify(rawSnapshot || {}),
      JSON.stringify(answerSnapshot || {}),
    ]
  );
}

// Returns the most recent stored score for a realm, or null
export async function getLatestScore(realmId) {
  const { rows } = await query(
    `SELECT * FROM vigil_scores WHERE realm_id = $1 ORDER BY computed_at DESC LIMIT 1`,
    [realmId]
  );
  return rows[0] || null;
}

// Returns true if a score was computed in the last N hours
export async function hasRecentScore(realmId, withinHours = 24) {
  const { rows } = await query(
    `SELECT 1 FROM vigil_scores
     WHERE realm_id = $1 AND computed_at > NOW() - ($2 || ' hours')::interval
     LIMIT 1`,
    [realmId, String(withinHours)]
  );
  return rows.length > 0;
}
