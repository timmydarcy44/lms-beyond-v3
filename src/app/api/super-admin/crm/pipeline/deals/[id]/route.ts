import { NextRequest, NextResponse } from "next/server";
import { isSuperAdmin } from "@/lib/auth/super-admin";
import { applyCommercialFieldsFromBody } from "@/lib/crm/apply-commercial-deal-fields";
import { getServiceRoleClient } from "@/lib/supabase/server";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, ctx: Ctx) {
  if (!(await isSuperAdmin())) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }
  const { id } = await ctx.params;
  const supabase = getServiceRoleClient();
  if (!supabase) {
    return NextResponse.json({ error: "Service indisponible" }, { status: 503 });
  }
  const { data, error } = await supabase.from("crm_pipeline_deals").select("*").eq("id", id).maybeSingle();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  if (!data) return NextResponse.json({ error: "Deal introuvable" }, { status: 404 });
  return NextResponse.json({ deal: data });
}

export async function PATCH(req: NextRequest, ctx: Ctx) {
  if (!(await isSuperAdmin())) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }
  const { id } = await ctx.params;
  const supabase = getServiceRoleClient();
  if (!supabase) {
    return NextResponse.json({ error: "Service indisponible" }, { status: 503 });
  }

  const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };

  if (body?.pipeline_type != null) patch.pipeline_type = body.pipeline_type === "btoc" ? "btoc" : "btob";
  if (body?.stage_slug != null) patch.stage_slug = String(body.stage_slug).trim();
  if (body?.source != null) patch.source = String(body.source);
  if (body?.company_name != null) patch.company_name = String(body.company_name).trim();
  if (body?.contact_first_name != null) patch.contact_first_name = String(body.contact_first_name).trim();
  if (body?.contact_last_name !== undefined) {
    patch.contact_last_name = body.contact_last_name ? String(body.contact_last_name).trim() : null;
  }
  if (body?.contact_civility !== undefined) {
    patch.contact_civility = body.contact_civility ? String(body.contact_civility).trim() : null;
  }
  if (body?.company_creation_date !== undefined) {
    patch.company_creation_date = body.company_creation_date
      ? String(body.company_creation_date).trim()
      : null;
  }
  if (body?.email !== undefined) patch.email = body.email ? String(body.email).trim() : null;
  if (body?.phone !== undefined) patch.phone = body.phone ? String(body.phone).trim() : null;
  if (body?.notes !== undefined) patch.notes = body.notes ? String(body.notes).trim() : null;
  if (body?.sort_order != null) patch.sort_order = Number(body.sort_order);

  if (body?.amount_cents != null) {
    patch.amount_cents = Math.round(Number(body.amount_cents));
  } else if (body?.amount != null) {
    const parsed = Number.parseFloat(String(body.amount).replace(",", "."));
    if (Number.isFinite(parsed)) patch.amount_cents = Math.round(parsed * 100);
  }

  applyCommercialFieldsFromBody(patch, body, { partial: true });

  const { data, error } = await supabase
    .from("crm_pipeline_deals")
    .update(patch)
    .eq("id", id)
    .select("*")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  return NextResponse.json({ deal: data });
}

export async function DELETE(_req: NextRequest, ctx: Ctx) {
  if (!(await isSuperAdmin())) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }
  const { id } = await ctx.params;
  const supabase = getServiceRoleClient();
  if (!supabase) {
    return NextResponse.json({ error: "Service indisponible" }, { status: 503 });
  }

  const { error } = await supabase.from("crm_pipeline_deals").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}
