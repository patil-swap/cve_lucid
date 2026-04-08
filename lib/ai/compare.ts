/* eslint-disable @typescript-eslint/no-explicit-any */
import { getCache, setCache } from "@/lib/cache";

export async function generateCompareDiff(cve1: any, cve2: any) {
  const cacheKey = `compare:diff:${cve1.id}:${cve2.id}`;
  const cached = await getCache(cacheKey);
  if (cached) return JSON.parse(cached);

  const provider = process.env.AI_PROVIDER || "ollama";
  
  const systemPrompt = `You are a cybersecurity analyst. Compare two CVEs and highlight the key differences in their mechanism, impact, and fix strategy. Keep it concise.`;
  const userPrompt = `Compare these two vulnerabilities:
  
  CVE 1: ${cve1.id}
  Description: ${cve1.description}
  CVSS: ${cve1.cvssScore}
  Products: ${cve1.affectedProducts?.join(", ")}
  
  CVE 2: ${cve2.id}
  Description: ${cve2.description}
  CVSS: ${cve2.cvssScore}
  Products: ${cve2.affectedProducts?.join(", ")}
  
  Return a JSON object with a single key 'summaryDiff' containing a 2-3 sentence comparison.`;

  let finalRawJson = "";

  if (provider === "groq") {
     const apiKey = process.env.GROQ_API_KEY;
     const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
         method: "POST",
         headers: {
             "Authorization": `Bearer ${apiKey}`,
             "Content-Type": "application/json"
         },
         body: JSON.stringify({
             model: "llama-3.3-70b-versatile",
             messages: [
                 { role: "system", content: systemPrompt },
                 { role: "user", content: userPrompt }
             ],
             temperature: 0.2,
             response_format: { type: "json_object" }
         })
     });

     if (res.ok) {
         const output = await res.json();
         finalRawJson = output.choices[0].message.content;
     }

  } else {
     const baseUrl = process.env.OLLAMA_BASE_URL || "http://localhost:11434";
     const res = await fetch(`${baseUrl}/api/chat`, {
         method: "POST",
         headers: { "Content-Type": "application/json" },
         body: JSON.stringify({
             model: process.env.OLLAMA_MODEL || "llama3.2",
             messages: [
                 { role: "system", content: systemPrompt },
                 { role: "user", content: userPrompt }
             ],
             stream: false,
             format: "json",
             options: { temperature: 0.2 }
         })
     });

     if (res.ok) {
         const output = await res.json();
         finalRawJson = output.message.content;
     }
  }

  try {
     const parsed = JSON.parse(finalRawJson);
     await setCache(cacheKey, JSON.stringify(parsed), 86400);
     return parsed;
  } catch {
     return { summaryDiff: "Unable to generate comparison summary." };
  }
}
