import { NextRequest, NextResponse } from "next/server";
import { getServerClient } from "@/lib/supabase/server";
import { getOpenAIClient } from "@/lib/ai/openai-client";

type BioPayload = {
  firstName?: string;
  experiences?: unknown[];
  diplomes?: unknown[];
  softSkills?: Array<{ skill: string; score: number }>;
  discScores?: Record<string, number>;
  idmc?: Record<string, unknown> | null;
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

    const body = (await request.json()) as BioPayload;
    const firstName = body?.firstName || "l'utilisateur";

    const openai = getOpenAIClient();
    if (!openai) {
      return NextResponse.json({ error: "OpenAI non configuré." }, { status: 500 });
    }

    const prompt = `Analyse le profil de ${firstName} via ses expériences, diplômes, soft skills, Test comportemental et IDMC pour faire un pitch recruteur.

Expériences: ${JSON.stringify(body?.experiences ?? [])}
Diplômes: ${JSON.stringify(body?.diplomes ?? [])}
Soft Skills: ${JSON.stringify(body?.softSkills ?? [])}
Test comportemental: ${JSON.stringify(body?.discScores ?? {})}
IDMC: ${JSON.stringify(body?.idmc ?? {})}

Réponds en 6 à 8 phrases, ton professionnel et factuel, sans superlatifs.`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: "Tu es un expert en recrutement." },
        { role: "user", content: prompt },
      ],
      temperature: 0.4,
    });

    const bio = response.choices[0]?.message?.content?.trim() || "";
    if (bio) {
      const { error: updateError } = await supabase
        .from("profiles")
        .update({ bio_ai: bio })
        .eq("id", user.id);
      if (updateError) {
        console.error("[profile-bio] update error:", updateError);
      }
    }

    return NextResponse.json({ bio });
  } catch (error) {
    console.error("[profile-bio] error:", error);
    return NextResponse.json({ error: "Erreur inattendue" }, { status: 500 });
  }
}
