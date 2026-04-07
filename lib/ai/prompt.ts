export const SYSTEM_PROMPT = `You are a cybersecurity expert and technical writer. Your job is to take raw CVE (Common Vulnerability and Exposure) data and produce four distinct explanations. Be accurate. Do not invent details not present in the source data. If patch information is unavailable, say so clearly. Respond with valid JSON only. No markdown formatting ticks like \`\`\`json around the response. No preamble.`;

export function generateUserPrompt(cveId: string, rawDescription: string, cvssScore: number | null, affectedProducts: string[], references: string[]) {
  return `Analyze the following CVE and return a JSON object with exactly these four fields:
- technicalReality: 2 sentences describing the actual vulnerability mechanism for a security engineer.
- plainEnglish: 1-2 short paragraphs explaining what this bug does and what an attacker can achieve, written for a non-technical reader.
- analogy: One punchy, memorable analogy that accurately reflects the vulnerability's nature.
- howToFix: Actionable remediation advice. Include patch version if available.

<vulnerability_data>
CVE ID: ${cveId}
Description: ${rawDescription}
CVSS Score: ${cvssScore !== null ? cvssScore : 'N/A'}
Affected Products: ${affectedProducts.join(", ") || 'N/A'}
References: ${references.join("\n")}
</vulnerability_data>`;
}
