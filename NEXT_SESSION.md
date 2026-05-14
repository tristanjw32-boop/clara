# Clara — Session Log & Next Steps

---

## Factual state as of 2026-05-14 (end of session)

### What was built and fixed in this session

**QBO adapter — major reliability overhaul (`src/adapters/quickbooks.js`):**
- `AgedReceivablesSummary` report permanently returns 403 (scope limitation) — replaced with direct `Invoice WHERE Balance > '0'` query. AR now shows all open invoices with customer names, amounts, and days overdue
- Cash balance was reading stale BS report — replaced with direct `Account WHERE AccountType = 'Bank'` query. Cash now reflects live bank balances immediately
- `upcoming_payables` was hardcoded `[]` — now populated from `Bill WHERE Balance > '0'` query with vendor name, amount, and `days_until_due`
- Added `service_rates` block: queries invoice lines for last 90 days, computes avg rate per service item, compares to hardcoded industry benchmarks, calculates annual gap per service

**Briefing tool — context overhaul (`src/tools.js`):**
- Briefing context now includes `ar_top_overdue_invoices` (top 5 by amount, with customer name + days), `bills_due_within_7_days` (vendor + amount + days_until_due), and `cash_after_imminent_bills`
- `most_urgent_alert` now detects cash crisis when total bills due ≤ 7 days exceeds current cash balance — fires "CASH CRISIS" alert with exact shortfall
- `identifyValueGaps` extended to use `service_rates` — computes per-service underpricing gaps with annual dollar value; leads prompt with service pricing gaps when present
- Fixed `due_in_days` → `days_until_due` in cash forecast filter

**UX fix (`server-http.js`, `src/pages.js`):**
- OAuth callback now redirects to `/connected?via=telegram` when a Telegram `chat_id` was in the OAuth state
- `/connected` page forks on `viaTelegram` param — Telegram users see a "Go back to Telegram" CTA, MCP users see the API key + config steps

**Error logging fix (`src/telegram.js`):**
- `runTool` catch block now calls `logChatEvent` with error message + stack — previously errors were swallowed silently

### QBO sandbox test results (2026-05-14)

Full act-by-act test run against sandbox company (realm `9341457056530179`):

| Act | Scenario | Score | Notes |
|-----|----------|-------|-------|
| 1 | Cash crisis: $2K cash vs $7K bills due in 5d | 9.5/10 | Named specific customers + vendors + exact gap |
| 2 | Posted 3 payments ($2,034), re-briefed | 9.5/10 | Cash updated, pivoted to new AR targets |
| 3 | 30 underpriced service jobs seeded | 10/10 | Found all 7 service lines, ranked by gap |
| 4 | 10 jobs at raised rate ($50), re-gapped | 9.5/10 | Tracked blended rate correctly, stepped advice forward |

**Overall: 9.6/10 — production-ready on these scenarios**

Clara's one remaining gap: no session-to-session memory of improvement. She doesn't say "your rate already moved from $35 to $40 — that's progress." This requires the wiki curator to track financial trends over time (future work).

### Sandbox data state
- Vendors created: Greenfield Payroll Services [58], ProTurf Equipment Rentals [59]
- Bills seeded: payroll $4,800 due 2026-05-19, equipment $2,200 due 2026-05-17
- Payments posted: Paulsen Medical $954.75, Geeta Kalapatapu $629.10, John Melton $450 (all to Checking)
- Pest Control invoices: 20 jobs at $35/hr + 10 jobs at $50/hr (all paid, historical)
- Trimming invoices: 10 jobs at $35/hr (all paid, historical)

---

## Factual state as of 2026-05-14

### Infrastructure
- **DB**: Local VPS Postgres at `localhost:5432/clara`, user `clara_user` — NOT Neon. Tables: `businesses`, `qbo_tokens`, `telegram_sessions`, `customer_wikis`
- **MCP server**: `clara-mcp` (PM2 id 171), running as `app-clara` on port 3030, health: `https://clara.aerosensei.com/health`
- **53 restarts over 3 days** — normal for an always-on process; no crashes

### What's fully built
- 6 MCP tools against 5 synthetic business fixtures
- Telegram bot: onboarding flow, keyboard buttons, session persistence in Postgres, wiki curator (Karpathy pattern), mute/unmute, follow-up scheduler, `/delete_my_data`
- QBO OAuth: `/connect` page → Intuit OAuth → `/auth/quickbooks/callback` → tokens stored in `qbo_tokens`
- QBO data adapter: `src/adapters/quickbooks.js` — fetches P&L, Balance Sheet, AR Aging, normalises to fixture schema
- `loadBusiness()` in `data.js` already routes by realm_id vs fixture ID — if `business_id` is in `qbo_tokens`, it calls the QBO adapter

### The actual gap: QBO is built but not wired to Telegram
The OAuth flow stores tokens, but a Telegram user can't use their real data because:
1. **`validateBusinessId()` in `validate.js`** has a hardcoded allowlist of the 5 fixture IDs — QBO realm_ids (e.g. `9341453122491234`) fail validation with an error. This is the P0 blocker.
2. **No Telegram ↔ QBO link**: The OAuth callback (`/auth/quickbooks/callback`) stores the `realm_id` in `qbo_tokens` but has no way to know which Telegram `chat_id` initiated the flow. There's no `/connect` command in the bot that generates a user-specific OAuth URL, and the callback doesn't write to `telegram_sessions`.
3. **Onboarding always assigns a fixture**: `onboardClara()` in `tools.js` always returns a synthetic fixture `business_id` — a QBO-connected user who goes through onboarding still gets fixture data.

