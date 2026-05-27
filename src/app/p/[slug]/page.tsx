"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { AxisKey, resolveIdmcAxes } from "@/components/idmc/IdmcRadarChart";
import { EdgePublicProfileView } from "@/components/public-profile/edge-public-profile-view";
import type { DiscScores } from "@/components/apprenant/apprenant-assessment-results";

type ProfilePublic = {
  name: string;
  birthDate: string;
  title: string;
  avatar: string;
  cover: string;
  heroStats: { label: string; value: string }[];
  videoUrl?: string | null;
  badges: Array<{ title: string; image: string; description: string }>;
  testimonial: { quote: string; author: string; role: string };
  matching?: { score: number; reasons: string[] } | null;
  experiences: Array<{ start: string; end: string; title: string; company: string; missions: string }>;
  diplomas: Array<{ start: string; end: string; title: string; school: string; status: string }>;
  softSkills: Array<{ label: string; value: number }>;
  disc: Array<{ label: string; value: number }>;
};

type ProfileSettings = {
  theme: "dark" | "light";
  accent_color: string;
  show_logo: boolean;
  show_disc: boolean;
  show_soft_skills: boolean;
  show_badges: boolean;
  show_idmc: boolean;
  show_dys: boolean;
};

const DEFAULT_SETTINGS: ProfileSettings = {
  theme: "dark",
  accent_color: "#F97316",
  show_logo: true,
  show_disc: true,
  show_soft_skills: true,
  show_badges: true,
  show_idmc: true,
  show_dys: false,
};

const DEFAULT_PROFILE: ProfilePublic = {
  name: "Profil Beyond",
  birthDate: "01/01/2004",
  title: "Profil en alternance",
  avatar:
    "https://images.unsplash.com/photo-1544723795-3fb6469f5b39?auto=format&fit=crop&q=80&w=300",
  cover:
    "https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=1600&q=80",
  heroStats: [
    { label: "Analyse & Rigueur", value: "60%" },
    { label: "Score S (Test comportemental)", value: "70" },
    { label: "Badges certifiés", value: "1" },
  ],
  videoUrl: null,
  badges: [],
  testimonial: {
    quote: "Apprenant rigoureux et engagé, avec une forte motivation.",
    author: "Référent CFA",
    role: "Responsable pédagogique",
  },
  matching: null,
  experiences: [],
  diplomas: [],
  softSkills: [],
  disc: [
    { label: "D", value: 50 },
    { label: "I", value: 50 },
    { label: "S", value: 50 },
    { label: "C", value: 50 },
  ],
};

const TOOL_LOGOS: Record<string, string> = {
  Notion: "https://upload.wikimedia.org/wikipedia/commons/4/45/Notion_app_logo.png",
  Wordpress: "https://upload.wikimedia.org/wikipedia/commons/2/20/WordPress_logo.svg",
  Cursor: "https://avatars.githubusercontent.com/u/157243072?s=200&v=4",
  Zapier: "https://upload.wikimedia.org/wikipedia/commons/7/75/Zapier_logo.svg",
  "n8n": "https://upload.wikimedia.org/wikipedia/commons/5/5a/N8n-logo-new.svg",
  Webflow: "https://upload.wikimedia.org/wikipedia/commons/3/3b/Webflow_logo.svg",
};

const getToolLogoForLabel = (label: string) => {
  const normalized = label.trim().toLowerCase();
  const match = Object.entries(TOOL_LOGOS).find(([key]) => key.toLowerCase() === normalized);
  return match?.[1] ?? null;
};

const PLACEHOLDER_IDENTITIES = new Set([
  "john wick",
  "johan wick",
  "john doe",
  "jane doe",
  "test user",
  "profil beyond",
]);

const normalizeIdentity = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

const isPlaceholderIdentity = (value: string) =>
  Boolean(value.trim()) && PLACEHOLDER_IDENTITIES.has(normalizeIdentity(value));

function computeAgeFromBirthDate(birthDate: string): number | null {
  if (!birthDate) return null;
  const date = new Date(birthDate);
  if (Number.isNaN(date.getTime())) return null;
  const now = new Date();
  let age = now.getFullYear() - date.getFullYear();
  const monthDiff = now.getMonth() - date.getMonth();
  const dayDiff = now.getDate() - date.getDate();
  if (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)) age -= 1;
  return age >= 0 ? age : null;
}

