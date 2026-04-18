# CVE Simplified — Product Requirements Document
Version 3.0 | Status: Final | Author: AI-assisted, reviewed by Swapnil Patil

---

## 1. Problem Statement

Security advisories are written by engineers, for engineers. The average CVE entry reads like a legal brief written in assembly. "CVE Simplified" bridges that gap — a web app that pulls live vulnerability data from NIST NVD and makes it readable for humans, while providing enough technical depth that practitioners still find it useful.

**V2 expands this vision:** Security teams don't just need to understand individual CVEs — they need to compare vulnerabilities, understand their business impact, track trends over time, and quickly assess what matters to their specific role.

**V3** introduces a side‑by‑side workflow that lets security teams browse and inspect CVEs without interrupting context.

---

## 2. Goals & Non-Goals

### V1 Goals
- Fetch and display live CVE data from NIST NVD API
- Use AI to convert raw vulnerability text into plain English, analogies, and fix guidance
- Present data in a fast, scannable card grid with severity color coding
- Full detail in a modal — no page navigations
- Pass OWASP Top 10 for Web Apps and OWASP Top 10 for LLM/AI Apps

### V2 Goals
- Enable side-by-side comparison of similar CVEs (same product, same CWE, similar CVSS)
- Provide advanced search and filtering beyond NVD's native capabilities
- Simulate business impact of exploitation ("What happens if this gets hit?")
- Surface reading time and difficulty level for each CVE
- Visualize vulnerability trends over time (dashboard view)
- Generate role-contextualized "What If" explanations (engineer vs. manager vs. executive)

### V3 Goals
- **Replace modal with persistent split‑pane (master‑detail) layout** – list on the left, detail on the right, no pop‑ups.
- **Deep‑linkable selections** – URL updates with selected CVE, back/forward works.
- **Mobile‑optimized navigation** – separate detail page on small screens.
- **"Am I Affected?" Version Checker** – Client-side tool to check local versions against NVD version ranges.
- **Email Alerts & Daily Digests** – Double-opt-in subscription system for targeted vulnerability notifications.
- **Tiered Visual Hierarchy** – Structured detail view optimized for scannability (Primary, Secondary, Tertiary information).
- **Preserve all V2 functionality** – compare, search, dashboard, impact simulation remain unchanged.

### Non-Goals
- User accounts or saved CVEs (subscriptions are email-only)
- Push notifications (email only)
- Mobile app (responsive web only)
- Paid tiers or rate-limit bypasses

### V3 Non-Goals
- Community features (comments, voting) - explicitly excluded
- Personal watchlists or saved searches
- Conversational chat interface

---

## 3. Target Users

**Primary (V1):** Security engineers and SREs who want a faster read on daily CVE noise.

**Secondary (V1):** Developers, product managers, and non-technical stakeholders who need to understand why a CVE matters to their org.

**V2 adds nuance:** Different users need different explanations. A security engineer needs technical depth. A cloud architect needs to know "Does this affect our AWS environment?" A manager needs "What's the business impact?" V2 tailors the "What If" explainer to these roles.

---

## 4. Tech Stack

| Component         | Choice                       | Rationale |
|-------------------|------------------------------|-----------|
| Framework         | Next.js 14 (App Router)      | SSR for SEO + API routes for backend proxy |
| Styling           | Tailwind CSS v3              | Utility-first, fast iteration |
| UI Components     | shadcn/ui                    | Unstyled primitives, full control |
| Data Fetching     | TanStack Query v5            | Caching, background refresh, loading states |
| AI Integration    | Ollama (local) + Groq (cloud) | Ollama for dev, Groq free tier for Vercel |
| API Proxy         | Next.js API Routes           | Hides API keys, enforces rate limiting |
| State             | Zustand (lightweight)        | Modal state, selected CVE, filter state |
| Testing           | Vitest + Playwright          | Unit + E2E |
| Linting/Security  | ESLint, Snyk, npm audit CI   | Catch vulns before they ship |
| **V2: Charts**    | Recharts                     | Lightweight, React-native, accessible |
| **V2: Search**    | SQLite (libsql) + FTS5       | Full-text search on server, deployable on Vercel |
| **V2: Comparison**| React Diff Viewer            | Visual diff for CVE attributes |

---

## 5. Architecture Overview

```
[Browser]
    |
    |-- TanStack Query --> [Next.js API Route: /api/cves]
    |                         |
    |                         |-- NIST NVD API (rate-limited, key in env)
    |                         |
    |                         |-- SQLite FTS5 (search index)
    |
    |-- [Next.js API Route: /api/compare?cve1=CVE-xxx&cve2=CVE-yyy]
    |                         |
    |                         |-- NVD API (fetch both CVEs)
    |                         |-- Normalize + diff
    |
    |-- [Next.js API Route: /api/impact?cveId=xxx&role=engineer]
    |                         |
    |                         |-- LLM Provider (contextual simulation)
    |
    |-- [Next.js API Route: /api/explain]
    |                         |
    |                         |-- LLM Provider (reading time + difficulty added)
```

