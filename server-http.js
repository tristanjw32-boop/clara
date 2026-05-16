#!/usr/bin/env node
/**
 * Clara MCP — HTTP transport (remote agents: Hermes, Claude Desktop, etc.)
 * Exposes the same 6 tools as server.js but over HTTP/SSE instead of stdio.
 *
 * Endpoint: POST/GET/DELETE https://clara.aerosensei.com/mcp
 * Auth:     Authorization: Bearer <CLARA_API_KEY>
 */
import { createHmac } from 'crypto';
import express from 'express';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { CallToolRequestSchema, ListToolsRequestSchema, ListResourcesRequestSchema, ListPromptsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, '.env') });

const { ANTHROPIC_API_KEY, CLARA_API_KEY, PORT = 3030 } = process.env;

if (!ANTHROPIC_API_KEY) { console.error('ANTHROPIC_API_KEY not set'); process.exit(1); }
if (!CLARA_API_KEY)     { console.error('CLARA_API_KEY not set — add it to /opt/clara/.env'); process.exit(1); }

function signTgState(chatId) {
  return createHmac('sha256', CLARA_API_KEY).update(`tg:${chatId}`).digest('hex');
}

// Verify and extract chat_id from a tg OAuth state string ("tg:{chatId}:{sig}")
function parseTgState(state) {
  if (!state?.startsWith('tg:')) return null;
  const parts = state.split(':');
  const chatId = parts[1];
  const sig    = parts[2];
  if (!chatId || !sig) return null;
  if (!/^\d{5,20}$/.test(chatId)) return null;
  const expected = signTgState(chatId);
  return sig === expected ? chatId : null;
}

// Signed pickup tokens — link an MCP onboard_clara call to the QBO OAuth round-trip.
// Format in OAuth state: "pickup:<token>:<hmac-16>"
function signPickup(token) {
  return createHmac('sha256', CLARA_API_KEY).update(`pickup:${token}`).digest('hex').slice(0, 16);
}

function parsePickupState(state) {
  if (!state?.startsWith('pickup:')) return null;
  const [, token, sig] = state.split(':');
  if (!token || !sig || !/^[0-9a-f]{48}$/.test(token)) return null;
  return sig === signPickup(token) ? token : null;
}

import {
  getFinancialBriefing,
  getCashForecast,
  getMarginAnalysis,
  identifyValueGaps,
  getArAlerts,
  askClara,
  onboardClara,
  getVigilScore,
} from './src/tools.js';

import { landingPage, connectPage, connectedPage, demoPage, privacyPage, termsPage, pricingPage } from './src/pages.js';
import { handleUpdate, registerWebhook, invalidateSession, webhookSecret, startVigilQuestions, rescheduleFollowUps } from './src/telegram.js';
import { getChatEvents } from './src/events.js';
import { bootstrapSchema, query } from './src/db.js';
import { migrateFileWikis } from './src/wiki.js';
import { validateKey, createKey, revokeKeysForChat, createPickupToken, storePickupKey, claimPickup } from './src/keys.js';
import { buildWikiContext, runSnapshotCurator, updatePricingPage } from './src/curator.js';

// ── Tool definitions ─────────────────────────────────────────────────────────

