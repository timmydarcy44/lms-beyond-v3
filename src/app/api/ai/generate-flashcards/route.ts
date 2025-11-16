import { NextRequest, NextResponse } from "next/server";

import { generateJSONWithAnthropic } from "@/lib/ai/anthropic-client";
import { getServerClient } from "@/lib/supabase/server";
import { loadPrompt } from "@/lib/ai/prompt-loader";
import { logAIInteraction } from "@/lib/ai/ai-interaction-logger";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { chapterContent, chapterTitle } = body;

    if (!chapterContent || typeof chapterContent !== "string" || chapterContent.trim().length < 50) {
      return NextResponse.json({ error: "Le contenu du chapitre doit contenir au moins 50 caractères" }, { status: 400 });
    }

    if (!chapterTitle || typeof chapterTitle !== "string") {
      return NextResponse.json({ error: "Le titre du chapitre est requis" }, { status: 400 });
    }

    // Vérifier l'authentification
    const supabase = await getServerClient();
    if (!supabase) {
      return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
    }

    const { data: authData } = await supabase.auth.getUser();
    if (!authData?.user?.id) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    // Charger le prompt personnalisé ou utiliser le défaut
    const startTime = Date.now();
    const fullPrompt = await loadPrompt("generate-flashcards", { chapterContent, chapterTitle });

    // Schéma JSON pour les flashcards
    // Note: Le schéma est passé dans le prompt system, la fonction generateJSON utilisera json_object
    const schema = {
      parameters: {
        type: "object",
        properties: {
          flashcards: {
            type: "array",
            items: {
              type: "object",
              properties: {
                question: { type: "string" },
                answer: { type: "string" },
                tags: { type: "array", items: { type: "string" } },
                difficulty: { type: "string", enum: ["facile", "intermédiaire", "expert"] },
              },
              required: ["question", "answer", "tags", "difficulty"],
            },
          },
        },
        required: ["flashcards"],
      },
    };

    // Utiliser Anthropic pour la génération de flashcards
    const systemPrompt = `Tu es un expert en pédagogie. Génère des flashcards de qualité à partir du contenu fourni.
Schéma JSON attendu : ${JSON.stringify(schema.parameters)}`;
    
    const result = await generateJSONWithAnthropic(fullPrompt, systemPrompt);
    const duration = Date.now() - startTime;

    if (!result || !result.flashcards) {
      await logAIInteraction({
        userId: authData.user.id,
        featureId: "generate-flashcards",
        featureName: "Génération de flashcards",
        promptUsed: fullPrompt,
        promptVariables: { chapterContent, chapterTitle },
        success: false,
        errorMessage: "Erreur lors de la génération",
        durationMs: duration,
      });
      return NextResponse.json({ error: "Erreur lors de la génération" }, { status: 500 });
    }

    // Enregistrer l'interaction
    await logAIInteraction({
      userId: authData.user.id,
      featureId: "generate-flashcards",
      featureName: "Génération de flashcards",
      promptUsed: fullPrompt,
      promptVariables: { chapterContent, chapterTitle },
      response: { flashcardsCount: result.flashcards?.length },
      success: true,
      durationMs: duration,
    });

    return NextResponse.json({ success: true, flashcards: result.flashcards });
  } catch (error) {
    console.error("[ai] Error in generate-flashcards", error);

    // Enregistrer l'erreur
    const supabase = await getServerClient();
    if (supabase) {
      const { data: authData } = await supabase.auth.getUser();
      if (authData?.user?.id) {
        await logAIInteraction({
          userId: authData.user.id,
          featureId: "generate-flashcards",
          featureName: "Génération de flashcards",
          promptUsed: "",
          promptVariables: { chapterContent, chapterTitle },
          success: false,
          errorMessage: error instanceof Error ? error.message : String(error),
        });
      }
    }

    return NextResponse.json({ error: "Une erreur est survenue" }, { status: 500 });
  }
}

