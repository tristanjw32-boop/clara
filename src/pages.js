// HTML page templates for clara.aerosensei.com landing pages.
// Served by Express — no build step required.

const FONTS = `<link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Inter:ital,opsz,wght@0,14..32,400;0,14..32,500;0,14..32,600;1,14..32,400&display=swap" rel="stylesheet">`;

const BASE_CSS = `
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --bg:           #F7F6F2;
    --bg-alt:       #F0EFE9;
    --text:         #1C1C18;
    --text-muted:   #706F67;
    --accent:       #1E5739;
    --accent-hover: #174A30;
    --accent-dim:   #EDF4F0;
    --border:       #E2E1DA;
    --font-serif:   'Instrument Serif', Georgia, serif;
    --font-sans:    'Inter', system-ui, sans-serif;
  }

  html { font-size: 18px; scroll-behavior: smooth; }

  body {
    background: var(--bg);
    color: var(--text);
    font-family: var(--font-sans);
    line-height: 1.6;
    -webkit-font-smoothing: antialiased;
  }

  /* Nav */
  nav {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: clamp(1.25rem, 3vw, 1.75rem) clamp(1.5rem, 6vw, 5rem);
    border-bottom: 1px solid var(--border);
  }

  .nav-logo {
    font-family: var(--font-serif);
    font-size: 1.4rem;
    color: var(--text);
    text-decoration: none;
    letter-spacing: -0.01em;
  }

  .nav-cta {
    font-size: 0.875rem;
    font-weight: 500;
    color: var(--accent);
    text-decoration: none;
    border-bottom: 1px solid currentColor;
    padding-bottom: 1px;
    transition: opacity 0.15s;
  }

  .nav-cta:hover { opacity: 0.7; }

  /* Buttons */
  .btn {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    background: var(--accent);
    color: #fff;
    font-family: var(--font-sans);
    font-size: 1rem;
    font-weight: 500;
    text-decoration: none;
    padding: 0.875rem 1.75rem;
    border: none;
    cursor: pointer;
    transition: background 0.15s;
    letter-spacing: -0.01em;
  }

  .btn:hover { background: var(--accent-hover); }

  .btn-ghost {
    background: transparent;
    color: var(--accent);
    border: 1.5px solid var(--accent);
  }

  .btn-ghost:hover { background: var(--accent-dim); }

  /* Divider */
  hr {
    border: none;
    border-top: 1px solid var(--border);
    margin: clamp(3rem, 6vw, 5rem) 0;
  }

  /* Utility */
  .eyebrow {
    font-size: 0.8rem;
    font-weight: 600;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--accent);
    margin-bottom: 1.5rem;
  }

  /* Footer */
  footer {
    border-top: 1px solid var(--border);
    padding: 2rem clamp(1.5rem, 6vw, 5rem);
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
    flex-wrap: wrap;
  }

  footer p {
    font-size: 0.8rem;
    color: var(--text-muted);
  }

  footer a {
    color: var(--text-muted);
    text-decoration: none;
    font-size: 0.8rem;
  }

  footer a:hover { color: var(--text); }

  /* Config tabs (shared across landing, connected, demo pages) */
  .config-tabs {
    display: flex;
    border-bottom: 1px solid var(--border);
  }

  .config-tab {
    padding: 0.625rem 1.25rem;
    font-size: 0.875rem;
    font-weight: 500;
    color: var(--text-muted);
    cursor: pointer;
    border: none;
    border-bottom: 2px solid transparent;
    margin-bottom: -1px;
    background: none;
    font-family: var(--font-sans);
    transition: color 0.15s;
    white-space: nowrap;
  }

  .config-tab:hover { color: var(--text); }

  .config-tab.active {
    color: var(--accent);
    border-bottom-color: var(--accent);
  }

  .config-panel { display: none; }
  .config-panel.active { display: block; }
`;

function navHtml(activeCta = true) {
  return `<nav>
    <a href="/" class="nav-logo">Clara</a>
    ${activeCta ? `<div style="display:flex;gap:2rem;align-items:center">
      <a href="/demo" class="nav-cta" style="color:var(--text-muted);border-color:var(--text-muted)">Try demo</a>
      <a href="/connect" class="nav-cta">Connect your books →</a>
    </div>` : ''}
  </nav>`;
}

function footerHtml() {
  return `<footer>
    <p>Clara by WellDrilled &mdash; Financial intelligence for growing businesses.</p>
    <div style="display:flex;gap:1.5rem">
      <a href="/privacy">Privacy</a>
      <a href="/terms">Terms</a>
    </div>
  </footer>`;
}

// ── Landing page ──────────────────────────────────────────────────────────────

