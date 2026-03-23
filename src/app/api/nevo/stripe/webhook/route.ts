import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { getServiceRoleClient } from "@/lib/supabase/server";
import { sendEmail } from "@/lib/email/resend-client";

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

    console.log("RECU STRIPE");
    console.log("DATA:", session.customer_details?.email || session.customer_email);
    try {
      const resendResult = await sendEmail({
        to: email,
        subject: "Nevo - Confirmation",
        html: `<p>Votre paiement Stripe a bien été reçu. Si vous ne recevez pas le Magic Link, contactez le support.</p>`,
      });
      if (!resendResult.success) {
        console.error("CRASH RESEND:", resendResult.error);
      }
    } catch (error) {
      console.error("CRASH RESEND:", error);
    }

    console.log("[nevo/stripe/webhook] checkout.session.completed received", {
      sessionId: session.id,
      email,
      hasCustomerDetails: Boolean(session.customer_details?.email),
    });

    let targetUserId = userId || null;
    if (!targetUserId) {
      console.warn("[nevo/stripe/webhook] Missing user_id metadata; continuing without it");
    }

    console.log("[nevo/stripe/webhook] env check:", {
      hasSupabaseUrl: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL),
      hasServiceRole: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE),
    });

    const supabase = getServiceRoleClient();
    if (!supabase) {
      console.error("[nevo/stripe/webhook] Supabase service role not configured");
    } else {
      // 1) Create user (admin) first
      try {
        if (!targetUserId) {
          const { data: createdUser, error: createError } = await supabase.auth.admin.createUser({
            email,
            email_confirm: true,
            user_metadata: { origin: "nevo", source: "nevo_stripe" },
          });
          if (createError) {
            console.error("[nevo/stripe/webhook] createUser error:", createError);
          } else {
            targetUserId = createdUser?.user?.id || null;
          }
        }

        if (!targetUserId) {
          try {
            const { data, error: listError } = await supabase.auth.admin.listUsers({
              filters: { email },
            });
            if (!listError && data?.users?.length) {
              targetUserId = data.users[0]?.id || null;
            }
          } catch (listError) {
            console.error("[nevo/stripe/webhook] listUsers error:", listError);
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
          }
        } else {
          console.warn("[nevo/stripe/webhook] No user found/created for session");
        }
      } catch (supabaseError) {
        console.error("[nevo/stripe/webhook] Supabase create user failed:", supabaseError);
      }
    }

    console.log("DESTINATAIRE:", email, "RESEND ENVOYÉ");

    // 3) Scheduled emails logging last - must never block
    try {
      if (!supabase) {
        throw new Error("Supabase not configured");
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
    } catch (scheduleError) {
      console.error("[nevo/stripe/webhook] Scheduled emails insert failed:", scheduleError);
    }
  }

  return NextResponse.json({ received: true });
}
