# Vibe Coding Security Checklist for Agents

Compiled from: @wasimships (X/Twitter), Replit Security Docs, Aikido Security, and CFO Boardroom Brief.
Use this as a standing instruction set / system prompt addition for any agent building or deploying vibe-coded apps.


## 🔴 Level 0 — Non-Negotiable (Do Before Anything Goes Live)

### Secrets & Credentials
- [ ] Never hardcode API keys, passwords, or tokens in source code
- [ ] Store all secrets in environment variables (.env) — never commit .env to Git
- [ ] Add .env and all secret files to .gitignore immediately
- [ ] Keep secrets out of the browser entirely: no localStorage, sessionStorage, client-side JS, or insecure cookies
- [ ] Rotate secrets regularly and set expiration dates
- [ ] Use a dedicated secrets manager (HashiCorp Vault, AWS Secrets Manager, Google Cloud Secret Manager)

### Authentication & Authorization
- [ ] Never build your own authentication — use a proven provider (Auth0, Replit Auth, Supabase Auth)
- [ ] Never write your own cryptography — use established libraries (NaCL, bcrypt, etc.)
- [ ] Hash + salt all passwords — never store plaintext
- [ ] Verify user permissions before every action (authorization checks on every route/function)
- [ ] Add authentication to every sensitive API endpoint
- [ ] Implement proper CORS settings on all endpoints

### Input & Output Safety
- [ ] Validate and sanitize ALL user inputs on the backend — never trust client-side validation alone
- [ ] Use parameterized queries or an ORM — never concatenate user input into raw SQL (prevents SQL injection)
- [ ] Sanitize before rendering any user input to the DOM (prevents XSS)
- [ ] Implement CSRF tokens for all forms and state-changing requests

### Transport & Headers
- [ ] Enforce HTTPS everywhere — no exceptions
- [ ] Add security headers: X-Frame-Options, X-Content-Type-Options, Content-Security-Policy, HSTS
- [ ] Set strict Content Security Policy (CSP) headers to block unauthorized scripts
- [ ] Secure all cookies: set HttpOnly, Secure, and SameSite attributes


## 🟠 Level 1 — Ship Safely (Add Before Launching to Real Users)

### DDoS & Rate Limiting
- [ ] Use a CDN with DDoS mitigation (Cloudflare, CloudFront) — do not expose origin server directly
- [ ] Implement rate limiting on all API endpoints, especially auth-related ones
- [ ] Example: max 100 requests per IP per 15 minutes on /api/ routes

### Dependency & Supply Chain Security
- [ ] Run npm audit (or equivalent) before every release
- [ ] Use lockfiles (package-lock.json, yarn.lock) to pin dependency versions and prevent supply chain attacks
- [ ] Scan dependencies for known CVEs using Trivy or Aikido
- [ ] Scan dependencies for malware (CVE databases alone are too slow — use real-time tools like Aikido Intel)
- [ ] Check for End-of-Life (EOL) packages and upgrade them proactively

### CI/CD & Code Quality Gates
- [ ] Set up a CI/CD pipeline with security gates on every pull request
- [ ] Run SAST (Static Application Security Testing) on every commit (Opengrep, Semgrep, Aikido)
- [ ] Run DAST (Dynamic Application Security Testing) against staging before production deploys (OWASP ZAP)
- [ ] Never merge directly to production — use separate feature → staging → main branches
- [ ] Maintain signed commits to verify code authorship

### Error Handling
- [ ] Never expose raw error messages, stack traces, or database errors to the client
- [ ] Log errors internally; return only generic messages to the user (e.g. "An error occurred")

### File Uploads (if applicable)
- [ ] Restrict allowed file types and maximum file sizes
- [ ] Scan uploaded files for malware if possible
- [ ] Generate new server-side filenames — never use user-provided filenames
- [ ] Store uploaded files in isolated object storage, not alongside app code


## 🟡 Level 2 — Production Hardening

### Web Application Firewall
- [ ] Deploy a WAF or Runtime Application Self-Protection (RASP) layer in front of all web-facing services
- [ ] This acts as last-line-of-defense against zero-day XSS, SQL injection, and other injection attacks
- [ ] Good options: AWS WAF, Cloudflare WAF, Aikido Zen

### Container Security (if using Docker/K8s)
- [ ] Keep Docker base images updated — apply security patches regularly
- [ ] Never run containers as root or with privileged roles
- [ ] Scan container images for vulnerabilities (Trivy, Grype, Syft)
- [ ] Use Kubernetes secrets or equivalent — never bake secrets into container images

### Cloud Account Hygiene
- [ ] Keep dev, staging, and production in completely separate cloud accounts
- [ ] Use a Cloud Security Posture Management (CSPM) tool to detect misconfigurations (Cloudsploit, AWS Inspector, Aikido)
- [ ] Enable cloud budget alerts — unexpected spend often signals a compromised account (e.g. crypto mining)
- [ ] Apply least-privilege IAM policies across all cloud roles and service accounts

### LLM-Specific Security (if your app uses AI)
- [ ] Test any customer-facing LLM feature against the OWASP Top 10 for LLMs
- [ ] Guard against: prompt injection, insecure output handling, training data poisoning, model denial of service
- [ ] Never trust LLM output that writes to a database or executes code without human-in-the-loop review
- [ ] Use walled garden environments — limit and control what data flows in and out of any AI component


## 🔵 Governance (For Higher-Stakes / Client-Facing Apps)
- [ ] Have your tech team or a CISO review before any client-facing launch: trace data flows, verify access controls, confirm audit trails
- [ ] Define clear ownership: who is accountable when a vibe-coded tool fails financially, operationally, or for compliance?
- [ ] Set a threshold: define when an "internal tool" becomes systemically important and requires a full engineering rebuild
- [ ] Document what the tool does and how — don't let vibe-coded logic become a black box no one can explain or test
- [ ] For finance/compliance tools: minimum bar = accuracy, reproducibility, and full auditability before any real decisions are made
- [ ] Use AI to prototype; have qualified humans (or your tech team) harden, optimize, and sign off before production
- [ ] Consult your CIO/CISO and vendor security experts before deploying anything that handles sensitive or regulated data


## 📋 Quick Prompt Additions for Agents

Add one or more of these to your agent system prompts to bake security in from the start:

- "When writing any backend code, always use parameterized queries, never raw SQL with user input."
- "Never hardcode API keys, passwords, or secrets. Always use environment variables."
- "Sanitize and validate all user inputs before processing or rendering."
- "Use established authentication libraries — never implement auth or cryptography from scratch."
- "Add CSRF protection, security headers, and rate limiting to all API endpoints."
- "Do not expose stack traces or internal errors to the client — log internally and return generic messages."
