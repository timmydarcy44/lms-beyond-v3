import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

const secretKey = process.env.NEVO_STRIPE_SECRET_KEY || "";
const stripe = secretKey ? new Stripe(secretKey, { apiVersion: "2025-10-29.clover" }) : null;

export async function GET(request: NextRequest) {
  if (!stripe) {
    return NextResponse.json({ error: "Stripe not configured" }, { status: 500 });
  }

  const sessionId = request.nextUrl.searchParams.get("session_id");
  if (!sessionId) {
    return NextResponse.json({ error: "session_id requis" }, { status: 400 });
  }

  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    return NextResponse.json({
      session_id: session.id,
      customer_email: session.customer_details?.email || session.customer_email,
      user_id: session.metadata?.user_id || null,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Erreur récupération session" },
      { status: 500 },
    );
  }
}
