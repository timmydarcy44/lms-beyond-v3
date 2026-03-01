import { z } from "zod";

export const triggerTypeSchema = z.enum([
  "formation_completed",
  "test_scored",
  "inactive_days",
]);

export const conditionTypeSchema = z.enum(["score_gte", "days_gte"]);

export const actionTypeSchema = z.enum([
  "unlock_test",
  "unlock_resource",
  "send_message",
]);

export const triggerSchema = z.object({
  type: triggerTypeSchema,
  config: z
    .object({
      formationId: z.string().uuid().optional(),
      testId: z.string().uuid().optional(),
      days: z.number().optional(),
    })
    .passthrough()
    .default({}),
});

export const conditionSchema = z.object({
  type: conditionTypeSchema,
  config: z.object({
    value: z.number(),
  }),
});

export const actionSchema = z.object({
  type: actionTypeSchema,
  config: z
    .object({
      testId: z.string().uuid().optional(),
      resourceId: z.string().uuid().optional(),
      message: z.string().optional(),
    })
    .passthrough()
    .default({}),
});

export const actionsListSchema = z
  .array(actionSchema)
  .min(1, "Ajoutez au moins une action.")
  .max(10, "Limite de 10 actions par scénario (MVP).");

export const scenarioPayloadSchema = z.object({
  name: z.string().min(1, "Le nom du scénario est requis"),
  isActive: z.boolean().optional(),
  trigger: triggerSchema,
  condition: conditionSchema.optional().nullable(),
  actions: actionsListSchema,
});

export const parcoursEventSchema = z.object({
  parcoursId: z.string().uuid(),
  learnerId: z.string().uuid(),
  eventType: triggerTypeSchema,
  payload: z.record(z.string(), z.any()).optional().default({}),
});

export type TriggerDefinition = z.infer<typeof triggerSchema>;
export type ConditionDefinition = z.infer<typeof conditionSchema>;
export type ActionDefinition = z.infer<typeof actionSchema>;
export type ScenarioPayloadInput = z.infer<typeof scenarioPayloadSchema>;
export type ParcoursEventInput = z.infer<typeof parcoursEventSchema>;


