import { NextResponse } from "next/server";
import { unsubscribe } from "@/lib/alerts/subscriptions";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get("token");

  if (!token) {
    return NextResponse.json({ error: "Missing token" }, { status: 400 });
  }

  const success = await unsubscribe(token);

  if (!success) {
    return NextResponse.json({ error: "Invalid unsubscription token." }, { status: 400 });
  }

  const origin = new URL(request.url).origin;
  return NextResponse.redirect(`${origin}/alerts/unsubscribe`);
}
