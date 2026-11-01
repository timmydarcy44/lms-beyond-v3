import { NextRequest, NextResponse } from "next/server";
import { isSuperAdmin } from "@/lib/auth/super-admin";
import { getOpenAIClient } from "@/lib/ai/openai-client";
import { buildCourseSource } from "@/lib/openbadges/course-source";
import { deduceCompetencies } from "@/lib/openbadges/badge-course-generation";
import { proposeEvaluationCriteria } from "@/lib/openbadges/criterion-proposal";
import { presentationIsShort, SHORT_PRESENTATION_MESSAGE, type WorkshopCriterion } from "@/lib/openbadges/criterion-workshop";
import { getServiceRoleClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  if (!(await isSuperAdmin())) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }
  const body = (await request.json().catch(() => null)) as {
    name?: string;
    description?: string;
    level?: number | null;
    mode?: string;
    courseId?: string;
    library?: string[];
    lockedCompetencies?: Array<{ name?: string; definition?: string }>;
    kept?: WorkshopCriterion[];
  } | null;
  const name = body?.name?.trim() ?? "";
  if (body?.mode === "definition") {
    if (!name) return NextResponse.json({ error: "Indiquez d'abord le nom du badge" }, { status: 400 });
    const openai = getOpenAIClient();
    if (!openai) return NextResponse.json({ error: "Suggestion indisponible" }, { status: 503 });
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      response_format: { type: "json_object" },
      max_tokens: 400,
      messages: [
        { role: "system", content: `Tu rédiges la définition d'une compétence Byound, en deux ou trois phrases. JSON strict : {"definition":"..."}` },
        { role: "user", content: `Compétence : ${name}\nContexte : ${body?.description ?? ""}` },
      ],
    });
    try {
      const parsed = JSON.parse(completion.choices[0]?.message?.content ?? "{}") as { definition?: string };
      return NextResponse.json({ definition: String(parsed.definition ?? "").trim() });
    } catch {
      return NextResponse.json({ error: "Suggestion illisible" }, { status: 502 });
    }
  }

  const description = body?.description?.trim() ?? "";
  const courseId = body?.courseId?.trim() ?? "";
  if (!courseId && presentationIsShort(description)) {
    return NextResponse.json({ short: true, message: SHORT_PRESENTATION_MESSAGE, criteria: [] });
  }
  if (!name && !courseId) return NextResponse.json({ error: "Indiquez d'abord le nom du badge" }, { status: 400 });

  let sourceText = `Nom : ${name}\nCe que le badge atteste :\n${description}`;
  let courseHours: number | null = null;
  let context: { sections?: Array<{ index: number; title: string }>; presentation?: string } = { presentation: description };
  if (courseId) {
    const supabase = getServiceRoleClient();
    if (!supabase) return NextResponse.json({ error: "Base indisponible" }, { status: 500 });
    const { data, error } = await supabase
      .from("courses")
      .select("id, title, status, description, presentation, duration, updated_at, builder_snapshot")
      .eq("id", courseId)
      .maybeSingle();
    if (error || !data) return NextResponse.json({ error: "Formation introuvable" }, { status: 404 });
    const source = buildCourseSource(data as Record<string, unknown>);
    const sections = source.sections.map((section) => {
      const text = section.text.length > 12000
        ? `${section.text.slice(0, 12000)}\n[Texte coupé pour cette section.]`
        : section.text;
      return text;
    });
    const interviews = source.interviews.map((item) => `[Entretien expérientiel] ${item.sectionTitle}\n${item.context}\n${item.objectives}`);
    sourceText = [
      `Formation : ${source.title}`,
      name ? `Badge : ${name}` : "",
      source.objectives.length ? `Objectifs pédagogiques :\n- ${source.objectives.join("\n- ")}` : "",
      interviews.join("\n\n"),
      sections.join("\n\n"),
    ].filter(Boolean).join("\n\n");
    context = { sections: source.sections.map((section) => ({ index: section.index, title: section.title })) };
    courseHours = source.totalHours;
  }

  const locked = Array.isArray(body?.kept)
    ? body.kept.filter((item) => item?.label && item?.expectedOutcome && item?.source)
    : [];
  const library = Array.isArray(body?.library) ? body.library.map((item) => String(item)) : [];
  const lockedCompetencies = Array.isArray(body?.lockedCompetencies)
    ? body.lockedCompetencies.flatMap((item) => {
      const skillName = String(item?.name ?? "").trim();
      const definition = String(item?.definition ?? "").trim();
      return skillName && definition ? [{ name: skillName, definition }] : [];
    })
    : [];
  try {
    const deduced = await deduceCompetencies({
      sourceText,
      library,
      hours: courseHours,
      badgeTitle: name,
      locked: lockedCompetencies,
    });
    const competencies = deduced.competencies;
    const instructed = competencies.length
      ? `Compétences déduites de la source. Chaque critère prouve l'une d'elles :\n${competencies.map((item) => `- ${item.name} : ${item.definition}`).join("\n")}\n\n${sourceText}`
      : sourceText;
    const result = await proposeEvaluationCriteria(instructed, locked, context);
    return NextResponse.json({
      competencies,
      criteria: result.kept.map((item) => ({
        label: item.label.charAt(0).toUpperCase() + item.label.slice(1),
        description: `Source : ${item.source}`,
        expectedOutcome: item.expectedOutcome,
        competencyName: item.competency,
        source: item.source,
      })),
      issues: result.issues,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Suggestion impossible";
    const status = message === "Suggestion indisponible" ? 503 : 502;
    return NextResponse.json({ error: status === 503 ? message : "Suggestion impossible", detail: message }, { status });
  }
}
