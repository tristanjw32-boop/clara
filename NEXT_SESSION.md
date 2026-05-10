# Clara — Session Log & Next Steps

---

## Session: 2026-05-10

### What we built

**Synthetic data layer** — 5 business fixture JSON files at `/opt/clara/fixtures/`:
| Fixture | Industry | Designed to trigger |
|---------|----------|---------------------|
| `acme-plumbing` | Trades | Margin drag from 2 slow-paying clients |
| `riverside-consulting` | Professional services | 1 unprofitable client (Dalton, losing $1.2K/90d), 1 near-unprofitable |
| `metro-bakery` | Food retail | Cash gap in ~3 days without AR collection |
| `peak-fitness` | Fitness | $9/class underpricing = $22.7K/year gap |
| `summit-hvac` | Trades | $6.1K/month in unrecovered warranty labour |

**MCP server** — 6 tools, two transports:
- `server.js` — stdio (for local/npm distribution)
- `server-http.js` — HTTP/SSE (live, port 3030, `clara.aerosensei.com`)

Tools: `get_financial_briefing`, `get_cash_forecast`, `get_margin_analysis`, `identify_value_gaps`, `get_ar_alerts`, `ask_clara`

**Security hardening:**
- `app-clara` service user (non-root, verified via `ps aux`)
- Input validation + allowlist on `business_id` (`src/validate.js`)
- Prompt injection protection on `ask_clara` question parameter
- `.gitignore` (`.env` protected before GitHub push)
- Structured JSON request logging in `server-http.js`
- `/opt/security/audit.sh` run — all 3 failures fixed

**Infrastructure:**
- PM2: `clara-mcp` (id 171), running as `app-clara`, port 3030
- Cloudflare Tunnel: `clara.aerosensei.com → localhost:3030`
- Health check: `https://clara.aerosensei.com/health`
- API key in `/opt/clara/.env` (CLARA_API_KEY)

**Notion pages created (under Clara parent):**
- Business Plan (full TAM, pricing, 5-year model, GTM)
- Product Roadmap (two-track: MCP + consumer, Phase 0–5)
- Marketplace Listing Strategy (ClawHub + Hermes submission, SKILL.md spec, x402 monetization, 30-minute hook design)

**CLAUDE.md updated:** MCP Server Security section added + `/security-review` documented + port 3030 added to port map.

---

## Current state

```
✅ clara-mcp running as app-clara on port 3030
✅ clara.aerosensei.com live through Cloudflare
✅ All 6 tools tested against all 5 fixtures
✅ Security audit clean (0 failures)
⏳ Hermes agent connection — NOT yet tested (Tristan to test in morning)
⏳ GitHub repo — not yet created
⏳ QuickBooks OAuth — not yet built (Phase 1A)
⏳ Neon PostgreSQL — not yet provisioned (needed for real data)
```

---

## Hermes connection test (do this first tomorrow)

Add to `~/.hermes/config.yaml`:
```yaml
mcp_servers:
  clara:
    url: https://clara.aerosensei.com/mcp
    headers:
      Authorization: "Bearer c75557a5600181b2f47ed91e1532583bffc0e30ef1cd3a57fc9eb4c84579752d"
```

Or Claude Desktop (`~/Library/Application Support/Claude/claude_desktop_config.json`):
```json
{
  "mcpServers": {
    "clara": {
      "url": "https://clara.aerosensei.com/mcp",
      "headers": {
        "Authorization": "Bearer c75557a5600181b2f47ed91e1532583bffc0e30ef1cd3a57fc9eb4c84579752d"
      }
    }
  }
}
```

Test prompts to try once connected:
- "Give me a financial briefing for acme-plumbing"
- "Which of metro-bakery's customers are unprofitable?"
- "What's the single most important thing summit-hvac should fix?"
- "What's the cash situation at metro-bakery?" (should trigger `get_cash_forecast` with gap warning)

What to watch for: does Hermes route to the right tool unprompted? Does the response read naturally when the agent relays it? Is anything in Clara's output format awkward for an agent to present?

---

## Next build step: QuickBooks OAuth (Phase 1A)

This is what turns Clara from a demo into something real. Without it, everything is synthetic.

