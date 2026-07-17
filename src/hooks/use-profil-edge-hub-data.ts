"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { DiscScores } from "@/components/apprenant/apprenant-assessment-results";
import { analyzeCareerMatching, type CareerMatchingResult } from "@/lib/career-profiles/career-profile-matching";
import {
  getCareerProfileBySlug,
  type CareerProfile,
} from "@/lib/career-profiles/career-profiles-data";
import {
  computeProfilEdgeMaturity,
  isProfessionalProjectComplete,
  parseProfessionalProject,
  type Diplome,
  type ExperiencePro,
  type LearnerHardSkillMeta,
  type ProfilEdgeMaturity,
} from "@/lib/particulier/profil-edge-maturity";
import {
  extractCareerTitleFromProject,
  mergeObjectiveDetailsIntoProject,
} from "@/lib/particulier/professional-project-fields";
import {
  buildUserObjectiveDisplay,
  migrateLegacyProjectToV2,
} from "@/lib/particulier/edge-professional-project-v2";
import {
  buildProfilEdgeExplorations,
  isProfilEdgeComplete,
} from "@/lib/particulier/profil-edge-progress";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

async function loadCareerBySlug(slug: string): Promise<CareerProfile | null> {
  try {
    const careerRes = await fetch(`/api/career-profiles/search?slug=${encodeURIComponent(slug)}`);
    const careerJson = await careerRes.json();
    if (careerRes.ok && careerJson.profile) return careerJson.profile as CareerProfile;
  } catch {
    /* fallback static */
  }
  return getCareerProfileBySlug(slug) ?? null;
}

export type ProfilEdgeHubData = {
  loading: boolean;
  error: string | null;
  discScores: DiscScores | null;
  hasIdmc: boolean;
  hasSoftSkills: boolean;
  softSkillsScores: Record<string, number> | null;
  badgeAwarded: boolean;
  badgeName: string;
  selectedCareer: CareerProfile | null;
  professionalProject: ReturnType<typeof parseProfessionalProject>;
  hardSkills: string[];
  skillsMetadata: Record<string, LearnerHardSkillMeta>;
  experiences: ExperiencePro[];
  diplomas: Diplome[];
  profileRow: Record<string, unknown>;
  typeProfil: string | null;
  testsDone: number;
  profilTestsComplete: boolean;
  maturity: ProfilEdgeMaturity;
  matching: CareerMatchingResult | null;
  objectiveLabel: string;
  hasProject: boolean;
  firstName: string;
  lastName: string;
  avatarUrl: string | null;
  reload: () => Promise<void>;
};

