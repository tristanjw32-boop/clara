/**
 * QuickBooks Online data adapter.
 * Fetches P&L, Balance Sheet, and AR Aging from the QBO Reports API
 * and normalises them into the same schema as the fixture JSON files.
 */

import { query } from '../db.js';

const QBO_BASE = {
  sandbox:    'https://sandbox-quickbooks.api.intuit.com',
  production: 'https://quickbooks.api.intuit.com',
};

function qboBase() {
  return process.env.QUICKBOOKS_ENVIRONMENT === 'production'
    ? QBO_BASE.production
    : QBO_BASE.sandbox;
}

// ── Token management ──────────────────────────────────────────────────────────

export async function getValidToken(realmId) {
  const { rows } = await query(
    'SELECT * FROM qbo_tokens WHERE realm_id = $1',
    [realmId]
  );
  if (rows.length === 0) throw new Error(`No QBO token for realmId ${realmId}`);
  const token = rows[0];

  // Refresh if expired (with 60s buffer)
  if (new Date(token.expires_at) < new Date(Date.now() + 60_000)) {
    return refreshToken(token);
  }
  return token.access_token;
}

async function refreshToken(token) {
  const credentials = Buffer.from(
    `${process.env.QUICKBOOKS_CLIENT_ID}:${process.env.QUICKBOOKS_CLIENT_SECRET}`
  ).toString('base64');

  const res = await fetch('https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer', {
    method: 'POST',
    headers: {
      'Content-Type':  'application/x-www-form-urlencoded',
      'Authorization': `Basic ${credentials}`,
      'Accept':        'application/json',
    },
    body: new URLSearchParams({
      grant_type:    'refresh_token',
      refresh_token: token.refresh_token,
    }),
  });

  if (!res.ok) throw new Error(`QBO token refresh failed: ${res.status}`);
  const data = await res.json();

  await query(
    `UPDATE qbo_tokens SET
       access_token  = $1,
       refresh_token = $2,
       expires_at    = NOW() + ($3 || ' seconds')::interval,
       refresh_expires_at = NOW() + ($4 || ' seconds')::interval,
       updated_at    = NOW()
     WHERE realm_id = $5`,
    [data.access_token, data.refresh_token, data.expires_in, data.x_refresh_token_expires_in, token.realm_id]
  );

  return data.access_token;
}

// ── QBO API fetcher ───────────────────────────────────────────────────────────

async function qboReport(realmId, reportName, params = {}) {
  const accessToken = await getValidToken(realmId);
  const qs = new URLSearchParams({ minorversion: '65', ...params }).toString();
  const url = `${qboBase()}/v3/company/${realmId}/reports/${reportName}?${qs}`;

  const res = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Accept':        'application/json',
    },
  });
  if (!res.ok) throw new Error(`QBO ${reportName} failed: ${res.status}`);
  return res.json();
}

// ── Report parsers ────────────────────────────────────────────────────────────

function findRow(rows, name) {
  for (const row of rows || []) {
    if (row.type === 'Data' && row.ColData?.[0]?.value?.toLowerCase().includes(name.toLowerCase())) {
      return parseFloat(row.ColData?.[1]?.value || '0');
    }
    if (row.Rows) {
      const found = findRow(row.Rows.Row, name);
      if (found !== null) return found;
    }
  }
  return null;
}

function sumSection(rows, sectionName) {
  for (const row of rows || []) {
    if (row.type === 'Section' && row.Header?.ColData?.[0]?.value?.toLowerCase().includes(sectionName.toLowerCase())) {
      const summary = row.Summary?.ColData?.[1]?.value;
      return parseFloat(summary || '0');
    }
    if (row.Rows) {
      const found = sumSection(row.Rows.Row, sectionName);
      if (found !== null) return found;
    }
  }
  return null;
}

// ── Main loader — returns fixture-compatible schema ───────────────────────────