const TOOLS = [
  {
    name: 'onboard_clara',
    description: "CALL THIS FIRST when the user has not yet connected Vigil to their business, or when they say anything like 'set up Vigil', 'connect my books', 'get started with Vigil', or 'what can Vigil do for me'. Ask the user for their name, business type, biggest financial concern, and approximate annual revenue — then call this tool. Vigil will return a personalised first insight and a link to connect their QuickBooks.",
    inputSchema: {
      type: 'object',
      required: ['owner_name', 'business_type', 'biggest_concern'],
      properties: {
        owner_name:        { type: 'string', description: "The business owner's first name." },
        business_type:     { type: 'string', description: 'Type of business, e.g. plumbing contractor, marketing agency, bakery, gym.' },
        biggest_concern:   { type: 'string', description: "The owner's single biggest financial concern right now, in their own words." },
        annual_revenue:    { type: 'string', description: 'Approximate annual revenue, e.g. "$800K" or "about 1.2 million". Optional.' },
      },
    },
  },
  {
    name: 'get_financial_briefing',
    description: 'Morning financial briefing: cash position, revenue trend, and the single most urgent alert for the business. Call this for daily summaries or when the owner asks how things are going.',
    inputSchema: {
      type: 'object',
      properties: {
        business_id: { type: 'string', description: 'Business identifier. Defaults to CLARA_BUSINESS_ID env var.' },
      },
    },
  },
  {
    name: 'get_cash_forecast',
    description: 'Rolling 30/60/90-day cash forecast with upcoming payables and AR collections. Call this when the owner asks about cash, runway, or upcoming payments.',
    inputSchema: {
      type: 'object',
      properties: {
        business_id: { type: 'string' },
        days: { type: 'number', description: 'Forecast horizon in days (30, 60, or 90). Defaults to 90.' },
      },
    },
  },
  {
    name: 'get_margin_analysis',
    description: 'Gross and net margin breakdown by customer or segment, compared to industry benchmark. Call this when the owner asks about profitability, best/worst customers, or margin trends.',
    inputSchema: {
      type: 'object',
      properties: { business_id: { type: 'string' } },
    },
  },
  {
    name: 'identify_value_gaps',
    description: "Top 3 capability gaps with estimated annual dollar value of improvement. Cross-references operational maturity with financial performance. Call this when the owner asks where to focus, what's holding them back, or what's worth working on.",
    inputSchema: {
      type: 'object',
      properties: { business_id: { type: 'string' } },
    },
  },
  {
    name: 'get_ar_alerts',
    description: 'Overdue invoices ranked by urgency with suggested follow-up language. Call this when the owner asks about invoices, collections, or overdue payments.',
    inputSchema: {
      type: 'object',
      properties: { business_id: { type: 'string' } },
    },
  },
  {
    name: 'ask_clara',
    description: "Open-ended financial question answered with full business context. Use for any financial question not covered by the other tools, or when the owner asks something conversational like 'what should I focus on?' or 'am I doing OK?'",
    inputSchema: {
      type: 'object',
      required: ['question'],
      properties: {
        business_id: { type: 'string' },
        question: { type: 'string', description: "The owner's question in natural language." },
      },
    },
  },
  {
    name: 'claim_api_key',
    description: "Retrieve the per-user API key generated after a QuickBooks connection. Call this after the user has completed the QuickBooks OAuth flow using the connect_url from onboard_clara. Returns the key and ready-to-use config snippets. The key can only be claimed once within 1 hour of QBO connect.",
    inputSchema: {
      type: 'object',
      required: ['pickup_token'],
      properties: {
        pickup_token: { type: 'string', description: 'The pickup_token returned by onboard_clara.' },
      },
    },
  },
  {
    name: 'get_vigil_score',
    description: "The business owner's Vigil Score: a 1–5 composite across 8 financial capabilities (pricing, cash cycle, concentration risk, gross margin, labor efficiency, revenue mix, collection discipline, cost structure). Returns per-capability scores, dollar gaps vs best-in-class peers, and ONE scripted action to take. Call this when the owner asks how their business is doing overall, what their score is, or where to focus first.",
    inputSchema: {
      type: 'object',
      properties: {
        business_id: { type: 'string', description: 'Business identifier. Defaults to the caller\'s connected business.' },
      },
    },
  },
];

// ── Server factory (one per request for stateless HTTP) ───────────────────────

