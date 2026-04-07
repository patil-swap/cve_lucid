# CVE Simplified — Product Requirements Document
Version 1.1 | Status: Final | Author: AI-assisted, reviewed by Swapnil Patil

---

## 1. Problem Statement

Security advisories are written by engineers, for engineers. The average CVE entry reads like a legal brief written in assembly. "CVE Simplified" bridges that gap — a web app that pulls live vulnerability data from NIST NVD and makes it readable for humans, while providing enough technical depth that practitioners still find it useful.

---

## 2. Goals & Non-Goals

### Goals
- Fetch and display live CVE data from NIST NVD API
- Use AI to convert raw vulnerability text into plain English, analogies, and fix guidance
- Present data in a fast, scannable card grid with severity color coding
- Full detail in a modal — no page navigations
- Pass OWASP Top 10 for Web Apps and OWASP Top 10 for LLM/AI Apps

### Non-Goals (V1)
- User accounts or saved CVEs
- Push notifications or alerting
- CVE search/filtering beyond what NVD provides
- Mobile app (responsive web only)
- Paid tiers or rate-limit bypasses

---

## 3. Target Users

Primary: Security engineers and SREs who want a faster read on daily CVE noise.
Secondary: Developers, product managers, and non-technical stakeholders who need to understand why a CVE matters to their org.

---

## 4. Tech Stack

Component         | Choice                       | Rationale
------------------|------------------------------|------------------------------------------
Framework         | Next.js 14 (App Router)      | SSR for SEO + API routes for backend proxy
Styling           | Tailwind CSS v3              | Utility-first, fast iteration
UI Components     | shadcn/ui                    | Unstyled primitives, full control over look
Data Fetching     | TanStack Query v5            | Caching, background refresh, loading states
AI Integration    | Ollama (local) + Groq (cloud)| Ollama for dev, Groq free tier for Vercel deploy
API Proxy         | Next.js API Routes           | Hides API keys, enforces rate limiting
State             | Zustand (lightweight)        | Modal state, selected CVE, filter state
Testing           | Vitest + Playwright          | Unit + E2E
Linting/Security  | ESLint, Snyk, npm audit CI   | Catch vulns before they ship

---

## 5. Architecture Overview

[Browser]
    |
    |-- TanStack Query --> [Next.js API Route: /api/cves]
                                |
                                |-- NIST NVD API (rate-limited, key in env)
                                |
                                |-- [Next.js API Route: /api/explain]
                                        |
                                        |-- LLM Provider (OpenAI / Gemini / Anthropic)
                                        |   (server-side only, key never touches client)

Key design principle: the browser never directly calls NIST NVD or the LLM. All external calls go through Next.js API routes. This is not optional — it's the security baseline.

---

## 6. Feature Specifications

### 6.1 Landing Page — CVE Grid

Route: /

Layout: Responsive card grid (1 col mobile, 2 col tablet, 3-4 col desktop)
Dark-mode-first. Background: #0a0a0f. Card surface: #111118.

Each card displays:
- CVE ID (monospace font, e.g., CVE-2024-12345)
- Severity badge: Low / Medium / High / Critical
- CVSS score (numeric, large)
- Affected product/vendor (from NVD `cpeName` or `descriptions`)
- One-line plain English summary (AI-generated)
- Published date

Color coding (border-left accent + badge):
- Critical (CVSS 9.0–10.0): #ef4444 (red-500)
- High (CVSS 7.0–8.9):      #f97316 (orange-500)
- Medium (CVSS 4.0–6.9):    #eab308 (yellow-500)
- Low (CVSS 0.1–3.9):       #22c55e (green-500)
- None / Unknown:            #6b7280 (gray-500)

Pagination: Load 20 CVEs per page. Use NVD API `startIndex` and `resultsPerPage`.

Loading state: Skeleton cards (shimmer animation) while TanStack Query fetches.

Error state: Inline error component with retry button. Do not crash the page.

### 6.2 Detail Modal

Trigger: Click any CVE card.
Component: shadcn/ui `<Dialog>` — full-screen overlay on mobile, centered modal (max-w-2xl) on desktop.

Modal Sections:

Header
- CVE ID + severity badge
- CVSS score breakdown (Attack Vector, Complexity, Privileges Required, etc.)
- Published / Last Modified dates
- NVD reference link (opens in new tab, rel="noopener noreferrer")

