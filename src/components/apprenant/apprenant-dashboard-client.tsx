"use client";

import React, { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AlertTriangle, ChevronDown, ChevronUp, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { AxisKey, resolveIdmcAxes } from "@/components/idmc/IdmcRadarChart";
import {
  GLOBAL_SKILL_REFERENTIAL,
  referentialItemName,
  referentialItemSubtitle,
  resolveToolLogo,
} from "@/lib/profile/competency-referential";
import { ProfileSectionTabs } from "@/components/profile/profile-section-tabs";
import { PaywallConnect } from "@/components/paywalls/paywall-connect";
import dynamic from "next/dynamic";
import { ApprenantConnectOverview } from "@/components/apprenant/apprenant-connect-overview";
import { CrossProfileBadgeCelebration } from "@/components/apprenant/cross-profile-badge-celebration";
import { CareerGoalStepModal } from "@/components/apprenant/career-goal-step-modal";
import { ParticulierOnboardingOverlay } from "@/components/apprenant/particulier-onboarding-overlay";
import {
  buildOnboardingSavePayload,
  EMPTY_ONBOARDING_FORM,
  mapProfileToOnboardingForm,
  validateOnboardingForm,
  type ParticulierOnboardingForm,
} from "@/lib/particulier/onboarding-objective-config";
const PersonalizedActionPlanSection = dynamic(
  () =>
    import("@/components/learner/personalized-action-plan-section").then((m) => ({
      default: m.PersonalizedActionPlanSection,
    })),
  { ssr: false },
);
const EdgeDashboardGpsContainer = dynamic(
  () =>
    import("@/components/apprenant/edge-gps/edge-dashboard-gps-container").then((m) => ({
      default: m.EdgeDashboardGpsContainer,
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

function parseBioAiText(raw: unknown): string {
  const trimmed = String(raw ?? "").trim();
  if (!trimmed) return "";
  try {
    const parsed = JSON.parse(trimmed) as { text?: string };
    if (parsed?.text) return parsed.text;
  } catch {
    // legacy plain string
  }
  return trimmed;
}

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
  const [badgeCelebration, setBadgeCelebration] = useState<{
    badgeName: string;
    badgeImageUrl: string | null;
    walletHref: string;
  } | null>(null);
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
    career_goal?: string | null;
    career_goal_other?: string | null;
    role_type?: string | null;
    role?: string | null;
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
  const [pendingHardSkill, setPendingHardSkill] = useState<string | null>(null);
  const [pendingSkillProof, setPendingSkillProof] = useState(false);
  const [manualSkillName, setManualSkillName] = useState("");
  const [showManualSkillInput, setShowManualSkillInput] = useState(false);
  const [manualSkillLevel, setManualSkillLevel] = useState<"Débutant" | "Intermédiaire" | "Expert">(
    "Débutant"
  );
  const [showOnboardingModal, setShowOnboardingModal] = useState(false);
  const [showCareerGoalModal, setShowCareerGoalModal] = useState(false);
  const [isSavingOnboarding, setIsSavingOnboarding] = useState(false);
  const [onboardingError, setOnboardingError] = useState<string | null>(null);
  const [isProfileGaugeExpanded, setIsProfileGaugeExpanded] = useState(true);
  const [schoolJoinCodeInput, setSchoolJoinCodeInput] = useState("");
  const [schoolJoinBusy, setSchoolJoinBusy] = useState(false);
  const [schoolJoinError, setSchoolJoinError] = useState<string | null>(null);
  const [schoolJoinMessage, setSchoolJoinMessage] = useState<string | null>(null);
  const [onboardingForm, setOnboardingForm] = useState<ParticulierOnboardingForm>(EMPTY_ONBOARDING_FORM);

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
            setOnboardingForm(mapProfileToOnboardingForm(profileData as Record<string, unknown>));
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

  useEffect(() => {
    if (isSalarieSurface) return;
    let cancelled = false;

    const run = async () => {
      try {
        const res = await fetch("/api/dashboard/cross-profile-badge-celebration", {
          credentials: "include",
          cache: "no-store",
        });
        if (!res.ok || cancelled) return;
        const json = (await res.json()) as {
          pending?: boolean;
          badgeName?: string;
          badgeImageUrl?: string | null;
          walletHref?: string;
        };
        if (json.pending && json.badgeName) {
          setBadgeCelebration({
            badgeName: json.badgeName,
            badgeImageUrl: json.badgeImageUrl ?? null,
            walletHref: json.walletHref ?? "/dashboard/apprenant/badges",
          });
        }
      } catch {
        /* ignore */
      }
    };

    void run();
    return () => {
      cancelled = true;
    };
  }, [isSalarieSurface]);

  const dismissBadgeCelebration = useCallback(async () => {
    setBadgeCelebration(null);
    try {
      await fetch("/api/dashboard/cross-profile-badge-celebration", {
        method: "POST",
        credentials: "include",
      });
    } catch {
      /* ignore */
    }
  }, []);

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
        hard: hardSkills.slice().sort(),
        meta: Object.entries(skillsMetadata)
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([name, meta]) => [name, meta.level]),
        exp: experiencesPro.map((e) => [e.employeur ?? "", e.intitule ?? "", e.date_debut ?? ""]),
        dip: diplomes.map((d) => [d.intitule ?? "", d.ecole ?? "", d.annee_obtention ?? ""]),
      }),
    [discScores, idmcAxes, softSkillsRadar, hardSkills, skillsMetadata, experiencesPro, diplomes],
  );
  const discAnalysisText = String(
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
        const isTitle =
          /^#{2,3}\s+/.test(line) || /^\*\*[^*]+\*\*\s*$/.test(line);
        const text = line
          .replace(/^#{1,6}\s+/, "")
          .replace(/^\*\*([^*]+)\*\*\s*$/, "$1")
          .trim();
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
    setIsUploadingAvatar(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/upload/avatar", { method: "POST", body: formData });
      const data = (await res.json().catch(() => null)) as { url?: string; error?: string } | null;
      if (!res.ok || !data?.url) {
        toast.error(data?.error || "Impossible d'enregistrer la photo.");
        return;
      }
      setProfile((prev) => ({ ...(prev ?? {}), avatar_url: data.url }));
      toast.success("Photo enregistrée.");
    } catch {
      toast.error("Erreur réseau lors de l'upload.");
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
      lastAnalysisSignatureRef.current = null;
      await supabase.from("profiles").update({ bio_ai: null }).eq("id", user.id);
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
      lastAnalysisSignatureRef.current = null;
      await supabase.from("profiles").update({ bio_ai: null }).eq("id", user.id);
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
      lastAnalysisSignatureRef.current = null;
      await supabase
        .from("profiles")
        .update({ skills_metadata: nextMetadata, hard_skills: nextHard, bio_ai: null })
        .eq("id", user.id);
    } catch (error) {
      console.error("[skills] update error:", error);
    }
  };
  const HARD_SKILL_LIBRARY = GLOBAL_SKILL_REFERENTIAL;
  const filteredHardSkills = HARD_SKILL_LIBRARY.flatMap((group) =>
    group.items.map((item) => ({
      name: referentialItemName(item),
      subtitle: referentialItemSubtitle(item),
      category: group.category,
    })),
  ).filter((item) => item.name.toLowerCase().includes(skillSearch.toLowerCase()));
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
  const profileBio =
    String(profile?.bio ?? "").trim() ||
    parseBioAiText((profile as Record<string, unknown> | null)?.bio_ai);
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

  const isParticulierUser = useMemo(() => {
    const role = String(
      profile?.role_type ?? (profile as { role?: string } | null)?.role ?? userRole ?? "",
    )
      .trim()
      .toLowerCase();
    return role === "particulier" || role === "learner";
  }, [profile, userRole]);

  const needsCareerGoal = useMemo(() => {
    // Remplacé par l'étape « Construisons votre objectif » après le test DISC.
    return false;
  }, []);

  useEffect(() => {
    if (isLoading) return;
    if (needsOnboarding) {
      setShowOnboardingModal(true);
    } else {
      setShowOnboardingModal(false);
    }
  }, [isLoading, needsOnboarding]);

  useEffect(() => {
    if (isLoading) return;
    setShowCareerGoalModal(needsCareerGoal);
  }, [isLoading, needsCareerGoal]);

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
    const typeProfil = String((profile as Record<string, unknown> | null)?.type_profil ?? "").trim();
    const validationError = validateOnboardingForm(typeProfil, onboardingForm);
    if (validationError) {
      setOnboardingError(validationError);
      return;
    }
    setOnboardingError(null);
    setIsSavingOnboarding(true);
    try {
      const payload = buildOnboardingSavePayload(typeProfil, onboardingForm, computeAgeFromBirthDate);
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
          <CareerGoalStepModal
            open={showCareerGoalModal}
            onSaved={async () => {
              setShowCareerGoalModal(false);
              if (!supabase || !user?.id) return;
              const { data } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();
              if (data) setProfile(data as typeof profile);
            }}
          />
          <ParticulierOnboardingOverlay
            open={showOnboardingModal}
            typeProfil={profile?.type_profil}
            form={onboardingForm}
            saving={isSavingOnboarding}
            error={onboardingError}
            onChange={setOnboardingForm}
            onSave={handleSaveOnboarding}
          />
          {initialView === "home" ? (
            <>
          {!isSalarieSurface && appShell?.variant !== "jessica" ? (
            <Suspense fallback={<div className="mb-8 h-40 animate-pulse rounded-2xl bg-white/[0.04]" />}>
              <EdgeDashboardGpsContainer
                profile={(profile ?? null) as Record<string, unknown> | null}
                discScores={discScores}
                idmcAxes={idmcAxes}
                softSkillsRadar={softSkillsRadar}
                hardSkills={hardSkills}
                skillsMetadata={skillsMetadata}
                experiences={experiencesPro as ExperiencePro[]}
                diplomas={diplomes as Diplome[]}
                personalizedPlan={personalizedPlan}
                visibleBadges={visibleOpenBadges}
                earnedBadgeCount={earnedOpenBadges.length}
                profileCompletionPercent={profileCompletion.score}
              />
            </Suspense>
          ) : null}

          <section
            id="dashboard-secondary-modules"
            className={
              !isSalarieSurface && appShell?.variant !== "jessica"
                ? "mt-12 space-y-8 border-t border-white/[0.08] pt-10"
                : "space-y-8"
            }
          >
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
            compact={!isSalarieSurface && appShell?.variant !== "jessica"}
          />

              <PersonalizedActionPlanSection
                plan={personalizedPlan}
                className="opacity-90"
              />

              <div className="space-y-6">

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
          </section>
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
                    <span className="text-xs text-white/45">{isUploadingAvatar ? "…" : "Photo"}</span>
                  )}
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    disabled={isUploadingAvatar}
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
            <div className="fixed inset-0 z-[130] flex items-center justify-center bg-black/75 px-3 py-6 sm:px-4">
              <div className="max-h-[92vh] w-full max-w-5xl overflow-hidden overflow-y-auto rounded-3xl border border-white/10 bg-[#0D111A] text-white shadow-2xl">
                <div className="border-b border-white/10 px-4 py-4 sm:px-6">
                  <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
                    <div>
                      <div className="text-xs uppercase tracking-[0.3em] text-white/50">
                        Ajouter une compétence
                      </div>
                      <div className="mt-1 text-lg font-semibold text-white">Catalogue de compétences</div>
                    </div>
                    <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
                      <input
                        value={skillSearch}
                        onChange={(event) => setSkillSearch(event.target.value)}
                        placeholder="Rechercher une compétence..."
                        className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none sm:w-72"
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

                <div className="grid min-h-0 grid-cols-1 md:min-h-[430px] md:grid-cols-[280px_1fr]">
                  <aside className="border-b border-white/10 bg-white/[0.03] p-4 md:border-b-0 md:border-r">
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
                        ? filteredHardSkills
                        : HARD_SKILL_LIBRARY.filter((group) => group.category === activeCategory).flatMap(
                            (group) =>
                              group.items.map((item) => ({
                                name: referentialItemName(item),
                                subtitle: referentialItemSubtitle(item),
                              })),
                          )
                      ).map((entry) => {
                        const skill = entry.name;
                        const logo = resolveToolLogo(skill);
                        return (
                          <button
                            key={skill}
                            type="button"
                            onClick={() => {
                              setPendingHardSkill(skill);
                              setPendingSkillProof(Boolean(skillsMetadata[skill]?.validated));
                              setShowManualSkillInput(false);
                              setManualSkillName("");
                            }}
                            className="flex w-full items-center justify-between rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-left hover:bg-white/[0.07]"
                          >
                            <span className="flex min-w-0 items-center gap-3">
                              {logo ? (
                                <img src={logo} alt={skill} className="h-5 w-5 shrink-0 rounded-sm object-contain" />
                              ) : (
                                <span className="h-5 w-5 shrink-0 rounded-sm bg-white/10" />
                              )}
                              <span className="min-w-0">
                                <span className="block text-sm text-white/85">{skill}</span>
                                {entry.subtitle ? (
                                  <span className="block text-[11px] leading-snug text-white/45">{entry.subtitle}</span>
                                ) : null}
                              </span>
                            </span>
                            <span className="shrink-0 text-xs text-white/55">Configurer</span>
                          </button>
                        );
                      })}

                      {!skillSearch ? (
                        <button
                          type="button"
                          onClick={() => {
                            setPendingHardSkill(null);
                            setManualSkillName("");
                            setShowManualSkillInput(true);
                          }}
                          className="flex w-full items-center justify-between rounded-xl border border-dashed border-[#3D7BFF]/35 bg-[#3D7BFF]/5 px-3 py-2 text-left hover:bg-[#3D7BFF]/10"
                        >
                          <span className="min-w-0">
                            <span className="block text-sm text-white/90">Autre</span>
                            <span className="block text-[11px] leading-snug text-white/45">
                              Compétence absente du catalogue — saisie libre
                            </span>
                          </span>
                          <span className="shrink-0 text-xs text-[#3D7BFF]/80">Saisir</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            setPendingHardSkill(null);
                            setManualSkillName(skillSearch.trim());
                            setShowManualSkillInput(true);
                          }}
                          className="flex w-full items-center justify-between rounded-xl border border-dashed border-[#3D7BFF]/35 bg-[#3D7BFF]/5 px-3 py-2 text-left hover:bg-[#3D7BFF]/10"
                        >
                          <span className="min-w-0">
                            <span className="block text-sm text-white/90">Autre — « {skillSearch.trim()} »</span>
                            <span className="block text-[11px] leading-snug text-white/45">
                              Ajouter cette compétence en saisie libre
                            </span>
                          </span>
                          <span className="shrink-0 text-xs text-[#3D7BFF]/80">Saisir</span>
                        </button>
                      )}
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
                  <div className="border-t border-white/10 bg-white/[0.02] p-4">
                    <div className="text-sm text-white/80">Déclarer une compétence absente du catalogue</div>
                    <div className="mt-3 grid gap-3 md:grid-cols-[1fr_160px_auto]">
                    <input
                      value={manualSkillName}
                      onChange={(event) => setManualSkillName(event.target.value)}
                      placeholder="Nom de la compétence"
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
                        void persistSkills(next, nextHard);
                        setManualSkillName("");
                        setShowManualSkillInput(false);
                        setShowSkillModal(false);
                        setSkillSearch("");
                      }}
                      className="rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-semibold text-white"
                    >
                      Ajouter
                    </button>
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
          ) : null}

          <section className={`mt-10 ${APPRENANT_CARD_BODY}`}>
            <div>
              <div className="text-[10px] font-medium uppercase tracking-[0.25em] text-[#FF3B30]">
                Mon profil professionnel
              </div>
              <div className="mt-2 text-lg font-semibold text-white">
                Compétences, expériences & diplômes
              </div>
            </div>

            <ProfileSectionTabs
              variant="dashboard"
              className="mt-6"
              competences={
                <>
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="text-sm font-medium text-white/80">Hard skills & stack technique</div>
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
                </>
              }
              experiences={
                <>
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-medium text-white/80">Expériences professionnelles</div>
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
                </>
              }
              diplomes={
                <>
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-medium text-white/80">Diplômes & formations</div>
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
                </>
              }
            />
          </section>
            </>
          )}
      {badgeCelebration ? (
        <CrossProfileBadgeCelebration
          badgeName={badgeCelebration.badgeName}
          badgeImageUrl={badgeCelebration.badgeImageUrl}
          walletHref={badgeCelebration.walletHref}
          onDismiss={() => void dismissBadgeCelebration()}
        />
      ) : null}
    </>
  );
}
