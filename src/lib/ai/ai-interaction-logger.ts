import { getServiceRoleClient } from "@/lib/supabase/server";

export type AIInteractionLog = {
  userId: string;
  featureId: string;
  featureName: string;
  promptUsed: string;
  promptVariables?: Record<string, any>;
  response?: any;
  success: boolean;
  errorMessage?: string;
  tokensUsed?: number;
  durationMs?: number;
};

/**
 * Enregistre une interaction IA dans la base de données
 */
export async function logAIInteraction(log: AIInteractionLog): Promise<void> {
  try {
    const supabase = getServiceRoleClient();
    if (!supabase) {
      console.warn("[ai-interaction-logger] Service role client not available, skipping log");
      return;
    }

    await supabase.from("ai_interactions").insert({
      user_id: log.userId,
      feature_id: log.featureId,
      feature_name: log.featureName,
      prompt_used: log.promptUsed,
      prompt_variables: log.promptVariables || {},
      response: log.response || {},
      success: log.success,
      error_message: log.errorMessage || null,
      tokens_used: log.tokensUsed || null,
      duration_ms: log.durationMs || null,
    });
  } catch (error) {
    // Ne pas faire échouer la requête si le logging échoue
    console.error("[ai-interaction-logger] Error logging interaction:", error);
  }
}



