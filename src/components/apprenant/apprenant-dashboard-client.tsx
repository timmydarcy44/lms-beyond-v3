"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AlertTriangle, ChevronDown, ChevronUp, Sparkles } from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { AxisKey, resolveIdmcAxes } from "@/components/idmc/IdmcRadarChart";
import {
  GLOBAL_SKILL_REFERENTIAL,
  GLOBAL_STACK_REFERENTIAL,
  resolveToolLogo,
} from "@/lib/profile/competency-referential";
import { PaywallConnect } from "@/components/paywalls/paywall-connect";
import dynamic from "next/dynamic";
import { ApprenantConnectOverview } from "@/components/apprenant/apprenant-connect-overview";

const PersonalizedActionPlanSection = dynamic(
  () =>
    import("@/components/learner/personalized-action-plan-section").then((m) => ({
      default: m.PersonalizedActionPlanSection,
    })),
  { ssr: false },
);
import {
  ApprenantAssessmentResults,
  type DiscScores,
} from "@/components/apprenant/apprenant-assessment-results";
import type {
  LearnerEarnedOpenBadge,
  LearnerVisibleOpenBadge,
} from "@/lib/openbadges/learner-visible-badges";
import { useApprenantShell } from "@/components/apprenant/apprenant-shell-context";
import { EDGE_LAB_ONLINE_CATALOG_HREF } from "@/lib/galaxy-branding";
import { resolveLearnerDisplayFirstName } from "@/lib/apprenant/display-first-name";
import { buildPersonalizedActionPlan } from "@/lib/learner/personalized-action-plan";
import { useOptionalLearnerSnapshotContext } from "@/components/learner/learner-snapshot-provider";
import { getProfileSituationLabel } from "@/lib/apprenant/profile-situation";
import { parseStoredDiscScores } from "@/lib/disc/disc-scoring";
import {
  fetchLatestSoftSkillsResult,
  parseSoftSkillsScoreEntries,
} from "@/lib/soft-skills/resolve-soft-skills-result";
import {
  APPRENANT_CARD_BODY,
  APPRENANT_CARD_KICKER,
  APPRENANT_PAGE_KICKER,
  APPRENANT_PAGE_TITLE,
  CONNECT_BTN_SECONDARY,
} from "@/lib/apprenant/connect-nav";

type IdmcData = {
  scores?: Record<string, unknown> | null;
  responses?: Record<string, unknown> | null;
  global_score?: number | null;
  level?: string | null;
  updated_at?: string | null;
  } | null;
type ExperiencePro = {
  id?: string;
  learner_id?: string;
  employeur?: string | null;
  type_contrat?: string | null;
  date_debut?: string | null;
  date_fin?: string | null;
  missions?: string | null;
};
type Diplome = {
  id?: string;
  learner_id?: string;
  intitule?: string | null;
  ecole?: string | null;
  annee_obtention?: number | null;
  mode?: string | null;
};
/** Erreurs attendues si table absente, colonne manquante ou aucune ligne — ne pas spammer la console. */
function isBenignOptionalTableError(err: unknown) {
  const e = err as { code?: string; message?: string };
  const c = String(e?.code ?? "");
  return c === "42P01" || c === "42703" || c === "PGRST116";
}

function computeAgeFromBirthDate(birthDate: string): number | null {
  if (!birthDate) return null;
  const date = new Date(birthDate);
  if (Number.isNaN(date.getTime())) return null;
  const now = new Date();
  let age = now.getFullYear() - date.getFullYear();
  const monthDiff = now.getMonth() - date.getMonth();
  const dayDiff = now.getDate() - date.getDate();
  if (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)) {
    age -= 1;
  }
  return age >= 0 ? age : null;
}

export type ApprenantPrimaryParcours = { title: string; href: string };

