import { getServiceRoleClientOrFallback } from "@/lib/supabase/server";

import type {
  ActionDefinition,
  ConditionDefinition,
  ParcoursEventInput,
  TriggerDefinition,
} from "./schema";
import {
  actionTypeSchema,
  conditionTypeSchema,
  triggerTypeSchema,
} from "./schema";

type ScenarioStep = {
  id: string;
  step_type: "trigger" | "condition" | "action";
  step_order: number;
  config: Record<string, unknown>;
};

/**
 * Each step config persisted in `parcours_scenario_steps.config` follows
 * `{ type: "<enum>", ...payload }`.
 * Example:
 *   Trigger:   { "type": "test_scored", "testId": "<uuid>" }
 *   Condition: { "type": "score_gte", "value": 80 }
 *   Action:    { "type": "unlock_resource", "resourceId": "<uuid>" }
 * Legacy rows missing `type` are ignored safely.
 */

type EvaluatorEvent = ParcoursEventInput & { id: string };

const normalizeConfig = (raw: unknown): Record<string, unknown> => {
  if (!raw) return {};
  if (typeof raw === "string") {
    try {
      return JSON.parse(raw) as Record<string, unknown>;
    } catch {
      return {};
    }
  }
  if (typeof raw === "object") {
    return raw as Record<string, unknown>;
  }
  return {};
};

