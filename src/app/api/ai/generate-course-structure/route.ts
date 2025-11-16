import { NextRequest, NextResponse } from "next/server";
import { generateJSONWithAnthropic } from "@/lib/ai/anthropic-client";
import { getServerClient } from "@/lib/supabase/server";
import { loadPrompt } from "@/lib/ai/prompt-loader";
import { logAIInteraction } from "@/lib/ai/ai-interaction-logger";

/**
 * Route pour générer la structure complète d'une formation avec Anthropic
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { prompt, courseTitle, courseDescription, targetAudience, learningObjectives } = body;

    if (!prompt || typeof prompt !== "string" || prompt.trim().length < 20) {
      return NextResponse.json(
        { error: "Le prompt doit contenir au moins 20 caractères" },
        { status: 400 }
      );
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
    const fullPrompt = await loadPrompt("generate-course-structure", {
      prompt,
      courseTitle,
      courseDescription,
      targetAudience,
      learningObjectives: JSON.stringify(learningObjectives || []),
    });

    // Schéma JSON pour la structure
    const schema = {
      parameters: {
        type: "object",
        properties: {
          sections: {
            type: "array",
            items: {
              type: "object",
              properties: {
                title: { type: "string" },
                description: { type: "string" },
                order: { type: "number" },
                chapters: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      title: { type: "string" },
                      summary: { type: "string" },
                      content: { type: "string" },
                      duration: { type: "string" },
                      type: { type: "string", enum: ["video", "text", "document"] },
                      order: { type: "number" },
                      subchapters: {
                        type: "array",
                        items: {
                          type: "object",
                          properties: {
                            title: { type: "string" },
                            summary: { type: "string" },
                            content: { type: "string" },
                            duration: { type: "string" },
                            type: { type: "string", enum: ["video", "text", "document", "audio"] },
                            order: { type: "number" },
                          },
                          required: ["title", "summary", "content", "duration", "type", "order"],
                        },
                      },
                    },
                    required: ["title", "summary", "content", "duration", "type", "order", "subchapters"],
                  },
                },
              },
              required: ["title", "description", "order", "chapters"],
            },
          },
        },
        required: ["sections"],
      },
    };

    // Utiliser Anthropic pour la génération de structure
    const systemPrompt = `Tu es un expert en ingénierie pédagogique. Génère des structures de formation complètes, logiques et progressives.
Schéma JSON attendu : ${JSON.stringify(schema.parameters)}`;

    // Vérifier que la clé API Anthropic est configurée
    const anthropicApiKey = process.env.ANTHROPIC_API_KEY;
    if (!anthropicApiKey) {
      console.error("[api/generate-course-structure] ANTHROPIC_API_KEY not configured");
      return NextResponse.json(
        {
          error: "Clé API Anthropic non configurée. Veuillez ajouter ANTHROPIC_API_KEY dans votre fichier .env.local",
        },
        { status: 500 }
      );
    }

    console.log("[api/generate-course-structure] Calling Anthropic with prompt length:", fullPrompt.length);
    const result = await generateJSONWithAnthropic(fullPrompt, systemPrompt);

    console.log("[api/generate-course-structure] Anthropic response:", {
      hasResult: !!result,
      hasSections: !!result?.sections,
      sectionsCount: result?.sections?.length,
      resultKeys: result ? Object.keys(result) : [],
    });

    if (!result) {
      console.error("[api/generate-course-structure] No result from Anthropic");
      return NextResponse.json(
        {
          error: "L'IA n'a pas pu générer de structure. Vérifiez que votre clé API Anthropic est valide et que le service est accessible.",
        },
        { status: 500 }
      );
    }

    if (!result.sections) {
      console.error("[api/generate-course-structure] Result missing sections:", result);
      return NextResponse.json(
        { error: "La structure générée est incomplète (sections manquantes)" },
        { status: 500 }
      );
    }

    if (!Array.isArray(result.sections) || result.sections.length === 0) {
      console.error("[api/generate-course-structure] Empty sections array");
      const duration = Date.now() - startTime;
      await logAIInteraction({
        userId: authData.user.id,
        featureId: "generate-course-structure",
        featureName: "Génération de structure de cours",
        promptUsed: fullPrompt,
        promptVariables: { prompt, courseTitle, courseDescription, targetAudience, learningObjectives },
        success: false,
        errorMessage: "Aucune section générée",
        durationMs: duration,
      });
      return NextResponse.json(
        { error: "Aucune section générée. Enrichissez votre référentiel avec plus de détails." },
        { status: 500 }
      );
    }

    const duration = Date.now() - startTime;
    // Enregistrer l'interaction
    await logAIInteraction({
      userId: authData.user.id,
      featureId: "generate-course-structure",
      featureName: "Génération de structure de cours",
      promptUsed: fullPrompt,
      promptVariables: { prompt, courseTitle, courseDescription, targetAudience, learningObjectives },
      response: { sectionsCount: result.sections?.length },
      success: true,
      durationMs: duration,
    });

    return NextResponse.json({ success: true, structure: result });
  } catch (error) {
    console.error("[api/generate-course-structure] Error:", {
      error,
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });

    // Enregistrer l'erreur
    const supabase = await getServerClient();
    if (supabase) {
      const { data: authData } = await supabase.auth.getUser();
      if (authData?.user?.id) {
        await logAIInteraction({
          userId: authData.user.id,
          featureId: "generate-course-structure",
          featureName: "Génération de structure de cours",
          promptUsed: "",
          success: false,
          errorMessage: error instanceof Error ? error.message : String(error),
        });
      }
    }

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Une erreur est survenue lors de la génération",
      },
      { status: 500 }
    );
  }
}