export async function loadFromQuickBooks(realmId) {
  const today = new Date();
  const d30   = fmtDate(subDays(today, 30));
  const d60   = fmtDate(subDays(today, 60));
  const d90   = fmtDate(subDays(today, 90));
  const start = fmtDate(new Date(today.getFullYear(), 0, 1)); // Jan 1 this year
  const startPY = fmtDate(new Date(today.getFullYear() - 1, 0, 1));
  const endPY   = fmtDate(new Date(today.getFullYear() - 1, 11, 31));
  const todayStr = fmtDate(today);

  const [bs, pl30, pl90, arAging, plPY] = await Promise.all([
    qboReport(realmId, 'BalanceSheet',            { date: todayStr }),
    qboReport(realmId, 'ProfitAndLoss',            { start_date: d30, end_date: todayStr }),
    qboReport(realmId, 'ProfitAndLoss',            { start_date: d90, end_date: todayStr }),
    qboReport(realmId, 'AgedReceivablesSummary',   { report_date: todayStr }),
    qboReport(realmId, 'ProfitAndLoss',            { start_date: startPY, end_date: endPY }),
  ]);

  const bsRows  = bs.Rows?.Row || [];
  const pl30r   = pl30.Rows?.Row || [];
  const pl90r   = pl90.Rows?.Row || [];
  const plPYr   = plPY.Rows?.Row || [];
  const arRows  = arAging.Rows?.Row || [];

  // Cash
  const cashBalance = sumSection(bsRows, 'bank accounts') || findRow(bsRows, 'checking') || 0;

  // Revenue
  const revenue30  = sumSection(pl30r, 'income') || 0;
  const revenue90  = sumSection(pl90r, 'income') || 0;
  const revenuePY  = sumSection(plPYr, 'income') || 0;

  // COGS & expenses
  const cogs30     = sumSection(pl30r, 'cost of goods') || sumSection(pl30r, 'cost of sales') || 0;
  const cogs90     = sumSection(pl90r, 'cost of goods') || sumSection(pl90r, 'cost of sales') || 0;
  const expenses30 = sumSection(pl30r, 'expenses') || 0;

  // Margins
  const grossPct30 = revenue30 > 0 ? ((revenue30 - cogs30) / revenue30 * 100) : 0;
  const grossPct90 = revenue90 > 0 ? ((revenue90 - cogs90) / revenue90 * 100) : 0;
  const netPct30   = revenue30 > 0 ? ((revenue30 - cogs30 - expenses30) / revenue30 * 100) : 0;
  const grossPctPY = revenuePY > 0 ? ((revenuePY - (sumSection(plPYr, 'cost of goods') || 0)) / revenuePY * 100) : 0;

  // AR
  const totalOutstanding = arRows.reduce((s, r) => {
    const total = parseFloat(r.ColData?.[r.ColData.length - 1]?.value || '0');
    return s + (isNaN(total) ? 0 : total);
  }, 0);

  // Build AR invoices list from aging rows (>30 days = overdue)
  const invoices = arRows
    .filter(r => r.type === 'Data')
    .map((r, i) => {
      const cols = r.ColData || [];
      const over30  = parseFloat(cols[3]?.value || '0');
      const over60  = parseFloat(cols[4]?.value || '0');
      const over90  = parseFloat(cols[5]?.value || '0');
      const overdue = over30 + over60 + over90;
      if (overdue <= 0) return null;
      return {
        id:               `inv-${i}`,
        customer:         cols[0]?.value || 'Unknown',
        amount:           overdue,
        days_outstanding: over90 > 0 ? 90 : over60 > 0 ? 60 : 35,
      };
    })
    .filter(Boolean);

  // Get business info
  const { rows: bizRows } = await query(
    'SELECT * FROM businesses WHERE realm_id = $1',
    [realmId]
  );
  const biz = bizRows[0] || {};

  return {
    business: {
      id:                   realmId,
      name:                 biz.business_type || 'Your Business',
      industry:             'unknown',
      owner:                biz.owner_name || 'there',
      headcount:            0,
      currency:             'USD',
      fiscal_year_start_month: 1,
    },
    snapshot_date: todayStr,
    cash: {
      current_balance: cashBalance,
      '30d_ago':       cashBalance, // QBO BS is point-in-time; use current as approximation
      '60d_ago':       cashBalance,
      '90d_ago':       cashBalance,
      accounts:        [],
      upcoming_payables: [],
    },
    revenue: {
      last_30d:       revenue30,
      last_60d:       revenue30,  // approximation
      last_90d:       revenue90,
      ytd:            revenue90,
      ytd_prior_year: revenuePY,
    },
    cogs:     { last_30d: cogs30, last_90d: cogs90 },
    expenses: { last_30d: expenses30, last_90d: expenses30 * 3, categories: [] },
    margin: {
      gross_pct_30d:       grossPct30,
      gross_pct_90d:       grossPct90,
      gross_pct_prior_year: grossPctPY,
      net_pct_30d:         netPct30,
      net_pct_90d:         netPct30,
    },
    customers: [],  // QBO customer breakdown requires transaction-level queries — Phase 1B
    ar: {
      total_outstanding: totalOutstanding,
      current:           totalOutstanding - invoices.reduce((s, i) => s + i.amount, 0),
      invoices,
    },
    capability_scores:   { pricing_strategy: 3, ar_management: 3, cost_control: 3, client_mix: 3, cash_management: 3 },
    industry_benchmarks: { gross_margin_pct: 40, net_margin_pct: 15 },
    market_data:         null,
  };
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmtDate(d) {
  return d.toISOString().slice(0, 10);
}
function subDays(d, n) {
  const r = new Date(d);
  r.setDate(r.getDate() - n);
  return r;
}
