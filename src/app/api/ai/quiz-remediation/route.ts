import { NextRequest, NextResponse } from "next/server";
import { generateText } from "@/lib/ai/openai-client";
import { getServerClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const supabase = await getServerClient();
    if (!supabase) {
      return NextResponse.json({ error: "Supabase non configuré" }, { status: 500 });
    }
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const body = await request.json();
    const mistakes = Array.isArray(body.mistakes) ? body.mistakes : [];
    const score = typeof body.score === "number" ? body.score : null;

    const lines = mistakes
      .slice(0, 30)
      .map(
        (m: { title?: string; userAnswer?: string; explanation?: string }) =>
          `- ${m.title ?? "Question"} : réponse donnée « ${m.userAnswer ?? "—"} ». ${m.explanation ? `Pourquoi c’est incorrect : ${m.explanation}` : ""}`,
      )
      .join("\n");

    const prompt = `Tu es un formateur bienveillant. L'apprenant a obtenu un score de ${score ?? "?"}% à un quiz.\nVoici ses erreurs :\n${lines || "(aucune erreur détaillée)"}\n\nRédige un court paragraphe en français : forces, axes d'amélioration prioritaires, et une action concrète pour la semaine. Ton bienveillant, sans jargon inutile.`;

    const summary = await generateText(prompt, { maxTokens: 800 });
    if (!summary) {
      return NextResponse.json({ error: "IA indisponible" }, { status: 503 });
    }

    return NextResponse.json({ summary });
  } catch (e) {
    console.error("[quiz-remediation]", e);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
