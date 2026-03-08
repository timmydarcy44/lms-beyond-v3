import { NextRequest, NextResponse } from "next/server";
import { isSuperAdmin } from "@/lib/auth/super-admin";
import { getServiceRoleClientOrFallback } from "@/lib/supabase/server";

const ACCESS_FIELDS = ["access_lms", "access_connect", "access_care", "access_pro"] as const;

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
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
    const { id } = await params;
    const body = (await request.json().catch(() => null)) as
      | { field?: string; value?: boolean }
      | null;
    const field = body?.field;
    const value = body?.value;

    if (!field || !ACCESS_FIELDS.includes(field as (typeof ACCESS_FIELDS)[number])) {
      return NextResponse.json({ error: "Champ invalide" }, { status: 400 });
    }

    const { error } = await supabase.from("profiles").update({ [field]: value }).eq("id", id);
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[api/super/utilisateurs/access] error:", error);
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 });
  }
}
