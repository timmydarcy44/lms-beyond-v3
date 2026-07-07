"use client";

import { useCallback, useEffect, useState } from "react";
import type { DiscScores } from "@/components/apprenant/apprenant-assessment-results";
import type { AxisKey } from "@/components/idmc/IdmcRadarChart";
import { analyzeCareerMatching } from "@/lib/career-profiles/career-profile-matching";
import {
  getCareerProfileBySlug,
  type CareerProfile,
} from "@/lib/career-profiles/career-profiles-data";
import {
  buildPublicSkillCards,
  computeEdgeReliabilityIndex,
} from "@/lib/hard-skills/skill-validation-analysis";
import { buildPersonalizedActionPlan } from "@/lib/learner/personalized-action-plan";
import type { LearnerHardSkillMeta } from "@/lib/particulier/profil-edge-maturity";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export type AccompagnementNextAction = {
  skill: string;
  why: string;
  action: string;
  estimatedMinutes: number;
  impact: "Fort" | "Moyen";
} | null;

export type AccompagnementSituation = {
  loading: boolean;
  edgeIndex: number;
  validatedCount: number;
  totalSkills: number;
  skillsToDevelop: number;
  unevaluatedCount: number;
  recommendedPathsCount: number;
  /** Complétude du profil : compétences évaluées / total attendu. */
  completionPercent: number;
  evaluatedCount: number;
  totalExpectedSkills: number;
  alignedCount: number;
  consolidateCount: number;
  compatibilityPercent: number;
  objectiveLabel: string;
  nextAction: AccompagnementNextAction;
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

export function useAccompagnementSituation(): AccompagnementSituation {
  const [loading, setLoading] = useState(true);
  const [edgeIndex, setEdgeIndex] = useState(0);
  const [validatedCount, setValidatedCount] = useState(0);
  const [totalSkills, setTotalSkills] = useState(0);
  const [skillsToDevelop, setSkillsToDevelop] = useState(0);
  const [unevaluatedCount, setUnevaluatedCount] = useState(0);
  const [recommendedPathsCount, setRecommendedPathsCount] = useState(0);
  const [completionPercent, setCompletionPercent] = useState(0);
  const [evaluatedCount, setEvaluatedCount] = useState(0);
  const [totalExpectedSkills, setTotalExpectedSkills] = useState(0);
  const [alignedCount, setAlignedCount] = useState(0);
  const [consolidateCount, setConsolidateCount] = useState(0);
  const [compatibilityPercent, setCompatibilityPercent] = useState(0);
  const [objectiveLabel, setObjectiveLabel] = useState("votre objectif professionnel");
  const [nextAction, setNextAction] = useState<AccompagnementNextAction>(null);

  const load = useCallback(async () => {
    const supabase = createSupabaseBrowserClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const [profileRes, discRes, softRes, idmcRes, expRes, dipRes] = await Promise.all([
      supabase
        .from("profiles")
        .select("hard_skills, skills_metadata, target_career_slug, job_title")
        .eq("id", user.id)
        .maybeSingle(),
      supabase
        .from("disc_resultats")
        .select("scores")
        .eq("profile_id", user.id)
        .maybeSingle(),
      supabase
        .from("soft_skills_resultats")
        .select("scores")
        .eq("learner_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
      supabase.from("idmc_resultats").select("scores").eq("profile_id", user.id).maybeSingle(),
      supabase.from("experiences_pro").select("*").eq("learner_id", user.id),
      supabase.from("diplomes").select("*").eq("learner_id", user.id),
    ]);

    const profile = profileRes.data;
    if (!profile) return;

    const hardSkills = (profile.hard_skills as string[] | null) ?? [];
    const skillsMetadata = (profile.skills_metadata as Record<string, LearnerHardSkillMeta>) ?? {};
    const skillNames = hardSkills.length ? hardSkills : Object.keys(skillsMetadata);
    const cards = buildPublicSkillCards(skillNames, skillsMetadata);

    setEdgeIndex(computeEdgeReliabilityIndex(skillNames, skillsMetadata));
    setTotalSkills(cards.length);
    setValidatedCount(
      cards.filter((c) => c.status === "validated" || c.status === "expert_validated").length,
    );

    const discScores = discRes.data?.scores as DiscScores | null;
    const softSkillsScores = (softRes.data?.scores as Record<string, number> | null) ?? null;
    const idmcAxes = idmcRes.data?.scores as Record<AxisKey, number> | null;
    const softSkillsList = softSkillsScores
      ? Object.entries(softSkillsScores).map(([skill, score]) => ({ skill, score }))
      : [];

    const experiences = (expRes.data ?? []).map((row) => ({
      id: String(row.id),
      employeur: row.employeur,
      poste: row.poste ?? null,
      type_contrat: row.type_contrat,
      date_debut: row.date_debut,
      date_fin: row.date_fin,
      missions: row.missions,
      competences_developpees: Array.isArray(row.competences_developpees)
        ? row.competences_developpees.map(String)
        : [],
    }));

    const diplomas = (dipRes.data ?? []).map((row) => ({
      id: String(row.id),
      intitule: row.intitule,
      ecole: row.ecole,
      annee_obtention: row.annee_obtention,
      mode: row.mode,
      diploma_type: row.diploma_type ?? null,
      niveau: row.niveau ?? null,
      description: row.description ?? null,
    }));

    const careerSlug = profile.target_career_slug as string | null;
    const career = careerSlug ? await loadCareerBySlug(careerSlug) : null;

    if (career?.title) setObjectiveLabel(career.title);

    if (discScores && career) {
      const matching = analyzeCareerMatching({
        career,
        discScores,
        softSkillsScores,
        hardSkills,
        skillsMetadata,
        experiences,
        diplomas,
        hasIdmc: Boolean(idmcAxes),
      });
      const develop = matching.develop.length;
      const unevaluated = matching.unevaluated.length;
      const aligned = matching.strengths.length;
      const consolidate = matching.consolidate.length;
      const expected = matching.skillTable.length || aligned + consolidate + develop + unevaluated;
      const evaluated = Math.max(expected - unevaluated, 0);

      setSkillsToDevelop(develop);
      setUnevaluatedCount(unevaluated);
      setAlignedCount(aligned);
      setConsolidateCount(consolidate);
      setTotalExpectedSkills(expected);
      setEvaluatedCount(evaluated);
      setCompletionPercent(expected > 0 ? Math.round((evaluated / expected) * 100) : 0);
      setCompatibilityPercent(matching.compatibilityScore);

      if (matching.nextPriority) {
        setNextAction({
          skill: matching.nextPriority.skill,
          why: `Compétence clé pour votre objectif « ${career.title} ».`,
          action: matching.nextPriority.actionLabel,
          estimatedMinutes: matching.nextPriority.actionType === "evaluation" ? 5 : 10,
          impact: "Fort",
        });
      }
    } else {
      const develop = cards.filter((c) => c.status === "ia_analyzed").length;
      const unevaluated = cards.filter((c) => c.status === "declared").length;
      const validated = cards.filter(
        (c) => c.status === "validated" || c.status === "expert_validated",
      ).length;
      const expected = cards.length;
      const evaluated = Math.max(expected - unevaluated, 0);

      setSkillsToDevelop(develop);
      setUnevaluatedCount(unevaluated);
      setAlignedCount(validated);
      setConsolidateCount(develop);
      setTotalExpectedSkills(expected);
      setEvaluatedCount(evaluated);
      setCompletionPercent(expected > 0 ? Math.round((evaluated / expected) * 100) : 0);
    }

    const plan = buildPersonalizedActionPlan({
      discScores,
      idmcAxes,
      softSkills: softSkillsList,
      jobTitle: profile.job_title as string | null,
      surface: "apprenant",
    });
    const pathItems = plan
      ? plan.parcoursSteps.length > 0
        ? plan.parcoursSteps.length
        : plan.items.filter((i) => i.kind === "formation" || i.kind === "micro_formation").length
      : 0;
    setRecommendedPathsCount(pathItems);
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

  return {
    loading,
    edgeIndex,
    validatedCount,
    totalSkills,
    skillsToDevelop,
    unevaluatedCount,
    recommendedPathsCount,
    completionPercent,
    evaluatedCount,
    totalExpectedSkills,
    alignedCount,
    consolidateCount,
    compatibilityPercent,
    objectiveLabel,
    nextAction,
  };
}

/** @deprecated Utiliser useAccompagnementSituation */
export const useAccompagnementProgression = useAccompagnementSituation;
