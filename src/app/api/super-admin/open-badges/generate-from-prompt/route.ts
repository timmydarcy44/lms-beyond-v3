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

  const system = `Tu es un expert Open Badges (1EdTech). À partir du brief utilisateur, génère un badge professionnel en JSON strict :
{
  "name": "titre court du badge",
  "description": "2 phrases max",
  "level": 1-5,
  "criteriaMarkdown": "texte des critères en langage simple",
  "criteria": [{"label": "critère court", "description": "détail optionnel"}],
  "evaluationMethods": ["qcm"|"case_study"|"video"|"pdf_upload"|"dictation"] (1 à 3 ids),
  "suggestedEvaluationPrompt": "consigne pour l'évaluateur ou l'IA"
}
Réponds UNIQUEMENT avec le JSON, sans markdown.`;

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
