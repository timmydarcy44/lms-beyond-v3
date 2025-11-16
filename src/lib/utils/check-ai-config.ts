/**
 * Vérifie si l'IA est configurée et retourne le provider disponible
 */
export function checkAIConfig(): {
  isConfigured: boolean;
  provider: "openai" | "anthropic" | "none";
  hasOpenAI: boolean;
  hasAnthropic: boolean;
} {
  const openaiKey = process.env.OPENAI_API_KEY;
  const anthropicKey = process.env.ANTHROPIC_API_KEY;

  const hasOpenAI = !!openaiKey && openaiKey.trim().length > 0;
  const hasAnthropic = !!anthropicKey && anthropicKey.trim().length > 0;

  let provider: "openai" | "anthropic" | "none" = "none";
  if (hasOpenAI) {
    provider = "openai";
  } else if (hasAnthropic) {
    provider = "anthropic";
  }

  return {
    isConfigured: hasOpenAI || hasAnthropic,
    provider,
    hasOpenAI,
    hasAnthropic,
  };
}

/**
 * Vérifie la configuration de l'IA côté client (via API)
 */
export async function checkAIConfigClient(): Promise<{
  isConfigured: boolean;
  provider: "openai" | "anthropic" | "none";
}> {
  try {
    const response = await fetch("/api/ai/check-config");
    if (!response.ok) {
      return { isConfigured: false, provider: "none" };
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("[check-ai-config] Error:", error);
    return { isConfigured: false, provider: "none" };
  }
}



