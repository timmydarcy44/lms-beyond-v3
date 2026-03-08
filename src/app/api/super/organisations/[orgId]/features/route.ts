import { NextRequest, NextResponse } from "next/server";
import { isSuperAdmin } from "@/lib/auth/super-admin";
import { getServiceRoleClientOrFallback } from "@/lib/supabase/server";

const FEATURE_TO_ACCESS_FIELD: Record<string, string> = {
  beyond_lms: "access_lms",
  beyond_connect: "access_connect",
  beyond_care: "access_care",
};

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ orgId: string }> }
) {
  const isAdmin = await isSuperAdmin();
  if (!isAdmin) {
    return NextResponse.json({ error: "Accès non autorisé" }, { status: 403 });
  }

  const supabase = await getServiceRoleClientOrFallback();
  if (!supabase) {
    return NextResponse.json({ error: "Service indisponible" }, { status: 503 });
  }

  try {
    const { orgId } = await params;
    const body = (await request.json().catch(() => null)) as
      | { feature_key?: string; is_enabled?: boolean }
      | null;
    const featureKey = body?.feature_key;
    const isEnabled = body?.is_enabled;

    if (!featureKey || typeof isEnabled !== "boolean") {
      return NextResponse.json({ error: "Payload invalide" }, { status: 400 });
    }

    const { error: upsertError } = await supabase
      .from("organization_features")
      .upsert({ org_id: orgId, feature_key: featureKey, is_enabled: isEnabled }, { onConflict: "org_id,feature_key" });
    if (upsertError) {
      return NextResponse.json({ error: upsertError.message }, { status: 500 });
    }

    const accessField = FEATURE_TO_ACCESS_FIELD[featureKey];
    if (accessField) {
      const { data: memberships, error: membershipsError } = await supabase
        .from("org_memberships")
        .select("user_id")
        .eq("org_id", orgId);
      if (membershipsError) {
        return NextResponse.json({ error: membershipsError.message }, { status: 500 });
      }
      const userIds = (memberships || []).map((row) => row.user_id);
      if (userIds.length > 0) {
        const { error: updateError } = await supabase
          .from("profiles")
          .update({ [accessField]: isEnabled })
          .in("id", userIds);
        if (updateError) {
          return NextResponse.json({ error: updateError.message }, { status: 500 });
        }
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[api/super/organisations/features] error:", error);
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 });
  }
}
