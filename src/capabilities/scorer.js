/**
 * Merges Layer 1 (financial data) + Layer 2 (conversational) capability scores.
 * Layer 1 scores come from the existing capability_scores block in QBO/fixture data.
 * Layer 2 scores come from the capability_assessments DB table.
 */

import { query } from '../db.js';

// Maps the existing financial capability_scores keys to framework capability IDs
const LAYER1_MAP = {
  ar_management:    'ar_management',
  cash_management:  'cash_management',
  pricing_strategy: 'pricing_strategy',
  cost_control:     'cost_control',
  client_mix:       'client_mix',
};

export async function getAssessmentScores(businessId) {
  const result = await query(
    'SELECT capability_id, score, evidence, source, assessed_at FROM capability_assessments WHERE business_id = $1',
    [businessId]
  );
  const scores = {};
  for (const row of result.rows) {
    scores[row.capability_id] = {
      score: row.score,
      evidence: row.evidence,
      source: row.source,
      assessed_at: row.assessed_at,
    };
  }
  return scores;
}

export async function saveScore(businessId, capabilityId, score, evidence, source = 'layer2_conversation') {
  await query(
    `INSERT INTO capability_assessments (business_id, capability_id, score, evidence, source, assessed_at)
     VALUES ($1, $2, $3, $4, $5, NOW())
     ON CONFLICT (business_id, capability_id) DO UPDATE
       SET score = $3, evidence = $4, source = $5, assessed_at = NOW()`,
    [businessId, capabilityId, score, evidence, source]
  );
}

export function mergeScores(layer1CapabilityScores, layer2Scores, framework) {
  if (!framework?.capabilities) return {};

  const merged = {};

  for (const cap of framework.capabilities) {
    const l1Key = LAYER1_MAP[cap.id];
    const l1Score = l1Key && layer1CapabilityScores?.[l1Key];
    const l2Entry = layer2Scores?.[cap.id];

    if (l1Score != null && cap.data_scoreable) {
      // Layer 1 is authoritative for data-scoreable capabilities
      merged[cap.id] = {
        score: l1Score,
        source: 'layer1_financial',
        rubric_description: cap.rubric?.[String(l1Score)] || null,
      };
    } else if (l2Entry) {
      merged[cap.id] = {
        score: l2Entry.score,
        source: l2Entry.source,
        evidence: l2Entry.evidence,
        rubric_description: cap.rubric?.[String(l2Entry.score)] || null,
      };
    }
    // else: not yet scored
  }

  return merged;
}

export function unscoredCapabilities(framework, mergedScores) {
  if (!framework?.capabilities) return [];
  return framework.capabilities.filter(cap => !mergedScores[cap.id]);
}

export function prioritisedRoadmap(framework, mergedScores) {
  if (!framework?.capabilities) return [];

  return framework.capabilities
    .map(cap => {
      const current = mergedScores[cap.id];
      const currentScore = current?.score ?? 1;
      const gap = 5 - currentScore;
      const priority = gap * (cap.impact_weight || 0.1);

      return {
        id: cap.id,
        name: cap.name,
        domain: cap.domain,
        current_score: currentScore,
        current_description: cap.rubric?.[String(currentScore)] || null,
        target_score: Math.min(5, currentScore + 2),
        target_description: cap.rubric?.[String(Math.min(5, currentScore + 2))] || null,
        gap,
        priority,
        scored: !!current,
        source: current?.source || 'unscored',
        ai_use_case: cap.ai_use_case,
        impact_weight: cap.impact_weight,
      };
    })
    .sort((a, b) => b.priority - a.priority);
}
