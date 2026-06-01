import { NextRequest, NextResponse } from "next/server";
import { sendSessionConfirmationEmails } from "@/lib/marketplace/emails";
import { getMarketplaceStripe, marketplaceWebhookSecret } from "@/lib/marketplace/stripe";
import { getServiceRoleClient } from "@/lib/supabase/server";
import type Stripe from "stripe";

export const dynamic = "force-dynamic";

async function syncPraticienFromAccount(account: Stripe.Account) {
  const service = getServiceRoleClient();
  if (!service || !account.id) return;

  const complete = Boolean(account.details_submitted && account.charges_enabled);

  const { data: praticien } = await service
    .from("praticiens_bct")
    .select("id, bct_certified")
    .eq("stripe_account_id", account.id)
    .maybeSingle();

  if (!praticien) return;

  await service
    .from("praticiens_bct")
    .update({
      stripe_onboarding_complete: complete,
      visible_marketplace: complete && Boolean(praticien.bct_certified),
      status: complete ? "active" : "pending",
    })
    .eq("stripe_account_id", account.id);
}

async function onPaymentSucceeded(paymentIntent: Stripe.PaymentIntent) {
  const service = getServiceRoleClient();
  if (!service) return;

  const { data: session } = await service
    .from("sessions_bct")
    .select(
      `
      id, date_session, heure_debut, duree_minutes, montant_praticien,
      consentement_donnees, collaborateur_id, praticien_id,
      praticiens_bct ( prenom, nom, user_id )
    `,
    )
    .eq("stripe_payment_intent_id", paymentIntent.id)
    .maybeSingle();

  if (!session) return;

  await service
    .from("sessions_bct")
    .update({
      payment_status: "paid",
      status: "confirmee",
      stripe_transfer_id:
        typeof paymentIntent.latest_charge === "string"
          ? paymentIntent.latest_charge
          : paymentIntent.latest_charge?.id ?? null,
    })
    .eq("stripe_payment_intent_id", paymentIntent.id);

  const praticienRaw = session.praticiens_bct as
    | { prenom: string; nom: string; user_id: string }
    | { prenom: string; nom: string; user_id: string }[]
    | null;
  const praticien = Array.isArray(praticienRaw) ? praticienRaw[0] : praticienRaw;

  const [{ data: collabProfile }, { data: praticienUser }] = await Promise.all([
    service.from("profiles").select("email, first_name, full_name").eq("id", session.collaborateur_id).maybeSingle(),
    praticien?.user_id
      ? service.from("profiles").select("email").eq("id", praticien.user_id).maybeSingle()
      : Promise.resolve({ data: null }),
  ]);

  const collabName =
    (collabProfile?.first_name as string | undefined) ||
    String(collabProfile?.full_name ?? "Collaborateur").split(" ")[0];

  if (collabProfile?.email && praticien && praticienUser?.email) {
    try {
      await sendSessionConfirmationEmails({
        sessionId: session.id as string,
        praticienPrenom: praticien.prenom,
        praticienNom: praticien.nom,
        praticienEmail: praticienUser.email,
        collaborateurPrenom: collabName,
        collaborateurEmail: collabProfile.email,
        dateSession: session.date_session as string,
        heureDebut: String(session.heure_debut).slice(0, 5),
        dureeMinutes: session.duree_minutes as number,
        montantPraticienCents: session.montant_praticien as number,
        consentementDonnees: Boolean(session.consentement_donnees),
      });
    } catch (e) {
      console.error("[stripe-marketplace] emails:", e);
    }
  }
}

export async function POST(request: NextRequest) {
  const stripe = getMarketplaceStripe();
  const secret = marketplaceWebhookSecret();

  if (!stripe || !secret) {
    return NextResponse.json({ error: "Stripe webhook non configuré" }, { status: 503 });
  }

  const body = await request.text();
  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "Signature manquante" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, secret);
  } catch (e) {
    console.error("[stripe-marketplace] signature:", e);
    return NextResponse.json({ error: "Signature invalide" }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "account.updated":
        await syncPraticienFromAccount(event.data.object as Stripe.Account);
        break;
      case "payment_intent.succeeded":
        await onPaymentSucceeded(event.data.object as Stripe.PaymentIntent);
        break;
      case "payment_intent.payment_failed": {
        const pi = event.data.object as Stripe.PaymentIntent;
        const service = getServiceRoleClient();
        if (service) {
          await service
            .from("sessions_bct")
            .update({ payment_status: "failed" })
            .eq("stripe_payment_intent_id", pi.id);
        }
        break;
      }
      default:
        break;
    }
  } catch (e) {
    console.error("[stripe-marketplace] handler:", event.type, e);
    return NextResponse.json({ error: "Handler error" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
