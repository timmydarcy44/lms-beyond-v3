import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { generateTextWithAnthropic } from "@/lib/ai/anthropic-client";
import { getOpenAIClient } from "@/lib/ai/openai-client";

type AIAction = 
  | "revision-sheet"
  | "reformulate"
  | "translate"
  | "diagram"
  | "cleanup"
  | "audio";

const getPromptForAction = (action: AIAction, text: string): string => {
  switch (action) {
    case "revision-sheet":
      return `Crée une fiche de révision structurée et complète à partir du texte suivant. La fiche doit inclure :
- Un résumé des points clés
- Les concepts importants avec leurs définitions
- Des exemples concrets si applicable
- Des questions de révision

Texte à traiter :
${text}`;

    case "reformulate":
      return `Reformule le texte suivant pour améliorer sa clarté, sa lisibilité et sa compréhension. Conserve le sens original mais rends-le plus accessible et mieux structuré.

Texte à reformuler :
${text}`;

    case "translate":
      return `Traduis le texte suivant en français (si ce n'est pas déjà le cas) ou en anglais. Assure-toi que la traduction soit précise et naturelle.

Texte à traduire :
${text}`;

    case "diagram":
      return `Crée une description détaillée d'un schéma ou diagramme qui pourrait représenter visuellement les concepts et relations présents dans le texte suivant. Décris la structure, les éléments principaux et leurs connexions.

Texte à analyser :
${text}`;

    case "cleanup":
      return `Nettoie et structure le texte suivant. Corrige les erreurs, améliore la ponctuation, organise les paragraphes de manière logique et assure une cohérence globale.

Texte à nettoyer :
${text}`;

    case "audio":
      return `Prépare ce texte pour une conversion en audio. Adapte-le pour qu'il soit fluide à l'oral : simplifie les phrases complexes, ajoute des pauses naturelles, et assure une bonne compréhension à l'écoute.

Texte à adapter :
${text}`;

    default:
      return text;
  }
};

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const body = await request.json();
    const { documentId, action, text } = body;

    if (!action || !text) {
      return NextResponse.json(
        { error: "Action et texte requis" },
        { status: 400 }
      );
    }

    const prompt = getPromptForAction(action as AIAction, text);
    if (!prompt) {
      return NextResponse.json({ error: "Erreur lors de la génération du prompt" }, { status: 400 });
    }

    // Utiliser Anthropic en priorité, OpenAI en fallback
    let result: string | null;

    try {
      result = await generateTextWithAnthropic(prompt, undefined, {
        maxTokens: 4000,
      });
      
      if (!result) {
        throw new Error("Aucun résultat de Anthropic");
      }
    } catch (anthropicError) {
      console.warn("[beyond-note/ai-action] Anthropic failed, trying OpenAI:", anthropicError);
      
      const openai = getOpenAIClient();
      if (!openai) {
        throw new Error("Aucun provider IA disponible");
      }

      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "user",
            content: prompt,
          },
        ],
        max_tokens: 4000,
      });

      result = response.choices[0]?.message?.content || "Erreur lors de la génération";
    }

    return NextResponse.json({
      result,
      action,
      documentId,
    });
  } catch (error) {
    console.error("[beyond-note/ai-action] Error:", error);
    return NextResponse.json(
      { error: "Erreur lors du traitement IA" },
      { status: 500 }
    );
  }
}