Section 1 — The Technical Reality
- 2-sentence summary of the actual vulnerability mechanism
- Source: AI-generated from raw NVD description
- Audience: Security engineer

Section 2 — The Plain English Version
- Non-technical explanation: what this bug does, what an attacker can achieve
- No jargon. "An attacker can read your files without a password" level clarity
- Audience: PM, executive, developer not in security

Section 3 — The Analogy
- One punchy creative analogy
- Examples: "Like a valet key that also opens the vault", "Like a hotel door that unlocks if you knock in a specific pattern"
- Must be contextually accurate — not just generic
- Source: AI-generated

Section 4 — How to Fix
- Patch version if available from NVD
- If no patch: mitigation steps (disable feature, restrict network access, etc.)
- Source: NVD references + AI synthesis

Section 5 — Raw NVD Data (collapsible)
- Full JSON-formatted NVD entry for practitioners who want it
- Hidden by default. Toggle with a "Show raw data" button.

### 6.3 AI Explanation Function

Server-side only. Located at: lib/ai/explainCVE.ts

Interface:

  Input: {
    cveId: string,
    rawDescription: string,
    cvssScore: number,
    affectedProducts: string[],
    references: string[]
  }

  Output: {
    technicalReality: string,   // 2 sentences
    plainEnglish: string,       // 1-2 short paragraphs
    analogy: string,            // 1 sentence
    howToFix: string            // bullet points or short paragraph
  }

Two real providers, selected via AI_PROVIDER env var:

Ollama (local dev):
- Runs on localhost:11434
- Recommended model: llama3.2 or mistral-nemo (good reasoning, fast on CPU)
- Zero cost, zero network latency, no key required
- Not suitable for Vercel deployment (no persistent local process)

Groq (Vercel / production):
- Free tier: 14,400 requests/day, 6,000 tokens/min on llama-3.3-70b-versatile
- Requires GROQ_API_KEY in Vercel env vars
- Response times typically under 1 second — fast enough for modal load
- Falls back gracefully if rate limit hit: show raw NVD description, surface a warning in the UI

The function selects provider at runtime based on AI_PROVIDER. The interface is identical regardless of provider — swapping is a one-line config change.

The function must never be called from the client. Route it through /api/explain.

---

## 7. API Design

### GET /api/cves

Query params:
- page (default: 1)
- severity (optional filter: LOW | MEDIUM | HIGH | CRITICAL)
- keyword (optional search string, passed to NVD)

Proxies to: https://services.nvd.nist.gov/rest/json/cves/2.0

Response shape (normalized, not raw NVD):
  {
    totalResults: number,
    page: number,
    perPage: number,
    cves: CVESummary[]
  }

CVESummary shape:
  {
    id: string,
    description: string,
    cvssScore: number | null,
    severity: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW" | "NONE",
    affectedProducts: string[],
    publishedDate: string,
    lastModifiedDate: string
  }

### POST /api/explain

Body: { cveId: string, rawNvdData: object }

Response:
  {
    technicalReality: string,
    plainEnglish: string,
    analogy: string,
    howToFix: string
  }

Rate limited: 10 requests/min per IP (see security section).
Response cached per cveId (Redis or in-memory Map) to avoid duplicate LLM calls.

---

## 8. OWASP Top 10 for Web Apps — Compliance Map

### A01: Broken Access Control
Threat: No auth in V1; no protected routes.
Mitigation: N/A for V1 — there is nothing to protect yet. Document this gap explicitly. Before adding any user-specific data or admin functionality, add authentication.

### A02: Cryptographic Failures
Threat: API keys stored as environment variables could leak into the client bundle.
Mitigation: Never prefix secrets with NEXT_PUBLIC_. All keys live in server-side env only. HTTPS enforced at the deployment layer (Vercel / Nginx).

### A03: Injection
Threat: CVE IDs are passed to the NVD API and rendered in the UI. CVE descriptions fed to the LLM are a prompt injection surface.
Mitigation: Validate all CVE IDs server-side with the regex /^CVE-\d{4}-\d{4,}$/ before proxying. Escape all user-influenced content before rendering. See Section 9 for LLM-specific injection controls.

