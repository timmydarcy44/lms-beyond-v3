"use client";

import { Trash2 } from "lucide-react";
import { useMemo } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  actionTypeSchema,
  conditionTypeSchema,
  triggerTypeSchema,
  type ActionDefinition,
  type ConditionDefinition,
  type TriggerDefinition,
} from "@/lib/parcours/scenarios/schema";
import { cn } from "@/lib/utils";
import { ZapierRail } from "@/components/formateur/path-scenarios/zapier-rail";

export type ScenarioBuilderAvailableContent = {
  courses: Array<{ id: string; title: string }>;
  tests: Array<{ id: string; title: string }>;
  resources: Array<{ id: string; title: string }>;
};

export type ScenarioBuilderValue = {
  trigger: TriggerDefinition;
  hasCondition: boolean;
  condition: ConditionDefinition | null;
  actions: ActionDefinition[];
};

type ScenarioBuilderProps = {
  value: ScenarioBuilderValue;
  onChange: (value: ScenarioBuilderValue) => void;
  availableContent: ScenarioBuilderAvailableContent;
  disabled?: boolean;
};

export const clampNumber = (value: number, min: number, max: number) =>
  Number.isFinite(value) ? Math.min(Math.max(value, min), max) : min;

export const getDefaultTriggerConfig = (
  type: TriggerDefinition["type"],
  content: ScenarioBuilderAvailableContent,
) => {
  switch (type) {
    case "formation_completed":
      return { formationId: content.courses[0]?.id ?? "" };
    case "test_scored":
      return { testId: content.tests[0]?.id ?? "" };
    case "inactive_days":
      return { days: 7 };
    default:
      return {};
  }
};

export const getDefaultActionConfig = (
  type: ActionDefinition["type"],
  content: ScenarioBuilderAvailableContent,
) => {
  switch (type) {
    case "unlock_test":
      return { testId: content.tests[0]?.id ?? "" };
    case "unlock_resource":
      return { resourceId: content.resources[0]?.id ?? "" };
    case "send_message":
      return {
        message:
          "Bravo 🎉 Tu viens de débloquer une nouvelle étape du parcours. Continue à ton rythme, on reste à tes côtés !",
      };
    default:
      return {};
  }
};

const triggerTypeLabels: Record<TriggerDefinition["type"], string> = {
  formation_completed: "Quand une formation est terminée",
  test_scored: "Quand un test atteint un score",
  inactive_days: "Après une période d’inactivité",
};

const conditionTypeLabels: Record<ConditionDefinition["type"], string> = {
  score_gte: "Si le score est supérieur ou égal à…",
  days_gte: "Si le nombre de jours est supérieur ou égal à…",
};

const actionTypeLabels: Record<ActionDefinition["type"], string> = {
  unlock_test: "Débloquer un test",
  unlock_resource: "Débloquer une ressource",
  send_message: "Envoyer un message",
};

