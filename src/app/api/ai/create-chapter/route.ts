import { NextRequest, NextResponse } from "next/server";
import { generateJSONWithAnthropic } from "@/lib/ai/anthropic-client";
import { getServerClient } from "@/lib/supabase/server";
import { loadPrompt } from "@/lib/ai/prompt-loader";
import { logAIInteraction } from "@/lib/ai/ai-interaction-logger";

/**
 * Route pour créer un chapitre avec Anthropic
 * Différent de generate-chapter qui utilise OpenAI
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { prompt, courseContext } = body;

    if (!prompt || typeof prompt !== "string" || prompt.trim().length < 10) {
      return NextResponse.json({ error: "Le prompt doit contenir au moins 10 caractères" }, { status: 400 });
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
    const fullPrompt = await loadPrompt("create-chapter", { prompt, courseContext });

    // Schéma JSON pour le chapitre
    const schema = {
      parameters: {
        type: "object",
        properties: {
          title: { type: "string" },
          summary: { type: "string" },
          content: { type: "string" },
          duration: { type: "string" },
          type: { type: "string", enum: ["video", "text", "document"] },
          suggestedSubchapters: {
            type: "array",
            items: {
              type: "object",
              properties: {
                title: { type: "string" },
                duration: { type: "string" },
                type: { type: "string", enum: ["video", "text", "document", "audio"] },
                summary: { type: "string" },
              },
              required: ["title", "duration", "type", "summary"],
            },
          },
        },
        required: ["title", "summary", "content", "duration", "type", "suggestedSubchapters"],
      },
    };

    // Utiliser Anthropic pour la création de chapitres
    const systemPrompt = `Tu es un expert en pédagogie et en création de contenu de formation. Génère des chapitres de qualité avec un contenu riche et structuré.
Schéma JSON attendu : ${JSON.stringify(schema.parameters)}`;

    const result = await generateJSONWithAnthropic(fullPrompt, systemPrompt);
    const duration = Date.now() - startTime;

    if (!result) {
      await logAIInteraction({
        userId: authData.user.id,
        featureId: "create-chapter",
        featureName: "Création de chapitre",
        promptUsed: fullPrompt,
        promptVariables: { prompt, courseContext },
        success: false,
        errorMessage: "Erreur lors de la génération",
        durationMs: duration,
      });
      return NextResponse.json({ error: "Erreur lors de la génération" }, { status: 500 });
    }

    // Enregistrer l'interaction
    await logAIInteraction({
      userId: authData.user.id,
      featureId: "create-chapter",
      featureName: "Création de chapitre",
      promptUsed: fullPrompt,
      promptVariables: { prompt, courseContext },
      response: { title: result.title },
      success: true,
      durationMs: duration,
    });

    return NextResponse.json({ success: true, chapter: result });
  } catch (error) {
    console.error("[ai] Error in create-chapter", error);

    // Enregistrer l'erreur
    const supabase = await getServerClient();
    if (supabase) {
      const { data: authData } = await supabase.auth.getUser();
      if (authData?.user?.id) {
        await logAIInteraction({
          userId: authData.user.id,
          featureId: "create-chapter",
          featureName: "Création de chapitre",
          promptUsed: "",
          promptVariables: { prompt, courseContext },
          success: false,
          errorMessage: error instanceof Error ? error.message : String(error),
        });
      }
    }

    return NextResponse.json({ error: "Une erreur est survenue" }, { status: 500 });
  }
}


