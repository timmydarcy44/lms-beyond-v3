"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { ScenarioBuilder, getDefaultActionConfig, getDefaultTriggerConfig, type ScenarioBuilderAvailableContent } from "@/components/parcours/scenarios/scenario-builder";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import {
  actionTypeSchema,
  conditionTypeSchema,
  scenarioPayloadSchema,
  triggerTypeSchema,
  type ActionDefinition,
  type ConditionDefinition,
  type ScenarioPayloadInput,
  type TriggerDefinition,
} from "@/lib/parcours/scenarios/schema";
import type { NormalizedScenario } from "@/lib/parcours/scenarios/serializer";
import { z } from "zod";

const isDev = process.env.NODE_ENV !== "production";

type AvailableContent = ScenarioBuilderAvailableContent;

type ScenarioDraft = {
  id?: string;
  name: string;
  trigger: TriggerDefinition;
  hasCondition: boolean;
  condition: ConditionDefinition | null;
  actions: ActionDefinition[];
  isActive: boolean;
};

type ScenarioTemplate = {
  id: string;
  name: string;
  description: string;
  build: (content: AvailableContent) => ScenarioDraft | null;
};

type ScenariosManagerProps = {
  pathId: string;
  pathTitle: string;
  initialScenarios: NormalizedScenario[];
  availableContent: AvailableContent;
  currentUserId?: string;
  autoOpenBuilder?: boolean;
};

const createEmptyDraft = (content: AvailableContent): ScenarioDraft => {
  const defaultTriggerType: TriggerDefinition["type"] =
    content.courses.length > 0
      ? "formation_completed"
      : content.tests.length > 0
        ? "test_scored"
        : "inactive_days";
  const defaultActionType: ActionDefinition["type"] =
    content.tests.length > 0
      ? "unlock_test"
      : content.resources.length > 0
        ? "unlock_resource"
        : "send_message";

  return {
    name: "",
    trigger: {
      type: defaultTriggerType,
      config: getDefaultTriggerConfig(defaultTriggerType, content),
    },
    hasCondition: false,
    condition: null,
    actions: [
      {
        type: defaultActionType,
        config: getDefaultActionConfig(defaultActionType, content),
      },
    ],
    isActive: true,
  };
};

const buildScenarioSummary = (draft: ScenarioDraft, content: AvailableContent) => {
  const courseMap = new Map(content.courses.map((item) => [item.id, item.title]));
  const testMap = new Map(content.tests.map((item) => [item.id, item.title]));
  const resourceMap = new Map(content.resources.map((item) => [item.id, item.title]));

  const parts: string[] = [];

  switch (draft.trigger.type) {
    case "formation_completed": {
      const title = courseMap.get(String((draft.trigger.config as any)?.formationId));
      parts.push(title ? `Quand la formation « ${title} » est terminée` : "Quand une formation est terminée");
      break;
    }
    case "test_scored": {
      const title = testMap.get(String((draft.trigger.config as any)?.testId));
      parts.push(title ? `Quand le test « ${title} » atteint le score visé` : "Quand un test atteint le score visé");
      break;
    }
    case "inactive_days": {
      const days = (draft.trigger.config as any)?.days ?? 7;
      parts.push(`Après ${days} jours d’inactivité`);
      break;
    }
    default:
      break;
  }

  if (draft.hasCondition && draft.condition) {
    const threshold = (draft.condition.config as any)?.value ?? 0;
    if (draft.condition.type === "score_gte") {
      parts.push(`si le score est ≥ ${threshold}%`);
    } else if (draft.condition.type === "days_gte") {
      parts.push(`si le nombre de jours est ≥ ${threshold}`);
    }
  }

  const actionSummaries = draft.actions.map((action) => {
    switch (action.type) {
      case "unlock_test": {
        const title = testMap.get(String((action.config as any)?.testId));
        return title ? `débloquer le test « ${title} »` : "débloquer un test";
      }
      case "unlock_resource": {
        const title = resourceMap.get(String((action.config as any)?.resourceId));
        return title ? `débloquer la ressource « ${title} »` : "débloquer une ressource";
      }
      case "send_message":
        return "envoyer un message personnalisé";
      default:
        return "exécuter une action";
    }
  });

  if (actionSummaries.length === 1) {
    parts.push(`alors ${actionSummaries[0]}`);
  } else if (actionSummaries.length > 1) {
    parts.push(
      `alors ${actionSummaries[0]} (+${actionSummaries.length - 1} action${actionSummaries.length - 1 > 1 ? "s" : ""})`,
    );
  }

  return parts.join(" → ");
};

