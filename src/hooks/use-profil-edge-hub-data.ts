"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { DiscScores } from "@/components/apprenant/apprenant-assessment-results";
import { useOptionalLearnerSnapshotContext } from "@/components/learner/learner-snapshot-provider";
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
import { parseStoredDiscScores } from "@/lib/disc/disc-scoring";
import { hasMeaningfulIdmcAxes, normalizeIdmcAxesRecord } from "@/lib/idmc/idmc-display";
import type { AxisKey } from "@/components/idmc/IdmcRadarChart";
import { resolveLearnerDisplayFirstName } from "@/lib/apprenant/display-first-name";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { fetchIdmcAxesForCandidates } from "@/lib/learner/resolve-learner-profile-candidates";
import { collectLearnerProfileCandidates } from "@/lib/learner/resolve-learner-profile-candidates";

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

function softRadarToRecord(
  radar: Array<{ skill: string; score: number }> | null | undefined,
): Record<string, number> | null {
  if (!radar?.length) return null;
  const out: Record<string, number> = {};
  for (const row of radar) {
    const k = String(row.skill ?? "").trim();
    if (!k) continue;
    out[k] = Number(row.score) || 0;
  }
  return Object.keys(out).length ? out : null;
}

export type ProfilEdgeHubData = {
  loading: boolean;
  error: string | null;
  discScores: DiscScores | null;
  hasIdmc: boolean;
  hasSoftSkills: boolean;
  softSkillsScores: Record<string, number> | null;
  /** Axes IDMC pour graphiques (payload, pas seulement le flag completed). */
  idmcAxes: Record<AxisKey, number> | null;
  /** Soft skills radar pour graphiques. */
  softSkillsRadar: Array<{ skill: string; score: number }>;
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

/**
 * Hub Profil EDGE — lit les diagnostics via learner-snapshot (candidats multi-profil,
 * parseStoredDiscScores, soft skills apprenant+salarié) pour rester compatible legacy.
 */
export function useProfilEdgeHubData(): ProfilEdgeHubData {
  const supabase = createSupabaseBrowserClient();
  const snapshotCtx = useOptionalLearnerSnapshotContext();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [discScores, setDiscScores] = useState<DiscScores | null>(null);
  const [hasIdmc, setHasIdmc] = useState(false);
  const [hasSoftSkills, setHasSoftSkills] = useState(false);
  const [softSkillsScores, setSoftSkillsScores] = useState<Record<string, number> | null>(null);
  const [idmcAxes, setIdmcAxes] = useState<Record<AxisKey, number> | null>(null);
  const [softSkillsRadar, setSoftSkillsRadar] = useState<Array<{ skill: string; score: number }>>([]);
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
  const [authEmail, setAuthEmail] = useState<string | null>(null);
  const [authMetaFirstName, setAuthMetaFirstName] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    const t0 = typeof performance !== "undefined" ? performance.now() : 0;
    const { data: userData } = await supabase.auth.getUser();
    const uid = userData.user?.id;
    if (!uid) {
      setError("Session introuvable.");
      return;
    }

    const meta = (userData.user?.user_metadata ?? {}) as Record<string, unknown>;
    setAuthEmail(userData.user?.email ?? null);
    setAuthMetaFirstName(
      (typeof meta.first_name === "string" && meta.first_name) ||
        (typeof meta.prenom === "string" && meta.prenom) ||
        (typeof meta.given_name === "string" && meta.given_name) ||
        null,
    );

    // Diagnostics : payloads complets (pas seulement flags completed).
    let snapDisc: DiscScores | null = null;
    let snapIdmcAxes: Record<AxisKey, number> | null = null;
    let snapSoftRadar: Array<{ skill: string; score: number }> = [];

    const existingSnap = snapshotCtx?.snapshot;
    const applySnap = (snap: {
      discScores?: unknown;
      idmcAxes?: Record<AxisKey, number> | null;
      softSkillsRadar?: Array<{ skill: string; score: number }>;
    }) => {
      snapDisc = snap.discScores
        ? (parseStoredDiscScores(snap.discScores as Record<string, unknown>) as DiscScores | null)
        : null;
      snapIdmcAxes = snap.idmcAxes ? normalizeIdmcAxesRecord(snap.idmcAxes) : null;
      snapSoftRadar = Array.isArray(snap.softSkillsRadar) ? snap.softSkillsRadar : [];
    };

    // Snapshot + tables en parallèle (évite waterfall snapshot → queries)
    const snapshotPromise: Promise<{
      discScores?: unknown;
      idmcAxes?: Record<AxisKey, number> | null;
      softSkillsRadar?: Array<{ skill: string; score: number }>;
    } | null> =
      existingSnap && !snapshotCtx?.loading
        ? Promise.resolve(existingSnap)
        : fetch("/api/dashboard/learner-snapshot", {
            credentials: "include",
            cache: "no-store",
          })
            .then(async (res) => (res.ok ? ((await res.json()) as object) : null))
            .catch(() => null);

    const [snapPayload, profileRes, discRes, idmcRes, softRes, expRes, dipRes] = await Promise.all([
      snapshotPromise,
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

    if (snapPayload) applySnap(snapPayload);

    if (typeof performance !== "undefined" && process.env.NODE_ENV === "development") {
      // eslint-disable-next-line no-console
      console.info(
        `[edge-perf] profil-edge-hub parallel queries: ${Math.round(performance.now() - t0)}ms`,
      );
    }
    if (profileRes.error) {
      // Soft fail : ne bloque pas l'évolution si disc/snapshot sont dispo
      console.warn("[profil-edge-hub] profiles fetch", profileRes.error.message);
      if (!snapDisc && !profileRes.data) {
        setError("Impossible de charger votre profil pour le moment.");
      }
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
    setProfileRow({
      ...((profile as Record<string, unknown>) ?? {}),
      email:
        (profile?.email ? String(profile.email) : null) ||
        userData.user?.email ||
        null,
    });
    setTypeProfil(profile?.type_profil ? String(profile.type_profil) : null);
    setProfessionalProject(project);
    setHardSkills(Array.isArray(profile?.hard_skills) ? (profile.hard_skills as string[]) : []);
    setSkillsMetadata((profile?.skills_metadata as Record<string, LearnerHardSkillMeta>) ?? {});

    // Fusion snapshot (prioritaire) + fallback auth uid / colonnes legacy profil
    let resolvedDisc = snapDisc;
    if (!resolvedDisc) {
      resolvedDisc = parseStoredDiscScores(
        (discRes.data?.scores as Record<string, unknown> | null) ?? null,
      ) as DiscScores | null;
    }
    setDiscScores(resolvedDisc);

    let resolvedIdmcAxes = snapIdmcAxes;
    if (!resolvedIdmcAxes && idmcRes.data?.scores) {
      resolvedIdmcAxes = normalizeIdmcAxesRecord(idmcRes.data.scores) as Record<AxisKey, number> | null;
    }
    if (!resolvedIdmcAxes) {
      try {
        const email =
          (profile?.email ? String(profile.email) : null) || userData.user?.email || null;
        const candidates = await collectLearnerProfileCandidates(supabase, uid, email);
        resolvedIdmcAxes = (await fetchIdmcAxesForCandidates(
          supabase,
          candidates,
        )) as Record<AxisKey, number> | null;
      } catch {
        /* ignore */
      }
    }
    if (!hasMeaningfulIdmcAxes(resolvedIdmcAxes)) {
      resolvedIdmcAxes = null;
    }
    setIdmcAxes(resolvedIdmcAxes);
    setHasIdmc(Boolean(resolvedIdmcAxes));

    let resolvedRadar = snapSoftRadar;
    if (!resolvedRadar.length && softRes.data?.scores) {
      const rec = softRes.data.scores as Record<string, number>;
      resolvedRadar = Object.entries(rec)
        .map(([skill, score]) => ({ skill, score: Number(score) || 0 }))
        .filter((r) => r.skill);
    }
    const resolvedSoft = softRadarToRecord(resolvedRadar);
    setSoftSkillsRadar(resolvedRadar);
    setHasSoftSkills(Boolean(resolvedSoft && Object.keys(resolvedSoft).length > 0));
    setSoftSkillsScores(resolvedSoft);

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
    const testsComplete = Boolean(resolvedDisc && resolvedIdmcAxes && resolvedSoft);
    setBadgeAwarded(Boolean(testsComplete && completion?.badge_awarded_at));

    if (completion?.badge_id) {
      const { data: badge } = await supabase
        .from("open_badges")
        .select("name")
        .eq("id", completion.badge_id)
        .maybeSingle();
      if (badge?.name) setBadgeName(String(badge.name));
    }
  }, [supabase, snapshotCtx?.snapshot, snapshotCtx?.loading]);

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

  // Recharger quand le snapshot shell arrive après le premier paint
  useEffect(() => {
    if (!snapshotCtx?.loading && snapshotCtx?.snapshot) {
      void load();
    }
  }, [snapshotCtx?.loading, snapshotCtx?.snapshot, load]);

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
    idmcAxes,
    softSkillsRadar,
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
    firstName: resolveLearnerDisplayFirstName({
      profileFirstName: profileRow.first_name ? String(profileRow.first_name) : null,
      metadataFirstName: authMetaFirstName,
      email: authEmail ?? (profileRow.email ? String(profileRow.email) : null),
    }),
    lastName: String(profileRow.last_name ?? ""),
    avatarUrl: profileRow.avatar_url ? String(profileRow.avatar_url) : null,
    reload: load,
  };
}
