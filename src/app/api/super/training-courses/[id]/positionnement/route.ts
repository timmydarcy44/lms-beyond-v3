import { NextRequest, NextResponse } from "next/server";
import { isSuperAdmin } from "@/lib/auth/super-admin";
import { getServiceRoleClient } from "@/lib/supabase/server";
import type { AssessmentQuestion } from "@/lib/formation-assessments/types";
import { resolveAssessmentTemplate } from "@/lib/formation-assessments/resolve-template";

type Ctx = { params: Promise<{ id: string }> };

function normalizeQuestions(raw: unknown): AssessmentQuestion[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((q, index) => {
      const row = (q && typeof q === "object" ? q : {}) as Record<string, unknown>;
      const typeRaw = String(row.type || "text");
      const type: AssessmentQuestion["type"] =
        typeRaw === "scale" ||
        typeRaw === "single" ||
        typeRaw === "text" ||
        typeRaw === "section" ||
        typeRaw === "nps" ||
        typeRaw === "multi"
          ? typeRaw
          : "text";
      const id = String(row.id || `q${index + 1}`).trim() || `q${index + 1}`;
      const prompt = String(row.prompt || "").trim();
      if (!prompt) return null;
      const question: AssessmentQuestion = { id, prompt, type };
      if (type === "scale" || type === "nps") {
        question.min = Number(row.min ?? (type === "nps" ? 0 : 1));
        question.max = Number(row.max ?? (type === "nps" ? 10 : 5));
        if (Array.isArray(row.labels) && row.labels.length >= 2) {
          question.labels = [String(row.labels[0]), String(row.labels[1])];
        }
      }
      if ((type === "single" || type === "multi") && Array.isArray(row.options)) {
        question.options = row.options.map(String).filter(Boolean);
      }
      if (type === "section" && row.sectionLabel) {
        question.sectionLabel = String(row.sectionLabel);
      }
      return question;
    })
    .filter(Boolean) as AssessmentQuestion[];
}

/** Gabarit positionnement de la formation (override) ou global. */
export async function GET(_req: NextRequest, ctx: Ctx) {
  if (!(await isSuperAdmin())) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }
  const service = getServiceRoleClient();
  if (!service) return NextResponse.json({ error: "Service indisponible" }, { status: 503 });

  const { id } = await ctx.params;
  const { data: course } = await service
    .from("training_courses")
    .select("id, title")
    .eq("id", id)
    .maybeSingle();
  if (!course) return NextResponse.json({ error: "Formation introuvable" }, { status: 404 });

  const resolved = await resolveAssessmentTemplate(service, {
    kind: "positionnement",
    trainingCourseId: id,
  });

  return NextResponse.json({
    course_id: id,
    course_title: course.title,
    has_course_template: resolved?.source === "course",
    template: resolved,
  });
}

/**
 * Crée / met à jour le test de positionnement spécifique à la formation.
 * Body: { title?, questions? } — si questions absentes, copie le global.
 */
export async function POST(req: NextRequest, ctx: Ctx) {
  if (!(await isSuperAdmin())) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }
  const service = getServiceRoleClient();
  if (!service) return NextResponse.json({ error: "Service indisponible" }, { status: 503 });

  const { id } = await ctx.params;
  const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;

  const { data: course } = await service
    .from("training_courses")
    .select("id, title, objectives, skills")
    .eq("id", id)
    .maybeSingle();
  if (!course) return NextResponse.json({ error: "Formation introuvable" }, { status: 404 });

  const globalTpl = await resolveAssessmentTemplate(service, { kind: "positionnement" });
  const fromBody = body?.questions != null ? normalizeQuestions(body.questions) : null;

  let questions = fromBody && fromBody.length ? fromBody : globalTpl?.questions ?? [];

  // Enrichit depuis objectifs catalogue si on part du global / vide
  if ((!fromBody || !fromBody.length) && Array.isArray(course.objectives) && course.objectives.length) {
    const objectiveQs: AssessmentQuestion[] = (course.objectives as string[])
      .slice(0, 4)
      .map((obj, i) => ({
        id: `obj${i + 1}`,
        prompt: `Sur l'objectif « ${String(obj).trim()} », où vous situez-vous ?`,
        type: "scale" as const,
        min: 1,
        max: 5,
        labels: ["Débutant", "Expert"] as [string, string],
      }));
    questions = [
      ...objectiveQs,
      ...(globalTpl?.questions ?? []).filter((q) => q.type === "text").slice(0, 2),
    ];
  }

  if (!questions.length) {
    return NextResponse.json(
      { error: "Aucune question — renseignez le gabarit global ou les objectifs." },
      { status: 400 },
    );
  }

  const title =
    String(body?.title || "").trim() ||
    `Positionnement — ${course.title || "Formation"}`;

  const { data: existing } = await service
    .from("formation_assessment_templates")
    .select("id")
    .eq("kind", "positionnement")
    .eq("training_course_id", id)
    .maybeSingle();

  const now = new Date().toISOString();
  if (existing?.id) {
    const { data, error } = await service
      .from("formation_assessment_templates")
      .update({ title, questions, updated_at: now })
      .eq("id", existing.id)
      .select("*")
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ ok: true, template: data, created: false });
  }

  const { data, error } = await service
    .from("formation_assessment_templates")
    .insert({
      kind: "positionnement",
      title,
      questions,
      training_course_id: id,
      updated_at: now,
    })
    .select("*")
    .single();

  if (error) {
    if (/training_course_id/i.test(error.message)) {
      return NextResponse.json(
        {
          error: "Migration positionnement par formation non appliquée.",
          code: "schema_missing",
        },
        { status: 503 },
      );
    }
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ ok: true, template: data, created: true });
}

/** Met à jour les questions du positionnement formation. */
export async function PATCH(req: NextRequest, ctx: Ctx) {
  if (!(await isSuperAdmin())) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }
  const service = getServiceRoleClient();
  if (!service) return NextResponse.json({ error: "Service indisponible" }, { status: 503 });

  const { id } = await ctx.params;
  const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  const questions = normalizeQuestions(body?.questions);
  if (!questions.length) {
    return NextResponse.json({ error: "Au moins une question requise" }, { status: 400 });
  }

  const { data: existing } = await service
    .from("formation_assessment_templates")
    .select("id")
    .eq("kind", "positionnement")
    .eq("training_course_id", id)
    .maybeSingle();

  if (!existing?.id) {
    return NextResponse.json(
      { error: "Créez d'abord le test via « Créer un test de positionnement »." },
      { status: 404 },
    );
  }

  const title = String(body?.title || "").trim();
  const patch: Record<string, unknown> = {
    questions,
    updated_at: new Date().toISOString(),
  };
  if (title) patch.title = title;

  const { data, error } = await service
    .from("formation_assessment_templates")
    .update(patch)
    .eq("id", existing.id)
    .select("*")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true, template: data });
}

export async function DELETE(_req: NextRequest, ctx: Ctx) {
  if (!(await isSuperAdmin())) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }
  const service = getServiceRoleClient();
  if (!service) return NextResponse.json({ error: "Service indisponible" }, { status: 503 });

  const { id } = await ctx.params;
  const { error } = await service
    .from("formation_assessment_templates")
    .delete()
    .eq("kind", "positionnement")
    .eq("training_course_id", id);

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}
