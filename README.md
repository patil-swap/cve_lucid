# CVE Lucid V3.0

Security advisories are written by engineers, for engineers. The average CVE entry reads like a legal brief written in assembly. **CVE Lucid** bridges that gap by pulling live vulnerability data natively from the NIST NVD database and running it through an LLM to make it readable, analogous, and actionable for humans.

V3.0 introduces a master-detail workflow, proactive alerting, and real-time version checking, making it a critical hub for security practitioners.

## 🌟 Key Features (V3.0)
- **Master-Detail Layout:** Split-pane interface on desktop for high-velocity triage; mobile-optimized navigation for small screens.
- **Email Alerts & Daily Digests:** Double-opt-in subscription system. Receive personalized CVE digests based on your product stack and severity thresholds.
- **"Am I Affected?" Version Checker:** Client-side tool to check your local product versions against NVD-indexed affected ranges (using `semver`).
- **Tiered Visual Hierarchy:** Vulnerability details structured by utility (Primary: Fix/Technical; Secondary: Plain English/Impact; Tertiary: Analogy/Metadata).
- **Contextual "What If" Explainer:** Role-based (Engineer, Manager, Executive) AI impact assessments.
- **Impact Simulation:** AI-generated hypothetical attack chains and security metric assessments (Confidentiality, Integrity, Availability).
- **Full-Text Search:** Local SQLite FTS5 index for sub-50ms querying across thousands of vulnerabilities.
- **Trend Dashboards:** Real-time visualization of vulnerability velocity, vendor distribution, and CWE categories via Recharts.

## Tech Stack
- **Framework:** Next.js 14 (App Router)
- **Database:** SQLite (better-sqlite3) with FTS5 for local indexing.
- **Email:** Resend (Transactional alerts and daily digests)
- **Styling:** Tailwind CSS v3 & shadcn/ui
- **Data Fetching:** TanStack React Query v5
- **Visualization:** Recharts
- **Diffing:** react-diff-viewer-continued
- **AI Integration:** Groq (Llama 3) / Ollama (Local)
- **Security:** Strict API Proxy routes, Regex ID validation, & OWASP-compliant headers.

---

## 🚀 Getting Started

### 1. Prerequisites
- Node.js (v20+)
- Ollama (Optional, for local inference)
- Resend API account (for email alerts)
- Vercel or local cron (for daily digests)

### 2. Configure Environment Variables
Duplicate `.env.example` to `.env.local`:
```bash
NVD_API_KEY=your_key_here
GROQ_API_KEY=your_key_here
AI_PROVIDER=groq # or ollama
RESEND_API_KEY=re_12345...
ALERT_EMAIL_FROM=notifications@yourdomain.com
CRON_SECRET=random_string_here
```

### 3. Initialize & Automate
Prime the search index and configure the daily alert job:
- **Search Indexing:** `POST /api/cron/index-cves`
- **Daily Alerts:** `POST /api/cron/send-alerts`

### 4. Run Development Server
```bash
npm install
npm run dev
```
Navigate to `http://localhost:3000` to view the master-detail workspace.

---

## 🏗️ Architecture V3

To bypass Cross-Site Scripting (XSS), SSRF, and safeguard API tokens:
1. **Master-Detail Routing:** Deep-linking supported via `?cve=CVE-XXX` query params, allowing persistent state across page reloads and back/forward navigation.
2. **Double-Opt-In Alerting:** UUID-based confirmation tokens ensure user consent and prevent subscription spam.
3. **Deterministic Diffing:** The compare engine maps NVD JSON objects and runs them through a deterministic diff viewer before AI summarization.
4. **Resilient AI Parsing:** Aggressive JSON extraction logic prevents 500 errors when LLMs include "chatter" or markdown in their responses.
5. **Hybrid Storage:** Combines local SQLite persistence (for search/analytics) with dynamic NVD proxying for real-time accuracy.
6. **Caching Layer:** AI responses and simulation outputs are cached via a unified memory/persistence layer to reduce latency and token usage.
7. **Hybrid Indexing:** Recent CVEs are periodically pulled from NVD and indexed into a local SQLite FTS5 virtual table.
8. **Deterministic Diffing:** The compare engine maps NVD JSON objects and runs them through a deterministic diff viewer before AI summarization.
9. **Role-Based Isolation:** Prompt injection is mitigated by isolating role-based system instructions in a centralized, read-only template registry.