import { NextRequest, NextResponse } from "next/server";

import { getOpenAIClient } from "@/lib/ai/openai-client";
import { getSession } from "@/lib/auth/session";

type ChatMessage = { role: "user" | "assistant"; content: string };

const SYSTEM_PROMPT = `Tu es Neo, un assistant pédagogique qui mène un entretien expérientiel en français.

Objectif : aider l'apprenant à contextualiser ce qu'il vient d'apprendre (mise en pratique, exemples concrets, liens avec son métier).

Règles :
- Pose UNE seule question courte à la fois (2 phrases max).
- Pas de markdown : pas de **, ##, listes à puces.
- Ton bienveillant, conversationnel, jamais condescendant.
- Après la réponse de l'apprenant : une courte reformulation ou validation, puis une nouvelle question (sauf si l'échange est terminé).
- Si l'apprenant dit qu'il a fini ou après environ 6 échanges utiles : conclus en 2 phrases (synthèse + encouragement).
- Reste strictement dans le cadre du contenu du chapitre fourni.
- Si des objectifs pédagogiques du formateur sont fournis, oriente chaque question pour les faire progresser vers ces objectifs.`;

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
    const contextText = String(body.contextText ?? "").trim().slice(0, 12_000);
    if (!contextText) {
      return NextResponse.json({ error: "Contexte du chapitre manquant" }, { status: 400 });
    }

    const chapterTitle = String(body.chapterTitle ?? "Chapitre").trim();
    const courseTitle = String(body.courseTitle ?? "").trim();
    const interviewObjectives = String(body.interviewObjectives ?? "").trim().slice(0, 2000);

    const objectivesBlock = interviewObjectives
      ? `\n\nObjectifs pédagogiques fixés par le formateur (prioritaires pour tes questions) :\n${interviewObjectives}`
      : "";

    const contextBlock = `Formation : ${courseTitle || "—"}
Chapitre : ${chapterTitle}

Contenu du chapitre :
${contextText}${objectivesBlock}`;

    const openAiMessages: { role: "system" | "user" | "assistant"; content: string }[] = [
      { role: "system", content: `${SYSTEM_PROMPT}\n\n${contextBlock}` },
    ];

    if (messages.length === 0) {
      openAiMessages.push({
        role: "user",
        content:
          "L'apprenant ouvre l'entretien. Accueille-le brièvement et pose la première question pour l'aider à relier le chapitre à sa pratique.",
      });
    } else {
      for (const m of messages) {
        if (m.role === "user" || m.role === "assistant") {
          openAiMessages.push({ role: m.role, content: String(m.content ?? "").slice(0, 4000) });
        }
      }
    }

    const openai = getOpenAIClient();
    if (!openai) {
      return NextResponse.json({ error: "OpenAI non configuré" }, { status: 503 });
    }

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: openAiMessages,
      max_tokens: 450,
      temperature: 0.65,
    });

    const text = String(completion.choices[0]?.message?.content ?? "").trim();
    if (!text) {
      return NextResponse.json({ error: "Réponse vide" }, { status: 502 });
    }

    return NextResponse.json({ reply: text });
  } catch (e) {
    console.error("[experiential-interview]", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Erreur serveur" },
      { status: 500 },
    );
  }
}
