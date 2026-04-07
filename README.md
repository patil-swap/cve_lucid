# CVE Lucid

Security advisories are written by engineers, for engineers. The average CVE entry reads like a legal brief written in assembly. **CVE Lucid** bridges that gap by pulling live vulnerability data natively from the NIST NVD database and running it through an LLM to make it readable, analogous, and actionable for humans.

## Tech Stack
- **Framework:** Next.js 14 (App Router)
- **Styling:** Tailwind CSS v3 & shadcn/ui (Stone dark-mode sequence)
- **Data Fetching:** TanStack React Query v5
- **State Management:** Zustand
- **AI Integration:** Groq (Cloud LLM - Llama 3) / Ollama (Local LLM)
- **Security:** Strict API Proxy routes & HTTP Security Headers (OWASP compliant)

---

## 🚀 Getting Started

### 1. Prerequisites
Ensure you have Node.js (v20+) and standard build tools installed globally.

### 2. Configure Environment Variables
You must set up your environment variables locally to interface with external APIs safely. 

1. Duplicate `.env.example` to `.env.local`:
   ```bash
   cp .env.example .env.local
   ```
2. Populate the keys:
   - `NVD_API_KEY`: Required. Get this from standard NIST NVD registration. Without it, you will face steep generic rate limiting.
   - `GROQ_API_KEY`: Required if using Groq cloud inference. 
   - `AI_PROVIDER`: Switch between `groq` or `ollama`.

### 3. Provide Legacy Peer-Deps Installation
Due to standard Next 14 caching dynamics and strict lint dependencies, install packages bypassing peer complaints:
```bash
npm install --legacy-peer-deps
```

### 4. Run Development Server
```bash
npm run dev
```
Navigate to `http://localhost:3000` to view real-time CVE payloads.

---

## 🏗️ Architecture Note

To bypass Cross-Site Scripting (XSS), Server-Side Request Forgery (SSRF), and strictly safeguard your API tokens:
1. **The browser NEVER directly calls NIST NVD or the LLM.** 
2. All outbound payloads iterate exclusively through Next.js Secure API routes (`/api/cves` & `/api/explain`).
3. External IPs hitting the `/api/explain` proxy are natively Rate Limited (in-memory) mitigating Model Denial of Service vectors.
4. Native `CVECards` rely on a centralized global Zustand state structure (`useModalStore`). The moment a card is clicked, Tanstack Query fetches the AI-translation payload smoothly without disrupting rendering.

