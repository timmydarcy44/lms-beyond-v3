import { NextRequest, NextResponse } from "next/server";
import { isSuperAdmin } from "@/lib/auth/super-admin";
import { getServiceRoleClient } from "@/lib/supabase/server";
import { draftFromValidated } from "@/lib/qualiopi/procedure-status";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, ctx: Ctx) {
  if (!(await isSuperAdmin())) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }
  const supabase = getServiceRoleClient();
  if (!supabase) return NextResponse.json({ error: "Service indisponible" }, { status: 503 });
  const { id } = await ctx.params;

  const { data, error } = await supabase
    .from("crm_qualiopi_procedures")
    .select("*, sections:crm_qualiopi_procedure_sections(*), versions:crm_qualiopi_procedure_versions(*)")
    .eq("id", id)
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  if (!data) return NextResponse.json({ error: "Introuvable" }, { status: 404 });

  const sections = Array.isArray(data.sections)
    ? [...data.sections].sort((a, b) => a.position - b.position)
    : [];
  const versions = Array.isArray(data.versions)
    ? [...data.versions].sort(
        (a, b) => new Date(b.validated_at).getTime() - new Date(a.validated_at).getTime(),
      )
    : [];

  return NextResponse.json({ procedure: { ...data, sections, versions } });
}

export async function PATCH(req: NextRequest, ctx: Ctx) {
  if (!(await isSuperAdmin())) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }
  const supabase = getServiceRoleClient();
  if (!supabase) return NextResponse.json({ error: "Service indisponible" }, { status: 503 });
  const { id } = await ctx.params;
  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;

  const { data: current, error: loadErr } = await supabase
    .from("crm_qualiopi_procedures")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (loadErr || !current) {
    return NextResponse.json({ error: loadErr?.message || "Introuvable" }, { status: 404 });
  }

  const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (typeof body.title === "string" && body.title.trim()) patch.title = body.title.trim();
  if (typeof body.owner_name === "string") patch.owner_name = body.owner_name.trim() || null;
  if (Array.isArray(body.indicators)) {
    patch.indicators = body.indicators.map((n) => Number(n)).filter((n) => Number.isFinite(n));
  }
  if (typeof body.legal_obligation === "boolean") patch.legal_obligation = body.legal_obligation;
  if (body.next_review_at === null || typeof body.next_review_at === "string") {
    patch.next_review_at = body.next_review_at || null;
  }
  if (body.effective_date === null || typeof body.effective_date === "string") {
    patch.effective_date = body.effective_date || null;
  }
  if (Array.isArray(body.audiences)) {
    patch.audiences = body.audiences.map((a) => String(a));
  }
  if (body.archive === true) {
    patch.status = "archived";
  }

  // Éditer une validée → nouveau brouillon sans toucher la version figée
  if (current.status === "validated" && body.edit_validated === true) {
    patch.status = "draft";
    patch.current_version = draftFromValidated(current.current_version);
  }

  const { data, error } = await supabase
    .from("crm_qualiopi_procedures")
    .update(patch)
    .eq("id", id)
    .select("*")
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ procedure: data });
}