export function landingPage() {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Clara — Risk-sensing intelligence for growing businesses</title>
  <meta name="description" content="Most businesses find out about a cash problem 90 days after it started. Clara reads your books every night and briefs you every morning — before the problem becomes a crisis.">
  <link rel="canonical" href="https://clara.aerosensei.com/">

  <!-- Open Graph -->
  <meta property="og:type"        content="website">
  <meta property="og:url"         content="https://clara.aerosensei.com/">
  <meta property="og:site_name"   content="Clara">
  <meta property="og:title"       content="On watch while you build — Clara">
  <meta property="og:description" content="Most businesses find out about a cash problem 90 days after it started. Clara reads your books every night and briefs you every morning — before the problem becomes a crisis.">
  <meta property="og:image"       content="https://clara.aerosensei.com/hero.jpg">
  <meta property="og:image:width"  content="1280">
  <meta property="og:image:height" content="896">
  <meta property="og:image:alt"   content="Business owner reviewing finances with Clara">

  <!-- Twitter Card -->
  <meta name="twitter:card"        content="summary_large_image">
  <meta name="twitter:title"       content="On watch while you build — Clara">
  <meta name="twitter:description" content="Most businesses find out about a cash problem 90 days after it started. Clara reads your books every night and briefs you every morning.">
  <meta name="twitter:image"       content="https://clara.aerosensei.com/hero.jpg">

  <!-- Favicon -->
  <link rel="icon" type="image/svg+xml" href="/favicon.svg">

  <!-- JSON-LD -->
  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": "https://clara.aerosensei.com/#org",
        "name": "Clara",
        "url": "https://clara.aerosensei.com",
        "logo": "https://clara.aerosensei.com/favicon.svg",
        "description": "Risk-sensing financial intelligence for small and medium businesses.",
        "parentOrganization": {
          "@type": "Organization",
          "name": "Well Drilled Inc",
          "url": "https://welldrilled.ai"
        }
      },
      {
        "@type": "SoftwareApplication",
        "@id": "https://clara.aerosensei.com/#app",
        "name": "Clara",
        "applicationCategory": "FinanceApplication",
        "operatingSystem": "Web",
        "url": "https://clara.aerosensei.com",
        "description": "Clara reads your accounting software every night and delivers a plain-English briefing every morning — cash risks, margin drags, overdue collections — before any of them become a crisis.",
        "offers": {
          "@type": "Offer",
          "price": "0",
          "priceCurrency": "USD",
          "description": "Free to connect. Available as an MCP skill for Hermes, OpenClaw, and Claude Desktop."
        },
        "featureList": [
          "Daily cash flow forecast",
          "Customer margin analysis",
          "Accounts receivable alerts",
          "Value gap identification",
          "QuickBooks, Xero, Sage, and Pastel integration",
          "MCP protocol support"
        ],
        "provider": { "@id": "https://clara.aerosensei.com/#org" }
      },
      {
        "@type": "FAQPage",
        "mainEntity": [
          {
            "@type": "Question",
            "name": "What is Clara?",
            "acceptedAnswer": { "@type": "Answer", "text": "Clara is risk-sensing financial intelligence for small businesses. It reads your accounting software every night and delivers a plain-English briefing every morning — cash risks, margin drags, overdue collections — before any of them become a crisis." }
          },
          {
            "@type": "Question",
            "name": "How is Clara different from QuickBooks or Xero?",
            "acceptedAnswer": { "@type": "Answer", "text": "QuickBooks and Xero record what happened. Clara watches what is happening right now and signals what is coming next. They answer 'what were my numbers last month?' Clara answers 'what is threatening my business today, and what should I do about it?'" }
          },
          {
            "@type": "Question",
            "name": "Which AI assistants does Clara work with?",
            "acceptedAnswer": { "@type": "Answer", "text": "Clara works with any MCP-compatible AI assistant including Hermes, OpenClaw, and Claude Desktop." }
          },
          {
            "@type": "Question",
            "name": "Is my financial data safe?",
            "acceptedAnswer": { "@type": "Answer", "text": "Yes. Clara requests read-only access to your accounting software. It never writes to your books and you can revoke access at any time." }
          }
        ]
      }
    ]
  }
  </script>

  ${FONTS}
  <style>
    ${BASE_CSS}

    /* ── Hero ── */
    .hero-wrap {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 0;
      align-items: stretch;
      border-bottom: 1px solid var(--border);
      overflow: hidden;
    }

    .hero {
      padding: clamp(3.5rem, 7vw, 7rem) clamp(1.5rem, 5vw, 5rem);
      display: flex;
      flex-direction: column;
      justify-content: center;
    }

    .hero h1 {
      font-family: var(--font-serif);
      font-size: clamp(2.75rem, 5.5vw, 5.5rem);
      line-height: 1.03;
      letter-spacing: -0.02em;
      color: var(--text);
      margin-bottom: 1.5rem;
      max-width: 14ch;
    }

    .hero-lead {
      font-size: clamp(1rem, 1.75vw, 1.15rem);
      color: var(--text-muted);
      max-width: 48ch;
      line-height: 1.6;
      margin-bottom: 2.25rem;
    }

    .hero-qualifier {
      margin-top: 1rem;
      font-size: 0.825rem;
      color: var(--text-muted);
      letter-spacing: 0.02em;
    }

    .hero-img {
      position: relative;
      overflow: hidden;
      background: #e8e5de;
      min-height: 420px;
    }

    .hero-img img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      object-position: center top;
      display: block;
    }

    .hero-img-caption {
      position: absolute;
      bottom: 1.5rem;
      left: 1.5rem;
      background: rgba(247,246,242,0.92);
      backdrop-filter: blur(8px);
      border: 1px solid var(--border);
      padding: 0.75rem 1rem;
      max-width: 280px;
    }

    .caption-label {
      font-size: 0.7rem;
      font-weight: 600;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      color: var(--accent);
      margin-bottom: 0.25rem;
    }

    .caption-text {
      font-size: 0.85rem;
      color: var(--text);
      line-height: 1.4;
    }

    @media (max-width: 760px) {
      .hero-wrap { grid-template-columns: 1fr; }
      .hero-img { min-height: 260px; order: -1; }
    }

    /* ── Clara sample briefing ── */
    .briefing-wrap {
      padding: clamp(1.5rem, 4vw, 3rem) clamp(1.5rem, 6vw, 5rem);
      background: var(--bg-alt);
      border-top: 1px solid var(--border);
      border-bottom: 1px solid var(--border);
    }

    .briefing-label {
      font-size: 0.75rem;
      font-weight: 600;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      color: var(--text-muted);
      margin-bottom: 1.25rem;
    }

    .briefing {
      max-width: 680px;
      background: var(--bg);
      border: 1px solid var(--border);
      padding: 1.75rem 2rem;
      font-size: 0.9rem;
    }

    .briefing-header {
      display: flex;
      align-items: baseline;
      gap: 1rem;
      margin-bottom: 1.25rem;
      padding-bottom: 1rem;
      border-bottom: 1px solid var(--border);
    }

    .briefing-sender {
      font-family: var(--font-serif);
      font-size: 1rem;
      color: var(--text);
    }

    .briefing-time {
      font-size: 0.75rem;
      color: var(--text-muted);
    }

    .briefing-line {
      display: flex;
      gap: 0.75rem;
      padding: 0.6rem 0;
      border-bottom: 1px solid var(--border);
      color: var(--text);
      line-height: 1.4;
    }

    .briefing-line:last-of-type { border-bottom: none; }

    .briefing-dot {
      flex-shrink: 0;
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: var(--accent);
      margin-top: 0.45em;
    }

    .briefing-dot.warn { background: #C2410C; }

    .briefing-cta {
      margin-top: 1.25rem;
      padding-top: 1.25rem;
      border-top: 1px solid var(--border);
      font-size: 0.85rem;
      color: var(--accent);
      font-weight: 500;
    }

    /* ── Capabilities ── */
    .capabilities {
      padding: clamp(3rem, 6vw, 5rem) clamp(1.5rem, 6vw, 5rem);
      max-width: 1100px;
    }

    .cap-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 0;
    }

    .cap-item {
      padding: 2rem 0;
      border-top: 1px solid var(--border);
      padding-right: 3rem;
    }

    .cap-number {
      font-family: var(--font-serif);
      font-size: 0.85rem;
      color: var(--text-muted);
      margin-bottom: 1rem;
      font-style: italic;
    }

    .cap-title {
      font-family: var(--font-serif);
      font-size: 1.5rem;
      letter-spacing: -0.01em;
      color: var(--text);
      margin-bottom: 0.75rem;
    }

    .cap-desc {
      font-size: 0.9rem;
      color: var(--text-muted);
      line-height: 1.55;
      max-width: 38ch;
    }

    /* ── How it works ── */
    .how {
      padding: clamp(3rem, 6vw, 5rem) clamp(1.5rem, 6vw, 5rem);
      background: var(--bg-alt);
      border-top: 1px solid var(--border);
      border-bottom: 1px solid var(--border);
    }

    .how-inner {
      max-width: 1100px;
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 4rem;
      align-items: start;
    }

    @media (max-width: 680px) {
      .how-inner { grid-template-columns: 1fr; gap: 2rem; }
    }

    .how h2 {
      font-family: var(--font-serif);
      font-size: clamp(1.75rem, 3.5vw, 2.5rem);
      letter-spacing: -0.02em;
      line-height: 1.15;
      margin-bottom: 1rem;
    }

    .how p {
      font-size: 1rem;
      color: var(--text-muted);
      line-height: 1.6;
      margin-bottom: 1rem;
    }

    .how-steps {
      list-style: none;
      counter-reset: steps;
    }

    .how-steps li {
      counter-increment: steps;
      display: flex;
      gap: 1rem;
      padding: 1.1rem 0;
      border-top: 1px solid var(--border);
      font-size: 0.9rem;
      line-height: 1.5;
    }

    .how-steps li::before {
      content: counter(steps);
      font-family: var(--font-serif);
      font-size: 1rem;
      color: var(--accent);
      font-style: italic;
      flex-shrink: 0;
      width: 1.5rem;
    }

    /* ── Bottom CTA ── */
    .bottom-cta {
      padding: clamp(4rem, 8vw, 7rem) clamp(1.5rem, 6vw, 5rem);
      max-width: 1100px;
    }

    .bottom-cta h2 {
      font-family: var(--font-serif);
      font-size: clamp(2rem, 4vw, 3.5rem);
      letter-spacing: -0.02em;
      line-height: 1.1;
      margin-bottom: 0.75rem;
      max-width: 18ch;
    }

    .bottom-cta p {
      color: var(--text-muted);
      font-size: 1rem;
      margin-bottom: 2rem;
      max-width: 44ch;
    }

    /* ── For developers ── */
    .dev-section {
      padding: clamp(3rem, 6vw, 5rem) clamp(1.5rem, 6vw, 5rem);
      max-width: 1100px;
    }

    .dev-section h2 {
      font-family: var(--font-serif);
      font-size: clamp(1.75rem, 3.5vw, 2.5rem);
      letter-spacing: -0.02em;
      line-height: 1.15;
      margin-bottom: 0.75rem;
    }

    .dev-section .lead {
      font-size: 1rem;
      color: var(--text-muted);
      max-width: 52ch;
      line-height: 1.6;
      margin-bottom: 2rem;
    }

    .dev-note {
      font-size: 0.85rem;
      color: var(--text-muted);
      line-height: 1.5;
      margin-top: 0.75rem;
    }

    .dev-note a, .dev-note code { color: var(--accent); }
    .dev-note code { font-family: 'SF Mono', 'Fira Code', monospace; font-size: 0.8em; }

    /* ── vs section ── */
    .vs-section {
      padding: clamp(3rem, 6vw, 5rem) clamp(1.5rem, 6vw, 5rem);
      border-top: 1px solid var(--border);
      border-bottom: 1px solid var(--border);
    }

    .vs-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 0;
      max-width: 1100px;
      margin-top: 2.5rem;
    }

    @media (max-width: 760px) {
      .vs-grid { grid-template-columns: 1fr; }
      .vs-card { padding-right: 0; padding-bottom: 2rem; }
    }

    .vs-card {
      padding: 2rem 3rem 2rem 0;
      border-top: 3px solid var(--border);
    }

    .vs-card.clara-card { border-top-color: var(--accent); }

    .vs-card-label {
      font-size: 0.75rem;
      font-weight: 600;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      color: var(--text-muted);
      margin-bottom: 0.5rem;
    }

    .vs-card.clara-card .vs-card-label { color: var(--accent); }

    .vs-card-role {
      font-family: var(--font-serif);
      font-size: 1.4rem;
      letter-spacing: -0.01em;
      color: var(--text);
      margin-bottom: 1.25rem;
      line-height: 1.2;
    }

    .vs-bullets {
      list-style: none;
      display: flex;
      flex-direction: column;
      gap: 0.625rem;
    }

    .vs-bullets li {
      font-size: 0.9rem;
      color: var(--text-muted);
      line-height: 1.45;
      padding-left: 1.1rem;
      position: relative;
    }

    .vs-bullets li::before {
      content: '–';
      position: absolute;
      left: 0;
      color: var(--border);
    }

    .vs-card.clara-card .vs-bullets li { color: var(--text); }
    .vs-card.clara-card .vs-bullets li::before { content: '→'; color: var(--accent); }

    /* ── Ambition strip ── */
    .ambition-strip {
      padding: clamp(2.5rem, 5vw, 4rem) clamp(1.5rem, 6vw, 5rem);
      background: var(--bg-alt);
      border-top: 1px solid var(--border);
      border-bottom: 1px solid var(--border);
    }

    .ambition-strip p {
      font-family: var(--font-serif);
      font-size: clamp(1.4rem, 2.75vw, 2.1rem);
      letter-spacing: -0.02em;
      line-height: 1.3;
      max-width: 32ch;
      color: var(--text);
    }

    .ambition-strip em {
      font-style: italic;
      color: var(--text-muted);
    }

    @media (max-width: 640px) {
      .hero h1 { font-size: 2.75rem; }
      .cap-item { padding-right: 0; }
    }
  </style>
