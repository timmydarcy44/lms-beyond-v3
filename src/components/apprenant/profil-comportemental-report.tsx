"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Award, Lock } from "lucide-react";
import type { DiscScores } from "@/components/apprenant/apprenant-assessment-results";
import { ProfilEdgeMaturityGauge } from "@/components/apprenant/profil-edge/profil-edge-maturity-gauge";
import { ProfilEdgeMatchingSection } from "@/components/apprenant/profil-edge/profil-edge-matching-section";
import { ProfilEdgeObjectiveCard } from "@/components/apprenant/profil-edge/profil-edge-objective-card";
import { ProfilEdgeProfileBlocks } from "@/components/apprenant/profil-edge/profil-edge-profile-blocks";
import {
  analyzeCareerMatching,
  buildDynamicActionPlan,
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
import { buildProfilEdgeExplorations, isProfilEdgeComplete } from "@/lib/particulier/profil-edge-progress";
import {
  APPRENANT_CARD_BODY,
  APPRENANT_CARD_KICKER,
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
  const [firstName, setFirstName] = useState("");
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
    const project = mergeObjectiveDetailsIntoProject(
      profile?.type_profil,
      parseProfessionalProject(profile?.professional_project),
      objectiveDetails,
    );
    setProfileRow((profile as Record<string, unknown>) ?? {});
    setTypeProfil(profile?.type_profil ? String(profile.type_profil) : null);
    setFirstName(String(profile?.first_name ?? "").trim());
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

  const actionPlan = useMemo(() => {
    if (!discScores || !selectedCareer || !matching) return "";
    return buildDynamicActionPlan({
      firstName,
      careerTitle: selectedCareer.title,
      matching,
      discScores,
    });
  }, [firstName, selectedCareer, matching, discScores]);

  const careerTitle = selectedCareer?.title ?? extractCareerTitleFromProject(typeProfil, professionalProject);

  if (loading) {
    return <p className="text-sm text-white/50">Chargement de votre Profil EDGE…</p>;
  }

  if (!discScores) {
    return (
      <div className={APPRENANT_CARD_BODY}>
        <p className="text-white/70">Complétez d&apos;abord le test comportemental pour accéder à votre Profil EDGE.</p>
        <Link href="/dashboard/apprenant/test-comportemental-intro" className={`${CONNECT_BTN_PRIMARY} mt-4 w-fit`}>
          Passer le test
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header>
        <p className={APPRENANT_CARD_KICKER}>EDGE Particulier</p>
        <h1 className="mt-2 text-2xl font-bold tracking-tight text-white md:text-3xl">Mon Profil EDGE</h1>
        <p className="mt-2 text-sm text-white/50">
          Moteur de progression — orientation, compétences et évolution professionnelle
        </p>
      </header>

      <ProfilEdgeMaturityGauge maturity={maturity} />

      <ProfilEdgeObjectiveCard project={professionalProject} typeProfil={typeProfil} careerTitle={careerTitle} />

      {!selectedCareer && extractCareerTitleFromProject(typeProfil, professionalProject) ? (
        <section className={APPRENANT_CARD_BODY}>
          <p className="text-sm text-white/60">
            Le métier « {extractCareerTitleFromProject(typeProfil, professionalProject)} » n&apos;a pas encore été
            analysé.{" "}
            <Link href={PROFIL_EDGE_SECTION_HREFS.projet} className="text-[#3D7BFF] hover:underline">
              Complétez votre projet professionnel
            </Link>{" "}
            pour activer l&apos;analyse de compatibilité.
          </p>
        </section>
      ) : null}

      {matching && selectedCareer ? (
        <ProfilEdgeMatchingSection careerTitle={selectedCareer.title} matching={matching} actionPlan={actionPlan} />
      ) : null}

      <ProfilEdgeProfileBlocks
        experiencesCount={experiences.length}
        diplomasCount={diplomas.length}
        hardSkills={hardSkills}
        skillsMetadata={skillsMetadata}
      />

      <section className={APPRENANT_CARD_BODY}>
        <div className="flex items-center gap-3">
          {profilTestsComplete && badgeAwarded ? (
            <Award className="h-8 w-8 text-[#FF3B30]" />
          ) : (
            <Lock className="h-8 w-8 text-white/35" />
          )}
          <div>
            <p className="text-xs uppercase tracking-wider text-white/40">Badge Profil comportemental EDGE</p>
            {!profilTestsComplete ? (
              <>
                <p className="font-semibold text-white">Profil EDGE en cours</p>
                <p className="mt-1 text-sm text-white/55">Aucun badge disponible pour le moment.</p>
              </>
            ) : badgeAwarded ? (
              <p className="font-semibold text-white">{badgeName}</p>
            ) : (
              <p className="font-semibold text-white">Aucun badge disponible pour le moment.</p>
            )}
          </div>
        </div>
        {!profilTestsComplete ? (
          <p className="mt-3 text-sm text-white/50">
            Le badge est délivré uniquement après les 3 tests EDGE : profil comportemental, soft skills et
            motivation / fonctionnement.
          </p>
        ) : badgeAwarded ? (
          <Link href="/dashboard/apprenant/badges" className={`${CONNECT_BTN_SECONDARY} mt-4 w-fit`}>
            Voir mon Wallet
          </Link>
        ) : null}
      </section>

      {matching && selectedCareer ? (
        <section className={APPRENANT_CARD_BODY}>
          <h2 className="text-lg font-semibold text-white">Accélérer votre progression</h2>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-white/55">
            Transformez votre analyse EDGE en compétences concrètes avec un expert : coaching, simulation
            professionnelle ou programme de progression.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/dashboard/apprenant/coaching" className={CONNECT_BTN_PRIMARY}>
              Découvrir les formules
            </Link>
            <Link href={getCoachingBookingHref("progression")} className={CONNECT_BTN_SECONDARY}>
              Réserver un accompagnement
            </Link>
          </div>
        </section>
      ) : null}
    </div>
  );
}
