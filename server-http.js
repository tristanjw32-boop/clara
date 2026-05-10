#!/usr/bin/env node
/**
 * Clara MCP — HTTP transport (remote agents: Hermes, Claude Desktop, etc.)
 * Exposes the same 6 tools as server.js but over HTTP/SSE instead of stdio.
 *
 * Endpoint: POST/GET/DELETE https://clara.aerosensei.com/mcp
 * Auth:     Authorization: Bearer <CLARA_API_KEY>
 */
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

import {
  getFinancialBriefing,
  getCashForecast,
  getMarginAnalysis,
  identifyValueGaps,
  getArAlerts,
  askClara,
  onboardClara,
} from './src/tools.js';

import { landingPage, connectPage, connectedPage, demoPage } from './src/pages.js';
import { handleUpdate, registerWebhook } from './src/telegram.js';
import { getChatEvents } from './src/events.js';
import { bootstrapSchema, query } from './src/db.js';
import { migrateFileWikis } from './src/wiki.js';

// ── Tool definitions ─────────────────────────────────────────────────────────

const TOOLS = [
  {
    name: 'onboard_clara',
    description: "CALL THIS FIRST when the user has not yet connected Clara to their business, or when they say anything like 'set up Clara', 'connect my books', 'get started with Clara', or 'what can Clara do for me'. Ask the user for their name, business type, biggest financial concern, and approximate annual revenue — then call this tool. Clara will return a personalised first insight and a link to connect their QuickBooks.",
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
];

// ── Server factory (one per request for stateless HTTP) ───────────────────────

function createMcpServer() {
  const server = new Server(
    { name: 'clara', version: '1.0.0' },
    { capabilities: { tools: {}, resources: {}, prompts: {} } }
  );

  server.setRequestHandler(ListToolsRequestSchema,    async () => ({ tools: TOOLS }));
  server.setRequestHandler(ListResourcesRequestSchema, async () => ({ resources: [] }));
  server.setRequestHandler(ListPromptsRequestSchema,   async () => ({ prompts: [] }));

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;
    try {
      let result;
      switch (name) {
        case 'onboard_clara':          result = await onboardClara(args || {}); break;
        case 'get_financial_briefing': result = await getFinancialBriefing(args || {}); break;
        case 'get_cash_forecast':      result = await getCashForecast(args || {}); break;
        case 'get_margin_analysis':    result = await getMarginAnalysis(args || {}); break;
        case 'identify_value_gaps':    result = await identifyValueGaps(args || {}); break;
        case 'get_ar_alerts':          result = await getArAlerts(args || {}); break;
        case 'ask_clara':              result = await askClara(args || {}); break;
        default:
          return { content: [{ type: 'text', text: `Unknown tool: ${name}` }], isError: true };
      }
      return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
    } catch (err) {
      log('error', 'tool_error', { tool: name, error: err.message });
      return { content: [{ type: 'text', text: `Error: ${err.message}` }], isError: true };
    }
  });

  return server;
}

// ── Auth middleware ───────────────────────────────────────────────────────────

function requireAuth(req, res, next) {
  const auth = req.headers['authorization'];
  if (!auth || auth !== `Bearer ${CLARA_API_KEY}`) {
    res.status(401).json({ error: 'Unauthorized. Provide: Authorization: Bearer <CLARA_API_KEY>' });
    return;
  }
  next();
}

// ── Express app ───────────────────────────────────────────────────────────────

function log(level, msg, meta = {}) {
  console.log(JSON.stringify({ ts: new Date().toISOString(), level, msg, ...meta }));
}

const app = express();
app.use(express.json());
app.use(express.static(join(__dirname, 'public')));

// Structured request logging
app.use((req, _res, next) => {
  log('info', 'request', { method: req.method, path: req.path, ip: req.ip });
  next();
});

app.get('/health', (_req, res) => res.json({ status: 'ok', server: 'clara-mcp', version: '1.0.0' }));

// ── Admin: live chat log viewer (key-protected) ───────────────────────────────

