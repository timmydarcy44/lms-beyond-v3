import crypto from "node:crypto";
import { NextRequest, NextResponse } from "next/server";

import { jsonError } from "@/lib/api/api-error";
import { normalizeScenarioRow } from "@/lib/parcours/scenarios/serializer";
import { scenarioPayloadSchema } from "@/lib/parcours/scenarios/schema";
import { z } from "zod";
import {
  getServerClient,
  getServiceRoleClientOrFallback,
} from "@/lib/supabase/server";

type OwnershipResult =
  | {
      ok: true;
      pathId: string;
      ownerId: string | null;
      creatorId: string | null;
      isOwner: boolean;
      isCreator: boolean;
    }
  | {
      ok: false;
      status: number;
      error: "PATH_LOOKUP_FAILED" | "PATH_NOT_FOUND" | "FORBIDDEN";
      info: Record<string, unknown>;
    };

const isDev = process.env.NODE_ENV !== "production";

const mapSupabaseError = (error: unknown) => {
  if (!error || typeof error !== "object") {
    return {};
  }
  const err = error as Record<string, unknown>;
  const payload: Record<string, unknown> = {
    message: typeof err.message === "string" ? err.message : null,
    code: typeof err.code === "string" ? err.code : null,
  };
  if (isDev) {
    payload.hint = typeof err.hint === "string" ? err.hint : null;
    payload.details = typeof err.details === "string" ? err.details : null;
  }
  return payload;
};

const logDev = (
  level: "error" | "warn" | "info",
  tag: string,
  meta: Record<string, unknown>,
) => {
  if (!isDev) {
    return;
  }
  console[level](tag, meta);
};

