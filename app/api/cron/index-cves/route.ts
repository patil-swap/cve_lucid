import { NextResponse } from 'next/server';
import { db } from '@/lib/search';

export async function POST(request: Request) {
  // Simple auth check using a secret header (Vercel Cron style)
  const authHeader = request.headers.get('Authorization');
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const apiKey = process.env.NVD_API_KEY;
    const headers: HeadersInit = {};
    if (apiKey) headers['apiKey'] = apiKey;

    // Fetch last 30 days of CVEs (approx)
    // For simplicity, we'll fetch the most recent 2000 items as a baseline
    console.log('Starting CVE ingestion via Cron...');
    
    const url = `https://services.nvd.nist.gov/rest/json/cves/2.0?resultsPerPage=500`;
    const res = await fetch(url, { headers });
    
    if (!res.ok) throw new Error('NVD API failure during cron');
    
    const data = await res.json();
    const vulnerabilities = data.vulnerabilities || [];
    
    const insert = db.prepare(`
      INSERT OR REPLACE INTO cves (
        id, description, cvssScore, severity, affectedProducts, cwe, publishedDate, lastModifiedDate,
        exploitExists, patchAvailable, isZeroDay, patchDate
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    let count = 0;
    
    const transaction = db.transaction((items) => {
      for (const item of items) {
        const cve = item.cve;
        const id = cve.id;
        const description = cve.descriptions?.find((d: any) => d.lang === 'en')?.value || '';
        
        // Extract metrics (copying logic from client.ts)
        const metrics = cve.metrics || {};
        const v31 = metrics.cvssMetricV31?.[0];
        const v2 = metrics.cvssMetricV2?.[0];
        const score = v31?.cvssData?.baseScore || v2?.cvssData?.baseScore || null;
        const severity = v31?.cvssData?.baseSeverity || v2?.baseSeverity || 'UNKNOWN';

        // Extract products
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
        const affectedProducts = Array.from(new Set(products)).join(', ');

        // Extract CWE
        const cwe = cve.weaknesses?.[0]?.description?.[0]?.value || '';

        // V3 Logic: Parse references for Patch/Exploit tags
        const refs = cve.references || [];
        const hasPatch = refs.some((r: any) => r.tags?.includes('Patch') || r.tags?.includes('Vendor Advisory'));
        const hasExploit = refs.some((r: any) => r.tags?.includes('Exploit'));
        const isZeroDay = !hasPatch ? 1 : 0;
        const patchDate = hasPatch ? (cve.lastModified || cve.published) : null;

        insert.run(
            id, 
            description, 
            score, 
            severity, 
            affectedProducts, 
            cwe, 
            cve.published, 
            cve.lastModified,
            hasExploit ? 1 : 0,
            hasPatch ? 1 : 0,
            isZeroDay,
            patchDate
        );
        count++;
      }
    });

    transaction(vulnerabilities);

    console.log(`Cron complete. Indexed ${count} CVEs.`);
    return NextResponse.json({ success: true, count });
  } catch (error) {
    console.error('Cron Ingestion Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
