import { NextRequest, NextResponse } from "next/server";
import { getServiceRoleClient } from "@/lib/supabase/server";
import { assertJessicaAdmin } from "@/lib/jessica-contentin/assert-jessica-admin";

type RouteContext = { params: Promise<{ id: string }> };

export async function DELETE(_req: NextRequest, context: RouteContext) {
  const user = await assertJessicaAdmin();
  if (!user) return NextResponse.json({ error: "Accès refusé" }, { status: 403 });

  const { id } = await context.params;
  if (!id?.trim()) {
    return NextResponse.json({ error: "Identifiant manquant" }, { status: 400 });
  }

  const supabase = getServiceRoleClient();
  if (!supabase) return NextResponse.json({ error: "Service indisponible" }, { status: 503 });

  const { error } = await supabase.from("jessica_invoices").delete().eq("id", id);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
