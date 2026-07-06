"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { DiscScores } from "@/components/apprenant/apprenant-assessment-results";
import type { AxisKey } from "@/components/idmc/IdmcRadarChart";
import { analyzeCareerMatching } from "@/lib/career-profiles/career-profile-matching";
import {
  getCareerProfileBySlug,
  type CareerProfile,
} from "@/lib/career-profiles/career-profiles-data";
import type { StoredHardSkillMeta } from "@/lib/hard-skills/hard-skills-portfolio";
import { buildEdgeProgressionGps, type EdgeProgressionGps } from "@/lib/apprenant/edge-progression-gps";
import type { PersonalizedActionPlan } from "@/lib/learner/personalized-action-plan";
import type { LearnerVisibleOpenBadge } from "@/lib/openbadges/learner-visible-badges";
import type { Diplome, ExperiencePro } from "@/lib/particulier/profil-edge-maturity";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

async function loadCareerBySlug(slug: string): Promise<CareerProfile | null> {
  try {
    const res = await fetch(`/api/career-profiles/search?slug=${encodeURIComponent(slug)}`);
    const json = await res.json();
    if (res.ok && json.profile) return json.profile as CareerProfile;
  } catch {
    /* fallback */
  }
  return getCareerProfileBySlug(slug) ?? null;
}

export function useEdgeProgressionGps(params: {
  profile: Record<string, unknown> | null;
  discScores: DiscScores | null;
  idmcAxes: Record<AxisKey, number> | null;
  softSkillsRadar: Array<{ skill: string; score: number }>;
  hardSkills: string[];
  skillsMetadata: Record<string, StoredHardSkillMeta>;
  experiences: ExperiencePro[];
  diplomas: Diplome[];
  personalizedPlan: PersonalizedActionPlan | null;
  visibleBadges: LearnerVisibleOpenBadge[];
  earnedBadgeCount: number;
  profileCompletionPercent: number;
}): { gps: EdgeProgressionGps; loading: boolean } {
  const [careerTitle, setCareerTitle] = useState<string | null>(null);
  const [matching, setMatching] = useState<ReturnType<typeof analyzeCareerMatching> | null>(null);
  const [hasCrossProfileBadge, setHasCrossProfileBadge] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const slug = String(params.profile?.target_career_slug ?? "").trim();
    if (!slug || !params.discScores) {
      setCareerTitle(null);
      setMatching(null);
      return;
    }

    const career = await loadCareerBySlug(slug);
    if (!career) return;

    setCareerTitle(career.title);
    setMatching(
      analyzeCareerMatching({
        career,
        discScores: params.discScores,
        softSkillsScores: Object.fromEntries(
          params.softSkillsRadar.map((s) => [s.skill, s.score]),
        ),
        hardSkills: params.hardSkills,
        skillsMetadata: params.skillsMetadata,
        experiences: params.experiences,
        diplomas: params.diplomas,
        hasIdmc: Boolean(params.idmcAxes),
      }),
    );
  }, [
    params.profile?.target_career_slug,
    params.discScores,
    params.softSkillsRadar,
    params.hardSkills,
    params.skillsMetadata,
    params.experiences,
    params.diplomas,
    params.idmcAxes,
  ]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        await load();
        const supabase = createSupabaseBrowserClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (user && !cancelled) {
          const { data } = await supabase
            .from("profiles")
            .select("cross_profile_completion")
            .eq("id", user.id)
            .maybeSingle();
          setHasCrossProfileBadge(Boolean(data?.cross_profile_completion));
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [load]);

  const gps = useMemo(
    () =>
      buildEdgeProgressionGps({
        ...params,
        matching,
        careerTitle,
        hasCrossProfileBadge,
      }),
    [params, matching, careerTitle, hasCrossProfileBadge],
  );

  return { gps, loading };
}
