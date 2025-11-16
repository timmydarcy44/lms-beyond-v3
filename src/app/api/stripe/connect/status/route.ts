import { NextRequest, NextResponse } from "next/server";
import { getServerClient } from "@/lib/supabase/server";
import { isSuperAdmin } from "@/lib/auth/super-admin";

export const dynamic = 'force-dynamic';

/**
 * Vérifie le statut de connexion Stripe Connect d'un Super Admin
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

    // Récupérer le compte Stripe Connect
    const { data: account } = await supabase
      .from("stripe_connect_accounts")
      .select("stripe_account_id, charges_enabled, payouts_enabled, details_submitted")
      .eq("user_id", user.id)
      .maybeSingle();

    if (!account) {
      return NextResponse.json({
        connected: false,
        charges_enabled: false,
        payouts_enabled: false,
      });
    }

    return NextResponse.json({
      connected: true,
      charges_enabled: account.charges_enabled || false,
      payouts_enabled: account.payouts_enabled || false,
      details_submitted: account.details_submitted || false,
      account_id: account.stripe_account_id,
    });
  } catch (error) {
    console.error("[stripe/connect/status] Error:", error);
    return NextResponse.json(
      { error: "Erreur lors de la vérification du statut" },
      { status: 500 }
    );
  }
}



