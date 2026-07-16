import { NextRequest, NextResponse } from "next/server";
import { isSuperAdmin } from "@/lib/auth/super-admin";
import { getServiceRoleClient } from "@/lib/supabase/server";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, ctx: Ctx) {
  if (!(await isSuperAdmin())) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }

  const { id } = await ctx.params;
  const supabase = getServiceRoleClient();
  if (!supabase) return NextResponse.json({ error: "Service indisponible" }, { status: 503 });

  const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };

  if (body?.title != null) patch.title = String(body.title).trim();
  if (body?.description !== undefined) {
    patch.description = body.description ? String(body.description).trim() : null;
  }
  if (body?.stage_slug != null) patch.stage_slug = String(body.stage_slug).trim();
  if (body?.topic_slug != null) patch.topic_slug = String(body.topic_slug).trim();
  if (body?.owner_email !== undefined) {
    patch.owner_email = body.owner_email ? String(body.owner_email).trim() : null;
  }
  if (body?.sort_order != null) patch.sort_order = Number(body.sort_order);

  const { data, error } = await supabase
    .from("crm_projects")
    .update(patch)
    .eq("id", id)
    .select("*")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ project: data });
}

export async function DELETE(_req: NextRequest, ctx: Ctx) {
  if (!(await isSuperAdmin())) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }

  const { id } = await ctx.params;
  const supabase = getServiceRoleClient();
  if (!supabase) return NextResponse.json({ error: "Service indisponible" }, { status: 503 });

  const { error } = await supabase.from("crm_projects").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}
