import { NextRequest, NextResponse } from "next/server";
import { getOpenAIClient } from "@/lib/ai/openai-client";
import { getServiceRoleClientOrFallback } from "@/lib/supabase/server";

type PublicAnalysisPayload = {
  userId?: string;
  force?: boolean;
  firstName?: string;
  lastName?: string;
  experiences?: Array<{ title?: string; company?: string }>;
  diplomas?: Array<{ title?: string; school?: string }>;
  certifiedSkills?: string[];
  idmcScore?: number | null;
  discScores?: Record<string, number>;
  softSkillsTop?: Array<{ label: string; value: number }>;
};

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as PublicAnalysisPayload;
    const openai = getOpenAIClient();
    if (!openai) {
      return NextResponse.json({ error: "OpenAI non configuré." }, { status: 500 });
    }

    if (body.userId && !body.force) {
      const supabase = await getServiceRoleClientOrFallback();
      if (supabase) {
        const { data } = await supabase
          .from("profiles")
          .select("bio_ai")
          .eq("id", body.userId)
          .maybeSingle();
        const cached = String(data?.bio_ai ?? "").trim();
        if (cached) {
          return NextResponse.json({ analysis: cached, cached: true });
        }
      }
    }

    const prompt = `Tu es expert en psychologie et en étude comportementale. À la lecture des scores suivants, réalise un profil synthétique (70 à 110 mots) pour présenter ${body.firstName ?? "le candidat"} à un recruteur.
Priorise l'analyse psychologique et comportementale. Ne répète pas les expériences ou diplômes déjà visibles ailleurs.
Le ton doit être positif, valorisant et professionnel. Évite toute formulation négative ou dépréciative (ex: "faible", "moyenne", "manque", "absence"). Si une donnée est manquante, formule-le de manière neutre et constructive (ex: "à approfondir").
Scores:
- IDMC: ${body.idmcScore ?? "N/A"}
- DISC: ${JSON.stringify(body.discScores ?? {})}
- Top Soft Skills: ${JSON.stringify(body.softSkillsTop ?? [])}
- Hard skills certifiées: ${JSON.stringify(body.certifiedSkills ?? [])}
Style sobre, professionnel, sans superlatifs.`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: "Tu es un recruteur exigeant, style sobre et factuel." },
        { role: "user", content: prompt },
      ],
      temperature: 0.4,
    });

    const analysis = response.choices[0]?.message?.content?.trim() || "";
    if (analysis && body.userId) {
      const supabase = await getServiceRoleClientOrFallback();
      if (supabase) {
        await supabase.from("profiles").update({ bio_ai: analysis }).eq("id", body.userId);
      }
    }
    return NextResponse.json({ analysis });
  } catch (error) {
    console.error("[public-profile-analysis]", error);
    return NextResponse.json({ error: "Erreur inattendue" }, { status: 500 });
  }
}