</head>
<body>
  ${navHtml()}

  <!-- Hero -->
  <section>
    <div class="hero-wrap">
      <div class="hero">
        <p class="eyebrow">Risk-sensing intelligence for growing businesses</p>
        <h1>On watch while you build.</h1>
        <p class="hero-lead">Most businesses find out something's wrong when it's already a crisis. Clara reads your books every night and delivers a plain-English briefing every morning &mdash; cash risks, margin drags, overdue collections &mdash; before they have a chance to hurt you.</p>
        <div style="display:flex;gap:1rem;flex-wrap:wrap">
          <a href="/connect" class="btn">Connect your books &nbsp;→</a>
          <a href="/demo" class="btn btn-ghost">Try live demo</a>
        </div>
        <p class="hero-qualifier">Works with QuickBooks, Xero, Sage &amp; Pastel &nbsp;·&nbsp; Read-only access &nbsp;·&nbsp; Free to try</p>
      </div>
      <div class="hero-img">
        <img src="/hero.jpg" alt="Business owner reviewing finances" loading="eager">
        <div class="hero-img-caption">
          <p class="caption-label">Clara flagged</p>
          <p class="caption-text">"Cash drops below payroll threshold in 31 days if Meridian doesn't pay."</p>
        </div>
      </div>
    </div>
  </section>

  <!-- Sample briefing -->
  <div class="briefing-wrap">
    <p class="briefing-label">This is what Clara looks like at 7am</p>
    <div class="briefing">
      <div class="briefing-header">
        <span class="briefing-sender">Clara</span>
        <span class="briefing-time">This morning &nbsp;·&nbsp; Summit HVAC</span>
      </div>
      <div class="briefing-line">
        <div class="briefing-dot warn"></div>
        <span>Your cash position drops below payroll threshold in <strong>31 days</strong>. You have $127,400 on hand — down 12% from last month.</span>
      </div>
      <div class="briefing-line">
        <div class="briefing-dot warn"></div>
        <span>Meridian Properties (inv. #1847, <strong>$18,200</strong>) is 47 days overdue. This is your most urgent collection.</span>
      </div>
      <div class="briefing-line">
        <div class="briefing-dot"></div>
        <span>Your service maintenance segment is running at 23% gross margin — <strong>14 points below your industry benchmark</strong>.</span>
      </div>
      <div class="briefing-line">
        <div class="briefing-dot"></div>
        <span>Two new customer invoices totalling $34,500 are due in the next 10 days.</span>
      </div>
      <p class="briefing-cta">I've drafted a follow-up email for Meridian. Say the word and I'll send you the language. →</p>
    </div>
  </div>

  <!-- Not what you already have -->
  <section class="vs-section">
    <p class="eyebrow">Not what you already have</p>
    <div class="vs-grid">
      <div class="vs-card">
        <p class="vs-card-label">QuickBooks &nbsp;/&nbsp; Xero &nbsp;/&nbsp; Sage &nbsp;/&nbsp; Pastel</p>
        <p class="vs-card-role">Transaction recorder.</p>
        <ul class="vs-bullets">
          <li>Records what happened</li>
          <li>Answers when you log in and ask</li>
          <li>Shows you the numbers</li>
          <li>Stops at the report</li>
          <li>Optimised for your accountant, not you</li>
        </ul>
      </div>
      <div class="vs-card">
        <p class="vs-card-label">Your accountant</p>
        <p class="vs-card-role">Compliance professional.</p>
        <ul class="vs-bullets">
          <li>Reviews the past</li>
          <li>Available by appointment</li>
          <li>Files the compliance</li>
          <li>Charges for the extra hour</li>
          <li>Not trained to say "your margin is structurally broken"</li>
        </ul>
      </div>
      <div class="vs-card clara-card">
        <p class="vs-card-label">Clara</p>
        <p class="vs-card-role">Risk-sensing intelligence.</p>
        <ul class="vs-bullets">
          <li>Watches right now, signals what's coming</li>
          <li>Shows up every morning without being asked</li>
          <li>Names the problem and the fix</li>
          <li>Builds the plan and tracks the outcome</li>
          <li>Stays until the business is winning</li>
        </ul>
      </div>
    </div>
  </section>

  <!-- Capabilities -->
  <section>
    <div class="capabilities">
      <p class="eyebrow">What Clara watches</p>
      <div class="cap-grid">
        <div class="cap-item">
          <p class="cap-number">01</p>
          <h3 class="cap-title">Cash Radar</h3>
          <p class="cap-desc">30, 60, and 90-day projections built from your live AR and payables. Know what's coming before it arrives &mdash; not 90 days after.</p>
        </div>
        <div class="cap-item">
          <p class="cap-number">02</p>
          <h3 class="cap-title">Margin Intelligence</h3>
          <p class="cap-desc">Which clients actually make you money? Gross and net margin by customer, named and ranked, compared to your industry benchmark.</p>
        </div>
        <div class="cap-item">
          <p class="cap-number">03</p>
          <h3 class="cap-title">AR Risk</h3>
          <p class="cap-desc">Overdue invoices ranked by urgency with the follow-up language already written. Stop chasing reactively &mdash; start preventing the gaps.</p>
        </div>
        <div class="cap-item">
          <p class="cap-number">04</p>
          <h3 class="cap-title">Value Gaps</h3>
          <p class="cap-desc">The top capability gaps in your business, quantified in dollars. Pricing too low by $22K a year. Warranty labour unrecovered at $6K a month. Exact numbers, not vague suggestions.</p>
        </div>
      </div>
    </div>
  </section>

  <!-- Ambition strip -->
  <div class="ambition-strip">
    <p>And that's just the start. <em>A good accountant tells you what happened. A great CFO tells you what to do. Clara tells you what to do &mdash; then stays until it's done.</em></p>
  </div>

  <!-- How it works -->
  <section class="how">
    <div class="how-inner">
      <div>
        <h2>Proactive intelligence. Every morning.</h2>
        <p>Connect your accounting software once. Clara reads your books overnight and delivers a briefing before you've opened your inbox. When something needs your attention, she says so &mdash; specific, quantified, actionable. When everything is fine, you hear nothing. Both signals matter.</p>
        <p>Works with Hermes, OpenClaw, and any Claude-compatible AI agent via the MCP protocol.</p>
      </div>
      <ol class="how-steps">
        <li>Connect your accounting software &mdash; QuickBooks, Xero, Sage, or Pastel. Read-only access, revocable any time.</li>
        <li>Get your Clara API key and drop it into your AI assistant's configuration.</li>
        <li>Clara reads your books overnight. Your briefing arrives every morning &mdash; no login required.</li>
        <li>Ask anything deeper: "What's my real cash runway?" "Which client should I fire?" "Where am I leaving money?"</li>
      </ol>
    </div>
  </section>

  <!-- For developers -->
  <section style="background:var(--bg-alt);border-top:1px solid var(--border);border-bottom:1px solid var(--border)">
    <div class="dev-section">
      <p class="eyebrow">For AI developers</p>
      <h2>Connect Clara to your agent.</h2>
      <p class="lead">Clara is an MCP skill. Add it to Hermes, OpenClaw, or Claude Desktop and your agent gains instant financial intelligence for any connected business.</p>

      <div class="config-tabs">
        <button class="config-tab active" data-tab="lp-hermes" onclick="showTab(this)">Hermes</button>
        <button class="config-tab" data-tab="lp-openclaw" onclick="showTab(this)">OpenClaw</button>
        <button class="config-tab" data-tab="lp-claude" onclick="showTab(this)">Claude Desktop</button>
      </div>

      <div id="tab-lp-hermes" class="config-panel active">
        <div class="code-wrap" style="margin-top:0">
          <pre class="code-block">mcp_servers:
  clara:
    url: https://clara.aerosensei.com/mcp
    headers:
      Authorization: "Bearer YOUR_CLARA_API_KEY"</pre>
          <button class="code-copy-btn" onclick="copyCode(this)">Copy</button>
        </div>
        <p class="dev-note">Add to <code>~/.hermes/config.yaml</code> and restart Hermes. Clara's tools appear automatically.</p>
      </div>

      <div id="tab-lp-openclaw" class="config-panel">
        <div class="code-wrap" style="margin-top:0">
          <pre class="code-block">{
  "mcpServers": {
    "clara": {
      "url": "https://clara.aerosensei.com/mcp",
      "headers": {
        "Authorization": "Bearer YOUR_CLARA_API_KEY"
      }
    }
  }
}</pre>
          <button class="code-copy-btn" onclick="copyCode(this)">Copy</button>
        </div>
        <p class="dev-note">Add to your OpenClaw MCP config and reload. Clara will appear as a connected skill.</p>
      </div>

      <div id="tab-lp-claude" class="config-panel">
        <div class="code-wrap" style="margin-top:0">
          <pre class="code-block">{
  "mcpServers": {
    "clara": {
      "url": "https://clara.aerosensei.com/mcp",
      "headers": {
        "Authorization": "Bearer YOUR_CLARA_API_KEY"
      }
    }
  }
}</pre>
          <button class="code-copy-btn" onclick="copyCode(this)">Copy</button>
        </div>
        <p class="dev-note">Add to <code>~/Library/Application Support/Claude/claude_desktop_config.json</code> and restart Claude Desktop.</p>
      </div>

      <p class="dev-note" style="margin-top:1.5rem">Replace <code>YOUR_CLARA_API_KEY</code> with the key from your <a href="/connect">Clara dashboard</a>. &nbsp;·&nbsp; <a href="/demo">Try the live demo →</a></p>
    </div>
  </section>

  <!-- Bottom CTA -->
  <section>
    <div class="bottom-cta">
      <h2>Stop finding out too late.</h2>
      <p>Every week without clear visibility into your cash, your margins, and your AR risk is a week where small problems compound. Clara starts watching today.</p>
      <div style="display:flex;gap:1rem;flex-wrap:wrap">
        <a href="/connect" class="btn">Connect your books &nbsp;→</a>
        <a href="/demo" class="btn btn-ghost">Try live demo</a>
      </div>
    </div>
  </section>

  ${footerHtml()}

  <script>
    function showTab(btn) {
      const name = btn.dataset.tab;
      const parent = btn.closest('.dev-section, .step-card') || document.body;
      parent.querySelectorAll('.config-tab').forEach(t => t.classList.remove('active'));
      parent.querySelectorAll('.config-panel').forEach(p => p.classList.remove('active'));
      btn.classList.add('active');
      document.getElementById('tab-' + name).classList.add('active');
    }

    function copyCode(btn) {
      const pre = btn.parentElement.querySelector('pre');
      navigator.clipboard.writeText(pre.textContent).then(() => {
        btn.textContent = 'Copied!';
        btn.classList.add('copied');
        setTimeout(() => { btn.textContent = 'Copy'; btn.classList.remove('copied'); }, 2000);
      });
    }
  </script>
</body>
</html>`;
}

// ── Connect page ──────────────────────────────────────────────────────────────

export function connectPage({ qbConfigured, qbAuthUrl }) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Connect your accounting software — Clara</title>
  ${FONTS}
  <style>
    ${BASE_CSS}

    .connect-wrap {
      min-height: calc(100vh - 65px);
      display: flex;
      align-items: center;
      justify-content: center;
      padding: clamp(3rem, 6vw, 5rem) clamp(1.5rem, 6vw, 3rem);
    }

    .connect-inner {
      max-width: 520px;
      width: 100%;
    }

    .connect-inner h1 {
      font-family: var(--font-serif);
      font-size: clamp(2rem, 4vw, 2.75rem);
      letter-spacing: -0.02em;
      line-height: 1.15;
      margin-bottom: 1rem;
    }

    .connect-inner .lead {
      font-size: 1rem;
      color: var(--text-muted);
      line-height: 1.6;
      margin-bottom: 2.5rem;
    }

    .permissions {
      border: 1px solid var(--border);
      padding: 1.5rem;
      margin-bottom: 2rem;
      background: var(--bg-alt);
    }

    .permissions-label {
      font-size: 0.75rem;
      font-weight: 600;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      color: var(--text-muted);
      margin-bottom: 0.875rem;
    }

    .permissions ul {
      list-style: none;
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .permissions li {
      display: flex;
      align-items: center;
      gap: 0.625rem;
      font-size: 0.875rem;
      color: var(--text);
    }

    .permissions li::before {
      content: '';
      width: 16px;
      height: 16px;
      flex-shrink: 0;
      background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16' fill='none'%3E%3Ccircle cx='8' cy='8' r='7' stroke='%231E5739' stroke-width='1.5'/%3E%3Cpath d='M5 8l2 2 4-4' stroke='%231E5739' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E");
    }

    .connect-disclaimer {
      margin-top: 1rem;
      font-size: 0.8rem;
      color: var(--text-muted);
      line-height: 1.5;
    }

    .coming-soon {
      border: 1px solid var(--border);
      padding: 2rem;
      text-align: center;
      background: var(--bg-alt);
    }

    .coming-soon p {
      color: var(--text-muted);
      font-size: 0.9rem;
      line-height: 1.6;
      margin-top: 0.5rem;
    }
  </style>
</head>
<body>
  ${navHtml(false)}

  <div class="connect-wrap">
    <div class="connect-inner">
      <p class="eyebrow">Step 1 of 2</p>
      <h1>Connect your accounting software.</h1>
      <p class="lead">Clara will request read-only access to your books. Your data is never stored — Clara reads it in real time to answer your questions about cash, margins, and clients.</p>

      <div class="permissions">
        <p class="permissions-label">Clara will read</p>
        <ul>
          <li>Sales and revenue data</li>
          <li>Expense and payables</li>
          <li>Customer invoices and AR</li>
          <li>Profit and loss summary</li>
          <li>Balance sheet</li>
        </ul>
      </div>

      ${qbConfigured && qbAuthUrl
        ? `<a href="${qbAuthUrl}" class="btn">Connect QuickBooks &nbsp;→</a>
           <p class="connect-disclaimer">You'll be redirected to Intuit's secure sign-in. You can revoke Clara's access from your QuickBooks settings at any time.</p>`
        : `<div class="coming-soon">
             <p class="eyebrow" style="text-align:center">Connections launching soon</p>
             <p>QuickBooks, Xero, Sage, and Pastel integrations are being configured. In the meantime, try the live demo to see exactly what Clara finds.</p>
             <p style="margin-top:0.75rem"><a href="/demo" style="color:var(--accent);font-size:0.9rem">Try live demo →</a></p>
           </div>`
      }
    </div>
  </div>

  ${footerHtml()}
