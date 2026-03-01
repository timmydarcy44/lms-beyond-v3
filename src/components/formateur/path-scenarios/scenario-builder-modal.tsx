"use client";

import { createPortal } from "react-dom";
import { Fragment, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { z } from "zod";

import {
  ScenarioBuilder,
  getDefaultActionConfig,
  getDefaultTriggerConfig,
  type ScenarioBuilderAvailableContent,
} from "@/components/parcours/scenarios/scenario-builder";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import {
  scenarioPayloadSchema,
  type ActionDefinition,
  type ConditionDefinition,
  type TriggerDefinition,
} from "@/lib/parcours/scenarios/schema";
import type { NormalizedScenario } from "@/lib/parcours/scenarios/serializer";

const isDev = process.env.NODE_ENV !== "production";

type ScenarioDraft = {
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
  build: (content: ScenarioBuilderAvailableContent) => ScenarioDraft | null;
};

type ScenarioBuilderModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pathId: string | null;
  availableContent: ScenarioBuilderAvailableContent;
  onScenarioCreated?: (scenario: NormalizedScenario) => void;
};

const createEmptyDraft = (content: ScenarioBuilderAvailableContent): ScenarioDraft => {
  const defaultTriggerType: TriggerDefinition["type"] =
    content.courses.length > 0
      ? "formation_completed"
      : content.tests.length > 0
        ? "test_scored"
        : "inactive_days";

  const defaultActionType: ActionDefinition["type"] =
    content.resources.length > 0
      ? "unlock_resource"
      : content.tests.length > 0
        ? "unlock_test"
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

const buildScenarioSummary = (
  draft: ScenarioDraft,
  content: ScenarioBuilderAvailableContent,
) => {
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
    const value = (draft.condition.config as any)?.value ?? 0;
    if (draft.condition.type === "score_gte") {
      parts.push(`si le score est ≥ ${value}%`);
    } else if (draft.condition.type === "days_gte") {
      parts.push(`si le nombre de jours est ≥ ${value}`);
    }
  }

  const actionDescriptions = draft.actions.map((action) => {
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

  if (actionDescriptions.length === 1) {
    parts.push(`alors ${actionDescriptions[0]}`);
  } else if (actionDescriptions.length > 1) {
    parts.push(
      `alors ${actionDescriptions[0]} (+${actionDescriptions.length - 1} action${
        actionDescriptions.length - 1 > 1 ? "s" : ""
      })`,
    );
  }

  return parts.join(" → ");
};

const validateDraft = (
  draft: ScenarioDraft,
  content: ScenarioBuilderAvailableContent,
): string | null => {
  if (!draft.name.trim()) {
    return "Nommez votre scénario pour le retrouver facilement.";
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

const scenarioTemplates: ScenarioTemplate[] = [
  {
    id: "formation-message",
    name: "Formation terminée → Message surprise",
    description: "Relance instantanément l’apprenant avec un message personnalisé.",
    build: (content) => {
      if (!content.courses.length) return null;
      return {
        name: "Bravo pour la formation !",
        trigger: {
          type: "formation_completed",
          config: { formationId: content.courses[0].id },
        },
        hasCondition: false,
        condition: null,
        actions: [
          {
            type: "send_message",
            config: {
              message:
                "Félicitations pour la formation ! Tu débloques la suite du parcours et un nouveau message de motivation 🎉",
            },
          },
        ],
        isActive: true,
      };
    },
  },
  {
    id: "test-resource",
    name: "Test ≥ 80% → Récompense premium",
    description: "Débloque du contenu exclusif pour les apprenants performants.",
    build: (content) => {
      if (!content.tests.length || !content.resources.length) return null;
      return {
        name: "Score premium → Ressource bonus",
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
          {
            type: "send_message",
            config: {
              message:
                "Tu as atteint un score impressionnant ! Une ressource premium vient d’être débloquée pour toi 💎",
            },
          },
        ],
        isActive: true,
      };
    },
  },
  {
    id: "inactivity-message",
    name: "7 jours d’inactivité → Relance",
    description: "Automatise un message pour ramener l’apprenant dans le parcours.",
    build: () => ({
      name: "Relance inactivité 7 jours",
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
              "Hello 👋 On n’a plus de nouvelles depuis quelques jours. Tu veux qu’on planifie un point ensemble ?",
          },
        },
      ],
      isActive: true,
    }),
  },
];

