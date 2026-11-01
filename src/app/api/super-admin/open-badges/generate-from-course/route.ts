import { NextRequest, NextResponse } from "next/server";
import { isSuperAdmin } from "@/lib/auth/super-admin";
import { resolveValidatorId } from "@/lib/lms/resolve-validator";
import { getServiceRoleClient } from "@/lib/supabase/server";
import { courseFingerprint, extractCourseBrief } from "@/lib/openbadges/badge-catalog";
import {
  generatePlannedBadge,
  proposeBadgePlan,
  summarizeSections,
  type DemandLevel,
  type GenerationCallLog,
  type PlannedBadge,
  type SectionSummary,
} from "@/lib/openbadges/badge-course-generation";
import { buildCourseSource, quizPromptsFromRow } from "@/lib/openbadges/course-source";

export async function GET(request: NextRequest) {
  if (!(await isSuperAdmin())) return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  const supabase = getServiceRoleClient();
  if (!supabase) return NextResponse.json({ courses: [] });
  const q = request.nextUrl.searchParams.get("q")?.trim().toLowerCase() ?? "";
  const onlyId = request.nextUrl.searchParams.get("id")?.trim() ?? "";
  let query = supabase.from("courses").select("id, title, status, description, duration, updated_at, builder_snapshot").limit(200);
  if (onlyId) query = supabase.from("courses").select("id, title, status, description, duration, updated_at, builder_snapshot").eq("id", onlyId).limit(1);
  const { data, error } = await query;
  if (error) return NextResponse.json({ courses: [], error: error.message });
  const courses = (data ?? []).flatMap((row) => {
    const brief = extractCourseBrief(row as Record<string, unknown>);
    if (q && !brief.title.toLowerCase().includes(q)) return [];
    return [{
      id: String(row.id),
      title: brief.title || "Sans titre",
      moduleCount: brief.moduleCount,
      duration: brief.duration,
      published: brief.published,
      updatedAt: brief.updatedAt,
      fingerprint: courseFingerprint(brief.brief),
    }];
  });
  return NextResponse.json({ courses });
}

function demandOf(value: unknown): DemandLevel {
  if (value === "decouverte" || value === "expertise") return value;
  return "maitrise";
}

async function writeLogs(logs: GenerationCallLog[], courseId: string) {
  const supabase = getServiceRoleClient();
  if (!supabase || logs.length === 0) return;
  await supabase.from("ai_generation_logs").insert(logs.map((log) => ({
    context: "badge-from-course",
    prompt: log.pass,
    payload_in: { courseId, model: log.model, pass: log.pass },
    payload_out: {
      inputTokens: log.inputTokens,
      outputTokens: log.outputTokens,
      durationMs: log.durationMs,
      estimatedCostUsd: log.estimatedCostUsd,
      regenerations: log.regenerations,
      notes: log.notes,
    },
    status: "success",
  }))).then(() => undefined, () => undefined);
}

function normalize(value: string): string {
  return value.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase();
}

async function suggestExpert(domain: string): Promise<{ id: string; full_name: string } | null> {
  const supabase = getServiceRoleClient();
  if (!supabase || domain.trim().length < 3) return null;
  const { data } = await supabase.from("experts").select("id, first_name, last_name, email, headline, specialties, review_status, is_active");
  const expected = normalize(domain);
  const matches = (data ?? []).filter((row) => {
    if (row.review_status !== "approved" || row.is_active !== true) return false;
    const name = [row.first_name, row.last_name].filter(Boolean).join(" ").trim();
    if (/test|demo|jade|example\.com|famille|localhost|seed|formateur test/i.test(`${row.email ?? ""} ${name}`)) return false;
    const specialties = Array.isArray(row.specialties) ? row.specialties.map(String) : [];
    const haystack = normalize([String(row.headline ?? ""), ...specialties].join(" "));
    return haystack.includes(expected) || expected.split(/[^a-z0-9]+/).filter((token) => token.length > 4).some((token) => haystack.includes(token));
  });
  if (matches.length === 0) return null;
  const { data: badges } = await supabase.from("open_badges").select("evaluation_config").limit(400);
  const load = new Map<string, number>();
  for (const row of badges ?? []) {
    const config = row.evaluation_config && typeof row.evaluation_config === "object" ? row.evaluation_config as { validatorExpertId?: string } : {};
    const id = String(config.validatorExpertId ?? "");
    if (id) load.set(id, (load.get(id) ?? 0) + 1);
  }
  const ranked = [];
  for (const row of matches) {
    const name = [row.first_name, row.last_name].filter(Boolean).join(" ").trim() || "Expert";
    const id = await resolveValidatorId(supabase, String(row.id), name);
    if (id) ranked.push({ id, full_name: name, openCount: load.get(id) ?? 0 });
  }
  ranked.sort((left, right) => left.openCount - right.openCount);
  return ranked[0] ? { id: ranked[0].id, full_name: ranked[0].full_name } : null;
}

