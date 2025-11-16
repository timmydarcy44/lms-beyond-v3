import { NextRequest, NextResponse } from "next/server";
import { generateJSONWithAnthropic } from "@/lib/ai/anthropic-client";
import { getServerClient } from "@/lib/supabase/server";

/**
 * Route pour créer un sous-chapitre avec Anthropic
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { prompt, chapterContext, chapterTitle } = body;

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

    // Construire le prompt pour un sous-chapitre
    const fullPrompt = `Crée un sous-chapitre pour le chapitre "${chapterTitle}".

Description du sous-chapitre : ${prompt}

${chapterContext ? `Contexte du chapitre : ${JSON.stringify(chapterContext)}` : ""}

Le sous-chapitre doit être :
- Cohérent avec le chapitre parent
- Complet et détaillé
- Pédagogiquement structuré
- Adapté au format choisi (vidéo, texte, document, audio)`;

    // Schéma JSON pour le sous-chapitre
    const schema = {
      parameters: {
        type: "object",
        properties: {
          title: { type: "string" },
          summary: { type: "string" },
          content: { type: "string" },
          duration: { type: "string" },
          type: { type: "string", enum: ["video", "text", "document", "audio"] },
        },
        required: ["title", "summary", "content", "duration", "type"],
      },
    };

    // Utiliser Anthropic pour la création de sous-chapitres
    const systemPrompt = `Tu es un expert en pédagogie. Génère des sous-chapitres de qualité, cohérents avec le chapitre parent.
Schéma JSON attendu : ${JSON.stringify(schema.parameters)}`;

    const result = await generateJSONWithAnthropic(fullPrompt, systemPrompt);

    if (!result) {
      return NextResponse.json({ error: "Erreur lors de la génération" }, { status: 500 });
    }

    return NextResponse.json({ success: true, subchapter: result });
  } catch (error) {
    console.error("[ai] Error in create-subchapter", error);
    return NextResponse.json({ error: "Une erreur est survenue" }, { status: 500 });
  }
}




