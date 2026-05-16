/**
 * Clara — Telegram bot handler
 * Webhook-based. Auto-registers on startup when TELEGRAM_BOT_TOKEN is set.
 */

import { createHmac } from 'crypto';
import Anthropic from '@anthropic-ai/sdk';
import { logChatEvent } from './events.js';
import { seedWiki, deleteWiki } from './wiki.js';
import { runCurator, buildWikiContext, runSnapshotCurator, updatePricingPage } from './curator.js';
import { getSession as dbGetSession, saveSession, deleteSession } from './session-store.js';
import { query } from './db.js';
import { claraAnalyze } from './analysis.js';
import {
  onboardClara,
  getFinancialBriefing,
  getCashForecast,
  getMarginAnalysis,
  getArAlerts,
  identifyValueGaps,
  askClara,
  getActionDrafts,
  getGrowthRoadmap,
  getVigilScore,
} from './tools.js';
import { QUESTIONS, getQuestion, getNextQuestion, letterToKey, formatQuestion, allQuestionsAnswered } from './scoring/questions.js';
import { saveAnswer, getAnsweredIds } from './scoring/store.js';
import { getOrGenerateFramework } from './capabilities/generator.js';
import { getAssessmentScores, mergeScores, saveScore } from './capabilities/scorer.js';
import { shouldProbe, pickNextProbe, interpretAnswer } from './capabilities/probe.js';
import { createKey, getKeysForChat, revokeKeysForChat } from './keys.js';
import { validateQuestion } from './validate.js';

// In-memory cache of session objects for the lifetime of a conversation.
// Persisted to Postgres on every state change via saveSession().
const sessionCache = new Map();

// ── QBO connect link helpers ─────────────────────────────────────────────────

function signChatId(chatId) {
  return createHmac('sha256', process.env.CLARA_API_KEY || '')
    .update(`tg:${chatId}`)
    .digest('hex');
}

function connectUrl(chatId) {
  const sig = signChatId(chatId);
  return `https://vigilcfo.com/connect?tg=${chatId}.${sig}`;
}

export function invalidateSession(chatId) {
  sessionCache.delete(chatId);
}

// Called from server-http.js after QBO OAuth completes to kick off question flow
export async function startVigilQuestions(token, chatId) {
  const session = await getSession(chatId);
  if (!session.businessId) return; // no business linked yet

  const answeredIds = await getAnsweredIds(session.businessId);
  const nextQ = getNextQuestion(answeredIds);
  if (!nextQ) {
    // All questions already answered — nothing to do
    return;
  }

  session.stage = 'scoring_questions';
  session.vigilQuestionId = nextQ.id;
  await persistSession(session);

  const intro = `Your books are connected — great. Before I give you your Vigil Score, I have ${QUESTIONS.length} quick questions. They take about 30 seconds total and make the score much more accurate.\n\n` + formatQuestion(nextQ);
  await send(token, chatId, fmt(intro));
  logChatEvent({ event: 'vigil_question_sent', chatId, questionId: nextQ.id });
}

const MAIN_KEYBOARD = {
  keyboard: [
    [{ text: '📊 Morning Briefing' }, { text: '💰 Cash Forecast' }],
    [{ text: '📈 Margin Analysis' }, { text: '📨 AR Alerts' }],
    [{ text: '🎯 Value Gaps' }, { text: '⚡ Take Action' }],
    [{ text: '🏆 Vigil Score' }, { text: '🗺️ Growth Roadmap' }],
  ],
  resize_keyboard: true,
  persistent: true,
};

// ── Telegram API helpers ─────────────────────────────────────────────────────