</body>
</html>`;
}

// ── Connected page ────────────────────────────────────────────────────────────

export function connectedPage({ apiKey, businessName }) {
  const hermesSnippet = JSON.stringify({
    mcpServers: {
      clara: {
        url: "https://clara.aerosensei.com/mcp",
        headers: {
          Authorization: `Bearer ${apiKey}`
        }
      }
    }
  }, null, 2);

  const exampleQuestions = [
    "What's my cash position right now?",
    "Which of my clients is least profitable?",
    "Who owes me money and how overdue are they?",
    "Where should I focus to improve my margins?",
    "Give me my morning financial briefing.",
  ];

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Clara is connected — Clara</title>
  ${FONTS}
  <style>
    ${BASE_CSS}

    html, body { overflow-x: hidden; }

    .connected-wrap {
      max-width: 1100px;
      width: 100%;
      box-sizing: border-box;
      padding: clamp(3rem, 6vw, 5rem) clamp(1.5rem, 6vw, 5rem);
    }

    .connected-wrap h1 {
      font-family: var(--font-serif);
      font-size: clamp(2.25rem, 4.5vw, 3.5rem);
      letter-spacing: -0.02em;
      line-height: 1.1;
      margin-bottom: 0.75rem;
    }

    .connected-wrap > .lead {
      font-size: 1.05rem;
      color: var(--text-muted);
      margin-bottom: 3rem;
      max-width: 52ch;
    }

    .step-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 2rem;
      margin-bottom: 3rem;
      max-width: 532px;
    }

    @media (max-width: 720px) {
      .step-grid { grid-template-columns: 1fr; max-width: 100%; }
    }

    .step-card {
      border: 1px solid var(--border);
      padding: 1.75rem;
    }

    .step-label {
      font-size: 0.75rem;
      font-weight: 600;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      color: var(--accent);
      margin-bottom: 0.875rem;
    }

    .step-card h3 {
      font-family: var(--font-serif);
      font-size: 1.25rem;
      margin-bottom: 0.75rem;
      letter-spacing: -0.01em;
    }

    .step-card p {
      font-size: 0.875rem;
      color: var(--text-muted);
      line-height: 1.55;
      margin-bottom: 1rem;
    }

    /* API key display */
    .api-key-box {
      display: flex;
      align-items: center;
      gap: 0;
      border: 1px solid var(--border);
      overflow: hidden;
      margin-top: 0.5rem;
    }

    .api-key-value {
      flex: 1;
      font-family: 'SF Mono', 'Fira Code', 'Fira Mono', 'Roboto Mono', monospace;
      font-size: 0.75rem;
      padding: 0.75rem 1rem;
      background: var(--bg-alt);
      color: var(--text);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      letter-spacing: 0.03em;
      user-select: all;
    }

    .copy-btn {
      flex-shrink: 0;
      background: var(--accent);
      color: #fff;
      border: none;
      padding: 0.75rem 1rem;
      font-size: 0.75rem;
      font-family: var(--font-sans);
      font-weight: 500;
      cursor: pointer;
      transition: background 0.15s;
      white-space: nowrap;
    }

    .copy-btn:hover { background: var(--accent-hover); }
    .copy-btn.copied { background: #15803D; }

    /* Config snippet */
    .code-wrap {
      position: relative;
      margin-top: 0.5rem;
      max-width: 100%;
      overflow: hidden;
    }

    .code-block {
      background: var(--text);
      color: #E8E7E1;
      font-family: 'SF Mono', 'Fira Code', 'Fira Mono', 'Roboto Mono', monospace;
      font-size: 0.75rem;
      line-height: 1.7;
      padding: 1.25rem 1.5rem;
      overflow-x: auto;
      white-space: pre;
      max-width: 100%;
      box-sizing: border-box;
    }

    .code-copy-btn {
      position: absolute;
      top: 0.5rem;
      right: 0.5rem;
      background: rgba(255,255,255,0.12);
      color: #E8E7E1;
      border: none;
      padding: 0.35rem 0.75rem;
      font-size: 0.7rem;
      font-family: var(--font-sans);
      cursor: pointer;
      transition: background 0.15s;
    }

    .code-copy-btn:hover { background: rgba(255,255,255,0.2); }
    .code-copy-btn.copied { background: rgba(34,197,94,0.3); }

    /* Try asking */
    .try-asking {
      border-top: 1px solid var(--border);
      padding-top: 2.5rem;
    }

    .try-asking h3 {
      font-family: var(--font-serif);
      font-size: 1.5rem;
      letter-spacing: -0.01em;
      margin-bottom: 1.25rem;
    }

    .questions {
      list-style: none;
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    .questions li {
      display: flex;
      align-items: baseline;
      gap: 0.75rem;
      font-size: 0.95rem;
      color: var(--text-muted);
      padding: 0.875rem 1rem;
      border: 1px solid var(--border);
      cursor: pointer;
      transition: border-color 0.15s, color 0.15s;
    }

    .questions li:hover {
      border-color: var(--accent);
      color: var(--text);
    }

    .questions li::before {
      content: '"';
      font-family: var(--font-serif);
      font-size: 1.2rem;
      color: var(--accent);
      flex-shrink: 0;
    }

    .status-badge {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      background: var(--accent-dim);
      color: var(--accent);
      padding: 0.35rem 0.875rem;
      font-size: 0.8rem;
      font-weight: 500;
      margin-bottom: 1.5rem;
    }

    .status-badge::before {
      content: '';
      width: 7px;
      height: 7px;
      border-radius: 50%;
      background: var(--accent);
    }
  </style>
</head>
<body>
  ${navHtml(false)}

  <div class="connected-wrap">
    <div class="status-badge">Connected${businessName ? ` · ${businessName}` : ''}</div>
    <h1>Clara is ready.</h1>
    <p class="lead">Your accounting software is connected. Add Clara to your AI assistant and start asking questions about your business.</p>

    <div class="step-grid">
      <!-- API Key -->
      <div class="step-card">
        <p class="step-label">Step 1 &nbsp;·&nbsp; Your API key</p>
        <h3>Copy your Clara key</h3>
        <p>You'll need this to configure Clara in your AI assistant. Keep it private — it grants access to your financial data.</p>
        <div class="api-key-box">
          <div class="api-key-value" id="apiKey">${apiKey}</div>
          <button class="copy-btn" onclick="copyApiKey(this)">Copy</button>
        </div>
      </div>

      <!-- Agent config -->
      <div class="step-card">
        <p class="step-label">Step 2 &nbsp;·&nbsp; Add to your AI assistant</p>
        <h3>Connect your agent</h3>
        <p>Choose your AI assistant below, paste the config, and restart. Clara's tools will appear automatically.</p>
        <div class="config-tabs" style="margin-top:1rem">
          <button class="config-tab active" data-tab="conn-hermes" onclick="showTab(this)">Hermes</button>
          <button class="config-tab" data-tab="conn-openclaw" onclick="showTab(this)">OpenClaw</button>
          <button class="config-tab" data-tab="conn-claude" onclick="showTab(this)">Claude Desktop</button>
        </div>
        <div id="tab-conn-hermes" class="config-panel active">
          <div class="code-wrap" style="margin-top:0">
            <pre class="code-block">mcp_servers:
  clara:
    url: https://clara.aerosensei.com/mcp
    headers:
      Authorization: "Bearer ${apiKey}"</pre>
            <button class="code-copy-btn" onclick="copySnippet(this)">Copy</button>
          </div>
          <p style="font-size:0.8rem;color:var(--text-muted);margin-top:0.5rem">Add to <code style="font-family:monospace;font-size:0.9em">~/.hermes/config.yaml</code>, restart Hermes.</p>
        </div>
        <div id="tab-conn-openclaw" class="config-panel">
          <div class="code-wrap" style="margin-top:0">
            <pre class="code-block">${escapeHtml(hermesSnippet)}</pre>
            <button class="code-copy-btn" onclick="copySnippet(this)">Copy</button>
          </div>
          <p style="font-size:0.8rem;color:var(--text-muted);margin-top:0.5rem">Add to your OpenClaw MCP config and reload.</p>
        </div>
        <div id="tab-conn-claude" class="config-panel">
          <div class="code-wrap" style="margin-top:0">
            <pre class="code-block">${escapeHtml(hermesSnippet)}</pre>
            <button class="code-copy-btn" onclick="copySnippet(this)">Copy</button>
          </div>
          <p style="font-size:0.8rem;color:var(--text-muted);margin-top:0.5rem">Add to <code style="font-family:monospace;font-size:0.9em">~/Library/Application Support/Claude/claude_desktop_config.json</code>, restart.</p>
        </div>
      </div>
    </div>

    <!-- Try asking -->
    <div class="try-asking">
      <h3>Try asking your assistant</h3>
      <ul class="questions">
        ${exampleQuestions.map(q => `<li>${q}</li>`).join('\n        ')}
      </ul>
    </div>
  </div>

  ${footerHtml()}

  <script>
    function showTab(btn) {
      const name = btn.dataset.tab;
      const parent = btn.closest('.step-card') || document.body;
      parent.querySelectorAll('.config-tab').forEach(t => t.classList.remove('active'));
      parent.querySelectorAll('.config-panel').forEach(p => p.classList.remove('active'));
      btn.classList.add('active');
      document.getElementById('tab-' + name).classList.add('active');
    }

    function copyApiKey(btn) {
      const val = document.getElementById('apiKey').textContent;
      navigator.clipboard.writeText(val).then(() => {
        btn.textContent = 'Copied!';
        btn.classList.add('copied');
        setTimeout(() => { btn.textContent = 'Copy'; btn.classList.remove('copied'); }, 2000);
      });
    }

    function copySnippet(btn) {
      const pre = btn.parentElement.querySelector('pre');
      navigator.clipboard.writeText(pre.textContent).then(() => {
        btn.textContent = 'Copied!';
        btn.classList.add('copied');
        setTimeout(() => { btn.textContent = 'Copy'; btn.classList.remove('copied'); }, 2000);
      });
    }
  </script>
</body>
</html>`;
}