function createMcpServer(defaultBusinessId = null) {
  const server = new Server(
    { name: 'vigil', version: '1.0.0' },
    { capabilities: { tools: {}, resources: {}, prompts: {} } }
  );

  server.setRequestHandler(ListToolsRequestSchema,    async () => ({ tools: TOOLS }));
  server.setRequestHandler(ListResourcesRequestSchema, async () => ({ resources: [] }));
  server.setRequestHandler(ListPromptsRequestSchema,   async () => ({ prompts: [] }));

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: rawArgs } = request.params;
    const args = rawArgs || {};

    // Inject the caller's business_id from their API key when not explicitly provided
    if (!args.business_id && defaultBusinessId && name !== 'onboard_clara') {
      args.business_id = defaultBusinessId;
    }

    // Inject wiki context for all tools that take a business_id
    if (args.business_id && name !== 'onboard_clara') {
      try {
        const wikiCtx = await buildWikiContext(String(args.business_id));
        if (wikiCtx) args.wiki_context = wikiCtx;
      } catch (_) {}
    }

    try {
      let result;

      // claim_api_key — no business context needed
      if (name === 'claim_api_key') {
        const token = String(args.pickup_token || '').trim();
        if (!/^[0-9a-f]{48}$/.test(token)) {
          return { content: [{ type: 'text', text: JSON.stringify({ error: 'Invalid pickup_token format.' }) }], isError: true };
        }
        const pickup = await claimPickup(token);
        if (!pickup) {
          return { content: [{ type: 'text', text: JSON.stringify({
            error: 'Pickup token not found, already claimed, or expired (1-hour window). Complete QuickBooks OAuth first, then call claim_api_key within 1 hour.',
            action: 'Call onboard_clara again to get a fresh connect_url.',
          }) }], isError: true };
        }
        return { content: [{ type: 'text', text: JSON.stringify({
          api_key: pickup.raw_key,
          realm_id: pickup.realm_id,
          hermes_config: `mcp_servers:\n  clara:\n    url: https://clara.aerosensei.com/mcp\n    headers:\n      Authorization: "Bearer ${pickup.raw_key}"`,
          claude_desktop_config: JSON.stringify({ mcpServers: { clara: { url: 'https://clara.aerosensei.com/mcp', headers: { Authorization: `Bearer ${pickup.raw_key}` } } } }, null, 2),
          note: 'Save this key — it cannot be retrieved again. Reconfigure your MCP client with it, then call any Vigil tool normally.',
        }) }] };
      }

      switch (name) {
        case 'onboard_clara': {
          result = await onboardClara(args);
          // Generate a pickup token so MCP callers can claim their key after QBO connect
          // without manual copy-paste from the browser.
          const pickupToken = await createPickupToken();
          result.next_step.connect_url = `https://clara.aerosensei.com/connect?pickup=${pickupToken}`;
          result.next_step.pickup_token = pickupToken;
          result.next_step.pickup_instructions =
            'After opening connect_url and completing QuickBooks authorisation, call claim_api_key with this pickup_token to retrieve your personal API key. The token is valid for 1 hour.';
          break;
        }
        case 'get_financial_briefing': result = await getFinancialBriefing(args); break;
        case 'get_cash_forecast':      result = await getCashForecast(args); break;
        case 'get_margin_analysis':    result = await getMarginAnalysis(args); break;
        case 'identify_value_gaps':    result = await identifyValueGaps(args); break;
        case 'get_ar_alerts':          result = await getArAlerts(args); break;
        case 'ask_clara':              result = await askClara(args); break;
        case 'get_vigil_score':        result = await getVigilScore(args); break;
        default:
          return { content: [{ type: 'text', text: `Unknown tool: ${name}` }], isError: true };
      }

      // Pattern 3: master key or key with no realm_id → data is synthetic. Warn the caller.
      if (!defaultBusinessId && name !== 'onboard_clara') {
        result._demo_warning = 'This response uses demo data (acme-plumbing fixture). To see real business data, complete QuickBooks OAuth via onboard_clara → connect_url, then call claim_api_key and reconfigure your MCP client with the returned key.';
      }

      // Fire-and-forget wiki updates keyed by business_id
      if (args.business_id && result?.raw) {
        setTimeout(() => runSnapshotCurator(String(args.business_id), name, result.raw), 0);
      }
      if (name === 'identify_value_gaps' && args.business_id && result?.raw?.service_pricing_gaps?.length > 0) {
        setTimeout(() => updatePricingPage(String(args.business_id), result.raw.service_pricing_gaps), 0);
      }

      return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
    } catch (err) {
      log('error', 'tool_error', { tool: name, error: err.message });
      return { content: [{ type: 'text', text: 'An error occurred processing this request.' }], isError: true };
    }
  });

  return server;
}

// ── Auth middleware ───────────────────────────────────────────────────────────

