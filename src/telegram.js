/**
 * Clara — Telegram bot handler
 * Webhook-based. Auto-registers on startup when TELEGRAM_BOT_TOKEN is set.
 */

import Anthropic from '@anthropic-ai/sdk';
import { logChatEvent } from './events.js';
import { seedWiki, deleteWiki } from './wiki.js';
import { runCurator, buildWikiContext } from './curator.js';
import { getSession as dbGetSession, saveSession, deleteSession } from './session-store.js';
import {
  onboardClara,
  getFinancialBriefing,
  getCashForecast,
  getMarginAnalysis,
  getArAlerts,
  identifyValueGaps,
  askClara,
} from './tools.js';
import { validateQuestion } from './validate.js';

// In-memory cache of session objects for the lifetime of a conversation.
// Persisted to Postgres on every state change via saveSession().
const sessionCache = new Map();

const MAIN_KEYBOARD = {
  keyboard: [
    [{ text: '📊 Morning Briefing' }, { text: '💰 Cash Forecast' }],
    [{ text: '📈 Margin Analysis' }, { text: '📨 AR Alerts' }],
    [{ text: '🎯 Value Gaps' }],
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
    await runCurator(chatId, snapshot).catch(err =>
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
  session.followUpTimer = setTimeout(async () => {
    const s = sessionCache.get(chatId);
    if (!s || s.muted || s.stage !== 'active') return;
    try {
      await send(token, chatId,
        `Hey ${ownerName} 👋 — just checking in. How are things looking this week?\n\nTap <b>📊 Morning Briefing</b> for a fresh snapshot, or just ask me anything.`
      );
    } catch (_) {}
  }, FOLLOW_UP_DELAY_MS);
}

// ── Tool runners ─────────────────────────────────────────────────────────────

async function runTool(token, chatId, businessId, toolFn, textKey) {
  await sendTyping(token, chatId);
  try {
    const session = sessionCache.get(chatId);
    const ownerName = session?.ownerName;
    const result = await toolFn({ business_id: businessId, owner_name: ownerName });
    const text = result[textKey] || JSON.stringify(result);
    const formatted = fmt(text);
    await sendWithKeyboard(token, chatId, formatted);
    if (session) logTurn(session, 'clara', text);
    scheduleCurator(chatId);
  } catch (err) {
    await send(token, chatId, 'Something went wrong — try again in a moment.');
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
    await deleteWiki(chatId);
    sessionCache.delete(chatId);
    return send(token, chatId, "Done — all your data has been deleted. Your conversation history, financial profile, and memory wiki have been removed. Send /start to begin again.");
  }

  // ── /start and /help ──
  if (text === '/start' || text === '/help') {
    await resetSession(chatId);
    const s = await getSession(chatId);
    s.stage = 'onboarding_collecting';
    await persistSession(s);
    return send(token, chatId,
      `👋 Hi, I'm <b>Clara</b> — your AI financial advisor.\n\nI help business owners understand their cash flow, margins, and clients before problems become crises.\n\nTell me a bit about yourself — your name, what kind of business you run, and what's keeping you up at night financially.`
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

    // Free-text → ask_clara, with wiki context injected
    await sendTyping(token, chatId);
    try {
      const safeQ = validateQuestion(text);
      const wikiContext = await buildWikiContext(chatId);
      const questionWithContext = wikiContext
        ? `${safeQ}\n\n---\n${wikiContext}`
        : safeQ;
      const result = await askClara({ business_id: bid, question: questionWithContext, owner_name: session.ownerName });
      const formatted = fmt(result.answer);
      await sendWithKeyboard(token, chatId, formatted);
      logTurn(session, 'clara', result.answer);
      scheduleCurator(chatId);
    } catch (err) {
      logChatEvent({ event: 'ask_clara_error', chatId, error: err.message, stack: err.stack?.slice(0, 300) });
      if (err.message?.includes('disallowed')) {
        return send(token, chatId, "I can only answer questions about your business finances. What would you like to know?\n\n/briefing · /cash · /margins · /ar · /gaps");
      }
      return send(token, chatId, 'Something went wrong — try again in a moment.');
    }
    return;
  }

  // ── Onboarding: show prompt on first message ──
  if (session.stage === 'welcome') {
    session.stage = 'onboarding_collecting';
    await persistSession(session);
    return send(token, chatId,
      `👋 Hi, I'm <b>Clara</b> — your AI financial advisor.\n\nI help business owners understand their cash flow, margins, and clients before problems become crises.\n\nTell me a bit about yourself — your name, what kind of business you run, and what's keeping you up at night financially.`
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
      session.businessId = result.business_id;
      session.ownerName  = fields.name;
      session.stage      = 'active';
      await persistSession(session);

      // Seed the wiki with what we know
      await seedWiki(chatId, {
        ownerName:    fields.name,
        businessType: fields.business_type,
        concern:      fields.concern,
        businessId:   result.business_id,
      });

      const intro   = fmt(result.welcome);
      const footer  = `\n\n<i>This is based on a similar business — <a href="https://clara.aerosensei.com/connect">connect your accounting software</a> to see your actual numbers.</i>`;
      const checkin = `\n\n<i>I'll check in with you tomorrow. Type <b>mute</b> any time to turn that off.</i>`;

      scheduleFollowUp(token, chatId, fields.name);
      return sendWithKeyboard(token, chatId, intro + footer + checkin);
    } catch (err) {
      logChatEvent({ event: 'tg_onboard_error', chatId, error: err.message });
      session.stage = 'onboarding_collecting';
      return send(token, chatId, 'Something went wrong — could you try again?');
    }
  }
}

// ── Webhook registration ─────────────────────────────────────────────────────

export async function registerWebhook(token) {
  const url = `https://clara.aerosensei.com/telegram/webhook`;
  const res = await tgPost(token, 'setWebhook', {
    url,
    allowed_updates: ['message', 'edited_message'],
    drop_pending_updates: true,
  });
  if (res.ok) {
    console.log(`Telegram webhook registered: ${url}`);
  } else {
    throw new Error(`Telegram webhook registration failed: ${res.description}`);
  }
}
