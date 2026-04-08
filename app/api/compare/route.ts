import { NextResponse } from 'next/server';
import { fetchSingleCVE } from '@/lib/nvd/client';
import { generateCompareDiff } from '@/lib/ai/compare';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const cve1Id = searchParams.get('cve1');
  const cve2Id = searchParams.get('cve2');

  if (!cve1Id || !cve2Id) {
    return NextResponse.json({ error: "Missing CVE identifiers" }, { status: 400 });
  }

  try {
     const [cve1, cve2] = await Promise.all([
        fetchSingleCVE(cve1Id),
        fetchSingleCVE(cve2Id)
     ]);

     if (!cve1 || !cve2) {
       return NextResponse.json({ error: "One or both CVEs not found in NVD database." }, { status: 404 });
     }

     const diffInfo = await generateCompareDiff(cve1, cve2);

     return NextResponse.json({ 
       cve1, 
       cve2,
       diff: {
         cvssScore: {
           cve1: cve1.cvssScore,
           cve2: cve2.cvssScore,
           difference: ((cve2.cvssScore || 0) - (cve1.cvssScore || 0)).toFixed(1)
         },
         summaryDiff: diffInfo.summaryDiff
       }
     });
  } catch (err) {
     console.error(err);
     return NextResponse.json({ error: "NVD API backend failure" }, { status: 500 });
  }
}
