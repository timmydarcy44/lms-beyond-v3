/**
 * Configuration centralisée des providers IA par fonctionnalité
 */

export type AIProvider = "openai" | "anthropic" | "both";

export type AIFeature =
  | "mirror-question"
  | "analyze-test-results"
  | "generate-chapter"
  | "generate-flashcards"
  | "transform-text"
  | "generate-test-feedback"
  | "lesson-assistant"
  | "question-workshop"
  | "generate-course-structure"
  | "create-chapter"
  | "create-subchapter";

/**
 * Configuration des providers par fonctionnalité
 * "openai" = OpenAI uniquement
 * "anthropic" = Anthropic uniquement
 * "both" = OpenAI priorité, Anthropic fallback
 */
export const AI_PROVIDER_CONFIG: Record<AIFeature, AIProvider> = {
  // Questions miroirs : OpenAI priorité, Anthropic fallback
  "mirror-question": "both",
  
  // Analyse résultats tests : Anthropic uniquement
  "analyze-test-results": "anthropic",
  
  // Génération chapitres : OpenAI uniquement
  "generate-chapter": "openai",
  
  // Génération flashcards : Anthropic uniquement
  "generate-flashcards": "anthropic",
  
  // Transformation texte : Anthropic uniquement
  "transform-text": "anthropic",
  
  // Feedback tests : Anthropic uniquement
  "generate-test-feedback": "anthropic",
  
  // Assistant leçons : OpenAI uniquement
  "lesson-assistant": "openai",
  
  // Atelier IA questions : OpenAI uniquement
  "question-workshop": "openai",
  
  // Structure formation : Anthropic uniquement
  "generate-course-structure": "anthropic",
  
  // Création chapitres : Anthropic uniquement
  "create-chapter": "anthropic",
  
  // Création sous-chapitres : Anthropic uniquement
  "create-subchapter": "anthropic",
};

/**
 * Retourne le provider configuré pour une fonctionnalité
 */
export function getProviderForFeature(feature: AIFeature): AIProvider {
  return AI_PROVIDER_CONFIG[feature] || "openai";
}

/**
 * Vérifie si OpenAI doit être utilisé pour une fonctionnalité
 */
export function shouldUseOpenAI(feature: AIFeature): boolean {
  const provider = getProviderForFeature(feature);
  return provider === "openai" || provider === "both";
}

/**
 * Vérifie si Anthropic doit être utilisé pour une fonctionnalité
 */
export function shouldUseAnthropic(feature: AIFeature): boolean {
  const provider = getProviderForFeature(feature);
  return provider === "anthropic" || provider === "both";
}

/**
 * Retourne le provider prioritaire pour une fonctionnalité
 */
export function getPrimaryProvider(feature: AIFeature): "openai" | "anthropic" {
  const provider = getProviderForFeature(feature);
  if (provider === "both") {
    return "openai"; // OpenAI en priorité si les deux sont configurés
  }
  return provider;
}








