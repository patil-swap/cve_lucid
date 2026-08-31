import { NextResponse } from "next/server";
import { rateLimit } from "@/lib/rateLimit";
import { simulateImpact } from "@/lib/ai/impact";

export async function POST(request: Request) {
  const ip = request.headers.get("x-forwarded-for") || "127.0.0.1";
  const { allowed } = rateLimit(ip);

  if (!allowed) {
    return NextResponse.json(
      { error: "Too many requests. Please try again later." },
      { status: 429 }
    );
  }

  try {
    const body = await request.json();
    const { cveId, rawNvdData } = body;

    if (!cveId || !rawNvdData) {
      return NextResponse.json({ error: "Missing cveId or rawNvdData" }, { status: 400 });
    }

    const impact = await simulateImpact(cveId, rawNvdData);

    // If the response has a _fallback flag, return 503
    if (impact && typeof impact === 'object' && impact._fallback === true) {
      const { _fallback, _reason, ...fallbackData } = impact;
      return NextResponse.json(
        {
          error: "Impact simulation service temporarily unavailable. Please try again later.",
          fallback: fallbackData
        },
        { status: 503 }
      );
    }

    return NextResponse.json(impact);
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("AI Impact Simulation Error:", msg);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
