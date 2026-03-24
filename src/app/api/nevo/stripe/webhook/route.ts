import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { getServiceRoleClient } from "@/lib/supabase/server";
import { sendEmail } from "@/lib/email/resend-client";
import { getNevoMagicLinkEmail } from "@/lib/email-templates";

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
  if (event.type !== "checkout.session.completed") {
    return NextResponse.json({ received: true });
  }

  const session = event.data.object as Stripe.Checkout.Session;
  const userId = session.metadata?.user_id;
  const email = session.customer_details?.email || session.customer_email;
  const stripeCustomerId = typeof session.customer === "string" ? session.customer : null;

  if (!email) {
    console.error("[Webhook] Missing email in session", { sessionId: session.id });
    return NextResponse.json({ received: true });
  }

  try {
    console.log(`[Webhook] Paiement reçu pour : ${email}`);

    let magicLinkUrl = "https://www.nevo-app.fr/note-app";
    let targetUserId = userId || null;
    let shouldSendEmail = true;
    let profileUpsertError: unknown = null;
    let shouldUpsertProfile = true;

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
      return NextResponse.json({ received: true });
    }

    // Idempotence: check existing profile by email or stripe_customer_id
    try {
      const profileQuery = supabase
        .from("profiles")
        .select("id, isPremium, plan, stripe_customer_id")
        .maybeSingle();

      const { data: existingProfile, error: profileLookupError } = stripeCustomerId
        ? await profileQuery.or(`email.eq.${email},stripe_customer_id.eq.${stripeCustomerId}`)
        : await profileQuery.eq("email", email);

      if (profileLookupError) {
        console.error("[nevo/stripe/webhook] Profile lookup error:", profileLookupError);
      } else if (existingProfile) {
        targetUserId = existingProfile.id || targetUserId;
        if (existingProfile.isPremium) {
          console.log("[Webhook] Utilisateur déjà premium, événement ignoré.");
          shouldSendEmail = false;
        }
        if (existingProfile.stripe_customer_id && stripeCustomerId) {
          shouldUpsertProfile = existingProfile.stripe_customer_id !== stripeCustomerId;
        }
      }
    } catch (error) {
      console.error("[nevo/stripe/webhook] Profile lookup failed:", error);
    }

    // 1) Auth creation or retrieval (check existing first)
    try {
      if (!targetUserId) {
        try {
          const { data, error: listError } = await supabase.auth.admin.listUsers({
            filters: { email },
          } as any);
          if (!listError && data?.users?.length) {
            targetUserId = data.users[0]?.id || null;
          }
        } catch (listError) {
          console.error("[nevo/stripe/webhook] listUsers error:", listError);
        }
      }

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
    } catch (error) {
      console.error("[nevo/stripe/webhook] Auth creation failed:", error);
    }

    if (targetUserId) {
      console.log(`[Webhook] Utilisateur créé/récupéré : ${targetUserId}`);
    }

    // 2) Generate Magic Link (always if email available)
    try {
      const { data, error } = await supabase.auth.admin.generateLink({
        type: "magiclink",
        email,
        options: {
          redirectTo: "https://www.nevo-app.fr/auth/callback?next=/note-app",
        },
      });
      if (error) {
        console.error("[nevo/stripe/webhook] generateLink error:", error);
      } else if (data?.properties?.action_link) {
        magicLinkUrl = data.properties.action_link;
      }
    } catch (error) {
      console.error("[nevo/stripe/webhook] generateLink failed:", error);
    }

    // 3) Profile upsert - never blocks email
    if (targetUserId && shouldUpsertProfile) {
      try {
        const { error: updateError } = await supabase
          .from("profiles")
          .upsert(
            {
              id: targetUserId,
              email,
              isPremium: true,
              plan: "pro",
              ...(stripeCustomerId ? { stripe_customer_id: stripeCustomerId } : {}),
            },
            { onConflict: "id" },
          );

        if (updateError) {
          profileUpsertError = updateError;
          console.error("[nevo/stripe/webhook] Error updating profile:", updateError);
        }
      } catch (error) {
        profileUpsertError = error;
        console.error("[nevo/stripe/webhook] Profile upsert failed:", error);
      }
    }

    // 4) Email send (always when not already processed)
    if (shouldSendEmail) {
      const { subject, html } = getNevoMagicLinkEmail(magicLinkUrl);
      try {
        const resendResult = await sendEmail({
          to: email,
          from: "Nevo <hello@nevo-app.fr>",
          subject,
          html,
        });
        if (!resendResult.success) {
          console.error("CRASH RESEND:", resendResult.error);
        } else {
          console.log("[Webhook] Email envoyé via Resend.");
        }
      } catch (error) {
        console.error("CRASH RESEND:", error);
      }
    }

    // 5) Scheduled emails logging last - must never block
    try {
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
          metadata: { stripe_session_id: session.id, profileUpsertError: Boolean(profileUpsertError) },
        },
        {
          email,
          type: "strategic_d1",
          send_at: d1.toISOString(),
          sent: false,
          user_id: targetUserId,
          metadata: { stripe_session_id: session.id, profileUpsertError: Boolean(profileUpsertError) },
        },
        {
          email,
          type: "engagement_d7",
          send_at: d7.toISOString(),
          sent: false,
          user_id: targetUserId,
          metadata: { stripe_session_id: session.id, profileUpsertError: Boolean(profileUpsertError) },
        },
      ]);

      if (scheduleError) {
        console.error("[nevo/stripe/webhook] Error scheduling emails:", scheduleError);
      }
    } catch (scheduleError) {
      console.error("[nevo/stripe/webhook] Scheduled emails insert failed:", scheduleError);
    }
  } catch (error) {
    console.error("[nevo/stripe/webhook] Unhandled error during processing:", error);
  }

  return NextResponse.json({ received: true });
}
