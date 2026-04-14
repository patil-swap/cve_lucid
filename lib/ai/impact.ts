/* eslint-disable @typescript-eslint/no-explicit-any */
import { IMPACT_SIMULATION_PROMPT, generateImpactUserPrompt } from "./prompts/templates";
import { getCache, setCache } from "@/lib/cache";

function extractNvdContext(rawData: any) {
    // If rawData has a 'cve' property, use it. Otherwise, assume rawData IS the cve object.
    const cve = rawData?.cve || rawData;
    if (!cve || !cve.id) return { rawDescription: "", cvssScore: null, affectedProducts: [] };

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
        affectedProducts: Array.from(new Set(products)).slice(0, 5) as string[]
    };
}

export async function simulateImpact(cveId: string, rawData: any) {
    const cacheKey = `impact:${cveId}`;
    const cached = await getCache(cacheKey);
    if (cached) return JSON.parse(cached);

    const provider = process.env.AI_PROVIDER || "ollama";
    const { rawDescription, cvssScore, affectedProducts } = extractNvdContext(rawData);

    const cveContext = `CVE ID: ${cveId}\nDescription: ${rawDescription}\nCVSS Score: ${cvssScore}\nAffected Products: ${affectedProducts.join(", ")}`;

    const systemPrompt = IMPACT_SIMULATION_PROMPT;
    const userPrompt = generateImpactUserPrompt(cveContext);

    let finalRawJson = "";

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

        if (!res.ok) throw new Error("Groq API failed");
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

        if (!res.ok) throw new Error("Ollama API failed");
        const output = await res.json();
        finalRawJson = output.message.content;
    }

    try {
        const parsed = JSON.parse(finalRawJson);

        const finalResult = {
            confidentiality: parsed.confidentiality || "Generation failed.",
            integrity: parsed.integrity || "Generation failed.",
            availability: parsed.availability || "Generation failed.",
            blastRadius: parsed.blastRadius || "Details omitted.",
            exploitationComplexity: parsed.exploitationComplexity || { timeToExploit: "N/A", skillLevel: "N/A", detectionTime: "N/A" },
            attackChain: parsed.attackChain || [],
            disclaimer: parsed.disclaimer || "Simulated impact — actual results depend on your specific environment and controls."
        };

        // 7 days TTL for impact representation
        await setCache(cacheKey, JSON.stringify(finalResult), 604800);
        return finalResult;
    } catch {
        console.error("Failed to parse LLM JSON:", finalRawJson);
        throw new Error("Invalid output format from LLM");
    }
}
