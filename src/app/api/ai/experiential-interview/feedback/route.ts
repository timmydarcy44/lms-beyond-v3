import { NextRequest, NextResponse } from "next/server";

import { getOpenAIClient } from "@/lib/ai/openai-client";
import { getSession } from "@/lib/auth/session";

type ChatMessage = { role: "user" | "assistant"; content: string };

export type InterviewFeedbackPayload = {
  summary: string;
  bien_dit: string[];
  a_revoir: string[];
  compris: string[];
  pas_compris: string[];
  axes_amelioration: string[];
};

const SYSTEM_PROMPT = `Tu es un tuteur pédagogique en français. Tu analyses un entretien expérientiel entre un apprenant et un assistant.

Règles :
- Pas de note, pas de score, pas de mention de réussite/échec chiffrée.
- Ton bienveillant, factuel, orienté progression.
- Réponds UNIQUEMENT en JSON valide (sans markdown) avec cette structure exacte :
{
  "summary": "2 phrases de synthèse globale",
  "bien_dit": ["point fort 1", "point fort 2"],
  "a_revoir": ["formulation ou idée à clarifier"],
  "compris": ["notion bien intégrée"],
  "pas_compris": ["notion encore floue ou absente"],
  "axes_amelioration": ["axe concret 1", "axe concret 2", "axe concret 3"]
}
- Chaque tableau : 2 à 4 éléments courts (phrases courtes).
- Base-toi uniquement sur l'échange et le contexte du chapitre.`;

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session?.id) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  try {
    const body = (await request.json()) as {
      messages?: ChatMessage[];
      contextText?: string;
      interviewObjectives?: string;
      chapterTitle?: string;
      courseTitle?: string;
    };

    const messages = Array.isArray(body.messages) ? body.messages : [];
    const userTurns = messages.filter((m) => m.role === "user" && String(m.content ?? "").trim());
    if (userTurns.length < 1) {
      return NextResponse.json(
        { error: "Échange trop court pour générer un feedback" },
        { status: 400 },
      );
    }

    const contextText = String(body.contextText ?? "").trim().slice(0, 10_000);
    const interviewObjectives = String(body.interviewObjectives ?? "").trim().slice(0, 2000);
    const chapterTitle = String(body.chapterTitle ?? "Chapitre").trim();
    const courseTitle = String(body.courseTitle ?? "").trim();

    const transcript = messages
      .map((m) => `${m.role === "user" ? "Apprenant" : "Assistant"}: ${String(m.content ?? "").slice(0, 2000)}`)
      .join("\n\n");

    const openai = getOpenAIClient();
    if (!openai) {
      return NextResponse.json({ error: "OpenAI non configuré" }, { status: 503 });
    }

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        {
          role: "user",
          content: `Formation : ${courseTitle || "—"}
Chapitre : ${chapterTitle}

Contexte pédagogique :
${contextText || "(non fourni)"}
${interviewObjectives ? `\nObjectifs visés par le formateur :\n${interviewObjectives}` : ""}

Transcript de l'entretien :
${transcript}`,
        },
      ],
      max_tokens: 900,
      temperature: 0.4,
      response_format: { type: "json_object" },
    });

    const raw = String(completion.choices[0]?.message?.content ?? "").trim();
    let parsed: InterviewFeedbackPayload;
    try {
      parsed = JSON.parse(raw) as InterviewFeedbackPayload;
    } catch {
      return NextResponse.json({ error: "Feedback invalide" }, { status: 502 });
    }

    const normalize = (arr: unknown) =>
      Array.isArray(arr)
        ? arr.map((x) => String(x ?? "").trim()).filter(Boolean).slice(0, 5)
        : [];

    const feedback: InterviewFeedbackPayload = {
      summary: String(parsed.summary ?? "").trim() || "Merci pour cet échange.",
      bien_dit: normalize(parsed.bien_dit),
      a_revoir: normalize(parsed.a_revoir),
      compris: normalize(parsed.compris),
      pas_compris: normalize(parsed.pas_compris),
      axes_amelioration: normalize(parsed.axes_amelioration),
    };

    return NextResponse.json({ feedback });
  } catch (e) {
    console.error("[experiential-interview-feedback]", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Erreur serveur" },
      { status: 500 },
    );
  }
}
