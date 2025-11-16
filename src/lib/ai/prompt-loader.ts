import { getServiceRoleClient } from "@/lib/supabase/server";
import { buildChapterGenerationPrompt } from "./prompts/chapter-generation";
import {
  buildRephrasePrompt,
  buildMindMapPrompt,
  buildSchemaPrompt,
  buildTranslatePrompt,
  buildAudioPrompt,
  buildInsightsPrompt,
} from "./prompts/text-transformation";

type PromptFeatureId =
  | "generate-course-structure"
  | "create-chapter"
  | "generate-flashcards"
  | "transform-text-rephrase"
  | "transform-text-mindmap"
  | "transform-text-schema"
  | "transform-text-translate"
  | "transform-text-audio"
  | "transform-text-insights";

/**
 * Charge un prompt personnalisé depuis la base de données, ou retourne le prompt par défaut
 */
export async function loadPrompt(
  featureId: PromptFeatureId,
  variables: Record<string, any> = {}
): Promise<string> {
  try {
    const supabase = getServiceRoleClient();
    if (!supabase) {
      return getDefaultPrompt(featureId, variables);
    }

    const { data, error } = await supabase
      .from("ai_prompts")
      .select("prompt_template")
      .eq("feature_id", featureId)
      .single();

    if (error || !data) {
      // Pas de prompt personnalisé, utiliser le défaut
      return getDefaultPrompt(featureId, variables);
    }

    // Remplacer les variables dans le template
    let prompt = data.prompt_template;
    for (const [key, value] of Object.entries(variables)) {
      const placeholder = `{${key}}`;
      prompt = prompt.replace(new RegExp(placeholder, "g"), String(value));
    }

    return prompt;
  } catch (error) {
    console.error(`[prompt-loader] Error loading prompt for ${featureId}:`, error);
    return getDefaultPrompt(featureId, variables);
  }
}

/**
 * Retourne le prompt par défaut pour une fonctionnalité
 */
function getDefaultPrompt(featureId: PromptFeatureId, variables: Record<string, any>): string {
  switch (featureId) {
    case "generate-course-structure": {
      const { prompt, courseTitle, courseDescription, targetAudience, learningObjectives } = variables;
      return `Génère la structure complète d'une formation avec sections, chapitres et sous-chapitres.

${courseTitle ? `Titre de la formation : ${courseTitle}` : ""}
${courseDescription ? `Description : ${courseDescription}` : ""}
${targetAudience ? `Public cible : ${targetAudience}` : ""}
${learningObjectives ? `Objectifs pédagogiques : ${JSON.stringify(learningObjectives)}` : ""}

Instructions spécifiques : ${prompt}

La structure doit être :
- Logique et progressive
- Complète avec sections, chapitres et sous-chapitres
- Adaptée au public cible
- Pédagogiquement cohérente
- Avec des durées estimées réalistes`;
    }

    case "create-chapter": {
      const { prompt, courseContext } = variables;
      return buildChapterGenerationPrompt(prompt, courseContext);
    }

    case "generate-flashcards": {
      const { chapterContent, chapterTitle } = variables;
      // Import dynamique pour éviter les dépendances circulaires
      const { buildFlashcardsGenerationPrompt } = require("./prompts/chapter-generation");
      return buildFlashcardsGenerationPrompt(chapterContent, chapterTitle);
    }

    case "transform-text-rephrase": {
      const { text, style } = variables;
      if (!text) throw new Error("text is required for transform-text-rephrase");
      return buildRephrasePrompt(text, style);
    }

    case "transform-text-mindmap": {
      const { text } = variables;
      return buildMindMapPrompt(text);
    }

    case "transform-text-schema": {
      const { text } = variables;
      return buildSchemaPrompt(text);
    }

    case "transform-text-translate": {
      const { text, targetLanguage } = variables;
      return buildTranslatePrompt(text, targetLanguage || "anglais");
    }

    case "transform-text-audio": {
      const { text } = variables;
      return buildAudioPrompt(text);
    }

    case "transform-text-insights": {
      const { text } = variables;
      return buildInsightsPrompt(text);
    }

    default:
      throw new Error(`Unknown feature ID: ${featureId}`);
  }
}

/**
 * Mappe l'action de transformation de texte vers le feature_id
 */
export function mapTextTransformActionToFeatureId(action: string): PromptFeatureId {
  const mapping: Record<string, PromptFeatureId> = {
    rephrase: "transform-text-rephrase",
    mindmap: "transform-text-mindmap",
    schema: "transform-text-schema",
    translate: "transform-text-translate",
    audio: "transform-text-audio",
    insights: "transform-text-insights",
  };

  return mapping[action] || "transform-text-rephrase";
}

