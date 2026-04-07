import { NextResponse } from "next/server";
import { fetchNvdCVEs } from "@/lib/nvd/client";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get("page") || "1", 10);
  const severity = searchParams.get("severity") || undefined;
  const keyword = searchParams.get("keyword") || undefined;
  
  const resultsPerPage = 20;

  try {
    const data = await fetchNvdCVEs(page, resultsPerPage, severity, keyword);
    return NextResponse.json(data);
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("Failed to fetch CVEs:", msg);
    return NextResponse.json({ error: "Failed to fetch CVE data from NVD" }, { status: 502 });
  }
}
