"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { DiscScores } from "@/components/apprenant/apprenant-assessment-results";
import { analyzeCareerMatching } from "@/lib/career-profiles/career-profile-matching";
import {
  getCareerProfileBySlug,
  type CareerProfile,
} from "@/lib/career-profiles/career-profiles-data";
import {
  buildPublicSkillCards,
  computeEdgeReliabilityIndex,
} from "@/lib/hard-skills/skill-validation-analysis";
import {
  computeProfilEdgeMaturity,
  parseProfessionalProject,
  type LearnerHardSkillMeta,
} from "@/lib/particulier/profil-edge-maturity";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export type AccompagnementProgression = {
  loading: boolean;
  edgeIndex: number;
  validatedCount: number;
  totalSkills: number;
  prioritySkills: string[];
  todayScore: number;
  projectedScore: number;
  projectedGain: number;
  firstName: string;
};

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

export function useAccompagnementProgression(): AccompagnementProgression {
  const [loading, setLoading] = useState(true);
  const [edgeIndex, setEdgeIndex] = useState(0);
  const [validatedCount, setValidatedCount] = useState(0);
  const [totalSkills, setTotalSkills] = useState(0);
  const [prioritySkills, setPrioritySkills] = useState<string[]>([]);
  const [todayScore, setTodayScore] = useState(0);
  const [projectedGain, setProjectedGain] = useState(28);
  const [firstName, setFirstName] = useState("");

  const load = useCallback(async () => {
    const supabase = createSupabaseBrowserClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const [profileRes, discRes, softRes, expRes, dipRes] = await Promise.all([
      supabase
        .from("profiles")
        .select(
          "first_name, hard_skills, skills_metadata, professional_project, target_career_slug, type_profil",
        )
        .eq("id", user.id)
        .maybeSingle(),
      supabase.from("disc_resultats").select("scores").eq("user_id", user.id).order("created_at", { ascending: false }).limit(1).maybeSingle(),
      supabase.from("soft_skills_resultats").select("scores").eq("user_id", user.id).order("created_at", { ascending: false }).limit(1).maybeSingle(),
      supabase.from("experiences_pro").select("id").eq("user_id", user.id),
      supabase.from("diplomes").select("id").eq("user_id", user.id),
    ]);

    const profile = profileRes.data;
    if (!profile) return;

    setFirstName(String(profile.first_name ?? ""));

    const hardSkills = (profile.hard_skills as string[] | null) ?? [];
    const skillsMetadata = (profile.skills_metadata as Record<string, LearnerHardSkillMeta>) ?? {};
    const cards = buildPublicSkillCards(
      hardSkills.length ? hardSkills : Object.keys(skillsMetadata),
      skillsMetadata,
    );

    const reliability = computeEdgeReliabilityIndex(
      hardSkills.length ? hardSkills : Object.keys(skillsMetadata),
      skillsMetadata,
    );
    setEdgeIndex(reliability);
    setTotalSkills(cards.length);
    setValidatedCount(
      cards.filter((c) => c.status === "validated" || c.status === "expert_validated").length,
    );

    const discScores = discRes.data?.scores as DiscScores | null;
    const softSkillsScores = (softRes.data?.scores as Record<string, number> | null) ?? null;
    const careerSlug = profile.target_career_slug as string | null;
    const career = careerSlug ? await loadCareerBySlug(careerSlug) : null;

    let compatScore = reliability;
    let priorities: string[] = [];
    let gain = 28;

    if (discScores && career) {
      const matching = analyzeCareerMatching({
        career,
        discScores,
        softSkillsScores,
        hardSkills,
        skillsMetadata,
        experiences: expRes.data ?? [],
        diplomas: dipRes.data ?? [],
        hasIdmc: false,
      });
      compatScore = matching.compatibilityScore;
      priorities = [...matching.develop, ...matching.consolidate].slice(0, 3);
      gain = matching.nextPriority?.impactPercent
        ? Math.min(35, matching.nextPriority.impactPercent * Math.max(1, priorities.length))
        : 28;
    } else {
      const maturity = computeProfilEdgeMaturity({
        profile: {
          hard_skills: hardSkills,
          professional_project: parseProfessionalProject(profile.professional_project),
          type_profil: profile.type_profil,
        },
        hasDisc: Boolean(discScores),
        hasSoftSkills: Boolean(softSkillsScores),
        hasIdmc: false,
        experiencesCount: expRes.data?.length ?? 0,
        diplomasCount: dipRes.data?.length ?? 0,
      });
      compatScore = maturity.totalPercent || reliability;
    }

    setTodayScore(compatScore);
    setPrioritySkills(priorities);
    setProjectedGain(gain);
  }, []);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        await load();
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [load]);

  const projectedScore = useMemo(
    () => Math.min(98, todayScore + projectedGain),
    [todayScore, projectedGain],
  );

  return {
    loading,
    edgeIndex,
    validatedCount,
    totalSkills,
    prioritySkills,
    todayScore,
    projectedScore,
    projectedGain,
    firstName,
  };
}