const scenarioTemplates: ScenarioTemplate[] = [
  {
    id: "formation-to-test",
    name: "Fin de formation → test",
    description: "Débloque automatiquement le test dès que la formation est terminée.",
    build: (content) => {
      if (!content.courses.length || !content.tests.length) {
        return null;
      }
      return {
        name: "Formation terminée → Test débloqué",
        trigger: {
          type: "formation_completed",
          config: { formationId: content.courses[0].id },
        },
        hasCondition: false,
        condition: null,
        actions: [
          {
            type: "unlock_test",
            config: { testId: content.tests[0].id },
          },
        ],
        isActive: true,
      };
    },
  },
  {
    id: "test-score-resource",
    name: "Score test ≥ 80% → ressource premium",
    description: "Récompense un bon score par du contenu premium.",
    build: (content) => {
      if (!content.tests.length || !content.resources.length) {
        return null;
      }
      return {
        name: "Score élevé → Ressource premium",
        trigger: {
          type: "test_scored",
          config: { testId: content.tests[0].id },
        },
        hasCondition: true,
        condition: {
          type: "score_gte",
          config: { value: 80 },
        },
        actions: [
          {
            type: "unlock_resource",
            config: { resourceId: content.resources[0].id },
          },
        ],
        isActive: true,
      };
    },
  },
  {
    id: "inactivity-message",
    name: "7 jours d’inactivité → message",
    description: "Relance automatique si l’apprenant décroche.",
    build: () => ({
      name: "Relance après inactivité",
      trigger: {
        type: "inactive_days",
        config: { days: 7 },
      },
      hasCondition: false,
      condition: null,
      actions: [
        {
          type: "send_message",
          config: {
            message:
              "Bonjour ! Cela fait quelques jours que nous n’avons pas vu de progression. Souhaitez-vous un coup de main ?",
          },
        },
      ],
      isActive: true,
    }),
  },
];

const scenarioToDraft = (scenario: NormalizedScenario, content: AvailableContent): ScenarioDraft => {
  const draft = createEmptyDraft(content);

  const triggerStep = scenario.steps.find((step) => step.stepType === "trigger");
  if (triggerStep?.config) {
    const candidateType =
      typeof triggerStep.config.type === "string" ? (triggerStep.config.type as string) : draft.trigger.type;
    const parsedType = triggerTypeSchema.safeParse(candidateType).success
      ? (candidateType as TriggerDefinition["type"])
      : draft.trigger.type;
    draft.trigger = {
      type: parsedType,
      config: {
        ...getDefaultTriggerConfig(parsedType, content),
        ...triggerStep.config,
        formationId:
          triggerStep.config.formationId ??
          triggerStep.config.formation_id ??
          (getDefaultTriggerConfig(parsedType, content) as any)?.formationId,
        testId:
          triggerStep.config.testId ??
          triggerStep.config.test_id ??
          (getDefaultTriggerConfig(parsedType, content) as any)?.testId,
        days:
          typeof triggerStep.config.days === "number"
            ? triggerStep.config.days
            : (getDefaultTriggerConfig(parsedType, content) as any)?.days,
      },
    };
  }

  const conditionStep = scenario.steps.find((step) => step.stepType === "condition");
  draft.hasCondition = Boolean(conditionStep);
  draft.condition = conditionStep
    ? {
        type: conditionTypeSchema.safeParse(conditionStep.config?.type).success
          ? (conditionStep.config.type as ConditionDefinition["type"])
          : "score_gte",
        config: {
          value: Number((conditionStep.config as any)?.value ?? 0),
        },
      }
    : null;

  const actionSteps = scenario.steps.filter((step) => step.stepType === "action");
  draft.actions =
    actionSteps.length > 0
      ? actionSteps.map((step) => {
          const candidateType =
            typeof step.config?.type === "string"
              ? (step.config.type as string)
              : draft.actions[0]?.type ?? "send_message";
          const parsedType = actionTypeSchema.safeParse(candidateType).success
            ? (candidateType as ActionDefinition["type"])
            : draft.actions[0]?.type ?? "send_message";
          const baseConfig = getDefaultActionConfig(parsedType, content);

          return {
            type: parsedType,
            config: {
              ...baseConfig,
              ...(step.config ?? {}),
              testId:
                step.config?.testId ??
                step.config?.test_id ??
                (baseConfig as any)?.testId,
              resourceId:
                step.config?.resourceId ??
                step.config?.resource_id ??
                (baseConfig as any)?.resourceId,
              message:
                typeof step.config?.message === "string"
                  ? step.config.message
                  : (baseConfig as any)?.message,
            },
          } satisfies ActionDefinition;
        })
      : draft.actions;

  draft.id = scenario.id;
  draft.name = scenario.name ?? draft.name;
  draft.isActive = scenario.isActive;

  return draft;
};

