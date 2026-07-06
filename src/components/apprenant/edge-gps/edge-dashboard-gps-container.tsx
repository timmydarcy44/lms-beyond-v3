"use client";

import { useState } from "react";
import type { DiscScores } from "@/components/apprenant/apprenant-assessment-results";
import type { AxisKey } from "@/components/idmc/IdmcRadarChart";
import { EdgeDashboardGps } from "@/components/apprenant/edge-gps/edge-dashboard-gps";
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

export function EdgeDashboardGpsContainer(props: Props) {
  const [whatNowOpen, setWhatNowOpen] = useState(false);

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

  return (
    <>
      <EdgeDashboardGps
        gps={gps}
        loading={loading}
        onWhatNow={() => setWhatNowOpen(true)}
      />
      <EdgeWhatNowFab onClick={() => setWhatNowOpen(true)} />
      <EdgeWhatNowModal
        open={whatNowOpen}
        onClose={() => setWhatNowOpen(false)}
        nextStep={gps.nextStep}
      />
    </>
  );
}
