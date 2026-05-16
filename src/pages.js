// HTML page templates for vigilcfo.com landing pages.
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
    padding: clamp(0.375rem, 1vw, 0.5rem) clamp(1.5rem, 6vw, 5rem);
    border-bottom: 1px solid var(--border);
  }

  .nav-logo {
    font-family: var(--font-serif);
    font-size: 1.9rem;
    color: var(--text);
    text-decoration: none;
    letter-spacing: -0.01em;
  }

  .nav-cta {
    font-size: 0.775rem;
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
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
    scrollbar-width: none;
  }

  .config-tabs::-webkit-scrollbar { display: none; }

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
    flex-shrink: 0;
  }

  .config-tab:hover { color: var(--text); }

  .config-tab.active {
    color: var(--accent);
    border-bottom-color: var(--accent);
  }

  .config-panel { display: none; }
  .config-panel.active { display: block; }

  /* ── Mobile globals ── */
  @media (max-width: 480px) {
    html { font-size: 16px; }
    .nav-secondary { display: none; }
  }
`;

function navHtml(activeCta = true) {
  return `<nav>
    <a href="/" class="nav-logo">Vigil</a>
    ${activeCta ? `<div style="display:flex;gap:1.5rem;align-items:center">
      <a href="/pricing" style="font-size:0.775rem;color:var(--text-muted);text-decoration:none">Pricing</a>
      <a href="/demo" class="nav-cta nav-secondary" style="color:var(--text-muted);border-color:var(--text-muted)">Try demo</a>
      <a href="/connect" class="nav-cta">Connect your books →</a>
    </div>` : ''}
  </nav>`;
}

function footerHtml() {
  return `<footer>
    <p>Vigil by WellDrilled &mdash; Financial intelligence for growing businesses.</p>
    <div style="display:flex;gap:1.5rem">
      <a href="/pricing">Pricing</a>
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
  <title>Vigil — Find out what your business is actually worth</title>
  <meta name="description" content="Vigil scores your business across 8 capabilities against best-in-class peers — and gives you one scripted move to close the gap. Every insight comes from your actual books.">
  <link rel="canonical" href="https://vigilcfo.com/">

  <!-- Open Graph -->
  <meta property="og:type"        content="website">
  <meta property="og:url"         content="https://vigilcfo.com/">
  <meta property="og:site_name"   content="Vigil">
  <meta property="og:title"       content="What's your business actually worth? — Vigil">
  <meta property="og:description" content="Vigil scores your business across 8 capabilities against best-in-class peers and delivers one scripted move to close the gap. Built from your actual QuickBooks data.">
  <meta property="og:image"       content="https://vigilcfo.com/hero.jpg">
  <meta property="og:image:width"  content="1280">
  <meta property="og:image:height" content="896">
  <meta property="og:image:alt"   content="Business owner reviewing Vigil Score dashboard">

  <!-- Twitter Card -->
  <meta name="twitter:card"        content="summary_large_image">
  <meta name="twitter:title"       content="What's your business actually worth? — Vigil">
  <meta name="twitter:description" content="Vigil scores your business across 8 capabilities vs. best-in-class peers. One scripted move. Real numbers from your actual books.">
  <meta name="twitter:image"       content="https://vigilcfo.com/hero.jpg">

  <!-- Favicon -->
  <link rel="icon" type="image/svg+xml" href="/favicon.svg">

  <!-- JSON-LD -->
  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": "https://vigilcfo.com/#org",
        "name": "Vigil",
        "url": "https://vigilcfo.com",
        "logo": "https://vigilcfo.com/favicon.svg",
        "description": "Financial intelligence for growing businesses.",
        "parentOrganization": {
          "@type": "Organization",
          "name": "Well Drilled Inc",
          "url": "https://welldrilled.ai"
        }
      },
      {
        "@type": "SoftwareApplication",
        "@id": "https://vigilcfo.com/#app",
        "name": "Vigil",
        "applicationCategory": "FinanceApplication",
        "operatingSystem": "Web",
        "url": "https://vigilcfo.com",
        "description": "Vigil scores your business across 8 capabilities against best-in-class peers and delivers one scripted move to close the gap. Built from your actual QuickBooks data.",
        "offers": {
          "@type": "Offer",
          "price": "0",
          "priceCurrency": "USD",
          "description": "Free to connect. Available as an MCP skill for Hermes, OpenClaw, and Claude Desktop."
        },
        "featureList": [
          "Vigil Score — 8-capability composite vs. best-in-class peers",
          "Scripted action engine",
          "Bright spot peer stories",
          "QuickBooks integration (Xero, Sage, and Pastel coming soon)",
          "MCP protocol support"
        ],
        "provider": { "@id": "https://vigilcfo.com/#org" }
      },
      {
        "@type": "FAQPage",
        "mainEntity": [
          {
            "@type": "Question",
            "name": "What is Vigil?",
            "acceptedAnswer": { "@type": "Answer", "text": "Vigil is financial intelligence for growing businesses. Vigil scores your business across 8 financial capabilities against best-in-class peers — and gives you one scripted move to close the gap. Every insight comes from your actual books." }
          },
          {
            "@type": "Question",
            "name": "How is Vigil different from QuickBooks or Xero?",
            "acceptedAnswer": { "@type": "Answer", "text": "QuickBooks and Xero record what happened. Vigil tells you where you stand relative to the best businesses in your industry — and what specifically to do about the gap. They answer 'what were my numbers?' Vigil answers 'how do I compare, and what's the one move that changes it?'" }
          },
          {
            "@type": "Question",
            "name": "Which AI assistants does Vigil work with?",
            "acceptedAnswer": { "@type": "Answer", "text": "Vigil works with any MCP-compatible AI assistant including Hermes, OpenClaw, and Claude Desktop." }
          },
          {
            "@type": "Question",
            "name": "Is my financial data safe?",
            "acceptedAnswer": { "@type": "Answer", "text": "Yes. Vigil requests read-only access to your accounting software. Vigil never writes to your books and you can revoke access at any time." }
          }
        ]
      }
    ]
  }
  </script>

  ${FONTS}
  <style>
    ${BASE_CSS}

    /* ── Landing page specific ── */

    /* Hero */
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
      padding-top: calc(clamp(3.5rem, 7vw, 7rem) - 70px);
      display: flex;
      flex-direction: column;
      justify-content: center;
    }

    .hero h1 {
      font-family: var(--font-serif);
      font-size: clamp(2.75rem, 5.5vw, 5.25rem);
      line-height: 1.03;
      letter-spacing: -0.025em;
      color: var(--text);
      margin-bottom: 1rem;
    }

    .hero-lead {
      font-size: clamp(0.875rem, 1.5vw, 0.95rem);
      color: var(--text-muted);
      line-height: 1.6;
      margin-bottom: 1.25rem;
    }

    .hero-ctas {
      display: flex;
      gap: 0.875rem;
      flex-wrap: wrap;
      align-items: center;
      margin-bottom: 0.75rem;
    }

    .hero-ctas .btn { flex: 1; justify-content: center; }

    .hero-qualifier {
      font-size: 0.8rem;
      color: var(--text-muted);
      letter-spacing: 0.01em;
    }

    .hero-img {
      position: relative;
      background: #e8e5de;
      overflow: hidden;
    }
    .hero-img > img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      object-position: center -2px;
      display: block;
    }
    .hero-img-overlay {
      position: absolute;
      inset: 0;
      background: rgba(0,0,0,0.28);
    }
    .phone-wrapper {
      position: absolute;
      top: 50%;
      right: calc(1.5rem + 20px);
      transform: translateY(-50%);
      z-index: 1;
    }

    /* Phone mockup */
    .phone-mockup {
      position: relative;
      width: 210px;
      flex-shrink: 0;
    }
    .phone-frame {
      background: #111;
      border-radius: 42px;
      border: 2.5px solid #2a2a2a;
      padding: 0;
      overflow: hidden;
      box-shadow: 0 24px 64px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,255,255,0.07), 0 0 0 1px rgba(255,255,255,0.04);
    }
    .phone-screen {
      background: #17212b;
      border-radius: 40px;
      overflow: hidden;
      padding-bottom: 20px;
    }
    .phone-island {
      width: 72px;
      height: 20px;
      background: #111;
      border-radius: 0 0 12px 12px;
      margin: 0 auto 4px;
    }
    .tg-header {
      background: #1f2b38;
      padding: 9px 12px;
      display: flex;
      align-items: center;
      gap: 9px;
      border-bottom: 1px solid rgba(255,255,255,0.04);
    }
    .tg-avatar {
      width: 34px;
      height: 34px;
      background: var(--accent);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #fff;
      font-size: 13px;
      font-weight: 700;
      font-family: var(--font-sans);
      flex-shrink: 0;
    }
    .tg-name-block { flex: 1; min-width: 0; }
    .tg-bot-name { color: #e8edf0; font-size: 12px; font-weight: 600; font-family: var(--font-sans); }
    .tg-bot-status { color: #5f7383; font-size: 9px; font-family: var(--font-sans); margin-top: 1px; }
    .tg-body { padding: 10px 8px; display: flex; flex-direction: column; gap: 5px; }
    .tg-bubble {
      background: #1f2b38;
      border-radius: 12px 12px 12px 3px;
      padding: 9px 10px;
      max-width: 96%;
    }
    .tg-bubble p { color: #c8d6e0; font-size: 10.5px; line-height: 1.45; font-family: var(--font-sans); margin: 0; }
    .tg-bubble p + p { margin-top: 5px; }
    .tg-score-card {
      background: rgba(30, 87, 57, 0.18);
      border: 1px solid rgba(30, 87, 57, 0.45);
      border-radius: 8px;
      padding: 8px 9px;
      margin: 7px 0;
    }
    .tg-score-label-sm {
      font-size: 7.5px;
      font-weight: 700;
      letter-spacing: 0.09em;
      text-transform: uppercase;
      color: #5aad77;
      font-family: var(--font-sans);
      margin-bottom: 3px;
    }
    .tg-score-value { font-size: 22px; font-weight: 700; color: #fff; font-family: var(--font-serif); line-height: 1; }
    .tg-score-denom { font-size: 12px; color: #7a8a96; font-family: var(--font-sans); }
    .tg-bar-track { background: rgba(255,255,255,0.08); border-radius: 2px; height: 4px; margin-top: 7px; overflow: hidden; }
    .tg-bar-fill { background: var(--accent); height: 100%; width: 64%; border-radius: 2px; }
    .tg-meta { font-size: 8.5px; color: #5f7383; text-align: right; margin-top: 5px; font-family: var(--font-sans); }
    .tg-action-row { display: flex; gap: 4px; }
    .tg-action-btn {
      flex: 1;
      background: #1f2b38;
      border: 1px solid rgba(255,255,255,0.07);
      border-radius: 8px;
      color: #5aaeea;
      font-size: 8.5px;
      font-family: var(--font-sans);
      padding: 6px 4px;
      text-align: center;
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
      .hero-img { order: -1; }
    }

    @media (max-width: 480px) {
      .hero { padding-top: 2.5rem; padding-bottom: 2.5rem; }
    }

    /* Score section */
    .score-section {
      background: var(--bg-alt);
      border-bottom: 1px solid var(--border);
      padding: clamp(3rem, 6vw, 5rem) clamp(1.5rem, 6vw, 5rem);
    }

    .score-inner {
      display: grid;
      grid-template-columns: auto 1fr;
      gap: clamp(2rem, 5vw, 5rem);
      align-items: center;
      max-width: 1060px;
    }

    .score-chart-wrap {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.75rem;
    }

    .score-chart-wrap svg {
      width: clamp(220px, 36vw, 360px);
      height: clamp(220px, 36vw, 360px);
    }

    .score-composite {
      text-align: center;
    }

    .score-composite-num {
      font-family: var(--font-serif);
      font-size: 2.25rem;
      letter-spacing: -0.03em;
      color: var(--text);
      line-height: 1;
    }

    .score-composite-label {
      font-size: 0.7rem;
      font-weight: 600;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      color: var(--text-muted);
      margin-top: 0.25rem;
    }

    .score-caption {
      font-size: 0.75rem;
      color: var(--text-muted);
      font-style: italic;
      text-align: center;
    }

    .score-right h2 {
      font-family: var(--font-serif);
      font-size: clamp(1.75rem, 3vw, 2.4rem);
      letter-spacing: -0.02em;
      line-height: 1.15;
      margin-bottom: 0.625rem;
    }

    .score-right .lead {
      font-size: 0.975rem;
      color: var(--text-muted);
      line-height: 1.6;
      max-width: 46ch;
      margin-bottom: 2rem;
    }

    .cap-list {
      list-style: none;
      display: flex;
      flex-direction: column;
      gap: 0;
    }

    .cap-list li {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0.6rem 0;
      border-bottom: 1px solid var(--border);
      font-size: 0.875rem;
    }

    .cap-list li:first-child { border-top: 1px solid var(--border); }

    .cap-name { color: var(--text); }

    .cap-score-wrap {
      display: flex;
      align-items: center;
      gap: 0.625rem;
    }

    .cap-bar {
      width: 80px;
      height: 4px;
      background: var(--border);
      border-radius: 2px;
      overflow: hidden;
    }

    .cap-bar-fill {
      height: 100%;
      background: var(--accent);
      border-radius: 2px;
    }

    .cap-score-val {
      font-size: 0.8rem;
      color: var(--text-muted);
      width: 2rem;
      text-align: right;
      font-variant-numeric: tabular-nums;
    }

    .score-legend {
      display: flex;
      gap: 1.5rem;
      margin-top: 1.25rem;
      font-size: 0.75rem;
      color: var(--text-muted);
    }

    .score-legend-item {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .legend-dot {
      width: 10px;
      height: 10px;
      border-radius: 50%;
      flex-shrink: 0;
    }

    .legend-dot.yours { background: var(--accent); opacity: 0.7; }
    .legend-dot.bench { border: 1.5px dashed var(--accent); background: transparent; }

    @media (max-width: 720px) {
      .score-inner { grid-template-columns: 1fr; justify-items: center; }
      .score-right { width: 100%; }
    }

    /* Gap section */
    .gap-section {
      padding: clamp(3rem, 6vw, 5rem) clamp(1.5rem, 6vw, 5rem);
      border-bottom: 1px solid var(--border);
    }

    .gap-section h2 {
      font-family: var(--font-serif);
      font-size: clamp(1.75rem, 3.5vw, 2.5rem);
      letter-spacing: -0.02em;
      line-height: 1.15;
      margin-bottom: 0.625rem;
      max-width: 28ch;
    }

    .gap-section .lead {
      font-size: 1rem;
      color: var(--text-muted);
      max-width: 52ch;
      line-height: 1.6;
      margin-bottom: 2.5rem;
    }

    .gap-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 0;
      max-width: 1060px;
    }

    @media (max-width: 680px) {
      .gap-grid { grid-template-columns: 1fr; }
    }

    .gap-card {
      padding: 1.75rem 2.5rem 1.75rem 0;
      border-top: 3px solid var(--border);
    }

    .gap-card.highlight { border-top-color: var(--accent); }

    .gap-cap {
      font-size: 0.7rem;
      font-weight: 600;
      letter-spacing: 0.1em;
      text-transform: uppercase;
      color: var(--text-muted);
      margin-bottom: 0.75rem;
    }

    .gap-card.highlight .gap-cap { color: var(--accent); }

    .gap-amount {
      font-family: var(--font-serif);
      font-size: clamp(2rem, 4vw, 2.75rem);
      letter-spacing: -0.03em;
      color: var(--text);
      line-height: 1;
      margin-bottom: 0.5rem;
    }

    .gap-desc {
      font-size: 0.875rem;
      color: var(--text-muted);
      line-height: 1.5;
    }

    /* Action section */
    .action-section {
      padding: clamp(3rem, 6vw, 5rem) clamp(1.5rem, 6vw, 5rem);
      background: var(--bg-alt);
      border-bottom: 1px solid var(--border);
    }

    .action-inner {
      max-width: 1060px;
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: clamp(2.5rem, 5vw, 5rem);
      align-items: center;
    }

    @media (max-width: 680px) {
      .action-inner { grid-template-columns: 1fr; }
    }

    .action-left h2 {
      font-family: var(--font-serif);
      font-size: clamp(1.75rem, 3.5vw, 2.5rem);
      letter-spacing: -0.02em;
      line-height: 1.15;
      margin-bottom: 0.75rem;
    }

    .action-left p {
      font-size: 1rem;
      color: var(--text-muted);
      line-height: 1.65;
      max-width: 44ch;
    }

    .action-card {
      background: var(--bg);
      border: 1px solid var(--border);
      border-left: 3px solid var(--accent);
      padding: 1.75rem 1.875rem;
    }

    .action-card-label {
      font-size: 0.7rem;
      font-weight: 600;
      letter-spacing: 0.1em;
      text-transform: uppercase;
      color: var(--accent);
      margin-bottom: 1rem;
    }

    .action-card h3 {
      font-family: var(--font-serif);
      font-size: 1.25rem;
      letter-spacing: -0.01em;
      color: var(--text);
      margin-bottom: 0.75rem;
      line-height: 1.3;
    }

    .action-card p {
      font-size: 0.875rem;
      color: var(--text-muted);
      line-height: 1.6;
      margin-bottom: 1rem;
    }

    .action-impact {
      font-size: 0.875rem;
      color: var(--text);
      font-weight: 500;
      padding: 0.75rem 1rem;
      background: var(--accent-dim);
      border-radius: 2px;
    }

    .action-impact strong { color: var(--accent); }

    /* Bright spot section */
    .spots-section {
      padding: clamp(3rem, 6vw, 5rem) clamp(1.5rem, 6vw, 5rem);
      border-bottom: 1px solid var(--border);
    }

    .spots-section h2 {
      font-family: var(--font-serif);
      font-size: clamp(1.75rem, 3.5vw, 2.5rem);
      letter-spacing: -0.02em;
      line-height: 1.15;
      margin-bottom: 0.625rem;
      max-width: 24ch;
    }

    .spots-section .lead {
      font-size: 1rem;
      color: var(--text-muted);
      line-height: 1.6;
      max-width: 52ch;
      margin-bottom: 2.5rem;
    }

    .spots-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 0;
      max-width: 1060px;
    }

    @media (max-width: 640px) {
      .spots-grid { grid-template-columns: 1fr; }
    }

    .spot-card {
      padding: 2rem 3rem 2rem 0;
      border-top: 1px solid var(--border);
    }

    .spot-tag {
      font-size: 0.7rem;
      font-weight: 600;
      letter-spacing: 0.1em;
      text-transform: uppercase;
      color: var(--text-muted);
      margin-bottom: 1rem;
    }

    .spot-quote {
      font-family: var(--font-serif);
      font-size: clamp(1.1rem, 2vw, 1.35rem);
      letter-spacing: -0.01em;
      line-height: 1.35;
      color: var(--text);
      margin-bottom: 1rem;
    }

    .spot-context {
      font-size: 0.85rem;
      color: var(--text-muted);
      line-height: 1.55;
    }

    .spot-result {
      margin-top: 1rem;
      font-size: 0.85rem;
      color: var(--accent);
      font-weight: 500;
    }

    /* Developer section */
    .dev-section {
      padding: clamp(3rem, 6vw, 5rem) clamp(1.5rem, 6vw, 5rem);
      max-width: 1060px;
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

    .code-wrap { position: relative; }

    .code-block {
      background: var(--text);
      color: #E8E7E1;
      font-family: 'SF Mono', 'Fira Code', 'Fira Mono', 'Roboto Mono', monospace;
      font-size: 11px;
      line-height: 1.7;
      padding: 1.25rem 1.5rem;
      overflow-x: auto;
      white-space: pre;
      max-width: 100%;
      box-sizing: border-box;
    }

    .code-copy-btn {
      position: absolute;
      top: 0.625rem;
      right: 0.625rem;
      background: rgba(255,255,255,0.1);
      color: #E8E7E1;
      border: none;
      font-size: 0.7rem;
      font-family: var(--font-sans);
      padding: 0.25rem 0.625rem;
      cursor: pointer;
      transition: background 0.15s;
    }

    .code-copy-btn:hover { background: rgba(255,255,255,0.2); }
    .code-copy-btn.copied { background: rgba(34,197,94,0.3); }

    /* Bottom CTA */
    .bottom-cta {
      padding: clamp(4rem, 8vw, 7rem) clamp(1.5rem, 6vw, 5rem);
      max-width: 1060px;
    }

    .bottom-cta h2 {
      font-family: var(--font-serif);
      font-size: clamp(2rem, 4vw, 3.5rem);
      letter-spacing: -0.025em;
      line-height: 1.05;
      margin-bottom: 0.875rem;
      max-width: 20ch;
    }

    .bottom-cta p {
      color: var(--text-muted);
      font-size: 1rem;
      margin-bottom: 2rem;
      max-width: 46ch;
      line-height: 1.6;
    }

    @media (max-width: 480px) {
      .hero { padding-top: 1.25rem; padding-bottom: 2rem; }
      .gap-card, .spot-card { padding-right: 0; }
    }

    /* ── 8 Questions grid ── */
    .q-section {
      padding: clamp(3rem, 6vw, 5rem) clamp(1.5rem, 6vw, 5rem);
      border-bottom: 1px solid var(--border);
    }

    .q-section h2 {
      font-family: var(--font-serif);
      font-size: clamp(1.75rem, 3.5vw, 2.5rem);
      letter-spacing: -0.02em;
      line-height: 1.15;
      margin-bottom: 0.625rem;
      max-width: 28ch;
    }

    .q-section .lead {
      font-size: 1rem;
      color: var(--text-muted);
      max-width: 52ch;
      line-height: 1.6;
      margin-bottom: 2.5rem;
    }

    .q-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      max-width: 1060px;
      background: var(--border);
      gap: 1px;
    }

    @media (max-width: 900px) { .q-grid { grid-template-columns: repeat(2, 1fr); } }
    @media (max-width: 440px) { .q-grid { grid-template-columns: 1fr; } }

    .q-card {
      background: var(--bg);
      padding: 1.875rem 1.75rem;
      display: flex;
      flex-direction: column;
      gap: 0.625rem;
      transition: background 0.15s;
    }

    .q-card:hover { background: var(--bg-alt); }

    .q-icon { font-size: 1.5rem; line-height: 1; }

    .q-text {
      font-size: 0.9375rem;
      font-weight: 600;
      color: var(--text);
      line-height: 1.4;
    }

    .q-sub {
      font-size: 0.8rem;
      color: var(--text-muted);
      line-height: 1.55;
      flex: 1;
    }

    .q-tag {
      font-size: 0.65rem;
      font-weight: 600;
      letter-spacing: 0.09em;
      text-transform: uppercase;
      color: var(--accent);
      opacity: 0.65;
      padding-top: 0.875rem;
      border-top: 1px solid var(--border);
      margin-top: 0.25rem;
    }

    .q-bridge {
      text-align: center;
      padding: 1.125rem;
      font-size: 0.825rem;
      color: var(--text-muted);
      letter-spacing: 0.02em;
      background: var(--bg-alt);
      border-top: 1px solid var(--border);
    }

    /* ── Destination Postcard ── */
    .postcard-section {
      padding: clamp(3rem, 6vw, 5rem) clamp(1.5rem, 6vw, 5rem);
      border-bottom: 1px solid var(--border);
    }

    .postcard-section h2 {
      font-family: var(--font-serif);
      font-size: clamp(1.75rem, 3.5vw, 2.5rem);
      letter-spacing: -0.02em;
      line-height: 1.15;
      margin-bottom: 0.625rem;
      max-width: 26ch;
    }

    .postcard-section .lead {
      font-size: 1rem;
      color: var(--text-muted);
      max-width: 58ch;
      line-height: 1.6;
      margin-bottom: 2.5rem;
    }

    .postcard-wrap {
      display: grid;
      grid-template-columns: 1fr 1fr;
      max-width: 1060px;
      background: var(--border);
      gap: 1px;
    }

    @media (max-width: 700px) { .postcard-wrap { grid-template-columns: 1fr; } }

    .postcard-col {
      background: #E3DDD7;
      padding: 2.5rem 2.5rem;
    }

    .postcard-col.pc-after { background: var(--bg); }

    .pc-label {
      font-size: 0.65rem;
      font-weight: 600;
      letter-spacing: 0.1em;
      text-transform: uppercase;
      margin-bottom: 1.625rem;
    }

    .pc-label.before { color: var(--text-muted); }
    .pc-label.after  { color: var(--accent); }

    .pc-score-num {
      font-family: var(--font-serif);
      font-size: clamp(3.5rem, 7vw, 5rem);
      line-height: 1;
      letter-spacing: -0.04em;
      margin-bottom: 0.25rem;
    }

    .pc-score-num.before-val { color: #C53030; }
    .pc-score-num.after-val  { color: var(--accent); }

    .pc-score-label {
      font-size: 0.7rem;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      color: var(--text-muted);
      margin-bottom: 1.75rem;
    }

    .pc-metric {
      display: flex;
      justify-content: space-between;
      align-items: baseline;
      padding: 0.6rem 0;
      border-bottom: 1px solid var(--border);
      font-size: 0.875rem;
      gap: 0.5rem;
    }

    .pc-metric:last-of-type { border-bottom: none; }
    .pc-metric-label { color: var(--text-muted); }
    .pc-metric-val   { font-weight: 600; flex-shrink: 0; }
    .pc-metric-val.bad  { color: #C53030; }
    .pc-metric-val.good { color: var(--accent); }

    .pc-first-move {
      margin-top: 1.75rem;
      border: 1px solid var(--border);
      border-left: 3px solid var(--accent);
      background: var(--bg);
      padding: 1.25rem 1.5rem;
    }

    .pc-fm-label {
      font-size: 0.65rem;
      font-weight: 600;
      letter-spacing: 0.1em;
      text-transform: uppercase;
      color: var(--accent);
      margin-bottom: 0.625rem;
    }

    .pc-fm-text {
      font-size: 0.875rem;
      color: var(--text);
      line-height: 1.6;
    }

    .pc-fm-meta {
      font-size: 0.8rem;
      color: var(--accent);
      font-weight: 500;
      margin-top: 0.5rem;
    }

    .pc-result-box {
      margin-top: 1.75rem;
      border: 1px solid var(--border);
      padding: 1.25rem 1.5rem;
      background: var(--bg-alt);
    }

    .pc-result-label {
      font-size: 0.65rem;
      font-weight: 600;
      letter-spacing: 0.1em;
      text-transform: uppercase;
      color: var(--text-muted);
      margin-bottom: 0.875rem;
    }

    .pc-result-row {
      display: flex;
      justify-content: space-between;
      align-items: baseline;
      padding: 0.5rem 0;
      border-bottom: 1px solid var(--border);
      font-size: 0.875rem;
    }

    .pc-result-row:last-child { border-bottom: none; }
    .pc-result-name { color: var(--text-muted); }
    .pc-result-val  { font-weight: 700; color: var(--accent); }

    .postcard-footer-bar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 2rem;
      flex-wrap: wrap;
      max-width: 1060px;
      background: var(--bg);
      border: 1px solid var(--border);
      border-top: none;
      padding: 1.75rem 2.5rem;
    }

    .pc-peer-note {
      font-size: 0.875rem;
      color: var(--text-muted);
      max-width: 480px;
      line-height: 1.65;
    }

    .pc-peer-note em {
      color: var(--text);
      font-style: italic;
    }
  </style>
</head>
<body>
  ${navHtml()}

  <!-- 1. Recognition — Hero -->
  <section style="clip-path:inset(0 0 50px 0);margin-bottom:-50px">
    <div class="hero-wrap">
      <div class="hero">
        <p class="eyebrow">For growing businesses</p>
        <h1>Find out what your business is actually worth &mdash; and what&rsquo;s holding it back.</h1>
        <p class="hero-lead">Most businesses reach $5M &mdash; even $10M &mdash; still flying blind on the numbers that actually drive value, and a CFO who&rsquo;d fix that is out of reach. A great CFO doesn&rsquo;t hand you a report &mdash; they tell you your position against the best in your industry, name the gap in exact dollars, and give you one specific instruction. Vigil does exactly that. Every morning. Built from your actual books.</p>
        <div class="hero-ctas">
          <a href="/connect" class="btn">Get your Vigil Score &nbsp;→</a>
          <a href="/demo" class="btn btn-ghost">See a sample score</a>
        </div>
        <p class="hero-qualifier">Free during beta &nbsp;·&nbsp; QuickBooks now &nbsp;·&nbsp; Xero, Sage &amp; Pastel coming soon &nbsp;·&nbsp; Read-only access &nbsp;·&nbsp; No credit card</p>
      </div>
      <div class="hero-img">
        <img src="/hero.jpg" alt="Business owner reviewing financial data" loading="eager">
        <div class="hero-img-overlay"></div>
        <div class="phone-wrapper">
          <div class="phone-mockup">
            <div class="phone-frame">
              <div class="phone-screen">
                <div class="phone-island"></div>
                <div class="tg-header">
                  <div class="tg-avatar">V</div>
                  <div class="tg-name-block">
                    <div class="tg-bot-name">Vigil ✓</div>
                    <div class="tg-bot-status">bot &middot; online</div>
                  </div>
                </div>
                <div class="tg-body">
                  <div class="tg-bubble">
                    <p><strong style="color:#e8edf0">Good morning, Sarah 👋</strong></p>
                    <p>Your daily briefing is ready.</p>
                    <div class="tg-score-card">
                      <div class="tg-score-label-sm">Vigil Score &mdash; Summit HVAC</div>
                      <div class="tg-score-value">3.2 <span class="tg-score-denom">/ 5.0</span></div>
                      <div class="tg-bar-track"><div class="tg-bar-fill"></div></div>
                    </div>
                    <p>Your pricing gap is costing <strong style="color:#e8edf0">$31K/year.</strong> Raise service rates 8% on jobs over $3K &mdash; comps in your market support it.</p>
                    <div class="tg-meta">07:14 AM &nbsp;✓✓</div>
                  </div>
                  <div class="tg-action-row">
                    <div class="tg-action-btn">🏆 Vigil Score</div>
                    <div class="tg-action-btn">⚡ Take Action</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>

  <!-- 1b. Recognition — Does any of this sound familiar? -->
  <section class="q-section">
    <p class="eyebrow">Does any of this sound familiar?</p>
    <h2>Every one of these questions<br>has a dollar answer.</h2>
    <p class="lead">Most business owners sense the problem. They just don&rsquo;t know where to look &mdash; or what it&rsquo;s actually costing them. Vigil does.</p>
    <div class="q-grid">
      <div class="q-card">
        <div class="q-icon">💸</div>
        <div class="q-text">Do you reach the end of the month and wonder where the cash went?</div>
        <div class="q-sub">Your revenue looked fine. Your bank balance didn&rsquo;t agree.</div>
        <div class="q-tag">Cash Cycle</div>
      </div>
      <div class="q-card">
        <div class="q-icon">💰</div>
        <div class="q-text">Are you afraid to raise your prices &mdash; even though you haven&rsquo;t in two years?</div>
        <div class="q-sub">Most owners are charging 15&ndash;25% below what their market will quietly pay.</div>
        <div class="q-tag">Pricing Strategy</div>
      </div>
      <div class="q-card">
        <div class="q-icon">🔍</div>
        <div class="q-text">Are you busy doing work that&rsquo;s quietly losing you money?</div>
        <div class="q-sub">Not all revenue is good revenue. Some of your jobs are subsidising the rest.</div>
        <div class="q-tag">Gross Margin by Segment</div>
      </div>
      <div class="q-card">
        <div class="q-icon">⚠️</div>
        <div class="q-text">If your biggest client called tomorrow and said they were leaving &mdash; then what?</div>
        <div class="q-sub">One phone call shouldn&rsquo;t have the power to threaten your payroll.</div>
        <div class="q-tag">Customer Concentration</div>
      </div>
      <div class="q-card">
        <div class="q-icon">⏱️</div>
        <div class="q-text">Are you still chasing invoices from 60 days ago?</div>
        <div class="q-sub">Every day you wait to collect, you&rsquo;re financing someone else&rsquo;s business with your own cash.</div>
        <div class="q-tag">Collection Discipline</div>
      </div>
      <div class="q-card">
        <div class="q-icon">⚡</div>
        <div class="q-text">Do you actually know how much revenue each person on your team generates?</div>
        <div class="q-sub">The best-performing businesses your size track this. Most don&rsquo;t. There&rsquo;s a gap between them.</div>
        <div class="q-tag">Labor Efficiency</div>
      </div>
      <div class="q-card">
        <div class="q-icon">🎢</div>
        <div class="q-text">Great month. Terrible month. Great month. Is that just how your business works?</div>
        <div class="q-sub">The feast-or-famine cycle isn&rsquo;t bad luck. It&rsquo;s a solvable structure problem.</div>
        <div class="q-tag">Revenue Mix</div>
      </div>
      <div class="q-card">
        <div class="q-icon">📈</div>
        <div class="q-text">Is your business growing &mdash; but somehow you&rsquo;re not actually making more money?</div>
        <div class="q-sub">When costs scale faster than revenue, growth becomes the enemy. This is more common than you think.</div>
        <div class="q-tag">Cost vs. Revenue Growth</div>
      </div>
    </div>
  </section>
  <p class="q-bridge">&#x2193;&nbsp;&nbsp; Vigil finds the answer to all eight. From your actual books. &nbsp;&nbsp;&#x2193;</p>

  <!-- 2. Possibility — The Vigil Score -->
  <section class="score-section">
    <div class="score-inner">
      <div class="score-chart-wrap">
        <!-- Radar chart: Summit HVAC sample, composite 3.2/5.0 -->
        <!-- Center (220,220), r=150. Caps: Pricing 2.4, Cash Cycle 3.1, Customer Risk 2.8,
             Gross Margin 3.4, Labor 2.1, Revenue Mix 3.8, Collections 2.6, Cost vs Growth 3.2 -->
        <svg viewBox="0 0 440 440" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
          <!-- Grid rings at r=30,60,90,120,150 -->
          <polygon points="220,190 241.2,198.8 250,220 241.2,241.2 220,250 198.8,241.2 190,220 198.8,198.8" fill="none" stroke="#E2E1DA" stroke-width="1"/>
          <polygon points="220,160 262.4,177.6 280,220 262.4,262.4 220,280 177.6,262.4 160,220 177.6,177.6" fill="none" stroke="#E2E1DA" stroke-width="1"/>
          <polygon points="220,130 283.6,156.4 310,220 283.6,283.6 220,310 156.4,283.6 130,220 156.4,156.4" fill="none" stroke="#E2E1DA" stroke-width="1"/>
          <polygon points="220,100 304.9,135.1 340,220 304.9,304.9 220,340 135.1,304.9 100,220 135.1,135.1" fill="none" stroke="#E2E1DA" stroke-width="1"/>
          <polygon points="220,70 326.1,113.9 370,220 326.1,326.1 220,370 113.9,326.1 70,220 113.9,113.9" fill="none" stroke="#E2E1DA" stroke-width="1"/>
          <!-- Axis spokes -->
          <line x1="220" y1="220" x2="220" y2="70" stroke="#E2E1DA" stroke-width="1"/>
          <line x1="220" y1="220" x2="326.1" y2="113.9" stroke="#E2E1DA" stroke-width="1"/>
          <line x1="220" y1="220" x2="370" y2="220" stroke="#E2E1DA" stroke-width="1"/>
          <line x1="220" y1="220" x2="326.1" y2="326.1" stroke="#E2E1DA" stroke-width="1"/>
          <line x1="220" y1="220" x2="220" y2="370" stroke="#E2E1DA" stroke-width="1"/>
          <line x1="220" y1="220" x2="113.9" y2="326.1" stroke="#E2E1DA" stroke-width="1"/>
          <line x1="220" y1="220" x2="70" y2="220" stroke="#E2E1DA" stroke-width="1"/>
          <line x1="220" y1="220" x2="113.9" y2="113.9" stroke="#E2E1DA" stroke-width="1"/>
          <!-- Benchmark ring at 4.5/5 = r=135 (dashed) -->
          <polygon points="220,85 315.5,124.5 355,220 315.5,315.5 220,355 124.5,315.5 85,220 124.5,124.5" fill="none" stroke="#1E5739" stroke-width="1.5" stroke-dasharray="5,4" opacity="0.35"/>
          <!-- Score polygon: 2.4,3.1,2.8,3.4,2.1,3.8,2.6,3.2 -->
          <polygon points="220,148 285.8,154.2 304,220 292.1,292.1 220,283 139.3,300.7 142,220 152,152" fill="#1E5739" fill-opacity="0.12" stroke="#1E5739" stroke-width="2" stroke-linejoin="round"/>
          <!-- Score dots -->
          <circle cx="220" cy="148" r="4" fill="#1E5739"/>
          <circle cx="285.8" cy="154.2" r="4" fill="#1E5739"/>
          <circle cx="304" cy="220" r="4" fill="#1E5739"/>
          <circle cx="292.1" cy="292.1" r="4" fill="#1E5739"/>
          <circle cx="220" cy="283" r="4" fill="#1E5739"/>
          <circle cx="139.3" cy="300.7" r="4" fill="#1E5739"/>
          <circle cx="142" cy="220" r="4" fill="#1E5739"/>
          <circle cx="152" cy="152" r="4" fill="#1E5739"/>
          <!-- Center -->
          <circle cx="220" cy="220" r="3" fill="#1E5739" opacity="0.4"/>
          <!-- Axis labels -->
          <text x="220" y="52" text-anchor="middle" font-family="Inter,sans-serif" font-size="11" fill="#706F67">Pricing</text>
          <text x="342" y="100" text-anchor="middle" font-family="Inter,sans-serif" font-size="11" fill="#706F67">Cash</text>
          <text x="390" y="224" text-anchor="start" font-family="Inter,sans-serif" font-size="11" fill="#706F67">Risk</text>
          <text x="342" y="348" text-anchor="middle" font-family="Inter,sans-serif" font-size="11" fill="#706F67">Margin</text>
          <text x="220" y="396" text-anchor="middle" font-family="Inter,sans-serif" font-size="11" fill="#706F67">Labor</text>
          <text x="98" y="348" text-anchor="middle" font-family="Inter,sans-serif" font-size="11" fill="#706F67">Rev. Mix</text>
          <text x="40" y="224" text-anchor="end" font-family="Inter,sans-serif" font-size="11" fill="#706F67">AR</text>
          <text x="98" y="100" text-anchor="middle" font-family="Inter,sans-serif" font-size="11" fill="#706F67">Cost</text>
        </svg>
        <div class="score-composite">
          <div class="score-composite-num">3.2<span style="font-size:1.1rem;opacity:0.45"> / 5.0</span></div>
          <div class="score-composite-label">Vigil Score</div>
        </div>
        <p class="score-caption">Example &mdash; Summit HVAC, $4.1M revenue</p>
      </div>

      <div class="score-right">
        <p class="eyebrow">The Vigil Score</p>
        <h2>Eight capabilities. One composite score. One move.</h2>
        <p class="lead">Every growing business has the same eight financial levers. Vigil reads your actual QuickBooks data, scores each one from 1&ndash;5, and compares you against the best in your industry. Vigil tells you which lever to pull first &mdash; with exact language and dollar impact.</p>
        <ul class="cap-list">
          <li><span class="cap-name">Pricing Strategy</span><span class="cap-score-wrap"><span class="cap-bar"><span class="cap-bar-fill" style="width:48%"></span></span><span class="cap-score-val">2.4</span></span></li>
          <li><span class="cap-name">Cash Cycle Management</span><span class="cap-score-wrap"><span class="cap-bar"><span class="cap-bar-fill" style="width:62%"></span></span><span class="cap-score-val">3.1</span></span></li>
          <li><span class="cap-name">Customer Concentration</span><span class="cap-score-wrap"><span class="cap-bar"><span class="cap-bar-fill" style="width:56%"></span></span><span class="cap-score-val">2.8</span></span></li>
          <li><span class="cap-name">Gross Margin by Segment</span><span class="cap-score-wrap"><span class="cap-bar"><span class="cap-bar-fill" style="width:68%"></span></span><span class="cap-score-val">3.4</span></span></li>
          <li><span class="cap-name">Labor Efficiency</span><span class="cap-score-wrap"><span class="cap-bar"><span class="cap-bar-fill" style="width:42%"></span></span><span class="cap-score-val">2.1</span></span></li>
          <li><span class="cap-name">Revenue Mix (Recurring %)</span><span class="cap-score-wrap"><span class="cap-bar"><span class="cap-bar-fill" style="width:76%"></span></span><span class="cap-score-val">3.8</span></span></li>
          <li><span class="cap-name">Collection Discipline</span><span class="cap-score-wrap"><span class="cap-bar"><span class="cap-bar-fill" style="width:52%"></span></span><span class="cap-score-val">2.6</span></span></li>
          <li><span class="cap-name">Cost vs Revenue Growth</span><span class="cap-score-wrap"><span class="cap-bar"><span class="cap-bar-fill" style="width:64%"></span></span><span class="cap-score-val">3.2</span></span></li>
        </ul>
        <div class="score-legend">
          <span class="score-legend-item"><span class="legend-dot yours"></span>Your score</span>
          <span class="score-legend-item"><span class="legend-dot bench"></span>Best-in-class avg: 4.5</span>
        </div>
      </div>
    </div>
  </section>

  <!-- 3. Stakes — Dollar gap -->
  <section class="gap-section">
    <p class="eyebrow">Your gap, in dollars</p>
    <h2>Most growing businesses leave $60K&ndash;$200K on the table every year.</h2>
    <p class="lead">Vigil doesn&rsquo;t show you ratios. Vigil shows you the cash that&rsquo;s missing &mdash; by capability, named and quantified, from your actual books.</p>
    <div class="gap-grid">
      <div class="gap-card highlight">
        <p class="gap-cap">Pricing Strategy</p>
        <div class="gap-amount">$31,200</div>
        <p class="gap-desc">Your average service rate is 18% below benchmark for HVAC contractors in your revenue range. At your volume, that's $31K a year in unrecovered margin.</p>
      </div>
      <div class="gap-card">
        <p class="gap-cap">Collection Discipline</p>
        <div class="gap-amount">$22,800</div>
        <p class="gap-desc">Average DSO is 54 days versus the 34-day benchmark. At your AR volume, tightening collections frees $22K in working capital and reduces bad debt exposure.</p>
      </div>
      <div class="gap-card">
        <p class="gap-cap">Revenue Mix</p>
        <div class="gap-amount">$18,400</div>
        <p class="gap-desc">41% of revenue is recurring vs. the 67% benchmark. The low recurring base inflates customer acquisition cost and depresses your business's exit multiple.</p>
      </div>
    </div>
  </section>

  <!-- 4. Action — One scripted move -->
  <section class="action-section">
    <div class="action-inner">
      <div class="action-left">
        <p class="eyebrow">One scripted move</p>
        <h2>Not a report.<br>An instruction.</h2>
        <p>Vigil gives you one specific move each week &mdash; not a list of things to consider, not a dashboard to monitor. One thing, with exact language, that moves your lowest-scoring capability toward the benchmark. Do it, and the score moves.</p>
      </div>
      <div class="action-card">
        <p class="action-card-label">This week &mdash; Pricing Strategy &nbsp;·&nbsp; Priority 1</p>
        <h3>Raise your residential service call rate from $95 to $110.</h3>
        <p>Your current rate is $95. The benchmark for HVAC contractors at your revenue range is $108&ndash;$115. Your last 47 service calls averaged 94 minutes of labour. At $110, you recover $705 on last month's volume alone.</p>
        <p>Update the rate in QuickBooks under <em>Products &amp; Services → Service Call</em>. Apply to all new invoices from Monday.</p>
        <div class="action-impact"><strong>Expected impact:</strong> $8,460/year additional revenue &nbsp;·&nbsp; Pricing score: 2.4 → 3.6</div>
      </div>
    </div>
  </section>

  <!-- 5. Bright spots — Peer proof -->
  <section class="spots-section">
    <p class="eyebrow">Bright spots &mdash; businesses like yours</p>
    <h2>Same size. Same constraints. Already ahead.</h2>
    <p class="lead">Every Vigil Score shows you peers who already fixed the gap you're facing &mdash; in the same industry, at the same revenue range, starting from the same score.</p>
    <div class="spots-grid">
      <div class="spot-card">
        <p class="spot-tag">Plumbing &nbsp;·&nbsp; $3.8M revenue &nbsp;·&nbsp; Phoenix, AZ</p>
        <p class="spot-quote">"We had no idea our pricing was 22% below market. We thought customers would push back. Three months in, not a single one did."</p>
        <p class="spot-context">Pricing score was 2.1. Raised rates on maintenance contracts and service calls over six weeks. No customer attrition.</p>
        <p class="spot-result">+$44,200 annual revenue &nbsp;·&nbsp; Score: 2.1 → 4.3</p>
      </div>
      <div class="spot-card">
        <p class="spot-tag">Landscaping &nbsp;·&nbsp; $2.2M revenue &nbsp;·&nbsp; Austin, TX</p>
        <p class="spot-quote">"Our cash was always tight even when the books looked fine. Turns out our DSO was 61 days. Vigil showed us exactly which customers to call first."</p>
        <p class="spot-context">Collection Discipline score was 1.8. Implemented a 30-day follow-up sequence for invoices over $500. DSO dropped to 38 days in 10 weeks.</p>
        <p class="spot-result">$31,000 freed from AR &nbsp;·&nbsp; Score: 1.8 → 3.9</p>
      </div>
    </div>
  </section>

  <!-- 5b. Destination Postcard -->
  <section class="postcard-section">
    <p class="eyebrow">The destination</p>
    <h2>Here is what 4.2 looks like.<br>It&rsquo;s closer than you think.</h2>
    <p class="lead">Below is a composite of the businesses most similar to yours that have reached a Vigil Score of 4.2 or above &mdash; same industry range, same starting point, same constraints. This is where the work takes you.</p>
    <div class="postcard-wrap">
      <div class="postcard-col">
        <p class="pc-label before">Where they started</p>
        <div class="pc-score-num before-val">2.3</div>
        <p class="pc-score-label">Vigil Score &middot; Starting position</p>
        <div class="pc-metric"><span class="pc-metric-label">Service pricing vs. market</span><span class="pc-metric-val bad">&ndash;19% below</span></div>
        <div class="pc-metric"><span class="pc-metric-label">Cash runway</span><span class="pc-metric-val bad">28 days</span></div>
        <div class="pc-metric"><span class="pc-metric-label">Top client share of revenue</span><span class="pc-metric-val bad">26%</span></div>
        <div class="pc-metric"><span class="pc-metric-label">Gross margin</span><span class="pc-metric-val bad">29%</span></div>
        <div class="pc-metric"><span class="pc-metric-label">Recurring revenue</span><span class="pc-metric-val bad">21%</span></div>
        <div class="pc-metric"><span class="pc-metric-label">Days to collect (DSO)</span><span class="pc-metric-val bad">61 days</span></div>
        <div class="pc-metric"><span class="pc-metric-label">Net margin</span><span class="pc-metric-val bad">9%</span></div>
        <div class="pc-first-move">
          <p class="pc-fm-label">Their first move &mdash; week one</p>
          <p class="pc-fm-text">Raised their service call rate on new jobs only. Existing clients untouched. Zero pushback. $0 cost. Took four minutes to update in QuickBooks.</p>
          <p class="pc-fm-meta">Recovered $8,400 in the first 60 days.</p>
        </div>
      </div>
      <div class="postcard-col pc-after">
        <p class="pc-label after">Where they are now &middot; Score 4.2</p>
        <div class="pc-score-num after-val">4.2</div>
        <p class="pc-score-label">Vigil Score &middot; 16 months later</p>
        <div class="pc-metric"><span class="pc-metric-label">Service pricing vs. market</span><span class="pc-metric-val good">Market rate</span></div>
        <div class="pc-metric"><span class="pc-metric-label">Cash runway</span><span class="pc-metric-val good">79 days</span></div>
        <div class="pc-metric"><span class="pc-metric-label">Top client share of revenue</span><span class="pc-metric-val good">9%</span></div>
        <div class="pc-metric"><span class="pc-metric-label">Gross margin</span><span class="pc-metric-val good">43%</span></div>
        <div class="pc-metric"><span class="pc-metric-label">Recurring revenue</span><span class="pc-metric-val good">58%</span></div>
        <div class="pc-metric"><span class="pc-metric-label">Days to collect (DSO)</span><span class="pc-metric-val good">28 days</span></div>
        <div class="pc-metric"><span class="pc-metric-label">Net margin</span><span class="pc-metric-val good">21%</span></div>
        <div class="pc-result-box">
          <p class="pc-result-label">Net financial effect &mdash; 16 months</p>
          <div class="pc-result-row"><span class="pc-result-name">Additional annual revenue</span><span class="pc-result-val">+$154,000</span></div>
          <div class="pc-result-row"><span class="pc-result-name">Cash freed from AR</span><span class="pc-result-val">+$38,000</span></div>
          <div class="pc-result-row"><span class="pc-result-name">Exit multiple (est.)</span><span class="pc-result-val">2.1&times; &rarr; 3.6&times;</span></div>
        </div>
      </div>
    </div>
    <div class="postcard-footer-bar">
      <p class="pc-peer-note">They were at 2.3. They were nervous about raising prices. They started with one rate change on one service. <em>Vigil told them exactly which one.</em> Your 4.2 starts the same way.</p>
      <a href="/connect" class="btn">See what your 4.2 looks like &nbsp;&rarr;</a>
    </div>
  </section>

  <!-- 6. How it works -->
  <section style="border-top:1px solid var(--border);border-bottom:1px solid var(--border);background:var(--bg-alt)">
    <div style="padding:clamp(3rem,6vw,5rem) clamp(1.5rem,6vw,5rem);max-width:1060px">
      <p class="eyebrow">How it works</p>
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:0;margin-top:2rem">
        <div style="padding:1.5rem 2.5rem 1.5rem 0;border-top:3px solid var(--accent)">
          <div style="font-family:var(--font-serif);font-size:2rem;color:var(--accent);opacity:0.5;margin-bottom:0.75rem">1</div>
          <h3 style="font-size:1rem;font-weight:600;margin-bottom:0.5rem">Connect your books</h3>
          <p style="font-size:0.875rem;color:var(--text-muted);line-height:1.55">One-click QuickBooks OAuth. Read-only access &mdash; Vigil never writes to your books. Revocable any time. Xero, Sage &amp; Pastel coming soon.</p>
        </div>
        <div style="padding:1.5rem 2.5rem 1.5rem 0;border-top:1px solid var(--border)">
          <div style="font-family:var(--font-serif);font-size:2rem;color:var(--text-muted);opacity:0.5;margin-bottom:0.75rem">2</div>
          <h3 style="font-size:1rem;font-weight:600;margin-bottom:0.5rem">Vigil scores your business</h3>
          <p style="font-size:0.875rem;color:var(--text-muted);line-height:1.55">Overnight, Vigil calculates your score across all 8 capabilities from your actual transaction data.</p>
        </div>
        <div style="padding:1.5rem 2.5rem 1.5rem 0;border-top:1px solid var(--border)">
          <div style="font-family:var(--font-serif);font-size:2rem;color:var(--text-muted);opacity:0.5;margin-bottom:0.75rem">3</div>
          <h3 style="font-size:1rem;font-weight:600;margin-bottom:0.5rem">Get one scripted move</h3>
          <p style="font-size:0.875rem;color:var(--text-muted);line-height:1.55">Every morning, Vigil surfaces your priority gap and gives you one specific instruction &mdash; not a recommendation. An instruction.</p>
        </div>
        <div style="padding:1.5rem 0 1.5rem 0;border-top:1px solid var(--border)">
          <div style="font-family:var(--font-serif);font-size:2rem;color:var(--text-muted);opacity:0.5;margin-bottom:0.75rem">4</div>
          <h3 style="font-size:1rem;font-weight:600;margin-bottom:0.5rem">Watch the score move</h3>
          <p style="font-size:0.875rem;color:var(--text-muted);line-height:1.55">As your books update, your score updates. Do the move, see the number change. That's the identity shift.</p>
        </div>
      </div>
    </div>
  </section>

  <!-- 7. CTA -->
  <section>
    <div class="bottom-cta">
      <p class="eyebrow">Free during beta</p>
      <h2>Your score is waiting.</h2>
      <p>Connect your QuickBooks and get your Vigil Score in minutes. See exactly where you stand, what it's costing you, and the one move that changes it most. Free, read-only, no credit card.</p>
      <div style="display:flex;gap:0.875rem;flex-wrap:wrap">
        <a href="/connect" class="btn">Get your Vigil Score &nbsp;→</a>
        <a href="/demo" class="btn btn-ghost">Try live demo</a>
      </div>
    </div>
  </section>

  ${footerHtml()}

  <!-- Developer section — MCP -->
  <section style="border-top:1px solid var(--border)">
    <div class="dev-section">
      <p class="eyebrow">For AI developers</p>
      <h2>Connect Vigil to your agent.</h2>
      <p class="lead">Vigil is an MCP skill. Add it to Hermes, OpenClaw, or Claude Desktop and your agent gains instant financial intelligence for any connected business.</p>

      <div class="config-tabs">
        <button class="config-tab active" data-tab="lp-hermes" onclick="showTab(this)">Hermes</button>
        <button class="config-tab" data-tab="lp-openclaw" onclick="showTab(this)">OpenClaw</button>
        <button class="config-tab" data-tab="lp-claude" onclick="showTab(this)">Claude Desktop</button>
      </div>

      <div id="tab-lp-hermes" class="config-panel active">
        <div class="code-wrap" style="margin-top:0">
          <pre class="code-block">mcp_servers:
  vigil:
    url: https://vigilcfo.com/mcp
    headers:
      Authorization: "Bearer YOUR_VIGIL_API_KEY"</pre>
          <button class="code-copy-btn" onclick="copyCode(this)">Copy</button>
        </div>
        <p class="dev-note">Add to <code>~/.hermes/config.yaml</code> and restart Hermes. Vigil's tools appear automatically.</p>
      </div>

      <div id="tab-lp-openclaw" class="config-panel">
        <div class="code-wrap" style="margin-top:0">
          <pre class="code-block">{
  "mcpServers": {
    "vigil": {
      "url": "https://vigilcfo.com/mcp",
      "headers": {
        "Authorization": "Bearer YOUR_VIGIL_API_KEY"
      }
    }
  }
}</pre>
          <button class="code-copy-btn" onclick="copyCode(this)">Copy</button>
        </div>
        <p class="dev-note">Add to your OpenClaw MCP config and reload. Vigil will appear as a connected skill.</p>
      </div>

      <div id="tab-lp-claude" class="config-panel">
        <div class="code-wrap" style="margin-top:0">
          <pre class="code-block">{
  "mcpServers": {
    "vigil": {
      "url": "https://vigilcfo.com/mcp",
      "headers": {
        "Authorization": "Bearer YOUR_VIGIL_API_KEY"
      }
    }
  }
}</pre>
          <button class="code-copy-btn" onclick="copyCode(this)">Copy</button>
        </div>
        <p class="dev-note">Add to <code>~/Library/Application Support/Claude/claude_desktop_config.json</code> and restart Claude Desktop.</p>
      </div>

      <p class="dev-note" style="margin-top:1.5rem">Replace <code>YOUR_VIGIL_API_KEY</code> with the key from your <a href="/connect">Vigil dashboard</a>. &nbsp;·&nbsp; <a href="/demo">Try the live demo →</a></p>
    </div>
  </section>

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
  <title>Connect your accounting software — Vigil</title>
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
      <p class="lead">Vigil will request read-only access to your books. Your data is never stored — Vigil reads it in real time to answer your questions about cash, margins, and clients.</p>

      <div class="permissions">
        <p class="permissions-label">Vigil will read</p>
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
           <p class="connect-disclaimer">You'll be redirected to Intuit's secure sign-in. You can revoke Vigil's access from your QuickBooks settings at any time.</p>`
        : `<div class="coming-soon">
             <p class="eyebrow" style="text-align:center">Connections launching soon</p>
             <p>QuickBooks, Xero, Sage, and Pastel integrations are being configured. In the meantime, try the live demo to see exactly what Vigil finds.</p>
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

export function connectedPage({ apiKey, businessName, viaTelegram = false }) {
  const hermesSnippet = JSON.stringify({
    mcpServers: {
      vigil: {
        url: "https://vigilcfo.com/mcp",
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
  <title>Vigil is connected — Vigil</title>
  <link rel="icon" type="image/svg+xml" href="/favicon.svg">
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
    }

    @media (max-width: 720px) {
      .step-grid { grid-template-columns: 1fr; max-width: 100%; }
    }

    .step-card {
      border: 1px solid var(--border);
      padding: 1.75rem;
      min-width: 0;
      overflow: hidden;
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
      font-size: 11px;
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
    <h1>Vigil is ready.</h1>

    ${viaTelegram ? `
    <p class="lead">Your QuickBooks is connected. Head back to Telegram and start asking questions about your business.</p>

    <div class="step-grid" style="grid-template-columns:1fr;max-width:560px">
      <div class="step-card" style="text-align:center;padding:2.5rem 2rem">
        <div style="font-size:3rem;margin-bottom:1rem">💬</div>
        <h3 style="margin-bottom:0.5rem">Go back to Telegram</h3>
        <p style="margin-bottom:1.5rem">Your real financial data is ready. Tap <strong>📊 Morning Briefing</strong> to see your first insight.</p>
        <a href="https://t.me/Vigil_CFO_bot" class="cta-btn" style="display:inline-block;text-decoration:none">Open Telegram →</a>
      </div>
    </div>

    <div class="try-asking">
      <h3>Things to ask Vigil</h3>
      <ul class="questions">
        ${exampleQuestions.map(q => `<li>${q}</li>`).join('\n        ')}
      </ul>
    </div>
    ` : `
    <p class="lead">Your accounting software is connected. Add Vigil to your AI assistant and start asking questions about your business.</p>

    <div class="step-grid">
      <!-- API Key -->
      <div class="step-card">
        <p class="step-label">Step 1 &nbsp;·&nbsp; Your API key</p>
        <h3>Copy your Vigil key</h3>
        <p>You'll need this to configure Vigil in your AI assistant. Keep it private — it grants access to your financial data.</p>
        <div class="api-key-box">
          <div class="api-key-value" id="apiKey">${apiKey}</div>
          <button class="copy-btn" onclick="copyApiKey(this)">Copy</button>
        </div>
        <p style="font-size:0.8rem;color:var(--text-muted);margin-top:0.75rem">Lost this key later? Go through <a href="/connect" style="color:inherit;text-decoration:underline">Connect QuickBooks</a> again — a fresh key will be issued automatically.</p>
      </div>

      <!-- Agent config -->
      <div class="step-card">
        <p class="step-label">Step 2 &nbsp;·&nbsp; Add to your AI assistant</p>
        <h3>Connect your agent</h3>
        <p>Choose your AI assistant below, paste the config, and restart. Vigil's tools will appear automatically.</p>
        <div class="config-tabs" style="margin-top:1rem">
          <button class="config-tab active" data-tab="conn-hermes" onclick="showTab(this)">Hermes</button>
          <button class="config-tab" data-tab="conn-openclaw" onclick="showTab(this)">OpenClaw</button>
          <button class="config-tab" data-tab="conn-claude" onclick="showTab(this)">Claude Desktop</button>
        </div>
        <div id="tab-conn-hermes" class="config-panel active">
          <div class="code-wrap" style="margin-top:0">
            <pre class="code-block">mcp_servers:
  vigil:
    url: https://vigilcfo.com/mcp
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
    `}
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
  <title>Try Vigil — Live Demo</title>
  <meta name="description" content="See Vigil analyse a real SMB's finances — no accounting software connection needed.">
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
      content: 'Vigil found: ';
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
      min-width: 0;
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
      .tool-bar { padding: 0.75rem 1rem; gap: 0.625rem; }
      .result-box { padding: 1.25rem; }
      .demo-header { padding-bottom: 1.5rem; }
    }

    @media (max-width: 440px) {
      .company-grid { grid-template-columns: 1fr; }
      #selectedLabel { display: none; }
    }
  </style>
</head>
<body>
  ${navHtml()}

  <div class="demo-header">
    <p class="eyebrow">Live demo — no account needed</p>
    <h1>See Vigil in action.</h1>
    <p>Pick a business below. Vigil will read its finances and tell you exactly what matters.</p>
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
        <button class="tool-btn" data-tool="ask_clara" onclick="runTool(this)">Ask Vigil</button>
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
        <span>Vigil is reading the books…</span>
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
        if (!data.ok) throw new Error(data.error || 'Vigil hit an error.');
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
      'ask_clara':              "Vigil's Answer",
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
        .replace(/\\*\\*(.+?)\\*\\*/g, '<strong>$1</strong>')
        .replace(/\\*(.+?)\\*/g, '<em>$1</em>')
        .replace(/^#{1,3} (.+)$/gm, '<p class="result-heading">$1</p>')
        .replace(/^[-•] (.+)$/gm, '<li>$1</li>')
        .replace(/(<li>[\\s\\S]+?<\\/li>)/g, '<ul>$1</ul>')
        .replace(/\\n{2,}/g, '</p><p>')
        .replace(/\\n/g, ' ')
        .replace(/^(?!<)/, '<p>')
        .replace(/(?<!>)$/, '</p>')
        .replace(/<p><\\/p>/g, '');
    }
  </script>
</body>
</html>`;
}

// ── Privacy page ───────────────────────────────────────────────────────────────

export function privacyPage() {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Privacy Policy — Vigil</title>
  <meta name="description" content="How Vigil handles your financial data.">
  ${FONTS}
  <style>
    ${BASE_CSS}

    .prose-wrap {
      max-width: 720px;
      margin: 0 auto;
      padding: clamp(3rem, 8vw, 6rem) clamp(1.5rem, 6vw, 5rem);
    }

    .prose-wrap h1 {
      font-family: var(--font-serif);
      font-size: clamp(2rem, 4vw, 2.8rem);
      line-height: 1.15;
      letter-spacing: -0.02em;
      margin-bottom: 0.5rem;
    }

    .prose-wrap .updated {
      font-size: 0.85rem;
      color: var(--text-muted);
      margin-bottom: 3rem;
    }

    .prose-wrap h2 {
      font-size: 1.1rem;
      font-weight: 600;
      margin: 2.5rem 0 0.75rem;
    }

    .prose-wrap p, .prose-wrap li {
      font-size: 1rem;
      color: var(--text-muted);
      line-height: 1.75;
    }

    .prose-wrap ul {
      padding-left: 1.5rem;
      margin: 0.75rem 0;
    }

    .prose-wrap li { margin-bottom: 0.4rem; }

    .prose-wrap a {
      color: var(--accent);
      text-decoration: underline;
      text-underline-offset: 3px;
    }

    .callout {
      background: var(--accent-dim);
      border-left: 3px solid var(--accent);
      padding: 1rem 1.25rem;
      border-radius: 0 4px 4px 0;
      margin: 2rem 0;
    }

    .callout p {
      color: var(--text);
      font-size: 0.95rem;
    }
  </style>
</head>
<body>
  ${navHtml()}
  <div class="prose-wrap">
    <p class="eyebrow">Legal</p>
    <h1>Privacy Policy</h1>
    <p class="updated">Last updated: 15 May 2026 &nbsp;&middot;&nbsp; Applies to vigilcfo.com</p>

    <div class="callout">
      <p><strong>Short version:</strong> Vigil reads your QuickBooks data to answer your financial questions. We store only what's needed to do that job. We never sell your data, never share it with advertisers, and you can delete everything at any time.</p>
    </div>

    <h2>1. Who we are</h2>
    <p>Vigil is a product of <strong>Well Drilled Inc</strong> (&ldquo;<strong>we</strong>&rdquo;, &ldquo;<strong>our</strong>&rdquo;, &ldquo;<strong>us</strong>&rdquo;). For questions about this policy, contact <a href="mailto:privacy@welldrilled.ai">privacy@welldrilled.ai</a>.</p>

    <h2>2. What data we collect</h2>
    <p>Vigil collects only the minimum data required to deliver your financial briefings:</p>
    <ul>
      <li><strong>QuickBooks accounting data</strong> &mdash; invoices, bills, customer balances, bank feeds, and service rates. We access this with <em>read-only</em> OAuth tokens; Vigil never writes to your books.</li>
      <li><strong>API keys</strong> &mdash; stored as SHA-256 hashes only; the raw key is shown once and never retained on our servers.</li>
      <li><strong>Telegram chat ID</strong> &mdash; used to route briefings to your device. We store only the numeric ID, not your name or phone number.</li>
      <li><strong>Interaction logs</strong> &mdash; tool calls, timestamps, and anonymised request metadata for debugging and improving Vigil. These logs do not contain the content of your financial data.</li>
    </ul>
    <p>We do <strong>not</strong> collect your name, email address, or any payment information (Vigil is free during beta).</p>

    <h2>3. How we use your data</h2>
    <ul>
      <li>Answering your financial questions via the Vigil AI tools.</li>
      <li>Sending your daily briefing to your Telegram account.</li>
      <li>Detecting service anomalies and improving accuracy over time.</li>
    </ul>
    <p>Your financial data is passed to <strong>Anthropic&rsquo;s Claude API</strong> to generate plain-English insights. Anthropic processes this data under their API terms and do not use it to train their models. See <a href="https://www.anthropic.com/privacy" target="_blank" rel="noopener">anthropic.com/privacy</a>.</p>

    <h2>4. Data retention</h2>
    <ul>
      <li><strong>QuickBooks access tokens</strong> &mdash; active while your connection is live; revoked immediately when you disconnect or request deletion.</li>
      <li><strong>API keys (hashed)</strong> &mdash; retained until revoked by you, or until you delete your data.</li>
      <li><strong>Interaction logs</strong> &mdash; retained for 90 days, then automatically purged.</li>
      <li><strong>Demo data</strong> &mdash; entirely synthetic; contains no real business information.</li>
    </ul>

    <h2>5. Data sharing</h2>
    <p>We do not sell, rent, or share your data with third parties for marketing purposes. Data is shared only with:</p>
    <ul>
      <li><strong>Anthropic</strong> &mdash; to generate AI-powered insights (see &sect;3 above).</li>
      <li><strong>Intuit / QuickBooks</strong> &mdash; we read from their APIs; they process data under their own privacy policy.</li>
      <li><strong>Infrastructure providers</strong> &mdash; hosting and database services operating under strict data-processing agreements.</li>
    </ul>

    <h2>6. Your rights &amp; deletion</h2>
    <p>You can request complete deletion of your data at any time. This revokes all API keys, disconnects QuickBooks, and erases all associated records within 72 hours.</p>
    <ul>
      <li><strong>Via Telegram:</strong> Send <code>/delete_my_data</code> to the Vigil bot.</li>
      <li><strong>Via email:</strong> <a href="mailto:privacy@welldrilled.ai">privacy@welldrilled.ai</a> &mdash; include the email or Telegram handle associated with your account.</li>
    </ul>

    <h2>7. Security</h2>
    <p>All connections use TLS. API keys are hashed (SHA-256) before storage &mdash; even we cannot retrieve your raw key. QuickBooks access tokens are stored encrypted at rest. Vigil runs behind Cloudflare and does not expose any database ports to the public internet.</p>

    <h2>8. Children&rsquo;s privacy</h2>
    <p>Vigil is a business finance tool intended for adults operating commercial entities. We do not knowingly collect data from anyone under the age of 18.</p>

    <h2>9. Changes to this policy</h2>
    <p>If we make material changes, we will update the date at the top of this page. Continued use of Vigil after changes constitutes acceptance of the updated policy.</p>

    <h2>10. Contact</h2>
    <p>Questions or concerns? Email <a href="mailto:privacy@welldrilled.ai">privacy@welldrilled.ai</a>. We aim to respond within 2 business days.</p>
  </div>
  ${footerHtml()}
</body>
</html>`;
}

// ── Terms of Service page ──────────────────────────────────────────────────────

export function termsPage() {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Terms of Service — Vigil</title>
  <meta name="description" content="Terms governing your use of Vigil.">
  ${FONTS}
  <style>
    ${BASE_CSS}

    .prose-wrap {
      max-width: 720px;
      margin: 0 auto;
      padding: clamp(3rem, 8vw, 6rem) clamp(1.5rem, 6vw, 5rem);
    }

    .prose-wrap h1 {
      font-family: var(--font-serif);
      font-size: clamp(2rem, 4vw, 2.8rem);
      line-height: 1.15;
      letter-spacing: -0.02em;
      margin-bottom: 0.5rem;
    }

    .prose-wrap .updated {
      font-size: 0.85rem;
      color: var(--text-muted);
      margin-bottom: 3rem;
    }

    .prose-wrap h2 {
      font-size: 1.1rem;
      font-weight: 600;
      margin: 2.5rem 0 0.75rem;
    }

    .prose-wrap p, .prose-wrap li {
      font-size: 1rem;
      color: var(--text-muted);
      line-height: 1.75;
    }

    .prose-wrap ul {
      padding-left: 1.5rem;
      margin: 0.75rem 0;
    }

    .prose-wrap li { margin-bottom: 0.4rem; }

    .prose-wrap a {
      color: var(--accent);
      text-decoration: underline;
      text-underline-offset: 3px;
    }

    .callout {
      background: var(--bg-alt);
      border-left: 3px solid var(--border);
      padding: 1rem 1.25rem;
      border-radius: 0 4px 4px 0;
      margin: 2rem 0;
    }

    .callout p {
      color: var(--text);
      font-size: 0.95rem;
    }
  </style>
</head>
<body>
  ${navHtml()}
  <div class="prose-wrap">
    <p class="eyebrow">Legal</p>
    <h1>Terms of Service</h1>
    <p class="updated">Last updated: 15 May 2026 &nbsp;&middot;&nbsp; Applies to vigilcfo.com</p>

    <div class="callout">
      <p><strong>Beta notice:</strong> Vigil is currently in public beta. Features may change, and service availability is not guaranteed. By using Vigil you accept these terms.</p>
    </div>

    <h2>1. Acceptance</h2>
    <p>By connecting your accounting software or using any Vigil tool, you agree to these Terms of Service (&ldquo;Terms&rdquo;) and our <a href="/privacy">Privacy Policy</a>. If you do not agree, please discontinue use.</p>
    <p>These Terms are between you and <strong>Well Drilled Inc</strong> (&ldquo;<strong>Vigil</strong>&rdquo;, &ldquo;<strong>we</strong>&rdquo;, &ldquo;<strong>us</strong>&rdquo;).</p>

    <h2>2. Description of service</h2>
    <p>Vigil is AI-powered financial intelligence for growing businesses. They read your accounting data (currently QuickBooks; Xero, Sage, and Pastel <em>coming soon</em>) and score your business across 8 capabilities against best-in-class peers — delivering one scripted move to close the gap.</p>
    <p>Vigil is a <strong>beta product</strong>. We make no guarantees of uptime, data completeness, or analysis accuracy. Do not rely solely on Vigil for critical financial decisions.</p>

    <h2>3. Not financial advice</h2>
    <p>Vigil provides <strong>informational summaries only</strong>. Nothing Vigil says constitutes financial, accounting, tax, legal, or investment advice. Vigil&rsquo;s outputs are generated by an AI model and may contain errors, omissions, or misinterpretations of your data.</p>
    <p>Always verify material financial information with a qualified accountant or financial advisor before acting on it.</p>

    <h2>4. Your account and API keys</h2>
    <ul>
      <li>You are responsible for keeping your Vigil API key confidential.</li>
      <li>Any activity performed using your API key is your responsibility.</li>
      <li>If you believe your key has been compromised, revoke it immediately via Telegram (<code>/revoke_key</code>) or email us at <a href="mailto:privacy@welldrilled.ai">privacy@welldrilled.ai</a>.</li>
    </ul>

    <h2>5. Acceptable use</h2>
    <p>You agree not to:</p>
    <ul>
      <li>Attempt to extract, scrape, or bulk-export other users&rsquo; data.</li>
      <li>Use Vigil to process data for which you do not have lawful authority (e.g., a business you do not own or manage).</li>
      <li>Reverse-engineer, decompile, or attempt to access underlying AI models or systems.</li>
      <li>Use Vigil in a manner that violates any applicable law or regulation.</li>
      <li>Abuse the API in ways that degrade service for other users (rate limits apply).</li>
    </ul>

    <h2>6. Data and QuickBooks access</h2>
    <p>Vigil accesses your QuickBooks data with <strong>read-only</strong> OAuth tokens. We do not modify, create, or delete any records in your accounting software. You can revoke access at any time from your QuickBooks account settings or via Vigil&rsquo;s <code>/delete_my_data</code> command.</p>
    <p>You represent that you have the legal right to connect the accounting data you provide to Vigil.</p>

    <h2>7. Pricing and beta access</h2>
    <p>Vigil is <strong>free during the public beta period</strong>. We reserve the right to introduce paid plans in the future. We will give reasonable notice before any changes to pricing that affect existing users.</p>

    <h2>8. Availability and changes</h2>
    <p>We may modify, suspend, or discontinue any part of Vigil at any time, with or without notice, particularly during the beta period. We are not liable for any loss resulting from downtime or feature changes.</p>

    <h2>9. Limitation of liability</h2>
    <p>To the maximum extent permitted by law, Well Drilled Inc and its team members shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising from your use of Vigil, including but not limited to loss of profits, data, or business opportunity.</p>
    <p>Vigil&rsquo;s total liability to you for any claim arising under these Terms shall not exceed the amount you paid for Vigil in the 12 months preceding the claim (which during the beta period is $0).</p>

    <h2>10. Intellectual property</h2>
    <p>Vigil, the Well Drilled name, and all associated software remain the property of Well Drilled Inc. Your financial data remains yours &mdash; we claim no ownership over it.</p>

    <h2>11. Governing law</h2>
    <p>These Terms are governed by the laws of the jurisdiction in which Well Drilled Inc is registered. Any disputes will be resolved in the courts of that jurisdiction.</p>

    <h2>12. Changes to these Terms</h2>
    <p>We may update these Terms from time to time. Material changes will be noted on this page with an updated date. Continued use of Vigil after changes constitutes acceptance.</p>

    <h2>13. Contact</h2>
    <p>Questions about these Terms? Email <a href="mailto:privacy@welldrilled.ai">privacy@welldrilled.ai</a>.</p>
  </div>
  ${footerHtml()}
</body>
</html>`;
}

// ── Pricing page ───────────────────────────────────────────────────────────────

export function pricingPage() {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Pricing — Vigil</title>
  <meta name="description" content="Vigil is free during the public beta. Connect your QuickBooks and start getting your Vigil Score today.">
  ${FONTS}
  <style>
    ${BASE_CSS}

    .pricing-wrap {
      max-width: 560px;
      margin: 0 auto;
      padding: clamp(4rem, 10vw, 8rem) clamp(1.5rem, 6vw, 5rem);
      text-align: center;
    }

    .pricing-headline {
      font-family: var(--font-serif);
      font-size: clamp(2.2rem, 5vw, 3.2rem);
      line-height: 1.15;
      letter-spacing: -0.02em;
      margin-bottom: 1.25rem;
    }

    .pricing-sub {
      font-size: 1.1rem;
      color: var(--text-muted);
      max-width: 420px;
      margin: 0 auto 2.5rem;
      line-height: 1.65;
    }

    .pricing-card {
      background: #fff;
      border: 1.5px solid var(--border);
      border-radius: 8px;
      padding: 2.5rem 2rem;
      margin: 0 auto 2.5rem;
    }

    .pricing-badge {
      display: inline-block;
      background: var(--accent-dim);
      color: var(--accent);
      font-size: 0.75rem;
      font-weight: 600;
      letter-spacing: 0.06em;
      text-transform: uppercase;
      padding: 0.35rem 0.9rem;
      border-radius: 100px;
      margin-bottom: 1.5rem;
    }

    .pricing-price {
      font-family: var(--font-serif);
      font-size: 4rem;
      line-height: 1;
      letter-spacing: -0.03em;
      margin-bottom: 0.25rem;
    }

    .pricing-price-note {
      font-size: 0.875rem;
      color: var(--text-muted);
      margin-bottom: 2rem;
    }

    .pricing-features {
      list-style: none;
      padding: 0;
      margin: 0 0 2rem;
      text-align: left;
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    .pricing-features li {
      display: flex;
      align-items: flex-start;
      gap: 0.75rem;
      font-size: 0.95rem;
      color: var(--text-muted);
    }

    .pricing-features li::before {
      content: '✓';
      color: var(--accent);
      font-weight: 700;
      flex-shrink: 0;
      margin-top: 0.05em;
    }

    .pricing-disclaimer {
      font-size: 0.85rem;
      color: var(--text-muted);
      line-height: 1.6;
    }

    .pricing-disclaimer a {
      color: var(--accent);
      text-decoration: underline;
      text-underline-offset: 3px;
    }
  </style>
</head>
<body>
  ${navHtml()}
  <div class="pricing-wrap">
    <p class="eyebrow">Pricing</p>
    <h1 class="pricing-headline">Free while we&rsquo;re in beta.</h1>
    <p class="pricing-sub">Vigil is in public beta. Full access, no credit card, no expiry date &mdash; just connect your QuickBooks and get your Vigil Score.</p>

    <div class="pricing-card">
      <span class="pricing-badge">Public Beta</span>
      <div class="pricing-price">$0</div>
      <p class="pricing-price-note">Per month &nbsp;&middot;&nbsp; No credit card required</p>

      <ul class="pricing-features">
        <li>Daily morning financial briefing</li>
        <li>30/60/90-day cash forecast</li>
        <li>Customer margin analysis</li>
        <li>Overdue AR alerts with follow-up language</li>
        <li>Value gap identification</li>
        <li>Ask Vigil anything &mdash; open-ended financial Q&amp;A</li>
        <li>Telegram daily digest</li>
        <li>MCP integration (Hermes, Claude Desktop, OpenClaw)</li>
        <li>QuickBooks read-only access</li>
      </ul>

      <a href="/connect" class="btn" style="width:100%;justify-content:center">Connect your books &nbsp;&rarr;</a>
    </div>

    <p class="pricing-disclaimer">
      We plan to introduce paid plans after the beta period ends. When we do, existing beta users will receive advance notice and fair transition terms. Read our <a href="/terms">Terms of Service</a> for details.
    </p>
  </div>
  ${footerHtml()}
</body>
</html>`;
}