const draftToPayload = (draft: ScenarioDraft): ScenarioPayloadInput => {
  return scenarioPayloadSchema.parse({
    name: draft.name.trim(),
    isActive: draft.isActive,
    trigger: draft.trigger,
    condition: draft.hasCondition ? draft.condition : null,
    actions: draft.actions,
  });
};

const validateDraft = (draft: ScenarioDraft, content: AvailableContent): string | null => {
  if (!draft.name.trim()) {
    return "Donnez un nom à votre scénario.";
  }

  switch (draft.trigger.type) {
    case "formation_completed":
      if (!(draft.trigger.config as any)?.formationId) {
        return "Sélectionnez une formation pour le déclencheur.";
      }
      break;
    case "test_scored":
      if (!(draft.trigger.config as any)?.testId) {
        return "Sélectionnez un test pour le déclencheur.";
      }
      break;
    case "inactive_days": {
      const days = Number((draft.trigger.config as any)?.days ?? 0);
      if (!Number.isFinite(days) || days <= 0) {
        return "Précisez le nombre de jours d’inactivité.";
      }
      break;
    }
    default:
      break;
  }

  if (draft.hasCondition && draft.condition) {
    const value = Number((draft.condition.config as any)?.value ?? NaN);
    if (!Number.isFinite(value)) {
      return "Précisez une valeur pour la condition.";
    }
  }

  if (draft.actions.length === 0) {
    return "Ajoutez au moins une action.";
  }

  for (const action of draft.actions) {
    switch (action.type) {
      case "unlock_test":
        if (!(action.config as any)?.testId) {
          return "Sélectionnez un test à débloquer.";
        }
        break;
      case "unlock_resource":
        if (!(action.config as any)?.resourceId) {
          return "Sélectionnez une ressource à débloquer.";
        }
        break;
      case "send_message": {
        const message = (action.config as any)?.message;
        if (!message || !String(message).trim()) {
          return "Rédigez le message automatique à envoyer.";
        }
        break;
      }
      default:
        break;
    }
  }

  return null;
};

