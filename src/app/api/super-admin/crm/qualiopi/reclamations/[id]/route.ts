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

  if (typeof body.subject === "string") patch.subject = body.subject.trim();
  if (typeof body.description === "string") patch.description = body.description.trim();
  if (typeof body.response === "string") patch.response = body.response.trim() || null;
  if (typeof body.requester_name === "string") patch.requester_name = body.requester_name.trim() || null;
  if (body.status === "open" || body.status === "in_progress" || body.status === "closed") {
    patch.status = body.status;
    if (body.status === "closed") patch.closed_at = new Date().toISOString();
  }
  if (body.ack === true) patch.ack_at = new Date().toISOString();
  if ("action_id" in body) patch.action_id = body.action_id ? String(body.action_id) : null;

  const { data, error } = await supabase
    .from("crm_qualiopi_reclamations")
    .update(patch)
    .eq("id", id)
    .select("*")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ reclamation: data });
}

export async function DELETE(_req: NextRequest, ctx: Ctx) {
  if (!(await isSuperAdmin())) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }
  const supabase = getServiceRoleClient();
  if (!supabase) return NextResponse.json({ error: "Service indisponible" }, { status: 503 });
  const { id } = await ctx.params;
  const { error } = await supabase.from("crm_qualiopi_reclamations").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}
