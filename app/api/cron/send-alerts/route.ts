import { NextResponse } from "next/server";
import { getConfirmedSubscriptions } from "@/lib/alerts/subscriptions";
import { getDb } from "@/lib/search";
import { sendAlertEmail } from "@/lib/email/sender";

const EMAIL_LIMIT = 500;

export async function POST(request: Request) {
  // 1. Verify Cron Secret
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const db = await getDb();
    // 2. Fetch all confirmed subscriptions
    const subscriptions = await getConfirmedSubscriptions();
    if (subscriptions.length === 0) {
      return NextResponse.json({ message: "No active subscriptions found." });
    }

    // 3. Group by (product, severity_threshold) to minimize searches
    const groups = subscriptions.reduce((acc: any, sub: any) => {
      const key = `${sub.product || 'GLOBAL'}|${sub.severity_threshold}`;
      if (!acc[key]) acc[key] = { 
          product: sub.product, 
          severity: sub.severity_threshold, 
          emails: [] 
      };
      acc[key].emails.push({ email: sub.email, unsubscribeToken: sub.unsubscribe_token });
      return acc;
    }, {});

    let totalEmailsSent = 0;
    const origin = new URL(request.url).origin;

    // 4. Process each group
    for (const key in groups) {
      if (totalEmailsSent >= EMAIL_LIMIT) {
        console.warn("Daily email limit hit, deferring remaining alerts.");
        break;
      }

      const { product, severity, emails } = groups[key];
      
      // Search for CVEs from last 24h matching this product & severity
      // NVD format: 2024-05-18T00:00:00.000
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      
      let query = "SELECT * FROM cves WHERE publishedDate >= ?";
      const params: any[] = [yesterday];

      if (product) {
         query += " AND id IN (SELECT id FROM cves_fts WHERE affectedProducts MATCH ?)";
         params.push(`"${product}"*`);
      }

      if (severity !== 'ALL') {
         query += " AND severity = ?";
         params.push(severity);
      }

      const matchingCvesRes = await db.execute({
        sql: query,
        args: params
      });
      const matchingCves = matchingCvesRes.rows as any[];

      if (matchingCves.length > 0) {
        for (const { email, unsubscribeToken } of emails) {
          if (totalEmailsSent >= EMAIL_LIMIT) break;
          
          const unsubscribeUrl = `${origin}/api/alerts/unsubscribe?token=${unsubscribeToken}`;
          const sent = await sendAlertEmail(email, matchingCves, product || "All Products", unsubscribeUrl);
          if (sent) totalEmailsSent++;
        }
      }
    }

    return NextResponse.json({ 
      message: "Cron job execution finished.",
      emailsSent: totalEmailsSent,
      groupsProcessed: Object.keys(groups).length
    });

  } catch (error) {
    console.error("Cron Job Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
