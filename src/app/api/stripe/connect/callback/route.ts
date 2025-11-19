import { NextRequest, NextResponse } from "next/server";
import { getServerClient } from "@/lib/supabase/server";
import { isSuperAdmin } from "@/lib/auth/super-admin";

export const dynamic = 'force-dynamic';

function getStripeClient() {
  if (!process.env.STRIPE_SECRET_KEY) {
    return null;
  }
  try {
    const Stripe = require("stripe").default;
    return new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: "2024-11-20.acacia" as any,
    });
  } catch (error) {
    console.error("[stripe] Error initializing Stripe:", error);
    return null;
  }
}

/**
 * Callback après la connexion Stripe Connect
 * Met à jour les informations du compte Stripe
 */
export async function GET(request: NextRequest) {
  try {
    const hasAccess = await isSuperAdmin();
    if (!hasAccess) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }

    const supabase = await getServerClient();
    if (!supabase) {
      return NextResponse.redirect(new URL("/super/parametres?error=service_unavailable", request.url));
    }
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.redirect(new URL("/login", request.url));
    }

    const { searchParams } = new URL(request.url);
    const accountId = searchParams.get("account_id");

    if (!accountId) {
      return NextResponse.redirect(new URL("/super/parametres?error=no_account_id", request.url));
    }

    // Vérifier que Stripe est configuré
    const stripe = getStripeClient();
    if (!stripe) {
      return NextResponse.redirect(new URL("/super/parametres?error=stripe_not_configured", request.url));
    }

    // Récupérer les informations du compte Stripe
    const account = await stripe.accounts.retrieve(accountId);

    // Mettre à jour le compte dans la base de données
    await supabase
      .from("stripe_connect_accounts")
      .update({
        charges_enabled: account.charges_enabled || false,
        payouts_enabled: account.payouts_enabled || false,
        details_submitted: account.details_submitted || false,
        email: account.email || null,
        country: account.country || null,
        default_currency: account.default_currency || "eur",
        updated_at: new Date().toISOString(),
      })
      .eq("stripe_account_id", accountId);

    // Rediriger vers la page de paramètres avec un message de succès
    const redirectUrl = new URL("/super/parametres", request.url);
    redirectUrl.searchParams.set("stripe_connected", "true");
    return NextResponse.redirect(redirectUrl);
  } catch (error) {
    console.error("[stripe/connect/callback] Error:", error);
    const redirectUrl = new URL("/super/parametres", request.url);
    redirectUrl.searchParams.set("error", "stripe_connection_failed");
    return NextResponse.redirect(redirectUrl);
  }
}

