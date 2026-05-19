import { NextResponse } from "next/server";
import { getOpenAIClient } from "@/lib/ai/openai-client";
import { getServerClient, getServiceRoleClientOrFallback } from "@/lib/supabase/server";
import { getCourseBuilderSnapshot } from "@/lib/queries/formateur";

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

function extractCourseText(snapshot: any): string {
  const sections = Array.isArray(snapshot?.sections) ? snapshot.sections : [];
  const lines: string[] = [];
  for (const s of sections) {
    if (s?.title) lines.push(`# ${String(s.title)}`);
    const chapters = Array.isArray(s?.chapters) ? s.chapters : [];
    for (const ch of chapters) {
      if (ch?.title) lines.push(`## ${String(ch.title)}`);
      if (ch?.content) lines.push(String(ch.content));
      const subs = Array.isArray(ch?.subchapters) ? ch.subchapters : [];
      for (const sub of subs) {
        if (sub?.title) lines.push(`### ${String(sub.title)}`);
        if (sub?.content) lines.push(String(sub.content));
      }
    }
  }
  return lines.join("\n").slice(0, 12000);
}

function findTriggerStep(snapshot: any, stepId: string): any | null {
  const steps = Array.isArray(snapshot?.steps) ? snapshot.steps : [];
  for (const s of steps) {
    if (String(s?.type ?? "") !== "trigger") continue;
    if (String(s?.id ?? "").trim() === stepId) return s;
  }
  return null;
}

export async function POST(request: Request) {
  try {
    const supabase = await getServerClient();
    if (!supabase) return NextResponse.json({ error: "Supabase non configuré" }, { status: 500 });

    const { data: auth } = await supabase.auth.getUser();
    const userId = auth?.user?.id ? String(auth.user.id) : null;
    if (!userId) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

    const body = await request.json().catch(() => null);
    const pathId = String(body?.pathId ?? "").trim();
    const stepId = String(body?.stepId ?? "").trim();
    const prevCourseId = String(body?.prevCourseId ?? "").trim() || null;
    const minScoreRaw = String(body?.minScore ?? "").trim();
    const minScore = Number(minScoreRaw);
    const threshold = Number.isFinite(minScore) ? Math.max(0, Math.min(100, Math.round(minScore))) : 75;
    const text = String(body?.text ?? "").trim();

    if (!pathId || !stepId || !isUuid(pathId) || !text) {
      return NextResponse.json({ error: "Paramètres manquants" }, { status: 400 });
    }

    const admin = await getServiceRoleClientOrFallback();
    if (!admin) return NextResponse.json({ error: "Service indisponible" }, { status: 500 });

    const snapRes = await admin.from("paths").select("path_snapshot").eq("id", pathId).maybeSingle();
    const snapshot = (snapRes as any)?.data?.path_snapshot;
    const stepRow = findTriggerStep(snapshot, stepId);
    if (!stepRow || String(stepRow.trigger_condition ?? "").trim() !== "case_study_submitted") {
      return NextResponse.json({ error: "Étape de parcours introuvable" }, { status: 404 });
    }

    const learnerContext = String(stepRow.trigger_case_context ?? "").trim();
    const learnerConsigne = String(stepRow.trigger_case_consigne ?? "").trim();
    const analysisPrompt = String(stepRow.trigger_case_prompt ?? "").trim();

    if (!analysisPrompt) {
      return NextResponse.json({ error: "Évaluation non configurée pour cette étape" }, { status: 400 });
    }

    const client = getOpenAIClient();
    if (!client) return NextResponse.json({ error: "OPENAI_API_KEY manquante" }, { status: 500 });

    let courseText = "";
    if (prevCourseId && isUuid(prevCourseId)) {
      const snap = await getCourseBuilderSnapshot(prevCourseId);
      courseText = snap ? extractCourseText(snap) : "";
    }

    const system = [
      "Tu es un évaluateur pédagogique bienveillant.",
      "Tu analyses la production écrite d'un apprenant pour une étude de cas.",
      "Tu reçois : contenu de formation (réf.), contexte et consigne montrés à l'apprenant, puis des critères d'évaluation rédigés par le formateur (confidentiels).",
      "Les critères d'évaluation priment pour la grille de notation.",
      "Tolère les reformulations et une structure différente.",
      "Retourne uniquement un JSON { score: number(0..100), feedback: string }.",
      "Réponds toujours en français.",
    ].join(" ");

    const userPayload = [
      `Seuil de validation: ${threshold}%.`,
      "",
      "SOURCE — CONTENU DE FORMATION (extrait):",
      courseText || "(non fourni)",
      "",
      "CONTEXTE MONTRÉ À L'APPRENANT:",
      learnerContext || "(non fourni)",
      "",
      "CONSIGNE MONTRÉE À L'APPRENANT:",
      learnerConsigne || "(non fourni)",
      "",
      "CRITÈRES D'ÉVALUATION (formateur, confidentiel):",
      analysisPrompt.slice(0, 8000),
      "",
      "RÉDIGÉ PAR L'APPRENANT:",
      text.slice(0, 12000),
    ].join("\n");

    const evalRes = await client.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: system },
        { role: "user", content: userPayload },
      ],
      temperature: 0.4,
      max_tokens: 350,
      response_format: { type: "json_object" },
    });

    const raw = evalRes.choices[0]?.message?.content || "{}";
    let parsed: { score?: number; feedback?: string } = {};
    try {
      parsed = JSON.parse(raw);
    } catch {
      parsed = {};
    }

    const score = typeof parsed.score === "number" && Number.isFinite(parsed.score) ? Math.round(parsed.score) : 0;
    const feedback = String(parsed.feedback ?? "").trim();
    const passed = score >= threshold;

    await supabase.from("path_trigger_submissions").insert({
      path_id: pathId,
      step_id: stepId,
      user_id: userId,
      type: "case_study",
      status: passed ? "passed" : "failed",
      score,
      feedback,
      text_submission: text.slice(0, 20000),
      mime_type: "text/plain",
    } as any);

    return NextResponse.json({ passed, score, feedback });
  } catch (error) {
    console.error("[api/path-triggers/submit-case-study] error", error);
    return NextResponse.json({ error: "Erreur d'analyse étude de cas" }, { status: 500 });
  }
}
