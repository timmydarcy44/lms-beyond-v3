import { NextRequest, NextResponse } from "next/server";
import { getServiceRoleClient } from "@/lib/supabase/server";
import { isSuperAdmin } from "@/lib/auth/super-admin";

export async function POST(request: NextRequest) {
  try {
    const hasAccess = await isSuperAdmin();
    if (!hasAccess) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { org_id, enable } = await request.json();

    if (!org_id || typeof enable !== "boolean") {
      return NextResponse.json(
        { error: "org_id and enable are required" },
        { status: 400 }
      );
    }

    const supabase = await getServiceRoleClient();

    if (!supabase) {
      return NextResponse.json({ error: "Supabase non configuré" }, { status: 500 });
    }

    // Vérifier si l'organisation existe
    const { data: org, error: orgError } = await supabase
      .from("organizations")
      .select("id")
      .eq("id", org_id)
      .single();

    if (orgError || !org) {
      return NextResponse.json(
        { error: "Organization not found" },
        { status: 404 }
      );
    }

    // Insérer ou mettre à jour la feature
    const { error: upsertError } = await supabase
      .from("organization_features")
      .upsert(
        {
          org_id,
          feature_key: "beyond_connect",
          is_enabled: enable,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: "org_id,feature_key",
        }
      );

    if (upsertError) {
      console.error("[toggle-beyond-connect] Error upserting feature:", upsertError);
      return NextResponse.json(
        { error: "Error updating feature" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: enable
        ? "Beyond Connect activé pour cette organisation"
        : "Beyond Connect désactivé pour cette organisation",
    });
  } catch (error) {
    console.error("[toggle-beyond-connect] Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

