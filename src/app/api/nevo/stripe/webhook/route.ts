import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { getServiceRoleClientOrFallback } from "@/lib/supabase/server";
import { getResendClient } from "@/lib/email/resend-client";
import { getAccessEmailTemplateWithLink, getSiteBranding } from "@/lib/email-templates";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

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
    const email = session.customer_details?.email || session.customer_email;
    if (!email) {
      return NextResponse.json({ error: "No email found in session" }, { status: 400 });
    }

    const currentUrl = process.env.NEXT_PUBLIC_SITE_URL || "";
    const { baseUrl: fallbackBaseUrl, siteName } = getSiteBranding();
    const baseUrl = currentUrl || fallbackBaseUrl;
    let confirmationLink = `${baseUrl}/app-landing/setup-account?session_id=${session.id}`;
    let targetUserId = userId || null;
    let actionLink: string | null = null;

    try {
      const supabase = await getServiceRoleClientOrFallback();
      if (!supabase) {
        throw new Error("Supabase not configured");
      }

      const { data: existingProfile } = await supabase
        .from("profiles")
        .select("id")
        .eq("email", email)
        .maybeSingle();

      const linkType = existingProfile?.id ? "recovery" : "signup";

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
          redirectTo: `${baseUrl}/app-landing/setup-account?session_id=${session.id}`,
          data: { source: "nevo_stripe" },
        });

        if (inviteResponse.error) {
          console.error("[nevo/stripe/webhook] Error inviting user (ignored):", inviteResponse.error);
        } else if (inviteResponse.data?.user?.id) {
          targetUserId = inviteResponse.data.user.id;
        // invite ok
        }
      }

      const { data: linkData, error: linkError } = await supabase.auth.admin.generateLink({
        type: linkType,
        email,
        options: {
          redirectTo: `${baseUrl}/app-landing/setup-account?session_id=${session.id}`,
        },
      });

      if (linkError) {
        console.error("[nevo/stripe/webhook] Error generating signup link:", linkError);
      } else {
        if (linkData?.properties?.action_link) {
          actionLink = linkData.properties.action_link;
          confirmationLink = actionLink;
        }
        if (linkData?.user?.id && !targetUserId) {
          targetUserId = linkData.user.id;
        }
      }

      if (targetUserId) {
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
      // premium enabled
        }
      } else {
        console.warn("[nevo/stripe/webhook] No user found/created for session");
      }
    } catch (supabaseError) {
      console.error("[nevo/stripe/webhook] Supabase flow failed:", supabaseError);
    }

    console.log("DESTINATAIRE:", email, "LIEN ENVOYÉ:", actionLink || confirmationLink);
    const accessTemplate = getAccessEmailTemplateWithLink(confirmationLink, siteName);
    const resend = await getResendClient();
    if (!resend) {
      return NextResponse.json(
        { error: "Resend not configured" },
        { status: 500 },
      );
    }

    try {
      const { data, error } = await resend.emails.send({
        from: process.env.RESEND_FROM_EMAIL || `${siteName} <hello@nevo-app.fr>`,
        to: email,
        subject: accessTemplate.subject,
        html: accessTemplate.html,
      });

      if (error) {
        console.error("LOG RESEND ERROR:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
    } catch (error) {
      console.error("LOG RESEND ERROR:", error);
      return NextResponse.json(
        { error: error instanceof Error ? error.message : "Resend error" },
        { status: 500 },
      );
    }

    try {
      const supabase = await getServiceRoleClientOrFallback();
      if (!supabase) {
        throw new Error("Supabase not configured");
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
    } catch (supabaseError) {
      console.error("[nevo/stripe/webhook] Supabase scheduling failed:", supabaseError);
    }
  }

  return NextResponse.json({ received: true });
}
