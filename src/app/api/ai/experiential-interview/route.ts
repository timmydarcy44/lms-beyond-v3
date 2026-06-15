import { NextRequest, NextResponse } from "next/server";

import { getOpenAIClient } from "@/lib/ai/openai-client";
import {
  getInterviewOpeningPrompt,
  getInterviewSystemPrompt,
  type InterviewAudience,
} from "@/lib/apprenant/interview-audience";
import { getSession } from "@/lib/auth/session";

type ChatMessage = { role: "user" | "assistant"; content: string };

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
      audience?: InterviewAudience;
    };

    const messages = Array.isArray(body.messages) ? body.messages : [];
    const audience: InterviewAudience = body.audience === "parent" ? "parent" : "professional";
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

    const systemPrompt = getInterviewSystemPrompt(audience);
    const openAiMessages: { role: "system" | "user" | "assistant"; content: string }[] = [
      { role: "system", content: `${systemPrompt}\n\n${contextBlock}` },
    ];

    if (messages.length === 0) {
      openAiMessages.push({
        role: "user",
        content: getInterviewOpeningPrompt(audience),
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
