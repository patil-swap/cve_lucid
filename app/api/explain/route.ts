import { NextResponse } from "next/server";
import { explainCVE } from "@/lib/ai/explainCVE";
import { rateLimit } from "@/lib/rateLimit";

export async function POST(request: Request) {
  const ip = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "127.0.0.1";
  const { allowed } = rateLimit(ip);
  
  if (!allowed) {
    return NextResponse.json({ error: "Rate limit exceeded. Try again later." }, { status: 429 });
  }

  try {
    const body = await request.json();
    const { cveId, rawNvdData } = body;

    if (!cveId || !/^CVE-\d{4}-\d{4,}$/.test(cveId)) {
        return NextResponse.json({ error: "Invalid CVE ID format" }, { status: 400 });
    }

    const explanation = await explainCVE(cveId, rawNvdData);
    return NextResponse.json(explanation);
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("AI Explanation Error:", msg);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
