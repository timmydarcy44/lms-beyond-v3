"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import {
  BadgeCheck,
  Download,
  ExternalLink,
  Lock,
  Mail,
  Share2,
  User,
} from "lucide-react";
import { toast } from "sonner";
import { AxisKey, IdmcRadarChart, resolveIdmcAxes } from "@/components/idmc/IdmcRadarChart";

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
  show_idmc: false,
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


const fadeUp = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  transition: { duration: 0.5 },
  viewport: { once: true, amount: 0.2 },
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
  const publicUrl = `https://getbeyond.fr/p/${slug}`;

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
    alternance: "Profil en alternance",
    freelance: "Profil freelance",
    emploi: "Profil en poste",
    reconversion: "Profil en reconversion",
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
  const softSkillsMax = softSkillsAll.length
    ? Math.max(...softSkillsAll.map((item) => item.value))
    : 0;
  const softSkillsTopMax = softSkillsTop.length
    ? Math.max(...softSkillsTop.map((item) => item.value))
    : 0;
  const idmcGlobalScore = idmcAxes
    ? Math.round(
        (Object.values(idmcAxes).reduce((sum, value) => sum + value, 0) /
          Object.values(idmcAxes).length)
      )
    : null;
  const idmcInterpretation = idmcGlobalScore !== null
    ? idmcGlobalScore < 40
      ? { label: "Maîtrise à construire", detail: "Accompagnement ciblé recommandé." }
      : idmcGlobalScore < 60
        ? { label: "Maîtrise en développement", detail: "Axes de progrès identifiables." }
        : idmcGlobalScore < 80
          ? { label: "Maîtrise opérationnelle", detail: "Stratégies efficaces." }
          : { label: "Maîtrise experte", detail: "Profil apprenant solide." }
    : null;

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
    if (aiSummary || !profileData) return;
    const stored = String((profileData as Record<string, unknown>).bio_ai ?? "").trim();
    if (stored) return;
    generatePublicSummary(false);
  }, [aiSummary, profileData]);


  const handleCopyLink = () => {
    navigator.clipboard?.writeText(publicUrl);
    toast.success("Lien copié !");
  };

  const handleContact = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    toast.success("Merci ! Votre message a été envoyé.");
  };


  return (
    <div
      className="public-profile min-h-screen font-['Inter']"
      data-theme={appliedSettings.theme}
      style={
        {
          "--accent": appliedSettings.accent_color,
          "--border": appliedSettings.theme === "light" ? "#E5E7EB" : "#2A2A2A",
        } as React.CSSProperties
      }
    >
      <style jsx global>{`
        @import url("https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&display=swap");

        .public-profile {
          background: #0b0f1a;
          color: #ffffff;
        }
        .public-profile[data-theme="light"] {
          background: #0b0f1a;
          color: #ffffff;
        }
        .public-profile .card {
          background: #1c1c1c;
          border-color: #2a2a2a;
        }
        .public-profile[data-theme="light"] .card {
          background: #1c1c1c;
          border-color: #2a2a2a;
        }
        .public-profile .card-muted {
          background: #121212;
          border-color: #2a2a2a;
        }
        .public-profile[data-theme="light"] .card-muted {
          background: #121212;
          border-color: #2a2a2a;
        }
        .public-profile .text-muted {
          color: #9ca3af;
        }
        .public-profile[data-theme="light"] .text-muted {
          color: #475569;
        }
        .public-profile .accent {
          color: var(--accent);
        }
        .public-profile .accent-bg {
          background: var(--accent);
          color: #111827;
        }
        .public-profile .accent-border {
          border-color: var(--accent);
        }
      `}</style>

      <div className="mx-auto w-full max-w-[1200px] px-6 py-10">
        <motion.header {...fadeUp} className="card relative overflow-hidden rounded-[26px] border">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[color:var(--border)] px-6 py-4">
            {appliedSettings.show_logo && (
              <div className="flex flex-col">
                <div className="text-[12px] font-black tracking-[0.3em]">BEYOND</div>
                <div className="text-[10px] font-semibold accent">Profil certifié Beyond ✓</div>
              </div>
            )}
            <div className="flex flex-wrap items-center gap-2 text-[12px]">
              <button
                onClick={handleCopyLink}
                className="inline-flex items-center gap-2 rounded-full border border-[color:var(--border)] px-4 py-2 text-muted"
              >
                <Share2 className="h-4 w-4" /> Copier le lien public
              </button>
              <a
                href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(publicUrl)}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-full border border-[color:var(--border)] px-4 py-2 text-muted"
              >
                <ExternalLink className="h-4 w-4" /> Partager sur LinkedIn
              </a>
              <a
                href={`mailto:?subject=Profil Beyond&body=${encodeURIComponent(publicUrl)}`}
                className="inline-flex items-center gap-2 rounded-full border border-[color:var(--border)] px-4 py-2 text-muted"
              >
                <Mail className="h-4 w-4" /> Envoyer par email
              </a>
              <button className="inline-flex items-center gap-2 rounded-full border border-[color:var(--border)] px-4 py-2 text-muted">
                <Download className="h-4 w-4" /> Télécharger le profil PDF
              </button>
            </div>
          </div>
          <div className="relative h-[220px]">
            <img src={profile.cover} alt="Cover" className="h-full w-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/30 to-transparent" />
          </div>
          <div className="px-6 pb-6 pt-4">
            <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
              <div className="flex items-center gap-4">
                {displayAvatar ? (
                  <img
                    src={displayAvatar}
                    alt={displayName}
                    className="h-20 w-20 rounded-full border border-[color:var(--border)] object-cover"
                  />
                ) : (
                  <div className="flex h-20 w-20 flex-col items-center justify-center rounded-full border border-[color:var(--border)] bg-white/10 text-[10px] font-semibold uppercase tracking-[0.3em] text-white/70">
                    <User className="h-5 w-5 text-white/70" />
                    User
                  </div>
                )}
                <div className="md:mx-auto md:text-left">
                  <h1 className="text-[26px] font-extrabold">
                    {displayName}
                    {profileData?.age ? ` · ${profileData.age} ans` : ""}
                    {displayTjm ? (
                      <span className="ml-3 inline-flex items-center rounded-full border border-emerald-300/40 bg-emerald-300/15 px-3 py-1 align-middle text-[12px] font-semibold text-emerald-200">
                        TJM {displayTjm}
                      </span>
                    ) : null}
                  </h1>
                  <p className="text-[14px] text-muted">{displayTitle}</p>
                  {expertiseChips.length ? (
                    <div className="mt-3 flex flex-wrap justify-start gap-2">
                      {expertiseChips.slice(0, 4).map((chip) => (
                        <span
                          key={chip}
                          className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-[11px] font-semibold text-white/85"
                        >
                          {getToolLogoForLabel(chip) ? (
                            <img
                              src={String(getToolLogoForLabel(chip))}
                              alt={chip}
                              className="h-3.5 w-3.5 rounded-sm object-contain"
                            />
                          ) : null}
                          {chip}
                        </span>
                      ))}
                      {expertiseChips.length > 4 ? (
                        <span className="rounded-full border border-white/15 bg-white/5 px-3 py-1 text-[11px] font-semibold text-white/70">
                          ...
                        </span>
                      ) : null}
                    </div>
                  ) : null}
                </div>
              </div>
              <div className="text-[12px] font-semibold uppercase tracking-[0.2em] text-white/60">
                Profil certifie
              </div>
            </div>

          </div>
        </motion.header>

        <div className="mt-10 grid gap-8 lg:grid-cols-[1.6fr_0.8fr]">
          <div className="space-y-8">
            <motion.section {...fadeUp} className="card rounded-[24px] border p-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="text-xs uppercase tracking-[0.3em] text-white/50">Présentation (IA)</div>
                <button
                  type="button"
                  onClick={() => generatePublicSummary(true)}
                  className="inline-flex items-center rounded-full border border-white/20 bg-white/5 px-3 py-1 text-[11px] font-semibold text-white/80 hover:border-white/50 hover:text-white"
                >
                  Régénérer
                </button>
              </div>
              {isLoadingSummary ? (
                <div className="mt-4 text-sm text-white/60">Génération en cours...</div>
              ) : aiSummary ? (
                <p className="mt-4 text-sm leading-relaxed text-white/80">{aiSummary}</p>
              ) : (
                <div className="mt-4 text-sm text-white/60">
                  Présentation IA indisponible pour le moment.
                </div>
              )}
            </motion.section>

            <motion.section {...fadeUp} className="card rounded-[24px] border p-6">
              <div className="text-xs uppercase tracking-[0.3em] text-white/50">IDMC</div>
              {idmcAxes ? (
                <div className="mt-4 space-y-4">
                  <div className="h-[360px] w-full">
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
                        <div className="absolute inset-2 flex items-center justify-center rounded-full bg-slate-950/90">
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
                <div className="mt-4 text-sm text-white/70">En attente de test IDMC.</div>
              )}
            </motion.section>

            <motion.section {...fadeUp} className="card rounded-[24px] border p-6">
              <div className="text-xs uppercase tracking-[0.3em] text-white/50">Test comportemental</div>
              {discScores.length ? (
                <div className="mt-4 space-y-3 text-sm text-white/70">
                  <div className="grid grid-cols-2 gap-2">
                    {(["D", "I", "S", "C"] as const).map((key) => {
                      const item = discScores.find((entry) => entry.label === key);
                      return (
                        <div key={key} className="rounded-2xl border border-white/10 bg-white/5 p-3">
                          <div className="text-xs text-white/50">Score {key}</div>
                          <div className="mt-1 text-lg font-semibold text-white">
                            {Math.min(Math.round((item?.value ?? 0) * 10), 100)}%
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="mt-4 text-sm text-white/60">
                  Complétez le test comportemental pour enrichir votre profil.
                </div>
              )}
            </motion.section>

            <motion.section {...fadeUp} className="card rounded-[24px] border p-6">
              <div className="text-xs uppercase tracking-[0.3em] text-white/50">Top 5 Soft Skills</div>
              {softSkillsTop.length ? (
                <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
                  {[...softSkillsTop].map((item) => (
                    <div
                      key={item.label}
                      className="rounded-2xl border border-emerald-300/20 bg-emerald-300/10 p-4 text-center"
                    >
                      <div className="text-sm font-semibold text-white">{item.label}</div>
                      <div className="mt-3 text-2xl font-semibold text-emerald-200">
                        {softSkillsTopMax
                          ? `${((item.value / softSkillsTopMax) * 10).toFixed(1)}/10`
                          : "—"}
                      </div>
                      <div className="mt-3 h-1.5 w-full rounded-full bg-white/10">
                        <div
                          className="h-1.5 rounded-full bg-emerald-300"
                          style={{
                            width: `${softSkillsTopMax ? (item.value / softSkillsTopMax) * 100 : 0}%`,
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="mt-4 text-sm text-white/60">
                  Complétez les Soft Skills pour enrichir votre profil.
                </div>
              )}
            </motion.section>

          </div>

          <div className="space-y-6">
            <motion.section {...fadeUp} className="card rounded-[24px] border p-6">
              <div className="text-xs uppercase tracking-[0.3em] text-white/50">
                Coordonnées
              </div>
              <div className="relative mt-4 rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-white/70">
                <div className="space-y-2 blur-sm select-none">
                  <div>email@exemple.com</div>
                  <div>+33 6 12 34 56 78</div>
                  <div>Ville, Pays</div>
                </div>
                <div className="absolute inset-0 flex items-center justify-center gap-2 text-xs font-semibold text-white/80">
                  <Lock className="h-4 w-4" />
                  S'inscrire pour améliorer le matching
                </div>
              </div>
            </motion.section>

            <motion.aside
              {...fadeUp}
              id="contact"
              className="card h-fit rounded-[24px] border p-6"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-[16px] font-bold">Je suis recruteur</h3>
                <div className="text-[11px] text-muted">127 vues · 3 téléchargements</div>
              </div>
              <div className="mt-2 text-[12px] text-muted">
                Découvrez notre système de matching.
              </div>
              <div className="card-muted mt-3 inline-flex items-center gap-2 rounded-full border px-3 py-2 text-[11px] text-muted">
                <BadgeCheck className="h-4 w-4 accent" /> Profil vérifié par Beyond
              </div>
              <div className="mt-4 flex flex-col gap-2">
                <Link
                  href="/signup"
                  className="accent-bg inline-flex w-full items-center justify-center rounded-full px-4 py-2 text-[12px] font-semibold"
                >
                  Créer un compte
                </Link>
                <Link
                  href="/login"
                  className="inline-flex w-full items-center justify-center rounded-full border border-[color:var(--border)] px-4 py-2 text-[12px] font-semibold text-white transition hover:bg-white/10"
                >
                  Me connecter
                </Link>
              </div>
            </motion.aside>

            <motion.section {...fadeUp} className="card rounded-[24px] border p-6">
              <div className="flex items-center justify-between">
                <h2 className="text-[18px] font-extrabold">Hard Skills & Stack technique</h2>
                <span className="text-[11px] text-muted">Skills metadata Beyond</span>
              </div>
              {stackTools.length ? (
                <div className="mt-4 flex flex-wrap items-center gap-3">
                  {stackTools.map((tool) => (
                    <div
                      key={tool}
                      className="flex items-center gap-2 rounded-full border border-[color:var(--border)] px-3 py-2 text-[12px]"
                    >
                      {TOOL_LOGOS[tool] ? (
                        <img
                          src={TOOL_LOGOS[tool]}
                          alt={tool}
                          className="h-4 w-4 rounded-sm object-contain shadow-[0_0_6px_rgba(255,255,255,0.25)]"
                        />
                      ) : (
                        <span className="h-4 w-4 rounded-sm bg-white/10" />
                      )}
                      <span>{tool}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="mt-4 text-[12px] text-muted">Stack technique non renseignée.</div>
              )}
              <div className="mt-6 flex flex-wrap gap-3">
                {hardSkillEntries.length ? (
                  hardSkillEntries.map((skill) => (
                  <div
                    key={skill.name}
                    title={skill.validated ? "Validé par Beyond" : "Non validé par Beyond"}
                    className={
                      skill.validated
                        ? "flex items-center gap-2 rounded-full border border-yellow-300/40 bg-yellow-300/10 px-4 py-2 text-[12px] font-semibold text-yellow-200 shadow-[0_0_18px_rgba(250,204,21,0.35)]"
                        : "flex items-center gap-2 rounded-full border border-amber-400/40 bg-amber-500/10 px-4 py-2 text-[12px] font-semibold text-amber-200"
                    }
                  >
                      {skill.validated ? "✅" : "⚠️"}
                      {skill.name} ({skill.level})
                    </div>
                  ))
                ) : (
                  <div className="text-[12px] text-muted">Aucune compétence certifiée pour le moment.</div>
                )}
              </div>
            </motion.section>
          </div>
        </div>

        <motion.section {...fadeUp} className="mt-10">
          <div className="card rounded-[24px] border p-6">
            <h2 className="text-[18px] font-extrabold">Parcours & Expérience</h2>
            <div className="mt-4 space-y-4">
              {experiences.length ? (
                experiences.map((exp) => (
                  <div key={`${exp.title}-${exp.company}`} className="card-muted rounded-[16px] border p-4 text-[12px]">
                    <div className="text-muted">
                      {exp.start} - {exp.end}
                    </div>
                    <div className="text-[14px] font-semibold">{exp.title}</div>
                    <div className="text-muted">{exp.company}</div>
                    {exp.missions ? <div className="mt-2 text-muted">{exp.missions}</div> : null}
                  </div>
                ))
              ) : (
                <div className="text-[12px] text-muted">Aucune expérience renseignée.</div>
              )}
            </div>
            <div className="mt-6 space-y-3">
              {diplomas.length ? (
                diplomas.map((dip) => (
                  <div key={`${dip.title}-${dip.school}`} className="card-muted rounded-[16px] border p-4 text-[12px]">
                    <div className="text-muted">
                      {dip.start} - {dip.end}
                    </div>
                    <div className="text-[14px] font-semibold">{dip.title}</div>
                    <div className="text-muted">{dip.school}</div>
                    <div className="mt-2 text-muted">{dip.status}</div>
                  </div>
                ))
              ) : (
                <div className="text-[12px] text-muted">Aucun diplôme renseigné.</div>
              )}
            </div>
          </div>
        </motion.section>

        <motion.footer {...fadeUp} className="mt-10" />
      </div>

    </div>
  );
}

