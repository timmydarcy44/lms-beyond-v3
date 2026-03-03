"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  AlertTriangle,
  Award,
  BookOpen,
  Briefcase,
  Building2,
  ChevronDown,
  ChevronUp,
  GraduationCap,
  Home,
  Plus,
  Share2,
  Sparkles,
  UserCircle,
} from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import {
  AxisKey,
  AXES_LABELS,
  IdmcRadarChart,
  resolveIdmcAxes,
} from "@/components/idmc/IdmcRadarChart";
import {
  GLOBAL_SKILL_REFERENTIAL,
  resolveToolLogo,
} from "@/lib/profile/competency-referential";

type IdmcData = {
  scores?: Record<string, unknown> | null;
  responses?: Record<string, unknown> | null;
  global_score?: number | null;
  level?: string | null;
  updated_at?: string | null;
} | null;

type ExperienceItem = {
  start_date: string;
  end_date: string;
  employer: string;
  status: string;
  missions: string;
};

type EducationItem = {
  year: string;
  school: string;
  specialty: string;
};

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

const NAV_ITEMS = [
  { label: "Tableau de bord", href: "/dashboard/apprenant", icon: Home },
  { label: "Mes résultats", href: "/dashboard/apprenant/results", icon: Award },
  { label: "Mon coach", href: "/dashboard/apprenant/coach", icon: UserCircle },
  { label: "Mes badges", href: "/dashboard/apprenant/badges", icon: Sparkles },
  { label: "Carrière", href: "/dashboard/apprenant/career", icon: BookOpen },
];

