import { NextRequest, NextResponse } from "next/server";
import { assertMarketplaceAccess } from "@/lib/marketplace/auth";
import { splitSessionAmount } from "@/lib/marketplace/commission";
import { getMarketplaceStripe } from "@/lib/marketplace/stripe";
import { getServiceRoleClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type Body = {
  praticienId?: string;
  creneauId?: string;
  motif?: string;
  consentementDonnees?: boolean;
};

export async function POST(request: NextRequest) {
  try {
    const access = await assertMarketplaceAccess();
    if (!access.ok || !access.userId) {
      return NextResponse.json({ error: access.error ?? "Accès refusé" }, { status: 403 });
    }

    const body = (await request.json()) as Body;
    const praticienId = String(body.praticienId ?? "").trim();
    const creneauId = String(body.creneauId ?? "").trim();
    const motif = body.motif ? String(body.motif).trim().slice(0, 2000) : null;
    const consentementDonnees = Boolean(body.consentementDonnees);

    if (!praticienId || !creneauId) {
      return NextResponse.json({ error: "praticienId et creneauId requis" }, { status: 400 });
    }

    const stripe = getMarketplaceStripe();
    if (!stripe) {
      return NextResponse.json({ error: "Stripe non configuré" }, { status: 503 });
    }

    const service = getServiceRoleClient();
    if (!service) {
      return NextResponse.json({ error: "Service indisponible" }, { status: 503 });
    }

    const { data: creneau, error: creneauErr } = await service
      .from("praticien_creneaux")
      .select("id, praticien_id, date, heure_debut, heure_fin, disponible")
      .eq("id", creneauId)
      .eq("praticien_id", praticienId)
      .maybeSingle();

    if (creneauErr || !creneau) {
      return NextResponse.json({ error: "Créneau introuvable" }, { status: 404 });
    }
    if (!creneau.disponible) {
      return NextResponse.json({ error: "Ce créneau n'est plus disponible" }, { status: 409 });
    }

    const { data: praticien, error: praticienErr } = await service
      .from("praticiens_bct")
      .select("id, tarif_session, duree_session, stripe_account_id, stripe_onboarding_complete, status, visible_marketplace, bct_certified")
      .eq("id", praticienId)
      .maybeSingle();

    if (praticienErr || !praticien) {
      return NextResponse.json({ error: "Praticien introuvable" }, { status: 404 });
    }
    if (
      praticien.status !== "active" ||
      !praticien.visible_marketplace ||
      !praticien.bct_certified ||
      !praticien.stripe_onboarding_complete ||
      !praticien.stripe_account_id
    ) {
      return NextResponse.json({ error: "Praticien non disponible à la réservation" }, { status: 400 });
    }

    const montantTotal = praticien.tarif_session as number;
    const { commissionBeyond, montantPraticien } = splitSessionAmount(montantTotal);

    const paymentIntent = await stripe.paymentIntents.create({
      amount: montantTotal,
      currency: "eur",
      payment_method_types: ["card"],
      application_fee_amount: commissionBeyond,
      transfer_data: {
        destination: praticien.stripe_account_id as string,
      },
      metadata: {
        praticien_id: praticienId,
        collaborateur_id: access.userId,
        creneau_id: creneauId,
      },
    });

    const { data: session, error: sessionErr } = await service
      .from("sessions_bct")
      .insert({
        praticien_id: praticienId,
        collaborateur_id: access.userId,
        organization_id: access.organizationId,
        creneau_id: creneauId,
        date_session: creneau.date,
        heure_debut: creneau.heure_debut,
        heure_fin: creneau.heure_fin,
        duree_minutes: praticien.duree_session,
        motif,
        consentement_donnees: consentementDonnees,
        consentement_date: consentementDonnees ? new Date().toISOString() : null,
        montant_total: montantTotal,
        commission_beyond: commissionBeyond,
        montant_praticien: montantPraticien,
        stripe_payment_intent_id: paymentIntent.id,
        payment_status: "pending",
        status: "confirmee",
      })
      .select("id")
      .single();

    if (sessionErr || !session) {
      await stripe.paymentIntents.cancel(paymentIntent.id).catch(() => undefined);
      return NextResponse.json(
        { error: sessionErr?.message ?? "Impossible de créer la session" },
        { status: 500 },
      );
    }

    await service.from("praticien_creneaux").update({ disponible: false }).eq("id", creneauId);

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      sessionId: session.id,
    });
  } catch (e) {
    console.error("[marketplace/sessions/create]", e);
    return NextResponse.json({ error: "Erreur lors de la réservation" }, { status: 500 });
  }
}
