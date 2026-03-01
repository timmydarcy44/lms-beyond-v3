import { NextRequest, NextResponse } from "next/server";
import { getServerClient } from "@/lib/supabase/server";
import { getOpenAIClient } from "@/lib/ai/openai-client";

type AnalyzePayload = {
  scores: Record<string, number>;
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

    const body = (await request.json()) as AnalyzePayload;
    const scores = body?.scores ?? {};

    const { data: latest } = await supabase
      .from("soft_skills_results")
      .select("id, ai_analysis")
      .eq("learner_id", user.id)
      .order("taken_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (latest?.ai_analysis) {
      return NextResponse.json({ analysis: latest.ai_analysis, cached: true });
    }

    const openai = getOpenAIClient();
    if (!openai) {
      return NextResponse.json({ error: "OpenAI non configuré." }, { status: 500 });
    }

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content:
            "Tu es un expert en psychométrie et en évaluation des compétences. Analyse les scores fournis sur 20 compétences (notées sur 15). Ton objectif est de fournir une synthèse technique du profil.\n\nStructure imposée (sans fioritures) :\n\nProfil Dominant : Nomme le profil de manière technique (ex: Profil Stratège-Innovateur).\n\nAnalyse des leviers : Explique comment les scores les plus hauts interagissent entre eux pour créer une valeur ajoutée professionnelle. Sois précis sur les corrélations.\n\nPoints de vigilance et optimisation : Identifie les scores les plus bas et explique concrètement l'impact sur la performance au travail. Propose des axes d'amélioration opérationnels.\n\nInterdiction stricte : Ne pas utiliser de mots comme 'flamboyant', 'extraordinaire', 'alchimiste', 'horizon', 'magnifique'. Reste concentré sur l'efficacité, la gestion et la structure.",
        },
        {
          role: "user",
          content: `Scores (sur 15) : ${JSON.stringify(scores)}`,
        },
      ],
      temperature: 0.7,
    });

    const analysis = response.choices[0]?.message?.content?.trim() || "";

    if (analysis && latest?.id) {
      const { error: updateError } = await supabase
        .from("soft_skills_results")
        .update({ ai_analysis: analysis })
        .eq("id", latest.id);
      if (updateError) {
        console.error("[soft-skills/analyze] update error", updateError);
      }
    }

    return NextResponse.json({ analysis, cached: false });
  } catch (error) {
    console.error("[soft-skills/analyze]", error);
    return NextResponse.json({ error: "Erreur inattendue" }, { status: 500 });
  }
}