const checkOwnership = async (
  service: NonNullable<Awaited<ReturnType<typeof getServiceRoleClientOrFallback>>>,
  pathId: string,
  userId: string,
): Promise<OwnershipResult> => {
  const { data: path, error } = await service
    .from("paths")
    .select("id, owner_id, creator_id")
    .eq("id", pathId)
    .maybeSingle();

  if (error) {
    return {
      ok: false as const,
      status: 500,
      error: "PATH_LOOKUP_FAILED" as const,
      info: { pathId, message: error.message },
    };
  }

  if (!path) {
    return {
      ok: false as const,
      status: 404,
      error: "PATH_NOT_FOUND" as const,
      info: { pathId },
    };
  }

  const ownerId = path.owner_id as string | null;
  const creatorId = path.creator_id as string | null;
  const isOwner = ownerId === userId;
  const isCreator = creatorId === userId;

  if (!isOwner && !isCreator) {
    return {
      ok: false as const,
      status: 403,
      error: "FORBIDDEN" as const,
      info: { pathId, ownerId, creatorId, userId },
    };
  }

  return {
    ok: true as const,
    pathId,
    ownerId,
    creatorId,
    isOwner,
    isCreator,
  };
};

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ pathId: string }> },
) {
  const errorId = crypto.randomUUID();
  const routeTag = "[scenarios POST]";
  const method = "POST";

  try {
    const supabase = await getServerClient();
    if (!supabase) {
      return jsonError("UNAUTHENTICATED", 401, errorId);
    }

    const { data: authData } = await supabase.auth.getUser();
    const userId = authData?.user?.id ?? null;
    if (!userId) {
      return jsonError("UNAUTHENTICATED", 401, errorId);
    }

    const { pathId: pathIdParam } = await context.params;

    logDev("info", `${routeTag} CONTEXT`, {
      route: routeTag,
      method,
      errorId,
      params: { pathId: pathIdParam },
      url: request.url,
    });

    if (!pathIdParam) {
      logDev("warn", `${routeTag} MISSING_PATH_ID`, {
        route: routeTag,
        method,
        status: 404,
        errorId,
        userId,
        url: request.url,
      });
      return jsonError("NOT_FOUND", 404, errorId, {
        message: "Missing pathId",
        url: request.url,
      });
    }

    const pathIdValidation = z.string().uuid().safeParse(pathIdParam);
    if (!pathIdValidation.success) {
      logDev("warn", `${routeTag} INVALID_PATH_ID`, {
        route: routeTag,
        method,
        status: 400,
        errorId,
        userId,
        pathId: pathIdParam,
      });
      return jsonError("INVALID_PAYLOAD", 400, errorId, { message: "Invalid pathId" });
    }

    const pathId = pathIdValidation.data;

    const raw = await request.text();
    let body: unknown;
    try {
      body = raw ? JSON.parse(raw) : {};
    } catch {
      logDev("error", `${routeTag} INVALID_JSON`, {
        route: routeTag,
        method,
        status: 400,
        errorId,
        pathId,
        userId,
        rawPreview: raw.slice(0, 300),
      });
      return jsonError("INVALID_JSON", 400, errorId);
    }

    const parsed = scenarioPayloadSchema.safeParse(body);
    if (!parsed.success) {
      const details = parsed.error.flatten();
      logDev("error", `${routeTag} INVALID_PAYLOAD`, {
        route: routeTag,
        method,
        status: 400,
        errorId,
        pathId,
        userId,
        details,
      });
      return jsonError("INVALID_PAYLOAD", 400, errorId, { details });
    }

    const service = await getServiceRoleClientOrFallback();
    if (!service) {
      logDev("error", `${routeTag} SERVICE_CLIENT_MISSING`, {
        route: routeTag,
        method,
        status: 500,
        errorId,
        pathId,
        userId,
      });
      return jsonError("INTERNAL", 500, errorId);
    }

    const ownership = await checkOwnership(service, pathId, userId);

    if (!ownership.ok) {
      const baseLog = {
        route: routeTag,
        method,
        status: ownership.status,
        errorId,
        pathId,
        userId,
        ...ownership.info,
      };
      switch (ownership.error) {
        case "PATH_LOOKUP_FAILED":
          logDev("error", `${routeTag} PATH_LOOKUP_FAILED`, baseLog);
          return jsonError("SUPABASE", 500, errorId, { ...ownership.info });
        case "PATH_NOT_FOUND":
          logDev("warn", `${routeTag} PATH_NOT_FOUND`, baseLog);
          return jsonError("NOT_FOUND", 404, errorId, { ...ownership.info });
        case "FORBIDDEN":
          logDev("warn", `${routeTag} FORBIDDEN`, baseLog);
          return jsonError("FORBIDDEN", 403, errorId, { ...ownership.info });
        default:
          logDev("error", `${routeTag} UNKNOWN_OWNERSHIP_ERROR`, baseLog);
          return jsonError("INTERNAL", 500, errorId);
      }
    }

    const payload = parsed.data;

    let scenarioId: string | null = null;

    const { data: insertedScenario, error: insertScenarioError } = await service
      .from("parcours_scenarios")
      .insert({
        parcours_id: pathId,
        name: payload.name,
        is_active: payload.isActive ?? true,
      })
      .select("id")
      .single();

    if (insertScenarioError || !insertedScenario) {
      logDev("error", `${routeTag} SUPABASE_INSERT_SCENARIO_FAILED`, {
        route: routeTag,
        method,
        status: 500,
        errorId,
        pathId,
        userId,
        scenarioId,
        supabaseCode: insertScenarioError?.code ?? null,
        message: insertScenarioError?.message ?? null,
      });
      return jsonError("SUPABASE", 500, errorId, mapSupabaseError(insertScenarioError));
    }

    if (!insertedScenario.id || typeof insertedScenario.id !== "string") {
      logDev("error", `${routeTag} INSERT_MISSING_ID`, {
        route: routeTag,
        method,
        status: 500,
        errorId,
        pathId,
        userId,
      });
      return jsonError("SUPABASE", 500, errorId, {
        message: "Scenario insert returned no id",
      });
    }

    scenarioId = insertedScenario.id;

    const triggerTypeValid = payload.trigger.type;
    if (!triggerTypeValid) {
      logDev("warn", `${routeTag} MISSING_TRIGGER_TYPE`, {
        route: routeTag,
        method,
        status: 400,
        errorId,
        pathId,
        userId,
      });
      return jsonError("INVALID_PAYLOAD", 400, errorId, {
        message: "Trigger type is required.",
      });
    }

    const stepsToInsert: Array<{
      scenario_id: string;
      step_order: number;
      step_type: "trigger" | "condition" | "action";
      config: Record<string, unknown>;
    }> = [
      {
        scenario_id: scenarioId,
        step_order: 0,
        step_type: "trigger",
        config: {
          type: triggerTypeValid,
          ...payload.trigger.config,
        },
      },
    ];

    const hasCondition = Boolean(payload.condition);
    if (hasCondition && payload.condition) {
      if (!payload.condition.type) {
        logDev("warn", `${routeTag} MISSING_CONDITION_TYPE`, {
          route: routeTag,
          method,
          status: 400,
          errorId,
          pathId,
          userId,
        });
        return jsonError("INVALID_PAYLOAD", 400, errorId, {
          message: "Condition type is required when condition is provided.",
        });
      }
      stepsToInsert.push({
        scenario_id: scenarioId,
        step_order: 1,
        step_type: "condition",
        config: {
          type: payload.condition.type,
          ...payload.condition.config,
        },
      });
    }

    for (const [index, action] of payload.actions.entries()) {
      if (!action.type) {
        logDev("warn", `${routeTag} MISSING_ACTION_TYPE`, {
          route: routeTag,
          method,
          status: 400,
          errorId,
          pathId,
          userId,
          scenarioId,
          actionIndex: index,
        });
        return jsonError("INVALID_PAYLOAD", 400, errorId, {
          message: "Action type is required.",
          actionIndex: index,
        });
      }

      stepsToInsert.push({
        scenario_id: scenarioId,
        step_order: hasCondition ? index + 2 : index + 1,
        step_type: "action",
        config: {
          type: action.type,
          ...action.config,
        },
      });
    }

    const { error: insertStepsError } = await service
      .from("parcours_scenario_steps")
      .insert(stepsToInsert);

    if (insertStepsError) {
      logDev("error", `${routeTag} SUPABASE_INSERT_STEPS_FAILED`, {
        route: routeTag,
        method,
        status: 500,
        errorId,
        pathId,
        userId,
        scenarioId: scenarioId ?? null,
        supabaseCode: insertStepsError.code ?? null,
        message: insertStepsError.message,
      });
      return jsonError("SUPABASE", 500, errorId, mapSupabaseError(insertStepsError));
    }

    const { data: scenarioRow, error: selectError } = await service
      .from("parcours_scenarios")
      .select(
        "id, name, is_active, created_at, parcours_scenario_steps(id, step_order, step_type, config, created_at)",
      )
      .eq("id", scenarioId)
      .single();

    if (selectError || !scenarioRow) {
      logDev("error", `${routeTag} SUPABASE_SELECT_FAILED`, {
        route: routeTag,
        method,
        status: 500,
        errorId,
        pathId,
        userId,
        scenarioId: scenarioId ?? null,
        supabaseCode: selectError?.code ?? null,
        message: selectError?.message ?? null,
      });
      return jsonError("SUPABASE", 500, errorId, mapSupabaseError(selectError));
    }

    logDev("info", `${routeTag} SUCCESS`, {
      route: routeTag,
      method,
      status: 201,
      pathId,
      scenarioId,
      userId,
    });

    return NextResponse.json(
      { ok: true, scenario: normalizeScenarioRow(scenarioRow) },
      { status: 201 },
    );
  } catch (err) {
    logDev("error", `${routeTag} INTERNAL`, {
      route: routeTag,
      method,
      status: 500,
      errorId,
      message: String((err as Error)?.message ?? err),
      stack: isDev ? String((err as Error)?.stack ?? "") : undefined,
    });
    return jsonError("INTERNAL", 500, errorId);
  }
}

