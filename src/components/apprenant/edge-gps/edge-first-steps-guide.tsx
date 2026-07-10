"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { CheckCircle2, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { EdgeProgressionGps } from "@/lib/apprenant/edge-progression-gps";
import type { OnboardingRowHighlight } from "@/components/apprenant/edge-gps/edge-skills-gap-table";
import { EDGE_EXPERT_PARCOURS_CTA, getExpertParcoursHref } from "@/lib/particulier/coaching-config";
import Link from "next/link";

export type FirstStepsStep = "objective" | "gaps" | "build" | "form" | "done";

type Props = {
  active: boolean;
  step: FirstStepsStep;
  onStepChange: (step: FirstStepsStep) => void;
  gps: EdgeProgressionGps;
  onClose: () => void;
  onComplete?: () => void;
  onObjectiveConfirmed?: (objective: string) => void;
  objectiveDraft?: string;
  onObjectiveDraftChange?: (value: string) => void;
};

const STEP_ORDER: FirstStepsStep[] = ["objective", "gaps", "build", "form", "done"];

function scrollToId(id: string) {
  window.setTimeout(() => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, 120);
}

function findExampleSkills(gps: EdgeProgressionGps) {
  const aligned =
    gps.skills.find((s) => s.status === "validated" || s.gapSeverity === "aligned") ?? null;
  const unevaluated =
    gps.skills.find((s) => s.gapSeverity === "unevaluated") ?? null;
  const priority =
    gps.skills.find((s) => s.status === "priority") ??
    gps.skills.find((s) => s.gapSeverity === "high" || s.gapSeverity === "medium") ??
    null;
  return { aligned, unevaluated, priority };
}

export function EdgeFirstStepsGuide({
  active,
  step,
  onStepChange,
  gps,
  onClose,
  onComplete,
  onObjectiveConfirmed,
  objectiveDraft: objectiveDraftProp,
  onObjectiveDraftChange,
}: Props) {
  const [internalObjective, setInternalObjective] = useState("");
  const [toast, setToast] = useState<string | null>(null);

  const objectiveDraft = objectiveDraftProp ?? internalObjective;
  const setObjectiveDraft = onObjectiveDraftChange ?? setInternalObjective;
  const examples = useMemo(() => findExampleSkills(gps), [gps]);

  useEffect(() => {
    if (!active || step !== "objective") return;
    setObjectiveDraft(
      gps.objectiveTitle !== "Objectif professionnel" ? gps.objectiveTitle : "",
    );
    scrollToId("edge-objective-section");
  }, [active, step, gps.objectiveTitle, setObjectiveDraft]);

  useEffect(() => {
    if (!active) return;
    if (step === "gaps") scrollToId("edge-skills-gaps");
    if (step === "build") scrollToId("edge-next-step-section");
  }, [active, step]);

  const showToast = useCallback((message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(null), 3200);
  }, []);

  if (!active) return null;

  if (step === "done") {
    return (
      <div className="fixed inset-0 z-[190] flex items-center justify-center p-4">
        <button
          type="button"
          className="absolute inset-0 bg-black/75 backdrop-blur-sm"
          onClick={() => {
            onComplete?.();
            onClose();
          }}
          aria-label="Fermer"
        />
        <div className="relative w-full max-w-md rounded-2xl border border-white/10 bg-[#12141C] p-8 text-center shadow-2xl">
          <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-400">
            <CheckCircle2 className="h-6 w-6" />
          </span>
          <h2 className="mt-5 text-xl font-semibold text-white">Premiers pas terminés.</h2>
          <p className="mt-3 text-sm leading-relaxed text-white/60">
            Votre profil EDGE est prêt à être exploité.
          </p>
          <button
            type="button"
            onClick={() => {
              onComplete?.();
              onClose();
            }}
            className="mt-8 w-full rounded-lg bg-white py-3 text-sm font-medium text-[#0a0a0a] hover:bg-white/90"
          >
            Retour à mon dashboard
          </button>
        </div>
      </div>
    );
  }

  const stepIndex = STEP_ORDER.indexOf(step);

  return (
    <>
      <div className="pointer-events-none fixed inset-0 z-[185]">
        <div className="absolute inset-0 bg-black/55 backdrop-blur-[1px]" />
      </div>

      {toast ? (
        <div className="fixed left-1/2 top-6 z-[195] -translate-x-1/2 rounded-full border border-emerald-500/30 bg-emerald-500/15 px-4 py-2 text-sm text-emerald-200 shadow-lg">
          {toast}
        </div>
      ) : null}

      <div className="fixed inset-x-0 bottom-0 z-[195] p-4 sm:inset-x-auto sm:bottom-8 sm:right-8 sm:max-w-sm">
        <div
          role="dialog"
          className="rounded-2xl border border-white/10 bg-[#12141C] p-5 shadow-2xl sm:w-[360px]"
        >
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#8BB4FF]">
                Premiers pas EDGE
              </p>
              <p className="mt-0.5 text-xs text-white/40">
                Étape {stepIndex + 1} sur {STEP_ORDER.length - 1}
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-full border border-white/10 p-1.5 text-white/45 hover:bg-white/5"
              aria-label="Quitter"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="mb-4 flex gap-1">
            {STEP_ORDER.slice(0, -1).map((s, i) => (
              <span
                key={s}
                className={cn(
                  "h-1 flex-1 rounded-full transition",
                  i <= stepIndex ? "bg-[#3D7BFF]" : "bg-white/10",
                )}
              />
            ))}
          </div>

          {step === "objective" ? (
            <ObjectiveStep
              objectiveDraft={objectiveDraft}
              onChange={setObjectiveDraft}
              onConfirm={() => {
                const value = objectiveDraft.trim() || gps.objectiveTitle;
                onObjectiveConfirmed?.(value);
                showToast("Objectif confirmé. EDGE peut maintenant analyser vos écarts.");
                window.setTimeout(() => onStepChange("gaps"), 900);
              }}
            />
          ) : null}

          {step === "gaps" ? (
            <GapsStep examples={examples} onContinue={() => onStepChange("build")} />
          ) : null}

          {step === "build" ? (
            <BuildStep onContinue={() => onStepChange("form")} />
          ) : null}

          {step === "form" ? (
            <FormStep onSkip={() => onStepChange("done")} />
          ) : null}

          <button
            type="button"
            onClick={onClose}
            className="mt-4 w-full text-center text-xs text-white/35 hover:text-white/55"
          >
            Quitter pour l&apos;instant
          </button>
        </div>
      </div>
    </>
  );
}