**Key design principle:** The browser never directly calls NIST NVD or the LLM. All external calls go through Next.js API routes. This is not optional — it's the security baseline.

---

## 6. Feature Specifications

### 6.1 Landing Page — Split-Pane Master-Detail (V3 Core)

Route: /

**Desktop & tablet (≥768px):** Two vertical panes, no modal.

| Pane | Width | Background | Content |
|------|-------|------------|---------|
| Left (Master) | 380px (desktop), 320px (tablet) | `#0a0a0f` | Scrollable CVE list, header (search/filter), pagination |
| Right (Detail) | flex-grow | `#05050a` | Full CVE detail for selected CVE, scrollable |

**When no CVE selected:** Right pane shows placeholder:
```
Select a CVE from the list to view details.
→ Use the list on the left to browse vulnerabilities.
```

#### Left Pane (Master) Details

- **Sticky header:** Search bar (keyboard shortcut `/`), filter button (opens drawer), “Compare” link (goes to `/compare`).
- **CVE cards** (same content as V2 card):
  - CVE ID (monospace font, e.g., CVE-2024-12345)
  - Severity badge (colored pill -  Low / Medium / High / Critical)
  - CVSS score (numeric, large)
  - Affected product/vendor (from NVD `cpeName` or `descriptions`)
  - One-line plain English summary (AI-generated)
  - Published date
- **Active card:** Background #14141f, left border accent width `4px` (others `2px`), scrolls into view when selected via URL.
- **Hover:** Background #111118, scale `0.98`.
- **Pagination:** 20 per page (NVD `startIndex`). Previous/Next + page numbers.
- **Loading:** Skeleton cards (shimmer animation) while TanStack Query fetches.
- **Error:** Inline error component with retry button. Do not crash the page.

- Color coding (border-left accent + badge):
  - Critical (CVSS 9.0–10.0): #ef4444 (red-500)
  - High (CVSS 7.0–8.9):      #f97316 (orange-500)
  - Medium (CVSS 4.0–6.9):    #eab308 (yellow-500)
  - Low (CVSS 0.1–3.9):       #22c55e (green-500)
  - None / Unknown:            #6b7280 (gray-500)

#### Right Pane (Detail) – replaces modal from V1/V2

