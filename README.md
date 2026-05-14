# Clara — AI Financial Advisor for Small Business

Clara is an AI CFO that watches your business finances around the clock, surfaces problems before they become crises, and gives specific, actionable advice — not generic dashboards.

She connects to QuickBooks Online and delivers intelligence through two channels:
- **Telegram bot** — morning briefings, cash forecasts, AR alerts, value gaps, and free-form chat
- **MCP server** — plugs into any MCP-compatible AI agent (Hermes, OpenClaw, Claude Desktop)

Live at [clara.aerosensei.com](https://clara.aerosensei.com)

---

## What Clara does

### 6 tools

| Tool | What it answers |
|------|----------------|
| `get_financial_briefing` | Morning snapshot: cash, revenue, margin, overdue AR, imminent bills — with named customers and vendors |
| `get_cash_forecast` | 30/60/90-day cash projection accounting for open AR collections and upcoming payables |
| `get_margin_analysis` | Gross and net margin vs. prior year and industry benchmark, with trend diagnosis |
| `get_ar_alerts` | Ranked list of overdue invoices by urgency, with a ready-to-send collection message for the worst one |
| `identify_value_gaps` | Underpricing detection by service line (avg rate vs. market benchmark, annual gap in dollars) + capability gaps |
| `ask_clara` | Free-form financial question answered with full business context injected |

### What makes it different from a dashboard

- **Push, not pull** — Telegram bot sends the briefing, you don't have to remember to check
- **Named, not aggregated** — "Paulsen Medical owes $954 and is 2 days overdue" not "AR is elevated"
- **Actionable, not descriptive** — every response ends with numbered actions, specific amounts, and deadlines
- **Continuous** — wiki curator builds a memory of the business over time; responses get more personalised as context accumulates

---

## Architecture

```
QuickBooks Online (sandbox or production)
        │
        │  OAuth 2.0 (access + refresh tokens stored in Postgres)
        ▼
┌─────────────────────────────────────────┐
│         clara-mcp  (port 3030)          │
│                                         │
│  src/adapters/quickbooks.js             │
│   ├── Bank account balances (Account query)
│   ├── Open invoices / AR (Invoice query)│
│   ├── Open bills / payables (Bill query)│
│   ├── P&L reports (ProfitAndLoss report)│
│   └── Service rates (Invoice line query)│
│                                         │
│  src/tools.js  — 6 tool handlers        │
│  src/analysis.js  — Claude Haiku layer  │
│  src/telegram.js  — Telegram bot        │
│  src/wiki.js  — Karpathy wiki pattern   │
└─────────────────────────────────────────┘
        │                    │
        ▼                    ▼
  MCP HTTP/SSE          Telegram Bot
  (Hermes, OpenClaw,    (@ClaraCFO_bot)
   Claude Desktop)
```

### Data layer

- **Database**: Postgres (`clara` DB on VPS)
  - `qbo_tokens` — OAuth access/refresh tokens per realm_id
  - `telegram_sessions` — chat state, stage, business_id, owner_name
  - `businesses` — QBO realm_id → business metadata
  - `customer_wikis` — Karpathy-style JSONB memory per Telegram user
- **Fixtures**: 5 synthetic business profiles in `/fixtures/` for demo/testing
- **Routing**: `loadBusiness(id)` checks if id is a fixture name or a QBO realm_id; live data if realm_id found in `qbo_tokens`

### QBO data sources

Clara uses the QBO Query API (not the Reports API) for reliability:

| Data | QBO Query |
|------|-----------|
| Cash | `SELECT CurrentBalance FROM Account WHERE AccountType = 'Bank'` |
| Open AR | `SELECT * FROM Invoice WHERE Balance > '0'` |
| Open bills | `SELECT * FROM Bill WHERE Balance > '0'` |
| Service rates | `SELECT Line FROM Invoice WHERE TxnDate >= [90d ago]` — aggregated by item |
| P&L | `ProfitAndLoss` report (30d, 90d, prior year) |

---

## Connecting to Clara

### Claude Desktop

```json
{
  "mcpServers": {
    "clara": {
      "url": "https://clara.aerosensei.com/mcp",
      "headers": {
        "Authorization": "Bearer YOUR_CLARA_API_KEY"
      }
    }
  }
}
```

### Hermes

```yaml
mcp_servers:
  clara:
    url: https://clara.aerosensei.com/mcp
    headers:
      Authorization: "Bearer YOUR_CLARA_API_KEY"
```

### OpenClaw

```json
{
  "mcpServers": {
    "clara": {
      "url": "https://clara.aerosensei.com/mcp",
      "headers": {
        "Authorization": "Bearer YOUR_CLARA_API_KEY"
      }
    }
  }
}
```

Get your API key at [clara.aerosensei.com/connect](https://clara.aerosensei.com/connect).

---

## Telegram bot

**Start**: message [@ClaraCFO_bot](https://t.me/ClaraCFO_bot) on Telegram.

**Onboarding**: Clara asks your name, business type, and biggest financial concern. Takes 2 minutes.

**Keyboard buttons** (shown after every response):
- 📊 Morning Briefing
- 💸 Cash Forecast
- 📈 Margin Analysis
- 🚨 AR Alerts
- 💡 Value Gaps

**Commands**:
- `/connect` — link your QuickBooks account
- `/delete_my_data` — removes all stored data (sessions + wiki)

**Wiki curator**: after 5 minutes of idle time, Clara synthesises the conversation into a structured memory (business profile, psychology, action tracker, conversation log). This context is injected into every subsequent interaction, making responses progressively more personalised.

---

## QuickBooks integration

### Connecting

1. In Telegram, send `/connect`
2. Tap the link → authorise Clara in QuickBooks
3. Clara sends "✅ QuickBooks connected!" in Telegram
4. All tool responses now use your real QBO data

### What Clara reads (read-only scope)

- Bank account balances
- Open and historical invoices (AR)
- Open and historical bills (AP)
- Profit & Loss (30-day, 90-day, prior year)
- Invoice line items (for service rate analysis)

Clara does **not** write to QuickBooks.

### Token management

Access tokens refresh automatically (QBO tokens expire in 1 hour; refresh token lasts 100 days). Token rotation is handled by `src/adapters/quickbooks.js:getValidToken()`.

---

## Industry benchmarks

Service rate benchmarks used in `identify_value_gaps` (UK/US SMB market):

| Service | Benchmark |
|---------|-----------|
| Pest Control | $65/hr |
| Trimming | $55/hr |
| Gardening | $55/hr |
| Installation | $80/hr |
| Design | $100/hr |
| Maintenance & Repair | $70/hr |
| Lighting | $75/hr |

These are in `src/adapters/quickbooks.js:SERVICE_BENCHMARKS`. Update them per market/region as needed.

---

## Local development

```bash
cp .env.example .env   # fill in ANTHROPIC_API_KEY, CLARA_API_KEY, DATABASE_URL
                        # QUICKBOOKS_CLIENT_ID, QUICKBOOKS_CLIENT_SECRET, TELEGRAM_BOT_TOKEN
npm install
node server-http.js    # HTTP server on localhost:3030
# or
node server.js         # stdio MCP server (for local agent testing)
```

Test against fixtures:
```bash
node test.js acme-plumbing get_financial_briefing
node test.js metro-bakery get_cash_forecast
node test.js peak-fitness identify_value_gaps
```

Health check:
```bash
curl https://clara.aerosensei.com/health
```

Admin event log (key-protected):
```bash
curl "https://clara.aerosensei.com/admin/logs?key=YOUR_CLARA_API_KEY"
```

---

## Key files

```
/
├── server-http.js          HTTP MCP server + Telegram webhook + OAuth routes
├── server.js               stdio MCP server (for npm/local use)
├── test.js                 CLI test runner
├── fixtures/               5 synthetic business profiles (demo/testing)
│   ├── acme-plumbing.json
│   ├── metro-bakery.json
│   ├── peak-fitness.json
│   ├── riverside-consulting.json
│   └── summit-hvac.json
└── src/
    ├── tools.js            6 tool handlers
    ├── analysis.js         Claude Haiku AI layer
    ├── data.js             Business loader (fixture or QBO router)
    ├── adapters/
    │   └── quickbooks.js   QBO OAuth, token refresh, data normalisation
    ├── telegram.js         Bot message handler, onboarding, keyboard
    ├── wiki.js             Karpathy wiki read/write (Postgres)
    ├── curator.js          Idle-trigger wiki synthesis
    ├── session-store.js    In-memory session cache + DB persistence
    ├── db.js               Postgres query wrapper
    ├── validate.js         Input validation + prompt injection protection
    ├── pages.js            HTML pages (landing, connect, connected, demo)
    └── events.js           In-memory chat event log (admin/logs)
```

---

## Roadmap

| Phase | What | Status |
|-------|------|--------|
| 0 — Intelligence Core | Fixtures + 6 MCP tools | ✅ Done |
| 1A — Real Data | QBO OAuth, live adapter, Telegram wiring | ✅ Done |
| 1B — Consumer Polish | Daily briefing opt-in, `/sticky` custom buttons, SMS (Twilio) | Next |
| 1C — MCP Channel | Hermes/ClawHub listing, npm distribution, x402 billing | Next |
| 2 — Capability Assessment | Maturity rubrics × financial data | Planned |
| 3 — Workstream Execution | Team check-ins, commitment tracking | Planned |
| 4 — Agent Deployment | Agent builder, governance, kill switches | Future |
| 5 — Business OS | Orchestration, white-label, marketplace | Future |

---

*Built by [Well Drilled Inc.](https://welldrilled.ai) · [clara.aerosensei.com](https://clara.aerosensei.com)*
