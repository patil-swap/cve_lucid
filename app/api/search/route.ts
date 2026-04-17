import { NextResponse } from 'next/server';
import { db } from '@/lib/search';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q');
  const severity = searchParams.get('severity');
  const page = parseInt(searchParams.get('page') || '1', 10);
  const limit = 20;
  const offset = (page - 1) * limit;

  if (!q && !severity) {
    return NextResponse.json({ error: "Missing search query or filter" }, { status: 400 });
  }

  try {
     let query = `
       SELECT c.*, f.rank 
       FROM cves c
       JOIN cves_fts f ON c.id = f.id
     `;
     const params: any[] = [];
     const whereClauses: string[] = [];

     if (q) {
        whereClauses.push('cves_fts MATCH ?');
        params.push(q);
     }

     if (severity && severity !== 'ALL') {
        whereClauses.push('c.severity = ?');
        params.push(severity);
     }

     if (whereClauses.length > 0) {
        query += ' WHERE ' + whereClauses.join(' AND ');
     }

     query += ' ORDER BY c.publishedDate DESC LIMIT ? OFFSET ?';
     params.push(limit, offset);

     const results = db.prepare(query).all(...params);
     
     // Get total count for pagination
     let countQuery = 'SELECT COUNT(*) as total FROM cves c';
     if (whereClauses.length > 0) {
        countQuery += ' JOIN cves_fts f ON c.id = f.id WHERE ' + whereClauses.join(' AND ');
     }
     const total = (db.prepare(countQuery).get(...(params.slice(0, -2))) as any).total;

     return NextResponse.json({
        totalResults: total,
        page,
        perPage: limit,
        cves: results
     });
  } catch (err) {
     console.error(err);
     return NextResponse.json({ error: "Search execution failure" }, { status: 500 });
  }
}
