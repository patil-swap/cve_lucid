import { NextResponse } from "next/server";
import { createSubscription } from "@/lib/alerts/subscriptions";
import { sendConfirmationEmail } from "@/lib/email/sender";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, product, severityThreshold } = body;

    // 1. Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
      return NextResponse.json({ error: "Invalid email address format." }, { status: 400 });
    }

    // 2. Validate severity
    const validSeverities = ["CRITICAL", "HIGH", "MEDIUM", "ALL"];
    if (!validSeverities.includes(severityThreshold)) {
       return NextResponse.json({ error: "Invalid severity threshold." }, { status: 400 });
    }

    // 3. Sanitize product
    const sanitizedProduct = product ? product.replace(/<[^>]*>/g, '').slice(0, 100) : null;

    // 4. Create subscription
    let sub;
    try {
      sub = createSubscription(email, sanitizedProduct, severityThreshold);
    } catch (err: any) {
      if (err.message.includes('Already subscribed')) {
          return NextResponse.json({ error: "You are already subscribed to these alerts." }, { status: 429 });
      }
      throw err;
    }

    // 5. Send confirmation email
    const origin = new URL(request.url).origin;
    const confirmUrl = `${origin}/api/alerts/confirm?token=${sub.confirmToken}`;
    
    const sent = await sendConfirmationEmail(email, confirmUrl);
    if (!sent) {
       // We still created the record, but let the user know there was a mail issue
       return NextResponse.json({ error: "Subscription created but failed to send confirmation email. Please contact support." }, { status: 500 });
    }

    return NextResponse.json({ message: "Subscription pending. Please check your inbox to confirm." }, { status: 201 });

  } catch (error) {
    console.error("Alert Subscription API Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