export function ScenarioBuilder({
  value,
  onChange,
  availableContent,
  disabled,
}: ScenarioBuilderProps) {
  const emit = (partial: Partial<ScenarioBuilderValue>) => {
    onChange({ ...value, ...partial });
  };

  const handleTriggerTypeChange = (type: TriggerDefinition["type"]) => {
    emit({
      trigger: {
        type,
        config: getDefaultTriggerConfig(type, availableContent),
      },
    });
  };

  const handleTriggerConfigChange = (config: Record<string, unknown>) => {
    emit({
      trigger: {
        ...value.trigger,
        config: {
          ...value.trigger.config,
          ...config,
        },
      },
    });
  };

  const handleConditionToggle = (next: boolean) => {
    emit({
      hasCondition: next,
      condition: next
        ? value.condition ?? {
            type: "score_gte",
            config: { value: 80 },
          }
        : null,
    });
  };

  const handleConditionTypeChange = (type: ConditionDefinition["type"]) => {
    emit({
      condition: value.condition
        ? {
            type,
            config: { value: (value.condition.config as any)?.value ?? 0 },
          }
        : {
            type,
            config: { value: 0 },
          },
    });
  };

  const handleConditionValueChange = (nextValue: number) => {
    if (!value.condition) return;
    emit({
      condition: {
        ...value.condition,
        config: { value: nextValue },
      },
    });
  };

  const handleActionTypeChange = (index: number, type: ActionDefinition["type"]) => {
    emit({
      actions: value.actions.map((action, idx) =>
        idx === index
          ? {
              type,
              config: getDefaultActionConfig(type, availableContent),
            }
          : action,
      ),
    });
  };

  const handleActionConfigChange = (index: number, config: Record<string, unknown>) => {
    emit({
      actions: value.actions.map((action, idx) =>
        idx === index
          ? {
              ...action,
              config: {
                ...action.config,
                ...config,
              },
            }
          : action,
      ),
    });
  };

  const handleAddAction = () => {
    const fallbackType: ActionDefinition["type"] =
      actionTypeSchema.options.find((option) => option !== "send_message") ?? "send_message";
    const newActionType: ActionDefinition["type"] =
      value.actions[value.actions.length - 1]?.type ?? fallbackType;
    emit({
      actions: [
        ...value.actions,
        {
          type: newActionType,
          config: getDefaultActionConfig(newActionType, availableContent),
        },
      ],
    });
  };

  const handleRemoveAction = (index: number) => {
    if (value.actions.length === 1) {
      return;
    }
    emit({
      actions: value.actions.filter((_, idx) => idx !== index),
    });
  };

  const triggerContent = (
    <div className="space-y-4 text-white">
      <Select
        value={value.trigger.type}
        onValueChange={(next) => handleTriggerTypeChange(next as TriggerDefinition["type"])}
        disabled={disabled}
      >
        <SelectTrigger className="border-white/10 bg-white/[0.05] text-white">
          <SelectValue placeholder="Choisir un déclencheur" />
        </SelectTrigger>
        <SelectContent className="z-[11050] border-white/10 bg-[#101726] text-white">
          {triggerTypeSchema.options.map((option) => (
            <SelectItem key={option} value={option}>
              {triggerTypeLabels[option]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {value.trigger.type === "formation_completed" ? (
        <div className="space-y-2">
          <Label className="text-xs uppercase tracking-[0.28em] text-white/45">
            Formation concernée
          </Label>
          <Select
            value={String((value.trigger.config as any)?.formationId ?? "")}
            onValueChange={(next) => handleTriggerConfigChange({ formationId: next })}
            disabled={disabled}
          >
            <SelectTrigger className="border-white/10 bg-white/[0.04] text-white">
              <SelectValue placeholder="Sélectionner une formation" />
            </SelectTrigger>
          <SelectContent className="z-[11050] border-white/10 bg-[#101726] text-white">
              {availableContent.courses.length === 0 ? (
                <div className="px-3 py-2 text-xs text-white/60">
                  Ajoutez ou reliez une formation à ce parcours.
                </div>
              ) : (
                availableContent.courses.map((course) => (
                  <SelectItem key={course.id} value={course.id}>
                    {course.title}
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
        </div>
      ) : null}

      {value.trigger.type === "test_scored" ? (
        <div className="space-y-2">
          <Label className="text-xs uppercase tracking-[0.28em] text-white/45">
            Test concerné
          </Label>
          <Select
            value={String((value.trigger.config as any)?.testId ?? "")}
            onValueChange={(next) => handleTriggerConfigChange({ testId: next })}
            disabled={disabled}
          >
            <SelectTrigger className="border-white/10 bg-white/[0.04] text-white">
              <SelectValue placeholder="Sélectionner un test" />
            </SelectTrigger>
          <SelectContent className="z-[11050] border-white/10 bg-[#101726] text-white">
              {availableContent.tests.length === 0 ? (
                <div className="px-3 py-2 text-xs text-white/60">
                  Ajoutez ou reliez un test à ce parcours.
                </div>
              ) : (
                availableContent.tests.map((test) => (
                  <SelectItem key={test.id} value={test.id}>
                    {test.title}
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
        </div>
      ) : null}

      {value.trigger.type === "inactive_days" ? (
        <div className="space-y-2">
          <Label className="text-xs uppercase tracking-[0.28em] text-white/45">
            Nombre de jours d’inactivité
          </Label>
          <Input
            type="number"
            min={1}
            max={365}
            value={(value.trigger.config as any)?.days ?? 7}
            onChange={(event) =>
              handleTriggerConfigChange({
                days: clampNumber(Number(event.target.value ?? 1), 1, 365),
              })
            }
            disabled={disabled}
            className="border-white/10 bg-white/[0.04] text-white placeholder:text-white/35"
          />
        </div>
      ) : null}
    </div>
  );

  const conditionContent = value.hasCondition && value.condition ? (
    <div className="space-y-3 text-white">
      <div className="flex items-center justify-between rounded-lg border border-white/15 bg-white/[0.04] px-3 py-2">
        <span className="text-xs uppercase tracking-[0.3em] text-white/45">
          Activer le filtre
        </span>
        <Switch
          checked={value.hasCondition}
          onCheckedChange={(next) => handleConditionToggle(next)}
          disabled={disabled}
        />
      </div>
      <Select
        value={value.condition.type}
        onValueChange={(next) => handleConditionTypeChange(next as ConditionDefinition["type"])}
        disabled={disabled}
      >
        <SelectTrigger className="border-white/10 bg-white/[0.04] text-white">
          <SelectValue placeholder="Choisir une condition" />
        </SelectTrigger>
        <SelectContent className="z-[11050] border-white/10 bg-[#101726] text-white">
          {conditionTypeSchema.options.map((option) => (
            <SelectItem key={option} value={option}>
              {conditionTypeLabels[option]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Input
        type="number"
        value={(value.condition.config as any)?.value ?? 0}
        onChange={(event) => handleConditionValueChange(Number(event.target.value ?? 0))}
        disabled={disabled}
        className="border-white/10 bg-white/[0.04] text-white placeholder:text-white/35"
      />
    </div>
  ) : null;

  const actionsContent = (
    <div className="space-y-4">
      {value.actions.map((action, index) => (
        <div
          key={index}
          className={cn(
            "space-y-3 rounded-2xl border border-white/10 bg-white/[0.05] p-4",
            "shadow-inner shadow-black/10 text-white",
          )}
        >
          <div className="flex items-start justify-between gap-2">
            <div className="flex flex-col gap-1">
              <span className="text-xs font-semibold uppercase tracking-[0.28em] text-white/45">
                Action {index + 1}
              </span>
              <Select
                value={action.type}
                onValueChange={(next) => handleActionTypeChange(index, next as ActionDefinition["type"])}
                disabled={disabled}
              >
                <SelectTrigger className="border-white/10 bg-white/[0.04] text-white">
                  <SelectValue placeholder="Choisir une action" />
                </SelectTrigger>
                <SelectContent className="z-[11050] border-white/10 bg-[#101726] text-white">
                  {actionTypeSchema.options.map((option) => (
                    <SelectItem key={option} value={option}>
                      {actionTypeLabels[option]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-full border border-white/10 text-white/60 hover:border-white/25 hover:text-white"
              onClick={() => handleRemoveAction(index)}
              disabled={disabled || value.actions.length <= 1}
              aria-label={`Supprimer l'action ${index + 1}`}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>

          {action.type === "unlock_test" ? (
            <div className="space-y-2">
              <Label className="text-xs uppercase tracking-[0.28em] text-white/45">
                Test à débloquer
              </Label>
              <Select
                value={String((action.config as any)?.testId ?? "")}
                onValueChange={(next) => handleActionConfigChange(index, { testId: next })}
                disabled={disabled}
              >
                <SelectTrigger className="border-white/10 bg-white/[0.04] text-white">
                  <SelectValue placeholder="Sélectionner un test" />
                </SelectTrigger>
                <SelectContent className="z-[11050] border-white/10 bg-[#101726] text-white">
                  {availableContent.tests.length === 0 ? (
                    <div className="px-3 py-2 text-xs text-white/60">
                      Ajoutez un test pour l’utiliser dans cette action.
                    </div>
                  ) : (
                    availableContent.tests.map((test) => (
                      <SelectItem key={test.id} value={test.id}>
                        {test.title}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
          ) : null}

          {action.type === "unlock_resource" ? (
            <div className="space-y-2">
              <Label className="text-xs uppercase tracking-[0.28em] text-white/45">
                Ressource à débloquer
              </Label>
              <Select
                value={String((action.config as any)?.resourceId ?? "")}
                onValueChange={(next) => handleActionConfigChange(index, { resourceId: next })}
                disabled={disabled}
              >
                <SelectTrigger className="border-white/10 bg-white/[0.04] text-white">
                  <SelectValue placeholder="Sélectionner une ressource" />
                </SelectTrigger>
                <SelectContent className="z-[11050] border-white/10 bg-[#101726] text-white">
                  {availableContent.resources.length === 0 ? (
                    <div className="px-3 py-2 text-xs text-white/60">
                      Ajoutez une ressource pour l’utiliser dans cette action.
                    </div>
                  ) : (
                    availableContent.resources.map((resource) => (
                      <SelectItem key={resource.id} value={resource.id}>
                        {resource.title}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
          ) : null}

          {action.type === "send_message" ? (
            <div className="space-y-2">
              <Label className="text-xs uppercase tracking-[0.28em] text-white/45">
                Message automatique
              </Label>
              <Textarea
                value={(action.config as any)?.message ?? ""}
                onChange={(event) => handleActionConfigChange(index, { message: event.target.value })}
                disabled={disabled}
                className="min-h-[120px] border-white/10 bg-white/[0.04] text-white placeholder:text-white/40"
                placeholder="Composez le message qui sera envoyé automatiquement."
              />
            </div>
          ) : null}
        </div>
      ))}
    </div>
  );

  const summary = useMemo(() => {
    const parts: string[] = [];
    if (value.trigger.type === "formation_completed") {
      const formationId = (value.trigger.config as any)?.formationId;
      const course = availableContent.courses.find((course) => course.id === formationId);
      parts.push(
        course ? `Quand la formation « ${course.title} » est terminée` : "Quand une formation est terminée",
      );
    } else if (value.trigger.type === "test_scored") {
      const testId = (value.trigger.config as any)?.testId;
      const test = availableContent.tests.find((item) => item.id === testId);
      parts.push(
        test ? `Quand le test « ${test.title} » atteint le score visé` : "Quand un test atteint le score visé",
      );
    } else if (value.trigger.type === "inactive_days") {
      const days = (value.trigger.config as any)?.days ?? 7;
      parts.push(`Après ${days} jours d’inactivité`);
    }

    if (value.hasCondition && value.condition) {
      const threshold = (value.condition.config as any)?.value ?? 0;
      if (value.condition.type === "score_gte") {
        parts.push(`si le score est ≥ ${threshold}%`);
      } else if (value.condition.type === "days_gte") {
        parts.push(`si le nombre de jours est ≥ ${threshold}`);
      }
    }

    if (value.actions.length > 0) {
      const actionDescriptions = value.actions.map((action) => {
        switch (action.type) {
          case "unlock_test": {
            const testId = (action.config as any)?.testId;
            const test = availableContent.tests.find((item) => item.id === testId);
            return test ? `débloquer le test « ${test.title} »` : "débloquer un test";
          }
          case "unlock_resource": {
            const resourceId = (action.config as any)?.resourceId;
            const resource = availableContent.resources.find((item) => item.id === resourceId);
            return resource ? `débloquer la ressource « ${resource.title} »` : "débloquer une ressource";
          }
          case "send_message":
            return "envoyer un message personnalisé";
          default:
            return "exécuter une action";
        }
      });

      if (actionDescriptions.length === 1) {
        parts.push(`alors ${actionDescriptions[0]}`);
      } else if (actionDescriptions.length > 1) {
        parts.push(
          `alors ${actionDescriptions[0]} (+${actionDescriptions.length - 1} action${
            actionDescriptions.length - 1 > 1 ? "s" : ""
          })`,
        );
      }
    }

    return parts.join(" → ");
  }, [value, availableContent]);

  return (
    <div className="space-y-6">
      <ZapierRail
        trigger={triggerContent}
        condition={value.hasCondition ? conditionContent : null}
        hasCondition={value.hasCondition}
        canAddAction={!disabled && value.actions.length < 10}
        conditionToggleDisabled={Boolean(disabled)}
        actions={actionsContent}
        onAddCondition={() =>
          !disabled &&
          emit({
            hasCondition: true,
            condition:
              value.condition ??
              ({
                type: "score_gte",
                config: { value: 80 },
              } satisfies ConditionDefinition),
          })
        }
        onRemoveCondition={() => !disabled && emit({ hasCondition: false, condition: null })}
        onAddAction={() => {
          if (disabled || value.actions.length >= 10) return;
          handleAddAction();
        }}
      />

      <div className="rounded-2xl border border-white/10 bg-white/[0.05] p-4 text-sm text-white/70">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-white/45">Résumé</p>
        <p className="mt-2 text-white/70">
          {summary ||
            "Le résumé du flow se mettra à jour automatiquement quand vous aurez sélectionné un déclencheur et des actions."}
        </p>
      </div>
    </div>
  );
}


