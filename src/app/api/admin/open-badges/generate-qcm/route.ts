import { NextResponse } from "next/server";
import { isSuperAdmin } from "@/lib/auth/super-admin";
import { getOpenAIClient } from "@/lib/ai/openai-client";
import {
  createEmptyQcmQuestion,
  type QcmQuestion,
} from "@/lib/openbadges/badge-method-config";

type GeneratedRow = {
  question?: string;
  options?: string[];
  correct?: number;
  correctIndexes?: number[];
  type?: string;
};

function mapToQcmQuestions(rows: GeneratedRow[]): QcmQuestion[] {
  return rows.map((row) => {
    const rawType = String(row.type ?? "single").toLowerCase();
    const questionType =
      rawType === "multiple" || rawType === "text" || rawType === "single" ? rawType : "single";

    if (questionType === "text") {
      return {
        id: crypto.randomUUID(),
        prompt: String(row.question ?? "").trim(),
        questionType: "text",
        choices: [],
      };
    }

    const options = Array.isArray(row.options) ? row.options.filter(Boolean) : [];
    const correctIndexes = Array.isArray(row.correctIndexes)
      ? row.correctIndexes
      : typeof row.correct === "number"
        ? [row.correct]
        : [0];

    const choices =
      options.length >= 2
        ? options.map((label, i) => ({
            id: crypto.randomUUID(),
            label: String(label),
            isCorrect: correctIndexes.includes(i),
          }))
        : createEmptyQcmQuestion().choices;

    return {
      id: crypto.randomUUID(),
      prompt: String(row.question ?? "").trim(),
      questionType: questionType === "multiple" ? "multiple" : "single",
      choices,
    };
  });
}

export async function POST(request: Request) {
  if (!(await isSuperAdmin())) {
    return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
  }

  const body = (await request.json().catch(() => null)) as {
    evaluationPrompt?: string;
    questionCount?: number;
    badgeTitle?: string;
    level?: number | null;
    quizTitle?: string;
    quizLevel?: number | null;
  } | null;

  const evaluationPrompt = body?.evaluationPrompt?.trim() ?? "";
  const questionCount = Math.min(20, Math.max(1, Number(body?.questionCount) || 5));
  const badgeTitle = body?.badgeTitle?.trim() ?? body?.quizTitle?.trim() ?? "";
  const level = body?.quizLevel ?? body?.level ?? null;

  if (!evaluationPrompt) {
    return NextResponse.json(
      { ok: false, error: "PROMPT_REQUIRED", message: "Directive de génération requise." },
      { status: 400 },
    );
  }

  const openai = getOpenAIClient();
  if (!openai) {
    return NextResponse.json(
      { ok: false, error: "OPENAI_NOT_CONFIGURED" },
      { status: 503 },
    );
  }

  const levelLabel =
    typeof level === "number" && level >= 1 && level <= 5 ? `niveau ${level}/5` : "niveau intermédiaire";

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      max_tokens: 4000,
      temperature: 0.5,
      messages: [
        {
          role: "system",
          content: `Tu es expert en ingénierie pédagogique pour badges Open Badges.
Génère exactement ${questionCount} questions d'évaluation (${levelLabel}).
Types possibles par question :
- "single" : choix unique (4 options, un seul correct via correct: index 0-3)
- "multiple" : choix multiples (4 options, correctIndexes: tableau d'index)
- "text" : réponse libre (pas d'options, type text uniquement)
Mélange les types de façon pédagogique.
Réponds UNIQUEMENT avec ce JSON :
{"questions":[{"type":"single","question":"string","options":["A","B","C","D"],"correct":0},{"type":"multiple","question":"string","options":["A","B","C","D"],"correctIndexes":[0,2]},{"type":"text","question":"string"}]}`,
        },
        {
          role: "user",
          content: JSON.stringify({
            badge_title: badgeTitle,
            level: levelLabel,
            directive: evaluationPrompt,
          }),
        },
      ],
    });

    const rawText = response.choices[0]?.message?.content ?? "";
    const cleaned = rawText.replace(/```json/gi, "").replace(/```/g, "").trim();
    const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return NextResponse.json(
        { ok: false, error: "PARSE_FAILED", message: "Réponse IA illisible." },
        { status: 500 },
      );
    }

    const parsed = JSON.parse(jsonMatch[0]) as { questions?: GeneratedRow[] };
    const rows = Array.isArray(parsed.questions) ? parsed.questions : [];
    if (rows.length === 0) {
      return NextResponse.json(
        { ok: false, error: "EMPTY_RESULT", message: "Aucune question générée." },
        { status: 500 },
      );
    }

    const questions = mapToQcmQuestions(rows.slice(0, questionCount));
    return NextResponse.json({ ok: true, questions });
  } catch (error) {
    console.error("[generate-qcm]", error);
    return NextResponse.json(
      {
        ok: false,
        error: "GENERATION_FAILED",
        message: error instanceof Error ? error.message : "Erreur génération",
      },
      { status: 500 },
    );
  }
}