app.get('/admin/logs', (req, res) => {
  if (req.query.key !== CLARA_API_KEY) {
    return res.status(401).send('Unauthorized');
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
  res.send(`<!DOCTYPE html><html><head><meta charset="utf-8"><title>Clara — Chat Logs</title>
    <meta http-equiv="refresh" content="5">
    <style>body{background:#0f172a;color:#e2e8f0;font-family:monospace;font-size:13px;padding:24px}
    h2{color:#86efac;margin-bottom:16px}table{width:100%;border-collapse:collapse}</style></head>
    <body><h2>Clara — Chat Events <span style="font-size:11px;color:#64748b">(auto-refreshes every 5s)</span></h2>
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
</urlset>`);
});

// ── Landing pages (public) ────────────────────────────────────────────────────

app.get('/', (_req, res) => {
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.send(landingPage());
});

app.get('/connect', (_req, res) => {
  const qbConfigured = !!(process.env.QUICKBOOKS_CLIENT_ID && process.env.QUICKBOOKS_CLIENT_SECRET);
  let qbAuthUrl = null;
  if (qbConfigured) {
    const params = new URLSearchParams({
      client_id:     process.env.QUICKBOOKS_CLIENT_ID,
      response_type: 'code',
      scope:         'com.intuit.quickbooks.accounting',
      redirect_uri:  process.env.QUICKBOOKS_REDIRECT_URI || 'https://clara.aerosensei.com/auth/quickbooks/callback',
      state:         Math.random().toString(36).slice(2),
    });
    qbAuthUrl = `https://appcenter.intuit.com/connect/oauth2?${params}`;
  }
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.send(connectPage({ qbConfigured, qbAuthUrl }));
});

app.get('/auth/quickbooks/callback', async (req, res) => {
  const { code, realmId, error } = req.query;
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

    log('info', 'qb_connected', { realmId });
    res.redirect('/connected');
  } catch (err) {
    log('error', 'qb_callback_error', { error: err.message });
    res.redirect('/connect?error=server');
  }
});

app.get('/connected', (_req, res) => {
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.send(connectedPage({ apiKey: CLARA_API_KEY, businessName: null }));
});

app.get('/demo', (_req, res) => {
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.send(demoPage());
});

// ── Demo API (public, fixture allowlist only) ─────────────────────────────────

const DEMO_BUSINESSES = new Set(['acme-plumbing', 'riverside-consulting', 'metro-bakery', 'peak-fitness', 'summit-hvac']);
const DEMO_TOOLS      = new Set(['get_financial_briefing', 'get_cash_forecast', 'get_margin_analysis', 'identify_value_gaps', 'get_ar_alerts', 'ask_clara']);

app.post('/demo/run', async (req, res) => {
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
    res.status(500).json({ error: err.message });
  }
});

// ── Telegram webhook ─────────────────────────────────────────────────────────

app.post('/telegram/webhook', async (req, res) => {
  res.sendStatus(200); // acknowledge immediately so Telegram doesn't retry
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (token) handleUpdate(req.body, token).catch(console.error);
});

// MCP Streamable HTTP endpoint — stateless (new server instance per request)
app.post('/mcp', requireAuth, async (req, res) => {
  const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined });
  const server = createMcpServer();
  res.on('close', () => { transport.close(); server.close(); });
  await server.connect(transport);
  await transport.handleRequest(req, res, req.body);
});

// SSE stream endpoint (for clients that open a persistent event stream)
app.get('/mcp', requireAuth, async (req, res) => {
  const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined });
  const server = createMcpServer();
  res.on('close', () => { transport.close(); server.close(); });
  await server.connect(transport);
  await transport.handleRequest(req, res);
});

// Session teardown (required by MCP spec)
app.delete('/mcp', requireAuth, (_req, res) => res.status(200).send());

app.listen(PORT, '127.0.0.1', async () => {
  console.log(`Clara MCP HTTP server listening on 127.0.0.1:${PORT}`);
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
    // Retry webhook registration up to 5 times with 10s backoff (handles DNS blips on startup)
    (async () => {
      for (let attempt = 1; attempt <= 5; attempt++) {
        try {
          await registerWebhook(process.env.TELEGRAM_BOT_TOKEN);
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
    })();
  } else {
    console.log('TELEGRAM_BOT_TOKEN not set — Telegram bot disabled');
  }
});
