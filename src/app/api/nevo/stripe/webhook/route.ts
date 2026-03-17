import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { getServiceRoleClientOrFallback } from "@/lib/supabase/server";
import { getResendClient } from "@/lib/email/resend-client";
import {
  getAccessEmailTemplateWithLink,
  getWelcomeEmailTemplate,
  getStrategicEmailTemplate,
  getEngagementEmailTemplate,
} from "@/lib/email-templates";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

const webhookSecret = process.env.NEVO_STRIPE_WEBHOOK_SECRET || "";
const secretKey = process.env.NEVO_STRIPE_SECRET_KEY || "";

const stripe = secretKey
  ? new Stripe(secretKey, { apiVersion: "2025-10-29.clover" })
  : null;

export async function POST(request: NextRequest) {
  console.log("--- START WEBHOOK DEBUG ---");
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
    const email = session.customer_details?.email || session.customer_email;
    console.log("DEBUG: Email récupéré ->", email);
    if (!email) {
      return NextResponse.json({ error: "No email found in session" }, { status: 400 });
    }

    const supabase = await getServiceRoleClientOrFallback();
    if (!supabase) {
      return NextResponse.json({ error: "Supabase not configured" }, { status: 500 });
    }

    let targetUserId = userId || null;

    if (!targetUserId) {
      const { data: profileByEmail } = await supabase
        .from("profiles")
        .select("id")
        .eq("email", email)
        .maybeSingle();
      targetUserId = profileByEmail?.id || null;
    }

    if (!targetUserId) {
      const inviteResponse = await supabase.auth.admin.inviteUserByEmail(email, {
        redirectTo: "https://nevo-app.fr/app-landing/login",
        data: { source: "nevo_stripe" },
      });

      if (inviteResponse.error) {
        console.error("[nevo/stripe/webhook] Error inviting user (ignored):", inviteResponse.error);
      } else if (inviteResponse.data?.user?.id) {
        targetUserId = inviteResponse.data.user.id;
        console.log("[nevo/stripe/webhook] User invited:", targetUserId);
      }
    }

    let confirmationLink: string | null = null;
    const { data: linkData, error: linkError } = await supabase.auth.admin.generateLink({
      type: "signup",
      email,
      options: {
        redirectTo: "https://nevo-app.fr/app-landing/login",
      },
    });

    if (linkError) {
      console.error("[nevo/stripe/webhook] Error generating signup link:", linkError);
    } else {
      confirmationLink = linkData?.properties?.action_link || null;
      if (linkData?.user?.id && !targetUserId) {
        targetUserId = linkData.user.id;
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
        email,
        isPremium: true,
      })
      .eq("id", targetUserId);

    if (updateError) {
      console.error("[nevo/stripe/webhook] Error updating profile:", updateError);
    } else {
      console.log("[nevo/stripe/webhook] Premium enabled for user:", targetUserId);
    }

    if (confirmationLink) {
      const accessTemplate = getAccessEmailTemplateWithLink(confirmationLink);
      const resend = await getResendClient();
      if (!resend) {
        return NextResponse.json(
          { error: "Resend not configured" },
          { status: 500 },
        );
      }

      console.log("ENVOI TEST RESEND VERS:", email);
      const { data, error } = await resend.emails.send({
        from: "Nevo <onboarding@resend.dev>",
        to: email,
        subject: accessTemplate.subject,
        html: accessTemplate.html,
      });

      console.log("Resend Response Data:", data);
      if (error) {
        console.error("Resend Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      const { error: sentLogError } = await supabase.from("scheduled_emails").insert([
        {
          email,
          type: "access_sent",
          send_at: new Date().toISOString(),
          sent: true,
          sent_at: new Date().toISOString(),
          user_id: targetUserId,
          metadata: { stripe_session_id: session.id },
        },
      ]);

      if (sentLogError) {
        console.error("[nevo/stripe/webhook] Error logging sent email:", sentLogError);
      }
    }

    if (email) {
      const sendAt = new Date();
      const h1 = new Date(sendAt.getTime() + 60 * 60 * 1000);
      const d1 = new Date(sendAt.getTime() + 24 * 60 * 60 * 1000);
      const d7 = new Date(sendAt.getTime() + 7 * 24 * 60 * 60 * 1000);

      const { error: scheduleError } = await supabase.from("scheduled_emails").insert([
        {
          email,
          type: "welcome_h1",
          send_at: h1.toISOString(),
          sent: false,
          user_id: targetUserId,
          metadata: { stripe_session_id: session.id },
        },
        {
          email,
          type: "strategic_d1",
          send_at: d1.toISOString(),
          sent: false,
          user_id: targetUserId,
          metadata: { stripe_session_id: session.id },
        },
        {
          email,
          type: "engagement_d7",
          send_at: d7.toISOString(),
          sent: false,
          user_id: targetUserId,
          metadata: { stripe_session_id: session.id },
        },
      ]);

      if (scheduleError) {
        console.error("[nevo/stripe/webhook] Error scheduling emails:", scheduleError);
      }
    }
  }

  return NextResponse.json({ received: true });
}
