/* eslint-disable @typescript-eslint/no-explicit-any */
import { IMPACT_SIMULATION_PROMPT, generateImpactUserPrompt } from "./prompts/templates";
import { getCache, setCache } from "@/lib/cache";

// Sanitize user input to prevent JSON breakage
function sanitizeForPrompt(text: string): string {
    return text
        .replace(/\\/g, "\\\\")
        .replace(/"/g, '\\"')
        .replace(/\n/g, " ")
        .replace(/\r/g, " ")
        .replace(/\t/g, " ")
        .trim();
}

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

// Generate a structured fallback in case AI fails
function getFallbackImpact(cveId: string) {
    return {
        _fallback: true,
        _reason: "Groq API validation failed",
        confidentiality: `Confidentiality impact temporarily unavailable for ${cveId}.`,
        integrity: `Integrity impact temporarily unavailable.`,
        availability: `Availability impact temporarily unavailable.`,
        blastRadius: `Please review the CVE manually.`,
        exploitationComplexity: {
            timeToExploit: "Unknown",
            skillLevel: "Unknown",
            detectionTime: "Unknown"
        },
        attackChain: ["Review CVE for attack chain details."],
        disclaimer: "Impact simulation failed; please check NVD entry directly."
    };
}

export async function simulateImpact(cveId: string, rawData: any) {
    const cacheKey = `impact:${cveId}`;
    const cached = await getCache(cacheKey);
    if (cached) return JSON.parse(cached);

    const provider = process.env.AI_PROVIDER || "ollama";
    const { rawDescription, cvssScore, affectedProducts } = extractNvdContext(rawData);

    // Sanitize the description before injecting
    const sanitizedDescription = sanitizeForPrompt(rawDescription);

    const cveContext = `CVE ID: ${cveId}\nDescription: ${sanitizedDescription}\nCVSS Score: ${cvssScore}\nAffected Products: ${affectedProducts.join(", ")}`;

    // Enhance system prompt for Groq to enforce raw JSON
    let systemPrompt = IMPACT_SIMULATION_PROMPT;
    if (provider === "groq") {
        systemPrompt = IMPACT_SIMULATION_PROMPT + "\n\nIMPORTANT: You MUST return ONLY valid JSON. Do NOT wrap it in markdown, code blocks, backticks, or any other formatting. The response must be a raw JSON object that can be parsed directly. Do NOT include any explanatory text outside the JSON.";
    }

    const userPrompt = generateImpactUserPrompt(cveContext);

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
                // Handle JSON validation error specifically
                if (errBody?.error?.code === "json_validate_failed" ||
                    errBody?.error?.message?.includes("json_validate_failed")) {
                    console.warn(`JSON validation failed for impact simulation on ${cveId}. Returning fallback.`);
                    const fallback = getFallbackImpact(cveId);
                    await setCache(cacheKey, JSON.stringify(fallback), 3600);
                    return fallback;
                }
                throw new Error(`Groq API failed with status ${res.status}: ${errBody?.error?.message ?? "unknown error"}`);
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
        // If Groq fails, log and return fallback instead of throwing
        console.error("Impact simulation AI error:", err);
        const fallback = getFallbackImpact(cveId);
        await setCache(cacheKey, JSON.stringify(fallback), 3600);
        return fallback;
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

        await setCache(cacheKey, JSON.stringify(finalResult), 604800); // 7 days
        return finalResult;
    } catch (parseError) {
        console.error("Failed to parse impact JSON:", finalRawJson);
        console.error("Parse error:", parseError);
        // Return fallback instead of throwing
        const fallback = getFallbackImpact(cveId);
        await setCache(cacheKey, JSON.stringify(fallback), 3600);
        return fallback;
    }
}