export function useProfilEdgeHubData(): ProfilEdgeHubData {
  const supabase = createSupabaseBrowserClient();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [discScores, setDiscScores] = useState<DiscScores | null>(null);
  const [hasIdmc, setHasIdmc] = useState(false);
  const [hasSoftSkills, setHasSoftSkills] = useState(false);
  const [softSkillsScores, setSoftSkillsScores] = useState<Record<string, number> | null>(null);
  const [badgeAwarded, setBadgeAwarded] = useState(false);
  const [badgeName, setBadgeName] = useState("Profil comportemental EDGE");
  const [selectedCareer, setSelectedCareer] = useState<CareerProfile | null>(null);
  const [professionalProject, setProfessionalProject] = useState(parseProfessionalProject(null));
  const [hardSkills, setHardSkills] = useState<string[]>([]);
  const [skillsMetadata, setSkillsMetadata] = useState<Record<string, LearnerHardSkillMeta>>({});
  const [experiences, setExperiences] = useState<ExperiencePro[]>([]);
  const [diplomas, setDiplomas] = useState<Diplome[]>([]);
  const [profileRow, setProfileRow] = useState<Record<string, unknown>>({});
  const [typeProfil, setTypeProfil] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    const { data: userData } = await supabase.auth.getUser();
    const uid = userData.user?.id;
    if (!uid) {
      setError("Session introuvable.");
      return;
    }

    const [profileRes, discRes, idmcRes, softRes, expRes, dipRes] = await Promise.all([
      supabase
        .from("profiles")
        .select(
          "first_name, last_name, email, phone, telephone, city, avatar_url, target_career_slug, type_profil, objective_details, cross_profile_completion, professional_project, hard_skills, skills_metadata",
        )
        .eq("id", uid)
        .maybeSingle(),
      supabase.from("disc_resultats").select("scores").eq("profile_id", uid).maybeSingle(),
      supabase.from("idmc_resultats").select("scores").eq("profile_id", uid).maybeSingle(),
      supabase.from("soft_skills_resultats").select("scores").eq("learner_id", uid).maybeSingle(),
      supabase.from("experiences_pro").select("*").eq("learner_id", uid),
      supabase.from("diplomes").select("*").eq("learner_id", uid),
    ]);

    if (profileRes.error || discRes.error) {
      setError("Impossible de charger votre profil pour le moment.");
    }

    const profile = profileRes.data;
    const objectiveDetails = (profile?.objective_details as Record<string, string>) ?? {};
    const project = migrateLegacyProjectToV2(
      mergeObjectiveDetailsIntoProject(
        profile?.type_profil,
        parseProfessionalProject(profile?.professional_project),
        objectiveDetails,
      ),
    );
    setProfileRow((profile as Record<string, unknown>) ?? {});
    setTypeProfil(profile?.type_profil ? String(profile.type_profil) : null);
    setProfessionalProject(project);
    setHardSkills(Array.isArray(profile?.hard_skills) ? (profile.hard_skills as string[]) : []);
    setSkillsMetadata((profile?.skills_metadata as Record<string, LearnerHardSkillMeta>) ?? {});

    setHasIdmc(Boolean(idmcRes.data?.scores));
    const softScores = softRes.data?.scores as Record<string, number> | null;
    setHasSoftSkills(Boolean(softScores && Object.keys(softScores).length > 0));
    setSoftSkillsScores(softScores);

    setExperiences(
      (expRes.data ?? []).map((row) => ({
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
      })),
    );

    setDiplomas(
      (dipRes.data ?? []).map((row) => ({
        id: String(row.id),
        intitule: row.intitule,
        ecole: row.ecole,
        annee_obtention: row.annee_obtention,
        mode: row.mode,
        diploma_type: row.diploma_type ?? null,
        niveau: row.niveau ?? null,
        description: row.description ?? null,
      })),
    );

    const slug = profile?.target_career_slug ? String(profile.target_career_slug) : null;
    if (slug) {
      setSelectedCareer(await loadCareerBySlug(slug));
    } else {
      setSelectedCareer(null);
    }

    const completion = profile?.cross_profile_completion as {
      badge_id?: string;
      badge_awarded_at?: string;
    } | null;
    const testsComplete = Boolean(discRes.data?.scores && idmcRes.data?.scores && softRes.data?.scores);
    setBadgeAwarded(Boolean(testsComplete && completion?.badge_awarded_at));

    if (completion?.badge_id) {
      const { data: badge } = await supabase
        .from("open_badges")
        .select("name")
        .eq("id", completion.badge_id)
        .maybeSingle();
      if (badge?.name) setBadgeName(String(badge.name));
    }

    const scores = discRes.data?.scores as DiscScores | null;
    if (scores?.D != null) setDiscScores(scores);
    else setDiscScores(null);
  }, [supabase]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        await load();
      } catch {
        if (!cancelled) setError("Impossible de charger votre profil pour le moment.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [load]);

  const testsDone = [Boolean(discScores), hasSoftSkills, hasIdmc].filter(Boolean).length;

  const profilTestsComplete = isProfilEdgeComplete(
    buildProfilEdgeExplorations({
      hasDisc: Boolean(discScores),
      hasSoftSkills,
      hasIdmc,
    }),
  );

  const maturity = useMemo(
    () =>
      computeProfilEdgeMaturity({
        profile: {
          ...profileRow,
          type_profil: typeProfil,
          hard_skills: hardSkills,
          professional_project: professionalProject,
        },
        hasDisc: Boolean(discScores),
        hasSoftSkills,
        hasIdmc,
        experiencesCount: experiences.length,
        diplomasCount: diplomas.length,
      }),
    [
      profileRow,
      typeProfil,
      hardSkills,
      professionalProject,
      discScores,
      hasSoftSkills,
      hasIdmc,
      experiences.length,
      diplomas.length,
    ],
  );

  const matching = useMemo(() => {
    if (!discScores || !selectedCareer) return null;
    return analyzeCareerMatching({
      career: selectedCareer,
      discScores,
      softSkillsScores,
      hardSkills,
      skillsMetadata,
      experiences,
      diplomas,
      hasIdmc,
    });
  }, [
    discScores,
    selectedCareer,
    softSkillsScores,
    hardSkills,
    skillsMetadata,
    experiences,
    diplomas,
    hasIdmc,
  ]);

  const objectiveLabel =
    buildUserObjectiveDisplay(professionalProject) ||
    extractCareerTitleFromProject(typeProfil, professionalProject) ||
    selectedCareer?.title ||
    "votre objectif professionnel";

  const hasProject =
    isProfessionalProjectComplete(professionalProject, typeProfil) ||
    Boolean(buildUserObjectiveDisplay(professionalProject));

  return {
    loading,
    error,
    discScores,
    hasIdmc,
    hasSoftSkills,
    softSkillsScores,
    badgeAwarded,
    badgeName,
    selectedCareer,
    professionalProject,
    hardSkills,
    skillsMetadata,
    experiences,
    diplomas,
    profileRow,
    typeProfil,
    testsDone,
    profilTestsComplete,
    maturity,
    matching,
    objectiveLabel,
    hasProject,
    firstName: String(profileRow.first_name ?? ""),
    lastName: String(profileRow.last_name ?? ""),
    avatarUrl: profileRow.avatar_url ? String(profileRow.avatar_url) : null,
    reload: load,
  };
}
