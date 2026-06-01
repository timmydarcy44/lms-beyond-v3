import { NextRequest, NextResponse } from "next/server";
import { assertPraticienAccess } from "@/lib/marketplace/auth";
import {
  getMarketplaceStripe,
  praticienStripeRefreshUrl,
  praticienStripeSuccessUrl,
} from "@/lib/marketplace/stripe";
import { getServiceRoleClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    let bodyPraticienId: string | undefined;
    try {
      const body = (await request.json()) as { praticienId?: string; praticien_id?: string };
      bodyPraticienId = body.praticienId ?? body.praticien_id;
    } catch {
      bodyPraticienId = undefined;
    }

    const access = await assertPraticienAccess(bodyPraticienId);
    if (!access.ok || !access.praticienId) {
      return NextResponse.json({ error: access.error ?? "Accès refusé" }, { status: 403 });
    }

    const stripe = getMarketplaceStripe();
    if (!stripe) {
      return NextResponse.json(
        { error: "Stripe non configuré sur le serveur (STRIPE_SECRET_KEY manquante)" },
        { status: 503 },
      );
    }

    const service = getServiceRoleClient();
    if (!service) {
      return NextResponse.json({ error: "Service Supabase indisponible" }, { status: 503 });
    }

    const { data: praticien, error } = await service
      .from("praticiens_bct")
      .select("id, stripe_account_id, stripe_onboarding_complete")
      .eq("id", access.praticienId)
      .single();

    if (error || !praticien) {
      return NextResponse.json({ error: "Praticien introuvable en base" }, { status: 404 });
    }

    let accountId = praticien.stripe_account_id as string | null;

    if (!accountId) {
      const account = await stripe.accounts.create({
        type: "express",
        country: "FR",
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
      const { error: updateErr } = await service
        .from("praticiens_bct")
        .update({ stripe_account_id: accountId })
        .eq("id", access.praticienId);
      if (updateErr) {
        return NextResponse.json({ error: updateErr.message }, { status: 500 });
      }
    }

    const accountLink = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: praticienStripeRefreshUrl(),
      return_url: praticienStripeSuccessUrl(),
      type: "account_onboarding",
    });

    if (!accountLink.url) {
      return NextResponse.json({ error: "URL Stripe Connect non générée" }, { status: 500 });
    }

    return NextResponse.json({
      url: accountLink.url,
      accountId,
      praticien_id: access.praticienId,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Erreur Stripe Connect";
    console.error("[marketplace/stripe-onboarding]", e);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
