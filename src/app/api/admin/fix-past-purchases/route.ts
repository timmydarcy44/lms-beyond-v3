import { NextRequest, NextResponse } from "next/server";
import { getServiceRoleClient } from "@/lib/supabase/server";
import { isSuperAdmin } from "@/lib/auth/super-admin";
import Stripe from "stripe";

const getStripe = () => {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    return null;
  }
  return new Stripe(secretKey, {
    apiVersion: "2025-10-29.clover",
  });
};

export async function POST(request: NextRequest) {
  try {
    // Vérifier que l'utilisateur est super admin
    const isSuper = await isSuperAdmin();
    if (!isSuper) {
      return NextResponse.json(
        { error: "Non autorisé" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { user_email, days_back = 30 } = body;

    if (!user_email) {
      return NextResponse.json(
        { error: "user_email requis" },
        { status: 400 }
      );
    }

    const supabase = getServiceRoleClient();
    if (!supabase) {
      return NextResponse.json(
        { error: "Supabase non configuré" },
        { status: 500 }
      );
    }

    const stripe = getStripe();
    if (!stripe) {
      return NextResponse.json(
        { error: "Stripe non configuré" },
        { status: 500 }
      );
    }

    // Trouver l'utilisateur
    const { data: profile } = await supabase
      .from("profiles")
      .select("id, email")
      .eq("email", user_email)
      .maybeSingle();

    if (!profile) {
      return NextResponse.json(
        { error: `Utilisateur non trouvé pour l'email: ${user_email}` },
        { status: 404 }
      );
    }

    // Récupérer les sessions Stripe récentes pour cet email
    const cutoffDate = Math.floor((Date.now() - days_back * 24 * 60 * 60 * 1000) / 1000);
    
    const sessions = await stripe.checkout.sessions.list({
      limit: 100,
      created: { gte: cutoffDate },
    });

    // Filtrer les sessions pour cet email et qui sont payées
    const userSessions = sessions.data.filter(
      (session) =>
        (session.customer_email === user_email ||
          session.customer_details?.email === user_email) &&
        session.payment_status === "paid"
    );

    console.log(`[admin/fix-past-purchases] Found ${userSessions.length} paid sessions for ${user_email}`);

    const results = [];
    const errors = [];

    for (const session of userSessions) {
      try {
        const metadata = session.metadata;
        const catalogItemId = metadata?.catalog_item_id || metadata?.itemId;

        if (!catalogItemId) {
          console.warn(`[admin/fix-past-purchases] No catalog_item_id in session ${session.id}`);
          errors.push({
            session_id: session.id,
            error: "No catalog_item_id in metadata",
          });
          continue;
        }

        // Vérifier si l'accès existe déjà
        const { data: existingAccess } = await supabase
          .from("catalog_access")
          .select("id")
          .eq("user_id", profile.id)
          .eq("catalog_item_id", catalogItemId)
          .maybeSingle();

        if (existingAccess) {
          console.log(`[admin/fix-past-purchases] Access already exists for session ${session.id}`);
          results.push({
            session_id: session.id,
            catalog_item_id: catalogItemId,
            status: "already_exists",
          });
          continue;
        }

        // Accorder l'accès
        const { error: accessError, data: accessData } = await supabase
          .from("catalog_access")
          .upsert({
            user_id: profile.id,
            catalog_item_id: catalogItemId,
            organization_id: null,
            access_status: "purchased",
            granted_at: new Date(session.created * 1000).toISOString(),
            transaction_id: session.payment_intent,
            purchase_amount: (session.amount_total || 0) / 100,
            purchase_date: new Date(session.created * 1000).toISOString(),
          }, {
            onConflict: "user_id,catalog_item_id",
          });

        if (accessError) {
          console.error(`[admin/fix-past-purchases] Error granting access for session ${session.id}:`, accessError);
          errors.push({
            session_id: session.id,
            catalog_item_id: catalogItemId,
            error: accessError.message,
          });
        } else {
          console.log(`[admin/fix-past-purchases] ✅ Access granted for session ${session.id}`);
          results.push({
            session_id: session.id,
            catalog_item_id: catalogItemId,
            status: "granted",
          });
        }
      } catch (error: any) {
        console.error(`[admin/fix-past-purchases] Error processing session ${session.id}:`, error);
        errors.push({
          session_id: session.id,
          error: error.message,
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: `Traitement terminé pour ${user_email}`,
      summary: {
        total_sessions: userSessions.length,
        granted: results.filter((r) => r.status === "granted").length,
        already_exists: results.filter((r) => r.status === "already_exists").length,
        errors: errors.length,
      },
      results,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error: any) {
    console.error("[admin/fix-past-purchases] Error:", error);
    return NextResponse.json(
      { error: "Erreur serveur", details: error.message },
      { status: 500 }
    );
  }
}

