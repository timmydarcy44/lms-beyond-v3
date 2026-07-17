"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Award, Lock, MessageCircle } from "lucide-react";
import type { DiscScores } from "@/components/apprenant/apprenant-assessment-results";
import { ProfilEdgeMaturityGauge } from "@/components/apprenant/profil-edge/profil-edge-maturity-gauge";
import { ProfilEdgeHubActionPlan } from "@/components/apprenant/profil-edge/profil-edge-hub-action-plan";
import { ProfilEdgeHubGaps } from "@/components/apprenant/profil-edge/profil-edge-hub-gaps";
import { ProfilEdgeHubObjective } from "@/components/apprenant/profil-edge/profil-edge-hub-objective";
import { ProfilEdgeHubResults } from "@/components/apprenant/profil-edge/profil-edge-hub-results";
import { EdgeGamificationPanel } from "@/components/apprenant/profil-edge/edge-gamification-panel";
import {
  ProfilEdgeHubCard,
  ProfilEdgeHubKicker,
} from "@/components/apprenant/profil-edge/profil-edge-hub-card";
import {
  analyzeCareerMatching,
} from "@/lib/career-profiles/career-profile-matching";
import {
  getCareerProfileBySlug,
  type CareerProfile,
} from "@/lib/career-profiles/career-profiles-data";
import { getCoachingBookingHref } from "@/lib/particulier/coaching-config";
import {
  computeProfilEdgeMaturity,
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
import { buildUserObjectiveDisplay, migrateLegacyProjectToV2 } from "@/lib/particulier/edge-professional-project-v2";
import { buildProfilEdgeExplorations, isProfilEdgeComplete } from "@/lib/particulier/profil-edge-progress";
import {
  APPRENANT_PAGE_SHELL,
  CONNECT_BTN_PRIMARY,
  CONNECT_BTN_SECONDARY,
} from "@/lib/apprenant/connect-nav";
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

    const completion = profile?.cross_profile_completion as { badge_id?: string; badge_awarded_at?: string } | null;
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
  }, [discScores, selectedCareer, softSkillsScores, hardSkills, skillsMetadata, experiences, diplomas, hasIdmc]);

  const objectiveLabel =
    buildUserObjectiveDisplay(professionalProject) ||
    extractCareerTitleFromProject(typeProfil, professionalProject) ||
    selectedCareer?.title ||
    "votre objectif professionnel";

  if (loading) {
    return <p className="text-sm text-white/50">Chargement de votre Profil EDGE…</p>;
  }

  if (!discScores) {
    return (
      <ProfilEdgeHubCard className="max-w-lg gap-5">
        <ProfilEdgeHubKicker>Profil EDGE</ProfilEdgeHubKicker>
        <p className="text-[17px] leading-relaxed text-white/70">
          Complétez d&apos;abord le test comportemental pour accéder à votre parcours EDGE.
        </p>
        <Link href="/dashboard/apprenant/test-comportemental-intro" className={`${CONNECT_BTN_PRIMARY} w-fit`}>
          Passer le test
        </Link>
      </ProfilEdgeHubCard>
    );
  }

  return (
    <div className={`${APPRENANT_PAGE_SHELL} mx-auto max-w-5xl pb-16`}>
      <header className="space-y-3 pb-2">
        <ProfilEdgeHubKicker>Mon parcours</ProfilEdgeHubKicker>
        <h1 className="text-[clamp(1.75rem,4vw,2.5rem)] font-semibold tracking-[-0.03em] text-white">
          Mon Profil EDGE
        </h1>
        <p className="max-w-2xl text-[15px] leading-relaxed text-white/45">
          Suivez votre progression vers {objectiveLabel}. Une étape à la fois.
        </p>
      </header>

      {matching && selectedCareer ? (
        <EdgeGamificationPanel matching={matching} objective={objectiveLabel} />
      ) : null}

      <div className="grid gap-6 lg:grid-cols-2">
        <ProfilEdgeHubObjective
          project={professionalProject}
          referentialTitle={selectedCareer?.title ?? null}
        />
        {matching && selectedCareer ? <ProfilEdgeHubResults matching={matching} /> : null}
      </div>

      {!selectedCareer && extractCareerTitleFromProject(typeProfil, professionalProject) ? (
        <ProfilEdgeHubCard variant="muted" className="gap-3">
          <p className="text-[15px] leading-relaxed text-white/60">
            Votre projet n&apos;a pas encore été analysé.{" "}
            <Link href={PROFIL_EDGE_SECTION_HREFS.projet} className="font-medium text-[#8BB4FF] hover:underline">
              Enregistrez votre projet professionnel
            </Link>{" "}
            pour activer l&apos;analyse de compatibilité.
          </p>
        </ProfilEdgeHubCard>
      ) : null}

      <ProfilEdgeMaturityGauge
        maturity={maturity}
        testsDone={testsDone}
        experiencesCount={experiences.length}
        diplomasCount={diplomas.length}
        hardSkillsCount={hardSkills.length}
      />

      {matching && selectedCareer ? (
        <>
          <ProfilEdgeHubGaps matching={matching} objectiveLabel={objectiveLabel} />
          <ProfilEdgeHubActionPlan matching={matching} />
        </>
      ) : null}

      <ProfilEdgeHubCard className="gap-5">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/[0.06]">
            {profilTestsComplete && badgeAwarded ? (
              <Award className="h-6 w-6 text-[#FF3B30]" />
            ) : (
              <Lock className="h-6 w-6 text-white/35" />
            )}
          </div>
          <div>
            <ProfilEdgeHubKicker>Reconnaissance</ProfilEdgeHubKicker>
            {!profilTestsComplete ? (
              <>
                <p className="mt-2 text-xl font-semibold text-white">Profil EDGE en cours</p>
                <p className="mt-2 text-[14px] leading-relaxed text-white/50">
                  Le badge est délivré après les 3 tests EDGE : profil comportemental, soft skills et
                  motivation / fonctionnement.
                </p>
              </>
            ) : badgeAwarded ? (
              <>
                <p className="mt-2 text-xl font-semibold text-white">{badgeName}</p>
                <p className="mt-2 text-[14px] text-white/50">Votre profil comportemental est certifié.</p>
              </>
            ) : (
              <>
                <p className="mt-2 text-xl font-semibold text-white">Aucun badge disponible pour le moment</p>
                <p className="mt-2 text-[14px] text-white/50">Complétez les explorations pour débloquer votre badge.</p>
              </>
            )}
          </div>
        </div>
        {badgeAwarded ? (
          <Link href="/dashboard/apprenant/badges" className={`${CONNECT_BTN_SECONDARY} w-fit`}>
            Voir mon Wallet
          </Link>
        ) : null}
      </ProfilEdgeHubCard>

      {matching && selectedCareer ? (
        <ProfilEdgeHubCard variant="accent" className="gap-5">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#3D7BFF]/20 text-[#8BB4FF]">
            <MessageCircle className="h-6 w-6" />
          </div>
          <div>
            <ProfilEdgeHubKicker>Accompagnement</ProfilEdgeHubKicker>
            <p className="mt-2 text-xl font-semibold text-white">Accélérer votre progression</p>
            <p className="mt-2 max-w-xl text-[15px] leading-relaxed text-white/55">
              Un spécialiste EDGE peut vous accompagner sur vos écarts prioritaires.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Link href={getCoachingBookingHref("progression")} className={CONNECT_BTN_PRIMARY}>
              Être accompagné par un spécialiste EDGE
            </Link>
            <Link href="/dashboard/apprenant/coaching" className={CONNECT_BTN_SECONDARY}>
              Découvrir les formules
            </Link>
          </div>
        </ProfilEdgeHubCard>
      ) : null}
    </div>
  );
}