function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// ── Demo page ─────────────────────────────────────────────────────────────────

export function demoPage() {
  const companies = [
    { id: 'acme-plumbing',        name: 'Acme Plumbing',        industry: 'Plumbing & Trades',        hook: '2 slow-paying clients draining $22K in cash' },
    { id: 'riverside-consulting', name: 'Riverside Consulting',  industry: 'Professional Services',    hook: '1 client losing you $1,200 every 90 days' },
    { id: 'metro-bakery',         name: 'Metro Bakery',          industry: 'Food & Retail',            hook: 'Cash gap risk approaching in 3 days' },
    { id: 'peak-fitness',         name: 'Peak Fitness',          industry: 'Health & Wellness',        hook: '$22,700/year from underpriced classes' },
    { id: 'summit-hvac',          name: 'Summit HVAC',           industry: 'HVAC & Trades',            hook: '$6,100/month in unrecovered warranty labor' },
  ];

  const businessesJson = JSON.stringify(Object.fromEntries(companies.map(c => [c.id, { name: c.name }])));

  const companyCards = companies.map(c => `
    <div class="company-card" data-id="${c.id}" onclick="selectCompany('${c.id}')">
      <span class="company-arrow">→</span>
      <p class="company-name">${c.name}</p>
      <p class="company-industry">${c.industry}</p>
      <p class="company-hook">${c.hook}</p>
    </div>`).join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Try Clara — Live Demo</title>
  <meta name="description" content="See Clara analyse a real SMB's finances — no accounting software connection needed.">
  ${FONTS}
  <style>
    ${BASE_CSS}

    .demo-header {
      padding: clamp(3rem, 6vw, 5rem) clamp(1.5rem, 6vw, 5rem) clamp(2rem, 4vw, 3rem);
      max-width: 1100px;
    }

    .demo-header h1 {
      font-family: var(--font-serif);
      font-size: clamp(2.5rem, 5vw, 4.5rem);
      letter-spacing: -0.02em;
      line-height: 1.05;
      margin-bottom: 0.875rem;
    }

    .demo-header p {
      font-size: 1.05rem;
      color: var(--text-muted);
      max-width: 52ch;
      line-height: 1.6;
    }

    .demo-sub {
      font-size: 0.85rem;
      color: var(--text-muted);
      margin-top: 0.5rem;
      opacity: 0.75;
    }

    /* Company grid */
    .company-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
      border-top: 1px solid var(--border);
      border-left: 1px solid var(--border);
      margin: 0 clamp(1.5rem, 6vw, 5rem);
    }

    .company-card {
      border-right: 1px solid var(--border);
      border-bottom: 1px solid var(--border);
      padding: 1.5rem;
      cursor: pointer;
      transition: background 0.15s;
      position: relative;
    }

    .company-card:hover { background: var(--bg-alt); }

    .company-card.selected {
      background: var(--accent-dim);
      outline: 2px solid var(--accent);
      outline-offset: -1px;
      z-index: 1;
    }

    .company-arrow {
      position: absolute;
      top: 1.25rem;
      right: 1.25rem;
      color: var(--text-muted);
      opacity: 0;
      transition: opacity 0.15s;
    }

    .company-card:hover .company-arrow,
    .company-card.selected .company-arrow { opacity: 1; color: var(--accent); }

    .company-name {
      font-family: var(--font-serif);
      font-size: 1.15rem;
      color: var(--text);
      margin-bottom: 0.2rem;
    }

    .company-industry {
      font-size: 0.75rem;
      color: var(--text-muted);
      text-transform: uppercase;
      letter-spacing: 0.07em;
      font-weight: 500;
      margin-bottom: 0.875rem;
    }

    .company-hook {
      font-size: 0.85rem;
      color: var(--accent);
      font-weight: 500;
      line-height: 1.4;
    }

    .company-hook::before {
      content: 'Clara found: ';
      color: var(--text-muted);
      font-weight: 400;
    }

    /* Tool panel */
    .tool-panel {
      margin: 0 clamp(1.5rem, 6vw, 5rem);
      border: 1px solid var(--border);
      border-top: none;
    }

    .tool-bar {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 0.875rem 1.5rem;
      border-bottom: 1px solid var(--border);
      background: var(--bg-alt);
      flex-wrap: wrap;
    }

    #selectedLabel {
      font-family: var(--font-serif);
      font-size: 0.95rem;
      color: var(--text-muted);
      white-space: nowrap;
      flex-shrink: 0;
    }

    .tool-btns {
      display: flex;
      gap: 0.4rem;
      flex-wrap: wrap;
    }

    .tool-btn {
      padding: 0.375rem 0.875rem;
      font-size: 0.8rem;
      font-weight: 500;
      font-family: var(--font-sans);
      color: var(--text-muted);
      background: none;
      border: 1px solid var(--border);
      cursor: pointer;
      transition: all 0.15s;
      white-space: nowrap;
    }

    .tool-btn:hover { border-color: var(--text-muted); color: var(--text); }

    .tool-btn.active {
      background: var(--accent);
      color: #fff;
      border-color: var(--accent);
    }

    /* Ask section */
    .ask-section {
      padding: 1rem 1.5rem;
      border-bottom: 1px solid var(--border);
      background: var(--bg-alt);
    }

    .ask-prompts {
      display: flex;
      gap: 0.4rem;
      flex-wrap: wrap;
      margin-bottom: 0.75rem;
    }

    .ask-prompt {
      font-size: 0.8rem;
      padding: 0.3rem 0.75rem;
      background: var(--bg);
      border: 1px solid var(--border);
      cursor: pointer;
      font-family: var(--font-sans);
      color: var(--text-muted);
      transition: all 0.15s;
    }

    .ask-prompt:hover { border-color: var(--accent); color: var(--text); }

    .ask-input-row {
      display: flex;
    }

    .ask-input-row input {
      flex: 1;
      padding: 0.7rem 1rem;
      font-size: 0.9rem;
      font-family: var(--font-sans);
      border: 1px solid var(--border);
      background: var(--bg);
      color: var(--text);
      outline: none;
      border-right: none;
    }

    .ask-input-row input:focus { border-color: var(--accent); }

    .ask-input-row button {
      padding: 0.7rem 1.25rem;
      background: var(--accent);
      color: #fff;
      border: none;
      font-size: 1rem;
      cursor: pointer;
      transition: background 0.15s;
      flex-shrink: 0;
    }

    .ask-input-row button:hover { background: var(--accent-hover); }

    /* Result */
    .result-box {
      padding: 2rem;
      min-height: 180px;
    }

    .result-loading {
      display: flex;
      align-items: center;
      gap: 0.875rem;
      color: var(--text-muted);
      font-size: 0.9rem;
      padding: 1rem 0;
    }

    .spinner {
      width: 16px;
      height: 16px;
      border: 2px solid var(--border);
      border-top-color: var(--accent);
      border-radius: 50%;
      animation: spin 0.75s linear infinite;
      flex-shrink: 0;
    }

    @keyframes spin { to { transform: rotate(360deg); } }

    .result-label {
      font-size: 0.75rem;
      font-weight: 600;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      color: var(--text-muted);
      margin-bottom: 1rem;
    }

    .result-text {
      font-size: 1rem;
      line-height: 1.75;
      color: var(--text);
      max-width: 72ch;
    }

    .result-text p { margin: 0 0 1em; }
    .result-text p:last-child { margin-bottom: 0; }
    .result-text ul { margin: 0 0 1em 1.25em; padding: 0; }
    .result-text li { margin-bottom: 0.35em; }
    .result-text strong { color: var(--text); font-weight: 600; }
    .result-text .result-heading { font-family: var(--font-serif); font-size: 1.05rem; font-weight: normal; margin-bottom: 0.5em; color: var(--text); }

    .result-footer {
      margin-top: 1.5rem;
      padding-top: 1rem;
      border-top: 1px solid var(--border);
      font-size: 0.8rem;
      color: var(--text-muted);
    }

    .result-footer a { color: var(--accent); text-decoration: none; }
    .result-footer a:hover { text-decoration: underline; }

    .result-error { color: #C2410C; font-size: 0.9rem; padding: 1rem 0; }

    /* Demo CTA */
    .demo-cta-bar {
      padding: clamp(2.5rem, 5vw, 4rem) clamp(1.5rem, 6vw, 5rem);
      display: flex;
      align-items: center;
      gap: 2rem;
      flex-wrap: wrap;
      border-top: 1px solid var(--border);
    }

    .demo-cta-bar p {
      font-family: var(--font-serif);
      font-size: 1.5rem;
      letter-spacing: -0.01em;
    }

    @media (max-width: 640px) {
      .company-grid { margin: 0; border-left: none; border-right: none; grid-template-columns: 1fr 1fr; }
      .tool-panel { margin: 0; border-left: none; border-right: none; }
      .tool-bar { padding: 0.75rem 1rem; }
      .result-box { padding: 1.25rem; }
    }

    @media (max-width: 440px) {
      .company-grid { grid-template-columns: 1fr; }
    }
  </style>
</head>
<body>
  ${navHtml()}

  <div class="demo-header">
    <p class="eyebrow">Live demo — no account needed</p>
    <h1>See Clara in action.</h1>
    <p>Pick a business below. Clara will read its finances and tell you exactly what matters.</p>
    <p class="demo-sub">Fictional companies with realistic financial data.</p>
  </div>

  <div class="company-grid">
    ${companyCards}
  </div>

  <div id="toolPanel" class="tool-panel" style="display:none">
    <div class="tool-bar">
      <span id="selectedLabel"></span>
      <div class="tool-btns">
        <button class="tool-btn" data-tool="get_financial_briefing" onclick="runTool(this)">Morning Briefing</button>
        <button class="tool-btn" data-tool="get_cash_forecast" onclick="runTool(this)">Cash Forecast</button>
        <button class="tool-btn" data-tool="get_margin_analysis" onclick="runTool(this)">Margin Analysis</button>
        <button class="tool-btn" data-tool="get_ar_alerts" onclick="runTool(this)">AR Alerts</button>
        <button class="tool-btn" data-tool="identify_value_gaps" onclick="runTool(this)">Value Gaps</button>
        <button class="tool-btn" data-tool="ask_clara" onclick="runTool(this)">Ask Clara</button>
      </div>
    </div>

    <div id="askSection" class="ask-section" style="display:none">
      <div class="ask-prompts">
        <button class="ask-prompt" onclick="usePrompt(this)">What should I focus on this week?</button>
        <button class="ask-prompt" onclick="usePrompt(this)">Am I heading for a cash problem?</button>
        <button class="ask-prompt" onclick="usePrompt(this)">Which client should I have a hard conversation with?</button>
      </div>
      <div class="ask-input-row">
        <input id="askInput" type="text" placeholder="Ask anything about this business…" onkeydown="if(event.key==='Enter')submitAsk()">
        <button onclick="submitAsk()">→</button>
      </div>
    </div>

    <div class="result-box">
      <div id="resultLoading" class="result-loading" style="display:none">
        <div class="spinner"></div>
        <span>Clara is reading the books…</span>
      </div>
      <div id="resultContent"></div>
    </div>
  </div>

  <div class="demo-cta-bar">
    <p>Ready to see your actual numbers?</p>
    <a href="/connect" class="btn">Connect your books &nbsp;→</a>
  </div>

  ${footerHtml()}

  <script>
    const BUSINESSES = ${businessesJson};
    let selected = null;

    function selectCompany(id) {
      selected = id;
      document.querySelectorAll('.company-card').forEach(c => {
        c.classList.toggle('selected', c.dataset.id === id);
      });
      document.getElementById('selectedLabel').textContent = BUSINESSES[id].name;
      document.getElementById('toolPanel').style.display = '';
      activateTool('get_financial_briefing');
      fetchResult('get_financial_briefing', null);
    }

    function runTool(btn) {
      const tool = btn.dataset.tool;
      activateTool(tool);
      if (tool !== 'ask_clara') fetchResult(tool, null);
    }

    function activateTool(tool) {
      document.querySelectorAll('.tool-btn').forEach(b => b.classList.toggle('active', b.dataset.tool === tool));
      const askSection = document.getElementById('askSection');
      askSection.style.display = (tool === 'ask_clara') ? '' : 'none';
      if (tool === 'ask_clara') document.getElementById('askInput').focus();
    }

    function usePrompt(btn) {
      document.getElementById('askInput').value = btn.textContent;
      submitAsk();
    }

    function submitAsk() {
      const q = document.getElementById('askInput').value.trim();
      if (!q) return;
      fetchResult('ask_clara', q);
    }

    async function fetchResult(tool, question) {
      document.getElementById('resultLoading').style.display = '';
      document.getElementById('resultContent').innerHTML = '';
      try {
        const body = { business_id: selected, tool };
        if (question) body.question = question;
        const res = await fetch('/demo/run', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });
        const data = await res.json();
        if (!data.ok) throw new Error(data.error || 'Clara hit an error.');
        renderResult(data.result, tool);
      } catch (err) {
        document.getElementById('resultContent').innerHTML =
          '<div class="result-error">Something went wrong: ' + err.message + '</div>';
      } finally {
        document.getElementById('resultLoading').style.display = 'none';
      }
    }

    const TOOL_LABELS = {
      'get_financial_briefing': 'Morning Briefing',
      'get_cash_forecast':      'Cash Forecast',
      'get_margin_analysis':    'Margin Analysis',
      'identify_value_gaps':    'Value Gaps',
      'get_ar_alerts':          'AR Alerts',
      'ask_clara':              "Clara's Answer",
    };

    function renderResult(result, tool) {
      const insight = {
        'get_financial_briefing': result.briefing,
        'get_cash_forecast':      result.forecast,
        'get_margin_analysis':    result.analysis,
        'identify_value_gaps':    result.analysis,
        'get_ar_alerts':          result.alert,
        'ask_clara':              result.answer,
      }[tool] || '';

      const label = (TOOL_LABELS[tool] || tool) + ' &nbsp;·&nbsp; ' + (BUSINESSES[selected]?.name || '');
      const html = formatInsight(insight);

      document.getElementById('resultContent').innerHTML =
        '<div class="result-label">' + label + '</div>' +
        '<div class="result-text">' + html + '</div>' +
        '<div class="result-footer">Powered by Claude Haiku &nbsp;·&nbsp; ' +
        '<a href="/connect">Connect your accounting software to see your real numbers →</a></div>';
    }

    function formatInsight(text) {
      const esc = text.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
      return esc
        .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.+?)\*/g, '<em>$1</em>')
        .replace(/^#{1,3} (.+)$/gm, '<p class="result-heading">$1</p>')
        .replace(/^[-•] (.+)$/gm, '<li>$1</li>')
        .replace(/(<li>[\s\S]+?<\/li>)/g, '<ul>$1</ul>')
        .replace(/\n{2,}/g, '</p><p>')
        .replace(/\n/g, ' ')
        .replace(/^(?!<)/, '<p>')
        .replace(/(?<!>)$/, '</p>')
        .replace(/<p><\/p>/g, '');
    }
  </script>
</body>
</html>`;
}
