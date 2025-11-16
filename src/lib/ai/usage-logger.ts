"use server";

import type { SupabaseClient } from "@supabase/supabase-js";

type Database = any;

export interface AIUsageLogPayload {
  userId: string;
  route: string;
  action: string;
  provider: string;
  model?: string | null;
  promptTokens?: number | null;
  completionTokens?: number | null;
  costEur?: number | null;
  metadata?: Record<string, unknown>;
}

const TABLE_NOT_FOUND_CODE = "42P01";

export async function logAIUsageEvent(
  supabase: SupabaseClient<Database>,
  payload: AIUsageLogPayload,
) {
  try {
    const { error } = await supabase.from("ai_usage_events").insert({
      user_id: payload.userId,
      route: payload.route,
      action: payload.action,
      provider: payload.provider,
      model: payload.model ?? null,
      prompt_tokens: payload.promptTokens ?? null,
      completion_tokens: payload.completionTokens ?? null,
      cost_eur: payload.costEur ?? 0,
      metadata: payload.metadata ?? null,
    });

    if (error) {
      if (error.code === TABLE_NOT_FOUND_CODE) {
        // Migration pas encore appliquée : ignorer silencieusement
        return;
      }
      console.error("[ai] Error logging usage event:", error);
    }
  } catch (error) {
    console.error("[ai] Unexpected error while logging usage event:", error);
  }
}