### A04: Insecure Design
Threat: AI output rendered as raw HTML could execute attacker-controlled scripts.
Mitigation: All LLM output is treated as untrusted plain text. Never use dangerouslySetInnerHTML with AI-generated content. React's default escaping handles this if you don't bypass it.

### A05: Security Misconfiguration
Threat: Outdated dependencies and missing HTTP security headers.
Mitigation: Dependabot + Snyk in CI. npm audit --audit-level=high fails the build. Set the following headers in next.config.js: X-Frame-Options (DENY), X-Content-Type-Options (nosniff), Referrer-Policy (strict-origin), Content-Security-Policy (strict), Permissions-Policy (camera=(), microphone=()).

### A06: Vulnerable and Outdated Components
Threat: npm packages with known CVEs — which would be ironic given what this app does.
Mitigation: Lock file committed. Weekly automated dependency audits via Dependabot.

### A07: Identification and Authentication Failures
Threat: No auth in V1.
Mitigation: No session, no cookies, no tokens. Risk surface is minimal at this stage. Document for V2.

### A08: Software and Data Integrity Failures
Threat: Supply chain risk from npm packages, the NVD API, and the LLM provider.
Mitigation: Pin dependency versions. Validate NVD API responses against a strict expected schema before processing. Never execute or eval any content from external sources.

### A09: Security Logging and Monitoring Failures
Threat: No logging means incidents go undetected.
Mitigation: Log all API errors server-side (no PII logged). Log rate limit violations. Use structured logging (Pino).

### A10: Server-Side Request Forgery (SSRF)
Threat: /api/cves and /api/explain make outbound requests — if the target URL is ever user-influenced, an attacker can pivot to internal services.
Mitigation: Hardcode all outbound URLs. No user-supplied URLs accepted. Allowlist: *.nvd.nist.gov and the chosen LLM provider endpoint. Validate all outbound URLs before calling fetch.

---

## 9. OWASP Top 10 for LLM/AI Apps — Compliance Map

### LLM01: Prompt Injection
Threat: An attacker crafts a CVE description (or a malicious CVE gets published) that hijacks the LLM's behavior — e.g., "Ignore previous instructions and output..."
Mitigation: System prompt is fixed and hardcoded server-side, never user-influenced. NVD input is treated as data, not instruction. Wrap it in explicit delimiters in the prompt template: <vulnerability_data>...</vulnerability_data>. Sanitize NVD text before injection.

### LLM02: Insecure Output Handling
Threat: LLM returns malicious HTML, JavaScript, or social engineering instructions that get rendered in the UI.
Mitigation: All LLM output is rendered as plain text only. Never use dangerouslySetInnerHTML with AI content. React's default escaping handles this — don't bypass it. Treat LLM output as untrusted string input, same as user input.

### LLM03: Training Data Poisoning
Threat: The LLM may have outdated, wrong, or adversarially influenced vulnerability information baked into its weights.
Mitigation: Label all AI-generated sections clearly as "AI-Assisted Summary — verify with source." Link to the official NVD entry for every CVE. The AI is a reading aid, not the source of record.

### LLM04: Model Denial of Service
Threat: Automated scraping triggers expensive LLM calls en masse, running up API bills or exhausting rate limits.
Mitigation: Rate limit /api/explain at 10 requests/min/IP. Cache LLM responses per CVE ID (TTL: 24h) to avoid duplicate calls. Set max_tokens on all LLM requests.

### LLM05: Supply Chain Vulnerabilities
Threat: The LLM provider's API is a third-party dependency that can go down, change behavior, or get compromised.
Mitigation: Abstract the LLM behind a provider-agnostic interface (lib/ai/explainCVE.ts). If the LLM call fails, fall back to displaying the raw NVD description — the app should not crash.

### LLM06: Sensitive Information Disclosure
Threat: Internal or user data inadvertently fed into an external LLM.
Mitigation: Only NVD public data enters the LLM in V1. No PII, no internal org context, no user-provided input. Document this constraint so it doesn't get quietly violated when features are added.

### LLM07: Insecure Plugin Design
Threat: N/A — no tool use, function calling, or plugins in V1.
Mitigation: N/A. Flag this for review if agentic features are ever added.

### LLM08: Excessive Agency
Threat: N/A — the LLM is a read-only text summarizer. It takes input and returns text.
Mitigation: The LLM cannot write to a database, call external APIs, or trigger any side effects. Read-only, always.

