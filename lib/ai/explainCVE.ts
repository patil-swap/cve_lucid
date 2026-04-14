/* eslint-disable @typescript-eslint/no-explicit-any */
import { generateUserPrompt, SYSTEM_PROMPT, generateWhatIfPrompt } from "./prompts/templates";
import { getCache, setCache } from "@/lib/cache";

function extractNvdContext(rawData: any) {
    // If rawData has a 'cve' property, use it. Otherwise, assume rawData IS the cve object.
    const cve = rawData?.cve || rawData;
    if (!cve || !cve.id) return { rawDescription: "", cvssScore: null, affectedProducts: [], references: [] };

    // Description
    const descriptions = cve.descriptions || [];
    const enDesc = descriptions.find((d: any) => d.lang === "en" || d.lang === "en-US")?.value || descriptions[0]?.value || "No description available.";

    // Score
    let cvssScore = null;
    const metrics = cve.metrics || {};
    const metricV31 = metrics.cvssMetricV31?.[0];
    const metricV30 = metrics.cvssMetricV30?.[0];
    const metricV2 = metrics.cvssMetricV2?.[0];

    if (metricV31) cvssScore = metricV31.cvssData.baseScore;
    else if (metricV30) cvssScore = metricV30.cvssData.baseScore;
    else if (metricV2) cvssScore = metricV2.cvssData.baseScore;

    // References
    const references = (cve.references || []).map((ref: any) => ref.url).slice(0, 5);

    // Products
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

export async function explainCVE(cveId: string, rawData: any, role?: "engineer" | "manager" | "executive") {
    const cacheKey = role ? `explain:${cveId}:${role}` : `explain:${cveId}`;
    const cached = await getCache(cacheKey);
    if (cached) return JSON.parse(cached);

    const provider = process.env.AI_PROVIDER || "ollama";
    const { rawDescription, cvssScore, affectedProducts, references } = extractNvdContext(rawData);

    let systemPrompt = SYSTEM_PROMPT;
    let userPrompt = "";

    if (role) {
        const cveContext = `CVE ID: ${cveId}\nDescription: ${rawDescription}\nCVSS Score: ${cvssScore}\nAffected Products: ${affectedProducts.join(", ")}`;
        userPrompt = generateWhatIfPrompt(role, cveContext);
    } else {
        userPrompt = generateUserPrompt(cveId, rawDescription, cvssScore, affectedProducts, references);
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
                    model: "llama-3.3-70b-versatile",
                    messages: [
                        { role: "system", content: systemPrompt },
                        { role: "user", content: userPrompt }
                    ],
                    temperature: 0.2,
                    response_format: { type: "json_object" }
                })
            });

            if (!res.ok) throw new Error(`Groq API failed with status ${res.status}`);
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
        if (provider === "ollama") {
            throw new Error(`Ollama connection failed. Ensure Ollama is running at ${process.env.OLLAMA_BASE_URL || "http://localhost:11434"} and the model '${process.env.OLLAMA_MODEL || "llama3.2"}' is pulled. Original error: ${(err as Error).message}`);
        }
        throw err;
    }

    try {
        const parsed = JSON.parse(finalRawJson);

        // Fallback defaults for missing fields if JSON is weird
        if (role) {
            if (!parsed.impactText) throw new Error("Missing impactText in role generation");
            await setCache(cacheKey, JSON.stringify(parsed), 86400);
            return parsed;
        }

        const finalResult = {
            technicalReality: parsed.technicalReality || "Generation failed.",
            plainEnglish: parsed.plainEnglish || "Generation failed.",
            analogy: parsed.analogy || "Generation failed.",
            howToFix: parsed.howToFix || "Details omitted.",
            readingTimeMinutes: parsed.readingTimeMinutes || 2,
            difficulty: parsed.difficulty || "Intermediate"
        };

        await setCache(cacheKey, JSON.stringify(finalResult), 86400); // 24h
        return finalResult;
    } catch {
        console.error("Failed to parse LLM JSON:", finalRawJson);
        throw new Error("Invalid output format from LLM");
    }
}