async function tgPost(token, method, body) {
  const res = await fetch(`https://api.telegram.org/bot${token}/${method}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  return res.json();
}

async function send(token, chatId, text, extra = {}) {
  return tgPost(token, 'sendMessage', {
    chat_id: chatId,
    text: text.slice(0, 4096),
    parse_mode: 'HTML',
    ...extra,
  });
}

async function sendWithKeyboard(token, chatId, text) {
  return send(token, chatId, text, { reply_markup: MAIN_KEYBOARD });
}

async function sendTyping(token, chatId) {
  return tgPost(token, 'sendChatAction', { chat_id: chatId, action: 'typing' });
}

// ── Text formatting ──────────────────────────────────────────────────────────

function fmt(text) {
  if (!text) return '';
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\*\*(.+?)\*\*/g, '<b>$1</b>')
    .replace(/\*(.+?)\*/g, '<i>$1</i>')
    .replace(/^#{1,3} (.+)$/gm, '\n<b>$1</b>')
    .replace(/^Key Action Items$/gm, '\n<b>Key Action Items</b>')
    // Auto-bold label lines: "Label text:" at start of line, or "Today:" anywhere
    .replace(/Today:/g, '<b>Today:</b>')
    .replace(/^([A-Z][A-Za-z0-9 ,+%()-]{2,50}):\s/gm, '<b>$1:</b> ')
    .replace(/^---+$/gm, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

// ── Session helpers ──────────────────────────────────────────────────────────

async function getSession(chatId) {
  if (!sessionCache.has(chatId)) {
    const persisted = await dbGetSession(chatId);
    sessionCache.set(chatId, {
      ...persisted,
      transcript: [],   // never persisted — only needed within a conversation
      followUpTimer: null,
      curatorTimer: null,
    });
  }
  return sessionCache.get(chatId);
}

async function persistSession(session) {
  await saveSession(session.chatId, session);
}

async function resetSession(chatId) {
  const s = sessionCache.get(chatId);
  if (s?.followUpTimer) clearTimeout(s.followUpTimer);
  if (s?.curatorTimer)  clearTimeout(s.curatorTimer);
  const fresh = { chatId, stage: 'welcome', muted: false, transcript: [], partialFields: null, followUpTimer: null, curatorTimer: null };
  sessionCache.set(chatId, fresh);
  await saveSession(chatId, fresh);
}

// ── Transcript helpers ───────────────────────────────────────────────────────

function logTurn(session, speaker, text) {
  session.transcript.push({ ts: new Date().toISOString(), speaker, text });
}

// ── Curator idle trigger ─────────────────────────────────────────────────────

const CURATOR_IDLE_MS = 5 * 60 * 1000; // 5 minutes of silence

function scheduleCurator(chatId) {
  const session = sessionCache.get(chatId);
  if (!session) return;
  if (session.curatorTimer) clearTimeout(session.curatorTimer);
  session.curatorTimer = setTimeout(async () => {
    const s = sessionCache.get(chatId);
    if (!s || s.transcript.length === 0) return;
    const snapshot = [...s.transcript];
    s.transcript = [];
    const businessId = s.businessId || String(chatId);
    await runCurator(businessId, snapshot).catch(err =>
      logChatEvent({ event: 'curator_trigger_error', chatId, error: err.message })
    );
  }, CURATOR_IDLE_MS);
}

// ── Follow-up scheduler ──────────────────────────────────────────────────────

const FOLLOW_UP_DELAY_MS = 24 * 60 * 60 * 1000; // 24 hours

function scheduleFollowUp(token, chatId, ownerName) {
  const session = sessionCache.get(chatId);
  if (!session) return;
  if (session.followUpTimer) clearTimeout(session.followUpTimer);
  // Persist the scheduled time so it can be rescheduled after a restart
  const followUpAt = new Date(Date.now() + FOLLOW_UP_DELAY_MS).toISOString();
  query(`UPDATE telegram_sessions SET follow_up_at = $1 WHERE chat_id = $2`, [followUpAt, chatId])
    .catch(err => console.warn('Failed to persist follow_up_at:', err.message));
  session.followUpTimer = setTimeout(async () => {
    const s = sessionCache.get(chatId);
    if (!s || s.muted || s.stage !== 'active') return;
    try {
      // Read wiki to personalise the check-in rather than sending a generic message
      const wikiContext = s.businessId ? await buildWikiContext(s.businessId) : null;
      let message;
      if (wikiContext) {
        const result = await claraAnalyze(
          `You are checking in with ${ownerName} after 24 hours of silence. Write one short, personal message (2–3 sentences max) that references something specific from what you know about them — a concern they mentioned, an action they committed to, or a number they were worried about. End with one simple question to draw them back in. Do not repeat advice. Do not list anything. Sound like a human checking in, not a bot.`,
          null,
          wikiContext
        );
        message = fmt(result);
      } else {
        message = `Hey ${ownerName} 👋 — just checking in. How are things looking this week?\n\nTap <b>📊 Morning Briefing</b> for a fresh snapshot, or just ask me anything.`;
      }
      await sendWithKeyboard(token, chatId, message);
      // Clear the persisted timestamp so it isn't rescheduled on next restart
      await query(`UPDATE telegram_sessions SET follow_up_at = NULL WHERE chat_id = $1`, [chatId])
        .catch(() => {});
    } catch (_) {}
  }, FOLLOW_UP_DELAY_MS);
}

// Reschedule follow-ups for all active sessions on startup (survives server restarts)
export async function rescheduleFollowUps(token) {
  try {
    const { rows } = await query(
      `SELECT chat_id, owner_name, follow_up_at FROM telegram_sessions
       WHERE stage = 'active' AND muted = FALSE
         AND follow_up_at IS NOT NULL AND follow_up_at > NOW()`
    );
    for (const row of rows) {
      const delay  = Math.max(0, new Date(row.follow_up_at) - Date.now());
      const chatId = Number(row.chat_id);
      const ownerName = row.owner_name || 'there';
      const timer = setTimeout(async () => {
        const s = sessionCache.get(chatId);
        if (s?.muted || s?.stage !== 'active') return;
        try {
          await sendWithKeyboard(token, chatId,
            `Hey ${ownerName} 👋 — just checking in. How are things looking?\n\nTap <b>📊 Morning Briefing</b> for a fresh snapshot.`
          );
        } catch (_) {}
      }, delay);
      const existing = sessionCache.get(chatId);
      if (existing) existing.followUpTimer = timer;
    }
    if (rows.length > 0) console.log(`Rescheduled ${rows.length} follow-up(s) after startup`);
  } catch (err) {
    console.warn('rescheduleFollowUps failed (non-fatal):', err.message);
  }
}

// ── Tool runners ─────────────────────────────────────────────────────────────

async function runActionDrafts(token, chatId, businessId, ownerName) {
  await sendTyping(token, chatId);
  try {
    const result = await getActionDrafts({ business_id: businessId, owner_name: ownerName, chat_id: chatId });

    if (!result.drafts || result.drafts.length === 0) {
      return sendWithKeyboard(token, chatId, result.message || "Nothing urgent to act on right now — things look healthy.");
    }

    // Intro message
    const intro = `I've put together ${result.drafts.length} ready-to-send ${result.drafts.length === 1 ? 'message' : 'messages'} based on what I'm seeing in your numbers. Copy whichever ones you want to use — I haven't sent anything.\n`;
    await send(token, chatId, fmt(intro));

    // One message per draft so each is easy to copy
    for (let i = 0; i < result.drafts.length; i++) {
      const d = result.drafts[i];
      const header = `<b>${i + 1}/${result.drafts.length} — ${d.title}</b>\n<b>To:</b> ${d.recipient}\n<b>Subject:</b> ${d.subject}\n`;
      const body = `\n${d.body}`;
      await send(token, chatId, header + body);
    }

    await sendWithKeyboard(token, chatId, 'Let me know if you want me to adjust the tone on any of those, or draft something else.');
    logChatEvent({ event: 'action_drafts_sent', chatId, businessId, count: result.drafts.length });
  } catch (err) {
    logChatEvent({ event: 'action_drafts_error', chatId, businessId, error: err.message, stack: err.stack?.slice(0, 400) });
    await sendWithKeyboard(token, chatId, 'Something went wrong drafting those — try again in a moment.');
  }
}