export function buildOnboardingHighlights(
  gps: EdgeProgressionGps,
  step: FirstStepsStep,
): Record<string, OnboardingRowHighlight> {
  if (step !== "gaps") return {};
  const examples = findExampleSkills(gps);
  const map: Record<string, OnboardingRowHighlight> = {};
  if (examples.aligned) map[examples.aligned.name] = "aligned";
  if (examples.unevaluated) map[examples.unevaluated.name] = "unevaluated";
  if (examples.priority) map[examples.priority.name] = "priority";
  return map;
}

export { shouldAutoStartFirstSteps } from "@/lib/apprenant/edge-personalized-path-request";

function ObjectiveStep({
  objectiveDraft,
  onChange,
  onConfirm,
}: {
  objectiveDraft: string;
  onChange: (v: string) => void;
  onConfirm: () => void;
}) {
  return (
    <div>
      <h3 className="text-base font-semibold text-white">Définir ou confirmer votre objectif</h3>
      <p className="mt-2 text-sm text-white/55">
        Tout commence par l&apos;objectif professionnel que vous souhaitez atteindre.
      </p>
      <input
        type="text"
        value={objectiveDraft}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Ex. Community manager"
        className="mt-4 w-full rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2.5 text-sm text-white placeholder:text-white/30 focus:border-[#3D7BFF]/50 focus:outline-none"
      />
      <button
        type="button"
        onClick={onConfirm}
        disabled={!objectiveDraft.trim()}
        className="mt-4 w-full rounded-lg bg-[#3D7BFF] py-2.5 text-sm font-medium text-white hover:bg-[#2F6AE8] disabled:opacity-50"
      >
        Confirmer mon objectif
      </button>
    </div>
  );
}

function GapsStep({
  examples,
  onContinue,
}: {
  examples: ReturnType<typeof findExampleSkills>;
  onContinue: () => void;
}) {
  return (
    <div>
      <h3 className="text-base font-semibold text-white">Comprendre vos écarts</h3>
      <p className="mt-2 text-sm text-white/55">
        Voici les compétences qui influencent le plus votre objectif.
      </p>
      <ul className="mt-3 space-y-1.5 text-xs text-white/50">
        {examples.aligned ? (
          <li>
            <span className="text-emerald-300">●</span> {examples.aligned.name} — validée / alignée
          </li>
        ) : null}
        {examples.unevaluated ? (
          <li>
            <span className="text-white/40">●</span> {examples.unevaluated.name} — non évaluée
          </li>
        ) : null}
        {examples.priority ? (
          <li>
            <span className="text-[#8BB4FF]">●</span> {examples.priority.name} — prioritaire
          </li>
        ) : null}
      </ul>
      <button
        type="button"
        onClick={onContinue}
        className="mt-4 w-full rounded-lg bg-[#3D7BFF] py-2.5 text-sm font-medium text-white hover:bg-[#2F6AE8]"
      >
        J&apos;ai compris mes écarts
      </button>
    </div>
  );
}

function BuildStep({ onContinue }: { onContinue: () => void }) {
  return (
    <div>
      <h3 className="text-base font-semibold text-white">{EDGE_EXPERT_PARCOURS_CTA}</h3>
      <p className="mt-2 text-sm leading-relaxed text-white/55">
        EDGE identifie vos écarts. Un expert peut ensuite construire un plan personnalisé adapté à votre
        situation — pas un catalogue générique.
      </p>
      <button
        type="button"
        onClick={onContinue}
        className="mt-4 w-full rounded-lg bg-white py-2.5 text-sm font-medium text-[#0a0a0a] hover:bg-white/90"
      >
        {EDGE_EXPERT_PARCOURS_CTA}
      </button>
    </div>
  );
}

function FormStep({ onSkip }: { onSkip: () => void }) {
  return (
    <div>
      <h3 className="text-base font-semibold text-white">{EDGE_EXPERT_PARCOURS_CTA}</h3>
      <p className="mt-2 text-sm text-white/55">
        Réservez un créneau avec un expert EDGE pour construire votre plan d&apos;action.
      </p>
      <Link
        href={getExpertParcoursHref()}
        className="mt-4 flex w-full items-center justify-center rounded-lg bg-[#3D7BFF] py-2.5 text-sm font-medium text-white hover:bg-[#2F6AE8]"
      >
        {EDGE_EXPERT_PARCOURS_CTA}
      </Link>
      <button
        type="button"
        onClick={onSkip}
        className="mt-2 w-full rounded-lg border border-white/15 py-2.5 text-sm text-white/60 hover:bg-white/[0.04]"
      >
        Terminer sans réserver
      </button>
    </div>
  );
}
