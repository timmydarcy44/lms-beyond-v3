"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import type { DiscScores } from "@/components/apprenant/apprenant-assessment-results";
import type { AxisKey } from "@/components/idmc/IdmcRadarChart";
import { EdgeDashboardGps } from "@/components/apprenant/edge-gps/edge-dashboard-gps";
import {
  buildOnboardingHighlights,
  EdgeFirstStepsGuide,
  type FirstStepsStep,
} from "@/components/apprenant/edge-gps/edge-first-steps-guide";
import { EdgeWhatNowFab } from "@/components/apprenant/edge-gps/edge-what-now-fab";
import { EdgeWhatNowModal } from "@/components/apprenant/edge-gps/edge-what-now-modal";
import type { StoredHardSkillMeta } from "@/lib/hard-skills/hard-skills-portfolio";
import type { PersonalizedActionPlan } from "@/lib/learner/personalized-action-plan";
import type { LearnerVisibleOpenBadge } from "@/lib/openbadges/learner-visible-badges";
import type { Diplome, ExperiencePro } from "@/lib/particulier/profil-edge-maturity";
import {
  shouldAutoStartFirstSteps,
  writeFirstStepsState,
} from "@/lib/apprenant/edge-personalized-path-request";
import { useEdgeProgressionGps } from "@/hooks/use-edge-progression-gps";

type Props = {
  profile: Record<string, unknown> | null;
  discScores: DiscScores | null;
  idmcAxes: Record<AxisKey, number> | null;
  softSkillsRadar: Array<{ skill: string; score: number }>;
  hardSkills: string[];
  skillsMetadata: Record<string, unknown>;
  experiences: ExperiencePro[];
  diplomas: Diplome[];
  personalizedPlan: PersonalizedActionPlan | null;
  visibleBadges: LearnerVisibleOpenBadge[];
  earnedBadgeCount: number;
  profileCompletionPercent: number;
};

function scrollToSkillsGaps() {
  document.getElementById("edge-skills-gaps")?.scrollIntoView({ behavior: "smooth", block: "start" });
}

export function EdgeDashboardGpsContainer(props: Props) {
  const searchParams = useSearchParams();
  const [whatNowOpen, setWhatNowOpen] = useState(false);
  const [firstStepsActive, setFirstStepsActive] = useState(false);
  const [firstStepsStep, setFirstStepsStep] = useState<FirstStepsStep>("objective");
  const [confirmedObjective, setConfirmedObjective] = useState<string | null>(null);
  const [objectiveDraft, setObjectiveDraft] = useState("");

  const { gps, loading } = useEdgeProgressionGps({
    profile: props.profile,
    discScores: props.discScores,
    idmcAxes: props.idmcAxes,
    softSkillsRadar: props.softSkillsRadar,
    hardSkills: props.hardSkills,
    skillsMetadata: props.skillsMetadata as Record<string, StoredHardSkillMeta>,
    experiences: props.experiences,
    diplomas: props.diplomas,
    personalizedPlan: props.personalizedPlan,
    visibleBadges: props.visibleBadges,
    earnedBadgeCount: props.earnedBadgeCount,
    profileCompletionPercent: props.profileCompletionPercent,
  });

  useEffect(() => {
    if (loading) return;
    const forceStart = searchParams.get("premiers-pas") === "1";
    if (forceStart || shouldAutoStartFirstSteps()) {
      setFirstStepsActive(true);
      setFirstStepsStep("objective");
    }
  }, [loading, searchParams]);

  const onboardingHighlights = useMemo(
    () => buildOnboardingHighlights(gps, firstStepsStep),
    [gps, firstStepsStep],
  );

  const persistFirstSteps = useCallback(() => {
    writeFirstStepsState({
      completed: true,
      completedAt: new Date().toISOString(),
      objective: confirmedObjective ?? objectiveDraft.trim() ?? gps.objectiveTitle,
      selectedPriority: gps.prioritySkill || undefined,
    });
  }, [confirmedObjective, objectiveDraft, gps.objectiveTitle, gps.prioritySkill]);

  const handleStepChange = useCallback(
    (step: FirstStepsStep) => {
      setFirstStepsStep(step);
      if (step === "done") persistFirstSteps();
    },
    [persistFirstSteps],
  );

  return (
    <>
      <EdgeFirstStepsGuide
        active={firstStepsActive}
        step={firstStepsStep}
        onStepChange={handleStepChange}
        gps={gps}
        onClose={() => setFirstStepsActive(false)}
        onComplete={() => setFirstStepsActive(false)}
        onObjectiveConfirmed={setConfirmedObjective}
        objectiveDraft={objectiveDraft}
        onObjectiveDraftChange={setObjectiveDraft}
      />

      <EdgeDashboardGps
        gps={gps}
        loading={loading}
        onWhatNow={() => setWhatNowOpen(true)}
        onViewGaps={scrollToSkillsGaps}
        firstStepsStep={firstStepsActive ? firstStepsStep : null}
        onboardingHighlights={firstStepsActive ? onboardingHighlights : undefined}
      />

      <EdgeWhatNowFab onClick={() => setWhatNowOpen(true)} />
      <EdgeWhatNowModal
        open={whatNowOpen}
        onClose={() => setWhatNowOpen(false)}
        gps={gps}
        onViewSkills={scrollToSkillsGaps}
      />
    </>
  );
}