**What to build:**
1. QuickBooks Online developer app registration (at developer.intuit.com)
   - App name: Clara by Well Drilled
   - Scopes needed: `com.intuit.quickbooks.accounting` (read-only)
   - Redirect URI: `https://clara.aerosensei.com/auth/quickbooks/callback`

2. OAuth flow in `server-http.js`:
   - `GET /auth/quickbooks` → redirect to QBO auth
   - `GET /auth/quickbooks/callback` → exchange code for tokens, store in DB
   - Token refresh logic (QBO tokens expire in 1 hour, refresh token lasts 100 days)

3. Neon Postgres database (provision at neon.tech):
   - Tables: `businesses`, `qbo_tokens`, `financial_snapshots`, `customers`, `ar_invoices`, `capability_scores`
   - `telegram_sessions`: `chat_id`, `stage`, `business_id`, `owner_name`, `muted`, `custom_stickies` (JSON), `follow_up_at`
   - `customer_wikis`: `chat_id`, `page` (filename), `content` (text), `updated_at` — replaces file-based `/opt/clara/wikis/`
     - Neon provides encryption at rest + point-in-time recovery — no extra work needed
     - Sensitive columns (`content`) should use `pgcrypto` AES-256 if multi-tenant isolation is required later
     - Migration: read all files from `/opt/clara/wikis/`, upsert into table, delete files
   - Add `/delete_my_data` Telegram command: drops `customer_wikis` + `telegram_sessions` rows for that `chat_id`
   - Add data retention: cron job to expire wikis where `updated_at < NOW() - INTERVAL '12 months'`
   - Privacy policy must document: what is stored, retention period, deletion mechanism
   - Connection string → `/opt/clara/.env` as `DATABASE_URL`

4. Real data adapter `src/adapters/quickbooks.js`:
   - Fetches P&L, Balance Sheet, AR Aging from QBO Reports API
   - Normalises into the same schema as the fixture JSON files
   - The tools in `src/tools.js` don't change — they still call `loadBusiness(id)`

5. Update `src/data.js` to route by `CLARA_DATA_SOURCE`:
   - `synthetic` → load from fixtures (current behaviour)
   - `quickbooks` → fetch from QBO API via stored tokens

**Estimated effort:** 1 session (3–4 hours)

---

## Roadmap context (from Notion)

| Phase | What | Timeline |
|-------|------|----------|
| 0 — Intelligence Core | Fixtures + MCP tools | ✅ Done |
| 1A — MCP Integration | QuickBooks OAuth, real data, Hermes/ClawHub listing | Next |
| 1B — Consumer Product | Onboarding, daily email (Resend), SMS (Twilio), web chat | Weeks 6–12 |
| 2 — Capability Assessment | Maturity rubrics × financial data, value gap quantification | Months 3–5 |
| 3 — Workstream Execution | Team check-ins, progress synthesis (ShieldReady pattern) | Months 5–9 |
| 4 — Agent Deployment | Agent builder, governance layer, kill switches | Months 9–15 |
| 5 — Business OS | Orchestration, marketplace, white-label | Months 15+ |

GTM priority: Hermes/ClawHub MCP channel first → accountant channel second.

---

## Key files

```
/opt/clara/
  server.js           ← stdio MCP server (for npm distribution)
  server-http.js      ← HTTP MCP server (live, port 3030)
  test.js             ← test runner: node test.js [business_id] [tool]
  src/
    data.js           ← fixture loader (will gain QB adapter)
    tools.js          ← 6 tool handlers
    analysis.js       ← Claude Haiku AI layer
    validate.js       ← input validation + prompt injection protection
  fixtures/           ← 5 synthetic business profiles
  .env                ← ANTHROPIC_API_KEY, CLARA_API_KEY, CLARA_BUSINESS_ID
  .gitignore          ← .env protected
/opt/eve/ecosystem.config.js  ← clara-mcp entry (uid: app-clara)
/etc/cloudflared/config.yml   ← clara.aerosensei.com → localhost:3030
/root/CLAUDE.md               ← MCP Security section added
```

## Quick health check

```bash
curl https://clara.aerosensei.com/health
pm2 show clara-mcp
```
