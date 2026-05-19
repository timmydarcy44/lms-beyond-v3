import { NextRequest, NextResponse } from "next/server";
import { getServerClient } from "@/lib/supabase/server";
import { generateText } from "@/lib/ai/openai-client";
import { z } from "zod";

const BodySchema = z.object({
  text: z.string().min(10),
  expectedProofs: z.array(z.string()).optional().default([]),
  courseTitle: z.string().optional(),
  badgeTitle: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const supabase = await getServerClient();
    if (!supabase) return NextResponse.json({ error: "Supabase non configuré" }, { status: 500 });

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

    const body = await request.json().catch(() => null);
    const parsed = BodySchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: "Payload invalide" }, { status: 400 });

    const { text, expectedProofs, courseTitle, badgeTitle } = parsed.data;

    const proofs = expectedProofs.filter(Boolean).slice(0, 12);
    const prompt = [
      "Tu es Beyond AI, expert en évaluation pédagogique.",
      courseTitle ? `Formation: ${courseTitle}` : "",
      badgeTitle ? `Badge: ${badgeTitle}` : "",
      proofs.length ? `Preuves attendues (critères):\n- ${proofs.join("\n- ")}` : "Preuves attendues: (non fournies)",
      "",
      "Tâche: analyse ce livrable et retourne une réponse en français, concise et actionnable, au format:",
      "1) Verdict: (OK / À améliorer)",
      "2) Couverture des preuves: liste à puces, une ligne par preuve, avec ✅/⚠️ + explication courte",
      "3) 3 recommandations précises",
      "",
      "Livrable apprenant:",
      text,
    ]
      .filter(Boolean)
      .join("\n");

    const analysis = await generateText(prompt, { maxTokens: 850 });
    if (!analysis) return NextResponse.json({ error: "IA indisponible" }, { status: 503 });

    return NextResponse.json({ analysis: analysis.trim() });
  } catch (e) {
    console.error("[analyze-case-study]", e);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

