import { createHash } from "crypto";
import { NextRequest, NextResponse } from "next/server";

import { generateSpeech, generateJSON, generateText } from "@/lib/ai/openai-client";
import {
  buildAudioPrompt,
  buildInsightsPrompt,
  buildMindMapPrompt,
  buildRephrasePrompt,
  buildSchemaPrompt,
  buildTranslatePrompt,
  SCHEMA_PROMPT_VERSION,
  SENTENCE_CASE_PROMPT_VERSION,
} from "@/lib/ai/prompts/text-transformation";
import type { AIAction } from "@/lib/ai/utils";
import { isValidAIAction } from "@/lib/ai/utils";
import { getServerClient } from "@/lib/supabase/server";
import { logAIUsageEvent } from "@/lib/ai/usage-logger";

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const isUuid = (value: unknown): value is string => typeof value === "string" && UUID_REGEX.test(value);

type TransformationOptions = Record<string, unknown>;

const TRANSFORMATION_TABLE = "lesson_ai_transformations";
const USER_HISTORY_TABLE = "lesson_ai_user_transformations";
const TABLE_NOT_FOUND_CODE = "42P01";
const AUDIO_PROMPT_VERSION = "audio-script-v2";

const DEFAULT_ACTION_COST_EUR = parseFloat(process.env.AI_COST_DEFAULT_EUR ?? "0.001");

const ACTION_COSTS_EUR: Record<AIAction, { base?: number; speech?: number }> = {
  rephrase: { base: parseFloat(process.env.AI_COST_REPHRASE_EUR ?? "0.0009") },
  mindmap: { base: parseFloat(process.env.AI_COST_MINDMAP_EUR ?? "0.0015") },
  schema: { base: parseFloat(process.env.AI_COST_SCHEMA_EUR ?? "0.0015") },
  translate: { base: parseFloat(process.env.AI_COST_TRANSLATE_EUR ?? "0.0009") },
  insights: { base: parseFloat(process.env.AI_COST_INSIGHTS_EUR ?? "0.0018") },
  audio: {
    base: parseFloat(process.env.AI_COST_AUDIO_SCRIPT_EUR ?? "0.0015"),
    speech: parseFloat(process.env.AI_COST_AUDIO_SPEECH_EUR ?? "0.0020"),
  },
};

function getActionCost(action: AIAction, includesSpeech: boolean): number {
  const config = ACTION_COSTS_EUR[action] ?? {};
  const base = config.base ?? DEFAULT_ACTION_COST_EUR;
  const speech = includesSpeech ? config.speech ?? 0 : 0;
  return Number((base + speech).toFixed(6));
}

function isTableMissing(error?: { code?: string | null }): boolean {
  return !!error && error.code === TABLE_NOT_FOUND_CODE;
}

function sortObject<T>(value: T): T {
  if (Array.isArray(value)) {
    return value.map((item) => sortObject(item)) as T;
  }

  if (value && typeof value === "object") {
    return Object.keys(value as Record<string, unknown>)
      .sort()
      .reduce((acc, key) => {
        acc[key] = sortObject((value as Record<string, unknown>)[key]);
        return acc;
      }, {} as Record<string, unknown>) as T;
  }

  return value;
}

function normalizeOptions(action: string, options?: TransformationOptions): TransformationOptions {
  const normalized: Record<string, unknown> = {};
  const safeOptions = options ?? {};

  switch (action) {
    case "rephrase": {
      const style = typeof safeOptions["style"] === "string" ? safeOptions["style"] : undefined;
      normalized.style = style ?? "default";
      normalized.promptVersion = SENTENCE_CASE_PROMPT_VERSION;
      break;
    }
    case "mindmap": {
      normalized.promptVersion = SENTENCE_CASE_PROMPT_VERSION;
      break;
    }
    case "translate": {
      const targetLanguage = typeof safeOptions["targetLanguage"] === "string" ? safeOptions["targetLanguage"] : undefined;
      normalized.targetLanguage = targetLanguage ?? "anglais";
      normalized.caseVersion = SENTENCE_CASE_PROMPT_VERSION;
      break;
    }
    case "audio": {
      const voice = typeof safeOptions["voice"] === "string" ? safeOptions["voice"] : undefined;
      normalized.voice = voice ?? "alloy";
      normalized.promptVersion = AUDIO_PROMPT_VERSION;
      normalized.caseVersion = SENTENCE_CASE_PROMPT_VERSION;
      break;
    }
    case "schema": {
      normalized.promptVersion = SCHEMA_PROMPT_VERSION;
      normalized.caseVersion = SENTENCE_CASE_PROMPT_VERSION;
      break;
    }
    case "insights": {
      normalized.promptVersion = SENTENCE_CASE_PROMPT_VERSION;
      break;
    }
    default:
      break;
  }

  return sortObject(normalized);
}

