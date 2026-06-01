import { NextResponse } from "next/server";
import { assertPraticienAccess } from "@/lib/marketplace/auth";
import { getMarketplaceStripe } from "@/lib/marketplace/stripe";
import { getServiceRoleClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function POST() {
  const access = await assertPraticienAccess();
  if (!access.ok || !access.praticienId) {
    return NextResponse.json({ error: access.error }, { status: 403 });
  }

  const stripe = getMarketplaceStripe();
  const service = getServiceRoleClient();
  if (!stripe || !service) {
    return NextResponse.json({ error: "Stripe indisponible" }, { status: 503 });
  }

  const { data: praticien } = await service
    .from("praticiens_bct")
    .select("stripe_account_id, stripe_onboarding_complete")
    .eq("id", access.praticienId)
    .single();

  if (!praticien?.stripe_account_id || !praticien.stripe_onboarding_complete) {
    return NextResponse.json({ error: "Stripe Connect non configuré" }, { status: 400 });
  }

  const link = await stripe.accounts.createLoginLink(praticien.stripe_account_id as string);
  return NextResponse.json({ url: link.url });
}
