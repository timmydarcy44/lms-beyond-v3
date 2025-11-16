import { NextRequest, NextResponse } from "next/server";
import { isSuperAdmin } from "@/lib/auth/super-admin";
import { getServiceRoleClientOrFallback } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const hasAccess = await isSuperAdmin();
    if (!hasAccess) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const body = await request.json();
    const { organization_id, catalog_item_id, grant_reason } = body;

    if (!organization_id || !catalog_item_id) {
      return NextResponse.json(
        { error: "organization_id et catalog_item_id sont requis" },
        { status: 400 }
      );
    }

    const supabase = await getServiceRoleClientOrFallback();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 401 });
    }

    // UPSERT : créer ou mettre à jour l'accès
    const { data: access, error } = await supabase
      .from("catalog_access")
      .upsert(
        {
          organization_id,
          catalog_item_id,
          access_status: "manually_granted",
          granted_by: user.id,
          granted_at: new Date().toISOString(),
          grant_reason: grant_reason || "Accès accordé manuellement",
        },
        {
          onConflict: "organization_id,catalog_item_id",
        }
      )
      .select()
      .single();

    if (error) {
      console.error("[api/super-admin/catalogue/access/grant] Error:", error);
      return NextResponse.json(
        { error: error.message || "Erreur lors de l'octroi de l'accès" },
        { status: 500 }
      );
    }

    return NextResponse.json({ access });
  } catch (error) {
    console.error("[api/super-admin/catalogue/access/grant] Error:", error);
    return NextResponse.json(
      { error: "Erreur lors de l'octroi de l'accès" },
      { status: 500 }
    );
  }
}

