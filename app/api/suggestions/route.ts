import { NextResponse } from 'next/server';
import { db } from '@/lib/search';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q');

  if (!q || q.length < 2) {
    return NextResponse.json({ suggestions: [] });
  }

  try {
    // 1. Suggest exact CVE ID matches
    const cveSuggestions = db.prepare('SELECT id FROM cves WHERE id LIKE ? LIMIT 3')
      .all(`${q}%`)
      .map((r: any) => ({ type: 'cve', value: r.id }));

    // 2. Suggest product names from FTS (using a simpler prefix match on the main table for speed)
    const productSuggestions = db.prepare('SELECT DISTINCT affectedProducts FROM cves WHERE affectedProducts LIKE ? LIMIT 3')
      .all(`%${q}%`)
      .map((r: any) => ({ 
          type: 'product', 
          value: r.affectedProducts.split(',')[0].trim() 
      }));

    // Deduplicate and combine
    const combined = [...cveSuggestions, ...productSuggestions].slice(0, 5);
    
    return NextResponse.json({ suggestions: combined });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ suggestions: [] });
  }
}