async function requireAuth(req, res, next) {
  const auth = req.headers['authorization'];
  if (!auth || !auth.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Unauthorized. Provide: Authorization: Bearer <your_vigil_key>' });
    return;
  }
  const token = auth.slice(7);

  // Per-user key (clr_ prefix) — look up in DB
  if (token.startsWith('clr_')) {
    const keyRecord = await validateKey(token).catch(() => null);
    if (!keyRecord) {
      res.status(401).json({ error: 'Invalid or revoked API key.' });
      return;
    }
    req.apiKeyRecord = keyRecord;
    return next();
  }

  // Master key — internal/admin use only (Hermes during migration, admin tooling)
  if (token === CLARA_API_KEY) {
    req.apiKeyRecord = { owner_label: 'master', chat_id: null, realm_id: null };
    return next();
  }

  res.status(401).json({ error: 'Unauthorized.' });
}

// ── Express app ───────────────────────────────────────────────────────────────

function log(level, msg, meta = {}) {
  console.log(JSON.stringify({ ts: new Date().toISOString(), level, msg, ...meta }));
}

const app = express();
app.use(express.json());
app.use(express.static(join(__dirname, 'public')));

// Security headers on all responses
app.use((_req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  next();
});

// CORS — MCP clients and clara.aerosensei.com only
app.use((req, res, next) => {
  const allowed = ['https://clara.aerosensei.com'];
  const origin = req.headers.origin;
  if (origin && allowed.includes(origin)) res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization,Mcp-Session-Id,Last-Event-Id');
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});

// Simple in-process rate limiter (no extra deps) — 60 req / 60s per IP
const _rateBuckets = new Map();
function rateLimit(maxPerMinute = 60) {
  return (req, res, next) => {
    const ip = req.ip;
    const now = Date.now();
    const bucket = _rateBuckets.get(ip) || { count: 0, reset: now + 60_000 };
    if (now > bucket.reset) { bucket.count = 0; bucket.reset = now + 60_000; }
    bucket.count++;
    _rateBuckets.set(ip, bucket);
    if (bucket.count > maxPerMinute) {
      return res.status(429).json({ error: 'Too many requests — slow down.' });
    }
    next();
  };
}

// Structured request logging
app.use((req, _res, next) => {
  log('info', 'request', { method: req.method, path: req.path, ip: req.ip });
  next();
});

app.get('/health', (_req, res) => res.json({ status: 'ok', server: 'clara-mcp', version: '1.0.0' }));

// ── Admin: live chat log viewer (key-protected) ───────────────────────────────

app.get('/admin/logs', (req, res) => {
  const auth = req.headers['authorization'];
  if (!auth || auth !== `Bearer ${CLARA_API_KEY}`) {
    res.setHeader('WWW-Authenticate', 'Bearer');
    return res.status(401).send('Unauthorized — use Authorization: Bearer header');
  }
  const events = getChatEvents().slice().reverse(); // newest first
  const rows = events.map(e => {
    const color = e.event?.includes('error') ? '#f87171' : e.event === 'tg_message' ? '#86efac' : '#93c5fd';
    return `<tr style="border-bottom:1px solid #333">
      <td style="color:#888;white-space:nowrap;padding:4px 12px 4px 0">${e.ts?.slice(11,19) || ''}</td>
      <td style="color:${color};padding:4px 12px 4px 0">${e.event || ''}</td>
      <td style="color:#e2e8f0;padding:4px 12px 4px 0">${e.chatId || ''}</td>
      <td style="color:#cbd5e1;padding:4px 0">${e.stage || e.text || JSON.stringify(e.fields || e.error || '')}</td>
    </tr>`;
  }).join('');
  res.setHeader('Content-Type', 'text/html');
  res.send(`<!DOCTYPE html><html><head><meta charset="utf-8"><title>Vigil — Chat Logs</title>
    <meta http-equiv="refresh" content="5">
    <style>body{background:#0f172a;color:#e2e8f0;font-family:monospace;font-size:13px;padding:24px}
    h2{color:#86efac;margin-bottom:16px}table{width:100%;border-collapse:collapse}</style></head>
    <body><h2>Vigil — Chat Events <span style="font-size:11px;color:#64748b">(auto-refreshes every 5s)</span></h2>
    <table>${rows || '<tr><td style="color:#64748b">No events yet</td></tr>'}</table></body></html>`);
});

