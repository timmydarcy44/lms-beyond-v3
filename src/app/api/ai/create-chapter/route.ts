import { NextRequest, NextResponse } from "next/server";
import { generateJSON } from "@/lib/ai/openai-client";
import { getServerClient } from "@/lib/supabase/server";
import { loadPrompt } from "@/lib/ai/prompt-loader";
import { logAIInteraction } from "@/lib/ai/ai-interaction-logger";

/**
 * Route pour créer un chapitre avec OpenAI
 * Utilise la même fonction que generate-chapter
 */
export async function POST(request: NextRequest) {
  let prompt: string | undefined;
  let courseContext: string | undefined;
  
  try {
    const body = await request.json();
    prompt = body.prompt;
    courseContext = body.courseContext;

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

    // Schéma JSON pour le chapitre (sans suggestedSubchapters - on ne veut que le contenu)
    const schema = {
      parameters: {
        type: "object",
        properties: {
          title: { type: "string" },
          summary: { type: "string" },
          content: { type: "string" },
          duration: { type: "string" },
          type: { type: "string", enum: ["video", "text", "document"] },
        },
        required: ["title", "summary", "content", "duration", "type"],
      },
    };

    // Utiliser OpenAI pour la création de chapitres
    const systemPrompt = `Tu es un expert en pédagogie et en création de contenu de formation. Génère des chapitres de qualité avec un contenu riche et structuré.
CRITIQUE : Le champ "content" DOIT être du HTML valide avec des balises (<h2>, <h3>, <p>, <ul>, <ol>, <li>, <strong>, <em>). 
NE PAS utiliser de markdown (pas de ##, -, *, etc.). UNIQUEMENT du HTML brut.
Schéma JSON attendu : ${JSON.stringify(schema.parameters)}`;

    const result = await generateJSON(fullPrompt, schema, systemPrompt);
    const duration = Date.now() - startTime;

    if (!result) {
      console.error("[ai] generateJSON returned null or undefined");
      await logAIInteraction({
        userId: authData.user.id,
        featureId: "create-chapter",
        featureName: "Création de chapitre",
        promptUsed: fullPrompt,
        promptVariables: { prompt, courseContext },
        success: false,
        errorMessage: "Erreur lors de la génération. Vérifiez que OPENAI_API_KEY est configurée et valide.",
        durationMs: duration,
      });
      return NextResponse.json({ 
        error: "Erreur lors de la génération. Vérifiez que OPENAI_API_KEY est configurée et valide." 
      }, { status: 500 });
    }

    // Valider que le résultat contient les champs requis
    if (!result.title || !result.content || !result.summary || !result.duration || !result.type) {
      console.error("[ai] Invalid result structure:", result);
      await logAIInteraction({
        userId: authData.user.id,
        featureId: "create-chapter",
        featureName: "Création de chapitre",
        promptUsed: fullPrompt,
        promptVariables: { prompt, courseContext },
        success: false,
        errorMessage: "La réponse de l'IA est incomplète.",
        durationMs: duration,
      });
      return NextResponse.json({ 
        error: "La réponse de l'IA est incomplète. Veuillez réessayer." 
      }, { status: 500 });
    }

    // Vérifier et corriger le format du contenu si nécessaire
    let content = result.content;
    if (typeof content === "string") {
      // Si le contenu ne contient pas de balises HTML, c'est probablement du texte brut ou du markdown
      if (!content.includes('<') || !content.includes('>')) {
        console.warn("[ai] Content is not HTML, converting markdown/text to HTML format");
        // Convertir le texte brut/markdown en HTML
        const lines = content.split('\n');
        let htmlContent = '';
        let inList = false;
        let listType: 'ul' | 'ol' | null = null;

        for (let i = 0; i < lines.length; i++) {
          const line = lines[i].trim();
          if (!line) {
            if (inList) {
              htmlContent += `</${listType}>\n`;
              inList = false;
              listType = null;
            }
            continue;
          }

          // Détecter les titres markdown
          if (line.startsWith('#### ')) {
            if (inList) {
              htmlContent += `</${listType}>\n`;
              inList = false;
              listType = null;
            }
            htmlContent += `<h4>${line.substring(5)}</h4>\n`;
          } else if (line.startsWith('### ')) {
            if (inList) {
              htmlContent += `</${listType}>\n`;
              inList = false;
              listType = null;
            }
            htmlContent += `<h3>${line.substring(4)}</h3>\n`;
          } else if (line.startsWith('## ')) {
            if (inList) {
              htmlContent += `</${listType}>\n`;
              inList = false;
              listType = null;
            }
            htmlContent += `<h2>${line.substring(3)}</h2>\n`;
          } else if (line.startsWith('# ')) {
            if (inList) {
              htmlContent += `</${listType}>\n`;
              inList = false;
              listType = null;
            }
            htmlContent += `<h2>${line.substring(2)}</h2>\n`;
          } else if (/^\d+\.\s/.test(line)) {
            // Liste numérotée
            if (!inList || listType !== 'ol') {
              if (inList) {
                htmlContent += `</${listType}>\n`;
              }
              htmlContent += '<ol>\n';
              inList = true;
              listType = 'ol';
            }
            htmlContent += `<li>${line.replace(/^\d+\.\s/, '')}</li>\n`;
          } else if (/^[-*+]\s/.test(line)) {
            // Liste à puces
            if (!inList || listType !== 'ul') {
              if (inList) {
                htmlContent += `</${listType}>\n`;
              }
              htmlContent += '<ul>\n';
              inList = true;
              listType = 'ul';
            }
            htmlContent += `<li>${line.replace(/^[-*+]\s/, '')}</li>\n`;
          } else {
            // Paragraphe normal
            if (inList) {
              htmlContent += `</${listType}>\n`;
              inList = false;
              listType = null;
            }
            htmlContent += `<p>${line}</p>\n`;
          }
        }

        if (inList) {
          htmlContent += `</${listType}>\n`;
        }

        content = htmlContent.trim();
      }
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

    return NextResponse.json({ success: true, chapter: { ...result, content } });
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
          promptVariables: { prompt: prompt || "", courseContext: courseContext || "" },
          success: false,
          errorMessage: error instanceof Error ? error.message : String(error),
        });
      }
    }

    const errorMessage = error instanceof Error ? error.message : "Une erreur est survenue";
    return NextResponse.json({ 
      error: errorMessage,
      details: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
}