export function ScenariosManager({
  pathId,
  pathTitle,
  initialScenarios,
  availableContent,
  currentUserId,
  autoOpenBuilder = false,
}: ScenariosManagerProps) {
  const [scenarios, setScenarios] = useState<NormalizedScenario[]>(initialScenarios);
  const [selectedScenarioId, setSelectedScenarioId] = useState<string | null>(
    initialScenarios[0]?.id ?? null,
  );
  const [draft, setDraft] = useState<ScenarioDraft>(() =>
    selectedScenarioId
      ? scenarioToDraft(initialScenarios[0], availableContent)
      : createEmptyDraft(availableContent),
  );
  const [isSaving, setIsSaving] = useState(false);
  const [isToggling, setIsToggling] = useState<string | null>(null);

  useEffect(() => {
    if (autoOpenBuilder) {
      setSelectedScenarioId(null);
      setDraft(createEmptyDraft(availableContent));
    }
  }, [autoOpenBuilder, availableContent]);

  const selectedScenario = useMemo(
    () => (selectedScenarioId ? scenarios.find((item) => item.id === selectedScenarioId) ?? null : null),
    [scenarios, selectedScenarioId],
  );

  const handleSelectScenario = (scenario: NormalizedScenario) => {
    setSelectedScenarioId(scenario.id);
    setDraft(scenarioToDraft(scenario, availableContent));
  };

  const handleCreateNew = () => {
    setSelectedScenarioId(null);
    setDraft(createEmptyDraft(availableContent));
  };

  const handleApplyTemplate = (template: ScenarioTemplate) => {
    const result = template.build(availableContent);
    if (!result) {
      toast.warning("Complétez d’abord le parcours (formations/tests/ressources) pour appliquer ce modèle.");
      return;
    }
    setSelectedScenarioId(null);
    setDraft(result);
    toast.info(`Modèle "${template.name}" appliqué. Personnalisez-le avant d’enregistrer.`);
  };

  const handleSave = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!pathId || !z.string().uuid().safeParse(pathId).success) {
      if (isDev) {
        console.error("[scenarios] save:invalid-pathId", { pathId });
      }
      toast.error("pathId manquant. Impossible d’enregistrer le scénario.");
      return;
    }

    const validationError = validateDraft(draft, availableContent);
    if (validationError) {
      toast.error(validationError);
      return;
    }

    setIsSaving(true);
    let hasLoggedError = false;
    let endpoint: string | null = null;
    let method: string | null = null;
    let responseStatus: number | null = null;

    try {
      const payload = draftToPayload(draft);
      endpoint = draft.id
        ? `/api/parcours/scenarios/${draft.id}`
        : `/api/parcours/${pathId}/scenarios`;
      method = draft.id ? "PUT" : "POST";

      const response = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        credentials: "include",
      });
      responseStatus = response.status;

      if (!response.ok) {
        const bodyText = await response.text().catch(() => "");
        const truncatedBody = bodyText.length > 2000 ? `${bodyText.slice(0, 2000)}…` : bodyText;
        let parsedBody: Record<string, unknown> | null = null;
        try {
          parsedBody = bodyText ? (JSON.parse(bodyText) as Record<string, unknown>) : null;
        } catch {
          parsedBody = null;
        }

        const errorId =
          parsedBody && typeof parsedBody.errorId === "string"
            ? (parsedBody.errorId as string)
            : null;

        if (isDev) {
          console.error(
            `[scenarios] save:error status=${response.status} endpoint=${endpoint} pathId=${pathId} errorId=${
              errorId ?? "n/a"
            } body=${truncatedBody}`,
          );
        }

        hasLoggedError = true;
        const remoteError =
          parsedBody && typeof parsedBody.error === "string"
            ? (parsedBody.error as string)
            : parsedBody && typeof parsedBody.message === "string"
              ? (parsedBody.message as string)
              : null;
        const errorMessage = remoteError ?? "Impossible d’enregistrer le scénario.";
        const messageWithRef = errorId ? `${errorMessage} (ref: ${errorId})` : errorMessage;

        throw new Error(messageWithRef);
      }

      const { scenario } = await response.json();
      const normalized = scenario as NormalizedScenario;

      setScenarios((prev) => {
        const index = prev.findIndex((item) => item.id === normalized.id);
        if (index === -1) {
          return [...prev, normalized].sort(
            (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
          );
        }
        const next = [...prev];
        next[index] = normalized;
        return next;
      });

      setSelectedScenarioId(normalized.id);
      setDraft(scenarioToDraft(normalized, availableContent));
      toast.success("Scénario enregistré.");
    } catch (error) {
      if (isDev && !hasLoggedError) {
        console.error("[scenarios] save:exception", {
          endpoint,
          method,
          pathId,
          currentUserId: currentUserId ?? null,
          status: responseStatus,
          message: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined,
        });
      }
      toast.error(error instanceof Error ? error.message : "Erreur lors de l’enregistrement.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleScenario = async (scenario: NormalizedScenario, nextValue: boolean) => {
    setIsToggling(scenario.id);
    setScenarios((prev) =>
      prev.map((item) =>
        item.id === scenario.id ? { ...item, isActive: nextValue } : item,
      ),
    );

    try {
      const response = await fetch(`/api/parcours/scenarios/${scenario.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: nextValue }),
        credentials: "include",
      });

      if (!response.ok) {
        const bodyText = await response.text().catch(() => "");
        const truncatedBody = bodyText.length > 2000 ? `${bodyText.slice(0, 2000)}…` : bodyText;
        let parsedBody: Record<string, unknown> | null = null;
        try {
          parsedBody = bodyText ? (JSON.parse(bodyText) as Record<string, unknown>) : null;
        } catch {
          parsedBody = null;
        }

        const errorId =
          parsedBody && typeof parsedBody.errorId === "string"
            ? (parsedBody.errorId as string)
            : null;

        if (isDev) {
          console.error(
            `[scenarios] toggle:error status=${response.status} endpoint=/api/parcours/scenarios/${scenario.id} pathId=${pathId} errorId=${
              errorId ?? "n/a"
            } body=${truncatedBody}`,
          );
        }

        const remoteError =
          parsedBody && typeof parsedBody.error === "string"
            ? (parsedBody.error as string)
            : parsedBody && typeof parsedBody.message === "string"
              ? (parsedBody.message as string)
              : null;
        const errorMessage = remoteError ?? "Impossible de modifier le statut.";
        const messageWithRef = errorId ? `${errorMessage} (ref: ${errorId})` : errorMessage;

        throw new Error(messageWithRef);
      }

      const { scenario: updated } = await response.json();
      setScenarios((prev) =>
        prev.map((item) => (item.id === updated.id ? (updated as NormalizedScenario) : item)),
      );

      if (draft.id === scenario.id) {
        setDraft((prev) => ({ ...prev, isActive: nextValue }));
      }
      toast.success(nextValue ? "Scénario activé." : "Scénario en pause.");
    } catch (error) {
      console.error("[scenarios] toggle:exception", {
        pathId,
        userId: currentUserId ?? null,
        scenarioId: scenario.id,
        message: error instanceof Error ? error.message : String(error),
      });
      setScenarios((prev) =>
        prev.map((item) =>
          item.id === scenario.id ? { ...item, isActive: !nextValue } : item,
        ),
      );
      toast.error(error instanceof Error ? error.message : "Erreur lors de la mise à jour.");
    } finally {
      setIsToggling(null);
    }
  };

  const currentPreview = useMemo(
    () => buildScenarioSummary(draft, availableContent),
    [draft, availableContent],
  );

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-white">
            Automatiser le parcours « {pathTitle} »
          </h1>
          <p className="text-sm text-white/60">
            Composez des scénarios inspirés de Zapier : un déclencheur, une condition (optionnelle), des actions.
          </p>
        </div>
        <Button
          variant="outline"
          className="rounded-full border border-white/15 px-4 py-2 text-xs font-semibold uppercase tracking-[0.28em] text-white/80"
          onClick={handleCreateNew}
        >
          Nouveau scénario
        </Button>
      </div>

      {autoOpenBuilder ? (
        <div className="rounded-2xl border border-cyan-500/30 bg-cyan-500/10 p-4 text-sm text-cyan-100">
          <p className="font-semibold text-cyan-50">Configure ton 1er scénario maintenant (optionnel)</p>
          <p className="mt-1 text-cyan-100/70">
            Tu peux enregistrer ce scénario automatiquement ou revenir plus tard depuis la page « Scénarios ».
          </p>
        </div>
      ) : null}

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
        <section className="space-y-5">
          <div className="space-y-2">
            <h2 className="text-lg font-semibold text-white">Scénarios existants</h2>
            <p className="text-sm text-white/60">
              Activez, modifiez ou composez vos séquences pédagogiques. Chaque scénario se joue automatiquement.
            </p>
          </div>

          <div className="space-y-4">
            {scenarios.length === 0 ? (
              <Card className="border-white/8 bg-white/[0.02] text-white/70">
                <CardContent className="py-6 text-sm">
                  Aucun scénario pour l’instant. Lancez-vous avec un modèle à droite.
                </CardContent>
              </Card>
            ) : (
              scenarios.map((scenario) => (
                <Card
                  key={scenario.id}
                  className="border-white/8 bg-white/[0.025] text-white shadow-sm shadow-black/20"
                >
                  <CardHeader className="space-y-3">
                    <div className="flex items-center justify-between gap-3">
                      <CardTitle className="text-base font-semibold text-white">
                        {scenario.name}
                      </CardTitle>
                      <div className="flex items-center gap-3">
                        <Badge
                          className={
                            scenario.isActive
                              ? "rounded-full border border-emerald-400/30 bg-emerald-500/20 text-[10px] uppercase tracking-[0.28em] text-emerald-100"
                              : "rounded-full border border-white/15 bg-white/[0.05] text-[10px] uppercase tracking-[0.28em] text-white/60"
                          }
                        >
                          {scenario.isActive ? "Actif" : "En pause"}
                        </Badge>
                        <Switch
                          checked={scenario.isActive}
                          disabled={isToggling === scenario.id}
                          onCheckedChange={(value) => handleToggleScenario(scenario, value)}
                          aria-label={`Activer le scénario ${scenario.name}`}
                        />
                      </div>
                    </div>
                    <p className="text-sm text-white/55">
                      {buildScenarioSummary(scenarioToDraft(scenario, availableContent), availableContent)}
                    </p>
                  </CardHeader>
                  <CardFooter className="flex items-center justify-between text-xs text-white/50">
                    <span>
                      Créé le {new Date(scenario.createdAt).toLocaleDateString("fr-FR")}
                    </span>
                    <Button
                      variant="ghost"
                      className="rounded-full border border-white/10 px-3 py-1 text-xs font-semibold text-white/75 hover:border-white/20 hover:text-white"
                      onClick={() => handleSelectScenario(scenario)}
                    >
                      Modifier
                    </Button>
                  </CardFooter>
                </Card>
              ))
            )}
          </div>

          <div className="space-y-3 rounded-3xl border border-white/8 bg-white/[0.02] p-6 text-white/75">
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-[0.3em] text-white/45">
                Modèles express
              </h3>
              <p className="mt-1 text-xs text-white/55">
                Gagnez du temps avec ces scénarios prêts à l’emploi.
              </p>
            </div>
            <div className="grid gap-3">
              {scenarioTemplates.map((template) => (
                <button
                  key={template.id}
                  type="button"
                  onClick={() => handleApplyTemplate(template)}
                  className="rounded-2xl border border-white/10 bg-white/[0.05] px-4 py-3 text-left transition hover:border-white/20 hover:bg-white/[0.08]"
                >
                  <p className="font-semibold text-white">{template.name}</p>
                  <p className="text-xs text-white/55">{template.description}</p>
                </button>
              ))}
            </div>
          </div>
        </section>

        <section>
          <Card className="border-white/6 bg-white/[0.02] text-white shadow-sm shadow-black/25">
            <CardHeader className="space-y-2">
              <CardTitle className="text-lg font-semibold text-white">
                {selectedScenario ? "Modifier le scénario" : "Nouveau scénario"}
              </CardTitle>
              <p className="text-sm text-white/60">
                Composez vos étapes : déclencheur, condition (optionnelle), actions.
              </p>
            </CardHeader>
            <CardContent>
              <form className="space-y-6" onSubmit={handleSave}>
                <div className="space-y-2">
                  <Label className="text-xs uppercase tracking-[0.28em] text-white/45">
                    Nom du scénario
                  </Label>
                  <Input
                    value={draft.name}
                    onChange={(event) =>
                      setDraft((prev) => ({ ...prev, name: event.target.value }))
                    }
                    placeholder="Ex: Relance après 7 jours d’inactivité"
                    className="border-white/10 bg-white/[0.04] text-white placeholder:text-white/35"
                  />
                </div>

                <ScenarioBuilder
                  value={{
                    trigger: draft.trigger,
                    hasCondition: draft.hasCondition,
                    condition: draft.condition,
                    actions: draft.actions,
                  }}
                  onChange={(next) =>
                    setDraft((prev) => ({
                      ...prev,
                      trigger: next.trigger,
                      hasCondition: next.hasCondition,
                      condition: next.condition,
                      actions: next.actions,
                    }))
                  }
                  availableContent={availableContent}
                  disabled={isSaving}
                />

                <Separator className="bg-white/8" />

                <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 text-sm text-white/70">
                  <p className="font-semibold text-white/80">Résumé</p>
                  <p className="mt-2 text-white/65">{currentPreview}</p>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs text-white/50">
                    <Switch
                      checked={draft.isActive}
                      onCheckedChange={(value) =>
                        setDraft((prev) => ({ ...prev, isActive: value }))
                      }
                    />
                    <span>{draft.isActive ? "Scénario actif" : "Scénario en pause"}</span>
                  </div>
                  <Button
                    type="submit"
                    disabled={isSaving}
                    className="rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 px-5 py-2 text-sm font-semibold text-white"
                  >
                    {isSaving
                      ? "Enregistrement..."
                      : selectedScenario
                        ? "Mettre à jour"
                        : "Créer le scénario"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </section>
      </div>
    </div>
  );
}


