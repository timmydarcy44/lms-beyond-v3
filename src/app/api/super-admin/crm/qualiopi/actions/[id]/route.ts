import { NextRequest, NextResponse } from "next/server";
import { isSuperAdmin } from "@/lib/auth/super-admin";
import { getServiceRoleClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, ctx: Ctx) {
  if (!(await isSuperAdmin())) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }
  const supabase = getServiceRoleClient();
  if (!supabase) return NextResponse.json({ error: "Service indisponible" }, { status: 503 });

  const { id } = await ctx.params;
  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };

  if (typeof body.title === "string") patch.title = body.title.trim();
  if (typeof body.cause === "string") patch.cause = body.cause.trim() || null;
  if (typeof body.owner_name === "string") patch.owner_name = body.owner_name.trim() || null;
  if ("due_at" in body) patch.due_at = body.due_at ? String(body.due_at).slice(0, 10) : null;
  if (body.status === "todo" || body.status === "doing" || body.status === "done") {
    patch.status = body.status;
    if (body.status === "done") patch.reviewed_at = new Date().toISOString();
  }
  if (body.mark_reviewed === true) patch.reviewed_at = new Date().toISOString();

  const { data, error } = await supabase
    .from("crm_qualiopi_actions")
    .update(patch)
    .eq("id", id)
    .select("*")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ action: data });
}

export async function DELETE(_req: NextRequest, ctx: Ctx) {
  if (!(await isSuperAdmin())) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }
  const supabase = getServiceRoleClient();
  if (!supabase) return NextResponse.json({ error: "Service indisponible" }, { status: 503 });
  const { id } = await ctx.params;
  const { error } = await supabase.from("crm_qualiopi_actions").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}
