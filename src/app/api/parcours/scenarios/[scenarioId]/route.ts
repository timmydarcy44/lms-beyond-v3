import crypto from "node:crypto";
import { NextRequest, NextResponse } from "next/server";

import { jsonError } from "@/lib/api/api-error";
import { normalizeScenarioRow } from "@/lib/parcours/scenarios/serializer";
import { scenarioPayloadSchema } from "@/lib/parcours/scenarios/schema";
import {
  getServerClient,
  getServiceRoleClientOrFallback,
} from "@/lib/supabase/server";

type RouteParams = {
  params: Promise<{ scenarioId: string }>;
};

type OwnershipResult =
  | {
      ok: true;
      scenarioId: string;
      parcoursId: string;
      ownerId: string | null;
      creatorId: string | null;
      isOwner: boolean;
      isCreator: boolean;
    }
  | {
      ok: false;
      status: number;
      error:
        | "SCENARIO_NOT_FOUND"
        | "SCENARIO_LOOKUP_FAILED"
        | "PATH_LOOKUP_FAILED"
        | "FORBIDDEN";
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

const getScenarioOwnership = async (
  service: NonNullable<Awaited<ReturnType<typeof getServiceRoleClientOrFallback>>>,
  scenarioId: string,
  userId: string,
): Promise<OwnershipResult> => {
  const { data: scenario, error: scenarioError } = await service
    .from("parcours_scenarios")
    .select("id, parcours_id")
    .eq("id", scenarioId)
    .maybeSingle();

  if (scenarioError) {
    return {
      ok: false,
      status: 500,
      error: "SCENARIO_LOOKUP_FAILED",
      info: { scenarioId, message: scenarioError.message },
    };
  }

  if (!scenario) {
    return {
      ok: false,
      status: 404,
      error: "SCENARIO_NOT_FOUND",
      info: { scenarioId },
    };
  }

  const { data: path, error: pathError } = await service
    .from("paths")
    .select("id, owner_id, creator_id")
    .eq("id", scenario.parcours_id)
    .maybeSingle();

  if (pathError) {
    return {
      ok: false,
      status: 500,
      error: "PATH_LOOKUP_FAILED",
      info: { scenarioId, pathId: scenario.parcours_id, message: pathError.message },
    };
  }

  if (!path) {
    return {
      ok: false,
      status: 404,
      error: "PATH_LOOKUP_FAILED",
      info: { scenarioId, pathId: scenario.parcours_id },
    };
  }

  const ownerId = path.owner_id as string | null;
  const creatorId = path.creator_id as string | null;
  const isOwner = ownerId === userId;
  const isCreator = creatorId === userId;

  if (!isOwner && !isCreator) {
    return {
      ok: false,
      status: 403,
      error: "FORBIDDEN",
      info: { scenarioId, pathId: scenario.parcours_id, ownerId, creatorId, userId },
    };
  }

  return {
    ok: true,
    scenarioId: scenario.id as string,
    parcoursId: scenario.parcours_id as string,
    ownerId,
    creatorId,
    isOwner,
    isCreator,
  };
};

export async function PUT(request: NextRequest, { params }: RouteParams) {
  const errorId = crypto.randomUUID();
  const routeTag = "[scenarios PUT]";
  const { scenarioId } = await params;
  const method = "PUT";

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

    const service = await getServiceRoleClientOrFallback();
    if (!service) {
      logDev("error", `${routeTag} SERVICE_CLIENT_MISSING`, {
        route: routeTag,
        method,
        status: 500,
        errorId,
        scenarioId,
        userId,
      });
      return jsonError("INTERNAL", 500, errorId);
    }

    const ownership = await getScenarioOwnership(service, scenarioId, userId);
    if (!ownership.ok) {
      const baseLog = {
        route: routeTag,
        method,
        status: ownership.status,
        errorId,
        scenarioId,
        userId,
        ...ownership.info,
      };
      switch (ownership.error) {
        case "SCENARIO_LOOKUP_FAILED":
        case "PATH_LOOKUP_FAILED":
          logDev("error", `${routeTag} ${ownership.error}`, baseLog);
          return jsonError("SUPABASE", ownership.status, errorId, { ...ownership.info });
        case "SCENARIO_NOT_FOUND":
          logDev("warn", `${routeTag} SCENARIO_NOT_FOUND`, baseLog);
          return jsonError("NOT_FOUND", 404, errorId, { ...ownership.info });
        case "FORBIDDEN":
          logDev("warn", `${routeTag} FORBIDDEN`, baseLog);
          return jsonError("FORBIDDEN", 403, errorId, { ...ownership.info });
        default:
          logDev("error", `${routeTag} UNKNOWN_OWNERSHIP_ERROR`, baseLog);
          return jsonError("INTERNAL", 500, errorId);
      }
    }

    const pathId = ownership.parcoursId;

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
        scenarioId,
        userId,
        pathId,
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
        scenarioId,
        userId,
        pathId,
        details,
      });
      return jsonError("INVALID_PAYLOAD", 400, errorId, { details });
    }

    const payload = parsed.data;

    const { error: updateError } = await service
      .from("parcours_scenarios")
      .update({
        name: payload.name,
        is_active: payload.isActive ?? true,
      })
      .eq("id", scenarioId);

    if (updateError) {
      logDev("error", `${routeTag} SUPABASE_UPDATE_FAILED`, {
        route: routeTag,
        method,
        status: 500,
        errorId,
        scenarioId,
        userId,
        pathId,
        supabaseCode: updateError.code ?? null,
        message: updateError.message,
      });
      return jsonError("SUPABASE", 500, errorId, mapSupabaseError(updateError));
    }

    const { error: deleteError } = await service
      .from("parcours_scenario_steps")
      .delete()
      .eq("scenario_id", scenarioId);

    if (deleteError) {
      logDev("error", `${routeTag} SUPABASE_DELETE_STEPS_FAILED`, {
        route: routeTag,
        method,
        status: 500,
        errorId,
        scenarioId,
        userId,
        pathId,
        supabaseCode: deleteError.code ?? null,
        message: deleteError.message,
      });
      return jsonError("SUPABASE", 500, errorId, mapSupabaseError(deleteError));
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
          type: payload.trigger.type,
          ...payload.trigger.config,
        },
      },
    ];

    const hasCondition = Boolean(payload.condition);
    if (hasCondition && payload.condition) {
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

    payload.actions.forEach((action, index) => {
      stepsToInsert.push({
        scenario_id: scenarioId,
        step_order: hasCondition ? index + 2 : index + 1,
        step_type: "action",
        config: {
          type: action.type,
          ...action.config,
        },
      });
    });

    const { error: insertStepsError } = await service
      .from("parcours_scenario_steps")
      .insert(stepsToInsert);

    if (insertStepsError) {
      logDev("error", `${routeTag} SUPABASE_INSERT_STEPS_FAILED`, {
        route: routeTag,
        method,
        status: 500,
        errorId,
        scenarioId,
        userId,
        pathId,
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
        scenarioId,
        userId,
        pathId,
        supabaseCode: selectError?.code ?? null,
        message: selectError?.message ?? null,
      });
      return jsonError("SUPABASE", 500, errorId, mapSupabaseError(selectError));
    }

    logDev("info", `${routeTag} SUCCESS`, {
      route: routeTag,
      method,
      status: 200,
      scenarioId,
      pathId,
      userId,
    });

    return NextResponse.json(
      { ok: true, scenario: normalizeScenarioRow(scenarioRow) },
      { status: 200 },
    );
  } catch (err) {
    logDev("error", `${routeTag} INTERNAL`, {
      route: routeTag,
      method,
      status: 500,
      errorId,
      scenarioId,
      message: String((err as Error)?.message ?? err),
      stack: isDev ? String((err as Error)?.stack ?? "") : undefined,
    });
    return jsonError("INTERNAL", 500, errorId);
  }
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const errorId = crypto.randomUUID();
  const routeTag = "[scenarios PATCH]";
  const { scenarioId } = await params;
  const method = "PATCH";

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

    const service = await getServiceRoleClientOrFallback();
    if (!service) {
      logDev("error", `${routeTag} SERVICE_CLIENT_MISSING`, {
        route: routeTag,
        method,
        status: 500,
        errorId,
        scenarioId,
        userId,
      });
      return jsonError("INTERNAL", 500, errorId);
    }

    const ownership = await getScenarioOwnership(service, scenarioId, userId);
    if (!ownership.ok) {
      const baseLog = {
        route: routeTag,
        method,
        status: ownership.status,
        errorId,
        scenarioId,
        userId,
        ...ownership.info,
      };
      switch (ownership.error) {
        case "SCENARIO_LOOKUP_FAILED":
        case "PATH_LOOKUP_FAILED":
          logDev("error", `${routeTag} ${ownership.error}`, baseLog);
          return jsonError("SUPABASE", ownership.status, errorId, { ...ownership.info });
        case "SCENARIO_NOT_FOUND":
          logDev("warn", `${routeTag} SCENARIO_NOT_FOUND`, baseLog);
          return jsonError("NOT_FOUND", 404, errorId, { ...ownership.info });
        case "FORBIDDEN":
          logDev("warn", `${routeTag} FORBIDDEN`, baseLog);
          return jsonError("FORBIDDEN", 403, errorId, { ...ownership.info });
        default:
          logDev("error", `${routeTag} UNKNOWN_OWNERSHIP_ERROR`, baseLog);
          return jsonError("INTERNAL", 500, errorId);
      }
    }

    const pathId = ownership.parcoursId;

    const raw = await request.text();
    if (!raw) {
      logDev("warn", `${routeTag} EMPTY_BODY`, {
        route: routeTag,
        method,
        status: 400,
        errorId,
        scenarioId,
        userId,
        pathId,
      });
      return jsonError("INVALID_JSON", 400, errorId, { message: "Request body is empty." });
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch (error) {
      logDev("error", `${routeTag} INVALID_JSON`, {
        route: routeTag,
        method,
        status: 400,
        errorId,
        scenarioId,
        userId,
        pathId,
        rawPreview: raw.slice(0, 300),
        parseError: error instanceof Error ? error.message : String(error),
      });
      return jsonError("INVALID_JSON", 400, errorId);
    }

    const isActive = (parsed as Record<string, unknown>)?.isActive;
    if (typeof isActive !== "boolean") {
      logDev("warn", `${routeTag} INVALID_PAYLOAD`, {
        route: routeTag,
        method,
        status: 400,
        errorId,
        scenarioId,
        userId,
        pathId,
        payloadKeys: Object.keys((parsed as Record<string, unknown>) ?? {}),
      });
      return jsonError("INVALID_PAYLOAD", 400, errorId, {
        message: "Le champ isActive est requis.",
      });
    }

    const { error: updateError } = await service
      .from("parcours_scenarios")
      .update({ is_active: isActive })
      .eq("id", scenarioId);

    if (updateError) {
      logDev("error", `${routeTag} SUPABASE_UPDATE_FAILED`, {
        route: routeTag,
        method,
        status: 500,
        errorId,
        scenarioId,
        userId,
        pathId,
        supabaseCode: updateError.code ?? null,
        message: updateError.message,
      });
      return jsonError("SUPABASE", 500, errorId, mapSupabaseError(updateError));
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
        scenarioId,
        userId,
        pathId,
        supabaseCode: selectError?.code ?? null,
        message: selectError?.message ?? null,
      });
      return jsonError("SUPABASE", 500, errorId, mapSupabaseError(selectError));
    }

    logDev("info", `${routeTag} SUCCESS`, {
      route: routeTag,
      method,
      status: 200,
      scenarioId,
      userId,
      pathId,
      isActive,
    });

    return NextResponse.json({ ok: true, scenario: normalizeScenarioRow(scenarioRow) });
  } catch (err) {
    logDev("error", `${routeTag} INTERNAL`, {
      route: routeTag,
      method,
      status: 500,
      errorId,
      scenarioId,
      message: String((err as Error)?.message ?? err),
      stack: isDev ? String((err as Error)?.stack ?? "") : undefined,
    });
    return jsonError("INTERNAL", 500, errorId);
  }
}