async function maybeSendProbe(token, chatId, businessId, session) {
  try {
    if (!session.businessType) return;
    const framework = await getOrGenerateFramework(session.businessType);
    if (!framework) return;

    // Load a stub of business data to get Layer 1 scores for merging
    const { loadBusiness } = await import('./data.js');
    const d = await loadBusiness(businessId);
    const layer2Scores = await getAssessmentScores(businessId);
    const merged = mergeScores(d.capability_scores || {}, layer2Scores, framework);

    if (!shouldProbe(session, merged, framework)) return;

    const cap = pickNextProbe(framework, merged);
    if (!cap) return;

    // Update session with the pending probe
    const s = sessionCache.get(chatId);
    if (!s || s.pendingProbe) return; // session changed or already probing
    s.pendingProbe = { id: cap.id, name: cap.name, probe_question: cap.probe_question, rubric: cap.rubric };
    s.lastProbeAt = new Date().toISOString();
    await persistSession(s);

    // Send the probe as a natural follow-up (small delay so it doesn't feel instant)
    await send(token, chatId, `<i>One thing I've been meaning to ask — ${cap.probe_question}</i>`);
    logChatEvent({ event: 'probe_sent', chatId, capability: cap.id });
  } catch (err) {
    logChatEvent({ event: 'probe_send_error', chatId, error: err.message });
  }
}