function parseCorrelatedAnalysis(raw: unknown): string | null {
  if (!raw) return null;
  if (typeof raw === "string") {
    const trimmed = raw.trim();
    if (!trimmed) return null;
    try {
      const parsed = JSON.parse(trimmed) as { text?: string };
      if (parsed && typeof parsed.text === "string" && parsed.text.trim()) {
        return parsed.text.trim();
      }
    } catch {
      return trimmed;
    }
    return trimmed;
  }
  return null;
}

const slugToDisplayName = (value: string) => {
  const parts = value.split("-").filter(Boolean);
  if (!parts.length) return "";
  if (parts.length === 1) {
    const only = parts[0];
    return only ? `${only.charAt(0).toUpperCase()}${only.slice(1).toLowerCase()}` : "";
  }
  const first = parts.slice(0, -1).join(" ");
  const last = parts[parts.length - 1];
  const firstFormatted = first
    .split(" ")
    .filter(Boolean)
    .map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1).toLowerCase()}`)
    .join(" ");
  return `${firstFormatted} ${last.toUpperCase()}`.trim();
};


export default function PublicProfilePage({ params }: { params: { slug: string } }) {
  const resolvedParams =
    typeof (params as { then?: unknown }).then === "function"
      ? React.use(params as unknown as Promise<{ slug: string }>)
      : params;
  const slug = resolvedParams.slug;
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(slug);
  const searchParams = useSearchParams();
  const [settings, setSettings] = useState<ProfileSettings>(DEFAULT_SETTINGS);
  const [profileData, setProfileData] = useState<Record<string, unknown> | null>(null);
  const [skillsMetadata, setSkillsMetadata] = useState<
    Record<string, { level: "Débutant" | "Intermédiaire" | "Expert"; validated: boolean; source: "manual" | "badge" }>
  >({});
  const [hardSkills, setHardSkills] = useState<string[]>([]);
  const [stackTools, setStackTools] = useState<string[]>([]);
  const [softSkillsTop, setSoftSkillsTop] = useState<Array<{ label: string; value: number }>>([]);
  const [softSkillsAll, setSoftSkillsAll] = useState<Array<{ label: string; value: number }>>([]);
  const [discScores, setDiscScores] = useState<Array<{ label: string; value: number }>>([]);
  const [idmcAxes, setIdmcAxes] = useState<Record<AxisKey, number> | null>(null);
  const [experiences, setExperiences] = useState<
    Array<{ start: string; end: string; title: string; company: string; missions: string }>
  >([]);
  const [diplomas, setDiplomas] = useState<
    Array<{ start: string; end: string; title: string; school: string; status: string }>
  >([]);
  const [publicUserId, setPublicUserId] = useState<string | null>(null);
  const [aiSummary, setAiSummary] = useState<string>("");
  const [isLoadingSummary, setIsLoadingSummary] = useState(false);

  const profile = useMemo(() => DEFAULT_PROFILE, []);
  const publicUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/p/${slug}`
      : `https://edgebs.fr/p/${slug}`;

  const extractIdmcAxes = useCallback((value: unknown): Record<AxisKey, number> | null => {
    if (!value || typeof value !== "object") return null;
    const asRecord = value as Record<string, unknown>;
    if (asRecord.axes && typeof asRecord.axes === "object") {
      return asRecord.axes as Record<AxisKey, number>;
    }
    const axisKeys: AxisKey[] = ["A1", "A2", "A3", "A4", "A5", "A6", "A7", "A8"];
    const hasAll = axisKeys.every((key) => typeof asRecord[key] === "number");
    if (hasAll) {
      return axisKeys.reduce<Record<AxisKey, number>>((acc, key) => {
        acc[key] = Number(asRecord[key]);
        return acc;
      }, {} as Record<AxisKey, number>);
    }
    return null;
  }, []);

  const fetchPublicProfile = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      params.set("slug", slug);
      const userId = searchParams.get("userId");
      if (userId) params.set("userId", userId);
      const response = await fetch(`/api/public-profile?${params.toString()}`, {
        cache: "no-store",
      });
      if (response.status === 404) {
        setPublicUserId(null);
        setProfileData(null);
        setSkillsMetadata({});
        setHardSkills([]);
        setStackTools([]);
        setDiscScores([]);
        setIdmcAxes(null);
        setSoftSkillsAll([]);
        setSoftSkillsTop([]);
        setExperiences([]);
        setDiplomas([]);
        return;
      }
      if (!response.ok) {
        return;
      }
      const data = (await response.json()) as {
        publicUserId: string | null;
        profileRow: Record<string, unknown> | null;
        settings?: ProfileSettings;
        skillsMetadata: Record<string, { level: "Débutant" | "Intermédiaire" | "Expert"; validated: boolean; source: "manual" | "badge" }>;
        hardSkills: string[];
        stackTools: string[];
        discScores: Array<{ label: string; value: number }>;
        idmcAxes?: Record<AxisKey, number> | null;
        idmcScores?: Record<string, unknown> | null;
        idmcResponses?: Record<string, unknown> | null;
        softSkillsAll: Array<{ label: string; value: number }>;
        experiences: Array<{ start: string; end: string; title: string; company: string; missions: string }>;
        diplomas: Array<{ start: string; end: string; title: string; school: string; status: string }>;
      };
      const resolvedId =
        data?.publicUserId ??
        (data.profileRow && typeof (data.profileRow as { id?: string }).id === "string"
          ? (data.profileRow as { id?: string }).id
          : null);
      if (!resolvedId) return;
      setPublicUserId(resolvedId);
      setProfileData(data.profileRow ?? null);
      setSkillsMetadata(data.skillsMetadata);
      setHardSkills(data.hardSkills);
      setStackTools(data.stackTools);
      setDiscScores(data.discScores);
      let rawScores = data.idmcScores ?? null;
      let rawResponses = data.idmcResponses ?? null;
      if (typeof rawScores === "string") {
        try {
          rawScores = JSON.parse(rawScores) as Record<string, unknown>;
        } catch {
          rawScores = null;
        }
      }
      if (typeof rawResponses === "string") {
        try {
          rawResponses = JSON.parse(rawResponses) as Record<string, unknown>;
        } catch {
          rawResponses = null;
        }
      }
      let axes: Record<AxisKey, number> | null = null;
      axes = extractIdmcAxes(rawScores) || extractIdmcAxes(rawResponses);
      if (!axes) {
        axes = resolveIdmcAxes(rawScores ?? rawResponses);
      }
      setIdmcAxes(axes);
      setSoftSkillsAll(data.softSkillsAll);
      setSoftSkillsTop(
        [...data.softSkillsAll].sort((a, b) => b.value - a.value).slice(0, 5),
      );
      setExperiences(data.experiences);
      setDiplomas(data.diplomas);
      if (data.settings) {
        setSettings((prev) => ({
          ...prev,
          ...data.settings,
          theme: data.settings?.theme === "light" ? "light" : "dark",
        }));
      }
    } catch {
      // Keep the public page stable even when API is temporarily unavailable.
    }
  }, [searchParams, slug, extractIdmcAxes]);

  useEffect(() => {
    fetchPublicProfile();
  }, [fetchPublicProfile]);


  const settingsOverrides = useMemo(() => {
    const overrides: Partial<ProfileSettings> = {};
    const theme = searchParams.get("theme");
    const accent = searchParams.get("accent");
    const showLogo = searchParams.get("show_logo");
    const showDisc = searchParams.get("show_disc");
    const showSoft = searchParams.get("show_soft_skills");
    const showBadges = searchParams.get("show_badges");
    const showIdmc = searchParams.get("show_idmc");
    const showDys = searchParams.get("show_dys");

    if (theme === "light" || theme === "dark") overrides.theme = theme;
    if (accent) overrides.accent_color = accent;
    if (showLogo !== null) overrides.show_logo = showLogo === "1";
    if (showDisc !== null) overrides.show_disc = showDisc === "1";
    if (showSoft !== null) overrides.show_soft_skills = showSoft === "1";
    if (showBadges !== null) overrides.show_badges = showBadges === "1";
    if (showIdmc !== null) overrides.show_idmc = showIdmc === "1";
    if (showDys !== null) overrides.show_dys = showDys === "1";

    return overrides;
  }, [searchParams]);

  const appliedSettings = useMemo(
    () => ({ ...settings, ...settingsOverrides }),
    [settings, settingsOverrides],
  );

  const fallbackDisplayNameFromSlug = useMemo(() => {
    const value = slugToDisplayName(slug);
    return value && !isPlaceholderIdentity(value) ? value : "Profil public";
  }, [slug]);

  const displayName = profileData
    ? (() => {
        const first = String(profileData.first_name ?? "").trim();
        const last = String(profileData.last_name ?? "").trim();
        const fullName = String(profileData.full_name ?? "").trim();
        const firstLast = `${first} ${last}`.trim();
        const hasPlaceholderFirstLast = isPlaceholderIdentity(firstLast);
        const hasPlaceholderFullName = isPlaceholderIdentity(fullName);

        if ((first || last) && !hasPlaceholderFirstLast) {
          return `${first} ${last.toUpperCase()}`.trim();
        }

        if (fullName && !hasPlaceholderFullName) {
          const parts = fullName.split(/\s+/).filter(Boolean);
          if (parts.length >= 2) {
            const firstPart = parts.slice(0, -1).join(" ");
            const lastPart = parts[parts.length - 1].toUpperCase();
            return `${firstPart} ${lastPart}`.trim();
          }
          return fullName;
        }
        const email = String(profileData.email ?? "").trim();
        if (email) {
          const local = email.split("@")[0] ?? "";
          const parts = local.split(/[._-]+/).filter(Boolean);
          if (parts.length) {
            const formatted = parts
              .map((part, idx) => (idx === parts.length - 1 ? part.toUpperCase() : part))
              .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
              .join(" ");
            return formatted.trim() || profile.name;
          }
        }
        const fromSlug = slugToDisplayName(slug);
        if (fromSlug && !isPlaceholderIdentity(fromSlug)) {
          return fromSlug;
        }
        return "Profil public";
      })()
    : fallbackDisplayNameFromSlug;
  const profileTypeLabel = {
    alternance: "En alternance",
    recherche_alternance: "En recherche d'alternance",
    freelance: "Freelance",
    emploi: "En poste",
    reconversion: "En reconversion",
  } as Record<string, string>;
  const displayTitle = profileData
    ? profileTypeLabel[String(profileData.type_profil ?? "").toLowerCase()] ??
      String(profileData.type_profil ?? "Profil en alternance")
    : profile.title;
  const isFreelanceProfile =
    String(profileData?.type_profil ?? "")
      .trim()
      .toLowerCase() === "freelance";
  const displayTjm = useMemo(() => {
    if (!isFreelanceProfile || !profileData) return "";
    const raw = String((profileData as Record<string, unknown>).tjm ?? "")
      .trim()
      .replace(",", ".");
    if (!raw) return "";
    const numeric = Number(raw.replace(/[^\d.]/g, ""));
    if (Number.isFinite(numeric) && numeric > 0) {
      return `${Math.round(numeric)} EUR/jour`;
    }
    return raw;
  }, [isFreelanceProfile, profileData]);
  const expertiseChips = useMemo(() => {
    if (!isFreelanceProfile || !profileData) return [] as string[];
    const raw = (profileData as Record<string, unknown>).expertise;
    const values = Array.isArray(raw)
      ? raw.map((item) => String(item).trim())
      : String(raw ?? "")
          .split(/[,\n;|]/)
          .map((item) => item.trim());
    return values.filter(Boolean);
  }, [isFreelanceProfile, profileData]);
  const displayAvatar = profileData?.avatar_url ? String(profileData.avatar_url) : "";
  const hardSkillEntries = (hardSkills.length ? hardSkills : Object.keys(skillsMetadata))
    .map((skill) => ({
      name: skill,
      ...(skillsMetadata[skill] ?? { level: "Débutant", validated: false, source: "manual" }),
    }))
    .sort((a, b) => Number(b.validated) - Number(a.validated));
  useEffect(() => {
    if (!profileData) return;
    const stored = String((profileData as Record<string, unknown>).bio_ai ?? "").trim();
    const firstName = String((profileData as Record<string, unknown>).first_name ?? "").trim();
    const lastName = String((profileData as Record<string, unknown>).last_name ?? "").trim();
    const fullName = String((profileData as Record<string, unknown>).full_name ?? "").trim();
    const hasPlaceholderName =
      isPlaceholderIdentity(`${firstName} ${lastName}`.trim()) || isPlaceholderIdentity(fullName);
    const placeholderMentionRegex = /\b(john|johan)\s+wick\b/i;
    if (hasPlaceholderName || placeholderMentionRegex.test(stored)) {
      setAiSummary("");
      setIsLoadingSummary(false);
      return;
    }
    if (stored) {
      setAiSummary(stored);
      setIsLoadingSummary(false);
    }
  }, [profileData]);

  const generatePublicSummary = (force = false) => {
    if (!profileData || !publicUserId) return;
    const certifiedSkills = hardSkillEntries.filter((item) => item.validated).map((item) => item.name);
    const discScoresMap = discScores.reduce<Record<string, number>>((acc, item) => {
      acc[item.label] = item.value;
      return acc;
    }, {});
    const payload = {
      userId: publicUserId,
      force,
      firstName: isPlaceholderIdentity(String(profileData.first_name ?? ""))
        ? ""
        : String(profileData.first_name ?? ""),
      lastName: isPlaceholderIdentity(String(profileData.last_name ?? ""))
        ? ""
        : String(profileData.last_name ?? ""),
      experiences: experiences.map((exp) => ({ title: exp.title, company: exp.company })),
      diplomas: diplomas.map((dip) => ({ title: dip.title, school: dip.school })),
      certifiedSkills,
      idmcScore: idmcGlobalScore,
      discScores: discScoresMap,
      softSkillsTop,
    };
    setIsLoadingSummary(true);
    fetch("/api/public-profile-analysis", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data?.analysis) {
          setAiSummary(String(data.analysis));
        }
      })
      .catch(() => {})
      .finally(() => setIsLoadingSummary(false));
  };

  useEffect(() => {
    if (!profileData || !publicUserId) return;
    const stored = String((profileData as Record<string, unknown>).bio_ai ?? "").trim();
    if (stored) return;
    const hasTests =
      discScores.length > 0 || Boolean(idmcAxes) || softSkillsTop.length > 0;
    if (!hasTests) return;
    generatePublicSummary(false);
  }, [profileData, publicUserId, discScores, idmcAxes, softSkillsTop]);


  const handleCopyLink = () => {
    navigator.clipboard?.writeText(publicUrl);
    toast.success("Lien copié !");
  };

  const displayFirstName = profileData
    ? String(profileData.first_name ?? "").trim()
    : "";
  const displayLastName = profileData
    ? String(profileData.last_name ?? "").trim()
    : "";
  const profilePhone = profileData
    ? String(profileData.telephone ?? profileData.phone ?? "").trim()
    : "";
  const profileEmail = profileData ? String(profileData.email ?? "").trim() : "";
  const profileBirthRaw = profileData
    ? String(profileData.birth_date ?? profileData.date_naissance ?? "").trim()
    : "";
  const birthDateLabel = profileBirthRaw
    ? (() => {
        const date = new Date(profileBirthRaw);
        if (Number.isNaN(date.getTime())) return "—";
        const formatted = date.toLocaleDateString("fr-FR");
        const age = computeAgeFromBirthDate(profileBirthRaw);
        return age != null ? `${formatted} (${age} ans)` : formatted;
      })()
    : "—";

  const discScoresObj = useMemo((): DiscScores | null => {
    if (!discScores.length) return null;
    const map: DiscScores = { D: 0, I: 0, S: 0, C: 0 };
    discScores.forEach(({ label, value }) => {
      const key = label as keyof DiscScores;
      if (key in map) map[key] = value;
    });
    return map;
  }, [discScores]);

  const softSkillsRadar = useMemo(
    () =>
      softSkillsAll.map((item) => ({
        skill: item.label,
        score: item.value,
      })),
    [softSkillsAll],
  );

  const correlatedAnalysis = useMemo(() => {
    if (!profileData) return null;
    const fromAiAnalysis = parseCorrelatedAnalysis(
      (profileData as Record<string, unknown>).ai_analysis,
    );
    if (fromAiAnalysis) return fromAiAnalysis;
    return aiSummary || null;
  }, [profileData, aiSummary]);

  return (
    <EdgePublicProfileView
      displayName={displayName}
      displayFirstName={displayFirstName}
      displayLastName={displayLastName}
      displayTitle={displayTitle}
      displayAvatar={displayAvatar}
      phone={profilePhone}
      email={profileEmail}
      birthDateLabel={birthDateLabel}
      presentation={aiSummary}
      isLoadingPresentation={isLoadingSummary}
      onRegeneratePresentation={() => generatePublicSummary(true)}
      discScores={discScoresObj}
      idmcAxes={idmcAxes}
      softSkillsRadar={softSkillsRadar}
      correlatedAnalysis={correlatedAnalysis}
      publicUrl={publicUrl}
      onCopyLink={handleCopyLink}
      experiences={experiences}
      diplomas={diplomas}
      hardSkillEntries={hardSkillEntries.map((skill) => ({
        name: skill.name,
        level: skill.level,
        validated: skill.validated,
      }))}
      stackTools={stackTools}
      toolLogoResolver={getToolLogoForLabel}
    />
  );
}

