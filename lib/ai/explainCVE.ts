/* eslint-disable @typescript-eslint/no-explicit-any */
import { generateUserPrompt, SYSTEM_PROMPT } from "./prompt";

const cache = new Map<string, { data: string, timestamp: number }>();
const CACHE_TTL = 24 * 60 * 60 * 1000;

export async function explainCVE(cveId: string, rawData: any) {
  const rawDescription = rawData.descriptions?.find((d: any) => d.lang === "en")?.value || "";
  let cvssScore = null;
  if (rawData.metrics?.cvssMetricV31) cvssScore = rawData.metrics.cvssMetricV31[0].cvssData.baseScore;
  
  const products: string[] = [];
  if (rawData.configurations) {
      rawData.configurations.forEach((conf: any) => {
          conf.nodes?.forEach((node: any) => {
              node.cpeMatch?.forEach((match: any) => {
                  if (match.criteria) products.push(match.criteria);
              });
          });
      });
  }

  const references = rawData.references?.map((r: any) => r.url) || [];
  const userPrompt = generateUserPrompt(cveId, rawDescription, cvssScore, products.slice(0,5), references);
  const provider = process.env.AI_PROVIDER || "groq";

  const cached = cache.get(cveId);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return JSON.parse(cached.data);
  }

  let finalRawJson = "";
  if (provider === "groq") {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) throw new Error("GROQ_API_KEY is not set");

    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: { "Authorization": `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [
            { role: "system", content: SYSTEM_PROMPT },
            { role: "user", content: userPrompt }
        ],
        response_format: { type: "json_object" }
      })
    });

    if (!res.ok) throw new Error("Groq API Error: " + res.status);
    const data = await res.json();
    finalRawJson = data.choices[0].message.content;

  } else {
    // Ollama fallback
    const baseUrl = process.env.OLLAMA_BASE_URL || "http://localhost:11434";
    const model = process.env.OLLAMA_MODEL || "llama3.2";
    
    const res = await fetch(`${baseUrl}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model,
        messages: [
            { role: "system", content: SYSTEM_PROMPT },
            { role: "user", content: userPrompt }
        ],
        stream: false,
        format: "json",
      })
    });

    if (!res.ok) throw new Error("Ollama API Error: " + res.status);
    const data = await res.json();
    finalRawJson = data.message.content;
  }

  try {
     const parsed = JSON.parse(finalRawJson);
     cache.set(cveId, { data: finalRawJson, timestamp: Date.now() });
     
     return {
        technicalReality: parsed.technicalReality || "Generation failed.",
        plainEnglish: parsed.plainEnglish || "Generation failed.",
        analogy: parsed.analogy || "Generation failed.",
        howToFix: parsed.howToFix || "Details omitted."
     };
  } catch {
     console.error("Failed to parse LLM JSON:", finalRawJson);
     throw new Error("Invalid output format from LLM");
  }
}
