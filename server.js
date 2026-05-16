#!/usr/bin/env node
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, '.env') });

// Validate key after dotenv loads
import {
  getFinancialBriefing,
  getCashForecast,
  getMarginAnalysis,
  identifyValueGaps,
  getArAlerts,
  askClara,
  onboardClara,
} from './src/tools.js';

if (!process.env.ANTHROPIC_API_KEY) {
  console.error('ERROR: ANTHROPIC_API_KEY is not set. Add it to /opt/clara/.env');
  process.exit(1);
}

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
      properties: {
        business_id: { type: 'string' },
      },
    },
  },
  {
    name: 'identify_value_gaps',
    description: 'Top 3 capability gaps with estimated annual dollar value of improvement. Cross-references operational maturity with financial performance. Call this when the owner asks where to focus, what\'s holding them back, or what\'s worth working on.',
    inputSchema: {
      type: 'object',
      properties: {
        business_id: { type: 'string' },
      },
    },
  },
  {
    name: 'get_ar_alerts',
    description: 'Overdue invoices ranked by urgency with suggested follow-up language. Call this when the owner asks about invoices, collections, or overdue payments.',
    inputSchema: {
      type: 'object',
      properties: {
        business_id: { type: 'string' },
      },
    },
  },
  {
    name: 'ask_clara',
    description: 'Open-ended financial question answered with full business context. Use for any financial question not covered by the other tools, or when the owner asks something conversational like "what should I focus on?" or "am I doing OK?"',
    inputSchema: {
      type: 'object',
      required: ['question'],
      properties: {
        business_id: { type: 'string' },
        question: { type: 'string', description: 'The owner\'s question in natural language.' },
      },
    },
  },
];

const server = new Server(
  { name: 'vigil', version: '1.0.0' },
  { capabilities: { tools: {} } }
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({ tools: TOOLS }));

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
    return { content: [{ type: 'text', text: `Error: ${err.message}` }], isError: true };
  }
});

const transport = new StdioServerTransport();
await server.connect(transport);
