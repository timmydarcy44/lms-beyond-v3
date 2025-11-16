import { NextRequest, NextResponse } from "next/server";
import { isSuperAdmin } from "@/lib/auth/super-admin";
import { getServiceRoleClient } from "@/lib/supabase/server";

/**
 * Route pour récupérer l'historique des interactions IA
 */
export async function GET(request: NextRequest) {
  try {
    const hasAccess = await isSuperAdmin();
    if (!hasAccess) {
      return NextResponse.json({ error: "Accès non autorisé" }, { status: 403 });
    }

    const supabase = getServiceRoleClient();
    if (!supabase) {
      return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
    }

    const { searchParams } = new URL(request.url);
    const featureId = searchParams.get("featureId");
    const limit = parseInt(searchParams.get("limit") || "50");

    let query = supabase
      .from("ai_interactions")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit);

    if (featureId) {
      query = query.eq("feature_id", featureId);
    }

    const { data, error } = await query;

    if (error) {
      console.error("[super-admin/ai/interactions] Error fetching interactions:", error);
      return NextResponse.json({ error: "Erreur lors de la récupération" }, { status: 500 });
    }

    return NextResponse.json({ success: true, interactions: data || [] });
  } catch (error) {
    console.error("[super-admin/ai/interactions] Error:", error);
    return NextResponse.json({ error: "Une erreur est survenue" }, { status: 500 });
  }
}