async function runTool(token, chatId, businessId, toolFn, textKey) {
  await sendTyping(token, chatId);
  try {
    const session = sessionCache.get(chatId);
    const ownerName = session?.ownerName;
    const wikiContext = await buildWikiContext(businessId);
    const result = await toolFn({ business_id: businessId, owner_name: ownerName, wiki_context: wikiContext });
    const text = result[textKey] || JSON.stringify(result);
    const formatted = fmt(text);
    await sendWithKeyboard(token, chatId, formatted);
    if (session) logTurn(session, 'clara', text);
    scheduleCurator(chatId);
    // Fire-and-forget post-call wiki updates keyed by businessId
    if (result.raw) {
      setTimeout(() => runSnapshotCurator(businessId, textKey, result.raw), 0);
    }
    if (textKey === 'analysis' && result.raw?.service_pricing_gaps?.length > 0) {
      setTimeout(() => updatePricingPage(businessId, result.raw.service_pricing_gaps), 0);
    }
  } catch (err) {
    logChatEvent({ event: 'run_tool_error', chatId, businessId, error: err.message, stack: err.stack?.slice(0, 400) });
    if (err.code === 'QBO_REFRESH_EXPIRED') {
      await send(token, chatId,
        `Your QuickBooks connection has expired — this happens after 100 days of inactivity.\n\nTap /reconnect to restore it. Takes about 30 seconds.`
      );
    } else {
      await send(token, chatId, 'Something went wrong — try again in a moment.');
    }
  }
}

// ── AI onboarding extraction ─────────────────────────────────────────────────

let _client = null;
function getClient() {
  if (!_client) _client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  return _client;
}

async function extractOnboardingFields(userText) {
  const response = await getClient().messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 256,
    system: `Extract onboarding information from the user's message. Return ONLY valid JSON with these keys:
- "name": first name only (string, or null if not found)
- "business_type": what kind of business they run (string, or null if not found)
- "concern": their biggest financial concern in their own words (string, or null if not found)

Be generous — infer from context if implied. Never add keys or prose outside the JSON object.`,
    messages: [{ role: 'user', content: `"""${userText}"""` }],
  });

  const raw = response.content[0].text.trim();
  const match = raw.match(/\{[\s\S]*\}/);
  if (!match) return { name: null, business_type: null, concern: null };
  return JSON.parse(match[0]);
}

// ── Main update handler ──────────────────────────────────────────────────────

