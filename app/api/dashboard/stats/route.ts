import { NextResponse } from 'next/server';
import { db } from '@/lib/search';

export async function GET() {
  try {
    // 1. Velocity Trend (Last 30 days)
    const velocity = db.prepare(`
        SELECT 
            date(publishedDate) as date,
            COUNT(CASE WHEN severity = 'CRITICAL' THEN 1 END) as critical,
            COUNT(CASE WHEN severity = 'HIGH' THEN 1 END) as high,
            COUNT(CASE WHEN severity = 'MEDIUM' THEN 1 END) as medium
        FROM cves 
        WHERE publishedDate >= date('now', '-30 days')
        GROUP BY 1 
        ORDER BY 1 ASC
    `).all();

    // 2. Top Vendors / Products (Simple extraction from comma separated string)
    // In a real app we'd have a separate junction table, for now we pull first product
    const topProductsRaw = db.prepare(`
        SELECT affectedProducts, COUNT(*) as count 
        FROM cves 
        WHERE affectedProducts != ''
        GROUP BY affectedProducts 
        ORDER BY count DESC 
        LIMIT 10
    `).all();

    const topVendors = topProductsRaw.map((p: any) => ({
        vendor: p.affectedProducts.split(',')[0].trim(),
        count: p.count
    }));

    // 3. CWE Distribution
    const cweDistribution = db.prepare(`
        SELECT cwe, COUNT(*) as count 
        FROM cves 
        WHERE cwe != ''
        GROUP BY cwe 
        ORDER BY count DESC 
        LIMIT 5
    `).all();

    // 4. Totals
    const totals = db.prepare(`
        SELECT 
            COUNT(*) as total,
            COUNT(CASE WHEN severity = 'CRITICAL' THEN 1 END) as critical,
            COUNT(CASE WHEN severity = 'HIGH' THEN 1 END) as high
        FROM cves
    `).get() as any;

    return NextResponse.json({
        velocity,
        topVendors,
        cweDistribution,
        totals
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Dashboard stats failure" }, { status: 500 });
  }
}
