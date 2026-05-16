/**
 * Capability probing — picks the next question to ask the owner,
 * and interprets their answer to produce a 1-5 maturity score.
 */

import Anthropic from '@anthropic-ai/sdk';
import { unscoredCapabilities } from './scorer.js';
import { logChatEvent } from '../events.js';

let _client = null;
function getClient() {
  if (!_client) _client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  return _client;
}

const MIN_PROBE_INTERVAL_MS = 8 * 60 * 60 * 1000; // 8 hours between probes

export function shouldProbe(session, mergedScores, framework) {
  if (!session || !framework) return false;
  if (session.pendingProbe) return false; // already waiting for an answer

  const lastProbe = session.lastProbeAt ? new Date(session.lastProbeAt).getTime() : 0;
  if (Date.now() - lastProbe < MIN_PROBE_INTERVAL_MS) return false;

  const unscored = unscoredCapabilities(framework, mergedScores)
    .filter(cap => !cap.data_scoreable); // only probe conversational ones

  return unscored.length > 0;
}

export function pickNextProbe(framework, mergedScores) {
  const candidates = unscoredCapabilities(framework, mergedScores)
    .filter(cap => !cap.data_scoreable)
    .sort((a, b) => (b.impact_weight || 0) - (a.impact_weight || 0));

  if (candidates.length === 0) return null;
  return candidates[0]; // highest-impact unscored conversational capability
}

export async function interpretAnswer(probeCapability, ownerAnswer, businessContext) {
  const rubricText = Object.entries(probeCapability.rubric || {})
    .map(([k, v]) => `Level ${k}: ${v}`)
    .join('\n');

  const response = await getClient().messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 128,
    system: `You score a business owner's answer against a capability rubric. Return only valid JSON — no prose.`,
    messages: [{
      role: 'user',
      content: `Capability: ${probeCapability.name}
Business context: ${businessContext || 'small business owner'}
Question asked: ${probeCapability.probe_question}
Owner's answer: "${ownerAnswer}"

Rubric:
${rubricText}

Based on the owner's answer, which level (1-5) best fits? Return JSON: {"score": N, "reasoning": "one sentence"}`,
    }],
  });

  try {
    const text = response.content[0].text.trim();
    const match = text.match(/\{[\s\S]*\}/);
    const parsed = JSON.parse(match[0]);
    return { score: Math.max(1, Math.min(5, parseInt(parsed.score))), reasoning: parsed.reasoning };
  } catch {
    logChatEvent({ event: 'probe_interpret_error', capability: probeCapability.id });
    return { score: 3, reasoning: 'Unable to score precisely — defaulting to mid-range' };
  }
}
