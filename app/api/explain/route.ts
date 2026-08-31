import { NextResponse } from "next/server";
import { rateLimit } from "@/lib/rateLimit";
import { explainCVE } from "@/lib/ai/explainCVE";

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
    const { searchParams } = new URL(request.url);
    const roleParam = searchParams.get("role");
    const role = (roleParam === "engineer" || roleParam === "manager" || roleParam === "executive") ? roleParam : undefined;

    const body = await request.json();
    const { cveId, rawNvdData } = body;

    if (!cveId || !rawNvdData) {
      return NextResponse.json({ error: "Missing cveId or rawNvdData" }, { status: 400 });
    }

    const explanation = await explainCVE(cveId, rawNvdData, role);

    // If the response has a _fallback flag, return 503
    if (explanation && typeof explanation === 'object' && explanation._fallback === true) {
      const { _fallback, _reason, ...fallbackData } = explanation; // Remove internal flags
      return NextResponse.json(
        {
          error: "AI translation service temporarily unavailable. Please try again later.",
          fallback: fallbackData
        },
        { status: 503 } // Service Unavailable
      );
    }

    return NextResponse.json(explanation);
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("AI Explanation Error:", msg);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
