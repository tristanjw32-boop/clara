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

  if (!res.ok) {
    // 400 means the refresh token itself has expired (100-day limit).
    // Throw a typed error so callers can detect this and prompt reconnection.
    const err = new Error(`QBO token refresh failed: ${res.status}`);
    if (res.status === 400) err.code = 'QBO_REFRESH_EXPIRED';
    throw err;
  }
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

// ── QBO API fetchers ──────────────────────────────────────────────────────────

async function qboReport(realmId, reportName, params = {}) {
  const accessToken = await getValidToken(realmId);
  const qs = new URLSearchParams({ minorversion: '65', ...params }).toString();
  const url = `${qboBase()}/v3/company/${realmId}/reports/${reportName}?${qs}`;
  const res = await fetch(url, {
    headers: { 'Authorization': `Bearer ${accessToken}`, 'Accept': 'application/json' },
  });
  if (!res.ok) throw new Error(`QBO ${reportName} failed: ${res.status}`);
  return res.json();
}

async function qboReportSafe(realmId, reportName, params = {}) {
  try { return await qboReport(realmId, reportName, params); } catch (_) { return null; }
}

async function qboQuery(realmId, sql) {
  const accessToken = await getValidToken(realmId);
  const qs = new URLSearchParams({ query: sql, minorversion: '65' }).toString();
  const url = `${qboBase()}/v3/company/${realmId}/query?${qs}`;
  const res = await fetch(url, {
    headers: { 'Authorization': `Bearer ${accessToken}`, 'Accept': 'application/json' },
  });
  if (!res.ok) throw new Error(`QBO query failed: ${res.status}`);
  const body = await res.json();
  return body.QueryResponse;
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

  const [bs, pl30, pl90, plPY, openInvoices, openBills, bankAccounts, invoiceLines] = await Promise.all([
    qboReportSafe(realmId, 'BalanceSheet',  { date: todayStr }),
    qboReportSafe(realmId, 'ProfitAndLoss', { start_date: d30, end_date: todayStr }),
    qboReportSafe(realmId, 'ProfitAndLoss', { start_date: d90, end_date: todayStr }),
    qboReportSafe(realmId, 'ProfitAndLoss', { start_date: startPY, end_date: endPY }),
    qboQuery(realmId, "SELECT Id, TxnDate, DueDate, TotalAmt, Balance, CustomerRef FROM Invoice WHERE Balance > '0' MAXRESULTS 50"),
    qboQuery(realmId, "SELECT Id, TxnDate, DueDate, TotalAmt, Balance, VendorRef FROM Bill WHERE Balance > '0' MAXRESULTS 50"),
    qboQuery(realmId, "SELECT Id, Name, CurrentBalance FROM Account WHERE AccountType = 'Bank'"),
    qboQuery(realmId, `SELECT Id, TxnDate, CustomerRef, Line FROM Invoice WHERE TxnDate >= '${d90}' MAXRESULTS 200`),
  ]);

  const bsRows  = bs?.Rows?.Row || [];
  const pl30r   = pl30?.Rows?.Row || [];
  const pl90r   = pl90?.Rows?.Row || [];
  const plPYr   = plPY?.Rows?.Row || [];
  const rawInvoices = openInvoices?.Invoice || [];
  const rawBills    = openBills?.Bill || [];

  // Cash — sum all bank accounts directly (more reliable than parsing BS report)
  const cashBalance = (bankAccounts?.Account || [])
    .reduce((s, a) => s + parseFloat(a.CurrentBalance || 0), 0);

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

  // AR — built from open invoice query
  const todayMs = new Date(todayStr).getTime();
  const invoices = rawInvoices.map((inv, i) => {
    const balance = parseFloat(inv.Balance || '0');
    const dueDate = inv.DueDate ? new Date(inv.DueDate).getTime() : todayMs;
    const daysOverdue = Math.floor((todayMs - dueDate) / 86_400_000);
    return {
      id:               `inv-${inv.Id || i}`,
      customer:         inv.CustomerRef?.name || 'Unknown',
      amount:           balance,
      days_outstanding: Math.max(0, daysOverdue),
      due_date:         inv.DueDate || todayStr,
    };
  });
  const totalOutstanding = invoices.reduce((s, i) => s + i.amount, 0);

  // Upcoming payables from open bills
  const upcomingPayables = rawBills.map(bill => ({
    vendor:    bill.VendorRef?.name || 'Unknown',
    amount:    parseFloat(bill.Balance || '0'),
    due_date:  bill.DueDate || '',
    days_until_due: Math.floor((new Date(bill.DueDate).getTime() - todayMs) / 86_400_000),
  })).sort((a, b) => a.days_until_due - b.days_until_due);

  // Service rates — aggregate invoice lines by item to compute avg rate per unit
  // Industry benchmarks: Pest Control ~$65/hr, Trimming ~$55/hr, Installation ~$80/hr, Design ~$100/hr
  const SERVICE_BENCHMARKS = {
    'Pest Control': 65, 'Trimming': 55, 'Installation': 80, 'Design': 100,
    'Maintenance & Repair': 70, 'Gardening': 55, 'Lighting': 75,
  };
  const serviceMap = {};
  for (const inv of invoiceLines?.Invoice || []) {
    for (const line of inv.Line || []) {
      const detail = line.SalesItemLineDetail;
      if (!detail) continue;
      const name = detail.ItemRef?.name;
      const qty  = parseFloat(detail.Qty || 1);
      const rate = parseFloat(detail.UnitPrice || 0);
      const amt  = parseFloat(line.Amount || 0);
      if (!name || rate === 0 || amt === 0) continue;
      if (!serviceMap[name]) serviceMap[name] = { total_revenue: 0, total_qty: 0, job_count: 0 };
      serviceMap[name].total_revenue += amt;
      serviceMap[name].total_qty     += qty;
      serviceMap[name].job_count     += 1;
    }
  }
  const serviceRates = Object.entries(serviceMap).map(([name, s]) => ({
    service:       name,
    avg_rate:      s.total_qty > 0 ? Math.round(s.total_revenue / s.total_qty) : 0,
    total_revenue: Math.round(s.total_revenue),
    job_count:     s.job_count,
    benchmark_rate: SERVICE_BENCHMARKS[name] ?? null,
    gap_pct: SERVICE_BENCHMARKS[name]
      ? Math.round(((SERVICE_BENCHMARKS[name] - (s.total_revenue / s.total_qty)) / SERVICE_BENCHMARKS[name]) * 100)
      : null,
  })).filter(s => s.avg_rate > 0).sort((a, b) => (b.gap_pct ?? 0) - (a.gap_pct ?? 0));

  // ── Capability scores — auto-computed from live QBO data ─────────────────────

  // Cash Management: does the business have runway and can it cover imminent bills?
  const billsDue7d = upcomingPayables.filter(p => p.days_until_due <= 7).reduce((s, p) => s + p.amount, 0);
  const monthlyBurnEst = expenses30 || (revenue30 * 0.5);
  const runwayDays = monthlyBurnEst > 0 ? (cashBalance / (monthlyBurnEst / 30)) : 99;
  let cashMgmtScore;
  if (billsDue7d > cashBalance)  cashMgmtScore = 1;
  else if (runwayDays < 14)      cashMgmtScore = 2;
  else if (runwayDays < 30)      cashMgmtScore = 3;
  else if (runwayDays < 90)      cashMgmtScore = 4;
  else                           cashMgmtScore = 5;

  // AR Management: weighted average days outstanding across open invoices
  const totalArAmt = invoices.reduce((s, i) => s + i.amount, 0);
  const weightedAvgDays = totalArAmt > 0
    ? invoices.reduce((s, i) => s + i.days_outstanding * i.amount, 0) / totalArAmt
    : 0;
  let arMgmtScore;
  if (invoices.length === 0 || totalArAmt === 0) arMgmtScore = 5;
  else if (weightedAvgDays < 21) arMgmtScore = 5;
  else if (weightedAvgDays < 30) arMgmtScore = 4;
  else if (weightedAvgDays < 45) arMgmtScore = 3;
  else if (weightedAvgDays < 60) arMgmtScore = 2;
  else                           arMgmtScore = 1;

  // Pricing Strategy: proportion of tracked services below market benchmark
  const benchmarkedSvcs  = serviceRates.filter(s => s.benchmark_rate !== null);
  const underpricedSvcs  = benchmarkedSvcs.filter(s => s.gap_pct > 10);
  let pricingScore;
  if (benchmarkedSvcs.length === 0) {
    pricingScore = 3;
  } else if (underpricedSvcs.length === 0) {
    pricingScore = 5;
  } else {
    const underpricedPct = underpricedSvcs.length / benchmarkedSvcs.length;
    if (underpricedPct < 0.25)     pricingScore = 4;
    else if (underpricedPct < 0.5) pricingScore = 3;
    else if (underpricedPct < 0.75) pricingScore = 2;
    else                            pricingScore = 1;
  }

  // Cost Control: gross margin vs 40% SMB benchmark
  const grossGap = grossPct30 - 40;
  let costControlScore;
  if (grossGap > 10)       costControlScore = 5;
  else if (grossGap > 0)   costControlScore = 4;
  else if (grossGap > -5)  costControlScore = 3;
  else if (grossGap > -15) costControlScore = 2;
  else                     costControlScore = 1;

  // Revenue Concentration: top customer share of 90d invoiced revenue
  const customerRevMap = {};
  for (const inv of invoiceLines?.Invoice || []) {
    const cName = inv.CustomerRef?.name || 'Unknown';
    const invTotal = (inv.Line || []).reduce((s, l) => s + parseFloat(l.Amount || 0), 0);
    customerRevMap[cName] = (customerRevMap[cName] || 0) + invTotal;
  }
  const customerRevVals = Object.values(customerRevMap);
  const totalCustRev    = customerRevVals.reduce((s, v) => s + v, 0);
  const topCustPct      = customerRevVals.length > 0 && totalCustRev > 0
    ? Math.max(...customerRevVals) / totalCustRev
    : 0;
  let clientMixScore;
  if (customerRevVals.length === 0)  clientMixScore = 3;
  else if (topCustPct < 0.2)         clientMixScore = 5;
  else if (topCustPct < 0.3)         clientMixScore = 4;
  else if (topCustPct < 0.4)         clientMixScore = 3;
  else if (topCustPct < 0.5)         clientMixScore = 2;
  else                               clientMixScore = 1;

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
      current_balance:   cashBalance,
      '30d_ago':         cashBalance,
      '60d_ago':         cashBalance,
      '90d_ago':         cashBalance,
      accounts:          [],
      upcoming_payables: upcomingPayables,
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
    customers: [],
    service_rates: serviceRates,
    ar: {
      total_outstanding: totalOutstanding,
      current:           totalOutstanding - invoices.reduce((s, i) => s + i.amount, 0),
      invoices,
    },
    capability_scores: {
      pricing_strategy: pricingScore,
      ar_management:    arMgmtScore,
      cost_control:     costControlScore,
      client_mix:       clientMixScore,
      cash_management:  cashMgmtScore,
    },
    capability_score_sources: {
      cash_management:  `${Math.round(runwayDays)}d estimated cash runway; ${billsDue7d > cashBalance ? 'CASH CRISIS — bills exceed balance' : 'bills covered by cash'}`,
      ar_management:    totalArAmt > 0 ? `${Math.round(weightedAvgDays)}d weighted-avg days outstanding across ${invoices.length} open invoices` : 'No open AR',
      pricing_strategy: benchmarkedSvcs.length > 0 ? `${underpricedSvcs.length}/${benchmarkedSvcs.length} services below market benchmark` : 'No benchmark data',
      cost_control:     `${grossPct30.toFixed(1)}% gross margin vs 40% benchmark (${grossGap >= 0 ? '+' : ''}${grossGap.toFixed(1)}pp)`,
      client_mix:       customerRevVals.length > 0 ? `Top customer is ${(topCustPct * 100).toFixed(0)}% of 90d revenue` : 'No customer revenue data',
    },
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