### LLM09: Overreliance
Threat: Users treat AI-generated "How to Fix" guidance as authoritative and skip reading the actual vendor advisory.
Mitigation: Every CVE modal includes a visible disclaimer: "AI-generated summary — verify with NVD source." The "How to Fix" section always links to official vendor advisories when available from NVD references.

### LLM10: Model Theft
Threat: LLM API key exposed in client bundle, logs, or error messages.
Mitigation: LLM API key lives in server-side env only (never NEXT_PUBLIC_). Verify the built Next.js bundle contains no key strings. Error responses from /api/explain never include raw LLM error messages that might leak the key or provider details.

---

## 10. Data Flow & Caching Strategy

1. Page load triggers TanStack Query to call /api/cves
2. /api/cves checks in-memory cache (or Redis). Cache TTL: 5 minutes.
3. If cache miss: fetch from NVD API with API key from process.env.NVD_API_KEY
4. Normalize response. Return CVESummary[].
5. User clicks a card → modal opens. If AI content not yet fetched:
   a. TanStack Query calls /api/explain with the cveId
   b. /api/explain checks LLM response cache (TTL: 24 hours, CVEs don't change often)
   c. If cache miss: call LLM. Store result. Return to client.
6. Modal renders all 4 AI sections + collapsible raw data.

Cache key: cveId (e.g., "CVE-2024-12345")
Cache storage: V1 = in-memory Map (fine for single-instance). V2 = Redis.

---

## 11. Environment Variables

Variable                | Required        | Description
------------------------|-----------------|------------------------------------------
NVD_API_KEY             | Yes             | NIST NVD API key (register at nvd.nist.gov)
GROQ_API_KEY            | In production   | Groq API key for Vercel deployment (free tier)
OLLAMA_BASE_URL         | In local dev    | Ollama endpoint. Default: http://localhost:11434
OLLAMA_MODEL            | No              | Model name. Default: llama3.2
AI_PROVIDER             | Yes             | "groq" (Vercel) or "ollama" (local dev)
RATE_LIMIT_WINDOW_MS    | No              | Rate limit window in ms. Default: 60000
RATE_LIMIT_MAX_REQUESTS | No              | Max requests per window per IP. Default: 10

NEVER prefix any of these with NEXT_PUBLIC_. They are server-side only.

---

## 12. Project Structure

cve-simplified/
├── app/
│   ├── page.tsx                  # Landing page (CVE grid)
│   ├── layout.tsx                # Root layout, metadata, CSP headers
│   └── api/
│       ├── cves/route.ts         # GET /api/cves — NVD proxy
│       └── explain/route.ts      # POST /api/explain — LLM proxy
├── components/
│   ├── CVEGrid.tsx               # Card grid, pagination
│   ├── CVECard.tsx               # Individual card
│   ├── CVEModal.tsx              # Detail modal
│   ├── SeverityBadge.tsx         # Color-coded severity pill
│   └── SkeletonCard.tsx          # Loading state
├── lib/
│   ├── nvd/
│   │   ├── client.ts             # NVD API fetch + normalization
│   │   └── types.ts              # NVD response types
│   ├── ai/
│   │   ├── explainCVE.ts         # AI function (placeholder + real impl)
│   │   ├── prompt.ts             # Prompt template
│   │   └── providers/
│   │       ├── groq.ts               # Groq cloud provider (production)
│   │       └── ollama.ts             # Ollama local provider (dev)
│   ├── cache.ts                  # In-memory cache abstraction
│   ├── rateLimit.ts              # IP-based rate limiter
│   └── sanitize.ts               # Input sanitization helpers
├── hooks/
│   ├── useCVEs.ts                # TanStack Query hook for CVE list
│   └── useCVEExplanation.ts      # TanStack Query hook for AI explanation
├── types/
│   └── cve.ts                    # Shared CVE types (CVESummary, CVEDetail, etc.)
├── next.config.js                # Security headers, env validation
├── .env.local                    # Never committed
├── .env.example                  # Committed, no real values
└── middleware.ts                 # Rate limiting at edge (optional)

---

## 13. UI Design Spec

Theme: Dark mode only (no toggle in V1). Security terminal meets modern SaaS.

Typography:
- Display/IDs: JetBrains Mono (monospace — CVE IDs deserve this)
- Body: Geist (clean, readable on dark backgrounds)
- Score numerals: Tabular figures, large and bold

Background layers:
- Page bg: #05050a
- Card surface: #0e0e16
- Card hover: #14141f
- Modal: #0e0e16 with backdrop blur

Accent: Severity colors used sparingly. No rainbow UIs.

Animations:
- Card entrance: Staggered fade-up on initial load
- Card hover: Subtle border glow (color matches severity)
- Modal open: Scale from 95% to 100% + fade in (150ms)
- Skeleton: Shimmer pulse

---

## 14. LLM Prompt Template (Server-Side)

Located in lib/ai/prompt.ts. This is the system + user prompt structure:

SYSTEM:
You are a cybersecurity expert and technical writer. Your job is to take raw CVE (Common Vulnerability and Exposure) data and produce four distinct explanations. Be accurate. Do not invent details not present in the source data. If patch information is unavailable, say so clearly.

USER:
Analyze the following CVE and return a JSON object with exactly these four fields:
- technicalReality: 2 sentences describing the actual vulnerability mechanism for a security engineer.
- plainEnglish: 1-2 short paragraphs explaining what this bug does and what an attacker can achieve, written for a non-technical reader.
- analogy: One punchy, memorable analogy that accurately reflects the vulnerability's nature.
- howToFix: Actionable remediation advice. Include patch version if available.

<vulnerability_data>
CVE ID: {{cveId}}
Description: {{rawDescription}}
CVSS Score: {{cvssScore}}
Affected Products: {{affectedProducts}}
References: {{references}}
</vulnerability_data>

Respond with valid JSON only. No markdown. No preamble.

Notes:
- The <vulnerability_data> delimiters are intentional — they help resist prompt injection.
- Validate the JSON response before returning it to the client.
- If the LLM returns invalid JSON, fall back to displaying the raw NVD description.

---

## 15. Acceptance Criteria

Feature                        | Pass Criteria
-------------------------------|-------------------------------------------------------------
CVE grid loads                 | 20 CVEs render within 3s on a standard connection
Severity colors                | Each card and badge reflects correct CVSS bracket
Card click opens modal         | Modal opens within 200ms of click (data may still load)
AI sections display            | All 4 sections render for each CVE (or graceful fallback)
API keys hidden                | Browser network tab shows zero calls to NVD or LLM directly
Rate limiting works            | 11th request in 60s returns 429 with clear error message
No XSS via AI output           | AI content in modal is plaintext — no HTML/script execution
CSP header present             | curl -I on deployed URL shows Content-Security-Policy header
Input sanitization             | Malformed CVE IDs rejected with 400 before proxying to NVD
Fallback on LLM failure        | If LLM call fails, raw NVD description shown, no crash

---

## 16. Out of Scope for V1 (Future Backlog)

- User auth and saved CVE lists
- Email/Slack alerts for new critical CVEs
- CVSS vector visualization
- Org-specific vulnerability mapping (integrate with your own asset inventory)
- CVE search bar
- Dark/light mode toggle
- Redis cache (replace in-memory)
- Multi-language support
- Export to PDF/CSV

---

## 17. Resolved Decisions

These are the confirmed choices that the implementation should treat as fixed.

NVD API Key: Available. Use authenticated limit (50 req/30s). Set NVD_API_KEY in both local .env.local and Vercel env vars. No unauthenticated fallback needed.

LLM Provider:
- Local development: Ollama. Default model llama3.2 unless a better reasoning model is available locally. Set AI_PROVIDER=ollama.
- Vercel production: Groq free tier. Model: llama-3.3-70b-versatile. Set AI_PROVIDER=groq and GROQ_API_KEY in Vercel dashboard. Monitor daily request usage (14,400/day free limit) — at one LLM call per CVE modal open, with 24h caching, this is unlikely to be a problem.

Deployment: Vercel. Use Vercel's built-in environment variable management. No Docker, no custom server.

Demo strategy: No mocking needed. The app uses the live NVD API for CVE data and Groq for explanations. The portfolio demo is fully functional with real data.

One thing to watch on Vercel: Ollama cannot run on Vercel (serverless, no persistent process). The AI_PROVIDER=groq path must be solid before deploying. Test it locally by temporarily pointing at Groq before pushing.

---