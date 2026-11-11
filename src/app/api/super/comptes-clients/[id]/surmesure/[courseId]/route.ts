import { NextRequest, NextResponse } from "next/server";
import { isSuperAdmin } from "@/lib/auth/super-admin";
import { getServerClient, getServiceRoleClient } from "@/lib/supabase/server";
import { normalizeAiProgramStructure } from "@/lib/training-courses/normalize-ai-program";
import { SURMESURE_SELECT, splitLines } from "@/lib/training-courses/surmesure";

export const dynamic = "force-dynamic";

async function requireStaff() {
  const supabase = await getServerClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user || !(await isSuperAdmin())) return null;
  return getServiceRoleClient();
}

type Ctx = { params: Promise<{ id: string; courseId: string }> };

async function loadOwned(service: NonNullable<ReturnType<typeof getServiceRoleClient>>, orgId: string, courseId: string) {
  const { data, error } = await service
    .from("training_courses")
    .select(SURMESURE_SELECT)
    .eq("id", courseId)
    .eq("organization_id", orgId)
    .eq("source", "surmesure")
    .maybeSingle();
  return { data, error };
}

export async function GET(_request: NextRequest, context: Ctx) {
  const { id: orgId, courseId } = await context.params;
  const service = await requireStaff();
  if (!service) return NextResponse.json({ error: "Réservé au staff Byound" }, { status: 403 });

  const { data, error } = await loadOwned(service, orgId, courseId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ error: "Formation introuvable" }, { status: 404 });
  return NextResponse.json({ course: data });
}

export async function PATCH(request: NextRequest, context: Ctx) {
  const { id: orgId, courseId } = await context.params;
  const service = await requireStaff();
  if (!service) return NextResponse.json({ error: "Réservé au staff Byound" }, { status: 403 });

  const existing = await loadOwned(service, orgId, courseId);
  if (existing.error) return NextResponse.json({ error: existing.error.message }, { status: 500 });
  if (!existing.data) return NextResponse.json({ error: "Formation introuvable" }, { status: 404 });

  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };

  if (body.title != null) {
    const title = String(body.title).trim();
    if (!title) return NextResponse.json({ error: "Le titre est requis." }, { status: 400 });
    patch.title = title;
  }
  if (body.short_description !== undefined) patch.short_description = String(body.short_description ?? "").trim() || null;
  if (body.long_description !== undefined) patch.long_description = String(body.long_description ?? "").trim() || null;
  if (body.domain !== undefined) patch.domain = String(body.domain ?? "").trim() || null;
  if (body.duration !== undefined) patch.duration = String(body.duration ?? "").trim() || null;
  if (body.level !== undefined) patch.level = String(body.level ?? "").trim() || null;
  if (body.prerequisites !== undefined) patch.prerequisites = String(body.prerequisites ?? "").trim() || null;
  if (body.specific_needs !== undefined) patch.specific_needs = String(body.specific_needs ?? "").trim() || null;
  if (body.badge_name !== undefined) patch.badge_name = String(body.badge_name ?? "").trim() || null;
  if (body.is_active !== undefined) patch.is_active = Boolean(body.is_active);

  if (body.objectives !== undefined) {
    patch.objectives = Array.isArray(body.objectives)
      ? body.objectives.map(String).map((s) => s.trim()).filter(Boolean)
      : splitLines(String(body.objectives_text ?? body.objectives ?? ""));
  }
  if (body.audience !== undefined) {
    patch.audience = Array.isArray(body.audience)
      ? body.audience.map(String).map((s) => s.trim()).filter(Boolean)
      : splitLines(String(body.audience_text ?? body.audience ?? ""));
  }
  if (body.skills !== undefined) {
    patch.skills = Array.isArray(body.skills)
      ? body.skills.map(String).map((s) => s.trim()).filter(Boolean)
      : splitLines(String(body.skills_text ?? body.skills ?? ""));
  }
  if (body.formats !== undefined) {
    patch.formats = Array.isArray(body.formats)
      ? body.formats.map(String).map((s) => s.trim()).filter(Boolean)
      : splitLines(String(body.formats_text ?? body.formats ?? ""));
  }
  if (body.intra_price !== undefined) {
    patch.intra_price =
      body.intra_price != null && body.intra_price !== "" ? Number(body.intra_price) : null;
  }
  if (body.inter_price !== undefined) {
    patch.inter_price =
      body.inter_price != null && body.inter_price !== "" ? Number(body.inter_price) : null;
  }
  if (body.max_intra_participants !== undefined) {
    patch.max_intra_participants = Number(body.max_intra_participants) || 12;
  }
  if (body.program_structure !== undefined) {
    patch.program_structure = normalizeAiProgramStructure(body.program_structure);
  }

  const { data, error } = await service
    .from("training_courses")
    .update(patch)
    .eq("id", courseId)
    .eq("organization_id", orgId)
    .eq("source", "surmesure")
    .select(SURMESURE_SELECT)
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ course: data });
}

export async function DELETE(_request: NextRequest, context: Ctx) {
  const { id: orgId, courseId } = await context.params;
  const service = await requireStaff();
  if (!service) return NextResponse.json({ error: "Réservé au staff Byound" }, { status: 403 });

  const existing = await loadOwned(service, orgId, courseId);
  if (existing.error) return NextResponse.json({ error: existing.error.message }, { status: 500 });
  if (!existing.data) return NextResponse.json({ error: "Formation introuvable" }, { status: 404 });

  const { error } = await service
    .from("training_courses")
    .delete()
    .eq("id", courseId)
    .eq("organization_id", orgId)
    .eq("source", "surmesure");

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
