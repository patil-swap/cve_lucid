import { NextResponse } from 'next/server';
import { getDb } from '@/lib/search';

export async function GET() {
  try {
    const db = await getDb();

    // 1. Velocity Trend (Last 30 days)
    const velocityRes = await db.execute(`
        SELECT 
            date(publishedDate) as date,
            COUNT(CASE WHEN severity = 'CRITICAL' THEN 1 END) as critical,
            COUNT(CASE WHEN severity = 'HIGH' THEN 1 END) as high,
            COUNT(CASE WHEN severity = 'MEDIUM' THEN 1 END) as medium
        FROM cves 
        WHERE publishedDate >= date('now', '-30 days')
        GROUP BY 1 
        ORDER BY 1 ASC
    `);
    const velocity = velocityRes.rows;

    // 2. Top Vendors / Products (Simple extraction from comma separated string)
    // In a real app we'd have a separate junction table, for now we pull first product
    const topProductsRawRes = await db.execute(`
        SELECT affectedProducts, COUNT(*) as count 
        FROM cves 
        WHERE affectedProducts != ''
        GROUP BY affectedProducts 
        ORDER BY count DESC 
        LIMIT 10
    `);
    const topProductsRaw = topProductsRawRes.rows;

    const topVendors = topProductsRaw.map((p: any) => ({
        vendor: p.affectedProducts.split(',')[0].trim(),
        count: p.count
    }));

    // 3. CWE Distribution
    const cweDistributionRes = await db.execute(`
        SELECT cwe, COUNT(*) as count 
        FROM cves 
        WHERE cwe != ''
        GROUP BY cwe 
        ORDER BY count DESC 
        LIMIT 5
    `);
    const cweDistribution = cweDistributionRes.rows;

    // 4. Exploit Availability Trend (Last 90 days)
    const exploitTrendRes = await db.execute(`
        SELECT 
            date(publishedDate) as date,
            COUNT(CASE WHEN exploitExists = 1 THEN 1 END) as publicExploit,
            COUNT(CASE WHEN exploitExists = 0 THEN 1 END) as noExploit
        FROM cves 
        WHERE publishedDate >= date('now', '-90 days')
        GROUP BY 1 
        ORDER BY 1 ASC
    `);
    const exploitTrend = exploitTrendRes.rows;

    // 5. Patch Velocity (Median days from disclosure to patch)
    // SQLite doesn't have a MEDIAN function, we'll do an average of days for simplicity or a subquery
    const patchVelocityRawRes = await db.execute(`
        SELECT 
            AVG(julianday(patchDate) - julianday(publishedDate)) as avgDays,
            severity
        FROM cves 
        WHERE patchAvailable = 1 AND patchDate IS NOT NULL
        GROUP BY severity
    `);
    const patchVelocityRaw = patchVelocityRawRes.rows;

    const patchVelocity = {
        medianDays: Math.round(patchVelocityRaw.reduce((acc: number, curr: any) => acc + curr.avgDays, 0) / (patchVelocityRaw.length || 1)),
        bySeverity: patchVelocityRaw.reduce((acc: any, curr: any) => ({
            ...acc,
            [curr.severity.toLowerCase()]: Math.round(curr.avgDays)
        }), {})
    };

    // 6. Zero-Day Intelligence
    const zeroDayCountRes = await db.execute(`
        SELECT COUNT(*) as count 
        FROM cves 
        WHERE isZeroDay = 1
    `);
    const zeroDayCount = zeroDayCountRes.rows[0] as any;

    const weaponizedCountRes = await db.execute(`
        SELECT COUNT(*) as count 
        FROM cves 
        WHERE exploitExists = 1
    `);
    const weaponizedCount = weaponizedCountRes.rows[0] as any;

    // 7. Totals
    const totalsRes = await db.execute(`
        SELECT 
            COUNT(*) as total,
            COUNT(CASE WHEN severity = 'CRITICAL' THEN 1 END) as critical,
            COUNT(CASE WHEN severity = 'HIGH' THEN 1 END) as high
        FROM cves
    `);
    const totals = totalsRes.rows[0] as any;

    return NextResponse.json({
        velocity,
        topVendors,
        cweDistribution,
        exploitTrend,
        patchVelocity,
        zeroDayCount: zeroDayCount.count,
        weaponizedCount: weaponizedCount.count,
        totals
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Dashboard stats failure" }, { status: 500 });
  }
}
