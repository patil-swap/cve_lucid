# CVE Lucid V2.0

Security advisories are written by engineers, for engineers. The average CVE entry reads like a legal brief written in assembly. **CVE Lucid** bridges that gap by pulling live vulnerability data natively from the NIST NVD database and running it through an LLM to make it readable, analogous, and actionable for humans.

V2.0 evolves the platform into a comprehensive security intelligence tool with local persistence, trend analysis, and comparative diffing.

## 🌟 Key Features (V2.0)
- **Full-Text Search:** Local SQLite FTS5 index for sub-50ms querying across thousands of vulnerabilities.
- **Trend Dashboards:** Real-time visualization of vulnerability velocity, vendor distribution, and CWE categories via Recharts.
- **Comparative Analysis:** Side-by-side CVE comparison with visual diffing of description changes.
- **Contextual "What If" Explainer:** Role-based (Engineer, Manager, Executive) AI impact assessments.
- **Impact Simulation:** AI-generated hypothetical attack chains and security metric assessments (Confidentiality, Integrity, Availability).

## Tech Stack
- **Framework:** Next.js 14 (App Router)
- **Database:** SQLite (better-sqlite3) with FTS5 for local indexing.
- **Styling:** Tailwind CSS v3 & shadcn/ui
- **Data Fetching:** TanStack React Query v5
- **Visualization:** Recharts
- **Diffing:** react-diff-viewer-continued
- **AI Integration:** Groq (Llama 3) / Ollama (Local)
- **Security:** Strict API Proxy routes & HTTP Security Headers (OWASP compliant)

---

## 🚀 Getting Started

### 1. Prerequisites
- Node.js (v20+)
- Ollama (Optional, for local inference)

### 2. Configure Environment Variables
Duplicate `.env.example` to `.env.local`:
```bash
NVD_API_KEY=your_key_here
GROQ_API_KEY=your_key_here
AI_PROVIDER=groq # or ollama
CRON_SECRET=random_string_here
```

### 3. Initialize Search Index
V2 relies on a local SQLite index for search and dashboards. Prime the index by hitting the cron endpoint:
```bash
curl -X POST http://localhost:3000/api/cron/index-cves -H "Authorization: Bearer undefined"
```

### 4. Run Development Server
```bash
npm install
npm run dev
```
Navigate to `http://localhost:3000` to view real-time CVE payloads.

---

## 🏗️ Architecture V2

To bypass Cross-Site Scripting (XSS), SSRF, and safeguard API tokens:
1. **Hybrid Indexing:** Recent CVEs are periodically pulled from NVD and indexed into a local SQLite FTS5 virtual table.
2. **Deterministic Diffing:** The compare engine maps NVD JSON objects and runs them through a deterministic diff viewer before AI summarization.
3. **Role-Based Isolation:** Prompt injection is mitigated by isolating role-based system instructions in a centralized, read-only template registry.
4. **Caching Layer:** AI responses and simulation outputs are cached via a unified memory/persistence layer to reduce latency and token usage.
