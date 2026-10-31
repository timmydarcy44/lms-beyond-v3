import { NextRequest, NextResponse } from "next/server";
import { isSuperAdmin } from "@/lib/auth/super-admin";
import { getOpenAIClient } from "@/lib/ai/openai-client";

export async function POST(req: NextRequest) {
  if (!(await isSuperAdmin())) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }

  const body = (await req.json().catch(() => null)) as { prompt?: string } | null;
  const prompt = body?.prompt?.trim();
  if (!prompt) {
    return NextResponse.json({ error: "Prompt requis" }, { status: 400 });
  }

  const openai = getOpenAIClient();
  if (!openai) {
    return NextResponse.json({ error: "OpenAI non configuré" }, { status: 500 });
  }

  const system = `Tu proposes un Open Badge. L'humain décide. JSON strict :
{
  "name": "titre court",
  "description": "une ou deux phrases, 300 caractères maximum, écrites pour un recruteur",
  "level": 1,
  "domain": "Intelligence artificielle" | "Management" | "Commercial" | "Sport" | "Care" | "Communication" | "Industrie",
  "achievementType": "Competency" | "Certification" | "Achievement",
  "skills": ["compétence courte"],
  "criteria": [{"label": "titre", "description": "précision", "expectedOutcome": "ce que l'expert doit constater"}],
  "evaluationMethods": ["qcm"|"case_study"|"video"|"pdf_upload"|"dictation"|"playground"],
  "suggestedEvaluationPrompt": "consigne confidentielle pour la correction"
}
level vaut 1, 2 ou 3. Réponds uniquement avec le JSON.`;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: system },
        { role: "user", content: prompt },
      ],
      max_tokens: 1200,
      response_format: { type: "json_object" },
    });

    const raw = completion.choices[0]?.message?.content ?? "{}";
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    return NextResponse.json({ badge: parsed });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Erreur génération";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
