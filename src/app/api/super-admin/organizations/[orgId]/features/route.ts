import { NextRequest, NextResponse } from "next/server";
import { getServerClient } from "@/lib/supabase/server";
import { isSuperAdmin } from "@/lib/auth/super-admin";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ orgId: string }> }
) {
  const { orgId } = await params;
  
  const hasAccess = await isSuperAdmin();
  if (!hasAccess) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
  }

  const supabase = await getServerClient();
  if (!supabase) {
    return NextResponse.json({ error: "Supabase non configuré" }, { status: 500 });
  }

  try {
    console.log("[api/features] Fetching features for orgId:", orgId);
    
    // Récupérer toutes les fonctionnalités de l'organisation
    const { data: features, error } = await supabase
      .from("organization_features")
      .select("feature_key, is_enabled, expires_at")
      .eq("org_id", orgId);

    console.log("[api/features] Query result:", { 
      featuresCount: features?.length || 0, 
      error: error?.message 
    });

    if (error) {
      // Si la table n'existe pas, retourner un tableau vide au lieu d'erreur
      if (error.code === "42P01") {
        console.warn("[api/features] Table organization_features does not exist yet");
        return NextResponse.json([]);
      }
      throw error;
    }

    // Formater les fonctionnalités pour le frontend
    const formattedFeatures = (features || []).map((f: any) => ({
      key: f.feature_key,
      enabled: f.is_enabled,
      expiresAt: f.expires_at,
    }));

    console.log("[api/features] Returning formatted features:", formattedFeatures);
    return NextResponse.json(formattedFeatures);
  } catch (error: any) {
    console.error("[api/features] Error:", error);
    // Si la table n'existe pas, retourner un tableau vide
    if (error.code === "42P01") {
      return NextResponse.json([]);
    }
    return NextResponse.json(
      { error: error.message || "Erreur lors de la récupération des fonctionnalités" },
      { status: 500 }
    );
  }
}