export async function handleUpdate(update, token) {
  const message = update.message || update.edited_message;
  if (!message?.text) return;

  const chatId  = message.chat.id;
  const text    = message.text.trim();
  const lc      = text.toLowerCase();
  const session = await getSession(chatId);

  logChatEvent({ event: 'tg_message', chatId, stage: session.stage, text: text.slice(0, 80) });

  // Log user turn to transcript (for curator)
  if (session.stage === 'active') {
    logTurn(session, 'user', text);
    scheduleCurator(chatId); // reset idle timer on every message
  }

  // ── /delete_my_data ──
  if (text === '/delete_my_data') {
    await deleteSession(chatId);
    await deleteWiki(session?.businessId || String(chatId));
    await revokeKeysForChat(chatId);
    sessionCache.delete(chatId);
    return send(token, chatId, "Done — all your data has been deleted. Your conversation history, financial profile, memory wiki, and API keys have been removed. Send /start to begin again.");
  }

  // ── /connect and /reconnect ──
  if (text === '/connect' || text === '/reconnect') {
    const url = connectUrl(chatId);
    const isReconnect = text === '/reconnect';
    return send(token, chatId,
      `🔗 <b>${isReconnect ? 'Reconnect your QuickBooks' : 'Connect your QuickBooks'}</b>\n\n` +
      (isReconnect
        ? `Tap the link to re-authorise Vigil. A new API key will be issued and your old one revoked automatically.\n\n`
        : `Tap the link below to authorise Vigil to read your accounting data. It takes about 30 seconds — Vigil only reads, it can never make changes.\n\n`) +
      `<a href="${url}">${isReconnect ? 'Reconnect QuickBooks →' : 'Connect QuickBooks →'}</a>\n\n` +
      `<i>${isReconnect ? 'Your new API key will appear here in this chat.' : 'Once connected, all your briefings will use your actual numbers instead of a demo business.'}</i>`
    );
  }

  // ── /start and /help ──
  if (text === '/start' || text === '/help') {
    await resetSession(chatId);
    const s = await getSession(chatId);
    s.stage = 'onboarding_collecting';
    await persistSession(s);
    return send(token, chatId,
      `👋 Hi, I'm <b>Vigil</b> — your AI financial advisor.\n\nI help business owners understand their cash flow, margins, and clients before problems become crises.\n\nTell me a bit about yourself — your name, what kind of business you run, and what's keeping you up at night financially.`
    );
  }

  // ── Mute / unmute ──
  if (lc === 'mute' || lc === '/mute') {
    session.muted = true;
    if (session.followUpTimer) clearTimeout(session.followUpTimer);
    await persistSession(session);
    return send(token, chatId, "Got it — I won't check in proactively. You can always come back whenever you need. Type <b>unmute</b> to turn check-ins back on.");
  }
  if (lc === 'unmute' || lc === '/unmute') {
    session.muted = false;
    await persistSession(session);
    if (session.stage === 'active') scheduleFollowUp(token, chatId, session.ownerName || 'there');
    return send(token, chatId, "Check-ins are back on. I'll follow up in about 24 hours.");
  }

  // ── Commands available once active ──
  if (session.stage === 'active') {
    const bid = session.businessId;

    if (text === '/briefing'      || lc === '📊 morning briefing')
      return runTool(token, chatId, bid, getFinancialBriefing, 'briefing');
    if (text === '/cash'          || lc === '💰 cash forecast')
      return runTool(token, chatId, bid, getCashForecast, 'forecast');
    if (text === '/margins'       || lc === '📈 margin analysis')
      return runTool(token, chatId, bid, getMarginAnalysis, 'analysis');
    if (text === '/ar'            || lc === '📨 ar alerts')
      return runTool(token, chatId, bid, getArAlerts, 'alert');
    if (text === '/gaps'          || lc === '🎯 value gaps')
      return runTool(token, chatId, bid, identifyValueGaps, 'analysis');

    if (text === '/actions'       || lc === '⚡ take action')
      return runActionDrafts(token, chatId, bid, session.ownerName);

    if (text === '/roadmap'       || lc === '🗺️ growth roadmap')
      return runTool(token, chatId, bid,
        (args) => getGrowthRoadmap({ ...args, business_type: session.businessType }),
        'roadmap');

    if (text === '/score'         || lc === '🏆 vigil score') {
      await sendTyping(token, chatId);
      try {
        const answeredIds = await getAnsweredIds(bid);
        const unanswered  = QUESTIONS.filter(q => !answeredIds.includes(q.id));
        if (unanswered.length > 0) {
          session.stage = 'scoring_questions';
          session.vigilQuestionId = unanswered[0].id;
          await persistSession(session);
          await send(token, chatId, `Before I show your full Vigil Score, I need a few quick details.\n\n` + fmt(formatQuestion(unanswered[0])));
          logChatEvent({ event: 'vigil_question_sent', chatId, questionId: unanswered[0].id });
          return;
        }
        const result = await getVigilScore({ business_id: bid, owner_name: session.ownerName });
        await sendWithKeyboard(token, chatId, fmt(result.summary));
        logChatEvent({ event: 'vigil_score_sent', chatId, composite: result.composite });
      } catch (err) {
        logChatEvent({ event: 'vigil_score_error', chatId, error: err.message });
        await sendWithKeyboard(token, chatId, 'Something went wrong — try again in a moment.');
      }
      return;
    }

    if (text === '/apikey') {
      await sendTyping(token, chatId);
      try {
        // Check if they already have an active key
        const existing = await getKeysForChat(chatId);
        const active = existing.filter(k => !k.revoked_at);

        if (active.length > 0) {
          const k = active[0];
          const lastUsed = k.last_used_at
            ? `Last used ${new Date(k.last_used_at).toLocaleDateString()}`
            : 'Never used';
          return send(token, chatId,
            `You already have an active API key (<code>${k.key_prefix}…</code> — ${lastUsed}).\n\n` +
            `The full key was shown once when you generated it — it can't be retrieved.\n\n` +
            `If you've lost it, use /revokekey to revoke it and /apikey to generate a fresh one.`
          );
        }

        // QBO realm IDs are numeric (9-25 digits); fixture IDs are not.
        const isRealData = /^\d{9,25}$/.test(session.businessId || '');

        // Generate a fresh key
        const ownerLabel = `Telegram: ${session.ownerName || chatId}`;
        const { raw, prefix } = await createKey({ ownerLabel, chatId, realmId: session.businessId });
        logChatEvent({ event: 'api_key_generated', chatId, prefix, isRealData });

        const demoWarning = isRealData ? '' :
          `\n\n⚠️ <b>Demo data:</b> Your QuickBooks isn't connected yet, so this key uses a sample business. <a href="${connectUrl(chatId)}">Connect QuickBooks</a> — a fresh key with your real data will be issued automatically and this one will be revoked.`;

        return send(token, chatId,
          `Here's your Vigil API key, ${session.ownerName || 'there'}:\n\n` +
          `<code>${raw}</code>\n\n` +
          `⚠️ <b>Save this now — it won't be shown again.</b>${demoWarning}\n\n` +
          `<b>Connect to Claude Desktop</b> — add this to <code>claude_desktop_config.json</code>:\n\n` +
          `<pre>{\n  "mcpServers": {\n    "vigil": {\n      "url": "https://vigilcfo.com/mcp",\n      "headers": {\n        "Authorization": "Bearer ${raw}"\n      }\n    }\n  }\n}</pre>\n\n` +
          `<b>Connect to Hermes</b> — add to <code>~/.hermes/config.yaml</code>:\n\n` +
          `<pre>mcp_servers:\n  vigil:\n    url: https://vigilcfo.com/mcp\n    headers:\n      Authorization: "Bearer ${raw}"</pre>`
        );
      } catch (err) {
        logChatEvent({ event: 'apikey_error', chatId, error: err.message });
        return send(token, chatId, 'Something went wrong generating your key — try again in a moment.');
      }
    }

    if (text === '/revokekey') {
      await revokeKeysForChat(chatId);
      logChatEvent({ event: 'api_key_revoked', chatId });
      return send(token, chatId, 'Done — your previous API key has been revoked. Use /apikey to generate a new one.');
    }

    // Free-text → ask_clara (with capability probing)
    await sendTyping(token, chatId);
    try {
      // If there's a pending probe, interpret the answer before responding
      if (session.pendingProbe) {
        const probe = session.pendingProbe;
        try {
          const { score, reasoning } = await interpretAnswer(probe, text, session.businessType);
          await saveScore(bid, probe.id, score, reasoning);
          session.pendingProbe = null;
          logChatEvent({ event: 'probe_scored', chatId, capability: probe.id, score });
        } catch (err) {
          logChatEvent({ event: 'probe_score_error', chatId, error: err.message });
          session.pendingProbe = null;
        }
        await persistSession(session);
      }

      const safeQ = validateQuestion(text);
      const wikiContext = await buildWikiContext(bid);
      const result = await askClara({ business_id: bid, question: safeQ, owner_name: session.ownerName, wiki_context: wikiContext });
      const formatted = fmt(result.answer);
      await sendWithKeyboard(token, chatId, formatted);
      logTurn(session, 'clara', result.answer);
      scheduleCurator(chatId);

      // Check if we should ask a capability probe question next
      // Runs async after response is sent — doesn't block
      setTimeout(() => maybeSendProbe(token, chatId, bid, session), 500);
    } catch (err) {
      logChatEvent({ event: 'ask_clara_error', chatId, error: err.message, stack: err.stack?.slice(0, 300) });
      if (err.message?.includes('disallowed')) {
        return send(token, chatId, "I can only answer questions about your business finances. What would you like to know?\n\n/briefing · /cash · /margins · /ar · /gaps");
      }
      return send(token, chatId, 'Something went wrong — try again in a moment.');
    }
    return;
  }

  // ── Vigil scoring questions ──
  if (session.stage === 'scoring_questions') {
    const questionId = session.vigilQuestionId;
    if (!questionId) {
      // Shouldn't happen — recover by going active
      session.stage = 'active';
      await persistSession(session);
      return sendWithKeyboard(token, chatId, 'All set — tap 📊 Morning Briefing for your first insight, or /score for your Vigil Score.');
    }

    const question = getQuestion(questionId);
    if (!question) {
      session.stage = 'active';
      await persistSession(session);
      return sendWithKeyboard(token, chatId, "All set — tap 📊 Morning Briefing or /score to see your Vigil Score.");
    }

    // Interpret the reply — accept letter (A/B/C...) or partial label text
    const letter = text.trim().slice(0, 1).toUpperCase();
    const key    = letterToKey(question, letter);

    if (!key) {
      const letters = 'ABCDEF'.slice(0, question.options.length).split('').join(', ');
      return send(token, chatId, `Please reply with a letter (${letters}) to choose your answer.\n\n${fmt(formatQuestion(question))}`);
    }

    // Save answer and advance
    const realmId = session.businessId;
    await saveAnswer(realmId, questionId, key);
    logChatEvent({ event: 'vigil_answer_saved', chatId, questionId, key });

    const answeredIds = await getAnsweredIds(realmId);
    const nextQ = getNextQuestion(answeredIds);

    if (nextQ) {
      session.vigilQuestionId = nextQ.id;
      await persistSession(session);
      await send(token, chatId, fmt(formatQuestion(nextQ)));
      logChatEvent({ event: 'vigil_question_sent', chatId, questionId: nextQ.id });
      return;
    }

    // All questions answered — compute score
    session.stage = 'active';
    session.vigilQuestionId = null;
    await persistSession(session);

    await sendTyping(token, chatId);
    try {
      const result = await getVigilScore({ business_id: realmId, owner_name: session.ownerName });
      await sendWithKeyboard(token, chatId, fmt(result.summary));
      logChatEvent({ event: 'vigil_score_sent', chatId, composite: result.composite });
    } catch (err) {
      logChatEvent({ event: 'vigil_score_error', chatId, error: err.message });
      await sendWithKeyboard(token, chatId, "Your answers are saved. Type /score any time to see your Vigil Score.");
    }
    return;
  }

  // ── Onboarding: show prompt on first message ──
  if (session.stage === 'welcome') {
    session.stage = 'onboarding_collecting';
    await persistSession(session);
    return send(token, chatId,
      `👋 Hi, I'm <b>Vigil</b> — your AI financial advisor.\n\nI help business owners understand their cash flow, margins, and clients before problems become crises.\n\nTell me a bit about yourself — your name, what kind of business you run, and what's keeping you up at night financially.`
    );
  }

  // ── Onboarding: extract fields from free-form reply ──
  if (session.stage === 'onboarding_collecting') {
    session.stage = 'loading';
    await sendTyping(token, chatId);

    let extracted;
    try {
      extracted = await extractOnboardingFields(text);
      logChatEvent({ event: 'tg_extracted', chatId, fields: extracted });
    } catch (err) {
      logChatEvent({ event: 'tg_extract_error', chatId, error: err.message });
      session.stage = 'onboarding_collecting';
      return send(token, chatId, 'Sorry, something went wrong on my end — could you try again?');
    }

    // Merge with any fields already collected in a previous turn
    const fields = {
      name:          extracted.name          || session.partialFields?.name,
      business_type: extracted.business_type || session.partialFields?.business_type,
      concern:       extracted.concern       || session.partialFields?.concern,
    };
    session.partialFields = fields;

    const missing = [];
    if (!fields.name)          missing.push('your name');
    if (!fields.business_type) missing.push('what kind of business you run');
    if (!fields.concern)       missing.push('your biggest financial concern');

    if (missing.length > 0) {
      session.stage = 'onboarding_collecting';
      session.partialFields = fields;
      await persistSession(session);
      return send(token, chatId,
        `Just need a couple more details — could you share ${missing.join(' and ')}?`
      );
    }

    try {
      const result = await onboardClara({
        owner_name:      fields.name,
        business_type:   fields.business_type,
        biggest_concern: fields.concern,
      });
      session.businessId   = result.business_id;
      session.ownerName    = fields.name;
      session.businessType = fields.business_type;
      session.stage        = 'active';
      await persistSession(session);

      // Seed the wiki with what we know
      await seedWiki(result.business_id, {
        ownerName:    fields.name,
        businessType: fields.business_type,
        concern:      fields.concern,
      });

      // Generate capability framework in background (cached per business type)
      setTimeout(() => getOrGenerateFramework(fields.business_type).catch(() => {}), 2000);

      const intro  = fmt(result.welcome);
      const cta    = `\n\n<a href="${connectUrl(chatId)}">Connect your QuickBooks →</a>\n<i>Takes about 30 seconds. Read-only — Vigil can never make changes.</i>`;

      scheduleFollowUp(token, chatId, fields.name);
      return sendWithKeyboard(token, chatId, intro + cta);
    } catch (err) {
      logChatEvent({ event: 'tg_onboard_error', chatId, error: err.message });
      session.stage = 'onboarding_collecting';
      return send(token, chatId, 'Something went wrong — could you try again?');
    }
  }
}

// ── Webhook registration ─────────────────────────────────────────────────────

// One-way derivation of the webhook secret from the master key so it doesn't need a separate env var.
// Telegram requires the secret to be 1–256 chars, alphanumeric + underscore only.
export function webhookSecret() {
  return createHmac('sha256', process.env.CLARA_API_KEY || 'insecure')
    .update('tg-webhook-secret')
    .digest('hex')
    .slice(0, 64);
}

export async function registerWebhook(token) {
  const url = `https://vigilcfo.com/telegram/webhook`;
  const res = await tgPost(token, 'setWebhook', {
    url,
    allowed_updates: ['message', 'edited_message'],
    drop_pending_updates: true,
    secret_token: webhookSecret(),
  });
  if (res.ok) {
    console.log(`Telegram webhook registered: ${url}`);
  } else {
    throw new Error(`Telegram webhook registration failed: ${res.description}`);
  }
}
