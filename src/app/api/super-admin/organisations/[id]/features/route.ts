import { NextRequest, NextResponse } from "next/server";
import { getServiceRoleClient } from "@/lib/supabase/server";
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

  const supabase = getServiceRoleClient();
  if (!supabase) {
    return NextResponse.json({ error: "Supabase non configuré" }, { status: 500 });
  }

  try {
    let features: Array<{ feature_key: string; is_enabled: boolean; expires_at?: string | null }> | null =
      null;

    const withExpires = await supabase
      .from("organization_features")
      .select("feature_key, is_enabled, expires_at")
      .eq("org_id", id);

    if (withExpires.error) {
      if (withExpires.error.code === "42P01") {
        return NextResponse.json([]);
      }
      // Colonne expires_at absente → retry minimal
      if (
        withExpires.error.code === "42703" ||
        /expires_at/i.test(withExpires.error.message)
      ) {
        const minimal = await supabase
          .from("organization_features")
          .select("feature_key, is_enabled")
          .eq("org_id", id);
        if (minimal.error) {
          if (minimal.error.code === "42P01") return NextResponse.json([]);
          throw minimal.error;
        }
        features = (minimal.data ?? []).map((f) => ({ ...f, expires_at: null }));
      } else {
        throw withExpires.error;
      }
    } else {
      features = withExpires.data ?? [];
    }

    const formattedFeatures = (features || []).map((f) => ({
      key: f.feature_key,
      enabled: f.is_enabled,
      expiresAt: f.expires_at ?? null,
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
