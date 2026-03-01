import { NextRequest, NextResponse } from "next/server";
import { getServerClient } from "@/lib/supabase/server";
import { getOpenAIClient } from "@/lib/ai/openai-client";

type AnalysisPayload = {
  firstName: string;
  discScores: Record<string, number>;
  idmcScores: Record<string, number>;
  discUpdatedAt?: string | null;
  idmcUpdatedAt?: string | null;
};

export async function POST(request: NextRequest) {
  try {
    const supabase = await getServerClient();
    if (!supabase) {
      return NextResponse.json({ error: "Supabase non configuré." }, { status: 500 });
    }

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const body = (await request.json()) as AnalysisPayload;
    const firstName = body?.firstName || "l'utilisateur";
    const discScores = body?.discScores ?? {};
    const idmcScores = body?.idmcScores ?? {};

    const openai = getOpenAIClient();
    if (!openai) {
      return NextResponse.json({ error: "OpenAI non configuré." }, { status: 500 });
    }

    const prompt = `Tu es expert en analyse comportementale. Analyse les résultats de ${firstName}. Voici ses scores DISC : ${JSON.stringify(
      discScores
    )} et ses scores IDMC : ${JSON.stringify(
      idmcScores
    )}. Explique ses forces majeures et ses axes d'amélioration de manière concise, encourageante et professionnelle (style Apple : direct et inspirant).`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: "Tu es un expert en analyse comportementale." },
        { role: "user", content: prompt },
      ],
      temperature: 0.6,
    });

    const analysis = response.choices[0]?.message?.content?.trim() || "";
    const updatedAt = new Date().toISOString();

    if (analysis) {
      const analysisPayload = JSON.stringify({
        text: analysis,
        updated_at: updatedAt,
        disc_updated_at: body?.discUpdatedAt ?? null,
        idmc_updated_at: body?.idmcUpdatedAt ?? null,
      });
      const { error: updateError } = await supabase
        .from("profiles")
        .update({ ai_analysis: analysisPayload })
        .eq("id", user.id);
      if (updateError) {
        console.error("[profile-analysis] update error", updateError);
      }
    }

    return NextResponse.json({ analysis, updatedAt });
  } catch (error) {
    console.error("[profile-analysis]", error);
    return NextResponse.json({ error: "Erreur inattendue" }, { status: 500 });
  }
}
