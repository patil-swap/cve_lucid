import { NextResponse } from "next/server";
import { confirmSubscription } from "@/lib/alerts/subscriptions";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get("token");

  if (!token) {
    return NextResponse.json({ error: "Missing token" }, { status: 400 });
  }

  const confirmed = confirmSubscription(token);

  if (!confirmed) {
    return NextResponse.json({ error: "Invalid or expired confirmation token." }, { status: 400 });
  }

  // Redirect to a pretty success page
  const origin = new URL(request.url).origin;
  return NextResponse.redirect(`${origin}/alerts/confirm`);
}