export function ScenarioBuilderModal({
  open,
  onOpenChange,
  pathId,
  availableContent,
  onScenarioCreated,
}: ScenarioBuilderModalProps) {
  const [draft, setDraft] = useState<ScenarioDraft>(() => createEmptyDraft(availableContent));
  const [isSaving, setIsSaving] = useState(false);
  const overlayRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (open) {
      setDraft(createEmptyDraft(availableContent));
    }
  }, [open, availableContent]);

  const currentSummary = useMemo(
    () => buildScenarioSummary(draft, availableContent),
    [draft, availableContent],
  );

  const handleSelectTemplate = (template: ScenarioTemplate) => {
    const nextDraft = template.build(availableContent);
    if (!nextDraft) {
      toast.warning("Ajoutez des contenus au parcours avant d’utiliser ce modèle.");
      return;
    }
    setDraft(nextDraft);
    toast.info(`Modèle « ${template.name} » chargé. Ajustez-le avant d’enregistrer.`);
  };

  const handleSave = async () => {
    if (!pathId || !z.string().uuid().safeParse(pathId).success) {
      toast.error("Impossible de créer le scénario: pathId invalide.");
      if (isDev) {
        console.error("[scenario-modal] invalid pathId", { pathId });
      }
      return;
    }

    const validationError = validateDraft(draft, availableContent);
    if (validationError) {
      toast.error(validationError);
      return;
    }

    const payload = scenarioPayloadSchema.parse({
      name: draft.name.trim(),
      isActive: draft.isActive,
      trigger: draft.trigger,
      condition: draft.hasCondition ? draft.condition : null,
      actions: draft.actions,
    });

    setIsSaving(true);
    const endpoint = `/api/parcours/${pathId}/scenarios`;

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        credentials: "include",
      });

      const bodyText = await response.text();
      const truncatedBody = bodyText.length > 2000 ? `${bodyText.slice(0, 2000)}…` : bodyText;
      let parsedBody: Record<string, unknown> | null = null;
      try {
        parsedBody = bodyText ? (JSON.parse(bodyText) as Record<string, unknown>) : null;
      } catch {
        parsedBody = null;
      }

      if (!response.ok) {
        const errorId =
          parsedBody && typeof parsedBody.errorId === "string"
            ? (parsedBody.errorId as string)
            : null;
        const errorMessage =
          parsedBody && typeof parsedBody.error === "string"
            ? (parsedBody.error as string)
            : parsedBody && typeof parsedBody.message === "string"
              ? (parsedBody.message as string)
              : "Impossible de créer le scénario.";
        if (isDev) {
          console.error("[scenario-modal] save:error", {
            status: response.status,
            endpoint,
            pathId,
            errorId,
            body: truncatedBody,
          });
        }
        toast.error(errorId ? `${errorMessage} (ref: ${errorId})` : errorMessage);
        return;
      }

      if (!parsedBody || typeof parsedBody !== "object") {
        toast.error("Réponse inattendue du serveur.");
        return;
      }

      if (parsedBody.ok !== true) {
        const errorId =
          typeof parsedBody.errorId === "string" ? (parsedBody.errorId as string) : null;
        const errorMessage =
          typeof parsedBody.error === "string"
            ? (parsedBody.error as string)
            : typeof parsedBody.message === "string"
              ? (parsedBody.message as string)
              : "Création du scénario incomplète.";
        toast.error(errorId ? `${errorMessage} (ref: ${errorId})` : errorMessage);
        return;
      }

      const scenario = parsedBody.scenario as NormalizedScenario | undefined;
      toast.success("Scénario créé pour ce parcours.");
      if (scenario && onScenarioCreated) {
        onScenarioCreated(scenario);
      }
      onOpenChange(false);
    } catch (error) {
      if (isDev) {
        console.error("[scenario-modal] save:exception", {
          endpoint,
          pathId,
          message: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined,
        });
      }
      toast.error("Erreur lors de la création du scénario.");
    } finally {
      setIsSaving(false);
    }
  };

  useEffect(() => {
    if (!open) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        if (!isSaving) {
          onOpenChange(false);
        }
      }
    };

    overlayRef.current?.focus();
    window.addEventListener("keydown", handleKeyDown, true);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown, true);
    };
  }, [open, isSaving, onOpenChange]);

  if (!mounted || !open) {
    return null;
  }

  return createPortal(
    <div className="fixed inset-0 z-[9999]">
      <div className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-xl" />
      <div className="fixed inset-0 z-[10000] flex">
        <div
          ref={overlayRef}
          className="relative flex h-screen w-screen flex-col bg-[#050a18] text-white outline-none"
          role="dialog"
          aria-modal="true"
          tabIndex={-1}
        >
          <header className="sticky top-0 z-20 flex items-center justify-between border-b border-white/10 bg-[#050a18]/95 px-6 py-5 backdrop-blur lg:px-10">
            <div className="space-y-1">
              <h2 className="text-xl font-semibold lg:text-2xl">Créer un scénario automatisé</h2>
              <p className="text-sm text-white/60">
                Composez un flow Zapier : déclencheur, filtre éventuel, actions pédagogiques en série.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="ghost" onClick={() => !isSaving && onOpenChange(false)} disabled={isSaving}>
                Fermer
              </Button>
              <Button onClick={handleSave} disabled={isSaving}>
                {isSaving ? "Création..." : "Sauvegarder"}
              </Button>
            </div>
          </header>

          <div className="flex flex-1 gap-8 overflow-hidden px-6 py-6 lg:px-10 lg:py-8">
            <section className="flex-1 overflow-y-auto pr-3">
              <div className="mx-auto max-w-4xl space-y-6 pb-10">
                <div className="space-y-2">
                  <Label className="text-xs uppercase tracking-[0.32em] text-white/45">
                    Nom du scénario
                  </Label>
                  <Input
                    value={draft.name}
                    onChange={(event) =>
                      setDraft((prev) => ({
                        ...prev,
                        name: event.target.value,
                      }))
                    }
                    placeholder="Ex: Relance après inactivité"
                    disabled={isSaving}
                    className="border-white/10 bg-white/[0.04] text-white placeholder:text-white/35"
                  />
                </div>

                <div className="rounded-3xl border border-white/10 bg-white/[0.035] p-6 shadow-lg shadow-black/20">
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
                </div>
              </div>
            </section>

            <aside className="w-full max-w-sm space-y-6 overflow-y-auto pr-1">
              <div className="rounded-2xl border border-white/12 bg-white/[0.04] p-5">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-white">Activer dès l’enregistrement</p>
                    <p className="text-xs text-white/55">
                      Vous pourrez le mettre en pause depuis l’espace scénarios.
                    </p>
                  </div>
                  <Switch
                    checked={draft.isActive}
                    onCheckedChange={(value) =>
                      setDraft((prev) => ({
                        ...prev,
                        isActive: value,
                      }))
                    }
                    disabled={isSaving}
                  />
                </div>
              </div>

              <div className="rounded-2xl border border-white/12 bg-white/[0.05] p-5">
                <p className="text-sm font-semibold text-white">Résumé</p>
                <p className="mt-3 text-sm leading-relaxed text-white/70">
                  {currentSummary || "Le résumé se construira à mesure que vous complétez le flow."}
                </p>
              </div>

              <div className="rounded-2xl border border-white/12 bg-white/[0.04] p-5">
                <div className="mb-3 space-y-1.5">
                  <p className="text-xs font-semibold uppercase tracking-[0.32em] text-white/45">
                    Modèles express
                  </p>
                  <p className="text-sm text-white/60">
                    Chargez un scénario prêt à l’emploi et adaptez-le.
                  </p>
                </div>
                <div className="flex flex-col gap-2">
                  {scenarioTemplates.map((template) => (
                    <Fragment key={template.id}>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => handleSelectTemplate(template)}
                        className="justify-start gap-3 rounded-xl border-white/15 bg-white/[0.07] text-left text-sm text-white hover:border-white/30 hover:bg-white/[0.12]"
                        disabled={isSaving}
                      >
                        <div>
                          <p className="font-semibold text-white">{template.name}</p>
                          <p className="text-xs text-white/55">{template.description}</p>
                        </div>
                      </Button>
                      <Separator className="bg-white/6 last:hidden" />
                    </Fragment>
                  ))}
                </div>
              </div>
            </aside>
          </div>

          <footer className="sticky bottom-0 z-20 border-t border-white/10 bg-[#050a18]/95 px-6 py-4 text-xs text-white/45 backdrop-blur lg:px-10">
            Le scénario sera attaché immédiatement au parcours. Vous pourrez le retrouver dans l’onglet “Scénarios”.
          </footer>
        </div>
      </div>
    </div>,
    document.body,
  );
}