export function ApprenantDashboardClient({
  initialView,
  primaryParcours = null,
  visibleOpenBadges = [],
  earnedOpenBadges = [],
  homeHref = "/dashboard/apprenant",
}: {
  initialView: "home" | "profil";
  primaryParcours?: ApprenantPrimaryParcours | null;
  visibleOpenBadges?: LearnerVisibleOpenBadge[];
  earnedOpenBadges?: LearnerEarnedOpenBadge[];
  homeHref?: string;
}) {
  const router = useRouter();
  const supabase = createSupabaseBrowserClient();
  const appShell = useApprenantShell();
  const learnerSnapshotCtx = useOptionalLearnerSnapshotContext();
  const isSalarieSurface = homeHref.startsWith("/dashboard/salarie");
  const snapshotHasTests = Boolean(
    learnerSnapshotCtx?.snapshot?.discScores ||
      learnerSnapshotCtx?.snapshot?.idmcAxes ||
      (learnerSnapshotCtx?.snapshot?.softSkillsRadar?.length ?? 0) > 0,
  );
  const useSnapshotTests =
    isSalarieSurface &&
    Boolean(learnerSnapshotCtx) &&
    !learnerSnapshotCtx.loading &&
    snapshotHasTests;
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<{
    id?: string;
    email?: string;
    user_metadata?: { first_name?: string | null; last_name?: string | null };
  } | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [cachedFirstName, setCachedFirstName] = useState("");
  const [profile, setProfile] = useState<{
    first_name?: string | null;
    last_name?: string | null;
    age?: number | null;
    city?: string | null;
    telephone?: string | null;
    bio?: string | null;
    avatar_url?: string | null;
    email?: string | null;
    entreprise_id?: string | null;
    school_id?: string | null;
    school_class?: string | null;
    phone?: string | null;
    soft_skills_scores?: Record<string, number> | null;
    type_profil?: "emploi" | "freelance" | "reconversion" | "alternance" | null;
    tjm?: string | null;
    expertise?: string | null;
    stack_technique?: string | null;
    disponibilite?: string | null;
    langues?: string | null;
    ecole?: string | null;
    niveau_etude?: string | null;
    rythme_alternance?: string | null;
    date_fin_contrat?: string | null;
    access_connect?: boolean | null;
    onboarding_completed?: boolean | null;
  } | null>(null);
  const [discScores, setDiscScores] = useState<DiscScores | null>(null);
  const [idmcAxes, setIdmcAxes] = useState<Record<AxisKey, number> | null>(null);
  const [idmcData, setIdmcData] = useState<IdmcData>(null);
  const [softSkillsData, setSoftSkillsData] = useState<Record<string, unknown> | null>(null);
  const [softSkillsRadar, setSoftSkillsRadar] = useState<Array<{ skill: string; score: number }>>(
    []
  );
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [experiencePreview, setExperiencePreview] = useState<Array<Record<string, unknown>>>([]);
  const [skillsMetadata, setSkillsMetadata] = useState<
    Record<string, { level: "Débutant" | "Intermédiaire" | "Expert"; validated: boolean; source: "manual" | "badge" }>
  >({});
  const [hardSkills, setHardSkills] = useState<string[]>([]);
  const [showSkillModal, setShowSkillModal] = useState(false);
  const [skillSearch, setSkillSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>(
    GLOBAL_SKILL_REFERENTIAL[0]?.category ?? ""
  );
  const [showOnboardingStackCatalog, setShowOnboardingStackCatalog] = useState(false);
  const [onboardingStackSearch, setOnboardingStackSearch] = useState("");
  const [onboardingStackCategory, setOnboardingStackCategory] = useState<string>(
    GLOBAL_STACK_REFERENTIAL[0]?.category ?? ""
  );
  const [pendingHardSkill, setPendingHardSkill] = useState<string | null>(null);
  const [pendingSkillProof, setPendingSkillProof] = useState(false);
  const [manualSkillName, setManualSkillName] = useState("");
  const [showManualSkillInput, setShowManualSkillInput] = useState(false);
  const [manualSkillLevel, setManualSkillLevel] = useState<"Débutant" | "Intermédiaire" | "Expert">(
    "Débutant"
  );
  const [showOnboardingModal, setShowOnboardingModal] = useState(false);
  const [isSavingOnboarding, setIsSavingOnboarding] = useState(false);
  const [onboardingError, setOnboardingError] = useState<string | null>(null);
  const [isProfileGaugeExpanded, setIsProfileGaugeExpanded] = useState(true);
  const [schoolJoinCodeInput, setSchoolJoinCodeInput] = useState("");
  const [schoolJoinBusy, setSchoolJoinBusy] = useState(false);
  const [schoolJoinError, setSchoolJoinError] = useState<string | null>(null);
  const [schoolJoinMessage, setSchoolJoinMessage] = useState<string | null>(null);
  const [onboardingForm, setOnboardingForm] = useState({
    first_name: "",
    last_name: "",
    birth_date: "",
    city: "",
    telephone: "",
    poste_actuel: "",
    entreprise: "",
    type_contrat: "",
    tjm: "",
    expertise: "",
    stack_technique: "",
    disponibilite: "",
    langues: "",
    ancien_metier: "",
    metier_vise: "",
    organisme_formation: "",
    echeance: "",
    ecole: "",
    niveau_etude: "",
    rythme_alternance: "",
    date_fin_contrat: "",
  });

  const slugify = (value: string) =>
    value
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)+/g, "");

  const hasOrganisation = Boolean(profile?.entreprise_id || profile?.school_id);
  const learnerIdentifier = user?.id
    ? `APP-${user.id.replace(/-/g, "").slice(0, 8).toUpperCase()}`
    : "—";
  const [educationPreview, setEducationPreview] = useState<Array<Record<string, unknown>>>([]);
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
  const [aiAnalysisUpdatedAt, setAiAnalysisUpdatedAt] = useState<string | null>(null);
  const [aiAnalysisLoading, setAiAnalysisLoading] = useState(false);
  const [idmcUpdatedAt, setIdmcUpdatedAt] = useState<string | null>(null);
  const [experiencesPro, setExperiencesPro] = useState<ExperiencePro[]>([]);
  const [diplomes, setDiplomes] = useState<Diplome[]>([]);
  const [showExperienceForm, setShowExperienceForm] = useState(false);
  const [showDiplomeForm, setShowDiplomeForm] = useState(false);
  const [isSavingExperience, setIsSavingExperience] = useState(false);
  const [isSavingDiplome, setIsSavingDiplome] = useState(false);
  const [experienceForm, setExperienceForm] = useState({
    employeur: "",
    type_contrat: "CDI",
    date_debut: "",
    date_fin: "",
    missions: "",
  });
  const [diplomeForm, setDiplomeForm] = useState({
    intitule: "",
    ecole: "",
    annee_obtention: "",
    mode: "Alternance",
  });

  useEffect(() => {
    try {
      setCachedFirstName(localStorage.getItem("beyond_firstname") ?? "");
    } catch {
      setCachedFirstName("");
    }
  }, []);

  useEffect(() => {
    if (useSnapshotTests && learnerSnapshotCtx) {
      void learnerSnapshotCtx.refresh();
    }
  }, [learnerSnapshotCtx, useSnapshotTests]);

  useEffect(() => {
    if (!isSalarieSurface || !learnerSnapshotCtx || learnerSnapshotCtx.loading) return;
    if (snapshotHasTests) return;
    void learnerSnapshotCtx.refresh();
  }, [isSalarieSurface, learnerSnapshotCtx, learnerSnapshotCtx?.loading, snapshotHasTests]);

  useEffect(() => {
    if (!useSnapshotTests || !learnerSnapshotCtx?.snapshot) return;
    const s = learnerSnapshotCtx.snapshot;
    if (s.discScores) setDiscScores(s.discScores);
    if (s.idmcAxes) setIdmcAxes(s.idmcAxes);
    setSoftSkillsRadar(s.softSkillsRadar ?? []);
    if (s.softSkillsRadar?.length) {
      setSoftSkillsData(Object.fromEntries(s.softSkillsRadar.map(({ skill, score }) => [skill, score])));
    }
    if (s.firstName?.trim()) {
      setCachedFirstName(s.firstName.trim());
    }
  }, [learnerSnapshotCtx?.snapshot, useSnapshotTests]);

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      if (!supabase) {
        setIsLoading(false);
        return;
      }
      try {
        const { data: userData, error: userError } = await supabase.auth.getUser();
        if (userError || !userData?.user?.id) {
          setIsLoading(false);
          return;
        }
        const userId = userData.user.id;
        if (!userId) {
          setIsLoading(false);
          return;
        }
        const profileIdsToQuery = [userId];
        const rawMeta = (userData.user.user_metadata ?? {}) as Record<string, unknown>;
        const metaFullName = typeof rawMeta.full_name === "string" ? rawMeta.full_name.trim() : "";
        const emailValue = userData.user.email ?? "";
        const emailPrefix = emailValue.split("@")[0] ?? "";
        const emailParts = emailPrefix.split(/[.\-_]/).filter(Boolean);
        const capitalize = (value: string) =>
          value ? `${value[0].toUpperCase()}${value.slice(1).toLowerCase()}` : "";
        const emailFirstName = capitalize(emailParts[0] ?? "");
        const emailLastName = emailParts.slice(1).map(capitalize).join(" ");
        const metaFirstName = (
          typeof rawMeta.first_name === "string" ? rawMeta.first_name.trim() : ""
        ) ||
          (typeof rawMeta.prenom === "string" ? rawMeta.prenom.trim() : "") ||
          metaFullName.split(" ").filter(Boolean)[0] ||
          emailFirstName;
        const metaLastName = (
          typeof rawMeta.last_name === "string" ? rawMeta.last_name.trim() : ""
        ) ||
          (typeof rawMeta.nom === "string" ? rawMeta.nom.trim() : "") ||
          metaFullName.split(" ").filter(Boolean).slice(1).join(" ") ||
          emailLastName;

        setUser({
          id: userId,
          email: userData.user.email ?? undefined,
          user_metadata: rawMeta as { first_name?: string | null; last_name?: string | null },
        });
        if (isSalarieSurface && emailValue) {
          const { data: employeeLink } = await supabase
            .from("employees")
            .select("profile_id")
            .or(`profile_id.eq.${userId},email.eq.${emailValue}`)
            .order("created_at", { ascending: false })
            .limit(1)
            .maybeSingle();
          const linkedProfileId = String(employeeLink?.profile_id ?? "").trim();
          if (linkedProfileId && !profileIdsToQuery.includes(linkedProfileId)) {
            profileIdsToQuery.push(linkedProfileId);
          }
        }
        const { data: profileRole } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", userData.user.id)
          .maybeSingle();
        setUserRole(profileRole?.role ?? null);

        try {
          let { data: profileData } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", userId)
          .maybeSingle();
          if (!profileData && userData.user.email) {
            const { data: legacyProfileData } = await supabase
              .from("profiles")
              .select("*")
              .eq("email", userData.user.email)
              .maybeSingle();
            profileData = legacyProfileData ?? null;
          }
          const resolvedProfileId =
            profileData && typeof (profileData as Record<string, unknown>).id === "string"
              ? String((profileData as Record<string, unknown>).id)
              : null;
          if (resolvedProfileId && resolvedProfileId !== userId) {
            profileIdsToQuery.push(resolvedProfileId);
          }
          if (!profileData) {
            const { data: created } = await supabase
              .from("profiles")
              .upsert(
                {
                  id: userId,
                  email: userData.user.email ?? null,
                  first_name: metaFirstName || null,
                  last_name: metaLastName || null,
                },
                { onConflict: "id" }
              )
              .select("*")
              .maybeSingle();
            profileData = created ?? null;
          } else {
            const authEmail = userData.user.email?.trim().toLowerCase() ?? "";
            const profileEmail = String((profileData as Record<string, unknown>).email ?? "")
              .trim()
              .toLowerCase();
            const needsEmailFix = authEmail && profileEmail && authEmail !== profileEmail;
            const needsFirst = !String((profileData as Record<string, unknown>).first_name ?? "").trim();
            const needsLast = !String((profileData as Record<string, unknown>).last_name ?? "").trim();
            if (needsEmailFix || (needsFirst && metaFirstName) || (needsLast && metaLastName)) {
              const { data: updated } = await supabase
                .from("profiles")
                .update({
                  ...(needsEmailFix ? { email: userData.user.email ?? null } : {}),
                  first_name: needsFirst ? metaFirstName || null : (profileData as Record<string, unknown>).first_name,
                  last_name: needsLast ? metaLastName || null : (profileData as Record<string, unknown>).last_name,
                })
                .eq("id", userId)
                .select("*")
                .maybeSingle();
              profileData = updated ?? profileData;
            }
          }
          setProfile(profileData ?? null);
          if (profileData) {
            setOnboardingForm({
              first_name: String(profileData.first_name ?? metaFirstName ?? "").trim(),
              last_name: String(profileData.last_name ?? metaLastName ?? "").trim(),
              birth_date: String(profileData.birth_date ?? profileData.date_naissance ?? "").trim(),
              city: String(profileData.city ?? "").trim(),
              telephone: String(profileData.telephone ?? "").trim(),
              poste_actuel: String(profileData.poste_actuel ?? "").trim(),
              entreprise: String(profileData.entreprise ?? "").trim(),
              type_contrat: String(profileData.type_contrat ?? "").trim(),
              tjm: String(profileData.tjm ?? "").trim(),
              expertise: String(profileData.expertise ?? "").trim(),
              stack_technique: String(profileData.stack_technique ?? "").trim(),
              disponibilite:
                profileData.disponibilite === true || String(profileData.disponibilite ?? "").toLowerCase() === "oui"
                  ? "Oui"
                  : profileData.disponibilite === false || String(profileData.disponibilite ?? "").toLowerCase() === "non"
                    ? "Non"
                    : "",
              langues: String(profileData.langues ?? "").trim(),
              ancien_metier: String(profileData.ancien_metier ?? "").trim(),
              metier_vise: String(profileData.metier_vise ?? "").trim(),
              organisme_formation: String(profileData.organisme_formation ?? "").trim(),
              echeance: String(profileData.echeance ?? "").trim(),
              ecole: String(profileData.ecole ?? "").trim(),
              niveau_etude: String(profileData.niveau_etude ?? "").trim(),
              rythme_alternance: String(profileData.rythme_alternance ?? "").trim(),
              date_fin_contrat: String(profileData.date_fin_contrat ?? "").trim(),
            });
          }
          try {
            const first = String(profileData.first_name ?? metaFirstName ?? "").trim();
            const last = String(profileData.last_name ?? metaLastName ?? "").trim();
            const base = `${first} ${last}`.trim();
            const slugBase = base || emailPrefix || userId;
            const publicSlug = slugify(slugBase);
            await supabase
              .from("user_profile_settings")
              .upsert(
                { user_id: userId, public_slug: publicSlug },
                { onConflict: "user_id" }
              );
          } catch {
            // ignore public slug creation errors
          }
          if (profileData) {
            const metadataRaw = (profileData as Record<string, unknown>).skills_metadata;
            if (metadataRaw && typeof metadataRaw === "object") {
              setSkillsMetadata(metadataRaw as Record<string, { level: "Débutant" | "Intermédiaire" | "Expert"; validated: boolean; source: "manual" | "badge" }>);
            } else if (typeof metadataRaw === "string") {
              try {
                const parsed = JSON.parse(metadataRaw) as Record<
                  string,
                  { level: "Débutant" | "Intermédiaire" | "Expert"; validated: boolean; source: "manual" | "badge" }
                >;
                setSkillsMetadata(parsed);
              } catch {
                setSkillsMetadata({});
              }
            } else {
              setSkillsMetadata({});
            }
            const hard = Array.isArray((profileData as Record<string, unknown>).hard_skills)
              ? ((profileData as Record<string, unknown>).hard_skills as string[])
              : [];
            setHardSkills(hard);
          } else {
            setSkillsMetadata({});
            setHardSkills([]);
          }
          try {
            const { data: analysisData } = await supabase
              .from("profiles")
              .select("*")
              .eq("id", userId)
              .maybeSingle();
            if (analysisData?.ai_analysis && typeof analysisData.ai_analysis === "string") {
              try {
                const parsed = JSON.parse(analysisData.ai_analysis) as {
                  text?: string;
                  updated_at?: string;
                };
                setAiAnalysis(parsed.text ?? analysisData.ai_analysis);
                setAiAnalysisUpdatedAt(parsed.updated_at ?? null);
      } catch {
                setAiAnalysis(analysisData.ai_analysis);
              }
            }
            const experiences = Array.isArray(analysisData?.experience)
              ? (analysisData?.experience as Array<Record<string, unknown>>)
              : [];
            const educations = Array.isArray(analysisData?.education)
              ? (analysisData?.education as Array<Record<string, unknown>>)
              : [];
            setExperiencePreview(experiences.slice(0, 2));
            setEducationPreview(educations.slice(0, 1));
          } catch {
            // ignore missing column or RLS
          }
        } catch {
          setProfile(null);
        }

        try {
          if (!useSnapshotTests) {
          let discResult: { scores?: Record<string, unknown> | null } | null = null;
          for (const candidateId of profileIdsToQuery) {
            const { data, error } = await supabase
              .from("disc_resultats")
              .select("scores")
              .eq("profile_id", candidateId)
              .maybeSingle();
            if (error) {
              if (!isBenignOptionalTableError(error)) {
                console.warn("[disc] disc_resultats:", error);
              }
              continue;
            }
            if (data) {
              discResult = data as { scores?: Record<string, unknown> | null };
              break;
            }
          }

          if (discResult?.scores && typeof discResult.scores === "object") {
            const parsed = parseStoredDiscScores(discResult.scores as Record<string, unknown>);
            setDiscScores(parsed);
          } else {
            setDiscScores(null);
          }
          }
        } catch {
          if (!useSnapshotTests) setDiscScores(null);
        }

        try {
          if (!useSnapshotTests) {
          let idmcResult: Record<string, unknown> | null = null;
          for (const candidateId of profileIdsToQuery) {
            const { data, error } = await supabase
              .from("idmc_resultats")
              .select("*")
              .eq("profile_id", candidateId)
              .maybeSingle();
            if (error) {
              console.error("[idmc] idmc_resultats error:", error);
              continue;
            }
            if (data) {
              idmcResult = data as Record<string, unknown>;
              break;
            }
          }
          setIdmcData(idmcResult ?? null);
          const axes = resolveIdmcAxes(
            (idmcResult as { scores?: Record<string, unknown> | null; responses?: Record<string, unknown> | null } | null)?.scores ??
              (idmcResult as { scores?: Record<string, unknown> | null; responses?: Record<string, unknown> | null } | null)?.responses,
          );
          if (axes) {
            setIdmcAxes(axes);
          }
          setIdmcUpdatedAt(
            String((idmcResult as { updated_at?: string | null } | null)?.updated_at ?? "") || null,
          );
          }
        } catch {
          if (!useSnapshotTests) {
            setIdmcData(null);
            setIdmcAxes(null);
          }
        }

        try {
          if (!useSnapshotTests) {
          if (!userId) return;
          let latestSoftSkills: Record<string, unknown> | null = null;
          for (const candidateId of profileIdsToQuery) {
            const data = await fetchLatestSoftSkillsResult(supabase, candidateId);
            if (data) {
              latestSoftSkills = data as Record<string, unknown>;
              break;
            }
          }

          setSoftSkillsData(latestSoftSkills);

          const rawScores = latestSoftSkills?.scores;
          if (rawScores && typeof rawScores === "object" && !Array.isArray(rawScores)) {
            setSoftSkillsRadar(parseSoftSkillsScoreEntries(rawScores));
          } else if (Array.isArray(rawScores)) {
            const sorted = (rawScores as Array<{ skill: string; score: number }>).sort(
              (a, b) => Number(b.score) - Number(a.score),
            );
            setSoftSkillsRadar(sorted);
          } else {
            setSoftSkillsRadar([]);
          }
          }
        } catch {
          if (!useSnapshotTests) {
            setSoftSkillsData(null);
            setSoftSkillsRadar([]);
          }
        }

        try {
          if (!userId) return;
          const { data: expData, error: expError } = await supabase
            .from("experiences_pro")
            .select("*")
            .in("learner_id", profileIdsToQuery)
            .order("date_debut", { ascending: false });
          if (expError) {
            console.error("[experiences_pro] error:", expError);
          } else {
            setExperiencesPro(expData ?? []);
          }
        } catch {
          setExperiencesPro([]);
        }

        try {
          if (!userId) return;
          const { data: diplomeData, error: diplomeError } = await supabase
            .from("diplomes")
            .select("*")
            .in("learner_id", profileIdsToQuery)
            .order("annee_obtention", { ascending: false });
          if (diplomeError) {
            console.error("[diplomes] error:", diplomeError);
          } else {
            setDiplomes(diplomeData ?? []);
          }
        } catch {
          setDiplomes([]);
        }
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [supabase, useSnapshotTests, isSalarieSurface]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!supabase) return;
    const handler = async () => {
      try {
        const { data: userData } = await supabase.auth.getUser();
        const uid = userData?.user?.id;
        if (!uid) return;
        const { data: fresh } = await supabase.from("profiles").select("*").eq("id", uid).maybeSingle();
        if (fresh) {
          setProfile(fresh as typeof profile);
        }
      } catch {
        // ignore
      }
    };
    window.addEventListener("apprenant-profile-updated", handler as EventListener);
    return () => {
      window.removeEventListener("apprenant-profile-updated", handler as EventListener);
    };
  }, [supabase]);

  const firstName = useMemo(() => {
    const resolved = resolveLearnerDisplayFirstName({
      profileFirstName: profile?.first_name ?? cachedFirstName,
      metadataFirstName: user?.user_metadata?.first_name,
      metadataPrenom: (user?.user_metadata as { prenom?: string } | undefined)?.prenom,
      metadataGivenName: (user?.user_metadata as { given_name?: string } | undefined)?.given_name,
      email: user?.email ?? profile?.email,
    });
    return resolved;
  }, [
    profile?.first_name,
    profile?.email,
    cachedFirstName,
    user?.user_metadata,
    user?.email,
  ]);
  const greetingWord = useMemo(() => {
    const h = new Date().getHours();
    if (h >= 18 || h < 6) return "Bonsoir";
    return "Bonjour";
  }, []);
  const greetingTagline = "Prêt à avancer aujourd'hui ?";
  const personalizedPlan = useMemo(
    () =>
      buildPersonalizedActionPlan({
        firstName,
        discScores,
        idmcAxes,
        softSkills: softSkillsRadar,
        surface: "apprenant",
      }),
    [discScores, firstName, idmcAxes, softSkillsRadar],
  );
  const hasAnyTest = Boolean(
    discScores || idmcAxes || softSkillsRadar.length > 0,
  );
  const testsSignature = useMemo(
    () =>
      JSON.stringify({
        disc: discScores,
        idmc: idmcAxes,
        soft: softSkillsRadar.map((s) => [s.skill, s.score]),
      }),
    [discScores, idmcAxes, softSkillsRadar],
  );
  const discAnalysisText = String(
    (profile as Record<string, unknown> | null)?.bio_ai ??
      aiAnalysis ??
      (hasAnyTest
        ? "Analyse automatique en préparation."
        : "Passez les tests pour obtenir votre analyse personnalisée."),
  );
  const analysisBlocks = useMemo(() => {
    const sanitized = discAnalysisText
      .replace(/\*\*/g, "")
      .replace(/###/g, "")
      .replace(/\b(extraordinaire|unique)\b/gi, "")
      .replace(/\s{2,}/g, " ");
    return sanitized
      .split(/\n+/)
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => {
        const isTitle = /^#{2,3}\s+/.test(line);
        const text = line.replace(/^#{1,6}\s+/, "").trim();
        return { isTitle, text };
      });
  }, [discAnalysisText]);

  const lastAnalysisSignatureRef = useRef<string | null>(null);

  useEffect(() => {
    if (!hasAnyTest || !user?.id) return;
    if (lastAnalysisSignatureRef.current === testsSignature && aiAnalysis) return;

    let cancelled = false;
    const run = async () => {
      setAiAnalysisLoading(true);
      try {
        const response = await fetch("/api/profile-analysis", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            firstName,
            discScores: discScores ?? {},
            idmcScores: idmcAxes ?? {},
            softSkillsTop: softSkillsRadar.slice(0, 5),
            testsSignature,
            idmcUpdatedAt,
          }),
        });
        if (!response.ok) {
          throw new Error("Impossible de générer l'analyse.");
        }
        const payload = (await response.json()) as { analysis?: string; updatedAt?: string };
        if (!cancelled && payload.analysis) {
          lastAnalysisSignatureRef.current = testsSignature;
          setAiAnalysis(payload.analysis);
          setAiAnalysisUpdatedAt(payload.updatedAt ?? new Date().toISOString());
        }
      } catch {
        // no-op
      } finally {
        if (!cancelled) setAiAnalysisLoading(false);
      }
    };
    run();
    return () => {
      cancelled = true;
    };
  }, [hasAnyTest, testsSignature, firstName, user?.id, discScores, idmcAxes, softSkillsRadar]);

  const handleAvatarUpload = async (file: File) => {
    if (!supabase || !user?.id) return;
    setIsUploadingAvatar(true);
    try {
      const extension = file.name.split(".").pop() || "jpg";
      const path = `${user.id}/${Date.now()}.${extension}`;
      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(path, file, { upsert: true });
      if (uploadError) {
        console.error("[avatar] upload error:", uploadError);
        return;
      }
      const { data: publicData } = supabase.storage.from("avatars").getPublicUrl(path);
      const publicUrl = publicData?.publicUrl;
      if (!publicUrl) return;
      const { error: updateError } = await supabase
        .from("profiles")
        .update({ avatar_url: publicUrl })
        .eq("id", user.id);
      if (updateError) {
        console.error("[avatar] update profile error:", updateError);
        return;
      }
      setProfile((prev) => ({ ...(prev ?? {}), avatar_url: publicUrl }));
    } finally {
      setIsUploadingAvatar(false);
    }
  };
  const handleSaveExperience = async () => {
    if (!supabase || !user?.id) return;
    setIsSavingExperience(true);
    try {
      const allowedContracts = ["CDI", "CDD", "Interim", "Alternance", "Freelance"];
      const normalizedContract = allowedContracts.includes(experienceForm.type_contrat)
        ? experienceForm.type_contrat
        : "CDI";
    const payload = {
        learner_id: user.id,
        employeur: experienceForm.employeur || null,
        type_contrat: normalizedContract,
        date_debut: experienceForm.date_debut || null,
        date_fin: experienceForm.date_fin || null,
        missions: experienceForm.missions || null,
      };
      console.log("Données envoyées :", payload);
      const { error } = await supabase.from("experiences_pro").insert(payload);
    if (error) {
        console.error("DÉTAIL ERREUR SUPABASE:", JSON.stringify(error, null, 2));
      return;
    }
      const { data: expData } = await supabase
        .from("experiences_pro")
        .select("*")
        .eq("learner_id", user.id)
        .order("date_debut", { ascending: false });
      setExperiencesPro(expData ?? []);
      setExperienceForm({
        employeur: "",
        type_contrat: "CDI",
        date_debut: "",
        date_fin: "",
        missions: "",
      });
      setShowExperienceForm(false);
    } finally {
      setIsSavingExperience(false);
    }
  };
  const handleSaveDiplome = async () => {
    if (!supabase || !user?.id) return;
    setIsSavingDiplome(true);
    try {
      const selectedDate = diplomeForm.annee_obtention
        ? new Date(diplomeForm.annee_obtention)
        : null;
      const yearValue =
        selectedDate && !Number.isNaN(selectedDate.getTime())
          ? selectedDate.getFullYear()
          : null;
    const payload = {
        learner_id: user.id,
        intitule: diplomeForm.intitule || null,
        ecole: diplomeForm.ecole || null,
        annee_obtention: yearValue,
        mode: diplomeForm.mode || null,
      };
      const { error } = await supabase.from("diplomes").insert(payload);
    if (error) {
        console.error("[diplomes] insert error:", error);
      return;
    }
      const { data: diplomeData } = await supabase
        .from("diplomes")
        .select("*")
        .eq("learner_id", user.id)
        .order("annee_obtention", { ascending: false });
      setDiplomes(diplomeData ?? []);
      setDiplomeForm({ intitule: "", ecole: "", annee_obtention: "", mode: "Alternance" });
      setShowDiplomeForm(false);
    } finally {
      setIsSavingDiplome(false);
    }
  };
  const weakSignals =
    (idmcData?.scores as Record<string, unknown> | undefined)?.temperature ??
    (idmcData?.responses as Record<string, unknown> | undefined)?.temperature ??
    (idmcData as Record<string, unknown> | undefined)?.temperature;

  const persistSkills = async (
    nextMetadata: Record<
      string,
      { level: "Débutant" | "Intermédiaire" | "Expert"; validated: boolean; source: "manual" | "badge" }
    >,
    nextHard: string[]
  ) => {
    if (!supabase || !user?.id) return;
    try {
      await supabase
        .from("profiles")
        .update({ skills_metadata: nextMetadata, hard_skills: nextHard })
        .eq("id", user.id);
    } catch (error) {
      console.error("[skills] update error:", error);
    }
  };
  const HARD_SKILL_LIBRARY = GLOBAL_SKILL_REFERENTIAL;
  const filteredHardSkills = HARD_SKILL_LIBRARY.flatMap((group) =>
    group.items.map((item) => ({ name: item, category: group.category }))
  ).filter((item) => item.name.toLowerCase().includes(skillSearch.toLowerCase()));
  const onboardingSelectedStacks = useMemo(
    () =>
      onboardingForm.stack_technique
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean),
    [onboardingForm.stack_technique]
  );
  const onboardingStackItems = useMemo(
    () =>
      GLOBAL_STACK_REFERENTIAL
        .filter((group) => !onboardingStackCategory || group.category === onboardingStackCategory)
        .flatMap((group) => group.items)
        .filter((item) => item.toLowerCase().includes(onboardingStackSearch.toLowerCase())),
    [onboardingStackCategory, onboardingStackSearch]
  );
  const toggleOnboardingStack = (stack: string) => {
    const next = onboardingSelectedStacks.includes(stack)
      ? onboardingSelectedStacks.filter((item) => item !== stack)
      : [...onboardingSelectedStacks, stack];
    setOnboardingForm((prev) => ({ ...prev, stack_technique: next.join(", ") }));
  };
  const hardSkillItems = hardSkills;
  const CATEGORY_LIST = HARD_SKILL_LIBRARY.map((group) => ({ type: "hard" as const, name: group.category }));
  const parsedTools = useMemo(() => {
    const raw = (profile as Record<string, unknown> | null)?.stack_technique;
    if (typeof raw === "string" && raw.trim()) {
      try {
        const parsed = JSON.parse(raw) as { tools?: string[] };
        return parsed.tools ?? [];
      } catch {
        return raw.split(",").map((item) => item.trim()).filter(Boolean);
      }
    }
    return [];
  }, [profile]);
  const fallbackFullName = String((profile as Record<string, unknown> | null)?.full_name ?? "").trim();
  const fallbackFirstName = fallbackFullName.split(" ").filter(Boolean)[0] ?? "";
  const fallbackLastName = fallbackFullName.split(" ").filter(Boolean).slice(1).join(" ");
  const emailValue = String(user?.email ?? profile?.email ?? "").trim();
  const emailPrefix = emailValue.split("@")[0] ?? "";
  const emailParts = emailPrefix.split(/[.\-_]/).filter(Boolean);
  const capitalize = (value: string) =>
    value ? `${value[0].toUpperCase()}${value.slice(1).toLowerCase()}` : "";
  const emailFirstName = capitalize(emailParts[0] ?? "");
  const emailLastName = emailParts.slice(1).map(capitalize).join(" ");
  const profileFirstName = String(profile?.first_name ?? "").trim()
    || String(user?.user_metadata?.first_name ?? "").trim()
    || fallbackFirstName
    || emailFirstName;
  const profileLastName = String(profile?.last_name ?? "").trim()
    || String(user?.user_metadata?.last_name ?? "").trim()
    || fallbackLastName
    || emailLastName;
  const fullName =
    `${profileFirstName} ${profileLastName ? profileLastName.toUpperCase() : ""}`.trim()
    || String(user?.user_metadata?.first_name ?? "Profil");
  const profileAge = String(profile?.age ?? "").trim();
  const profileBirthRaw = String(
    (profile as Record<string, unknown> | null)?.birth_date ??
      (profile as Record<string, unknown> | null)?.date_naissance ??
      "",
  ).trim();
  const profileBirthDateLabel = profileBirthRaw
    ? (() => {
        const date = new Date(profileBirthRaw);
        if (Number.isNaN(date.getTime())) return "—";
        const formatted = date.toLocaleDateString("fr-FR");
        const age = computeAgeFromBirthDate(profileBirthRaw);
        return age != null ? `${formatted} (${age} ans)` : formatted;
      })()
    : profileAge
      ? `— (${profileAge} ans)`
      : "—";
  const profileCity = String(profile?.city ?? "").trim();
  const profileBio = String(profile?.bio ?? "").trim();
  const profileEmail = emailValue || String(profile?.email ?? user?.email ?? "").trim();
  const profilePhone = String(profile?.telephone ?? "").trim();
  const displayFirstName = profileFirstName;
  const displayLastName = profileLastName;
  const profileSituation = getProfileSituationLabel(
    String((profile as Record<string, unknown> | null)?.type_profil ?? ""),
  );

  useEffect(() => {
    if (!displayFirstName) return;
    try {
      localStorage.setItem("beyond_firstname", displayFirstName);
    } catch {
      // ignore
    }
  }, [displayFirstName]);

  const needsOnboarding = useMemo(() => {
    if (!user?.id || !profile) return false;
    return profile?.onboarding_completed === false;
  }, [profile, user?.id]);

  useEffect(() => {
    if (isLoading) return;
    if (needsOnboarding) {
      setShowOnboardingModal(true);
    } else {
      setShowOnboardingModal(false);
    }
  }, [isLoading, needsOnboarding]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (profile?.school_id) return;
    const u = new URL(window.location.href);
    const c = u.searchParams.get("ecole") ?? u.searchParams.get("code");
    const v = c?.trim();
    if (v) setSchoolJoinCodeInput((prev) => (prev ? prev : v));
  }, [profile?.school_id]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (initialView !== "home") return;
    const h = window.location.hash;
    if (h === "#section-mon-profil" || h === "#profil") {
      router.replace("/dashboard/apprenant/profil");
    }
  }, [initialView, router]);

  const handleJoinSchoolByCode = async () => {
    if (!user?.id) return;
    const code = schoolJoinCodeInput.trim();
    if (code.length < 4) {
      setSchoolJoinError("Indiquez au moins 4 caractères (code communiqué par votre CFA).");
      return;
    }
    setSchoolJoinBusy(true);
    setSchoolJoinError(null);
    setSchoolJoinMessage(null);
    try {
      const res = await fetch("/api/dashboard/apprenant/join-school", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        error?: string;
        schoolName?: string | null;
        alreadyMember?: boolean;
      };
      if (!res.ok || !data.ok) {
        throw new Error(data.error || "Rattachement impossible");
      }
      const { data: fresh } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();
      if (fresh) {
        setProfile(fresh as typeof profile);
      }
      const label = data.schoolName ? ` — ${data.schoolName}` : "";
      setSchoolJoinMessage(
        data.alreadyMember ? `Déjà lié à votre établissement${label}.` : `Compte lié à votre établissement${label}.`,
      );
      setSchoolJoinCodeInput("");
    } catch (e) {
      setSchoolJoinError(e instanceof Error ? e.message : "Erreur");
    } finally {
      setSchoolJoinBusy(false);
    }
  };

  const scrollToProfilSection = useCallback(() => {
    router.push("/dashboard/apprenant/profil");
  }, [router]);

  const handleSaveOnboarding = async () => {
    if (!supabase || !user?.id) return;
    const hasValue = (value: string) => value.trim().length > 0;
    const requiredCommon = [
      onboardingForm.first_name,
      onboardingForm.last_name,
      onboardingForm.city,
      onboardingForm.telephone,
      onboardingForm.birth_date,
    ];
    const typeProfil = String((profile as Record<string, unknown> | null)?.type_profil ?? "").trim();
    const requiredRole =
      typeProfil === "freelance"
        ? [
            onboardingForm.tjm,
            onboardingForm.expertise,
            onboardingForm.stack_technique,
            onboardingForm.disponibilite,
            onboardingForm.langues,
          ]
        : typeProfil === "alternance"
          ? [
              onboardingForm.ecole,
              onboardingForm.niveau_etude,
              onboardingForm.rythme_alternance,
              onboardingForm.date_fin_contrat,
            ]
          : typeProfil === "reconversion"
            ? [
                onboardingForm.ancien_metier,
                onboardingForm.metier_vise,
                onboardingForm.organisme_formation,
                onboardingForm.echeance,
              ]
            : typeProfil === "emploi"
              ? [
                  onboardingForm.poste_actuel,
                  onboardingForm.entreprise,
                  onboardingForm.type_contrat,
                ]
              : [];
    if (![...requiredCommon, ...requiredRole].every(hasValue)) {
      setOnboardingError("Merci de compléter tous les champs requis pour votre profil.");
      return;
    }
    setOnboardingError(null);
    setIsSavingOnboarding(true);
    try {
      const payload: Record<string, string | number | boolean | null> = {
        first_name: onboardingForm.first_name || null,
        last_name: onboardingForm.last_name || null,
        city: onboardingForm.city || null,
        telephone: onboardingForm.telephone || null,
        birth_date: onboardingForm.birth_date || null,
        age: computeAgeFromBirthDate(onboardingForm.birth_date),
        onboarding_completed: true,
      };
      if (profile?.type_profil === "emploi") {
        payload.poste_actuel = onboardingForm.poste_actuel || null;
        payload.entreprise = onboardingForm.entreprise || null;
        payload.type_contrat = onboardingForm.type_contrat || null;
      }
      if (profile?.type_profil === "freelance") {
        payload.tjm = onboardingForm.tjm || null;
        payload.expertise = onboardingForm.expertise || null;
        payload.stack_technique = onboardingForm.stack_technique || null;
        payload.disponibilite =
          onboardingForm.disponibilite === "Oui"
            ? true
            : onboardingForm.disponibilite === "Non"
              ? false
              : null;
        payload.langues = onboardingForm.langues || null;
      }
      if (profile?.type_profil === "reconversion") {
        payload.ancien_metier = onboardingForm.ancien_metier || null;
        payload.metier_vise = onboardingForm.metier_vise || null;
        payload.organisme_formation = onboardingForm.organisme_formation || null;
        payload.echeance = onboardingForm.echeance || null;
      }
      if (profile?.type_profil === "alternance") {
        payload.ecole = onboardingForm.ecole || null;
        payload.niveau_etude = onboardingForm.niveau_etude || null;
        payload.rythme_alternance = onboardingForm.rythme_alternance || null;
        payload.date_fin_contrat = onboardingForm.date_fin_contrat || null;
      }
      const { data: updated } = await supabase
        .from("profiles")
        .update(payload)
        .eq("id", user.id)
        .select("*")
        .maybeSingle();
      if (updated) {
        setProfile(updated);
      }
      try {
        if (supabase && user?.id) {
          await supabase
            .from("user_profile_settings")
            .upsert({ user_id: user.id, onboarding_completed: true }, { onConflict: "user_id" });
        }
      } catch {
        // ignore
      }
      setShowOnboardingModal(false);
    } finally {
      setIsSavingOnboarding(false);
    }
  };

  const profileCompletion = useMemo(() => {
    const source = (profile ?? {}) as Record<string, unknown>;
    const typeProfil = String(source.type_profil ?? "").trim().toLowerCase();
    const hasValue = (value: unknown) => String(value ?? "").trim().length > 0;
    const telOk = hasValue(source.telephone) || hasValue(source.phone);
    const linkedSchool = hasValue(source.school_id);
    const roleWeight = linkedSchool ? 7 : 15;

    const checklist: Array<{ key: string; label: string; weight: number; done: boolean }> = [
      { key: "idmc", label: "Test IDMC", weight: 30, done: Boolean(idmcAxes) },
      { key: "disc", label: "Test comportemental", weight: 25, done: Boolean(discScores) },
      { key: "soft", label: "Soft Skills", weight: 20, done: Boolean(softSkillsData) },
      {
        key: "base",
        label: "Identité & contact (prénom, nom, ville, tél., e-mail)",
        weight: 10,
        done:
          hasValue(source.first_name) &&
          hasValue(source.last_name) &&
          hasValue(source.city) &&
          telOk &&
          (hasValue(source.email) || hasValue(user?.email)),
      },
      {
        key: "role",
        label:
          typeProfil === "freelance"
            ? "Infos freelance (TJM + expertise + stack)"
            : typeProfil === "alternance"
              ? "Infos alternance (ecole + rythme + fin contrat)"
              : typeProfil === "reconversion"
                ? "Infos reconversion (ancien + vise + echeance)"
                : "Infos emploi/profil",
        weight: roleWeight,
        done:
          typeProfil === "freelance"
            ? hasValue(source.tjm) && hasValue(source.expertise) && hasValue(source.stack_technique)
            : typeProfil === "alternance"
              ? hasValue(source.ecole) &&
                hasValue(source.niveau_etude) &&
                hasValue(source.rythme_alternance) &&
                hasValue(source.date_fin_contrat)
              : typeProfil === "reconversion"
                ? hasValue(source.ancien_metier) &&
                  hasValue(source.metier_vise) &&
                  hasValue(source.organisme_formation) &&
                  hasValue(source.echeance)
                : hasValue(source.poste_actuel) ||
                  hasValue(source.entreprise) ||
                  hasValue(source.type_profil),
      },
    ];

    if (linkedSchool) {
      checklist.push({
        key: "ecole",
        label: "Fiche école (photo + cursus / classe)",
        weight: 8,
        done: hasValue(source.avatar_url) && hasValue(source.school_class),
      });
    }

    const raw = checklist.reduce((sum, item) => sum + (item.done ? item.weight : 0), 0);
    const score = Math.min(100, raw);
    const level =
      score >= 85
        ? "Profil tres complet"
        : score >= 65
          ? "Profil solide"
          : score >= 40
            ? "Profil en progression"
            : "Profil a completer";
    return { score, level, checklist };
  }, [profile, user, idmcAxes, discScores, softSkillsData]);

  if (isLoading) {
    return (
      <div className="px-2 py-12 text-white">
        <div className={`mx-auto w-full max-w-3xl ${APPRENANT_CARD_BODY} text-sm text-white/45`}>
          Chargement du profil...
        </div>
      </div>
    );
  }

  if (profile?.access_connect === false && userRole !== "demo") {
    return <PaywallConnect />;
  }

  return (
    <>
          {showOnboardingModal ? (
            <div className="fixed inset-0 z-[10005] flex items-center justify-center bg-black/60 px-4">
              <div className="w-full max-w-2xl rounded-2xl border border-white/10 bg-slate-950 p-6 shadow-2xl">
                <div className="text-sm uppercase tracking-[0.3em] text-white/50">Première connexion</div>
                <h2 className="mt-2 text-2xl font-semibold text-white">
                  {displayFirstName || "Bienvenue"}, complétons votre profil
                </h2>
                <p className="mt-2 text-sm text-white/60">
                  Ces informations améliorent votre matching et votre visibilité.
                </p>
                <div className="mt-6 grid gap-4 md:grid-cols-2">
                  <label className="text-sm text-white/70">
                    Prénom
                    <input
                      value={onboardingForm.first_name}
                      onChange={(event) =>
                        setOnboardingForm((prev) => ({ ...prev, first_name: event.target.value }))
                      }
                      className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-white"
                    />
                  </label>
                  <label className="text-sm text-white/70">
                    Nom
                    <input
                      value={onboardingForm.last_name}
                      onChange={(event) =>
                        setOnboardingForm((prev) => ({ ...prev, last_name: event.target.value }))
                      }
                      className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-white"
                    />
                  </label>
                  <label className="text-sm text-white/70">
                    Ville
                    <input
                      value={onboardingForm.city}
                      onChange={(event) => setOnboardingForm((prev) => ({ ...prev, city: event.target.value }))}
                      className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-white"
                    />
                  </label>
                  <label className="text-sm text-white/70">
                    Téléphone
                    <input
                      value={onboardingForm.telephone}
                      onChange={(event) =>
                        setOnboardingForm((prev) => ({ ...prev, telephone: event.target.value }))
                      }
                      className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-white"
                    />
                  </label>
                  <label className="text-sm text-white/70 md:col-span-2">
                    Date de naissance
                    <input
                      type="date"
                      value={onboardingForm.birth_date}
                      onChange={(event) =>
                        setOnboardingForm((prev) => ({ ...prev, birth_date: event.target.value }))
                      }
                      className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-white"
                    />
                  </label>
                </div>
                {profile?.type_profil === "emploi" ? (
                  <div className="mt-6 grid gap-4 md:grid-cols-2">
                    <label className="text-sm text-white/70">
                      Poste actuel
                      <input
                        value={onboardingForm.poste_actuel}
                        onChange={(event) =>
                          setOnboardingForm((prev) => ({ ...prev, poste_actuel: event.target.value }))
                        }
                        className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-white"
                      />
                    </label>
                    <label className="text-sm text-white/70">
                      Entreprise
                      <input
                        value={onboardingForm.entreprise}
                        onChange={(event) =>
                          setOnboardingForm((prev) => ({ ...prev, entreprise: event.target.value }))
                        }
                        className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-white"
                      />
                    </label>
                    <label className="text-sm text-white/70">
                      Type de contrat
                      <select
                        value={onboardingForm.type_contrat}
                        onChange={(event) =>
                          setOnboardingForm((prev) => ({ ...prev, type_contrat: event.target.value }))
                        }
                        className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-white"
                      >
                        <option value="">Choisir</option>
                        <option value="CDI">CDI</option>
                        <option value="CDD">CDD</option>
                        <option value="Alternance">Alternance</option>
                        <option value="Freelance">Freelance</option>
                        <option value="Interim">Intérim</option>
                      </select>
                    </label>
                  </div>
                ) : null}
                {profile?.type_profil === "freelance" ? (
                  <div className="mt-6 grid gap-4 md:grid-cols-2">
                    <label className="text-sm text-white/70">
                      TJM
                      <input
                        value={onboardingForm.tjm}
                        onChange={(event) =>
                          setOnboardingForm((prev) => ({ ...prev, tjm: event.target.value }))
                        }
                        className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-white"
                      />
                    </label>
                    <label className="text-sm text-white/70">
                      Prestations
                      <input
                        value={onboardingForm.expertise}
                        onChange={(event) =>
                          setOnboardingForm((prev) => ({ ...prev, expertise: event.target.value }))
                        }
                        className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-white"
                      />
                    </label>
                    <label className="text-sm text-white/70 md:col-span-2">
                      Stack technique
                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setOnboardingStackCategory(GLOBAL_STACK_REFERENTIAL[0]?.category ?? "");
                            setOnboardingStackSearch("");
                            setShowOnboardingStackCatalog(true);
                          }}
                          className="rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-semibold text-white"
                        >
                          Ouvrir le catalogue
                        </button>
                        {onboardingSelectedStacks.length ? (
                          onboardingSelectedStacks.map((stack) => (
                            <span
                              key={stack}
                              className="rounded-full border border-edge-red/35 bg-edge-red/10 px-2 py-1 text-[11px] text-edge-red/90"
                            >
                              {stack}
                            </span>
                          ))
                        ) : (
                          <span className="text-xs text-white/60">Aucune stack sélectionnée</span>
                        )}
                      </div>
                      <input
                        value={onboardingForm.stack_technique}
                        readOnly
                        className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-white/70"
                      />
                    </label>
                    <label className="text-sm text-white/70">
                      Disponibilité
                      <div className="mt-2 inline-flex rounded-xl border border-white/10 bg-white/5 p-1">
                        <button
                          type="button"
                          onClick={() => setOnboardingForm((prev) => ({ ...prev, disponibilite: "Oui" }))}
                          className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${
                            onboardingForm.disponibilite === "Oui"
                              ? "bg-edge-red/15 text-edge-red"
                              : "text-white/70"
                          }`}
                        >
                          Oui
                        </button>
                        <button
                          type="button"
                          onClick={() => setOnboardingForm((prev) => ({ ...prev, disponibilite: "Non" }))}
                          className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${
                            onboardingForm.disponibilite === "Non"
                              ? "bg-rose-400/25 text-rose-200"
                              : "text-white/70"
                          }`}
                        >
                          Non
                        </button>
                      </div>
                    </label>
                    <label className="text-sm text-white/70">
                      Langues
                      <input
                        value={onboardingForm.langues}
                        onChange={(event) =>
                          setOnboardingForm((prev) => ({ ...prev, langues: event.target.value }))
                        }
                        className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-white"
                      />
                    </label>
                  </div>
                ) : null}
                {profile?.type_profil === "reconversion" ? (
                  <div className="mt-6 grid gap-4 md:grid-cols-2">
                    <label className="text-sm text-white/70">
                      Ancien métier
                      <input
                        value={onboardingForm.ancien_metier}
                        onChange={(event) =>
                          setOnboardingForm((prev) => ({ ...prev, ancien_metier: event.target.value }))
                        }
                        className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-white"
                      />
                    </label>
                    <label className="text-sm text-white/70">
                      Métier visé
                      <input
                        value={onboardingForm.metier_vise}
                        onChange={(event) =>
                          setOnboardingForm((prev) => ({ ...prev, metier_vise: event.target.value }))
                        }
                        className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-white"
                      />
                    </label>
                    <label className="text-sm text-white/70">
                      Organisme de formation
                      <input
                        value={onboardingForm.organisme_formation}
                        onChange={(event) =>
                          setOnboardingForm((prev) => ({ ...prev, organisme_formation: event.target.value }))
                        }
                        className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-white"
                      />
                    </label>
                    <label className="text-sm text-white/70">
                      Échéance
                      <input
                        type="date"
                        value={onboardingForm.echeance}
                        onChange={(event) =>
                          setOnboardingForm((prev) => ({ ...prev, echeance: event.target.value }))
                        }
                        className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-white"
                      />
                    </label>
                  </div>
                ) : null}
                {profile?.type_profil === "alternance" ? (
                  <div className="mt-6 grid gap-4 md:grid-cols-2">
                    <label className="text-sm text-white/70">
                      École
                      <input
                        value={onboardingForm.ecole}
                        onChange={(event) =>
                          setOnboardingForm((prev) => ({ ...prev, ecole: event.target.value }))
                        }
                        className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-white"
                      />
                    </label>
                    <label className="text-sm text-white/70">
                      Niveau d'étude
                      <input
                        value={onboardingForm.niveau_etude}
                        onChange={(event) =>
                          setOnboardingForm((prev) => ({ ...prev, niveau_etude: event.target.value }))
                        }
                        className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-white"
                      />
                    </label>
                    <label className="text-sm text-white/70">
                      Rythme d'alternance
                      <input
                        value={onboardingForm.rythme_alternance}
                        onChange={(event) =>
                          setOnboardingForm((prev) => ({ ...prev, rythme_alternance: event.target.value }))
                        }
                        className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-white"
                      />
                    </label>
                    <label className="text-sm text-white/70">
                      Fin de contrat
                      <input
                        type="date"
                        value={onboardingForm.date_fin_contrat}
                        onChange={(event) =>
                          setOnboardingForm((prev) => ({ ...prev, date_fin_contrat: event.target.value }))
                        }
                        className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-white"
                      />
                    </label>
                  </div>
                ) : null}
                {onboardingError ? (
                  <p className="mt-4 text-sm text-red-300">{onboardingError}</p>
                ) : null}
                {showOnboardingStackCatalog ? (
                  <div className="fixed inset-0 z-[10010] flex items-center justify-center bg-black/75 px-4">
                    <div className="w-full max-w-5xl overflow-hidden rounded-3xl border border-white/10 bg-[#0D111A] text-white shadow-2xl">
                      <div className="border-b border-white/10 px-6 py-4">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <div>
                            <div className="text-xs uppercase tracking-[0.3em] text-white/50">
                              Ajouter une stack
                            </div>
                            <div className="mt-1 text-lg font-semibold text-white">Catalogue stack technique</div>
                          </div>
                          <div className="flex items-center gap-2">
                            <input
                              value={onboardingStackSearch}
                              onChange={(event) => setOnboardingStackSearch(event.target.value)}
                              placeholder="Rechercher une stack..."
                              className="w-72 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none"
                            />
                            <button
                              type="button"
                              onClick={() => setShowOnboardingStackCatalog(false)}
                              className="rounded-full border border-white/20 px-4 py-2 text-xs font-semibold text-white/75"
                            >
                              Fermer
                            </button>
                          </div>
                        </div>
                      </div>
                      <div className="grid min-h-[420px] grid-cols-[260px_1fr]">
                        <aside className="border-r border-white/10 bg-white/[0.03] p-4">
                          <div className="space-y-2">
                            {GLOBAL_STACK_REFERENTIAL.map((group) => (
                              <button
                                key={group.category}
                                type="button"
                                onClick={() => setOnboardingStackCategory(group.category)}
                                className={`w-full rounded-xl px-3 py-2 text-left text-sm transition ${
                                  onboardingStackCategory === group.category
                                    ? "bg-white/15 text-white"
                                    : "text-white/65 hover:bg-white/10 hover:text-white"
                                }`}
                              >
                                {group.category}
                              </button>
                            ))}
                          </div>
                        </aside>
                        <div className="p-4">
                          <div className="max-h-[350px] space-y-2 overflow-y-auto pr-1">
                            {onboardingStackItems.map((item) => {
                              const active = onboardingSelectedStacks.includes(item);
                              const logo = resolveToolLogo(item);
                              return (
                                <button
                                  key={item}
                                  type="button"
                                  onClick={() => toggleOnboardingStack(item)}
                                  className={`flex w-full items-center justify-between rounded-xl border px-3 py-2 text-left ${
                                    active
                                      ? "border-edge-red/35 bg-edge-red/10"
                                      : "border-white/10 bg-white/[0.03] hover:bg-white/[0.07]"
                                  }`}
                                >
                                  <span className="flex items-center gap-3">
                                    {logo ? (
                                      <img src={logo} alt={item} className="h-5 w-5 rounded-sm object-contain" />
                                    ) : (
                                      <span className="h-5 w-5 rounded-sm bg-white/10" />
                                    )}
                                    <span className="text-sm text-white/85">{item}</span>
                                  </span>
                                  <span className="text-xs text-white/55">{active ? "Ajouté" : "Ajouter"}</span>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : null}
                <div className="mt-6 flex flex-wrap justify-end gap-3">
                  <button
                    type="button"
                    onClick={handleSaveOnboarding}
                    disabled={isSavingOnboarding}
                    className="rounded-full bg-white px-5 py-2 text-sm font-semibold text-slate-950"
                  >
                    {isSavingOnboarding ? "Sauvegarde..." : "Enregistrer"}
                  </button>
                </div>
              </div>
            </div>
          ) : null}
          {initialView === "home" ? (
            <>
          <ApprenantConnectOverview
            firstName={firstName}
            greetingWord={greetingWord}
            tagline={greetingTagline}
            profileCompletionPct={profileCompletion.score}
            catalogHref={EDGE_LAB_ONLINE_CATALOG_HREF}
            primaryParcours={primaryParcours}
            badgesHref="/dashboard/apprenant/badges"
            resultsHref="/dashboard/apprenant/results"
            matchingHref="/dashboard/apprenant/matching"
            visibleOpenBadges={visibleOpenBadges}
            earnedOpenBadges={earnedOpenBadges}
            discScores={discScores}
            idmcAxes={idmcAxes}
            softSkillsRadar={softSkillsRadar}
            onScrollToProfil={scrollToProfilSection}
            onOpenEditProfile={() => appShell?.openEditProfile()}
          />

              <PersonalizedActionPlanSection
                plan={personalizedPlan}
                parcoursHref="/dashboard/apprenant/parcours"
                className="mt-8"
              />

              <div className="mt-6 space-y-6">

                {profile?.school_id ? (
                  <div className="rounded-2xl border border-cyan-400/30 bg-gradient-to-r from-cyan-500/15 via-cyan-500/5 to-transparent px-5 py-4 text-sm">
                    <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-cyan-200/95">
                      Partage avec votre établissement
                    </div>
                    <p className="mt-2 max-w-3xl text-white/80">
                      Les équipes de votre école s&apos;appuient sur ces informations pour vous accompagner. Complétez au
                      maximum votre identité (photo, nom, e-mail, téléphone), votre cursus ou classe, puis vos soft skills —
                      tout apparaît sur la fiche côté école.
                    </p>
                    <ul className="mt-3 list-inside list-disc space-y-1 text-xs text-white/70">
                      <li>Identité &amp; photo : page Profil (menu latéral)</li>
                      <li>Cursus / classe : renseignez le libellé dans la fiche (visible côté école « Mes apprenants »)</li>
                      <li>
                        <button
                          type="button"
                          onClick={scrollToProfilSection}
                          className="text-cyan-200 underline underline-offset-2"
                        >
                          Ouvrir la fiche détaillée
                        </button>{" "}
                        ·{" "}
                        <Link href="/dashboard/apprenant/soft-skills-intro" className="text-cyan-200 underline underline-offset-2">
                          Passer les soft skills
                        </Link>
                      </li>
                    </ul>
                  </div>
                ) : null}
              </div>
            </>
          ) : (
            <>
              <div className="mb-6 flex flex-wrap items-center justify-between gap-3 border-b border-sky-500/15 pb-4">
                <div className="space-y-1">
                  <p className={APPRENANT_PAGE_KICKER}>Profil</p>
                  <h1 className={APPRENANT_PAGE_TITLE}>Mon profil</h1>
                </div>
                <Link href={homeHref} className={CONNECT_BTN_SECONDARY}>
                  Retour à l&apos;accueil
                </Link>
              </div>
              <div id="section-mon-profil" className="scroll-mt-28 mt-2 space-y-6">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className={APPRENANT_CARD_KICKER}>Fiche détaillée</div>
                  <button
                    type="button"
                    onClick={() => appShell?.openEditProfile()}
                    className={CONNECT_BTN_SECONDARY}
                  >
                    Modifier mon profil
                  </button>
                </div>

          <div className="grid gap-6 lg:grid-cols-[1.45fr_1fr]">
            <section className={APPRENANT_CARD_BODY}>
              <p className={APPRENANT_CARD_KICKER}>Identité & Bio</p>
              <div className="mt-5 flex flex-col gap-6 sm:flex-row sm:items-start">
                <label className="group relative flex h-20 w-20 shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded-full border border-white/15 bg-white/[0.06]">
                  {profile?.avatar_url ? (
                    <img src={profile.avatar_url} alt="Avatar" className="h-full w-full object-cover" />
                  ) : (
                    <span className="text-xs text-white/45">Photo</span>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(event) => {
                      const file = event.target.files?.[0];
                      if (file) handleAvatarUpload(file);
                    }}
                    className="absolute inset-0 cursor-pointer opacity-0"
                  />
                </label>
                <div className="min-w-0 flex-1">
                  <ul className="space-y-3 text-sm">
                    <li className="flex flex-col gap-0.5 sm:flex-row sm:gap-3">
                      <span className="shrink-0 font-medium text-white/45 sm:w-44">Nom et prénom</span>
                      <span className="font-medium text-white">{fullName}</span>
                    </li>
                    <li className="flex flex-col gap-0.5 sm:flex-row sm:gap-3">
                      <span className="shrink-0 font-medium text-white/45 sm:w-44">Adresse email</span>
                      <span className="text-white/80">{profileEmail || "—"}</span>
                    </li>
                    <li className="flex flex-col gap-0.5 sm:flex-row sm:gap-3">
                      <span className="shrink-0 font-medium text-white/45 sm:w-44">Numéro de téléphone</span>
                      <span className="text-white/80">{profilePhone || "—"}</span>
                    </li>
                    <li className="flex flex-col gap-0.5 sm:flex-row sm:gap-3">
                      <span className="shrink-0 font-medium text-white/45 sm:w-44">Date de naissance</span>
                      <span className="text-white/80">{profileBirthDateLabel}</span>
                    </li>
                    <li className="flex flex-col gap-0.5 sm:flex-row sm:gap-3">
                      <span className="shrink-0 font-medium text-white/45 sm:w-44">Situation</span>
                      <span className="text-white/80">{profileSituation}</span>
                    </li>
                  </ul>
                  <div className="mt-4 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white/70">
                    {profileBio || "Présentation en cours de rédaction."}
                  </div>
                  {isUploadingAvatar ? (
                    <div className="mt-2 text-xs text-white/50">Upload en cours...</div>
                  ) : null}
                </div>
              </div>
            </section>

            <section className={APPRENANT_CARD_BODY}>
              <div className="flex items-center justify-between gap-4">
                <p className={APPRENANT_CARD_KICKER}>Jauge de profil</p>
                <button
                  type="button"
                  onClick={() => setIsProfileGaugeExpanded((prev) => !prev)}
                  className="inline-flex items-center gap-1 rounded-full border border-white/15 bg-white/[0.04] px-3 py-1 text-[11px] text-white/60"
                >
                  {isProfileGaugeExpanded ? "Réduire" : "Détails"}
                  {isProfileGaugeExpanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                </button>
              </div>
              <div className="mt-3 flex items-end justify-between gap-4">
                <div className="text-3xl font-extrabold text-white">{profileCompletion.score}%</div>
                <div className="text-xs font-medium text-white/55">{profileCompletion.level}</div>
              </div>
              <div className="mt-3 h-2 w-full rounded-full bg-white/10">
                <div
                  className="h-2 rounded-full bg-[#3D7BFF] transition-all"
                  style={{ width: `${profileCompletion.score}%` }}
                />
              </div>
              {isProfileGaugeExpanded ? (
                <div className="mt-4 space-y-2 text-[11px] text-white/65">
                  {profileCompletion.checklist.map((item) => (
                    <div key={item.key} className="flex items-center justify-between gap-3">
                      <span>{item.label}</span>
                      <span className={item.done ? "text-[#3D7BFF]" : "text-white/40"}>
                        {item.done ? `+${item.weight}` : "0"}
                      </span>
                    </div>
                  ))}
                </div>
              ) : null}
            </section>
          </div>

          <ApprenantAssessmentResults
            variant="full"
            firstName={firstName}
            discScores={discScores}
            idmcAxes={idmcAxes}
            softSkillsRadar={softSkillsRadar}
            correlatedAnalysis={
              aiAnalysis ? (
                <div className="space-y-3">
                  {analysisBlocks.map((block, index) =>
                    block.isTitle ? (
                      <h3 key={`${block.text}-${index}`} className="text-sm font-semibold text-[#0a0a0a]">
                        {block.text}
                      </h3>
                    ) : (
                      <p key={`${block.text}-${index}`} className="text-black/70">
                        {block.text}
                      </p>
                    ),
                  )}
                </div>
              ) : hasAnyTest && aiAnalysisLoading ? (
                <span>Analyse croisée en cours de génération…</span>
              ) : null
            }
          />
              </div>

          {showSkillModal ? (
            <div className="fixed inset-0 z-[130] flex items-center justify-center bg-black/75 px-4">
              <div className="w-full max-w-5xl overflow-hidden rounded-3xl border border-white/10 bg-[#0D111A] text-white shadow-2xl">
                <div className="border-b border-white/10 px-6 py-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <div className="text-xs uppercase tracking-[0.3em] text-white/50">
                        Ajouter une compétence
                      </div>
                      <div className="mt-1 text-lg font-semibold text-white">Catalogue de compétences</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        value={skillSearch}
                        onChange={(event) => setSkillSearch(event.target.value)}
                        placeholder="Rechercher une compétence..."
                        className="w-72 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setShowSkillModal(false);
                          setSkillSearch("");
                          setPendingHardSkill(null);
                          setPendingSkillProof(false);
                          setShowManualSkillInput(false);
                          setManualSkillName("");
                        }}
                        className="rounded-full border border-white/20 px-4 py-2 text-xs font-semibold text-white/75"
                      >
                        Fermer
                      </button>
                    </div>
                  </div>
                </div>

                <div className="grid min-h-[430px] grid-cols-[280px_1fr]">
                  <aside className="border-r border-white/10 bg-white/[0.03] p-4">
                    <div className="space-y-2">
                      {CATEGORY_LIST.map((category) => (
                        <button
                          key={`${category.type}-${category.name}`}
                          type="button"
                          onClick={() => setActiveCategory(category.name)}
                          className={`w-full rounded-xl px-3 py-2 text-left text-sm transition ${
                            activeCategory === category.name
                              ? "bg-white/15 text-white"
                              : "text-white/65 hover:bg-white/10 hover:text-white"
                          }`}
                        >
                          {category.name}
                        </button>
                      ))}
                    </div>
                  </aside>

                  <div className="p-4">
                    <div className="max-h-[360px] space-y-2 overflow-y-auto pr-1">
                      {(skillSearch
                        ? [...filteredHardSkills].map((item) => item.name)
                        : HARD_SKILL_LIBRARY.filter((group) => group.category === activeCategory).flatMap(
                            (group) => group.items
                          )
                      ).map((skill) => {
                        const logo = resolveToolLogo(skill);
                        return (
                          <button
                            key={skill}
                            type="button"
                            onClick={() => {
                              setPendingHardSkill(skill);
                              setPendingSkillProof(Boolean(skillsMetadata[skill]?.validated));
                            }}
                            className="flex w-full items-center justify-between rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-left hover:bg-white/[0.07]"
                          >
                            <span className="flex items-center gap-3">
                              {logo ? (
                                <img src={logo} alt={skill} className="h-5 w-5 rounded-sm object-contain" />
                              ) : (
                                <span className="h-5 w-5 rounded-sm bg-white/10" />
                              )}
                              <span className="text-sm text-white/85">{skill}</span>
                            </span>
                            <span className="text-xs text-white/55">Configurer</span>
                          </button>
                        );
                      })}

                      <button
                        type="button"
                        onClick={() => {
                          setManualSkillName("");
                          setShowManualSkillInput(true);
                        }}
                        className="flex w-full items-center justify-between rounded-xl border border-dashed border-white/20 bg-white/[0.03] px-3 py-2 text-left hover:bg-white/[0.07]"
                      >
                        <span className="text-sm text-white/80">Autre (ajouter manuellement)</span>
                        <span className="text-xs text-white/55">Nouveau</span>
                      </button>
                    </div>
                  </div>
                </div>

                {pendingHardSkill ? (
                  <div className="border-t border-white/10 bg-white/[0.02] p-4">
                    <div className="text-sm text-white/80">
                      Quel est votre niveau pour <strong>{pendingHardSkill}</strong> ?
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {(["Débutant", "Intermédiaire", "Expert"] as const).map((level) => (
                        <button
                          key={level}
                          type="button"
                          onClick={() => {
                            const next: Record<
                              string,
                              { level: "Débutant" | "Intermédiaire" | "Expert"; validated: boolean; source: "manual" | "badge" }
                            > = {
                              ...skillsMetadata,
                              [pendingHardSkill]: {
                                level,
                                validated: pendingSkillProof,
                                source: pendingSkillProof ? "badge" : "manual",
                              },
                            };
                            const nextHard = Array.from(new Set([...hardSkills, pendingHardSkill]));
                            setSkillsMetadata(next);
                            setHardSkills(nextHard);
                            persistSkills(next, nextHard);
                            setPendingHardSkill(null);
                            setPendingSkillProof(false);
                          }}
                          className="rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs font-semibold text-white"
                        >
                          {level}
                        </button>
                      ))}
                    </div>
                    <label className="mt-3 flex items-center gap-2 text-xs text-white/75">
                      <input
                        type="checkbox"
                        checked={pendingSkillProof}
                        onChange={(event) => setPendingSkillProof(event.target.checked)}
                      />
                      Je peux prouver cette compétence
                    </label>
                  </div>
                ) : null}

                {showManualSkillInput ? (
                  <div className="mt-6 grid gap-3 md:grid-cols-[1fr_160px]">
                    <input
                      value={manualSkillName}
                      onChange={(event) => setManualSkillName(event.target.value)}
                      placeholder="Saisir une compétence personnalisée"
                      className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none"
                    />
                    <select
                      value={manualSkillLevel}
                      onChange={(event) =>
                        setManualSkillLevel(
                          event.target.value as "Débutant" | "Intermédiaire" | "Expert"
                        )
                      }
                      className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none"
                    >
                      <option value="Débutant">Débutant</option>
                      <option value="Intermédiaire">Intermédiaire</option>
                      <option value="Expert">Expert</option>
                    </select>
                    <button
                      type="button"
                      onClick={() => {
                        const trimmed = manualSkillName.trim();
                        if (!trimmed) return;
                        const next: Record<
                          string,
                          { level: "Débutant" | "Intermédiaire" | "Expert"; validated: boolean; source: "manual" | "badge" }
                        > = {
                          ...skillsMetadata,
                          [trimmed]: {
                            level: manualSkillLevel,
                            validated: false,
                            source: "manual",
                          },
                        };
                        const nextHard = Array.from(new Set([...hardSkills, trimmed]));
                        setSkillsMetadata(next);
                        setHardSkills(nextHard);
                        persistSkills(next, nextHard);
                        setManualSkillName("");
                        setShowManualSkillInput(false);
                      }}
                      className="rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-semibold text-white"
                    >
                      Ajouter
                    </button>
                  </div>
                ) : null}
              </div>
            </div>
          ) : null}

          <section className={`mt-10 ${APPRENANT_CARD_BODY}`}>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="text-[10px] font-medium uppercase tracking-[0.25em] text-[#FF3B30]">
                  Mes Compétences
                </div>
                <div className="mt-2 text-lg font-semibold text-white">
                  Hard Skills & Stack Technique
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowSkillModal(true)}
                className={CONNECT_BTN_SECONDARY}
              >
                + Ajouter une compétence
              </button>
            </div>

            {parsedTools.length ? (
              <div className="mt-4 flex flex-wrap items-center gap-3">
                {parsedTools.map((tool) => (
                  <div
                    key={tool}
                    className="flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs text-white/80"
                  >
                    {resolveToolLogo(tool) ? (
                      <img
                        src={resolveToolLogo(tool) ?? ""}
                        alt={tool}
                        className="h-4 w-4 rounded-sm object-contain shadow-[0_0_6px_rgba(255,255,255,0.25)]"
                      />
                    ) : (
                      <span className="h-4 w-4 rounded-sm bg-black/10" />
                    )}
                    {tool}
                  </div>
                ))}
              </div>
            ) : (
              <div className="mt-4 text-sm text-black/55">Stack technique non renseignée.</div>
            )}

            <div className="mt-6 space-y-3">
              {hardSkillItems.length ? (
                hardSkillItems.map((skill) => {
                  const meta = skillsMetadata[skill];
                  const isValidated = meta?.validated;
                  const level = meta?.level ? ` (${meta.level})` : "";
                  return (
                    <div
                      key={skill}
                      className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white/80"
                    >
                      <div className="flex items-center gap-2">
                        {!isValidated ? (
                          <>
                            <AlertTriangle className="h-4 w-4 text-amber-400" />
                            <span title="Non validé par Beyond">{skill}{level}</span>
                            <span className="text-xs text-amber-400">⚠️ Non validé par Beyond</span>
                          </>
                        ) : (
                          <>
                            <span className="text-edge-red">✅</span>
                            <span>{skill}{level}</span>
                          </>
                        )}
                      </div>
                      {!isValidated ? (
                        <Link
                          href="/dashboard/apprenant/badges"
                          className="text-xs font-semibold text-white hover:underline"
                        >
                          Passer le badge
                        </Link>
                      ) : (
                        <span className="text-xs text-edge-red">Certifié Beyond</span>
                      )}
                    </div>
                  );
                })
              ) : (
                <div className="text-sm text-black/55">Aucune compétence ajoutée.</div>
              )}
            </div>
          </section>

          <section className="mt-10 grid gap-6 lg:grid-cols-2">
            <div className={APPRENANT_CARD_BODY}>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-[10px] font-medium uppercase tracking-[0.25em] text-[#FF3B30]">
                    Parcours professionnel
                  </div>
                  <div className="mt-2 text-lg font-semibold text-white">
                    Expériences
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowExperienceForm((prev) => !prev)}
                  className={CONNECT_BTN_SECONDARY}
                >
                  Ajouter une expérience
                </button>
              </div>

              {showExperienceForm ? (
                <div className="mt-6 grid gap-4">
                  <input
                    value={experienceForm.employeur}
                    onChange={(event) =>
                      setExperienceForm((prev) => ({ ...prev, employeur: event.target.value }))
                    }
                    placeholder="Employeur"
                    className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2 text-sm text-white"
                  />
                  <select
                    value={experienceForm.type_contrat}
                    onChange={(event) =>
                      setExperienceForm((prev) => ({ ...prev, type_contrat: event.target.value }))
                    }
                    className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2 text-sm text-white"
                  >
                    {["CDI", "CDD", "Interim", "Alternance", "Freelance"].map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <input
                      type="date"
                      value={experienceForm.date_debut}
                      onChange={(event) =>
                        setExperienceForm((prev) => ({ ...prev, date_debut: event.target.value }))
                      }
                      className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2 text-sm text-white"
                    />
                    <input
                      type="date"
                      value={experienceForm.date_fin}
                      onChange={(event) =>
                        setExperienceForm((prev) => ({ ...prev, date_fin: event.target.value }))
                      }
                      className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2 text-sm text-white"
                    />
                  </div>
                  <textarea
                    value={experienceForm.missions}
                    onChange={(event) =>
                      setExperienceForm((prev) => ({ ...prev, missions: event.target.value }))
                    }
                    placeholder="Missions"
                    className="min-h-[90px] w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2 text-sm text-white"
                  />
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={handleSaveExperience}
                      disabled={isSavingExperience}
                      className={CONNECT_BTN_SECONDARY}
                    >
                      {isSavingExperience ? "Enregistrement..." : "Enregistrer"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowExperienceForm(false)}
                      className="rounded-full border border-black/15 px-5 py-2 text-xs font-semibold text-black/60"
                    >
                      Annuler
                    </button>
                  </div>
                </div>
              ) : null}

              <div className="mt-6 space-y-3">
                {experiencesPro.length === 0 ? (
                  <div className="text-sm text-black/55">Aucune expérience ajoutée.</div>
                ) : (
                  experiencesPro.map((exp) => (
                    <div
                      key={exp.id ?? `${exp.employeur}-${exp.date_debut}`}
                      className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white/80"
                    >
                      <div className="font-semibold text-white">
                        {exp.employeur || "Employeur"}
                      </div>
                      <div className="text-xs text-black/50">
                        {exp.type_contrat || "Contrat"} · {exp.date_debut || "—"} →{" "}
                        {exp.date_fin || "—"}
                      </div>
                      {exp.missions ? <div className="mt-2">{exp.missions}</div> : null}
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className={APPRENANT_CARD_BODY}>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-[10px] font-medium uppercase tracking-[0.25em] text-[#FF3B30]">
                    Diplômes & formations
                  </div>
                  <div className="mt-2 text-lg font-semibold text-white">
                    Diplômes
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowDiplomeForm((prev) => !prev)}
                  className={CONNECT_BTN_SECONDARY}
                >
                  Ajouter un diplôme
                </button>
              </div>

              {showDiplomeForm ? (
                <div className="mt-6 grid gap-4">
                  <input
                    value={diplomeForm.intitule}
                    onChange={(event) =>
                      setDiplomeForm((prev) => ({ ...prev, intitule: event.target.value }))
                    }
                    placeholder="Intitulé"
                    className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2 text-sm text-white"
                  />
                  <input
                    value={diplomeForm.ecole}
                    onChange={(event) =>
                      setDiplomeForm((prev) => ({ ...prev, ecole: event.target.value }))
                    }
                    placeholder="École"
                    className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2 text-sm text-white"
                  />
                  <div className="grid gap-4 sm:grid-cols-2">
                    <input
                      type="date"
                      value={diplomeForm.annee_obtention}
                      onChange={(event) =>
                        setDiplomeForm((prev) => ({ ...prev, annee_obtention: event.target.value }))
                      }
                      className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2 text-sm text-white"
                    />
                    <select
                      value={diplomeForm.mode}
                      onChange={(event) =>
                        setDiplomeForm((prev) => ({ ...prev, mode: event.target.value }))
                      }
                      className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2 text-sm text-white"
                    >
                      {["Alternance", "Initial"].map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={handleSaveDiplome}
                      disabled={isSavingDiplome}
                      className={CONNECT_BTN_SECONDARY}
                    >
                      {isSavingDiplome ? "Enregistrement..." : "Enregistrer"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowDiplomeForm(false)}
                      className="rounded-full border border-black/15 px-5 py-2 text-xs font-semibold text-black/60"
                    >
                      Annuler
                    </button>
                  </div>
                </div>
              ) : null}

              <div className="mt-6 space-y-3">
                {diplomes.length === 0 ? (
                  <div className="text-sm text-black/55">Aucun diplôme ajouté.</div>
                ) : (
                  diplomes.map((dip) => (
                    <div
                      key={dip.id ?? `${dip.intitule}-${dip.ecole}-${dip.annee_obtention}`}
                      className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white/80"
                    >
                      <div className="font-semibold text-white">
                        {dip.intitule || "Diplôme"}
                      </div>
                      <div className="text-xs text-black/50">
                        {dip.ecole || "École"} · {dip.annee_obtention ?? "—"} · {dip.mode || "—"}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </section>
            </>
          )}
    </>
  );
}
