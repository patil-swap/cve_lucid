/* eslint-disable @typescript-eslint/no-explicit-any */
import { generateUserPrompt, SYSTEM_PROMPT, generateWhatIfPrompt } from "./prompts/templates";
import { getCache, setCache } from "@/lib/cache";

function sanitizeForPrompt(text: string): string {
    return text
        .replace(/\\/g, "\\\\")
        .replace(/"/g, '\\"')
        .replace(/\n/g, " ")
        .replace(/\r/g, " ")
        .replace(/\t/g, " ")
        .trim();
}

function cleanJson(raw: string): string {
    let cleaned = raw.replace(/```(?:json)?\s*([\s\S]*?)\s*```/g, '$1').trim();
    try { JSON.parse(cleaned); return cleaned; } catch { /* continue */ }
    const lastOpen = cleaned.lastIndexOf('{');
    const lastClose = cleaned.lastIndexOf('}');
    if (lastOpen !== -1 && lastClose !== -1 && lastClose > lastOpen) {
        const candidate = cleaned.substring(lastOpen, lastClose + 1);
        try { JSON.parse(candidate); return candidate; } catch { /* fall through */ }
    }
    const firstOpen = cleaned.indexOf('{');
    const firstClose = cleaned.lastIndexOf('}');
    if (firstOpen !== -1 && firstClose !== -1 && firstClose > firstOpen) {
        return cleaned.substring(firstOpen, firstClose + 1);
    }
    return cleaned;
}

function extractNvdContext(rawData: any) {
    const cve = rawData?.cve || rawData;
    if (!cve || !cve.id) return { rawDescription: "", cvssScore: null, affectedProducts: [], references: [] };
    const descriptions = cve.descriptions || [];
    const enDesc = descriptions.find((d: any) => d.lang === "en" || d.lang === "en-US")?.value || descriptions[0]?.value || "No description available.";
    let cvssScore = null;
    const metrics = cve.metrics || {};
    const metricV31 = metrics.cvssMetricV31?.[0];
    const metricV30 = metrics.cvssMetricV30?.[0];
    const metricV2 = metrics.cvssMetricV2?.[0];
    if (metricV31) cvssScore = metricV31.cvssData.baseScore;
    else if (metricV30) cvssScore = metricV30.cvssData.baseScore;
    else if (metricV2) cvssScore = metricV2.cvssData.baseScore;
    const references = (cve.references || []).map((ref: any) => ref.url).slice(0, 5);
    const products: string[] = [];
    if (cve.configurations) {
        cve.configurations.forEach((conf: any) => {
            conf.nodes?.forEach((node: any) => {
                node.cpeMatch?.forEach((match: any) => {
                    if (match.criteria) products.push(match.criteria.split(":")[4]);
                });
            });
        });
    }
    return {
        rawDescription: enDesc,
        cvssScore,
        affectedProducts: Array.from(new Set(products)).slice(0, 5) as string[],
        references
    };
}

// FALLBACK now includes `_fallback: true` flag
function getFallbackExplanation(cveId: string, role?: "engineer" | "manager" | "executive") {
    const base = {
        _fallback: true, // Flag for route handler
        _reason: "Groq API validation failed"
    };
    if (role) {
        return {
            ...base,
            impactText: `AI translation temporarily unavailable for ${cveId}. Please check the NVD page directly.`
        };
    }
    return {
        ...base,
        technicalReality: `Technical details temporarily unavailable for ${cveId}.`,
        plainEnglish: `Simplified explanation unavailable.`,
        analogy: `Unable to generate analogy.`,
        howToFix: `Please refer to the NVD page.`,
        readingTimeMinutes: 2,
        difficulty: "Intermediate"
    };
}

export async function explainCVE(cveId: string, rawData: any, role?: "engineer" | "manager" | "executive") {
    const cacheKey = role ? `explain:${cveId}:${role}` : `explain:${cveId}`;
    const cached = await getCache(cacheKey);
    if (cached) return JSON.parse(cached);

    const provider = process.env.AI_PROVIDER || "ollama";
    const { rawDescription, cvssScore, affectedProducts, references } = extractNvdContext(rawData);
    const sanitizedDescription = sanitizeForPrompt(rawDescription);

    let systemPrompt = SYSTEM_PROMPT;
    if (provider === "groq") {
        systemPrompt = SYSTEM_PROMPT + "\n\nIMPORTANT: You MUST return ONLY valid JSON. Do NOT wrap it in markdown, code blocks, backticks, or any other formatting. The response must be a raw JSON object that can be parsed directly.";
    }

    let userPrompt = "";
    if (role) {
        const cveContext = `CVE ID: ${cveId}\nDescription: ${sanitizedDescription}\nCVSS Score: ${cvssScore}\nAffected Products: ${affectedProducts.join(", ")}`;
        userPrompt = generateWhatIfPrompt(role, cveContext);
    } else {
        userPrompt = generateUserPrompt(cveId, sanitizedDescription, cvssScore, affectedProducts, references);
    }

    let finalRawJson = "";

    try {
        if (provider === "groq") {
            const apiKey = process.env.GROQ_API_KEY;
            if (!apiKey) throw new Error("GROQ_API_KEY not configured");

            const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${apiKey}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    model: process.env.GROQ_MODEL || "llama-3.3-70b-versatile",
                    messages: [
                        { role: "system", content: systemPrompt },
                        { role: "user", content: userPrompt }
                    ],
                    temperature: 0,
                    response_format: { type: "json_object" }
                })
            });

            if (!res.ok) {
                const errBody = await res.json().catch(() => ({}));
                console.error("Groq error response:", JSON.stringify(errBody));
                // Return fallback (with flag) instead of throwing
                return getFallbackExplanation(cveId, role);
            }
            const output = await res.json();
            finalRawJson = output.choices[0].message.content;
        } else {
            const baseUrl = process.env.OLLAMA_BASE_URL || "http://localhost:11434";
            const model = process.env.OLLAMA_MODEL || "llama3.2";
            const res = await fetch(`${baseUrl}/api/chat`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    model: model,
                    messages: [
                        { role: "system", content: systemPrompt },
                        { role: "user", content: userPrompt }
                    ],
                    stream: false,
                    format: "json",
                    options: { temperature: 0.2 }
                })
            });
            if (!res.ok) throw new Error(`Ollama API failed with status ${res.status}`);
            const output = await res.json();
            finalRawJson = output.message.content;
        }
    } catch (err) {
        console.error("AI explain error:", err);
        return getFallbackExplanation(cveId, role);
    }

    try {
        const cleaned = cleanJson(finalRawJson);
        const parsed = JSON.parse(cleaned);

        if (role) {
            const impactResult = parsed.impactText || parsed.impact || parsed.text || parsed.explanation;
            if (!impactResult) throw new Error("Missing impactText");
            const normalized = { impactText: impactResult };
            await setCache(cacheKey, JSON.stringify(normalized), 86400);
            return normalized;
        }

        const finalResult = {
            technicalReality: parsed.technicalReality || "Generation failed.",
            plainEnglish: parsed.plainEnglish || "Generation failed.",
            analogy: parsed.analogy || "Generation failed.",
            howToFix: parsed.howToFix || "Details omitted.",
            readingTimeMinutes: parsed.readingTimeMinutes || 2,
            difficulty: parsed.difficulty || "Intermediate"
        };
        await setCache(cacheKey, JSON.stringify(finalResult), 86400);
        return finalResult;
    } catch (parseError) {
        console.error("Failed to parse LLM JSON:", finalRawJson);
        return getFallbackExplanation(cveId, role);
    }
}
