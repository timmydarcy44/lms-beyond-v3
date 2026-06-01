import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { assertExistingPraticienAccess } from "@/lib/marketplace/auth";
import {
  getMarketplaceStripe,
  praticienStripeRefreshUrl,
  praticienStripeSuccessUrl,
} from "@/lib/marketplace/stripe";
import { getCurrentProfileWithAccess } from "@/lib/auth/profile";
import { getServiceRoleClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

function formatStripeError(e: unknown): string {
  if (e instanceof Stripe.errors.StripeError) {
    return `${e.type}: ${e.message}`;
  }
  if (e instanceof Error) return e.message;
  return String(e);
}

function logStripeOnboardingError(phase: string, e: unknown, extra?: Record<string, unknown>) {
  console.error(`[marketplace/stripe-onboarding] ${phase}`, {
    ...extra,
    message: formatStripeError(e),
    stack: e instanceof Error ? e.stack : undefined,
    stripeCode: e instanceof Stripe.errors.StripeError ? e.code : undefined,
    stripeType: e instanceof Stripe.errors.StripeError ? e.type : undefined,
  });
}

export async function POST(request: NextRequest) {
  try {
    let bodyPraticienId: string | undefined;
    try {
      const body = (await request.json()) as { praticienId?: string; praticien_id?: string };
      bodyPraticienId = body.praticienId ?? body.praticien_id;
    } catch {
      bodyPraticienId = undefined;
    }

    const access = await assertExistingPraticienAccess(bodyPraticienId);
    if (!access.ok || !access.praticienId) {
      return NextResponse.json(
        { error: access.error ?? "Accès refusé" },
        { status: access.status ?? 403 },
      );
    }

    const stripe = getMarketplaceStripe();
    if (!stripe) {
      return NextResponse.json(
        {
          error: "Stripe non configuré sur le serveur (STRIPE_SECRET_KEY manquante ou invalide)",
          hint: "Vérifiez STRIPE_SECRET_KEY sur Vercel (clé sk_*, pas NEVO_STRIPE_SECRET_KEY)",
        },
        { status: 503 },
      );
    }

    const service = getServiceRoleClient();
    if (!service) {
      return NextResponse.json({ error: "Service Supabase indisponible" }, { status: 503 });
    }

    const { data: praticien, error } = await service
      .from("praticiens_bct")
      .select("id, user_id, stripe_account_id, stripe_onboarding_complete, prenom, nom")
      .eq("id", access.praticienId)
      .eq("user_id", access.userId)
      .maybeSingle();

    if (error) {
      logStripeOnboardingError("praticien_fetch", error, { praticienId: access.praticienId });
      return NextResponse.json({ error: "Impossible de charger la fiche praticien" }, { status: 404 });
    }

    if (!praticien?.id || !praticien.user_id) {
      return NextResponse.json(
        {
          error:
            "Aucune fiche praticien BCT valide pour votre compte. Un administrateur doit lier votre user_id dans praticiens_bct.",
        },
        { status: 404 },
      );
    }

    const { profile } = await getCurrentProfileWithAccess();
    const praticienEmail = profile?.email?.trim() || undefined;

    let accountId = praticien.stripe_account_id as string | null;

    if (!accountId) {
      try {
        const account = await stripe.accounts.create({
          type: "express",
          country: "FR",
          email: praticienEmail,
          capabilities: {
            card_payments: { requested: true },
            transfers: { requested: true },
          },
          business_type: "individual",
          settings: {
            payouts: {
              schedule: {
                interval: "weekly",
                weekly_anchor: "friday",
              },
            },
          },
        });
        accountId = account.id;
      } catch (e) {
        logStripeOnboardingError("accounts.create", e, { praticienId: access.praticienId });
        return NextResponse.json(
          { error: formatStripeError(e), phase: "accounts.create" },
          { status: 500 },
        );
      }

      const { error: updateErr } = await service
        .from("praticiens_bct")
        .update({ stripe_account_id: accountId })
        .eq("id", access.praticienId)
        .eq("user_id", access.userId);
      if (updateErr) {
        logStripeOnboardingError("stripe_account_id_update", updateErr, { accountId });
        return NextResponse.json({ error: updateErr.message, phase: "db_update" }, { status: 500 });
      }
    }

    let accountLink;
    try {
      accountLink = await stripe.accountLinks.create({
        account: accountId,
        refresh_url: praticienStripeRefreshUrl(),
        return_url: praticienStripeSuccessUrl(),
        type: "account_onboarding",
      });
    } catch (e) {
      logStripeOnboardingError("accountLinks.create", e, { accountId });
      return NextResponse.json(
        { error: formatStripeError(e), phase: "accountLinks.create" },
        { status: 500 },
      );
    }

    if (!accountLink.url) {
      return NextResponse.json({ error: "URL Stripe Connect non générée" }, { status: 500 });
    }

    return NextResponse.json({
      url: accountLink.url,
      accountId,
      praticien_id: access.praticienId,
    });
  } catch (e) {
    logStripeOnboardingError("unexpected", e);
    return NextResponse.json(
      { error: formatStripeError(e), phase: "unexpected" },
      { status: 500 },
    );
  }
}