app.get('/robots.txt', (_req, res) => {
  res.setHeader('Content-Type', 'text/plain');
  res.send('User-agent: *\nAllow: /\nDisallow: /mcp\nDisallow: /demo/run\nSitemap: https://clara.aerosensei.com/sitemap.xml\n');
});

app.get('/sitemap.xml', (_req, res) => {
  const now = new Date().toISOString().split('T')[0];
  res.setHeader('Content-Type', 'application/xml');
  res.send(`<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>https://clara.aerosensei.com/</loc><lastmod>${now}</lastmod><changefreq>weekly</changefreq><priority>1.0</priority></url>
  <url><loc>https://clara.aerosensei.com/demo</loc><lastmod>${now}</lastmod><changefreq>monthly</changefreq><priority>0.8</priority></url>
  <url><loc>https://clara.aerosensei.com/connect</loc><lastmod>${now}</lastmod><changefreq>monthly</changefreq><priority>0.7</priority></url>
  <url><loc>https://clara.aerosensei.com/pricing</loc><lastmod>${now}</lastmod><changefreq>monthly</changefreq><priority>0.6</priority></url>
  <url><loc>https://clara.aerosensei.com/privacy</loc><lastmod>${now}</lastmod><changefreq>yearly</changefreq><priority>0.3</priority></url>
  <url><loc>https://clara.aerosensei.com/terms</loc><lastmod>${now}</lastmod><changefreq>yearly</changefreq><priority>0.3</priority></url>
</urlset>`);
});

// ── Landing pages (public) ────────────────────────────────────────────────────

app.get('/', (_req, res) => {
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.send(landingPage());
});

app.get('/privacy', (_req, res) => {
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.send(privacyPage());
});

app.get('/terms', (_req, res) => {
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.send(termsPage());
});

app.get('/pricing', (_req, res) => {
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.send(pricingPage());
});

app.get('/connect', (req, res) => {
  const qbConfigured = !!(process.env.QUICKBOOKS_CLIENT_ID && process.env.QUICKBOOKS_CLIENT_SECRET);
  let qbAuthUrl = null;
  if (qbConfigured) {
    // Priority: Telegram state > MCP pickup state > random CSRF token
    let state = Math.random().toString(36).slice(2);

    const tgParam = req.query.tg; // format: "{chatId}.{sig}"
    if (tgParam) {
      const [chatId, sig] = String(tgParam).split('.');
      if (chatId && sig && /^\d{5,20}$/.test(chatId) && sig === signTgState(chatId)) {
        state = `tg:${chatId}:${sig}`;
      }
    }

    // MCP pickup param — generated by onboard_clara for non-Telegram callers.
    const pickupParam = req.query.pickup;
    if (!state.startsWith('tg:') && pickupParam && /^[0-9a-f]{48}$/.test(pickupParam)) {
      state = `pickup:${pickupParam}:${signPickup(pickupParam)}`;
    }

    const params = new URLSearchParams({
      client_id:     process.env.QUICKBOOKS_CLIENT_ID,
      response_type: 'code',
      scope:         'com.intuit.quickbooks.accounting',
      redirect_uri:  process.env.QUICKBOOKS_REDIRECT_URI || 'https://clara.aerosensei.com/auth/quickbooks/callback',
      state,
    });
    qbAuthUrl = `https://appcenter.intuit.com/connect/oauth2?${params}`;
  }
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.send(connectPage({ qbConfigured, qbAuthUrl }));
});