### MVP gap list (priority order)
1. ✅ **`validateBusinessId()` allows realm_ids** — fixtures by name OR numeric 9–25 digit strings
2. ✅ **Telegram ↔ QBO linked** — HMAC-signed state param, callback updates `telegram_sessions`, fires confirmation
3. ✅ **`/connect` Telegram command** — sends signed link; `/connected?via=telegram` shows "Go back to Telegram" CTA
4. ✅ **QBO adapter reliable** — AR, cash, bills, service rates all via direct query API (not broken report API)
5. **Rotate QuickBooks ClientSecret** — was accidentally shared in a session transcript. Do at developer.intuit.com → Keys & OAuth → Rotate secret → update `/opt/clara/.env` → `pm2 restart clara-mcp --update-env`.

### First end-to-end test (do after rotating secret)
1. Verify redirect URI `https://clara.aerosensei.com/auth/quickbooks/callback` is listed in Intuit app
2. Send `/connect` in Telegram → tap link → authorise sandbox account
3. Expect "✅ QuickBooks connected!" back in Telegram
4. Tap 📊 Morning Briefing — should show sandbox QBO data, not fixture

### Backlog
- GitHub repo (none exists)
- `/sticky` custom keyboard shortcuts
- Rate limiting on `/telegram/webhook`
- Privacy policy page at `clara.aerosensei.com/privacy`
- Hermes/ClawHub marketplace submission (MCP key needed)
- Customer-level breakdown from QBO (requires transaction-level queries, noted as Phase 1B in adapter)

---

## Phase roadmap

| Phase | What | Status |
|-------|------|--------|
| 0 — Intelligence Core | Fixtures + MCP tools | ✅ Done |
| 1A — Real data | QBO OAuth, adapter, Telegram wiring | 🔶 OAuth built, Telegram wiring missing |
| 1B — Consumer Product | Daily email (Resend), SMS (Twilio), web chat | Not started |
| 2 — Capability Assessment | Maturity rubrics × financial data, value gap quantification | Not started |
| 3 — Workstream Execution | Team check-ins, progress synthesis | Not started |
| 4 — Agent Deployment | Agent builder, governance, kill switches | Not started |
| 5 — Business OS | Orchestration, marketplace, white-label | Not started |

GTM priority: Hermes/ClawHub MCP channel first → accountant channel second.

---

## Session: 2026-05-10 (afternoon continuation)

### What we fixed

**Telegram bot — multiple bugs resolved:**
- `getSession()` is async — calling it synchronously in timer callbacks (`scheduleCurator`, `scheduleFollowUp`) returned a Promise, not a session. Fixed: use `sessionCache.get(chatId)` directly in timer closures
- `runTool()` had the same async bug — `const session = getSession(chatId)` (no await) returned Promise, causing `logTurn(session, ...)` to throw. Fixed: moved session fetch to top of try block
- Duplicate `const session` declaration in `runTool` caused a SyntaxError that silenced the bot. Fixed.
- `buildWikiContext()` in `curator.js` called `readPage()` synchronously — `readPage` is async (Postgres), so all pages returned as Promises. `includes()` on a Promise threw. Fixed: made `buildWikiContext` async with `Promise.all`

**Telegram formatting — bold label format:**
- Telegram has no hanging indent support for bullet lists. Switched from `• bullet` to `**Label:** value` format throughout all 6 tool prompts
- Added `fmt()` auto-bold rules: `/Today:/g → <b>Today:</b>` and `^([A-Z][A-Za-z0-9 ,+%()-]{2,50}):\s → <b>$1:</b> `
- All tool prompts say "No bullet points" and use `**Bold Label:** value` format

**Owner name bug:**
- Business fixtures have their own owner names (e.g. metro-bakery owner = "James"). These were leaking into responses as the greeting name instead of the Telegram user's name
- Fixed: all 6 tools accept an `owner_name` parameter; `telegram.js` passes `session.ownerName` (set during onboarding); tools do `if (owner_name) business.owner = owner_name;`

**Webhook retry:**
- `registerWebhook` changed to throw on failure
- `server-http.js` wraps it in a 5-attempt retry loop with 10s backoff

**CLARA_API_KEY rotated:**
- Old key was accidentally shared in chat. New key regenerated via `node -e "require('crypto').randomBytes(32).toString('hex')"` and updated in `/opt/clara/.env`

**`/connected` page:**
- Removed artificial `max-width` from `.step-grid` — cards now fill the `connected-wrap` naturally (1100px max, padded)
- Added `min-width: 0; overflow: hidden` to `.step-card` to prevent grid blowout from long code strings
- Added favicon to connected page `<head>`

### Current state
- All 5 keyboard buttons working and returning correct owner name
- Free-text chat working with wiki context injection
- `/delete_my_data` command working
- `/connected` page layout fixed
- QuickBooks OAuth flow built and tested (sandbox) — QBO realm ID stored in `qbo_tokens` table but NOT yet wired to Telegram sessions (all users still get fixture data)

### Open: urgent
1. **Rotate QuickBooks ClientSecret** at developer.intuit.com — was accidentally shared in session transcript
2. **Wire QBO realm ID to Telegram sessions** — when user has authenticated QBO, route `business_id` to their live QBO adapter instead of fixture

### Open: backlog
- GitHub repo for Clara (none exists yet)
- `/sticky` command — custom keyboard shortcuts saved to DB
- Rate limiting on `/telegram/webhook` endpoint
- Privacy policy page at `clara.aerosensei.com/privacy`
- Submit to Hermes/ClawHub marketplace (MCP key needed)
- Consumer app Phase 2 (native QuickBooks Telegram bot, no MCP)

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
