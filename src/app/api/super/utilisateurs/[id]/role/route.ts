import { NextRequest, NextResponse } from "next/server";
import { isSuperAdmin } from "@/lib/auth/super-admin";
import { getServiceRoleClientOrFallback } from "@/lib/supabase/server";

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
    const body = (await request.json().catch(() => null)) as { role?: string } | null;
    const role = body?.role?.trim();
    if (!role) {
      return NextResponse.json({ error: "Rôle invalide" }, { status: 400 });
    }

    const { error } = await supabase.from("profiles").update({ role }).eq("id", id);
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[api/super/utilisateurs/role] error:", error);
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 });
  }
}