export async function POST(request: NextRequest) {
  if (!(await isSuperAdmin())) return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  const body = (await request.json().catch(() => null)) as {
    courseId?: string;
    library?: string[];
    domains?: string[];
    demand?: DemandLevel;
    phase?: "summaries" | "plan" | "badges";
    summaries?: SectionSummary[];
    badges?: PlannedBadge[];
    seriesName?: string;
    domain?: string;
  } | null;
  const courseId = body?.courseId?.trim();
  if (!courseId) return NextResponse.json({ error: "Formation requise", detail: "Aucune formation n'a été envoyée." }, { status: 400 });
  const supabase = getServiceRoleClient();
  if (!supabase) return NextResponse.json({ error: "Base indisponible", detail: "La base de données ne répond pas." }, { status: 500 });
  const { data, error } = await supabase
    .from("courses")
    .select("id, title, status, description, presentation, duration, updated_at, builder_snapshot")
    .eq("id", courseId)
    .maybeSingle();
  if (error) return NextResponse.json({ error: "Lecture de la formation impossible", detail: "Les colonnes de la formation n'ont pas pu être lues." }, { status: 500 });
  if (!data) return NextResponse.json({ error: "Formation introuvable", detail: "Cette formation n'existe plus." }, { status: 404 });
  const source = buildCourseSource(data as Record<string, unknown>);
  const brief = extractCourseBrief(data as Record<string, unknown>);
  const course = { id: courseId, title: source.title, updatedAt: brief.updatedAt, fingerprint: courseFingerprint(source.presentation), sectionCount: source.sections.length };
  const phase = body?.phase ?? "summaries";
  try {
    if (phase === "summaries") {
      const result = await summarizeSections(source);
      await writeLogs(result.logs, courseId);
      return NextResponse.json({ course, summaries: result.summaries, truncations: result.truncations, logs: result.logs, objectives: source.objectives, interviews: source.interviews.map((item) => item.sectionTitle) });
    }
    if (phase === "plan") {
      const result = await proposeBadgePlan({ source, summaries: body?.summaries ?? [], domains: body?.domains ?? [] });
      result.plan.truncations = [];
      await writeLogs([result.log], courseId);
      return NextResponse.json({ course, plan: result.plan, log: result.log });
    }
    const selected = Array.isArray(body?.badges) ? body.badges : [];
    if (selected.length === 0) return NextResponse.json({ error: "Aucun badge choisi", detail: "Cochez au moins un badge du découpage." }, { status: 400 });
    const quizRows = source.quizIds.length
      ? await supabase.from("tests").select("id, title, questions").in("id", source.quizIds)
      : { data: [] };
    const forbidden = (quizRows.data ?? []).flatMap((row) => quizPromptsFromRow(row as Record<string, unknown>));
    const logs: GenerationCallLog[] = [];
    const badges = [];
    const failures: Array<{ title: string; issues: string[] }> = [];
    for (const planned of selected) {
      const result = await generatePlannedBadge({
        source,
        summaries: body?.summaries ?? [],
        badge: planned,
        seriesName: body?.seriesName || source.title,
        domain: body?.domain || "",
        demand: demandOf(body?.demand),
        library: body?.library ?? [],
        forbiddenPrompts: forbidden,
      });
      logs.push(...result.logs);
      if (!result.badge) failures.push({ title: planned.title, issues: result.issues });
      else badges.push({ planned, badge: result.badge, issues: result.issues });
    }
    await writeLogs(logs, courseId);
    const expert = await suggestExpert(body?.domain || badges[0]?.badge.domain || "");
    const cost = logs.reduce((sum, log) => sum + log.estimatedCostUsd, 0);
    const durationMs = logs.reduce((sum, log) => sum + log.durationMs, 0);
    if (badges.length === 0) {
      return NextResponse.json({
        error: "La génération n'a pas abouti",
        detail: failures.map((item) => `${item.title} : ${item.issues.join(" ")}`).join(" · ") || "Le modèle n'a pas renvoyé de badge exploitable.",
        failures,
        logs,
        cost,
        durationMs,
      }, { status: 422 });
    }
    return NextResponse.json({ course, badges, failures, expert, logs, cost, durationMs, quizCount: forbidden.length, objectiveCount: source.objectives.length });
  } catch (failure) {
    const detail = failure instanceof Error ? failure.message : "Le modèle n'a pas répondu.";
    return NextResponse.json({ error: "La génération a échoué", detail }, { status: 502 });
  }
}
