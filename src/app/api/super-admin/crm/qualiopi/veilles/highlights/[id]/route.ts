import { NextRequest, NextResponse } from "next/server";
import { isSuperAdmin } from "@/lib/auth/super-admin";
import { getServiceRoleClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function PATCH(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  if (!(await isSuperAdmin())) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }
  const supabase = getServiceRoleClient();
  if (!supabase) return NextResponse.json({ error: "Service indisponible" }, { status: 503 });

  const { id } = await context.params;
  const body = (await req.json().catch(() => ({}))) as {
    note?: string;
    status?: "saved" | "in_progress" | "done";
    theme?: string | null;
  };

  const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (typeof body.note === "string") patch.note = body.note.trim() || null;
  if (body.status === "saved" || body.status === "in_progress" || body.status === "done") {
    patch.status = body.status;
  }
  if ("theme" in body) {
    const { parseVeilleTheme } = await import("@/lib/qualiopi/veille-shared");
    patch.theme = parseVeilleTheme(body.theme) ?? "transversal";
  }

  const { data, error } = await supabase
    .from("crm_qualiopi_veille_highlights")
    .update(patch)
    .eq("id", id)
    .select("*")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ highlight: data });
}

export async function DELETE(_req: NextRequest, context: { params: Promise<{ id: string }> }) {
  if (!(await isSuperAdmin())) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }
  const supabase = getServiceRoleClient();
  if (!supabase) return NextResponse.json({ error: "Service indisponible" }, { status: 503 });

  const { id } = await context.params;
  const { error } = await supabase.from("crm_qualiopi_veille_highlights").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}
