import { NextRequest, NextResponse } from "next/server";
import { differenceInHours, parseISO } from "date-fns";
import { getMarketplaceStripe } from "@/lib/marketplace/stripe";
import { getCurrentProfileWithAccess } from "@/lib/auth/profile";
import { assertPraticienAccess } from "@/lib/marketplace/auth";
import { getServiceRoleClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function POST(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id: sessionId } = await context.params;
    const { user } = await getCurrentProfileWithAccess();
    if (!user?.id) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const service = getServiceRoleClient();
    if (!service) {
      return NextResponse.json({ error: "Service indisponible" }, { status: 503 });
    }

    const { data: session, error } = await service
      .from("sessions_bct")
      .select("id, collaborateur_id, creneau_id, date_session, heure_debut, stripe_payment_intent_id, payment_status, status, praticien_id")
      .eq("id", sessionId)
      .maybeSingle();

    if (error || !session) {
      return NextResponse.json({ error: "Session introuvable" }, { status: 404 });
    }

    const praticienAccess = await assertPraticienAccess();
    const isOwner = session.collaborateur_id === user.id;
    const isPraticien =
      praticienAccess.ok && praticienAccess.praticienId === session.praticien_id;

    if (!isOwner && !isPraticien) {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    }

    if (session.status === "annulee") {
      return NextResponse.json({ success: true, message: "Déjà annulée" });
    }

    const sessionStart = parseISO(`${session.date_session}T${String(session.heure_debut).slice(0, 8)}`);
    const heuresAvant = differenceInHours(sessionStart, new Date());

    if (!isPraticien && heuresAvant <= 24) {
      return NextResponse.json(
        { error: "Annulation impossible moins de 24h avant la session" },
        { status: 400 },
      );
    }

    const stripe = getMarketplaceStripe();
    if (
      stripe &&
      session.payment_status === "paid" &&
      session.stripe_payment_intent_id
    ) {
      await stripe.refunds.create({
        payment_intent: session.stripe_payment_intent_id as string,
      });
      await service
        .from("sessions_bct")
        .update({ payment_status: "refunded", status: "annulee" })
        .eq("id", sessionId);
    } else {
      await service.from("sessions_bct").update({ status: "annulee", payment_status: "failed" }).eq("id", sessionId);
      if (stripe && session.stripe_payment_intent_id && session.payment_status === "pending") {
        await stripe.paymentIntents.cancel(session.stripe_payment_intent_id as string).catch(() => undefined);
      }
    }

    if (session.creneau_id) {
      await service.from("praticien_creneaux").update({ disponible: true }).eq("id", session.creneau_id);
    }

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("[marketplace/sessions/cancel]", e);
    return NextResponse.json({ error: "Annulation impossible" }, { status: 500 });
  }
}
