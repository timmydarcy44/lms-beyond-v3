type RawStep = {
  id: string;
  step_order: number | null;
  step_type: "trigger" | "condition" | "action";
  config: Record<string, unknown>;
  created_at?: string | null;
};

type RawScenario = {
  id: string;
  name: string | null;
  is_active: boolean | null;
  created_at: string | null;
  parcours_scenario_steps: RawStep[] | null;
};

export type ScenarioStep = {
  id: string;
  stepOrder: number;
  stepType: "trigger" | "condition" | "action";
  config: Record<string, unknown>;
  createdAt: string | null;
};

export type NormalizedScenario = {
  id: string;
  name: string;
  isActive: boolean;
  createdAt: string;
  steps: ScenarioStep[];
};

const coerceStepOrder = (value: number | null | undefined, fallback: number) => {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
};

const ensureRecord = (value: unknown): Record<string, unknown> =>
  value && typeof value === "object" ? (value as Record<string, unknown>) : {};

export const normalizeScenarioRow = (row: RawScenario): NormalizedScenario => {
  const steps: ScenarioStep[] =
    row.parcours_scenario_steps
      ?.map((step, index) => ({
        id: step.id,
        stepOrder: coerceStepOrder(step.step_order, index),
        stepType: step.step_type,
        config: ensureRecord(step.config),
        createdAt: step.created_at ?? null,
      }))
      .sort((a, b) => a.stepOrder - b.stepOrder) ?? [];

  return {
    id: row.id,
    name: row.name ?? "Scénario sans nom",
    isActive: row.is_active ?? false,
    createdAt: row.created_at ?? new Date().toISOString(),
    steps,
  };
};
