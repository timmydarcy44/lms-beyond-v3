"use client";

import { useCallback, useState } from "react";
import type { DiscScores } from "@/components/apprenant/apprenant-assessment-results";
import type { AxisKey } from "@/components/idmc/IdmcRadarChart";
import { EdgeDashboardGps } from "@/components/apprenant/edge-gps/edge-dashboard-gps";
import { EdgeDashboardOnboarding } from "@/components/apprenant/edge-gps/edge-dashboard-onboarding";
import { EdgeParcoursRequestModal } from "@/components/apprenant/edge-gps/edge-parcours-request-modal";
import { EdgeWhatNowFab } from "@/components/apprenant/edge-gps/edge-what-now-fab";
import { EdgeWhatNowModal } from "@/components/apprenant/edge-gps/edge-what-now-modal";
import type { StoredHardSkillMeta } from "@/lib/hard-skills/hard-skills-portfolio";
import type { PersonalizedActionPlan } from "@/lib/learner/personalized-action-plan";
import type { LearnerVisibleOpenBadge } from "@/lib/openbadges/learner-visible-badges";
import type { Diplome, ExperiencePro } from "@/lib/particulier/profil-edge-maturity";
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
  const [whatNowOpen, setWhatNowOpen] = useState(false);
  const [parcoursRequestOpen, setParcoursRequestOpen] = useState(false);

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

  const prioritySkills = gps.skills
    .filter((s) => s.status === "priority" || s.status === "to_develop")
    .slice(0, 5)
    .map((s) => s.name);

  const openParcoursRequest = useCallback(() => setParcoursRequestOpen(true), []);

  return (
    <>
      <EdgeDashboardOnboarding />
      <EdgeDashboardGps
        gps={gps}
        loading={loading}
        onWhatNow={() => setWhatNowOpen(true)}
        onRequestParcours={openParcoursRequest}
        onViewGaps={scrollToSkillsGaps}
      />
      <EdgeWhatNowFab onClick={() => setWhatNowOpen(true)} />
      <EdgeWhatNowModal
        open={whatNowOpen}
        onClose={() => setWhatNowOpen(false)}
        gps={gps}
        onRequestParcours={openParcoursRequest}
        onViewSkills={scrollToSkillsGaps}
      />
      <EdgeParcoursRequestModal
        open={parcoursRequestOpen}
        onClose={() => setParcoursRequestOpen(false)}
        defaultObjective={gps.objectiveTitle !== "Objectif professionnel" ? gps.objectiveTitle : ""}
        prioritySkills={prioritySkills.length ? prioritySkills : gps.prioritySkill ? [gps.prioritySkill] : []}
      />
    </>
  );
}