app.get('/auth/quickbooks/callback', async (req, res) => {
  const { code, realmId, state, error } = req.query;
  if (error || !code || !realmId) {
    res.redirect('/connect?error=cancelled');
    return;
  }
  try {
    const credentials = Buffer.from(
      `${process.env.QUICKBOOKS_CLIENT_ID}:${process.env.QUICKBOOKS_CLIENT_SECRET}`
    ).toString('base64');
    const tokenRes = await fetch('https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer', {
      method: 'POST',
      headers: {
        'Content-Type':  'application/x-www-form-urlencoded',
        'Authorization': `Basic ${credentials}`,
        'Accept':        'application/json',
      },
      body: new URLSearchParams({
        grant_type:   'authorization_code',
        code,
        redirect_uri: process.env.QUICKBOOKS_REDIRECT_URI || 'https://clara.aerosensei.com/auth/quickbooks/callback',
      }),
    });
    if (!tokenRes.ok) {
      log('error', 'qb_token_exchange_failed', { status: tokenRes.status });
      res.redirect('/connect?error=token');
      return;
    }
    const tokens = await tokenRes.json();

    // Persist tokens to DB
    await query(
      `INSERT INTO qbo_tokens (realm_id, access_token, refresh_token, expires_at, refresh_expires_at)
       VALUES ($1, $2, $3, NOW() + ($4 || ' seconds')::interval, NOW() + ($5 || ' seconds')::interval)
       ON CONFLICT (realm_id) DO UPDATE SET
         access_token       = EXCLUDED.access_token,
         refresh_token      = EXCLUDED.refresh_token,
         expires_at         = EXCLUDED.expires_at,
         refresh_expires_at = EXCLUDED.refresh_expires_at,
         updated_at         = NOW()`,
      [realmId, tokens.access_token, tokens.refresh_token, tokens.expires_in, tokens.x_refresh_token_expires_in]
    );

    // Upsert business record
    await query(
      `INSERT INTO businesses (id, realm_id) VALUES ($1, $1)
       ON CONFLICT (realm_id) DO NOTHING`,
      [realmId]
    );

    // Link to Telegram session if OAuth state carries a verified chat_id
    const linkedChatId = parseTgState(state);
    if (linkedChatId) {
      // Read name, business type, and old fixture business_id before overwriting
      const { rows: sessionRows } = await query(
        'SELECT business_id, owner_name, business_type FROM telegram_sessions WHERE chat_id = $1',
        [BigInt(linkedChatId)]
      );
      const oldBusinessId = sessionRows[0]?.business_id || null;
      const ownerName     = sessionRows[0]?.owner_name   || null;
      const businessType  = sessionRows[0]?.business_type || null;

      await query(
        `UPDATE telegram_sessions
         SET business_id = $1, stage = 'active', updated_at = NOW()
         WHERE chat_id = $2`,
        [realmId, BigInt(linkedChatId)]
      );
      invalidateSession(Number(linkedChatId));

      // Bug fix 1: carry owner name + business type into the businesses table so
      // the QB adapter can greet the user by name after connecting.
      await query(
        `UPDATE businesses SET owner_name = $1, business_type = $2, updated_at = NOW()
         WHERE realm_id = $3`,
        [ownerName, businessType, realmId]
      );

      // Bug fix 2: migrate wiki pages from the fixture business_id to the real realmId
      // so the advisor retains memory of the onboarding conversation after QB connect.
      if (oldBusinessId && oldBusinessId !== realmId) {
        await query(
          `INSERT INTO business_wikis (business_id, pages, updated_at)
           SELECT $2, pages, NOW() FROM business_wikis WHERE business_id = $1
           ON CONFLICT (business_id) DO UPDATE SET pages = EXCLUDED.pages, updated_at = NOW()`,
          [oldBusinessId, realmId]
        ).catch(err => log('warn', 'wiki_migration_failed', { error: err.message }));
      }

      const botToken = process.env.TELEGRAM_BOT_TOKEN;
      if (botToken) {
        await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id:    Number(linkedChatId),
            text:       '✅ <b>QuickBooks connected!</b>\n\nI can now see your actual numbers. Tap <b>📊 Morning Briefing</b> for your first real insight.',
            parse_mode: 'HTML',
          }),
        }).catch(err => log('warn', 'tg_notify_failed', { error: err.message }));
      }
      log('info', 'qb_telegram_linked', { realmId, chatId: linkedChatId });
    }

    // Revoke any existing keys for this chat before issuing a fresh realm-scoped one.
    // This cleans up stale fixture keys generated via /apikey before QBO was connected.
    if (linkedChatId) {
      await revokeKeysForChat(Number(linkedChatId));
    }

    // Generate a per-user API key for this connection
    const ownerLabel = linkedChatId ? `Telegram user ${linkedChatId}` : `QBO realm ${realmId}`;
    const { raw: userKey, prefix } = await createKey({ ownerLabel, chatId: linkedChatId ? Number(linkedChatId) : null, realmId });
    log('info', 'qb_connected', { realmId, linkedChatId, keyPrefix: prefix });

    // If this came from the Telegram bot, push the key and config into their chat.
    // We do this because the user will likely close the browser tab immediately after
    // seeing the "connected" page without copying the key.
    if (linkedChatId && process.env.TELEGRAM_BOT_TOKEN) {
      const keyMsg =
        `🔑 <b>Your Vigil API key</b>\n\n` +
        `<code>${userKey}</code>\n\n` +
        `⚠️ <b>Save this — it won't be shown again.</b>\n\n` +
        `<b>Add to Claude Desktop</b> (<code>claude_desktop_config.json</code>):\n` +
        `<pre>{\n  "mcpServers": {\n    "vigil": {\n      "url": "https://clara.aerosensei.com/mcp",\n      "headers": {\n        "Authorization": "Bearer ${userKey}"\n      }\n    }\n  }\n}</pre>\n\n` +
        `<b>Add to Hermes</b> (<code>~/.hermes/config.yaml</code>):\n` +
        `<pre>mcp_servers:\n  vigil:\n    url: https://clara.aerosensei.com/mcp\n    headers:\n      Authorization: "Bearer ${userKey}"</pre>`;
      await fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: Number(linkedChatId), text: keyMsg, parse_mode: 'HTML' }),
      }).catch(err => log('warn', 'tg_key_send_failed', { error: err.message }));
    }

    // Start the Vigil scoring question flow in Telegram (3s delay so key message arrives first)
    if (linkedChatId && process.env.TELEGRAM_BOT_TOKEN) {
      setTimeout(() =>
        startVigilQuestions(process.env.TELEGRAM_BOT_TOKEN, Number(linkedChatId))
          .catch(err => log('warn', 'vigil_questions_failed', { error: err.message })),
        3000
      );
    }

    // If this came from an MCP pickup flow, store the key so claim_api_key can return it.
    const pickupToken = parsePickupState(state);
    if (pickupToken) {
      await storePickupKey(pickupToken, userKey, realmId).catch(err =>
        log('warn', 'pickup_store_failed', { error: err.message })
      );
      log('info', 'qb_pickup_stored', { realmId, pickupToken: pickupToken.slice(0, 8) + '…' });
    }

    const vt = makeViewToken();
    const keyParam = `&k=${encodeURIComponent(userKey)}`;
    res.redirect(linkedChatId
      ? `/connected?via=telegram&vt=${vt}${keyParam}`
      : `/connected?vt=${vt}${keyParam}`);
  } catch (err) {
    log('error', 'qb_callback_error', { error: err.message });
    res.redirect('/connect?error=server');
  }
});

