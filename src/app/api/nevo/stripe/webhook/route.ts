import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { getServiceRoleClientOrFallback } from "@/lib/supabase/server";
import { sendEmail } from "@/lib/email/resend-client";
import {
  getWelcomeEmailTemplate,
  getStrategicEmailTemplate,
  getEngagementEmailTemplate,
} from "@/lib/email-templates";

const webhookSecret = process.env.NEVO_STRIPE_WEBHOOK_SECRET || "";
const secretKey = process.env.NEVO_STRIPE_SECRET_KEY || "";

const stripe = secretKey
  ? new Stripe(secretKey, { apiVersion: "2025-10-29.clover" })
  : null;

export async function POST(request: NextRequest) {
  if (!stripe) {
    return NextResponse.json({ error: "Stripe not configured" }, { status: 500 });
  }
  if (!webhookSecret) {
    return NextResponse.json({ error: "Webhook secret missing" }, { status: 500 });
  }

  const body = await request.text();
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "No signature" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (error) {
    console.error("[nevo/stripe/webhook] Signature verification failed:", error);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const userId = session.metadata?.user_id;
    const customerEmail =
      session.customer_email || session.customer_details?.email || session.metadata?.email;

    const supabase = await getServiceRoleClientOrFallback();
    if (!supabase) {
      return NextResponse.json({ error: "Supabase not configured" }, { status: 500 });
    }

    let targetUserId = userId || null;

    if (!targetUserId && customerEmail) {
      const { data: profileByEmail } = await supabase
        .from("profiles")
        .select("id")
        .eq("email", customerEmail)
        .maybeSingle();
      targetUserId = profileByEmail?.id || null;
    }

    if (!targetUserId && customerEmail) {
      const inviteResponse = await supabase.auth.admin.inviteUserByEmail(customerEmail, {
        redirectTo: "https://nevo-app.fr/app-landing/login",
        data: { source: "nevo_stripe" },
      });

      if (inviteResponse.error) {
        console.error("[nevo/stripe/webhook] Error inviting user:", inviteResponse.error);
      } else if (inviteResponse.data?.user?.id) {
        targetUserId = inviteResponse.data.user.id;
        console.log("[nevo/stripe/webhook] User invited:", targetUserId);
      }
    }

    if (!targetUserId) {
      console.warn("[nevo/stripe/webhook] No user found/created for session");
      return NextResponse.json({ received: true });
    }

    const { error: updateError } = await supabase
      .from("profiles")
      .upsert({
        id: targetUserId,
        email: customerEmail || undefined,
        isPremium: true,
      })
      .eq("id", targetUserId);

    if (updateError) {
      console.error("[nevo/stripe/webhook] Error updating profile:", updateError);
    } else {
      console.log("[nevo/stripe/webhook] Premium enabled for user:", targetUserId);
    }

    if (customerEmail) {
      const sendAt = new Date();
      const h1 = new Date(sendAt.getTime() + 60 * 60 * 1000);
      const d1 = new Date(sendAt.getTime() + 24 * 60 * 60 * 1000);
      const d7 = new Date(sendAt.getTime() + 7 * 24 * 60 * 60 * 1000);

      const { error: scheduleError } = await supabase.from("scheduled_emails").insert([
        {
          email: customerEmail,
          type: "welcome_h1",
          send_at: h1.toISOString(),
          sent: false,
          user_id: targetUserId,
        },
        {
          email: customerEmail,
          type: "strategic_d1",
          send_at: d1.toISOString(),
          sent: false,
          user_id: targetUserId,
        },
        {
          email: customerEmail,
          type: "engagement_d7",
          send_at: d7.toISOString(),
          sent: false,
          user_id: targetUserId,
        },
      ]);

      if (scheduleError) {
        console.error("[nevo/stripe/webhook] Error scheduling emails:", scheduleError);
      }
    }
  }

  return NextResponse.json({ received: true });
}