const extractNumeric = (value: unknown): number | null => {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Number.parseFloat(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
};

const normalizeTriggerType = (
  value: unknown,
): TriggerDefinition["type"] | null => {
  if (typeof value !== "string") return null;
  if (triggerTypeSchema.options.includes(value as never)) {
    return value as TriggerDefinition["type"];
  }
  switch (value) {
    case "test_completed":
      return "test_scored";
    case "resource_opened":
      return null;
    default:
      return null;
  }
};

const buildTrigger = (rawConfig: Record<string, unknown>): TriggerDefinition | null => {
  const type = normalizeTriggerType(rawConfig.type);
  if (!type) return null;

  return {
    type,
    config: {
      formationId:
        typeof rawConfig.formationId === "string" ? rawConfig.formationId : undefined,
      testId: typeof rawConfig.testId === "string" ? rawConfig.testId : undefined,
      days: extractNumeric(rawConfig.days) ?? undefined,
    },
  };
};

const buildCondition = (
  rawConfig: Record<string, unknown>,
): ConditionDefinition | null => {
  const rawType = typeof rawConfig.type === "string" ? rawConfig.type : null;
  if (!rawType) return null;

  const parsedType = conditionTypeSchema.safeParse(rawType);
  if (!parsedType.success) return null;

  const value = extractNumeric(rawConfig.value);
  if (value === null) return null;

  return {
    type: parsedType.data,
    config: {
      value,
    },
  };
};

const normalizeActionType = (
  value: unknown,
): ActionDefinition["type"] | null => {
  if (typeof value !== "string") return null;
  if (actionTypeSchema.options.includes(value as never)) {
    return value as ActionDefinition["type"];
  }
  if (value === "unlock_formation") {
    return null;
  }
  return null;
};

const buildAction = (rawConfig: Record<string, unknown>): ActionDefinition | null => {
  const type = normalizeActionType(rawConfig.type);
  if (!type) return null;

  return {
    type,
    config: {
      testId: typeof rawConfig.testId === "string" ? rawConfig.testId : undefined,
      resourceId:
        typeof rawConfig.resourceId === "string" ? rawConfig.resourceId : undefined,
      message: typeof rawConfig.message === "string" ? rawConfig.message : undefined,
    },
  };
};

const doesTriggerMatch = (
  trigger: TriggerDefinition,
  event: EvaluatorEvent,
): boolean => {
  if (trigger.type !== event.eventType) {
    return false;
  }

  const payload = (event.payload ?? {}) as Record<string, unknown>;
  const asString = (value: unknown): string | null =>
    typeof value === "string" && value.trim() ? value : null;

  switch (trigger.type) {
    case "formation_completed": {
      const expected = trigger.config?.formationId;
      if (!expected) return true;
      const actual =
        asString(payload["formationId"]) ?? asString(payload["formation_id"]);
      return actual ? actual === expected : false;
    }
    case "test_scored": {
      const expected = trigger.config?.testId;
      if (!expected) return true;
      const actual = asString(payload["testId"]) ?? asString(payload["test_id"]);
      return actual ? actual === expected : false;
    }
    case "inactive_days": {
      const threshold = trigger.config?.days ?? null;
      if (threshold === null || threshold <= 0) return true;
      const actual = extractNumeric(payload["days"]);
      if (actual === null) return false;
      return actual >= threshold;
    }
    default:
      return false;
  }
};

const checkCondition = (
  condition: ConditionDefinition | null,
  event: EvaluatorEvent,
): boolean => {
  if (!condition) return true;

  const payload = (event.payload ?? {}) as Record<string, unknown>;
  const threshold = condition.config.value;

  switch (condition.type) {
    case "score_gte": {
      const score = extractNumeric(payload["score"]);
      if (score === null) return false;
      return score >= threshold;
    }
    case "days_gte": {
      const days = extractNumeric(payload["days"]);
      if (days === null) return false;
      return days >= threshold;
    }
    default:
      return true;
  }
};

const ensureUnlock = async (
  supabase: Awaited<ReturnType<typeof getServiceRoleClientOrFallback>>,
  parcoursId: string,
  learnerId: string,
  contentType: "test" | "resource",
  contentId: string,
) => {
  if (!supabase) return false;

  const { data: existing } = await supabase
    .from("parcours_unlocks")
    .select("id")
    .eq("parcours_id", parcoursId)
    .eq("learner_id", learnerId)
    .eq("content_type", contentType)
    .eq("content_id", contentId)
    .maybeSingle();

  if (existing) return false;

  await supabase.from("parcours_unlocks").insert({
    parcours_id: parcoursId,
    learner_id: learnerId,
    content_type: contentType,
    content_id: contentId,
  });
  return true;
};

const executeAction = async (
  supabase: Awaited<ReturnType<typeof getServiceRoleClientOrFallback>>,
  action: ActionDefinition,
  parcoursId: string,
  learnerId: string,
  senderId: string | null,
) => {
  if (!supabase) return false;

  switch (action.type) {
    case "unlock_test": {
      const testId = action.config?.testId;
      if (!testId) return false;
      await ensureUnlock(supabase, parcoursId, learnerId, "test", testId);
      return true;
    }
    case "unlock_resource": {
      const resourceId = action.config?.resourceId;
      if (!resourceId) return false;
      await ensureUnlock(supabase, parcoursId, learnerId, "resource", resourceId);
      return true;
    }
    case "send_message": {
      const messageText = action.config?.message?.trim();
      if (!messageText || !senderId) return false;

      const [{ data: senderProfile }, { data: learnerProfile }] = await Promise.all([
        supabase
          .from("profiles")
          .select("id, full_name, first_name, last_name, display_name, email, role")
          .eq("id", senderId)
          .maybeSingle(),
        supabase
          .from("profiles")
          .select("id, full_name, first_name, last_name, display_name, email, role")
          .eq("id", learnerId)
          .maybeSingle(),
      ]);

      const senderName =
        senderProfile?.full_name?.trim() ||
        [senderProfile?.first_name, senderProfile?.last_name]
          .filter((part): part is string => Boolean(part && part.trim()))
          .join(" ")
          .trim() ||
        senderProfile?.display_name?.trim() ||
        senderProfile?.email?.trim() ||
        "Système";

      const recipientName =
        learnerProfile?.full_name?.trim() ||
        [learnerProfile?.first_name, learnerProfile?.last_name]
          .filter((part): part is string => Boolean(part && part.trim()))
          .join(" ")
          .trim() ||
        learnerProfile?.display_name?.trim() ||
        learnerProfile?.email?.trim() ||
        "Apprenant";

      const { data: message } = await supabase
        .from("messages")
        .insert({
          sender_id: senderId,
          type: "message",
          content: messageText,
          body: messageText,
          metadata: {
            senderId,
            senderName,
            senderRole: senderProfile?.role ?? "formateur",
            recipientId: learnerId,
            recipientName,
            recipientRole: learnerProfile?.role ?? "learner",
          },
        })
        .select("id")
        .single();

      if (!message) return false;

      await supabase.from("message_recipients").insert({
        message_id: message.id,
        recipient_id: learnerId,
        read: false,
      });

      return true;
    }
    default:
      return false;
  }
};

export async function evaluateParcoursScenarios(
  parcoursId: string,
  learnerId: string,
  event: EvaluatorEvent,
) {
  const supabase = await getServiceRoleClientOrFallback();
  if (!supabase) {
    console.warn("[scenarios] Service client indisponible, évaluation annulée.");
    return;
  }

  const { data: path } = await supabase
    .from("paths")
    .select("id, owner_id, creator_id")
    .eq("id", parcoursId)
    .maybeSingle();

  if (!path) {
    console.warn("[scenarios] Parcours introuvable, id:", parcoursId);
    return;
  }

  const senderId = path.owner_id ?? path.creator_id ?? null;

  const { data: scenarios } = await supabase
    .from("parcours_scenarios")
    .select(
      "id, is_active, parcours_scenario_steps(id, step_type, step_order, config)",
    )
    .eq("parcours_id", parcoursId)
    .eq("is_active", true);

  if (!scenarios || scenarios.length === 0) {
    return;
  }

  for (const scenario of scenarios) {
    const steps: ScenarioStep[] =
      scenario.parcours_scenario_steps
        ?.map((step) => ({
          id: step.id as string,
          step_type: step.step_type as ScenarioStep["step_type"],
          step_order: step.step_order ?? 0,
          config: normalizeConfig(step.config),
        }))
        ?.sort((a, b) => a.step_order - b.step_order) ?? [];

    const triggerStep = steps.find((step) => step.step_type === "trigger");
    if (!triggerStep) continue;

    const trigger = buildTrigger(triggerStep.config);
    if (!trigger) continue;

    if (!doesTriggerMatch(trigger, event)) {
      continue;
    }

    const conditionStep = steps.find((step) => step.step_type === "condition");
    const condition = conditionStep ? buildCondition(conditionStep.config) : null;
    if (!checkCondition(condition, event)) {
      continue;
    }

    const actionSteps = steps.filter((step) => step.step_type === "action");
    for (const actionStep of actionSteps) {
      const action = buildAction(actionStep.config);
      if (!action) continue;

      const { data: existingRun } = await supabase
        .from("parcours_scenario_runs")
        .select("id")
        .eq("scenario_id", scenario.id as string)
        .eq("step_id", actionStep.id)
        .eq("event_id", event.id)
        .maybeSingle();

      if (existingRun) {
        continue;
      }

      const executed = await executeAction(
        supabase,
        action,
        parcoursId,
        learnerId,
        senderId,
      );

      if (executed) {
        await supabase.from("parcours_scenario_runs").insert({
          scenario_id: scenario.id as string,
          learner_id: learnerId,
          step_id: actionStep.id,
          event_id: event.id,
          executed_at: new Date().toISOString(),
        });
      }
    }
  }
}