function buildInputHash(text: string, action: string, options: TransformationOptions): string {
  return createHash("sha256")
    .update(action)
    .update("|")
    .update(text.trim())
    .update("|")
    .update(JSON.stringify(options))
    .digest("hex");
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { text, action, options = {}, context } = body as {
      text: string;
      action: string;
      options?: TransformationOptions;
      context?: {
        courseId?: string | null;
        lessonId?: string | null;
      };
    };

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

    const normalizedOptions = normalizeOptions(action, options);
    const inputHash = buildInputHash(text, action, normalizedOptions);

    let result: any;
    let format: "text" | "json" = "text";
    let audio: { base64: string; mimeType: string; voice: string } | null = null;
    let cached = false;
    let transformationId: string | null = null;
    let cacheAvailable = true;
    let speechGenerated = false;
    let cachedTransformation: {
      id: string;
      format: string;
      result_text: string | null;
      result_json: any | null;
      audio_base64: string | null;
      audio_mime_type: string | null;
      audio_voice: string | null;
    } | null = null;

    if (cacheAvailable) {
      const { data, error } = await supabase
        .from(TRANSFORMATION_TABLE)
        .select("id, format, result_text, result_json, audio_base64, audio_mime_type, audio_voice, options")
        .eq("input_hash", inputHash)
        .maybeSingle();

      if (error) {
        if (isTableMissing(error)) {
          cacheAvailable = false;
        } else if (error.code !== "PGRST116") {
          console.error("[ai] Error fetching cached transformation", error);
          return NextResponse.json({ error: "Erreur lors de la récupération du cache" }, { status: 500 });
        }
      } else if (data) {
        cachedTransformation = data;
      }
    }

    if (cachedTransformation) {
      cached = true;
      transformationId = cachedTransformation.id;
      format = (cachedTransformation.format as "text" | "json") ?? "text";
      result = format === "text" ? cachedTransformation.result_text : cachedTransformation.result_json;

      if (cachedTransformation.audio_base64 && cachedTransformation.audio_mime_type) {
        audio = {
          base64: cachedTransformation.audio_base64,
          mimeType: cachedTransformation.audio_mime_type,
          voice: cachedTransformation.audio_voice || (normalizedOptions.voice as string) || "alloy",
        };
      }
    }

    if (!cached) {
    switch (action) {
      case "rephrase": {
          const style = normalizedOptions.style === "default" ? undefined : (normalizedOptions.style as string | undefined);
          const prompt = buildRephrasePrompt(text, style as any);
        result = await generateText(prompt);
        format = "text";
        break;
      }
      case "mindmap": {
        const prompt = buildMindMapPrompt(text);
        result = await generateJSON(prompt);
        format = "json";
        break;
      }
      case "schema": {
        const prompt = buildSchemaPrompt(text);
        result = await generateJSON(prompt);
        format = "json";
        break;
      }
      case "translate": {
          const targetLanguage = normalizedOptions.targetLanguage as string;
        const prompt = buildTranslatePrompt(text, targetLanguage);
        result = await generateText(prompt);
        format = "text";
        break;
      }
      case "audio": {
        const prompt = buildAudioPrompt(text);
        let audioPlan = await generateJSON(prompt);
        let script: string;

        if (audioPlan && typeof audioPlan === "object" && typeof audioPlan.script === "string" && audioPlan.script.trim().length > 0) {
          script = audioPlan.script.trim();
        } else {
          script = text.trim();
          audioPlan = { script };
        }

        result = audioPlan;
        format = "json";

        const speech = await generateSpeech(script, {
          voice: (normalizedOptions.voice as string) || "alloy",
          format: "mp3",
        });

        if (speech) {
          speechGenerated = true;
          audio = {
            base64: speech.buffer.toString("base64"),
            mimeType: speech.mimeType,
            voice: speech.voice,
          };
        } else {
          console.warn("[ai] Speech generation returned null, sending script only");
          audio = null;
          cacheAvailable = false;
        }

        break;
      }
      case "insights": {
        const prompt = buildInsightsPrompt(text);
        result = await generateJSON(prompt);
        format = "json";
        break;
      }
      default:
        return NextResponse.json({ error: "Action non supportée" }, { status: 400 });
    }

    if (!result) {
      return NextResponse.json({ error: "Erreur lors de la transformation" }, { status: 500 });
      }

      if (cacheAvailable) {
        const { data: inserted, error: insertError } = await supabase
          .from(TRANSFORMATION_TABLE)
          .upsert(
            {
              input_hash: inputHash,
              action,
              format,
              options: normalizedOptions,
              result_text: format === "text" ? (result as string) : null,
              result_json: format === "json" ? result : null,
              audio_base64: audio?.base64 ?? null,
              audio_mime_type: audio?.mimeType ?? null,
              audio_voice: audio?.voice ?? ((normalizedOptions.voice as string) || null),
            },
            { onConflict: "input_hash" },
          )
          .select("id")
          .single();

        if (insertError) {
          if (!isTableMissing(insertError)) {
            console.error("[ai] Error caching transformation", insertError);
            return NextResponse.json({ error: "Impossible d'enregistrer la transformation" }, { status: 500 });
          }
          cacheAvailable = false;
        } else {
          transformationId = inserted?.id ?? null;
        }
      }
    }

    if (!result) {
      return NextResponse.json({ error: "Erreur lors de la transformation" }, { status: 500 });
    }

    if (transformationId) {
      const courseId = isUuid(context?.courseId) ? context?.courseId ?? null : null;
      const lessonId = isUuid(context?.lessonId) ? context?.lessonId ?? null : null;
      const excerpt = text.length > 2000 ? `${text.slice(0, 2000)}…` : text;

      const { error: historyError } = await supabase
        .from(USER_HISTORY_TABLE)
        .upsert(
          {
            user_id: authData.user.id,
            transformation_id: transformationId,
            course_id: courseId,
            lesson_id: lessonId,
            selection_excerpt: excerpt,
            action,
            options: normalizedOptions,
          },
          { onConflict: "user_id,lesson_id,transformation_id" },
        );

      if (historyError && !isTableMissing(historyError)) {
        console.error("[ai] Error saving transformation history", historyError);
      }
    }

    if (!cached) {
      const includesSpeech = action === "audio" && (!!audio || speechGenerated);
      const costEur = getActionCost(action as AIAction, includesSpeech);

      await logAIUsageEvent(supabase, {
        userId: authData.user.id,
        route: "lesson-assistant",
        action,
        provider: "openai",
        model: "gpt-4o-mini",
        costEur,
        metadata: {
          options: normalizedOptions,
          includesSpeech,
          transformationId,
          cached,
          speechModel: includesSpeech ? "gpt-4o-mini-tts" : null,
        },
      });
    } else {
      await logAIUsageEvent(supabase, {
        userId: authData.user.id,
        route: "lesson-assistant",
        action,
        provider: "openai",
        model: "gpt-4o-mini",
        costEur: 0,
        metadata: {
          options: normalizedOptions,
          cached: true,
          transformationId,
        },
      });
    }

    return NextResponse.json({
      success: true,
      result,
      format,
      action,
      audio,
      cached,
      transformationId,
      options: normalizedOptions,
    });
  } catch (error) {
    console.error("[ai] Error in lesson-assistant POST", error);
    return NextResponse.json({ error: "Une erreur est survenue" }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await getServerClient();
    if (!supabase) {
      return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
    }

    const { data: authData } = await supabase.auth.getUser();
    if (!authData?.user?.id) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const rawLessonId = request.nextUrl.searchParams.get("lessonId");
    const rawCourseId = request.nextUrl.searchParams.get("courseId");
    const lessonId = isUuid(rawLessonId) ? rawLessonId : null;
    const courseId = isUuid(rawCourseId) ? rawCourseId : null;
    const limitParam = request.nextUrl.searchParams.get("limit");
    const limit = limitParam ? Math.min(Number(limitParam) || 20, 50) : 20;

    let query = supabase
      .from(USER_HISTORY_TABLE)
      .select(
        `
        id,
        created_at,
        lesson_id,
        course_id,
        selection_excerpt,
        action,
        options,
        transformation:${TRANSFORMATION_TABLE}(
          id,
          format,
          result_text,
          result_json,
          audio_base64,
          audio_mime_type,
          audio_voice,
          options
        )
        `,
      )
      .eq("user_id", authData.user.id)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (lessonId) {
      query = query.eq("lesson_id", lessonId);
    }
    if (courseId) {
      query = query.eq("course_id", courseId);
    }

    const { data, error } = await query;
    if (error) {
      if (isTableMissing(error)) {
        return NextResponse.json({
          success: true,
          items: [],
        });
      }
      console.error("[ai] Error fetching user transformations", error);
      return NextResponse.json({
        success: true,
        items: [],
        warning: "Historique indisponible",
      });
    }

    return NextResponse.json({
      success: true,
      items: data ?? [],
    });
  } catch (error) {
    console.error("[ai] Error in lesson-assistant GET", error);
    return NextResponse.json({ error: "Une erreur est survenue" }, { status: 500 });
  }
}