// View token: HMAC of 5-minute window — valid for current + previous window (~10 min total)
function makeViewToken() {
  const window = Math.floor(Date.now() / 300_000);
  return createHmac('sha256', CLARA_API_KEY).update(`view:${window}`).digest('hex').slice(0, 16);
}
function validViewToken(tok) {
  if (!tok) return false;
  const window = Math.floor(Date.now() / 300_000);
  const cur  = createHmac('sha256', CLARA_API_KEY).update(`view:${window}`).digest('hex').slice(0, 16);
  const prev = createHmac('sha256', CLARA_API_KEY).update(`view:${window - 1}`).digest('hex').slice(0, 16);
  return tok === cur || tok === prev;
}

app.get('/connected', (req, res) => {
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  const viaTelegram = req.query.via === 'telegram';
  // Only show the key if this request came directly from a valid OAuth callback
  const apiKey = validViewToken(req.query.vt) ? (req.query.k || null) : null;
  res.send(connectedPage({ apiKey, businessName: null, viaTelegram }));
});

app.get('/demo', (_req, res) => {
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.send(demoPage());
});

// ── Demo API (public, fixture allowlist only) ─────────────────────────────────

const DEMO_BUSINESSES = new Set(['acme-plumbing', 'riverside-consulting', 'metro-bakery', 'peak-fitness', 'summit-hvac']);
const DEMO_TOOLS      = new Set(['get_financial_briefing', 'get_cash_forecast', 'get_margin_analysis', 'identify_value_gaps', 'get_ar_alerts', 'ask_clara']);

