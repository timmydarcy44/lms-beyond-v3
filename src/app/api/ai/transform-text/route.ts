import { NextRequest, NextResponse } from "next/server";

import { generateTextWithAnthropic, generateJSONWithAnthropic } from "@/lib/ai/anthropic-client";
import type { AIAction } from "@/lib/ai/utils";
import { isValidAIAction } from "@/lib/ai/utils";
import { getServerClient } from "@/lib/supabase/server";
import { loadPrompt, mapTextTransformActionToFeatureId } from "@/lib/ai/prompt-loader";
import { logAIInteraction } from "@/lib/ai/ai-interaction-logger";
import { logAIUsageEvent } from "@/lib/ai/usage-logger";

const TABLE_NOT_FOUND_CODE = "42P01";
const DEFAULT_ANTHROPIC_COST_EUR = parseFloat(process.env.AI_COST_ANTHROPIC_DEFAULT_EUR ?? "0.0025");
const ANTHROPIC_ACTION_COSTS: Partial<Record<AIAction, number>> = {
  rephrase: parseFloat(process.env.AI_COST_ANTHROPIC_REPHRASE_EUR ?? "0.0020"),
  mindmap: parseFloat(process.env.AI_COST_ANTHROPIC_MINDMAP_EUR ?? "0.0025"),
  schema: parseFloat(process.env.AI_COST_ANTHROPIC_SCHEMA_EUR ?? "0.0025"),
  translate: parseFloat(process.env.AI_COST_ANTHROPIC_TRANSLATE_EUR ?? "0.0020"),
  audio: parseFloat(process.env.AI_COST_ANTHROPIC_AUDIO_EUR ?? "0.0025"),
  insights: parseFloat(process.env.AI_COST_ANTHROPIC_INSIGHTS_EUR ?? "0.0028"),
};

function getAnthropicActionCost(action: AIAction): number {
  const cost = ANTHROPIC_ACTION_COSTS[action];
  return Number((cost ?? DEFAULT_ANTHROPIC_COST_EUR).toFixed(6));
}

function isTableMissing(error?: { code?: string | null }): boolean {
  return !!error && error.code === TABLE_NOT_FOUND_CODE;
}

export async function POST(request: NextRequest) {
  let text = "";
  let action: AIAction | null = null;
  let options: Record<string, any> | undefined;
  try {
    const body = await request.json();
    text = body?.text ?? "";
    action = body?.action ?? null;
    options = body?.options;

    if (!text || typeof text !== "string" || text.trim().length < 5) {
      return NextResponse.json({ error: "Le texte doit contenir au moins 5 caractères" }, { status: 400 });
    }

    if (!action || !isValidAIAction(action)) {
      return NextResponse.json({ error: "Action invalide" }, { status: 400 });
    }

    const supabase = await getServerClient();
    if (!supabase) {
      return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
    }

    const { data: authData } = await supabase.auth.getUser();
    if (!authData?.user?.id) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const featureId = mapTextTransformActionToFeatureId(action);
    const startTime = Date.now();

    let fullPrompt: string;
    let result: any;
    let format: "text" | "json" = "text";

    switch (action) {
      case "rephrase": {
        fullPrompt = await loadPrompt(featureId, { text, style: options?.style });
        result = await generateTextWithAnthropic(fullPrompt);
        format = "text";
        break;
      }

      case "mindmap": {
        fullPrompt = await loadPrompt(featureId, { text });
        result = await generateJSONWithAnthropic(fullPrompt);
        format = "json";
        break;
      }

      case "schema": {
        fullPrompt = await loadPrompt(featureId, { text });
        result = await generateJSONWithAnthropic(fullPrompt);
        format = "json";
        break;
      }

      case "translate": {
        const targetLanguage = options?.targetLanguage || "anglais";
        fullPrompt = await loadPrompt(featureId, { text, targetLanguage });
        result = await generateTextWithAnthropic(fullPrompt);
        format = "text";
        break;
      }

      case "audio": {
        fullPrompt = await loadPrompt(featureId, { text });
        result = await generateJSONWithAnthropic(fullPrompt);
        format = "json";
        break;
      }

      case "insights": {
        fullPrompt = await loadPrompt(featureId, { text });
        result = await generateJSONWithAnthropic(fullPrompt);
        format = "json";
        break;
      }

      default:
        return NextResponse.json({ error: "Action non supportée" }, { status: 400 });
    }

    const duration = Date.now() - startTime;

    if (!result) {
      await logAIInteraction({
        userId: authData.user.id,
        featureId,
        featureName: `Transformation de texte - ${action}`,
        promptUsed: fullPrompt,
        promptVariables: { text, action, options },
        success: false,
        errorMessage: "Erreur lors de la transformation",
        durationMs: duration,
      });
      return NextResponse.json({ error: "Erreur lors de la transformation" }, { status: 500 });
    }

    await logAIInteraction({
      userId: authData.user.id,
      featureId,
      featureName: `Transformation de texte - ${action}`,
      promptUsed: fullPrompt,
      promptVariables: { text, action, options },
      response: { format, hasResult: !!result },
      success: true,
      durationMs: duration,
    });

    await logAIUsageEvent(supabase, {
      userId: authData.user.id,
      route: "transform-text",
      action,
      provider: "anthropic",
      model: "claude-3-5-sonnet-20241022",
      costEur: getAnthropicActionCost(action),
      metadata: {
        options,
        format,
      },
    });

    return NextResponse.json({
      success: true,
      result,
      format,
      action,
    });
  } catch (error) {
    console.error("[ai] Error in transform-text", error);

    const supabase = await getServerClient();
    if (supabase) {
      const { data: authData } = await supabase.auth.getUser();
      if (authData?.user?.id) {
        const featureId = mapTextTransformActionToFeatureId(action || "rephrase");
        await logAIInteraction({
          userId: authData.user.id,
          featureId,
          featureName: `Transformation de texte - ${action || "unknown"}`,
          promptUsed: "",
          promptVariables: { text, action, options },
          success: false,
          errorMessage: error instanceof Error ? error.message : String(error),
        });

        if (action && isValidAIAction(action)) {
          await logAIUsageEvent(supabase, {
            userId: authData.user.id,
            route: "transform-text",
            action,
            provider: "anthropic",
            model: "claude-3-5-sonnet-20241022",
            costEur: 0,
            metadata: {
              error: error instanceof Error ? error.message : String(error),
            },
          });
        }
      }
    }

    return NextResponse.json({ error: "Une erreur est survenue" }, { status: 500 });
  }
}

