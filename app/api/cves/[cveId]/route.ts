import { NextResponse } from 'next/server';
import { db } from '@/lib/search';
import { fetchNvdCVEs } from '@/lib/nvd/client';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ cveId: string }> }
) {
  const { cveId } = await params;
  
  if (!/^CVE-\d{4}-\d{4,}$/.test(cveId)) {
    return NextResponse.json({ error: "Invalid CVE ID format" }, { status: 400 });
  }

  try {
    // 1. Try local index first
    const cve = db.prepare('SELECT * FROM cves WHERE id = ?').get(cveId);

    if (cve) {
      return NextResponse.json(cve);
    }

    // 2. Fallback to NVD if not indexed
    console.log(`CVE ${cveId} not in local index, fetching from NVD...`);
    const nvdData = await fetchNvdCVEs(1, 1, undefined, cveId);
    
    const found = nvdData.cves.find((c: any) => c.id === cveId);
    if (!found) {
      return NextResponse.json({ error: "CVE not found in local index or NVD" }, { status: 404 });
    }

    return NextResponse.json(found);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