- **Sticky header** (background #05050a with blur):
  - CVE ID + severity badge
  - CVSS score (tooltip with vector breakdown)
  - Published / Last Modified dates
  - External links: NVD, CISA KEV (if applicable)
  - Action buttons: 
    **Alert Me** (opens subscription popover), 
    **Compare** (navigates to `/compare?cve1=...`), 
    **Simulate Impact** (opens drawer), 
    **Share** (copies URL with `?cve=`)
- **Tiered Visual Hierarchy (V3 Design):**
  - **Tier 1 (High Contrast):** Technical Reality & How to Fix (persistent 2px severity-colored border).
  - **Tier 2 (Interactive):** Plain English, What If Explainer, Version Checker, Similar CVEs.
  - **Tier 3 (Collapsible):** Analogy, Metadata & Effort, Raw Data (hidden by default).
- **"Am I Affected?" Version Checker (V3):**
  - Input: User-provided version string (e.g. "2.4.51").
  - Logic: Uses `semver` to compare against NVD `versionStart` and `versionEnd` ranges.
  - Feedback: "Likely Affected" (Red) or "Not Affected" (Green) badge with explanation.
- **Impact Simulation Drawer:** Slides from right when “Simulate Impact” clicked – shows confidentiality/integrity/availability, blast radius, attack chain, etc. (same as V2).
- **Loading:** Skeleton shimmer matching sections.
- **Error:** Friendly message with retry or “select another CVE”.
- **Body sections** (identical to V2 modal content, but inline):
  1. Technical Reality
  - 2-sentence summary of the actual vulnerability mechanism
  - Source: AI-generated from raw NVD description
  - Audience: Security engineer
  2. Plain English Version
  - Non-technical explanation: what this bug does, what an attacker can achieve
  - No jargon. "An attacker can read your files without a password" level clarity
  - Audience: PM, executive, developer not in security
  3. Analogy
  - One punchy creative analogy
  - Examples: "Like a valet key that also opens the vault", "Like a hotel door that unlocks if you knock in a specific pattern"
  - Must be contextually accurate — not just generic
  - Source: AI-generated
  4. How to Fix
  - Patch version if available from NVD
  - If no patch: mitigation steps (disable feature, restrict network access, etc.)
  - Source: NVD references + AI synthesis
  5. Reading Time & Difficulty (badge + tooltip)
  Displayed below "How to Fix" section, before raw data:
  ```
  Reading time: 3 minutes
  Difficulty: Intermediate
  [Tooltip]: Beginner = Basic concepts, Intermediate = Needs some security knowledge, Expert = Deep technical details
  ```
  **Difficulty rubric:**
  - **Beginner:** High-level impact only, no technical jargon, analogy-focused
  - **Intermediate:** Includes attack vectors, basic exploitation mechanics
  - **Expert:** References specific CWEs, code patterns, complex attack chains
  **Reading time calculation:** Based on total word count of technicalReality + plainEnglish + howToFix (150 words/minute average).
  6. **“What If” Explainer** (tabs: Engineer, Manager, Executive) – content changes per role
  - Details provided in Section 6.4
  7. **Similar CVEs** (horizontal scroll of up to 3 cards, each with a “Compare” button)
  8. Raw NVD Data (collapsible `<details>`)
  - Full JSON-formatted NVD entry for practitioners who want it
  - Hidden by default. Toggle with a "Show raw data" button.

### 6.2 Mobile Behavior (<768px)

Split‑pane not feasible. Instead:

- **Default view:** Left pane only (full width). Right pane hidden.
- Clicking a CVE card **navigates** to a separate detail page: `/cve/CVE-2024-12345`.
- Detail page shows all right‑pane content (same sections) in a scrollable full‑page view.
- **Back button** (`← Back to list`) at top returns to the list, preserving scroll position.
- No modal, no split‑pane.

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

### 6.4 — "What If" Explainer (new, contextual)
A toggleable section below difficulty with three role-based tabs:

```
[Engineer] [Manager] [Executive]

--- Engineer view ---
"If this CVE is exploited, attackers could:
• Read /etc/passwd via path traversal in the file upload endpoint
• Escalate to RCE by chaining with CVE-2024-12344 (same product)
• Credential replay across your Kubernetes secrets if using default service accounts"

--- Manager view ---
"This is bad because:
• Average remediation time for similar CVEs: 6 days
• Estimated engineer hours to patch: 8-12 hours across 3 services
• Regulatory risk: GDPR breach notification required if PII exposed"

--- Executive view ---
"Business impact:
• Potential customer data exposure (Confidentiality: HIGH)
• Public exploit exists as of last week (source: CISA KEV)
• Recommendation: Prioritize this week's patch cycle"
```

**Implementation:** Client-side role selection (no auth required). The selected role determines the prompt template sent to `/api/explain?role=engineer`. Response cached per (cveId, role) tuple.

### 6.5 CVE Compare & Diff (V2)

**Route:** `/compare?cve1=CVE-2024-12345&cve2=CVE-2024-12346`

**Access:** Button in modal footer ("Compare with similar CVE") + dedicated compare page link in header.

**Similar CVE discovery:** On modal open, client calls `/api/similar?cveId=xxx` which returns up to 5 CVEs based on:
- Same CPE (product) and CVSS within ±1.0
- Same CWE category (if available from NVD)
- Same vendor, published within ±90 days

**Compare page layout:**

```
┌─────────────────────────────────────────────────────────────┐
│  CVE-2024-12345          │  CVE-2024-12346                  │
│  Critical (9.8)          │  High (7.5)                      │
├──────────────────────────┼──────────────────────────────────┤
│  Affects: nginx 1.18-1.20│  Affects: nginx 1.20-1.22        │
├──────────────────────────┼──────────────────────────────────┤
│  Published: 2024-01-15   │  Published: 2024-03-20           │
├──────────────────────────┼──────────────────────────────────┤
│  [Diff highlight] Technical Reality                         │
│  "Buffer overflow in..." │  "Use-after-free in..."          │
│  ^^^^^^^^^^^^^^^^^^^^^^^^  ^^^^^^^^^^^^^^^^^^^^^^^^         │
│  (green = added, red = removed if same base text)           │
├──────────────────────────┼──────────────────────────────────┤
│  Fix: Upgrade to 1.22    │  Fix: Upgrade to 1.23 or patch   │
├──────────────────────────┼──────────────────────────────────┤
│  [Expand both full modals]                                   │
└──────────────────────────┴──────────────────────────────────┘
```

**Comparison dimensions:**
- CVSS score + vector components
- Affected version ranges
- Patch availability status
- CWE ID and description
- Exploit maturity (if available from CISA KEV)
- AI-generated summary diff (highlighting what's different)

**Shareable comparison URL:** `/compare/cve1/cve2` generates Open Graph image showing comparison summary.

**API endpoint:** `GET /api/compare?cve1=xxx&cve2=yyy` returns diff object.

### 6.6 Enhanced Search & Filtering (V2)

**Route:** `/search` (accessible via header search bar and dedicated page)

**Search bar (global header):** Full-width, keyboard shortcut `/` to focus. Autocomplete shows CVE IDs and product names as you type.

**Search page layout:**

```
[Search: "nginx buffer overflow"]  [Filters drawer]

Results: 47 CVEs

Filters:
├── Severity: [ ] Critical [x] High [ ] Medium [ ] Low
├── CVSS Range: [4.0] ─●───○── [9.0]
├── CWE: [Select...] (dropdown with top 20 CWEs)
├── EPSS Score: [ ] >0.1% [ ] >1% [ ] >10% (probability of exploitation)
├── Exploit exists: [ ] Yes (CISA KEV) [ ] No
├── Patch available: [ ] Yes [ ] No
├── Published date: [Last 7 days] [30 days] [90 days] [Custom range]
└── Products: [nginx] [Apache] [PostgreSQL] (multi-select)
```

**Backend implementation:**
- Daily cron job (`/api/cron/index-cves`) fetches last 7 days of CVEs from NVD
- Stores normalized data in SQLite with FTS5 virtual table for full-text search
- Indexed columns: cveId, description, product names, CWE, published date
- EPSS scores fetched from FIRST.org EPSS API (free, no key required)

**Search features:**
- Full-text search across CVE descriptions, product names, CWE names
- Fuzzy matching (typo tolerance: "ngnix" → "nginx")
- Boolean operators: `"buffer overflow" AND nginx NOT "deprecated"`
- Filter persistence in URL query params (shareable search links)

**API endpoint:** `GET /api/search?q=nginx&severity=high&cvss_min=7&cvss_max=10&page=1`

### 6.7 Trend Dashboard (V2)

**Route:** `/dashboard`

**Layout:** 3-column grid on desktop, stacked on mobile. Auto-refresh every 5 minutes (client-side polling).

**Widget 1 — 30-Day CVE Velocity**
```
Line chart: Daily count by severity
X-axis: Date (last 30 days)
Y-axis: # of CVEs
Lines: Critical (red), High (orange), Medium (yellow), Low (green)
```

**Widget 2 — Top 10 Most Affected Vendors (This Month)**
```
Horizontal bar chart:
Microsoft      ████████████████████ 142
Google         ████████████████ 98
Oracle         ████████████ 67
...
```

**Widget 3 — CWE Category Distribution**
```
Pie chart or treemap:
Top 3: SQL Injection (18%), XSS (15%), Buffer Overflow (12%)
```

**Widget 4 — Exploit Availability Trend**
```
Stacked area chart:
[Public exploit exists] vs. [No known exploit] over last 90 days
```

**Widget 5 — Patch Velocity (Median days from disclosure to patch)**
```
Gauge or single stat:
Median patch time: 47 days (↓ 5 days from last month)
By severity: Critical: 12 days, High: 34 days, Medium: 68 days
```

**Widget 6 — Zero-Day Tracker**
```
Simple counter:
CVEs published without patch this month: 8
With active exploitation (CISA KEV): 3
```

**Data sources:**
- NVD API for CVE counts by date/severity
- CISA KEV for exploit status
- EPSS API for exploitation probability trends

**Refresh strategy:** Dashboard data cached for 1 hour. Manual refresh button triggers cache invalidation.

**API endpoint:** `GET /api/dashboard/stats?days=30` returns aggregated statistics.

### 6.8 Impact Simulation (V2)

**Access:** Button in modal labeled "Simulate Impact" (opens side drawer or separate modal).

**Purpose:** Answer "What happens if this CVE is exploited in MY environment?" without requiring user to input actual infrastructure.

**Simulation outputs (AI-generated, context-aware):**

**Confidentiality Impact:**
- "Data exposure risk: HIGH — This CVE allows unauthenticated file read. Attackers could access database credentials, customer PII, or source code."

**Integrity Impact:**
- "Data modification risk: MEDIUM — Limited to log files. Critical data cannot be altered."

**Availability Impact:**
- "Service disruption: CRITICAL — Remote code execution could crash the process or entire host."

**Blast Radius Estimation:**
- "Likely blast radius: Adjacent systems sharing the same authentication mechanism. If your auth service is affected, all downstream services are at risk."

**Exploitation Complexity in Your Environment:**
- "Time to exploit: Hours (public exploit exists)"
- "Skill level required: Script kiddie (automated tools available)"
- "Typical detection time: 6-12 hours with standard logging"

**Hypothetical Attack Chain:**
```
Step 1: Attacker sends crafted HTTP request to /api/upload
Step 2: Bypasses file type validation (this CVE)
Step 3: Uploads webshell to /uploads/shell.php
Step 4: Executes commands as www-data user
Step 5: Lateral movement to database server via stolen creds
```

**Implementation:** Impact simulation uses a specialized LLM prompt with system instructions to produce conservative, evidence-based estimates. All outputs include disclaimer: "Simulated impact — actual results depend on your specific environment and controls."

**API endpoint:** `POST /api/impact` with body `{ cveId: string }` returns simulation object.

**Caching:** Per CVE, TTL 7 days (impact doesn't change frequently).

### 6.9 URL & Routing (Deep Linking)

- **Base route:** `/` – left pane shows latest CVEs, right pane placeholder.
- **Selected CVE:** URL updates to `/?cve=CVE-2024-12345` (query parameter).
- On load with `?cve=`, right pane fetches that CVE, highlights the card in left pane, and scrolls it into view.
- **Browser back/forward:** Update both panes without page reload (using `window.history` and TanStack Query).
- **Compare button** in right pane: navigates to `/compare?cve1=CVE-2024-12345` (second CVE selected via compare page UI).

### 6.10 Email Alerts & Daily Digests (V3)
- **Subscription Flow**: Double-opt-in via email.
- **User Preference**: Filter by Product and Minimum Severity (CRITICAL, HIGH, MEDIUM, ALL).
- **Backend**:
  - `alert_subscriptions` SQLite table for tracking confirmed users and tokens.
  - Transactional emails via **Resend**.
  - Rate limiting (500 emails/day) to prevent bill shock.
- **Cron Job**: Daily execution at 00:00 UTC fetches matching CVEs from the last 24h and sends digests.
- **Security**: Token-based unsubscription (one-click) included in every footer.

---

## 7. API Design (V1 + V2 additions)

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

### V2 new endpoints

**GET /api/compare?cve1=xxx&cve2=yyy**
```json
{
  "cve1": { /* full CVESummary object */ },
  "cve2": { /* full CVESummary object */ },
  "diff": {
    "cvssScore": { "cve1": 9.8, "cve2": 7.5, "difference": -2.3 },
    "affectedVersions": { "added": ["1.22"], "removed": ["1.18"] },
    "patchStatus": { "cve1": "available", "cve2": "none" },
    "summaryDiff": "CVE-2024-12345 has a buffer overflow while CVE-2024-12346 is a use-after-free..."
  }
}
```

**GET /api/search?q=string&severity=high&page=1**
```json
{
  "totalResults": 47,
  "page": 1,
  "perPage": 20,
  "cves": [/* CVESummary array */],
  "facets": {
    "severities": { "critical": 12, "high": 35, "medium": 0 },
    "topProducts": ["nginx", "Apache", "PostgreSQL"]
  }
}
```

**GET /api/dashboard/stats?days=30**
```json
{
  "velocity": {
    "daily": [{"date": "2024-03-01", "critical": 2, "high": 5, "medium": 8}],
    "totals": { "critical": 45, "high": 120, "medium": 200 }
  },
  "topVendors": [{"vendor": "Microsoft", "count": 142}],
  "cweDistribution": [{"cwe": "CWE-89", "name": "SQL Injection", "count": 45}],
  "exploitTrend": [{"date": "2024-03-01", "publicExploit": 12, "noExploit": 88}],
  "patchVelocity": { "medianDays": 47, "bySeverity": { "critical": 12, "high": 34 } },
  "zeroDayCount": 8
}
```

**POST /api/impact**
```json
// Request
{ "cveId": "CVE-2024-12345" }

// Response
{
  "confidentiality": "HIGH — Unauthenticated file read",
  "integrity": "MEDIUM — Limited to log tampering",
  "availability": "CRITICAL — Remote code execution possible",
  "blastRadius": "Adjacent systems sharing auth mechanism",
  "exploitationComplexity": {
    "timeToExploit": "Hours",
    "skillLevel": "Script kiddie",
    "detectionTime": "6-12 hours"
  },
  "attackChain": [
    "Attacker sends crafted request to /api/upload",
    "Bypasses file validation (this CVE)",
    "Uploads webshell",
    "Executes commands as www-data",
    "Lateral movement via stolen credentials"
  ],
  "disclaimer": "Simulated impact — actual results depend on your environment"
}
```

**GET /api/similar?cveId=xxx&limit=5** (used for comparison suggestions)
```json
{
  "similar": [
    { "cveId": "CVE-2024-12346", "similarityScore": 0.92, "reason": "Same product, similar CVSS" }
  ]
}
```

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

## 10. Data Flow & Caching Strategy (V1 + V2)

### V1 flow

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

### V2 additions

**Search index population (daily cron):**
```
Vercel Cron Job (daily at 02:00 UTC) → /api/cron/index-cves
    ↓
Fetch last 30 days of CVEs from NVD API
    ↓
Upsert into SQLite (libsql) with FTS5 indexing
    ↓
Store EPSS scores for each CVE
    ↓
Cache warming: Pre-compute dashboard aggregates
```

**Comparison cache:**
- Cache key: `compare:{cve1}:{cve2}`
- TTL: 24 hours
- Storage: Vercel KV (Redis)

**Dashboard cache:**
- Cache key: `dashboard:{days}`
- TTL: 1 hour
- Background revalidation on page load

**Impact simulation cache:**
- Cache key: `impact:{cveId}`
- TTL: 7 days
- Storage: In-memory Map (V1) → Redis (V2)

The left pane list continues to use 5‑minute cache for NVD data.

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

### (V2 additions)

| Variable | Required | Description |
|----------|----------|-------------|
| **LIBSQL_URL** | For search | Turso/libsql database URL (optional, falls back to in-memory) |
| **LIBSQL_AUTH_TOKEN** | If using Turso | Authentication token for remote SQLite |
| **REDIS_URL** | For caching | Vercel KV or Upstash Redis URL (optional) |

NEVER prefix any of these with NEXT_PUBLIC_. They are server-side only.

---

## 12. Project Structure (V2 additions)

cve-simplified/
├── app/
│   ├── page.tsx                      # Split-pane landing page (master + detail)
│   ├── cve/
│   │   └── [cveId]/
│   │       └── page.tsx              # Mobile detail page (full-screen)
│   ├── layout.tsx                    # Root layout, metadata, CSP headers
│   ├── compare/
│   │   ├── [cve1]/[cve2]/
│   │   │   └── page.tsx              # Dynamic compare route: /compare/CVE-xxx/CVE-yyy
│   │   └── page.tsx                  # Compare page with query params fallback
│   ├── search/
│   │   └── page.tsx                  # Search results page
│   ├── dashboard/
│   │   └── page.tsx                  # Trend dashboard
│   └── api/
│       ├── cves/route.ts             # GET /api/cves — NVD proxy
│       ├── explain/route.ts          # POST /api/explain — LLM proxy (with role + reading time)
│       ├── compare/route.ts          # GET /api/compare — CVE comparison endpoint
│       ├── search/route.ts           # GET /api/search — Full-text search endpoint
│       ├── impact/route.ts           # POST /api/impact — Impact simulation
│       ├── similar/route.ts          # GET /api/similar — Similar CVE suggestions
│       ├── dashboard/
│       │   └── stats/route.ts        # GET /api/dashboard/stats — Dashboard aggregates
│       └── cron/
│           ├── index-cves/route.ts   # Daily search index refresh
│           └── send-alerts/route.ts  # Daily email alert job (rate-limited)
├── lib/
│   ├── alerts/
│   │   └── subscriptions.ts          # Alert DB helpers (CRUD)
│   ├── email/
│   │   ├── sender.ts                 # Resend integration
│   │   └── templates.ts              # HTML email templates
│   ├── nvd/
│   │   ├── client.ts                 # NVD API fetch + normalization
│   │   └── types.ts                  # NVD response types
├── components/
│   ├── MasterPane/
│   │   ├── CVECard.tsx
│   │   ├── CVECardList.tsx
│   │   └── MasterHeader.tsx
│   ├── DetailPane/
│   │   ├── CVEDetail.tsx
│   │   ├── CVEDetailHeader.tsx
│   │   ├── WhatIfExplainer.tsx
│   │   ├── RoleSelector.tsx              # Engineer/Manager/Executive pill buttons
│   │   ├── ImpactSimulationDrawer.tsx
│   │   ├── SimilarCVEs.tsx
│   │   └── RawDataCollapsible.tsx
│   ├── SeverityBadge.tsx             # Color-coded severity pill
│   ├── SkeletonCard.tsx              # Loading state
│   ├── CompareView.tsx               # Side-by-side comparison view
│   ├── DiffHighlighter.tsx           # Visual diff component
│   ├── SearchFilters.tsx             # Advanced filter drawer
│   ├── SearchBar.tsx                 # Global search bar with autocomplete
│   └── Dashboard/
│       ├── VelocityChart.tsx         # 30-day CVE velocity line chart
│       ├── TopVendorsBar.tsx         # Top 10 vendors horizontal bar chart
│       ├── CWEPieChart.tsx           # CWE distribution pie chart
│       ├── ExploitTrend.tsx          # Exploit availability stacked area chart
│       ├── PatchVelocityGauge.tsx    # Median patch time gauge
│       └── ZeroDayCounter.tsx        # Zero-day tracker counter
├── lib/
│   ├── nvd/
│   │   ├── client.ts                 # NVD API fetch + normalization
│   │   └── types.ts                  # NVD response types
│   ├── ai/
│   │   ├── explainCVE.ts             # AI function (with reading time + difficulty)
│   │   ├── impact.ts                 # Impact simulation prompt + logic
│   │   ├── whatIf.ts                 # Role-specific prompt templates
│   │   ├── prompts/
│   │   │   └── templates.ts          # All prompt templates (system + user)
│   │   └── providers/
│   │       ├── groq.ts               # Groq cloud provider (production)
│   │       └── ollama.ts             # Ollama local provider (dev)
│   ├── search/
│   │   ├── index.ts                  # FTS5 search implementation
│   │   ├── schema.sql                # SQLite schema for CVE storage
│   │   └── sync.ts                   # Daily index refresh logic
│   ├── dashboard/
│   │   └── aggregator.ts             # Dashboard stats calculation
│   ├── cache/
│   │   ├── index.ts                  # Unified cache interface
│   │   ├── memory.ts                 # In-memory Map implementation
│   │   └── redis.ts                  # Redis implementation (optional Vercel KV)
│   ├── rateLimit.ts                  # IP-based rate limiter
│   └── sanitize.ts                   # Input sanitization helpers
├── hooks/
│   ├── useCVEs.ts                    # TanStack Query hook for CVE list
│   ├── useCVEExplanation.ts          # TanStack Query hook for AI explanation
│   ├── useCompare.ts                 # TanStack Query hook for CVE comparison
│   ├── useSearch.ts                  # TanStack Query hook for search
│   ├── useDashboard.ts               # TanStack Query hook for dashboard stats
│   ├── useSelectedCVE.ts             # Manages ?cve= query param
│   └── useImpact.ts                  # TanStack Query hook for impact simulation
├── types/
│   ├── cve.ts                        # Shared CVE types (CVESummary, CVEDetail, etc.)
│   ├── compare.ts                    # Comparison types (DiffResult, SimilarCVE, etc.)
│   ├── search.ts                     # Search types (SearchParams, SearchResult, Facets)
│   └── dashboard.ts                  # Dashboard types (DashboardStats, WidgetData)
├── utils/
│   ├── readingTime.ts                # Word count + difficulty calculation
│   └── constants.ts                  # Severity colors, CVSS ranges, CWE mappings
├── next.config.js                    # Security headers, env validation
├── middleware.ts                     # Rate limiting at edge
├── .env.local                        # Never committed
├── .env.example                      # Committed, no real values
└── vercel.json                       # Cron job configuration (daily index refresh)

---

## 13. UI Design Spec (V3 Additions)

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

### New components

**Compare page layout:**
- Two-column grid with sticky headers
- Diff highlighting: green background for additions, red for deletions (only when same semantic section)
- Mobile: Stack vertically with expand/collapse sections

**Dashboard widgets:**
- Consistent card styling (same as CVE grid)
- Loading skeletons per widget
- Error state per widget (not whole dashboard)
- Responsive: 1 col mobile, 2 col tablet, 3 col desktop

**Search page:**
- Sticky filter drawer on desktop (collapsible on mobile)
- Search results as card grid (same as homepage)
- "Save this search" disabled in V2 (deferred to V3)

**Role selector:**
- Three pill buttons: Engineer | Manager | Executive
- Persist selection in localStorage
- Default: Engineer

### Typography & colors (unchanged from V1)

### Animations (additions)
- Dashboard widget entrance: Staggered fade-up
- Compare page diff highlight: Pulsing yellow then fade to normal (1.5s)
- Role switch: Cross-fade animation (150ms)

### Layout (V3)

- **Desktop/tablet:** Two panes side‑by‑side. Left pane has a fixed width, right pane fills the rest. No modal overlay.
- **Active card:** Left border accent width `4px` (instead of `2px`), background `#14141f`. Smooth transition on background and border.
- **Right pane transitions:** Fade‑in content when a new CVE is selected (150ms). Sticky header with blur effect.
- **Mobile:** Full‑page detail view with back button; no split‑pane.
- **Responsive breakpoint:** `768px` – below that, split‑pane disabled, mobile behavior activates.
- **All other styling** (colors, typography, animations) unchanged from V2.

---

## 14. LLM Prompt Template (Server-Side) (V2 additions)

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

### "What If" Explainer — Role-specific prompts

**Engineer prompt (added to existing system prompt):**
```
You are a senior security engineer. For the given CVE, explain the "What If" impact 
focusing on technical exploitation mechanics, attack vectors, and chaining possibilities. 
Be specific about protocols, file paths, and system components. Assume the reader writes 
code and manages infrastructure. Use concrete examples. Keep under 150 words.
```

**Manager prompt:**
```
You are a security manager. For the given CVE, explain the "What If" impact focusing 
on remediation effort, team resources, regulatory risk, and business process disruption. 
Avoid deep technical jargon. Estimate time and cost where reasonable. Keep under 150 words.
```

**Executive prompt:**
```
You are a CISO or security executive. For the given CVE, explain the "What If" impact 
focusing on business risk, customer trust, brand reputation, and strategic priorities. 
Give a clear recommendation (Patch now / Schedule / Monitor). Keep under 100 words.
```

### Impact Simulation prompt (new)
```
You are a red teamer and impact analyst. For the given CVE, simulate exploitation impact 
in a typical enterprise environment. Provide conservative, evidence-based estimates. 
Structure your response as JSON with these fields: confidentiality, integrity, availability, 
blastRadius, exploitationComplexity, attackChain (array of 4-6 steps). 
If insufficient data exists, state "Insufficient data for reliable estimate".
Never claim certainty about specific environments. Always include the disclaimer.
```

### Reading time & difficulty prompt addition
```
After generating explanations, calculate:
- readingTimeMinutes: total words in technicalReality + plainEnglish + howToFix divided by 150
- difficulty: "Beginner" if no CWE or complex exploitation terms, "Intermediate" if attack 
  vectors mentioned, "Expert" if code-level details or exploit chains present
```
---

## 15. Acceptance Criteria

### V1 criteria (unchanged)

|Feature                        | Pass Criteria|
|-------------------------------|-------------------------------------------------------------|
|CVE grid loads                 | 20 CVEs render within 3s on a standard connection|
|Severity colors                | Each card and badge reflects correct CVSS bracket|
|Card click opens modal         | Modal opens within 200ms of click (data may still load)|
|AI sections display            | All 4 sections render for each CVE (or graceful fallback)|
|API keys hidden                | Browser network tab shows zero calls to NVD or LLM directly|
|Rate limiting works            | 11th request in 60s returns 429 with clear error message|
|No XSS via AI output           | AI content in modal is plaintext — no HTML/script execution|
|CSP header present             | curl -I on deployed URL shows Content-Security-Policy header|
|Input sanitization             | Malformed CVE IDs rejected with 400 before proxying to NVD|
|Fallback on LLM failure        | If LLM call fails, raw NVD description shown, no crash |

### V2 new acceptance criteria

| Feature | Pass Criteria |
|---------|----------------|
| CVE Compare | Two CVEs render side-by-side with visual diff highlighting within 2s |
| Compare sharing | Shareable URL loads correct comparison and shows OG image |
| Search | Full-text search returns relevant results, typo tolerance works |
| Search filters | Each filter correctly modifies result set, URL reflects state |
| Dashboard | All 6 widgets load within 3s, charts are interactive (tooltips) |
| Dashboard refresh | Manual refresh updates data without page reload |
| Impact simulation | Returns structured JSON within 3s, disclaimer present |
| "What If" explainer | Role switcher changes content immediately (cached per role) |
| Reading time | Displayed in modal, matches actual word count (±10%) |
| Difficulty | Reasonable classification (test on 50 CVEs, 90% accuracy) |
| Performance | Lighthouse score ≥ 90 on desktop and mobile for all new pages |
| Backward compatibility | V1 features unchanged, no regressions |

### V3 new acceptance criteria

| Feature | Pass Criteria |
|---------|----------------|
| Split‑pane layout (desktop) | Left pane (list) and right pane (detail) visible side‑by‑side, no modal |
| Click CVE card | Right pane updates with detail content, URL changes to `/?cve=CVE-xxx`, left pane highlights selected card |
| URL deep linking | Loading `/?cve=CVE-xxx` shows correct detail in right pane and highlights the card |
| Browser back/forward | Updates both panes correctly, no full reload |
| Mobile (<768px) | Left pane fills screen; clicking card navigates to separate detail page with back button |
| Right pane content | All sections (Technical, Plain, Analogy, Fix, Reading Time, What If, Similar CVEs, Raw Data) render correctly |
| Impact simulation | Drawer opens from right pane, shows simulation data |
| Compare button | Navigates to `/compare?cve1=...` with current CVE pre‑filled |
| Performance | Right pane loads detail in <500ms (cache helps); left pane pagination smooth |
| No regressions | Compare, search, dashboard, impact simulation work as before (V2 features intact) |

---