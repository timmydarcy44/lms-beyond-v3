import { NextRequest, NextResponse } from "next/server";
import { isSuperAdmin } from "@/lib/auth/super-admin";
import { getServerClient, getServiceRoleClient } from "@/lib/supabase/server";
import { normalizeAiProgramStructure } from "@/lib/training-courses/normalize-ai-program";
import {
  SURMESURE_SELECT,
  slugifySurMesure,
  splitLines,
} from "@/lib/training-courses/surmesure";

export const dynamic = "force-dynamic";

async function requireStaff() {
  const supabase = await getServerClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user || !(await isSuperAdmin())) return null;
  return getServiceRoleClient();
}

export async function GET(_request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id: orgId } = await context.params;
  const service = await requireStaff();
  if (!service) return NextResponse.json({ error: "Réservé au staff Byound" }, { status: 403 });

  const { data, error } = await service
    .from("training_courses")
    .select(SURMESURE_SELECT)
    .eq("organization_id", orgId)
    .eq("source", "surmesure")
    .order("updated_at", { ascending: false });

  if (error) {
    if (/organization_id|specific_needs|source/i.test(error.message)) {
      return NextResponse.json(
        {
          courses: [],
          error:
            "Migration Sur-mesure non appliquée (organization_id / source). Appliquez supabase/migrations/20261111180000_training_courses_surmesure.sql",
        },
        { status: 200 },
      );
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ courses: data ?? [] });
}

export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id: orgId } = await context.params;
  const service = await requireStaff();
  if (!service) return NextResponse.json({ error: "Réservé au staff Byound" }, { status: 403 });

  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const title = String(body.title ?? "").trim();
  if (!title) {
    return NextResponse.json({ error: "Le titre est requis." }, { status: 400 });
  }

  const objectives = Array.isArray(body.objectives)
    ? body.objectives.map(String).map((s) => s.trim()).filter(Boolean)
    : splitLines(String(body.objectives_text ?? ""));
  const audience = Array.isArray(body.audience)
    ? body.audience.map(String).map((s) => s.trim()).filter(Boolean)
    : splitLines(String(body.audience_text ?? ""));
  const skills = Array.isArray(body.skills)
    ? body.skills.map(String).map((s) => s.trim()).filter(Boolean)
    : splitLines(String(body.skills_text ?? ""));
  const formats = Array.isArray(body.formats)
    ? body.formats.map(String).map((s) => s.trim()).filter(Boolean)
    : splitLines(String(body.formats_text ?? "Sur mesure"));

  const program_structure = body.program_structure
    ? normalizeAiProgramStructure(body.program_structure)
    : [];

  const payload = {
    slug: slugifySurMesure(title, orgId),
    title,
    short_description: String(body.short_description ?? "").trim() || null,
    long_description: String(body.long_description ?? "").trim() || null,
    domain: String(body.domain ?? "").trim() || null,
    duration: String(body.duration ?? "").trim() || null,
    level: String(body.level ?? "").trim() || null,
    formats: formats.length ? formats : ["Sur mesure"],
    objectives,
    skills,
    prerequisites: String(body.prerequisites ?? "").trim() || null,
    audience,
    specific_needs: String(body.specific_needs ?? "").trim() || null,
    intra_price:
      body.intra_price != null && body.intra_price !== ""
        ? Number(body.intra_price)
        : null,
    inter_price:
      body.inter_price != null && body.inter_price !== ""
        ? Number(body.inter_price)
        : null,
    max_intra_participants: Number(body.max_intra_participants) || 12,
    badge_name: String(body.badge_name ?? "").trim() || null,
    program_structure,
    instructors: [],
    sessions: [],
    organization_id: orgId,
    source: "surmesure",
    is_active: true,
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await service
    .from("training_courses")
    .insert(payload)
    .select(SURMESURE_SELECT)
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ course: data });
}