const CareerPage = () => {
  const supabase = createSupabaseBrowserClient();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const pathname = usePathname();
  const [user, setUser] = useState<{
    email?: string;
    user_metadata?: { first_name?: string | null; last_name?: string | null };
  } | null>(null);
  const [profile, setProfile] = useState<Record<string, unknown> | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [idmcData, setIdmcData] = useState<IdmcData>(null);
  const [idmcAxes, setIdmcAxes] = useState<Record<AxisKey, number> | null>(null);
  const [discScores, setDiscScores] = useState<Record<string, number> | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [editableProfile, setEditableProfile] = useState<{
    first_name: string;
    last_name: string;
    age: string;
    city: string;
    phone: string;
    bio: string;
    tjm: string;
    expertise: string;
    disponibilite: boolean;
    anciennete_freelance: string;
    poste_actuel: string;
    entreprise: string;
    type_contrat: string;
    ecole: string;
    date_fin_contrat: string;
    rythme_alternance: string;
    niveau_etude: string;
    ancien_metier: string;
    metier_vise: string;
    echeance: string;
  }>({
    first_name: "",
    last_name: "",
    age: "",
    city: "",
    phone: "",
    bio: "",
    tjm: "",
    expertise: "",
    disponibilite: false,
    anciennete_freelance: "",
    poste_actuel: "",
    entreprise: "",
    type_contrat: "",
    ecole: "",
    date_fin_contrat: "",
    rythme_alternance: "",
    niveau_etude: "",
    ancien_metier: "",
    metier_vise: "",
    echeance: "",
  });
  const [experiences, setExperiences] = useState<ExperienceItem[]>([]);
  const [educations, setEducations] = useState<EducationItem[]>([]);
  const [experiencesPro, setExperiencesPro] = useState<ExperiencePro[]>([]);
  const [diplomes, setDiplomes] = useState<Diplome[]>([]);
  const [softSkillsTop, setSoftSkillsTop] = useState<Array<{ skill: string; score: number }>>(
    []
  );
  const [isRegeneratingBio, setIsRegeneratingBio] = useState(false);
  const [showQualificationModal, setShowQualificationModal] = useState(false);
  const [isSavingQualification, setIsSavingQualification] = useState(false);
  const [isProfileGaugeExpanded, setIsProfileGaugeExpanded] = useState(true);
  const [selectedTools, setSelectedTools] = useState<string[]>([]);
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [editableSkillsMetadata, setEditableSkillsMetadata] = useState<
    Record<string, { level: "Débutant" | "Intermédiaire" | "Expert"; validated: boolean; source: "manual" | "badge" }>
  >({});
  const [showAddModal, setShowAddModal] = useState(false);
  const [addModalType, setAddModalType] = useState<"stack" | "skill">("stack");
  const [catalogCategory, setCatalogCategory] = useState("");
  const [catalogSearch, setCatalogSearch] = useState("");
  const [pendingSkillForLevel, setPendingSkillForLevel] = useState<string | null>(null);
  const [pendingSkillProof, setPendingSkillProof] = useState(false);
  const [hasSchool, setHasSchool] = useState<boolean | null>(null);
  const [qualificationForm, setQualificationForm] = useState({
    first_name: "",
    last_name: "",
    city: "",
    telephone: "",
    birth_date: "",
    poste_actuel: "",
    entreprise: "",
    type_contrat: "",
    tjm: "",
    expertise: "",
    disponibilite: "",
    ancien_metier: "",
    metier_vise: "",
    organisme_formation: "",
    echeance: "",
    ecole: "",
    niveau_etude: "",
    rythme_alternance: "",
    date_fin_contrat: "",
  });

  const testStatus = useMemo(
    () => ({
      comportemental: Boolean(discScores),
      idmc: Boolean(idmcData && idmcAxes),
      softSkills: softSkillsTop.length > 0,
    }),
    [discScores, idmcData, idmcAxes, softSkillsTop.length]
  );

  const qualificationMissing = useMemo(() => {
    const typeProfil = String((profile as Record<string, unknown> | null)?.type_profil ?? "").trim();
    if (!typeProfil) return false;
    const field = (value: unknown) => String(value ?? "").trim();
    const baseMissing =
      !field((profile as Record<string, unknown> | null)?.first_name) ||
      !field((profile as Record<string, unknown> | null)?.last_name) ||
      !field((profile as Record<string, unknown> | null)?.city) ||
      !field((profile as Record<string, unknown> | null)?.telephone) ||
      !field((profile as Record<string, unknown> | null)?.birth_date);
    if (typeProfil === "freelance") {
      return baseMissing || (
        !field((profile as Record<string, unknown> | null)?.tjm) ||
        !field((profile as Record<string, unknown> | null)?.expertise)
      );
    }
    if (typeProfil === "emploi") {
      return baseMissing || (
        !field((profile as Record<string, unknown> | null)?.poste_actuel) ||
        !field((profile as Record<string, unknown> | null)?.entreprise) ||
        !field((profile as Record<string, unknown> | null)?.type_contrat)
      );
    }
    if (typeProfil === "reconversion") {
      return baseMissing || (
        !field((profile as Record<string, unknown> | null)?.ancien_metier) ||
        !field((profile as Record<string, unknown> | null)?.metier_vise) ||
        !field((profile as Record<string, unknown> | null)?.organisme_formation) ||
        !field((profile as Record<string, unknown> | null)?.echeance)
      );
    }
    if (typeProfil === "alternance") {
      return baseMissing || (
        !field((profile as Record<string, unknown> | null)?.ecole) ||
        !field((profile as Record<string, unknown> | null)?.niveau_etude) ||
        !field((profile as Record<string, unknown> | null)?.rythme_alternance) ||
        !field((profile as Record<string, unknown> | null)?.date_fin_contrat)
      );
    }
    return baseMissing;
  }, [profile]);

  const STACK_REFERENTIAL = GLOBAL_SKILL_REFERENTIAL;
  const SKILL_REFERENTIAL = GLOBAL_SKILL_REFERENTIAL;
  const activeCatalog = addModalType === "stack" ? STACK_REFERENTIAL : SKILL_REFERENTIAL;
  const catalogCategories = activeCatalog.map((group) => group.category);
  const catalogItems = activeCatalog
    .filter((group) => !catalogCategory || group.category === catalogCategory)
    .flatMap((group) => group.items)
    .filter((item) => item.toLowerCase().includes(catalogSearch.toLowerCase()));

  const openAddModal = (type: "stack" | "skill") => {
    setAddModalType(type);
    const initialCategory =
      type === "stack" ? STACK_REFERENTIAL[0]?.category : SKILL_REFERENTIAL[0]?.category;
    setCatalogCategory(initialCategory ?? "");
    setCatalogSearch("");
    setPendingSkillForLevel(null);
    setPendingSkillProof(false);
    setShowAddModal(true);
  };

  useEffect(() => {
    if (!profile) return;
    if (qualificationMissing) {
      setQualificationForm({
        first_name: String((profile as Record<string, unknown> | null)?.first_name ?? ""),
        last_name: String((profile as Record<string, unknown> | null)?.last_name ?? ""),
        city: String((profile as Record<string, unknown> | null)?.city ?? ""),
        telephone: String((profile as Record<string, unknown> | null)?.telephone ?? ""),
        birth_date: String((profile as Record<string, unknown> | null)?.birth_date ?? ""),
        poste_actuel: String((profile as Record<string, unknown> | null)?.poste_actuel ?? ""),
        entreprise: String((profile as Record<string, unknown> | null)?.entreprise ?? ""),
        type_contrat: String((profile as Record<string, unknown> | null)?.type_contrat ?? ""),
        tjm: String((profile as Record<string, unknown> | null)?.tjm ?? ""),
        expertise: String((profile as Record<string, unknown> | null)?.expertise ?? ""),
        disponibilite:
          (profile as Record<string, unknown> | null)?.disponibilite === true
            ? "Oui"
            : (profile as Record<string, unknown> | null)?.disponibilite === false
              ? "Non"
              : String((profile as Record<string, unknown> | null)?.disponibilite ?? ""),
        ancien_metier: String((profile as Record<string, unknown> | null)?.ancien_metier ?? ""),
        metier_vise: String((profile as Record<string, unknown> | null)?.metier_vise ?? ""),
        organisme_formation: String((profile as Record<string, unknown> | null)?.organisme_formation ?? ""),
        echeance: String((profile as Record<string, unknown> | null)?.echeance ?? ""),
        ecole: String((profile as Record<string, unknown> | null)?.ecole ?? ""),
        niveau_etude: String((profile as Record<string, unknown> | null)?.niveau_etude ?? ""),
        rythme_alternance: String((profile as Record<string, unknown> | null)?.rythme_alternance ?? ""),
        date_fin_contrat: String((profile as Record<string, unknown> | null)?.date_fin_contrat ?? ""),
      });
    }
  }, [profile, qualificationMissing]);

  const expertAnalysisPrompt = useMemo(() => {
    const firstName = String(profile?.first_name ?? "l'apprenant").trim();
    const comportemental = discScores
      ? JSON.stringify(discScores)
      : "pas réalisé";
    const idmc = idmcData?.scores
      ? JSON.stringify(idmcData.scores)
      : "pas réalisé";
    const softSkills = softSkillsTop.length
      ? JSON.stringify(softSkillsTop)
      : "pas réalisé";
    const field = (value: unknown) => {
      const trimmed = String(value ?? "").trim();
      return trimmed || "non renseigné";
    };
    const typeProfil = field((profile as Record<string, unknown> | null)?.type_profil);
    const emploi = {
      poste_actuel: field((profile as Record<string, unknown> | null)?.poste_actuel),
      entreprise: field((profile as Record<string, unknown> | null)?.entreprise),
      type_contrat: field((profile as Record<string, unknown> | null)?.type_contrat),
    };
    const freelance = {
      tjm: field((profile as Record<string, unknown> | null)?.tjm),
      expertise: field((profile as Record<string, unknown> | null)?.expertise),
      stack_technique: field((profile as Record<string, unknown> | null)?.stack_technique),
      disponibilite: field((profile as Record<string, unknown> | null)?.disponibilite),
      langues: field((profile as Record<string, unknown> | null)?.langues),
    };
    const reconversion = {
      ancien_metier: field((profile as Record<string, unknown> | null)?.ancien_metier),
      metier_vise: field((profile as Record<string, unknown> | null)?.metier_vise),
      organisme_formation: field((profile as Record<string, unknown> | null)?.organisme_formation),
      echeance: field((profile as Record<string, unknown> | null)?.echeance),
    };
    const alternance = {
      ecole: field((profile as Record<string, unknown> | null)?.ecole),
      niveau_etude: field((profile as Record<string, unknown> | null)?.niveau_etude),
      rythme_alternance: field((profile as Record<string, unknown> | null)?.rythme_alternance),
      date_fin_contrat: field((profile as Record<string, unknown> | null)?.date_fin_contrat),
    };

    return `Tu es expert en analyse comportementale. Données des tests : Comportemental=${comportemental}, IDMC=${idmc}, Soft Skills=${softSkills}. Données profil professionnel : type_profil=${typeProfil}, emploi=${JSON.stringify(
      emploi
    )}, freelance=${JSON.stringify(freelance)}, reconversion=${JSON.stringify(
      reconversion
    )}, alternance=${JSON.stringify(alternance)}. Analyse le profil de ${firstName}.`;
  }, [profile, discScores, idmcData, softSkillsTop]);

  const handleQualificationSave = async () => {
    if (!supabase || !userId) return;
    const typeProfil = String((profile as Record<string, unknown> | null)?.type_profil ?? "").trim();
    if (!typeProfil) return;
    setIsSavingQualification(true);
    try {
      const payload: Record<string, unknown> = {};
      payload.first_name = qualificationForm.first_name;
      payload.last_name = qualificationForm.last_name;
      payload.city = qualificationForm.city;
      payload.telephone = qualificationForm.telephone;
      payload.birth_date = qualificationForm.birth_date || null;
      if (typeProfil === "freelance") {
        payload.tjm = qualificationForm.tjm;
        payload.expertise = qualificationForm.expertise;
        payload.disponibilite =
          qualificationForm.disponibilite === "Oui"
            ? true
            : qualificationForm.disponibilite === "Non"
              ? false
              : null;
      }
      if (typeProfil === "emploi") {
        payload.poste_actuel = qualificationForm.poste_actuel;
        payload.entreprise = qualificationForm.entreprise;
        payload.type_contrat = qualificationForm.type_contrat;
      }
      if (typeProfil === "reconversion") {
        payload.ancien_metier = qualificationForm.ancien_metier;
        payload.metier_vise = qualificationForm.metier_vise;
        payload.organisme_formation = qualificationForm.organisme_formation;
        payload.echeance = qualificationForm.echeance;
      }
      if (typeProfil === "alternance") {
        payload.ecole = qualificationForm.ecole;
        payload.niveau_etude = qualificationForm.niveau_etude;
        payload.rythme_alternance = qualificationForm.rythme_alternance;
        payload.date_fin_contrat = qualificationForm.date_fin_contrat;
      }
      console.log("Payload:", payload);
      const { error } = await supabase.from("profiles").update(payload).eq("id", userId);
      if (error) {
        console.error("[qualification] update error:", error);
        return;
      }
      setProfile((prev) => ({ ...(prev ?? {}), ...payload }));
      setShowQualificationModal(false);
    } finally {
      setIsSavingQualification(false);
    }
  };

  const LoadingSpinner = () => (
    <div className="flex min-h-[40vh] items-center justify-center text-sm text-white/70">
      Chargement du profil...
    </div>
  );

  useEffect(() => {
    const load = async () => {
      if (!supabase) return;
      setIsLoading(true);
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError || !userData?.user?.id) return;
      const userId = userData.user.id;
      const profileIdsToQuery = [userId];
      setUserId(userId);
      setUser({
        email: userData.user.email ?? undefined,
        user_metadata: userData.user.user_metadata as
          | { first_name?: string | null; last_name?: string | null }
          | undefined,
      });

      try {
        const { data: profileData } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", userId)
          .maybeSingle();
        let resolvedProfile = profileData ?? null;
        if (!resolvedProfile && userData.user.email) {
          const { data: legacyProfileData } = await supabase
            .from("profiles")
            .select("*")
            .eq("email", userData.user.email)
            .maybeSingle();
          resolvedProfile = legacyProfileData ?? null;
        }
        const resolvedProfileId =
          resolvedProfile && typeof (resolvedProfile as Record<string, unknown>).id === "string"
            ? String((resolvedProfile as Record<string, unknown>).id)
            : null;
        if (resolvedProfileId && resolvedProfileId !== userId) {
          profileIdsToQuery.push(resolvedProfileId);
        }
        setProfile(resolvedProfile ?? null);
        if (resolvedProfile) {
          const rawStack = resolvedProfile.stack_technique as unknown;
          if (typeof rawStack === "string" && rawStack.trim()) {
            try {
              const parsed = JSON.parse(rawStack) as { tools?: string[]; skills?: string[] };
              setSelectedTools(parsed.tools ?? []);
              setSelectedSkills(parsed.skills ?? []);
            } catch {
              const list = rawStack.split(",").map((item) => item.trim()).filter(Boolean);
              setSelectedTools(list);
              setSelectedSkills([]);
            }
          } else {
            setSelectedTools([]);
            setSelectedSkills([]);
          }
          setEditableProfile({
            first_name: String(resolvedProfile.first_name ?? ""),
            last_name: String(resolvedProfile.last_name ?? ""),
            age: String(resolvedProfile.age ?? ""),
            city: String(resolvedProfile.city ?? ""),
            phone: String(resolvedProfile.telephone ?? resolvedProfile.phone ?? resolvedProfile.phone_number ?? ""),
            bio: String(resolvedProfile.bio ?? ""),
            tjm: String(resolvedProfile.tjm ?? ""),
            expertise: String(resolvedProfile.expertise ?? ""),
            disponibilite: Boolean(resolvedProfile.disponibilite),
            anciennete_freelance: String(resolvedProfile.anciennete_freelance ?? ""),
            poste_actuel: String(resolvedProfile.poste_actuel ?? ""),
            entreprise: String(resolvedProfile.entreprise ?? ""),
            type_contrat: String(resolvedProfile.type_contrat ?? ""),
            ecole: String(resolvedProfile.ecole ?? ""),
            date_fin_contrat: String(resolvedProfile.date_fin_contrat ?? ""),
            rythme_alternance: String(resolvedProfile.rythme_alternance ?? ""),
            niveau_etude: String(resolvedProfile.niveau_etude ?? ""),
            ancien_metier: String(resolvedProfile.ancien_metier ?? ""),
            metier_vise: String(resolvedProfile.metier_vise ?? ""),
            echeance: String(resolvedProfile.echeance ?? ""),
          });
          setHasSchool(Boolean(String(resolvedProfile.ecole ?? "").trim()));
          const rawExperience = resolvedProfile.experience as unknown;
          const rawEducation = resolvedProfile.education as unknown;
          setExperiences(Array.isArray(rawExperience) ? (rawExperience as ExperienceItem[]) : []);
          setEducations(Array.isArray(rawEducation) ? (rawEducation as EducationItem[]) : []);
        }
      } catch {
        setProfile(null);
      }

      try {
        let idmcResult: {
          responses?: Record<string, unknown> | null;
          scores?: Record<string, unknown> | null;
          global_score?: number | null;
          level?: string | null;
          updated_at?: string | null;
        } | null = null;
        for (const candidateId of profileIdsToQuery) {
          const { data, error } = await supabase
            .from("idmc_resultats")
            .select("responses, scores, global_score, level, updated_at")
            .eq("profile_id", candidateId)
            .maybeSingle();
          if (error) {
            console.error("[idmc] idmc_resultats error:", error);
            continue;
          }
          if (data) {
            idmcResult = data as {
              responses?: Record<string, unknown> | null;
              scores?: Record<string, unknown> | null;
              global_score?: number | null;
              level?: string | null;
              updated_at?: string | null;
            };
            break;
          }
        }
        console.log("Données IDMC chargées pour:", userId, idmcResult);
        setIdmcData(idmcResult ?? null);
        const axes = resolveIdmcAxes(idmcResult?.scores ?? idmcResult?.responses);
        setIdmcAxes(axes);
      } catch {
        setIdmcData(null);
        setIdmcAxes(null);
      }

      try {
        let discResult: { scores?: Record<string, unknown> | null } | null = null;
        for (const candidateId of profileIdsToQuery) {
          const { data, error } = await supabase
            .from("disc_resultats")
            .select("scores")
            .eq("profile_id", candidateId)
            .maybeSingle();
          if (error) {
            console.error("[disc] disc_resultats error:", error);
            continue;
          }
          if (data) {
            discResult = data as { scores?: Record<string, unknown> | null };
            break;
          }
        }
        if (discResult?.scores && typeof discResult.scores === "object") {
          const scores = discResult.scores as Record<string, unknown>;
          const parsed = {
            D: Number(scores.D || 0),
            I: Number(scores.I || 0),
            S: Number(scores.S || 0),
            C: Number(scores.C || 0),
          };
          setDiscScores(parsed);
        } else {
          setDiscScores(null);
        }
      } catch {
        setDiscScores(null);
      }

      try {
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

      try {
        let softSkillsData: { scores?: Record<string, unknown> | null } | null = null;
        for (const candidateId of profileIdsToQuery) {
          const { data, error } = await supabase
            .from("soft_skills_resultats")
            .select("scores")
            .eq("learner_id", candidateId)
            .maybeSingle();
          if (error) {
            console.error("[soft-skills] soft_skills_resultats error:", error);
            continue;
          }
          if (data) {
            softSkillsData = data as { scores?: Record<string, unknown> | null };
            break;
          }
        }
        const rawScores = softSkillsData?.scores;
        if (rawScores && typeof rawScores === "object" && !Array.isArray(rawScores)) {
          const mapped = Object.entries(rawScores as Record<string, number>)
            .map(([skill, score]) => ({ skill, score: Number(score) }))
            .sort((a, b) => b.score - a.score)
            .slice(0, 5);
          setSoftSkillsTop(mapped);
        } else {
          setSoftSkillsTop([]);
        }
      } catch {
        setSoftSkillsTop([]);
      }
      setIsLoading(false);
    };
    load();
  }, [supabase]);

  const emailPrefix = useMemo(() => {
    const value = String(profile?.email ?? user?.email ?? "").trim();
    return value ? value.split("@")[0] : "";
  }, [profile, user]);

  const displayFirstName = useMemo(() => {
    return (
      String(profile?.first_name ?? "").trim() ||
      String(user?.user_metadata?.first_name ?? "").trim() ||
      emailPrefix ||
      "Utilisateur"
    );
  }, [profile, user, emailPrefix]);

  const fullName = useMemo(() => {
    const first =
      String(profile?.first_name ?? "").trim() ||
      String(user?.user_metadata?.first_name ?? "").trim();
    const last =
      String(profile?.last_name ?? "").trim() ||
      String(user?.user_metadata?.last_name ?? "").trim();
    const merged = [first, last].filter(Boolean).join(" ");
    return merged || emailPrefix || displayFirstName;
  }, [profile, user, emailPrefix, displayFirstName]);

  const email = String(profile?.email ?? user?.email ?? "").trim() || "—";
  const phone = String(profile?.telephone ?? profile?.phone ?? profile?.phone_number ?? "").trim() || "—";
  const address = String(profile?.address ?? profile?.address_line ?? "").trim() || "—";
  const city = String(profile?.city ?? "").trim();
  const postalCode = String(profile?.postal_code ?? "").trim();
  const location = [address, [postalCode, city].filter(Boolean).join(" ")].filter(Boolean).join(", ") || "—";
  const learnerIdentifier = userId
    ? `APP-${userId.replace(/-/g, "").slice(0, 8).toUpperCase()}`
    : "—";
  const age = useMemo(() => {
    const birthDate = (profile as Record<string, unknown> | null)?.date_naissance ?? profile?.birth_date;
    if (!birthDate || typeof birthDate !== "string") return "—";
    const parsed = new Date(birthDate);
    if (Number.isNaN(parsed.getTime())) return "—";
    const diff = Date.now() - parsed.getTime();
    return Math.floor(diff / (365.25 * 24 * 60 * 60 * 1000));
  }, [profile]);

  const profileType = useMemo(
    () => String((profile as Record<string, unknown> | null)?.type_profil ?? "").trim(),
    [profile]
  );
  const profileTitle = useMemo(() => {
    if (profileType === "freelance") return "Profil Freelance";
    if (profileType === "alternance") return "Profil Alternant";
    if (profileType === "reconversion") return "Profil Reconversion";
    return "Profil";
  }, [profileType]);

  const profileHighlights = useMemo(() => {
    const typeProfil = String((profile as Record<string, unknown> | null)?.type_profil ?? "").trim();
    const field = (value: unknown) => String(value ?? "").trim() || "—";
    if (typeProfil === "freelance") {
      return [
        `TJM : ${field((profile as Record<string, unknown> | null)?.tjm)}`,
        `Disponibilité : ${field((profile as Record<string, unknown> | null)?.disponibilite)}`,
      ];
    }
    if (typeProfil === "emploi") {
      return [
        `Poste actuel : ${field((profile as Record<string, unknown> | null)?.poste_actuel)}`,
        `Entreprise : ${field((profile as Record<string, unknown> | null)?.entreprise)}`,
        `Type de contrat : ${field((profile as Record<string, unknown> | null)?.type_contrat)}`,
      ];
    }
    if (typeProfil === "reconversion") {
      return [
        `Ancien métier : ${field((profile as Record<string, unknown> | null)?.ancien_metier)}`,
        `Métier visé : ${field((profile as Record<string, unknown> | null)?.metier_vise)}`,
        `Organisme : ${field((profile as Record<string, unknown> | null)?.organisme_formation)}`,
        `Échéance : ${field((profile as Record<string, unknown> | null)?.echeance)}`,
      ];
    }
    if (typeProfil === "alternance") {
      return [
        `École : ${field((profile as Record<string, unknown> | null)?.ecole)}`,
        `Entreprise : ${field((profile as Record<string, unknown> | null)?.entreprise)}`,
        `Rythme : ${field((profile as Record<string, unknown> | null)?.rythme_alternance)}`,
        `Fin de contrat : ${field((profile as Record<string, unknown> | null)?.date_fin_contrat)}`,
      ];
    }
    return [];
  }, [profile]);

  const profileDetails = useMemo(() => {
    const field = (value: unknown) => String(value ?? "").trim() || "—";
    if (profileType === "freelance") {
      const tjmValue = field((profile as Record<string, unknown> | null)?.tjm);
      return [
        { label: "TJM", value: tjmValue === "—" ? "—" : `${tjmValue}€ / jour` },
        { label: "Expertise", value: field((profile as Record<string, unknown> | null)?.expertise) },
        { label: "Ancienneté freelance", value: field((profile as Record<string, unknown> | null)?.anciennete_freelance) },
        {
          label: "Disponibilité",
          value: (profile as Record<string, unknown> | null)?.disponibilite ? "Disponible" : "Non disponible",
        },
      ];
    }
    if (profileType === "emploi") {
      return [
        { label: "Poste actuel", value: field((profile as Record<string, unknown> | null)?.poste_actuel) },
        { label: "Entreprise", value: field((profile as Record<string, unknown> | null)?.entreprise) },
        { label: "Type de contrat", value: field((profile as Record<string, unknown> | null)?.type_contrat) },
      ];
    }
    if (profileType === "alternance") {
      return [
        { label: "École", value: field((profile as Record<string, unknown> | null)?.ecole) },
        { label: "Entreprise", value: field((profile as Record<string, unknown> | null)?.entreprise) },
        { label: "Rythme alternance", value: field((profile as Record<string, unknown> | null)?.rythme_alternance) },
        { label: "Fin de contrat", value: field((profile as Record<string, unknown> | null)?.date_fin_contrat) },
      ];
    }
    if (profileType === "reconversion") {
      return [
        { label: "Ancien métier", value: field((profile as Record<string, unknown> | null)?.ancien_metier) },
        { label: "Métier visé", value: field((profile as Record<string, unknown> | null)?.metier_vise) },
        { label: "Échéance", value: field((profile as Record<string, unknown> | null)?.echeance) },
      ];
    }
    return [];
  }, [profile, profileType]);

  const reviews = [] as Array<{
    name: string;
    rating: number;
    comment: string;
    date: string;
  }>;
  const hasRecommendations = reviews.length > 0;

  const expertiseChips = useMemo(() => {
    const raw = String((profile as Record<string, unknown> | null)?.expertise ?? "")
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
    return raw;
  }, [profile]);
  const parsedTools = useMemo(() => {
    const raw = (profile as Record<string, unknown> | null)?.stack_technique;
    if (typeof raw === "string" && raw.trim()) {
      try {
        const parsed = JSON.parse(raw) as { tools?: string[]; skills?: string[] };
        return parsed.tools ?? [];
      } catch {
        return raw.split(",").map((item) => item.trim()).filter(Boolean);
      }
    }
    return [];
  }, [profile]);
  useEffect(() => {
    const raw = (profile as Record<string, unknown> | null)?.skills_metadata;
    if (!raw) {
      setEditableSkillsMetadata({});
      return;
    }
    if (typeof raw === "string") {
      try {
        setEditableSkillsMetadata(
          JSON.parse(raw) as Record<
            string,
            { level: "Débutant" | "Intermédiaire" | "Expert"; validated: boolean; source: "manual" | "badge" }
          >
        );
      } catch {
        setEditableSkillsMetadata({});
      }
      return;
    }
    if (typeof raw === "object") {
      setEditableSkillsMetadata(
        raw as Record<
          string,
          { level: "Débutant" | "Intermédiaire" | "Expert"; validated: boolean; source: "manual" | "badge" }
        >
      );
      return;
    }
    setEditableSkillsMetadata({});
  }, [profile]);

  const skillEntries = useMemo(
    () =>
      Object.entries(editableSkillsMetadata).map(([name, meta]) => ({
        name,
        level: meta?.level ?? "Débutant",
        validated: Boolean(meta?.validated),
      })),
    [editableSkillsMetadata]
  );
  const certifiedSkills = skillEntries.filter((item) => item.validated);
  const nonValidatedSkills = skillEntries.filter((item) => !item.validated);

  const hasOrganisation = Boolean(
    (profile as Record<string, unknown> | null)?.entreprise_id ||
      (profile as Record<string, unknown> | null)?.school_id
  );
  const softSkillsTopMax = softSkillsTop.length
    ? Math.max(...softSkillsTop.map((item) => item.score))
    : 0;
  const idmcGlobalScore = useMemo(() => {
    if (!idmcAxes) return null;
    const values = (Object.keys(AXES_LABELS) as AxisKey[]).map((key) =>
      Number(idmcAxes[key] ?? 0)
    );
    if (!values.length) return null;
    const avg = values.reduce((sum, value) => sum + value, 0) / values.length;
    return Number(avg.toFixed(2));
  }, [idmcAxes]);
  const idmcInterpretation = useMemo(() => {
    if (idmcGlobalScore === null) return null;
    if (idmcGlobalScore <= 39) {
      return {
        label: "Maîtrise à construire",
        detail: "Accompagnement ciblé recommandé.",
      };
    }
    if (idmcGlobalScore <= 59) {
      return {
        label: "Maîtrise en développement",
        detail: "Axes de progrès identifiables.",
      };
    }
    if (idmcGlobalScore <= 79) {
      return {
        label: "Maîtrise opérationnelle",
        detail: "Stratégies efficaces.",
      };
    }
    return {
      label: "Maîtrise experte",
      detail: "Profil apprenant solide.",
    };
  }, [idmcGlobalScore]);

  const profileCompletion = useMemo(() => {
    const source = (profile ?? {}) as Record<string, unknown>;
    const typeProfil = String(source.type_profil ?? "").trim().toLowerCase();
    const hasValue = (value: unknown) => String(value ?? "").trim().length > 0;
    const checklist = [
      { key: "idmc", label: "Test IDMC", weight: 30, done: Boolean(idmcAxes) },
      { key: "disc", label: "Test comportemental", weight: 25, done: Boolean(discScores) },
      { key: "soft", label: "Soft Skills", weight: 20, done: softSkillsTop.length > 0 },
      {
        key: "base",
        label: "Infos de base (ville + telephone)",
        weight: 10,
        done: hasValue(source.city) && hasValue(source.telephone),
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
        weight: 15,
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
    ] as const;

    const score = checklist.reduce((sum, item) => sum + (item.done ? item.weight : 0), 0);
    const level =
      score >= 85
        ? "Profil tres complet"
        : score >= 65
          ? "Profil solide"
          : score >= 40
            ? "Profil en progression"
            : "Profil a completer";
    return { score, level, checklist };
  }, [profile, idmcAxes, discScores, softSkillsTop]);

  const navItems = useMemo(() => {
    const items = [...NAV_ITEMS];
    if (hasOrganisation) {
      items.splice(4, 0, {
        label: "Mon entreprise",
        href: "/dashboard/apprenant/entreprise",
        icon: Building2,
      });
    }
    return items;
  }, [hasOrganisation]);

  const handleEditToggle = () => {
    setIsEditing((prev) => !prev);
  };

  const handleProfileFieldChange = (key: string, value: string | boolean) => {
    setEditableProfile((prev) => ({ ...prev, [key]: value }));
  };

  const handleAvatarUpload = async (file: File) => {
    if (!supabase || !userId) return;
    setIsUploadingAvatar(true);
    try {
      const extension = file.name.split(".").pop() || "jpg";
      const path = `${userId}/${Date.now()}.${extension}`;
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
        .eq("id", userId);
      if (updateError) {
        console.error("[avatar] update profile error:", updateError);
        return;
      }
      setProfile((prev) => ({ ...(prev ?? {}), avatar_url: publicUrl }));
      setEditableProfile((prev) => ({ ...prev, avatar_url: publicUrl }));
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const handleAddExperience = () => {
    setExperiences((prev) => [
      ...prev,
      { start_date: "", end_date: "", employer: "", status: "", missions: "" },
    ]);
  };

  const handleExperienceChange = (index: number, key: keyof ExperienceItem, value: string) => {
    setExperiences((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [key]: value };
      return next;
    });
  };

  const handleAddEducation = () => {
    setEducations((prev) => [...prev, { year: "", school: "", specialty: "" }]);
  };

  const handleEducationChange = (index: number, key: keyof EducationItem, value: string) => {
    setEducations((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [key]: value };
      return next;
    });
  };

  const handleSaveProfile = async () => {
    if (!supabase || !userId) return;
    setIsSaving(true);
    try {
      const toNull = (value: string) => value.trim() || null;
      const tjmValue = editableProfile.tjm ? Number(editableProfile.tjm) : null;
      const payload = {
        first_name: toNull(editableProfile.first_name),
        last_name: toNull(editableProfile.last_name),
        age: editableProfile.age ? Number(editableProfile.age) : null,
        city: toNull(editableProfile.city),
        telephone: toNull(editableProfile.phone),
        bio: toNull(editableProfile.bio),
        tjm: Number.isFinite(tjmValue) ? tjmValue : null,
        expertise: toNull(editableProfile.expertise),
        disponibilite: Boolean(editableProfile.disponibilite),
        anciennete_freelance: toNull(editableProfile.anciennete_freelance),
        poste_actuel: toNull(editableProfile.poste_actuel),
        entreprise: toNull(editableProfile.entreprise),
        type_contrat: toNull(editableProfile.type_contrat),
        ecole: toNull(editableProfile.ecole),
        date_fin_contrat: toNull(editableProfile.date_fin_contrat),
        rythme_alternance: toNull(editableProfile.rythme_alternance),
        niveau_etude: toNull(editableProfile.niveau_etude),
        ancien_metier: toNull(editableProfile.ancien_metier),
        metier_vise: toNull(editableProfile.metier_vise),
        echeance: toNull(editableProfile.echeance),
        stack_technique: JSON.stringify({ tools: selectedTools, skills: selectedSkills }),
        skills_metadata: editableSkillsMetadata,
      };
      console.log("Saving profile:", payload);
      const { error } = await supabase.from("profiles").update(payload).eq("id", userId);
      if (error) {
        console.error("Erreur sauvegarde profil:", error);
        return;
      }
      setProfile((prev) => ({ ...(prev ?? {}), ...payload }));
      setIsEditing(false);
    } finally {
      setIsSaving(false);
    }
  };

  const slugify = (value: string) =>
    value
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

  const handleShareProfile = async () => {
    if (!userId) return;
    if (!supabase) {
      return;
    }
    const firstName = String((profile as Record<string, unknown> | null)?.first_name ?? "").trim();
    const lastName = String((profile as Record<string, unknown> | null)?.last_name ?? "").trim();
    const publicSlug = slugify(`${firstName} ${lastName}`.trim()) || userId;
    const shareUrl = `${window.location.origin}/p/${publicSlug}`;
    try {
      await supabase
        .from("user_profile_settings")
        .upsert({ user_id: userId, public_slug: publicSlug }, { onConflict: "user_id" });
      if (navigator.share) {
        await navigator.share({
          title: "Profil Beyond",
          text: "Découvrez mon profil Beyond.",
          url: shareUrl,
        });
        return;
      }
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(shareUrl);
        return;
      }
    } catch {
      // ignore share errors
    }
  };

  const discDominant = useMemo(() => {
    if (!discScores) return null;
    const entries = Object.entries(discScores) as Array<[string, number]>;
    const sorted = entries.sort((a, b) => b[1] - a[1]);
    const top = sorted[0]?.[0];
    if (!top) return null;
    return top === "D"
      ? "Dominant"
      : top === "I"
        ? "Influent"
        : top === "S"
          ? "Stable"
          : "Consciencieux";
  }, [discScores]);

  const hasNewPresentation = useMemo(() => {
    if (!idmcData?.updated_at) return false;
    const updated = new Date(idmcData.updated_at);
    if (Number.isNaN(updated.getTime())) return false;
    return Date.now() - updated.getTime() < 7 * 24 * 60 * 60 * 1000;
  }, [idmcData]);

  const presentation = useMemo(() => {
    const bio = String((profile as Record<string, unknown> | null)?.bio_ai ?? "").trim();
    if (bio) return bio;
    return "Génération de votre profil en cours...";
  }, [profile]);

  const formatMonthYear = (value?: string | null) => {
    if (!value) return "—";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return new Intl.DateTimeFormat("fr-FR", { month: "short", year: "numeric" }).format(date);
  };

  const formatRange = (start?: string | null, end?: string | null) => {
    const startLabel = formatMonthYear(start);
    const endLabel = end ? formatMonthYear(end) : "Présent";
    return `${startLabel} - ${endLabel}`;
  };

  if (isLoading && !profile) {
    return <LoadingSpinner />;
  }

  const handleRegenerateBio = async () => {
    if (!userId) return;
    setIsRegeneratingBio(true);
    try {
      const response = await fetch("/api/profile-bio", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: String(profile?.first_name ?? "").trim(),
          experiences: experiencesPro,
          diplomes,
          softSkills: softSkillsTop,
          discScores,
          idmc: idmcData,
        }),
      });
      if (!response.ok) {
        throw new Error("Erreur lors de la génération de la bio.");
      }
      const payload = (await response.json()) as { bio?: string };
      if (payload.bio) {
        setProfile((prev) => ({ ...(prev ?? {}), bio_ai: payload.bio }));
      }
    } catch (error) {
      console.error("[bio] regenerate error:", error);
    } finally {
      setIsRegeneratingBio(false);
    }
  };

  try {
      return (
        <>
        <div className="min-h-screen bg-[#0B0D12] text-white">
        <style jsx global>{`
          @import url("https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&display=swap");
        `}</style>
        <div className="flex h-screen overflow-hidden font-['Inter']">
          <aside
            className={`sticky left-0 top-0 hidden h-screen flex-col bg-transparent py-4 transition-all lg:flex ${
              isSidebarCollapsed ? "w-20 px-3" : "w-64 px-4"
            }`}
            style={{ zIndex: 20 }}
          >
            <div className="relative flex h-full flex-col overflow-hidden rounded-[32px] border border-white/15 bg-white/15 px-3 py-4 backdrop-blur-3xl shadow-[0_24px_70px_rgba(0,0,0,0.55)] ring-1 ring-white/10">
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/20 via-white/5 to-transparent" />
              <div className="relative flex items-center rounded-2xl border border-white/10 bg-white/10 px-3 py-2 overflow-visible">
              <div
                className={`text-[12px] font-black tracking-[0.4em] text-white ${
                  isSidebarCollapsed ? "opacity-0" : "opacity-100"
                }`}
              >
                BEYOND
              </div>
              <button
                type="button"
                onClick={() => setIsSidebarCollapsed((prev) => !prev)}
                className="absolute right-2 top-1/2 z-10 inline-flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full border border-white/20 bg-white/15 text-white/90 hover:bg-white/30"
              >
                {isSidebarCollapsed ? "›" : "‹"}
              </button>
            </div>
            <div className="mt-6 flex flex-col gap-2 text-[13px] text-white/70">
              {navItems.map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  className={`flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left transition ${
                    pathname === item.href
                      ? "bg-white/20 text-white shadow-[0_10px_30px_rgba(0,0,0,0.35)]"
                      : "hover:bg-white/15"
                  }`}
                >
                  <item.icon className="h-4 w-4 text-white/60" />
                  <span className={`${isSidebarCollapsed ? "hidden" : "block"}`}>{item.label}</span>
                </Link>
              ))}
            </div>
            </div>
          </aside>

          <main
            className="flex-1 overflow-y-auto px-6 py-10 lg:px-12"
          >
            <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="text-[12px] uppercase tracking-[0.3em] text-white/50">Carrière</div>
              <h1 className="mt-2 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
                {fullName}
              </h1>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                {[
                  { label: "Comportemental", done: testStatus.comportemental },
                  { label: "IDMC", done: testStatus.idmc },
                  { label: "Soft Skills", done: testStatus.softSkills },
                ].map((item) => (
                  <span
                    key={item.label}
                    className={`rounded-full border px-3 py-1 text-[11px] font-semibold ${
                      item.done
                        ? "border-emerald-300/40 bg-emerald-300/15 text-emerald-200"
                        : "border-white/15 bg-white/5 text-white/60"
                    }`}
                  >
                    {item.label} · {item.done ? "Réalisé" : "En attente"}
                  </span>
                ))}
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={handleEditToggle}
                  className="inline-flex rounded-full border border-white/20 bg-white/5 px-4 py-2 text-xs font-semibold text-white/80 backdrop-blur hover:border-white/50 hover:text-white"
                >
                  {isEditing ? "Fermer l'édition" : "Modifier mon profil"}
                </button>
                <button
                  type="button"
                  onClick={handleShareProfile}
                  className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-semibold text-white/80 backdrop-blur hover:border-white/50 hover:text-white"
                >
                  <Share2 className="h-3.5 w-3.5" />
                  Partager mon profil
                </button>
              </div>
            </div>

            <div className="flex flex-col gap-12">
              <div className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
                <div className="flex items-center justify-between gap-3">
                  <div className="text-[12px] uppercase tracking-[0.3em] text-white/60">Jauge de profil</div>
                  <button
                    type="button"
                    onClick={() => setIsProfileGaugeExpanded((prev) => !prev)}
                    className="inline-flex items-center gap-1 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-[11px] text-white/70"
                  >
                    {isProfileGaugeExpanded ? "Réduire" : "Détails"}
                    {isProfileGaugeExpanded ? (
                      <ChevronUp className="h-3.5 w-3.5" />
                    ) : (
                      <ChevronDown className="h-3.5 w-3.5" />
                    )}
                  </button>
                </div>
                <div className="mt-3 flex items-end justify-between gap-4">
                  <div className="text-3xl font-extrabold text-white">{profileCompletion.score}%</div>
                  <div className="text-xs font-semibold text-emerald-200">{profileCompletion.level}</div>
                </div>
                <div className="mt-3 h-2 w-full rounded-full bg-white/10">
                  <div
                    className="h-2 rounded-full bg-emerald-300 transition-all"
                    style={{ width: `${profileCompletion.score}%` }}
                  />
                </div>
                {isProfileGaugeExpanded ? (
                  <div className="mt-4 grid gap-2 text-[11px] text-white/70 sm:grid-cols-2">
                    {profileCompletion.checklist.map((item) => (
                      <div key={item.key} className="flex items-center justify-between gap-3">
                        <span>{item.label}</span>
                        <span className={item.done ? "text-emerald-200" : "text-white/50"}>
                          {item.done ? `+${item.weight}` : "0"}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : null}
              </div>
              <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
                <div className="absolute inset-0">
                  <div className="h-full w-full bg-[url('/images/road.jpg')] bg-cover bg-center opacity-20" />
                  <div className="absolute inset-0 bg-gradient-to-r from-[#0B0D12] via-[#0B0D12]/80 to-transparent" />
                </div>
                <div className="relative flex flex-col gap-6 md:flex-row md:items-center">
                  <label className="group relative h-24 w-24 cursor-pointer overflow-hidden rounded-full border border-white/20 bg-white/10 backdrop-blur">
                    {profile?.avatar_url ? (
                      <div
                        className="h-full w-full bg-cover bg-center"
                        style={{ backgroundImage: `url('${profile.avatar_url}')` }}
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-3xl font-semibold text-white/80">
                        {(String(profile?.first_name ?? "").charAt(0) || "U").toUpperCase()}
                      </div>
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      disabled={isUploadingAvatar}
                      onChange={(event) => {
                        const file = event.target.files?.[0];
                        if (file) handleAvatarUpload(file);
                      }}
                    />
                    <span className="pointer-events-none absolute inset-0 flex items-center justify-center text-[10px] uppercase tracking-[0.3em] text-white/0 transition group-hover:text-white/70">
                      {isUploadingAvatar ? "Upload..." : "Modifier"}
                    </span>
                  </label>
                  <div className="flex-1">
                    <div className="text-xs uppercase tracking-[0.3em] text-white/50">
                      {profileTitle}
                    </div>
                    <div className="mt-2 text-2xl font-semibold text-white">{fullName}</div>
                    <div className="mt-3 space-y-6">
                      <div>
                        <div className="text-xs uppercase tracking-[0.3em] text-white/50">
                          Identité & Bio
                        </div>
                        <div className="mt-2 grid gap-2 text-sm text-white/70 sm:grid-cols-2 lg:grid-cols-4">
                          <div>Âge : {age}</div>
                          <div>Ville : {String(profile?.city ?? "").trim() || "—"}</div>
                          <div>Email : {email}</div>
                          <div>Téléphone : {String(profile?.telephone ?? "—")}</div>
                          <div>ID apprenant : {learnerIdentifier}</div>
                        </div>
                      </div>

                      <div>
                        <div className="text-xs uppercase tracking-[0.3em] text-white/50">Situation</div>
                        {profileDetails.length ? (
                          <div className="mt-2 grid gap-2 text-sm text-white/70 sm:grid-cols-2">
                            {profileDetails.map((item) => (
                              <div key={item.label}>
                                <span className="text-white/50">{item.label} :</span> {item.value}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="mt-2 text-sm text-white/60">—</div>
                        )}
                        {profileType === "freelance" && expertiseChips.length ? (
                          <div className="mt-3 flex flex-wrap gap-2">
                            {expertiseChips.map((item) => (
                              <span
                                key={item}
                                className="rounded-full border border-slate-200 bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700"
                              >
                                {item}
                              </span>
                            ))}
                          </div>
                        ) : null}
                      </div>


                    </div>
                    {hasNewPresentation ? (
                      <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs text-white/80">
                        Une nouvelle présentation vous attend ✨
                      </div>
                    ) : null}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
                <div
                  id="idmc-bilan"
                  className="z-10 w-full rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl"
                >
                  <div className="text-xs uppercase tracking-[0.3em] text-white/50">IDMC</div>
                  {idmcData && idmcAxes ? (
                    <div className="mt-4 space-y-4">
                      <div className="h-[400px] w-full">
                        <IdmcRadarChart scores={idmcAxes} title="Radar IDMC" responsive />
                      </div>
                      {idmcGlobalScore !== null && idmcInterpretation ? (
                        <div className="flex flex-wrap items-center gap-4 rounded-2xl border border-white/10 bg-black/30 px-4 py-3">
                          <div
                            className="relative h-20 w-20 rounded-full"
                            style={{
                              background: `conic-gradient(#F59E0B ${Math.round(
                                idmcGlobalScore
                              )}%, rgba(255,255,255,0.08) ${Math.round(idmcGlobalScore)}% 100%)`,
                            }}
                          >
                            <div className="absolute inset-2 rounded-full bg-slate-950/90 flex items-center justify-center">
                              <span className="text-lg font-semibold text-white">
                                {idmcGlobalScore.toFixed(2)}%
                              </span>
                            </div>
                          </div>
                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="rounded-full bg-emerald-300/20 px-3 py-1 text-xs font-semibold text-emerald-200">
                                {idmcInterpretation.label}
                              </span>
                              <span className="text-xs text-white/60">{idmcInterpretation.detail}</span>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="text-sm text-white/70">Score global indisponible.</div>
                      )}
                    </div>
                  ) : (
                    <div className="mt-4 text-sm text-white/70">
                      Aucun score IDMC pour le moment.
                    </div>
                  )}
                </div>

                <div className="w-full rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur">
                  <div className="text-xs uppercase tracking-[0.3em] text-white/50">
                    Analyse de profil
                  </div>
                  <p className="mt-4 text-sm leading-relaxed text-white/80">{presentation}</p>
                  <button
                    type="button"
                    onClick={handleRegenerateBio}
                    disabled={isRegeneratingBio}
                    className="mt-4 inline-flex rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-semibold text-white/80"
                  >
                    {isRegeneratingBio ? "Génération..." : "Régénérer ma présentation"}
                  </button>
                </div>
              </div>

              <div className="mt-8 flex flex-col gap-6 lg:flex-row">
                <div
                  id="disc-bilan"
                  className="w-full lg:w-1/2 rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl"
                >
                <div className="text-xs uppercase tracking-[0.3em] text-white/50">Test comportemental</div>
                  {discScores ? (
                    <div className="mt-4 space-y-3 text-sm text-white/70">
                      <div>Profil comportemental : {discDominant ?? "—"}</div>
                      <div className="grid grid-cols-2 gap-2">
                        {(["D", "I", "S", "C"] as const).map((key) => (
                          <div key={key} className="rounded-2xl border border-white/10 bg-white/5 p-3">
                            <div className="text-xs text-white/50">Score {key}</div>
                            <div className="mt-1 text-lg font-semibold text-white">
                              {Math.min(Math.round((discScores[key] ?? 0) * 10), 100)}%
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="mt-4 text-sm text-white/60">
                      Complétez le test comportemental pour enrichir votre profil.
                    </div>
                  )}
                </div>
                <div className="w-full lg:w-1/2 rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
                  <div className="text-xs uppercase tracking-[0.3em] text-white/50">
                    Hard Skills & Stack
                  </div>
                  {parsedTools.length ? (
                    <div className="mt-4 flex flex-wrap items-center gap-3">
                      {parsedTools.map((tool) => (
                        <div
                          key={tool}
                          className="flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs text-white/80"
                        >
                          {resolveToolLogo(tool) ? (
                            <img
                              src={resolveToolLogo(tool) ?? ""}
                              alt={tool}
                              className="h-4 w-4 rounded-sm object-contain shadow-[0_0_6px_rgba(255,255,255,0.25)]"
                            />
                          ) : (
                            <span className="h-4 w-4 rounded-sm bg-white/10" />
                          )}
                          {tool}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="mt-4 text-sm text-white/60">Stack technique non renseignée.</div>
                  )}
                  {skillEntries.length ? (
                    <div className="mt-4 flex flex-wrap gap-2">
                      {[...certifiedSkills, ...nonValidatedSkills].map((skill) => (
                        <span
                          key={`${skill.name}-disc`}
                          className={
                            skill.validated
                              ? "inline-flex items-center gap-2 rounded-full border border-yellow-300/40 bg-yellow-300/10 px-3 py-1 text-xs font-semibold text-yellow-200 shadow-[0_0_18px_rgba(250,204,21,0.35)]"
                              : "inline-flex items-center gap-2 rounded-full border border-amber-400/40 bg-amber-500/10 px-3 py-1 text-xs font-semibold text-amber-200"
                          }
                        >
                          {skill.validated ? "✅" : "⚠️"}
                          {skill.name} ({skill.level})
                        </span>
                      ))}
                    </div>
                  ) : (
                    <div className="mt-4 text-sm text-white/60">Aucune compétence ajoutée.</div>
                  )}
                </div>
              </div>

              <div
                id="soft-skills-bilan"
                className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl"
              >
                <div className="text-xs uppercase tracking-[0.3em] text-white/50">
                  {profile?.first_name
                    ? `Top 5 des Soft Skills de ${profile.first_name}`
                    : "Top 5 des Soft Skills"}
                </div>
                {softSkillsTop.length ? (
                  <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
                    {[...softSkillsTop].map((item) => (
                      <div
                        key={item.skill}
                        className="rounded-2xl border border-emerald-300/20 bg-emerald-300/10 p-4 text-center"
                      >
                        <div className="text-sm font-semibold text-white">{item.skill}</div>
                        <div className="mt-3 text-2xl font-semibold text-emerald-200">
                          {softSkillsTopMax
                            ? `${((item.score / softSkillsTopMax) * 10).toFixed(1)}/10`
                            : "—"}
                        </div>
                        <div className="mt-3 h-1.5 w-full rounded-full bg-white/10">
                          <div
                            className="h-1.5 rounded-full bg-emerald-300"
                            style={{
                              width: `${
                                softSkillsTopMax ? (item.score / softSkillsTopMax) * 100 : 0
                              }%`,
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="mt-4 text-sm text-white/60">
                    Aucun score soft skills disponible.
                  </div>
                )}
              </div>

              <div className="space-y-4">
                <div className="text-xs uppercase tracking-[0.3em] text-white/50">
                  Parcours
                </div>
                <div className="grid gap-6 lg:grid-cols-2">
                  <div className="rounded-3xl border border-white/10 bg-gray-800/40 p-6 backdrop-blur-xl">
                    <div className="flex items-center gap-2 text-sm font-semibold text-white">
                      <Briefcase className="h-4 w-4 text-white/70" />
                      Expériences Pro
                    </div>
                    {experiencesPro?.length ? (
                      <div className="mt-5 space-y-6 border-l border-emerald-400/40 pl-6">
                        {(experiencesPro ?? []).map((exp) => {
                          const missions = String(exp.missions ?? "")
                            .split("\n")
                            .map((item) => item.trim())
                            .filter(Boolean);
                          return (
                            <div
                              key={exp.id ?? `${exp.employeur}-${exp.date_debut}`}
                              className="relative rounded-2xl border border-white/10 bg-gray-800/40 p-4 backdrop-blur"
                            >
                              <span className="absolute -left-[9px] top-4 h-3 w-3 rounded-full bg-emerald-300/80" />
                              <div className="flex items-start justify-between gap-3">
                                <div className="flex items-center gap-3">
                                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-white/15 bg-white/10 text-white/80">
                                    <Building2 className="h-5 w-5" />
                                  </div>
                                  <div>
                                    <div className="text-sm font-semibold text-white">
                                      {exp.employeur || "Entreprise"}
                                    </div>
                                    <div className="mt-1 text-xs text-white/60">
                                      {exp.type_contrat || "Contrat"} ·{" "}
                                      {formatRange(exp.date_debut, exp.date_fin)}
                                    </div>
                                  </div>
                                </div>
                              </div>
                              {missions.length ? (
                                <ul className="mt-3 list-disc space-y-1 pl-4 text-xs text-white/70">
                                  {missions.map((mission, index) => (
                                    <li key={`${exp.id}-mission-${index}`}>{mission}</li>
                                  ))}
                                </ul>
                              ) : null}
                            </div>
                          );
                        })}
                      </div>
                    ) : null}
                  </div>

                  <div className="rounded-3xl border border-white/10 bg-gray-800/40 p-6 backdrop-blur-xl">
                    <div className="flex items-center gap-2 text-sm font-semibold text-white">
                      <GraduationCap className="h-4 w-4 text-white/70" />
                      Diplômes & formations
                    </div>
                    {diplomes?.length ? (
                      <div className="mt-5 space-y-5 border-l border-emerald-400/40 pl-6">
                        {(diplomes ?? []).map((dip) => (
                          <div
                            key={dip.id ?? `${dip.intitule}-${dip.ecole}`}
                            className="relative rounded-2xl border border-white/10 bg-gray-800/40 p-4 backdrop-blur"
                          >
                            <span className="absolute -left-[9px] top-4 h-3 w-3 rounded-full bg-emerald-300/80" />
                            <div className="text-sm font-semibold text-white">
                              {dip.intitule || "Diplôme"}
                            </div>
                            <div className="mt-1 text-xs text-white/60">
                              {dip.ecole || "École"} · {dip.annee_obtention ?? "—"}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : null}
                  </div>
                </div>
              </div>

              {hasRecommendations ? (
                <div className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
                  <div className="text-xs uppercase tracking-[0.3em] text-white/50">
                    {profileType === "alternance" ? "Recommandations" : "Avis Clients"}
                  </div>
                  <div className="mt-4 space-y-4 text-sm text-white/70">
                    {reviews.map((review, index) => (
                      <div key={`${review.name}-${index}`} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                        <div className="flex items-center justify-between text-xs text-white/60">
                          <span>{review.name}</span>
                          <span>{review.date}</span>
                        </div>
                        <div className="mt-2 text-white">{review.comment}</div>
                        <div className="mt-2 text-xs text-emerald-200">
                          {"★".repeat(review.rating).padEnd(5, "☆")}
                        </div>
                      </div>
                    ))}
                  </div>
                  <button
                    type="button"
                    className="mt-4 inline-flex rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-semibold text-white/80"
                  >
                    Laisser un avis
                  </button>
                </div>
              ) : null}

            </div>
          </main>
        </div>
      </div>

      {isEditing ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-6">
          <div className="w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-3xl border border-white/10 bg-white/5 p-6 text-white backdrop-blur-xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-xs uppercase tracking-[0.3em] text-white/60">
                  Modifier le profil
                </div>
                <p className="mt-2 text-sm text-white/70">
                  Mettez à jour vos informations personnelles et professionnelles.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="rounded-full border border-white/20 px-4 py-2 text-xs font-semibold text-white/70"
              >
                Fermer
              </button>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <label className="text-xs text-white/70">
                Prénom
                <input
                  type="text"
                  value={editableProfile.first_name}
                  onChange={(event) => handleProfileFieldChange("first_name", event.target.value)}
                  className="mt-2 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white outline-none"
                />
              </label>
              <label className="text-xs text-white/70">
                Nom
                <input
                  type="text"
                  value={editableProfile.last_name}
                  onChange={(event) => handleProfileFieldChange("last_name", event.target.value)}
                  className="mt-2 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white outline-none"
                />
              </label>
              <label className="text-xs text-white/70">
                Âge
                <input
                  type="number"
                  value={editableProfile.age}
                  onChange={(event) => handleProfileFieldChange("age", event.target.value)}
                  className="mt-2 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white outline-none"
                />
              </label>
              <label className="text-xs text-white/70">
                Ville
                <input
                  type="text"
                  value={editableProfile.city}
                  onChange={(event) => handleProfileFieldChange("city", event.target.value)}
                  className="mt-2 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white outline-none"
                />
              </label>
              <label className="text-xs text-white/70">
                Téléphone
                <input
                  type="tel"
                  value={editableProfile.phone}
                  onChange={(event) => handleProfileFieldChange("phone", event.target.value)}
                  className="mt-2 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white outline-none"
                />
              </label>
            </div>

            <div className="mt-4">
              <label className="text-xs text-white/70">
                Bio
                <textarea
                  value={editableProfile.bio}
                  onChange={(event) => handleProfileFieldChange("bio", event.target.value)}
                  className="mt-2 min-h-[110px] w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white outline-none"
                />
              </label>
            </div>

            {profileType === "freelance" ? (
              <div className="mt-6 grid gap-4 md:grid-cols-2">
                <label className="text-xs text-white/70">
                  TJM
                  <input
                    type="number"
                    value={editableProfile.tjm}
                    onChange={(event) => handleProfileFieldChange("tjm", event.target.value)}
                    className="mt-2 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white outline-none"
                  />
                </label>
                <label className="text-xs text-white/70">
                  Expertise
                  <input
                    type="text"
                    value={editableProfile.expertise}
                    onChange={(event) => handleProfileFieldChange("expertise", event.target.value)}
                    className="mt-2 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white outline-none"
                  />
                </label>
                <label className="text-xs text-white/70">
                  Ancienneté freelance
                  <input
                    type="text"
                    value={editableProfile.anciennete_freelance}
                    onChange={(event) =>
                      handleProfileFieldChange("anciennete_freelance", event.target.value)
                    }
                    className="mt-2 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white outline-none"
                  />
                </label>
                <label className="text-xs text-white/70">
                  Disponibilité
                  <div className="mt-2 flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={editableProfile.disponibilite}
                      onChange={(event) =>
                        handleProfileFieldChange("disponibilite", event.target.checked)
                      }
                      className="h-4 w-4 rounded border-white/20 bg-white/10"
                    />
                    <span className="text-sm text-white/70">
                      {editableProfile.disponibilite ? "Disponible" : "Non disponible"}
                    </span>
                  </div>
                </label>
              </div>
            ) : null}

            {profileType === "emploi" ? (
              <div className="mt-6 grid gap-4 md:grid-cols-2">
                <label className="text-xs text-white/70">
                  Poste actuel
                  <input
                    type="text"
                    value={editableProfile.poste_actuel}
                    onChange={(event) => handleProfileFieldChange("poste_actuel", event.target.value)}
                    className="mt-2 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white outline-none"
                  />
                </label>
                <label className="text-xs text-white/70">
                  Entreprise
                  <input
                    type="text"
                    value={editableProfile.entreprise}
                    onChange={(event) => handleProfileFieldChange("entreprise", event.target.value)}
                    className="mt-2 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white outline-none"
                  />
                </label>
                <label className="text-xs text-white/70">
                  Type de contrat
                  <select
                    value={editableProfile.type_contrat}
                    onChange={(event) => handleProfileFieldChange("type_contrat", event.target.value)}
                    className="mt-2 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white outline-none"
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

            {profileType === "alternance" ? (
              <div className="mt-6 grid gap-4 md:grid-cols-2">
                <div className="md:col-span-2">
                  <div className="text-xs text-white/70">As-tu déjà une école ?</div>
                  <div className="mt-2 flex items-center gap-3 text-sm text-white/70">
                    <label className="inline-flex items-center gap-2">
                      <input
                        type="radio"
                        name="has-school"
                        checked={hasSchool === true}
                        onChange={() => {
                          setHasSchool(true);
                        }}
                      />
                      Oui
                    </label>
                    <label className="inline-flex items-center gap-2">
                      <input
                        type="radio"
                        name="has-school"
                        checked={hasSchool === false}
                        onChange={() => {
                          setHasSchool(false);
                          handleProfileFieldChange("ecole", "");
                        }}
                      />
                      Non
                    </label>
                  </div>
                </div>
                {hasSchool !== false ? (
                <label className="text-xs text-white/70">
                  École
                  <input
                    type="text"
                    value={editableProfile.ecole}
                    onChange={(event) => handleProfileFieldChange("ecole", event.target.value)}
                    className="mt-2 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white outline-none"
                  />
                </label>
                ) : null}
                <label className="text-xs text-white/70">
                  Entreprise d'accueil
                  <input
                    type="text"
                    value={editableProfile.entreprise}
                    onChange={(event) => handleProfileFieldChange("entreprise", event.target.value)}
                    className="mt-2 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white outline-none"
                  />
                </label>
                <label className="text-xs text-white/70">
                  Rythme alternance
                  <select
                    value={editableProfile.rythme_alternance}
                    onChange={(event) =>
                      handleProfileFieldChange("rythme_alternance", event.target.value)
                    }
                    className="mt-2 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white outline-none"
                  >
                    <option value="">Sélectionner</option>
                    <option value="1 jour école / 4 jours entreprise">
                      1 jour école / 4 jours entreprise
                    </option>
                    <option value="2 jours école / 3 jours entreprise">
                      2 jours école / 3 jours entreprise
                    </option>
                    <option value="1 semaine école / 2 semaines entreprise">
                      1 semaine école / 2 semaines entreprise
                    </option>
                    <option value="1 semaine école / 3 semaines entreprise">
                      1 semaine école / 3 semaines entreprise
                    </option>
                    <option value="Autre">Autre</option>
                  </select>
                </label>
                <label className="text-xs text-white/70">
                  Date de fin de contrat
                  <input
                    type="date"
                    value={editableProfile.date_fin_contrat}
                    onChange={(event) =>
                      handleProfileFieldChange("date_fin_contrat", event.target.value)
                    }
                    className="mt-2 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white outline-none"
                  />
                </label>
              </div>
            ) : null}

            {profileType === "reconversion" ? (
              <div className="mt-6 grid gap-4 md:grid-cols-2">
                <label className="text-xs text-white/70">
                  Ancien métier
                  <input
                    type="text"
                    value={editableProfile.ancien_metier}
                    onChange={(event) =>
                      handleProfileFieldChange("ancien_metier", event.target.value)
                    }
                    className="mt-2 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white outline-none"
                  />
                </label>
                <label className="text-xs text-white/70">
                  Métier visé
                  <input
                    type="text"
                    value={editableProfile.metier_vise}
                    onChange={(event) =>
                      handleProfileFieldChange("metier_vise", event.target.value)
                    }
                    className="mt-2 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white outline-none"
                  />
                </label>
                <label className="text-xs text-white/70">
                  Échéance
                  <input
                    type="text"
                    value={editableProfile.echeance}
                    onChange={(event) => handleProfileFieldChange("echeance", event.target.value)}
                    className="mt-2 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white outline-none"
                  />
                </label>
              </div>
            ) : null}

            <div className="mt-6">
              <div className="flex items-center justify-between gap-3">
                <div className="text-xs uppercase tracking-[0.3em] text-white/50">
                  Ma Stack Technique
                </div>
                <button
                  type="button"
                  onClick={() => openAddModal("stack")}
                  className="inline-flex items-center gap-1 rounded-full border border-white/20 bg-white/5 px-3 py-1 text-xs font-semibold text-white/75"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Ajouter
                </button>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {selectedTools.length ? (
                  selectedTools.map((tool) => (
                    <button
                      key={tool}
                      type="button"
                      onClick={() => setSelectedTools((prev) => prev.filter((item) => item !== tool))}
                      className="rounded-full border border-emerald-300/50 bg-emerald-300/20 px-3 py-1 text-xs font-semibold text-emerald-100"
                    >
                      {tool} ×
                    </button>
                  ))
                ) : (
                  <div className="text-xs text-white/55">Aucune stack sélectionnée pour le moment.</div>
                )}
              </div>
            </div>
            <div className="mt-6">
              <div className="flex items-center justify-between gap-3">
                <div className="text-xs uppercase tracking-[0.3em] text-white/50">
                  Mes Compétences
                </div>
                <button
                  type="button"
                  onClick={() => openAddModal("skill")}
                  className="inline-flex items-center gap-1 rounded-full border border-white/20 bg-white/5 px-3 py-1 text-xs font-semibold text-white/75"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Ajouter
                </button>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {selectedSkills.length ? (
                  selectedSkills.map((skill) => (
                    <button
                      key={skill}
                      type="button"
                      onClick={() => {
                        setSelectedSkills((prev) => prev.filter((item) => item !== skill));
                        setEditableSkillsMetadata((prev) => {
                          const next = { ...prev };
                          delete next[skill];
                          return next;
                        });
                      }}
                      className="rounded-full border border-sky-300/50 bg-sky-300/20 px-3 py-1 text-xs font-semibold text-sky-100"
                    >
                      {skill}
                      {editableSkillsMetadata[skill]?.level ? ` · ${editableSkillsMetadata[skill].level}` : ""}
                      {editableSkillsMetadata[skill]?.validated ? " ✓" : ""}
                      {" ×"}
                    </button>
                  ))
                ) : (
                  <div className="text-xs text-white/55">Aucune compétence sélectionnée pour le moment.</div>
                )}
              </div>
            </div>

            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={handleSaveProfile}
                disabled={isSaving}
                className="rounded-full bg-white/80 px-4 py-2 text-xs font-semibold text-black"
              >
                {isSaving ? "Sauvegarde..." : "Enregistrer"}
              </button>
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="rounded-full border border-white/20 px-4 py-2 text-xs font-semibold text-white/70"
              >
                Annuler
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {showAddModal ? (
        <div className="fixed inset-0 z-[130] flex items-center justify-center bg-black/75 px-4">
          <div className="w-full max-w-5xl overflow-hidden rounded-3xl border border-white/10 bg-[#0D111A] text-white shadow-2xl">
            <div className="border-b border-white/10 px-6 py-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="text-xs uppercase tracking-[0.3em] text-white/50">
                    {addModalType === "stack" ? "Ajouter une stack" : "Ajouter une compétence"}
                  </div>
                  <div className="mt-1 text-lg font-semibold text-white">
                    {addModalType === "stack" ? "Stack technique" : "Compétences métier"}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    value={catalogSearch}
                    onChange={(event) => setCatalogSearch(event.target.value)}
                    placeholder={`Rechercher ${addModalType === "stack" ? "une stack..." : "une compétence..."}`}
                    className="w-72 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddModal(false);
                      setPendingSkillForLevel(null);
                    }}
                    className="rounded-full border border-white/20 px-4 py-2 text-xs font-semibold text-white/75"
                  >
                    Fermer
                  </button>
                </div>
              </div>
            </div>

            <div className="grid min-h-[430px] grid-cols-[260px_1fr]">
              <aside className="border-r border-white/10 bg-white/[0.03] p-4">
                <div className="space-y-2">
                  {catalogCategories.map((category) => {
                    const active = catalogCategory === category;
                    return (
                      <button
                        key={category}
                        type="button"
                        onClick={() => setCatalogCategory(category)}
                        className={`w-full rounded-xl px-3 py-2 text-left text-sm transition ${
                          active ? "bg-white/15 text-white" : "text-white/65 hover:bg-white/10 hover:text-white"
                        }`}
                      >
                        {category}
                      </button>
                    );
                  })}
                </div>
              </aside>

              <div className="p-4">
                <div className="max-h-[360px] space-y-2 overflow-y-auto pr-1">
                  {catalogItems.map((item) => {
                    const selected = addModalType === "stack" ? selectedTools.includes(item) : selectedSkills.includes(item);
                    const logo = resolveToolLogo(item);
                    return (
                      <button
                        key={item}
                        type="button"
                        onClick={() => {
                          if (addModalType === "stack") {
                            setSelectedTools((prev) =>
                              prev.includes(item) ? prev.filter((tool) => tool !== item) : [...prev, item]
                            );
                            return;
                          }
                          setPendingSkillForLevel(item);
                          setPendingSkillProof(Boolean(editableSkillsMetadata[item]?.validated));
                        }}
                        className={`flex w-full items-center justify-between rounded-xl border px-3 py-2 text-left ${
                          selected
                            ? "border-emerald-300/40 bg-emerald-300/10"
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
                        <span className="text-xs text-white/55">
                          {addModalType === "stack"
                            ? selected
                              ? "Ajouté"
                              : "Ajouter"
                            : selected
                              ? "Configurer"
                              : "Sélectionner"}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {addModalType === "skill" && pendingSkillForLevel ? (
                  <div className="mt-4 rounded-xl border border-white/10 bg-white/[0.03] p-4">
                    <div className="text-sm text-white/80">
                      Niveau pour <strong>{pendingSkillForLevel}</strong>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {(["Débutant", "Intermédiaire", "Expert"] as const).map((level) => (
                        <button
                          key={level}
                          type="button"
                          onClick={() => {
                            setSelectedSkills((prev) =>
                              prev.includes(pendingSkillForLevel) ? prev : [...prev, pendingSkillForLevel]
                            );
                            setEditableSkillsMetadata((prev) => ({
                              ...prev,
                              [pendingSkillForLevel]: {
                                level,
                                validated: pendingSkillProof,
                                source: pendingSkillProof ? "badge" : "manual",
                              },
                            }));
                            setPendingSkillForLevel(null);
                          }}
                          className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold text-white"
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
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {showQualificationModal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-6">
          <div className="w-full max-w-xl rounded-3xl border border-white/10 bg-white/5 p-6 text-white backdrop-blur-xl">
            <h2 className="text-lg font-semibold">Compléter mon profil</h2>
            <p className="mt-2 text-sm text-white/70">
              Complétez ces informations pour terminer votre qualification.
            </p>
            <div className="mt-6 grid gap-4">
              <input
                value={qualificationForm.first_name}
                onChange={(event) =>
                  setQualificationForm((prev) => ({ ...prev, first_name: event.target.value }))
                }
                placeholder="Prénom"
                className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white"
              />
              <input
                value={qualificationForm.last_name}
                onChange={(event) =>
                  setQualificationForm((prev) => ({ ...prev, last_name: event.target.value }))
                }
                placeholder="Nom"
                className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white"
              />
              <input
                value={qualificationForm.city}
                onChange={(event) =>
                  setQualificationForm((prev) => ({ ...prev, city: event.target.value }))
                }
                placeholder="Ville"
                className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white"
              />
              <input
                value={qualificationForm.telephone}
                onChange={(event) =>
                  setQualificationForm((prev) => ({ ...prev, telephone: event.target.value }))
                }
                placeholder="Téléphone"
                className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white"
              />
              <input
                type="date"
                value={qualificationForm.birth_date}
                onChange={(event) =>
                  setQualificationForm((prev) => ({ ...prev, birth_date: event.target.value }))
                }
                className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white"
              />
              {String((profile as Record<string, unknown> | null)?.type_profil ?? "") ===
              "freelance" ? (
                <>
                  <input
                    value={qualificationForm.tjm}
                    onChange={(event) =>
                      setQualificationForm((prev) => ({ ...prev, tjm: event.target.value }))
                    }
                    placeholder="TJM"
                    className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white"
                  />
                  <input
                    value={qualificationForm.expertise}
                    onChange={(event) =>
                      setQualificationForm((prev) => ({ ...prev, expertise: event.target.value }))
                    }
                    placeholder="Expertise (tags)"
                    className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white"
                  />
                  <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white">
                    <span className="text-white/70">Disponibilité</span>
                    <button
                      type="button"
                      onClick={() => setQualificationForm((prev) => ({ ...prev, disponibilite: "Oui" }))}
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${
                        qualificationForm.disponibilite === "Oui"
                          ? "bg-emerald-400/25 text-emerald-200"
                          : "bg-white/5 text-white/65"
                      }`}
                    >
                      Oui
                    </button>
                    <button
                      type="button"
                      onClick={() => setQualificationForm((prev) => ({ ...prev, disponibilite: "Non" }))}
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${
                        qualificationForm.disponibilite === "Non"
                          ? "bg-rose-400/25 text-rose-200"
                          : "bg-white/5 text-white/65"
                      }`}
                    >
                      Non
                    </button>
                  </div>
                </>
              ) : null}
              {String((profile as Record<string, unknown> | null)?.type_profil ?? "") ===
              "emploi" ? (
                <>
                  <input
                    value={qualificationForm.poste_actuel}
                    onChange={(event) =>
                      setQualificationForm((prev) => ({ ...prev, poste_actuel: event.target.value }))
                    }
                    placeholder="Poste actuel"
                    className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white"
                  />
                  <input
                    value={qualificationForm.entreprise}
                    onChange={(event) =>
                      setQualificationForm((prev) => ({ ...prev, entreprise: event.target.value }))
                    }
                    placeholder="Entreprise"
                    className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white"
                  />
                  <select
                    value={qualificationForm.type_contrat}
                    onChange={(event) =>
                      setQualificationForm((prev) => ({ ...prev, type_contrat: event.target.value }))
                    }
                    className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white"
                  >
                    <option value="">Type de contrat</option>
                    <option value="CDI">CDI</option>
                    <option value="CDD">CDD</option>
                    <option value="Alternance">Alternance</option>
                    <option value="Freelance">Freelance</option>
                    <option value="Interim">Intérim</option>
                  </select>
                </>
              ) : null}
              {String((profile as Record<string, unknown> | null)?.type_profil ?? "") ===
              "reconversion" ? (
                <>
                  <input
                    value={qualificationForm.ancien_metier}
                    onChange={(event) =>
                      setQualificationForm((prev) => ({ ...prev, ancien_metier: event.target.value }))
                    }
                    placeholder="Ancien métier"
                    className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white"
                  />
                  <input
                    value={qualificationForm.metier_vise}
                    onChange={(event) =>
                      setQualificationForm((prev) => ({ ...prev, metier_vise: event.target.value }))
                    }
                    placeholder="Métier visé"
                    className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white"
                  />
                  <input
                    value={qualificationForm.organisme_formation}
                    onChange={(event) =>
                      setQualificationForm((prev) => ({
                        ...prev,
                        organisme_formation: event.target.value,
                      }))
                    }
                    placeholder="Organisme de formation"
                    className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white"
                  />
                  <input
                    type="date"
                    value={qualificationForm.echeance}
                    onChange={(event) =>
                      setQualificationForm((prev) => ({ ...prev, echeance: event.target.value }))
                    }
                    className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white"
                  />
                </>
              ) : null}
              {String((profile as Record<string, unknown> | null)?.type_profil ?? "") ===
              "alternance" ? (
                <>
                  <input
                    value={qualificationForm.ecole}
                    onChange={(event) =>
                      setQualificationForm((prev) => ({ ...prev, ecole: event.target.value }))
                    }
                    placeholder="École"
                    className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white"
                  />
                  <input
                    value={qualificationForm.niveau_etude}
                    onChange={(event) =>
                      setQualificationForm((prev) => ({ ...prev, niveau_etude: event.target.value }))
                    }
                    placeholder="Niveau d'étude"
                    className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white"
                  />
                  <input
                    value={qualificationForm.rythme_alternance}
                    onChange={(event) =>
                      setQualificationForm((prev) => ({
                        ...prev,
                        rythme_alternance: event.target.value,
                      }))
                    }
                    placeholder="Rythme alternance"
                    className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white"
                  />
                  <input
                    type="date"
                    value={qualificationForm.date_fin_contrat}
                    onChange={(event) =>
                      setQualificationForm((prev) => ({
                        ...prev,
                        date_fin_contrat: event.target.value,
                      }))
                    }
                    className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white"
                  />
                </>
              ) : null}
            </div>
            <div className="mt-6 flex flex-col gap-3">
              <button
                type="button"
                onClick={handleQualificationSave}
                disabled={isSavingQualification}
                className="rounded-full bg-[#E50914] px-4 py-3 text-sm font-semibold text-white"
              >
                {isSavingQualification ? "Enregistrement..." : "Enregistrer"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
        </>
      );
  } catch (error) {
    return <div className="p-8 text-white">Erreur de rendu</div>;
  }
}
export default CareerPage;