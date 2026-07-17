"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { DiscScores } from "@/components/apprenant/apprenant-assessment-results";
import { ProfileHeroCard } from "@/components/apprenant/profil-edge/hub/profile-hero-card";
import { DailyMissionHeroCard } from "@/components/apprenant/profil-edge/hub/daily-mission-hero-card";
import { ProfileProgressCard } from "@/components/apprenant/profil-edge/hub/profile-progress-card";
import { ProfileNavigationSection } from "@/components/apprenant/profil-edge/hub/profile-navigation-section";
import { SkillsSummaryCard } from "@/components/apprenant/profil-edge/hub/skills-summary-card";
import { AchievementsCard } from "@/components/apprenant/profil-edge/hub/achievements-card";
import { ExpertCoachingCard } from "@/components/apprenant/profil-edge/hub/expert-coaching-card";
import { HubSurface } from "@/components/apprenant/profil-edge/hub/hub-ui";
import { ProfilEdgeHubGaps } from "@/components/apprenant/profil-edge/profil-edge-hub-gaps";
import { analyzeCareerMatching } from "@/lib/career-profiles/career-profile-matching";
import {
  getCareerProfileBySlug,
  type CareerProfile,
} from "@/lib/career-profiles/career-profiles-data";
import {
  computeProfilEdgeMaturity,
  isProfessionalProjectComplete,
  parseProfessionalProject,
  PROFIL_EDGE_SECTION_HREFS,
  type Diplome,
  type ExperiencePro,
  type LearnerHardSkillMeta,
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
import { APPRENANT_PAGE_SHELL, CONNECT_BTN_PRIMARY } from "@/lib/apprenant/connect-nav";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import type { StoredHardSkillMeta } from "@/lib/hard-skills/hard-skills-portfolio";

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

export function ProfilComportementalReport() {
  const supabase = createSupabaseBrowserClient();
  const [loading, setLoading] = useState(true);
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
    const { data: userData } = await supabase.auth.getUser();
    const uid = userData.user?.id;
    if (!uid) return;

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
  }, [supabase]);

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

  if (loading) {
    return <p className="text-sm text-white/50">Chargement de votre Profil EDGE…</p>;
  }

  if (!discScores) {
    return (
      <HubSurface tone="action" className="mx-auto max-w-lg space-y-4">
        <p className="text-[12px] text-white/45">Profil EDGE</p>
        <p className="text-[17px] leading-relaxed text-white/70">
          Complétez d&apos;abord le test comportemental pour accéder à votre parcours EDGE.
        </p>
        <Link
          href="/dashboard/apprenant/test-comportemental-intro"
          className={`${CONNECT_BTN_PRIMARY} w-fit`}
        >
          Passer le test
        </Link>
      </HubSurface>
    );
  }

  return (
    <div className={`${APPRENANT_PAGE_SHELL} mx-auto max-w-[42rem] space-y-10 pb-20 md:max-w-3xl md:space-y-12`}>
      {/* Shell header already shows title — keep page lead minimal */}
      <header className="space-y-1">
        <p className="text-[13px] text-white/40">Votre espace personnel</p>
        <h1 className="sr-only">Mon Profil EDGE</h1>
      </header>

      <ProfileHeroCard
        objectiveLabel={objectiveLabel}
        referentialTitle={selectedCareer?.title ?? null}
        matching={matching}
        hasProject={hasProject}
      />

      {!selectedCareer && extractCareerTitleFromProject(typeProfil, professionalProject) ? (
        <HubSurface tone="quiet" className="text-[14px] leading-relaxed text-white/55">
          Votre projet n&apos;a pas encore été analysé.{" "}
          <Link href={PROFIL_EDGE_SECTION_HREFS.projet} className="font-medium text-white hover:underline">
            Enregistrez votre projet professionnel
          </Link>{" "}
          pour activer l&apos;alignement métier.
        </HubSurface>
      ) : null}

      {matching && selectedCareer ? (
        <DailyMissionHeroCard matching={matching} objective={objectiveLabel} />
      ) : null}

      <ProfileProgressCard maturity={maturity} />

      {matching && selectedCareer ? (
        <section id="plan-action" className="scroll-mt-24 space-y-4">
          <ProfilEdgeHubGaps matching={matching} objectiveLabel={objectiveLabel} />
        </section>
      ) : null}

      <ProfileNavigationSection
        maturity={maturity}
        testsDone={testsDone}
        experiencesCount={experiences.length}
        diplomasCount={diplomas.length}
        hardSkillsCount={hardSkills.length}
        projectLabel={hasProject ? objectiveLabel : null}
      />

      <SkillsSummaryCard
        hardSkills={hardSkills}
        skillsMetadata={skillsMetadata as Record<string, StoredHardSkillMeta>}
      />

      <AchievementsCard
        testsComplete={profilTestsComplete}
        badgeAwarded={badgeAwarded}
        badgeName={badgeName}
      />

      {matching && selectedCareer ? <ExpertCoachingCard /> : null}
    </div>
  );
}
