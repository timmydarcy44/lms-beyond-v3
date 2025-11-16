import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { getServerClient } from "@/lib/supabase/server";
import { isSuperAdmin } from "@/lib/auth/super-admin";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
  apiVersion: "2024-11-20.acacia",
});

export const dynamic = 'force-dynamic';

/**
 * Initie le processus de connexion Stripe Connect pour un Super Admin
 * Crée un compte Express Stripe Connect et retourne l'URL d'autorisation
 */
export async function GET(request: NextRequest) {
  try {
    const hasAccess = await isSuperAdmin();
    if (!hasAccess) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
    }

    const supabase = await getServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    // Vérifier si un compte Stripe Connect existe déjà
    const { data: existingAccount } = await supabase
      .from("stripe_connect_accounts")
      .select("stripe_account_id, charges_enabled, payouts_enabled")
      .eq("user_id", user.id)
      .maybeSingle();

    if (existingAccount && existingAccount.charges_enabled && existingAccount.payouts_enabled) {
      return NextResponse.json({
        message: "Compte Stripe déjà connecté",
        account_id: existingAccount.stripe_account_id,
        connected: true,
      });
    }

    // Créer un nouveau compte Express Stripe Connect
    const account = await stripe.accounts.create({
      type: "express",
      country: "FR", // Par défaut, peut être changé
      email: user.email || undefined,
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true },
      },
    });

    // Créer le lien d'autorisation
    const accountLink = await stripe.accountLinks.create({
      account: account.id,
      refresh_url: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/stripe/connect/refresh`,
      return_url: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/stripe/connect/callback?account_id=${account.id}`,
      type: "account_onboarding",
    });

    // Sauvegarder le compte dans la base de données
    await supabase
      .from("stripe_connect_accounts")
      .upsert({
        user_id: user.id,
        stripe_account_id: account.id,
        account_type: "express",
        charges_enabled: false,
        payouts_enabled: false,
        details_submitted: false,
        email: user.email || null,
        country: "FR",
        default_currency: "eur",
      }, {
        onConflict: "user_id",
      });

    return NextResponse.json({
      url: accountLink.url,
      account_id: account.id,
    });
  } catch (error) {
    console.error("[stripe/connect/authorize] Error:", error);
    return NextResponse.json(
      { error: "Erreur lors de la création du compte Stripe Connect" },
      { status: 500 }
    );
  }
}




