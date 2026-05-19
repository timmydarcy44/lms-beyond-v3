import { NextRequest, NextResponse } from "next/server";

import { getOpenAIClient } from "@/lib/ai/openai-client";
import { getSession } from "@/lib/auth/session";

type RevisionItem = { id: string; title: string; kind?: string };

type DiagnosticQuestion = {
  id: string;
  question: string;
  options: { id: string; label: string }[];
  correctOptionId: string;
  lessonId: string;
  topic: string;
};

function parseJsonBlock<T>(raw: string): T | null {
  const trimmed = raw.trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = (fenced?.[1] ?? trimmed).trim();
  try {
    return JSON.parse(candidate) as T;
  } catch {
    return null;
  }
}

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session?.id) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const openai = getOpenAIClient();
  if (!openai) {
    return NextResponse.json({ error: "OpenAI non configuré" }, { status: 503 });
  }

  try {
    const body = (await request.json()) as {
      action?: "generate" | "analyze";
      contextText?: string;
      chapterTitle?: string;
      revisionItems?: RevisionItem[];
      questions?: DiagnosticQuestion[];
      answers?: Record<string, string>;
    };

    const contextText = String(body.contextText ?? "").trim().slice(0, 12_000);
    const chapterTitle = String(body.chapterTitle ?? "Chapitre").trim();
    const revisionItems = Array.isArray(body.revisionItems) ? body.revisionItems.slice(0, 24) : [];

    if (!contextText || contextText.length < 40) {
      return NextResponse.json({ error: "Contexte du chapitre insuffisant" }, { status: 400 });
    }

    if (body.action === "generate") {
      const outline = revisionItems
        .map((item) => `- ${item.id} | ${item.kind ?? "lesson"} | ${item.title}`)
        .join("\n");

      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        temperature: 0.4,
        max_tokens: 1800,
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content: `Tu génères un mini-test de révision (3 à 5 questions QCM) en français pour orienter un apprenant.
Réponds UNIQUEMENT en JSON : { "questions": [ { "id": "q1", "question": "...", "options": [{"id":"a","label":"..."}, ...], "correctOptionId": "a", "lessonId": "id-leçon", "topic": "sujet court" } ] }
Règles :
- Chaque question a exactement 4 options (ids a,b,c,d).
- lessonId doit être l'un des ids fournis dans la liste des leçons.
- Questions courtes, centrées sur les notions clés du chapitre.
- Pas de markdown dans les textes.`,
          },
          {
            role: "user",
            content: `Chapitre : ${chapterTitle}

Contenu :
${contextText}

Leçons disponibles pour orientation :
${outline || "(aucune liste — utilise des topics génériques et lessonId vide)"}`,
          },
        ],
      });

      const parsed = parseJsonBlock<{ questions?: DiagnosticQuestion[] }>(
        String(completion.choices[0]?.message?.content ?? ""),
      );
      const questions = (parsed?.questions ?? [])
        .filter((q) => q?.question && Array.isArray(q.options) && q.options.length >= 2)
        .slice(0, 5)
        .map((q, i) => ({
          id: String(q.id ?? `q${i + 1}`),
          question: String(q.question).slice(0, 500),
          options: q.options.slice(0, 4).map((o, j) => ({
            id: String(o.id ?? String.fromCharCode(97 + j)),
            label: String(o.label ?? "").slice(0, 280),
          })),
          correctOptionId: String(q.correctOptionId ?? q.options[0]?.id ?? "a"),
          lessonId: String(q.lessonId ?? revisionItems[0]?.id ?? ""),
          topic: String(q.topic ?? "").slice(0, 120),
        }));

      if (questions.length === 0) {
        return NextResponse.json({ error: "Impossible de générer le test" }, { status: 502 });
      }

      return NextResponse.json({ questions });
    }

    if (body.action === "analyze") {
      const questions = Array.isArray(body.questions) ? body.questions : [];
      const answers = body.answers ?? {};
      const wrongTopics: { lessonId: string; topic: string; question: string }[] = [];

      for (const q of questions) {
        const picked = String(answers[q.id] ?? "");
        if (picked && picked !== q.correctOptionId) {
          wrongTopics.push({
            lessonId: q.lessonId,
            topic: q.topic,
            question: q.question,
          });
        }
      }

      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        temperature: 0.5,
        max_tokens: 900,
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content: `Tu rédiges un court bilan de révision en français (2-3 phrases) et des recommandations.
JSON : { "summary": "...", "recommendedLessonIds": ["id1", "id2"] }
recommendedLessonIds : sous-ensemble des ids fournis, prioriser les lacunes.`,
          },
          {
            role: "user",
            content: `Chapitre : ${chapterTitle}
Leçons : ${revisionItems.map((r) => r.id + " — " + r.title).join("\n")}
Erreurs : ${wrongTopics.length ? JSON.stringify(wrongTopics) : "Aucune erreur — bon niveau global."}`,
          },
        ],
      });

      const parsed = parseJsonBlock<{ summary?: string; recommendedLessonIds?: string[] }>(
        String(completion.choices[0]?.message?.content ?? ""),
      );

      const validIds = new Set(revisionItems.map((r) => r.id));
      let recommendedLessonIds = (parsed?.recommendedLessonIds ?? [])
        .map(String)
        .filter((id) => validIds.has(id));

      if (recommendedLessonIds.length === 0 && wrongTopics.length > 0) {
        recommendedLessonIds = [
          ...new Set(wrongTopics.map((w) => w.lessonId).filter((id) => validIds.has(id))),
        ];
      }

      return NextResponse.json({
        summary:
          String(parsed?.summary ?? "").trim() ||
          (wrongTopics.length
            ? "Certaines notions méritent une relecture ciblée avant l'entretien."
            : "Vous semblez bien maîtriser les points clés — vous pouvez lancer l'entretien quand vous voulez."),
        recommendedLessonIds,
        wrongCount: wrongTopics.length,
        totalCount: questions.length,
      });
    }

    return NextResponse.json({ error: "Action invalide" }, { status: 400 });
  } catch (e) {
    console.error("[revision-diagnostic]", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Erreur serveur" },
      { status: 500 },
    );
  }
}
