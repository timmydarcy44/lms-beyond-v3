import { NextRequest, NextResponse } from "next/server";
import { getServerClient } from "@/lib/supabase/server";
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

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get("session_id");

    if (!sessionId) {
      return NextResponse.json(
        { error: "session_id requis" },
        { status: 400 }
      );
    }

    const stripe = getStripe();
    if (!stripe) {
      return NextResponse.json(
        { error: "Stripe non configuré" },
        { status: 500 }
      );
    }

    // Récupérer la session Stripe
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (!session) {
      return NextResponse.json(
        { error: "Session non trouvée" },
        { status: 404 }
      );
    }

    // Récupérer le catalog_item_id depuis les métadonnées
    const metadata = session.metadata || {};
    const catalogItemId = metadata.catalog_item_id || metadata.itemId;

    if (!catalogItemId) {
      return NextResponse.json(
        { error: "Aucun catalog_item_id dans les métadonnées" },
        { status: 404 }
      );
    }

    // Récupérer les détails de l'item pour construire l'URL
    const supabase = await getServerClient();
    if (!supabase) {
      return NextResponse.json(
        { error: "Supabase non configuré" },
        { status: 500 }
      );
    }

    const { data: catalogItem } = await supabase
      .from("catalog_items")
      .select("id, title, item_type, content_id")
      .eq("id", catalogItemId)
      .maybeSingle();

    if (!catalogItem) {
      return NextResponse.json(
        { error: "Item de catalogue non trouvé" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      catalogItemId: catalogItem.id,
      itemType: catalogItem.item_type,
      contentId: catalogItem.content_id,
      title: catalogItem.title,
    });
  } catch (error) {
    console.error("[stripe/get-session-item] Error:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération de la session" },
      { status: 500 }
    );
  }
}

