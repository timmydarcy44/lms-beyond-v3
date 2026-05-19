import { NextRequest, NextResponse } from "next/server";
import { getServerClient } from "@/lib/supabase/server";
import { isSuperAdmin } from "@/lib/auth/super-admin";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  const hasAccess = await isSuperAdmin();
  if (!hasAccess) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
  }

  const supabase = await getServerClient();
  if (!supabase) {
    return NextResponse.json({ error: "Supabase non configuré" }, { status: 500 });
  }

  try {
    const { data: features, error } = await supabase
      .from("organization_features")
      .select("feature_key, is_enabled, expires_at")
      .eq("org_id", id);

    if (error) {
      if (error.code === "42P01") {
        return NextResponse.json([]);
      }
      throw error;
    }

    const formattedFeatures = (features || []).map((f: any) => ({
      key: f.feature_key,
      enabled: f.is_enabled,
      expiresAt: f.expires_at,
    }));

    return NextResponse.json(formattedFeatures);
  } catch (error: any) {
    if (error.code === "42P01") {
      return NextResponse.json([]);
    }
    return NextResponse.json(
      { error: error.message || "Erreur lors de la récupération des fonctionnalités" },
      { status: 500 },
    );
  }
}

