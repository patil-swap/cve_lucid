import { NextResponse } from 'next/server';
import { db } from '@/lib/search';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const cveId = searchParams.get('cveId');

  if (!cveId) {
    return NextResponse.json({ error: "Missing cveId" }, { status: 400 });
  }

  // 1. Get current CVE details to find target product/CWE
  const target = db.prepare('SELECT * FROM cves WHERE id = ?').get(cveId) as any;
  if (!target) {
     return NextResponse.json({ similar: [] });
  }
  
  // 2. Query FTS for similar products/CWEs
  const productKeyword = target.affectedProducts ? target.affectedProducts.split(',')[0] : '';
  const scoreLower = target.cvssScore - 1.5;
  const scoreUpper = target.cvssScore + 1.5;

  let query = 'SELECT id as cveId, description as reason, cvssScore as similarityScore FROM cves WHERE id != ? AND cvssScore BETWEEN ? AND ?';
  const params: any[] = [cveId, scoreLower, scoreUpper];

  if (productKeyword && productKeyword.length > 2) {
     query = `SELECT c.id as cveId, c.description as reason, c.cvssScore as similarityScore 
              FROM cves_fts f 
              JOIN cves c ON f.rowid = c.rowid 
              WHERE c.id != ? AND c.cvssScore BETWEEN ? AND ? AND f.affectedProducts MATCH ? LIMIT 5`;
     params.push(`"${productKeyword}"*`);
  } else {
     query += ' LIMIT 5';
  }

  try {
      const results = db.prepare(query).all(...params);
      return NextResponse.json({ similar: results });
  } catch (err) {
      console.error(err);
      return NextResponse.json({ similar: [] });
  }
}