app.post('/demo/run', rateLimit(20), async (req, res) => {
  const { business_id, tool, question } = req.body || {};
  const bid = String(business_id || '').trim().toLowerCase();
  const t   = String(tool || '').trim();

  if (!DEMO_BUSINESSES.has(bid)) return res.status(400).json({ error: 'Invalid business' });
  if (!DEMO_TOOLS.has(t))        return res.status(400).json({ error: 'Invalid tool' });

  try {
    const args = { business_id: bid };
    let result;
    switch (t) {
      case 'get_financial_briefing': result = await getFinancialBriefing(args); break;
      case 'get_cash_forecast':      result = await getCashForecast(args); break;
      case 'get_margin_analysis':    result = await getMarginAnalysis(args); break;
      case 'identify_value_gaps':    result = await identifyValueGaps(args); break;
      case 'get_ar_alerts':          result = await getArAlerts(args); break;
      case 'ask_clara':              result = await askClara({ ...args, question: String(question || '').trim() }); break;
    }
    res.json({ ok: true, result });
  } catch (err) {
    log('error', 'demo_error', { tool: t, business_id: bid, error: err.message });
    res.status(500).json({ error: 'Something went wrong — please try again.' });
  }
});

// ── Telegram webhook ─────────────────────────────────────────────────────────

app.post('/telegram/webhook', rateLimit(120), (req, res) => {
  const incomingSecret = req.headers['x-telegram-bot-api-secret-token'];
  if (!incomingSecret || incomingSecret !== webhookSecret()) {
    return res.status(401).end();
  }
  res.sendStatus(200); // acknowledge immediately so Telegram doesn't retry
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (token) handleUpdate(req.body, token).catch(console.error);
});

// MCP Streamable HTTP endpoint — stateless (new server instance per request)
app.post('/mcp', requireAuth, async (req, res) => {
  const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined });
  const server = createMcpServer(req.apiKeyRecord?.realm_id || null);
  res.on('close', () => { transport.close(); server.close(); });
  await server.connect(transport);
  await transport.handleRequest(req, res, req.body);
});

// SSE stream endpoint (for clients that open a persistent event stream)
app.get('/mcp', requireAuth, async (req, res) => {
  const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined });
  const server = createMcpServer(req.apiKeyRecord?.realm_id || null);
  res.on('close', () => { transport.close(); server.close(); });
  await server.connect(transport);
  await transport.handleRequest(req, res);
});

// Session teardown (required by MCP spec)
app.delete('/mcp', requireAuth, (_req, res) => res.status(200).send());

app.listen(PORT, '127.0.0.1', async () => {
  console.log(`Vigil MCP HTTP server listening on 127.0.0.1:${PORT}`);
  console.log(`Public endpoint: https://clara.aerosensei.com/mcp`);
  console.log(`Health check:    https://clara.aerosensei.com/health`);

  // DB schema + file wiki migration (idempotent)
  try {
    await bootstrapSchema();
    await migrateFileWikis();
  } catch (err) {
    console.error('DB startup error:', err.message);
  }

  if (process.env.TELEGRAM_BOT_TOKEN) {
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    // Retry webhook registration up to 5 times with 10s backoff (handles DNS blips on startup)
    (async () => {
      for (let attempt = 1; attempt <= 5; attempt++) {
        try {
          await registerWebhook(botToken);
          break;
        } catch (err) {
          if (attempt < 5) {
            console.error(`Webhook registration attempt ${attempt} failed: ${err.message} — retrying in 10s`);
            await new Promise(r => setTimeout(r, 10_000));
          } else {
            console.error('Webhook registration failed after 5 attempts:', err.message);
          }
        }
      }
      // Reschedule any follow-ups that were pending before the restart
      await rescheduleFollowUps(botToken);
    })();
  } else {
    console.log('TELEGRAM_BOT_TOKEN not set — Telegram bot disabled');
  }
});
