import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { getServerClient } from "@/lib/supabase/server";
import { isSuperAdmin } from "@/lib/auth/super-admin";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
  apiVersion: "2024-11-20.acacia",
});

export const dynamic = 'force-dynamic';

/**
 * Rafraîchit le lien d'autorisation Stripe Connect si l'utilisateur n'a pas terminé l'onboarding
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

    // Récupérer le compte Stripe Connect de l'utilisateur
    const { data: account } = await supabase
      .from("stripe_connect_accounts")
      .select("stripe_account_id")
      .eq("user_id", user.id)
      .single();

    if (!account) {
      return NextResponse.json({ error: "Aucun compte Stripe Connect trouvé" }, { status: 404 });
    }

    // Créer un nouveau lien d'autorisation
    const accountLink = await stripe.accountLinks.create({
      account: account.stripe_account_id,
      refresh_url: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/stripe/connect/refresh`,
      return_url: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/stripe/connect/callback?account_id=${account.stripe_account_id}`,
      type: "account_onboarding",
    });

    return NextResponse.json({
      url: accountLink.url,
    });
  } catch (error) {
    console.error("[stripe/connect/refresh] Error:", error);
    return NextResponse.json(
      { error: "Erreur lors de la création du lien de rafraîchissement" },
      { status: 500 }
    );
  }
}




