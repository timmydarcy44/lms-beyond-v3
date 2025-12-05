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
    const { session_id, user_email, catalog_item_id } = body;

    if (!session_id && !user_email && !catalog_item_id) {
      return NextResponse.json(
        { error: "session_id, user_email ou catalog_item_id requis" },
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

    let userId: string | null = null;
    let catalogItemId: string | null = catalog_item_id || null;

    // Si on a un session_id, récupérer les infos depuis Stripe
    if (session_id) {
      const stripe = getStripe();
      if (!stripe) {
        return NextResponse.json(
          { error: "Stripe non configuré" },
          { status: 500 }
        );
      }

      try {
        const session = await stripe.checkout.sessions.retrieve(session_id);
        console.log("[admin/grant-access-manually] Stripe session:", {
          id: session.id,
          payment_status: session.payment_status,
          customer_email: session.customer_email,
          metadata: session.metadata,
        });

        if (session.payment_status !== "paid") {
          return NextResponse.json(
            { error: "Le paiement n'est pas complété" },
            { status: 400 }
          );
        }

        const email = session.customer_email || session.customer_details?.email;
        if (email) {
          const { data: profile } = await supabase
            .from("profiles")
            .select("id, email")
            .eq("email", email)
            .maybeSingle();

          if (profile) {
            userId = profile.id;
          } else {
            return NextResponse.json(
              { error: `Utilisateur non trouvé pour l'email: ${email}` },
              { status: 404 }
            );
          }
        }

        // Récupérer catalog_item_id depuis les métadonnées
        const metadata = session.metadata;
        if (metadata?.catalog_item_id) {
          catalogItemId = metadata.catalog_item_id;
        } else if (metadata?.itemId) {
          catalogItemId = metadata.itemId;
        }
      } catch (stripeError: any) {
        console.error("[admin/grant-access-manually] Stripe error:", stripeError);
        return NextResponse.json(
          { error: "Erreur lors de la récupération de la session Stripe", details: stripeError.message },
          { status: 500 }
        );
      }
    }

    // Si on a un user_email mais pas de userId, chercher l'utilisateur
    if (user_email && !userId) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("id, email")
        .eq("email", user_email)
        .maybeSingle();

      if (profile) {
        userId = profile.id;
      } else {
        return NextResponse.json(
          { error: `Utilisateur non trouvé pour l'email: ${user_email}` },
          { status: 404 }
        );
      }
    }

    if (!userId) {
      return NextResponse.json(
        { error: "Impossible de déterminer l'utilisateur" },
        { status: 400 }
      );
    }

    if (!catalogItemId) {
      return NextResponse.json(
        { error: "Impossible de déterminer le catalog_item_id" },
        { status: 400 }
      );
    }

    // Vérifier que le catalog_item existe
    const { data: catalogItem } = await supabase
      .from("catalog_items")
      .select("id, title")
      .eq("id", catalogItemId)
      .maybeSingle();

    if (!catalogItem) {
      return NextResponse.json(
        { error: `Catalog item non trouvé: ${catalogItemId}` },
        { status: 404 }
      );
    }

    // Vérifier si l'accès existe déjà
    const { data: existingAccess } = await supabase
      .from("catalog_access")
      .select("id")
      .eq("user_id", userId)
      .eq("catalog_item_id", catalogItemId)
      .is("organization_id", null)
      .maybeSingle();

    let accessError = null;
    let accessData = null;

    if (existingAccess) {
      // Mettre à jour l'accès existant
      const { error: updateError, data: updateData } = await supabase
        .from("catalog_access")
        .update({
          access_status: "purchased",
          granted_at: new Date().toISOString(),
          purchase_date: new Date().toISOString(),
        })
        .eq("id", existingAccess.id)
        .select()
        .single();
      
      accessError = updateError;
      accessData = updateData;
    } else {
      // Créer un nouvel accès
      const { error: insertError, data: insertData } = await supabase
        .from("catalog_access")
        .insert({
          user_id: userId,
          catalog_item_id: catalogItemId,
          organization_id: null,
          access_status: "purchased",
          granted_at: new Date().toISOString(),
          purchase_date: new Date().toISOString(),
        })
        .select()
        .single();
      
      accessError = insertError;
      accessData = insertData;
    }

    if (accessError) {
      console.error("[admin/grant-access-manually] Error granting access:", accessError);
      return NextResponse.json(
        { error: "Erreur lors de l'octroi de l'accès", details: accessError.message },
        { status: 500 }
      );
    }

    console.log("[admin/grant-access-manually] ✅ Access granted:", {
      userId,
      catalogItemId,
      catalogItemTitle: catalogItem.title,
    });

    return NextResponse.json({
      success: true,
      message: "Accès accordé avec succès",
      data: {
        user_id: userId,
        catalog_item_id: catalogItemId,
        catalog_item_title: catalogItem.title,
        access_data: accessData,
      },
    });
  } catch (error: any) {
    console.error("[admin/grant-access-manually] Error:", error);
    return NextResponse.json(
      { error: "Erreur serveur", details: error.message },
      { status: 500 }
    );
  }
}

