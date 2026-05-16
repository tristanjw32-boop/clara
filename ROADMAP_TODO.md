# Vigil — Roadmap & Open TODO

---

## Phase 1A — Real Data (Next)

### Requires manual action first

- [x] **Local Postgres database** — `clara` DB created on VPS, `clara_user` provisioned, `DATABASE_URL` in `.env`, added to nightly backup

- [ ] **Register QuickBooks developer app** at developer.intuit.com
  - App name: Clara by Well Drilled
  - Scopes: `com.intuit.quickbooks.accounting` (read-only)
  - Redirect URI: `https://vigilcfo.com/auth/quickbooks/callback`
  - Copy `QUICKBOOKS_CLIENT_ID` + `QUICKBOOKS_CLIENT_SECRET` → `/opt/clara/.env`

### Ready to build (once credentials above are in .env)

- [ ] DB schema — create tables in Neon:
  - `businesses`, `qbo_tokens`, `financial_snapshots`, `customers`, `ar_invoices`, `capability_scores`
  - `telegram_sessions` — persists chat state across server restarts (replaces in-memory Map)
  - `customer_wikis` — JSONB, one row per user (replaces file-based `/opt/clara/wikis/`)

- [ ] Migrate file-based wikis → `customer_wikis` table

- [ ] Persist Telegram sessions to DB (replaces in-memory `sessions` Map)

- [ ] QuickBooks OAuth flow
  - `GET /auth/quickbooks` → redirect to QBO
  - `GET /auth/quickbooks/callback` → exchange code, store tokens
  - Token refresh (QBO tokens expire 1hr, refresh token lasts 100 days)

- [ ] Real data adapter `src/adapters/quickbooks.js`
  - Fetches P&L, Balance Sheet, AR Aging from QBO Reports API
  - Normalises to same schema as fixture JSON files
  - `src/tools.js` stays unchanged — still calls `loadBusiness(id)`

- [ ] `src/data.js` router
  - `CLARA_DATA_SOURCE=synthetic` → fixtures (current)
  - `CLARA_DATA_SOURCE=quickbooks` → live QBO data

- [ ] `/delete_my_data` Telegram command
  - Drops `customer_wikis` + `telegram_sessions` rows for that `chat_id`

- [ ] 12-month inactivity expiry cron (drop wikis not updated in 12 months)

- [ ] Privacy policy page at `vigilcfo.com/privacy`

---

## Phase 1B — Telegram Polish (can be done in parallel)

- [ ] Custom stickies — `/sticky <question>` saves a button to the keyboard
  - Persisted in `telegram_sessions.custom_stickies` (needs DB first)

- [ ] `/delete_my_data` command (see above)

- [ ] Smarter follow-up message — reads wiki before sending check-in
  (currently generic; should reference something specific from last session)

- [ ] Daily morning briefing opt-in — user asks Clara to send briefing every morning

---

## Phase 1C — MCP Channel (Hermes / ClawHub listing)

- [ ] Test Hermes connection end-to-end (config already documented in NEXT_SESSION.md)
- [ ] Submit to ClawHub marketplace
- [ ] Submit to Hermes skill directory
- [ ] SKILL.md spec for npm distribution
- [ ] x402 micropayment monetization (per-tool call billing)

---

## Phase 2 — Capability Assessment

- [ ] Maturity rubrics × financial data
- [ ] Value gap quantification (cross-reference operational score with financial performance)
- [ ] Industry benchmark expansion (currently hard-coded in fixtures)

---

## Phase 3 — Workstream Execution

- [ ] Team check-ins (ShieldReady pattern — distributed assessment)
- [ ] Progress synthesis across team responses
- [ ] Commitment tracking (did the owner act on last week's Key Action Items?)

---

## Phase 4 — Agent Deployment

- [ ] Agent builder UI
- [ ] Governance layer + kill switches
- [ ] Audit trail per agent action

---

## Phase 5 — Business OS

- [ ] Full orchestration layer
- [ ] White-label / reseller model
- [ ] Marketplace for Clara-powered advisors

---

## Urgent / Security

- [ ] **Rotate QuickBooks ClientSecret** — shared in chat session, may be logged. Go to developer.intuit.com → your app → Keys & credentials → regenerate, then update `QUICKBOOKS_CLIENT_SECRET` in `/opt/clara/.env` and restart clara-mcp.

---

## Infrastructure & Compliance (ongoing)

- [x] GitHub repo for Vigil (`.gitignore` already in place, repo live under tristanjw32-boop/clara)
- [ ] Rate limiting on `/telegram/webhook` endpoint (currently unprotected)
- [ ] Cloudflare rate limiting audit for `/demo/run`
- [ ] Privacy policy (required before real user data is stored)
- [ ] pgcrypto AES-256 for `customer_wikis.content` if multi-tenant DB later
- [ ] Move `pm2-root.service` review — confirm startup behaviour after next reboot
