"use client";

import { motion } from "framer-motion";
import { useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import { Check, FileText, Sparkles, Star, ShieldCheck } from "lucide-react";
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
} from "recharts";

import type { WalletEarnedBadgeRow } from "@/lib/dashboard/ecole-learner-wallet";

function formatWalletEarnedDate(iso: string): string {
  if (!iso?.trim()) return "—";
  try {
    return new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium", timeZone: "UTC" }).format(new Date(iso));
  } catch {
    return iso.slice(0, 10);
  }
}

function badgeInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

type WalletCardModel = {
  key: string;
  name: string;
  dateLabel: string;
  imageUrl: string | null;
  description: string;
  criteria: string;
  evidenceLabel: string;
  evidenceUrl: string;
  expiration: string;
  hash: string;
  issuer: string;
};

type SchoolStudentProfileProps = {
  profile: {
    id?: string | null;
    first_name?: string | null;
    last_name?: string | null;
    email?: string | null;
    city?: string | null;
    avatar_url?: string | null;
    cv_url?: string | null;
    motivation_letter_url?: string | null;
    rqth_url?: string | null;
    cerfa_url?: string | null;
    bio_ai?: string | null;
    hard_skills?: string[] | null;
    open_badges?: Array<string | { name?: string | null; image_url?: string | null; url?: string | null }> | null;
    soft_skills_scores?: Record<string, number> | null;
    placement_status?: string | null;
    date_of_birth?: string | null;
    has_driving_license_b?: boolean | null;
    cognitive_tests?: {
      mai: {
        global: number;
        declarative: number;
        procedures: number;
        conditional?: number;
        error_management: number;
      };
      stress?: {
        restricted: boolean;
        physical: number;
        management: number;
      };
      dys?: {
        restricted: boolean;
        oral_language: number;
        executive: number;
        motor: number;
      };
    };
  };
  offers: Array<{
    id: string;
    title?: string | null;
    city?: string | null;
    salary?: string | null;
    description?: string | null;
  }>;
  /** Badges issus de `user_badges` (serveur) ; sinon repli sur `profile.open_badges`. */
  walletEarnedBadges?: WalletEarnedBadgeRow[] | null;
  /** Fiche « Mes apprenants » côté école : mise en page plus simple. */
  ecoleStaffSimplified?: boolean;
};

const defaultRadarLabels = ["Leadership", "Organisation", "Communication", "Adaptabilite", "Creativite"];
const demoRadarLabels = ["Empathie", "Resilience", "Leadership", "Negotiation", "Rigueur"];

const PLACEMENT_LABELS: Record<string, string> = {
  initial: "Initial",
  recherche_alternance: "En recherche d'alternance",
  en_alternance: "En alternance",
  en_stage: "En stage",
  contrat_fip: "Contrat FIP",
};

export function SchoolStudentProfile({
  profile,
  offers,
  walletEarnedBadges,
  ecoleStaffSimplified = false,
}: SchoolStudentProfileProps) {
  const rawScores = profile.soft_skills_scores || {};
  const radarLabels = demoRadarLabels.every((label) => label in rawScores) ? demoRadarLabels : defaultRadarLabels;
  const radarData = radarLabels.map((label) => ({
    skill: label,
    value: rawScores[label] || 0,
  }));
  const maxRadar = Math.max(10, ...radarData.map((item) => item.value || 0));
  const badges = Array.isArray(profile.open_badges) ? profile.open_badges : [];
  const hardSkills = Array.isArray(profile.hard_skills) ? profile.hard_skills : [];

  const skillNames = Object.keys(rawScores);
  const mailtoSkills = skillNames.length ? skillNames.slice(0, 6).join(", ") : "Soft skills";
  const sortedSkills = [...radarData].sort((a, b) => b.value - a.value);
  const topFiveSkills = sortedSkills.slice(0, 5);
  const topSkillSet = new Set(sortedSkills.slice(0, 3).map((item) => item.skill));

  const displayName = profile.first_name || "Jean";
  const placementLabel =
    profile.placement_status && PLACEMENT_LABELS[profile.placement_status]
      ? PLACEMENT_LABELS[profile.placement_status]
      : profile.placement_status?.trim() || null;
  const dobDisplay =
    profile.date_of_birth && String(profile.date_of_birth).trim()
      ? (() => {
          try {
            return new Intl.DateTimeFormat("fr-FR", { dateStyle: "long", timeZone: "UTC" }).format(
              new Date(`${String(profile.date_of_birth).slice(0, 10)}T12:00:00Z`),
            );
          } catch {
            return String(profile.date_of_birth).slice(0, 10);
          }
        })()
      : null;
  const permisLabel =
    profile.has_driving_license_b === true ? "Permis B : oui" : profile.has_driving_license_b === false ? "Permis B : non" : null;
  const cognitiveTests = profile.cognitive_tests;
  const mai = cognitiveTests?.mai;
  const stress = cognitiveTests?.stress;
  const dys = cognitiveTests?.dys;
  const fallbackAvatar =
    "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80";
  const stressScore = stress
    ? (stress.physical + Math.max(0, 5 - stress.management)) / 2
    : null;
  const stressLabel =
    typeof stressScore === "number"
      ? stressScore >= 4
        ? "élevé"
        : stressScore >= 2.5
          ? "modéré"
          : "faible"
      : "non renseigné";
  const maiLabel = mai ? (mai.error_management >= 75 ? "élevé" : "solide") : "non renseigné";
  const isValentin = `${profile.first_name || ""} ${profile.last_name || ""}`.toLowerCase().includes("valentin");
  const aiSummary = isValentin
    ? "Profil stable avec une excellente conscience métacognitive (MAI). Vigilance sur la planification des tâches complexes. Gestion du stress optimale (Score 16)."
    : `Synthèse indicative : score MAI ${maiLabel} en gestion de l'erreur et stress académique ${stressLabel} — utile pour ajuster le rythme et le type d'accompagnement.`;
  const adminItems = [
    {
      label: "CV",
      ok: !!profile.cv_url || isValentin,
      fileName: isValentin ? "CV_Valentin.pdf" : null,
    },
    { label: "Cerfa", ok: !!profile.cerfa_url || isValentin, fileName: isValentin ? "Cerfa_Valentin.pdf" : null },
    { label: "Dossier de candidature", ok: !!profile.motivation_letter_url, fileName: null },
    {
      label: "Dossier d'inscription",
      ok: !!profile.rqth_url || isValentin,
      fileName: isValentin ? "Dossier_Inscription.pdf" : null,
    },
  ];
  const adminCompleted = adminItems.filter((item) => item.ok).length;
  const adminPercent = isValentin ? 75 : Math.round((adminCompleted / adminItems.length) * 100);
  const pathname = usePathname();
  const isHandicap = pathname.includes("/handicap");
  const showRestricted = !isHandicap;
  const handicapAccent = isHandicap ? "#D65151" : "#1D1D1F";
  const [appointments, setAppointments] = useState<
    Array<{ id: string; type: string; notes: string; summary?: string }>
  >([]);
  const [newType, setNewType] = useState("Visio");
  const [newNotes, setNewNotes] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [showAdmin, setShowAdmin] = useState(false);
  const [softSkillsOpen, setSoftSkillsOpen] = useState(false);
  const [activeBadge, setActiveBadge] = useState<WalletCardModel | null>(null);
  const [walletShareLink, setWalletShareLink] = useState<string | null>(null);

  const walletList = useMemo((): WalletCardModel[] => {
    const fromDb = (walletEarnedBadges ?? []).map((b, i) => ({
      key: `db-${b.earnedAt}-${i}`,
      name: b.name,
      dateLabel: formatWalletEarnedDate(b.earnedAt),
      imageUrl: b.imageUrl,
      description:
        (b.description && b.description.trim()) ||
        `Compétence ou parcours certifié sur la plateforme : ${b.name}.`,
      criteria: "",
      evidenceLabel: "",
      evidenceUrl: "",
      expiration: "—",
      hash: "—",
      issuer: "Beyond LMS",
    }));
    if (fromDb.length) return fromDb;

    const raw = Array.isArray(profile.open_badges) ? profile.open_badges : [];
    return raw.map((entry, i) => {
      if (typeof entry === "string") {
        const name = entry.trim() || "Badge";
        return {
          key: `ob-str-${i}`,
          name,
          dateLabel: "—",
          imageUrl: null,
          description: `Référence badge enregistrée sur le profil : ${name}.`,
          criteria: "",
          evidenceLabel: "",
          evidenceUrl: "",
          expiration: "—",
          hash: "—",
          issuer: "Profil apprenant",
        };
      }
      const name = (entry && typeof entry === "object" && entry.name && String(entry.name).trim()) || "Badge";
      const url =
        entry && typeof entry === "object" && entry.image_url && String(entry.image_url).trim()
          ? String(entry.image_url).trim()
          : null;
      return {
        key: `ob-obj-${i}`,
        name,
        dateLabel: "—",
        imageUrl: url,
        description: `Open Badge associé au profil : ${name}.`,
        criteria: "",
        evidenceLabel: entry && typeof entry === "object" && entry.url ? "Ouvrir le badge" : "",
        evidenceUrl: entry && typeof entry === "object" && entry.url ? String(entry.url) : "",
        expiration: "—",
        hash: "—",
        issuer: "Profil apprenant",
      };
    });
  }, [walletEarnedBadges, profile.open_badges]);

  const handleShareWallet = () => {
    const token = Math.random().toString(36).slice(2, 10);
    const baseUrl = typeof window !== "undefined" ? window.location.origin : "https://beyond-connect.fr";
    const link = `${baseUrl}/wallet/${token}`;
    setWalletShareLink(link);
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(link).catch(() => undefined);
    }
  };

  const handleAddAppointment = () => {
    if (!newNotes.trim()) return;
    setAppointments((prev) => [
      ...prev,
      { id: `${Date.now()}`, type: newType, notes: newNotes },
    ]);
    setNewNotes("");
    setShowForm(false);
  };

  const handleMagicAI = (id: string) => {
    setAppointments((prev) =>
      prev.map((item) =>
        item.id === id
          ? { ...item, summary: `Synthese IA : ${item.notes.slice(0, 120)}...` }
          : item
      )
    );
  };
  const ProfileAIAnalysis = () => (
    <div className="rounded-2xl border border-[#E5E5EA] bg-white p-6 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#86868B]">
        Synthèse Prédictive Beyond AI ✨
      </p>
      <p className="mt-3 text-sm leading-relaxed text-[#1D1D1F]">
        <Sparkles className="mr-2 inline h-4 w-4 text-[#0071E3]" />
        {aiSummary}
      </p>
    </div>
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className={`grid gap-6 ${ecoleStaffSimplified ? "lg:mx-auto lg:max-w-3xl lg:grid-cols-1" : "lg:grid-cols-3"}`}
    >
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.02 }}
        className={`lg:col-span-3 grid gap-6 rounded-2xl border border-[#E5E5EA] bg-white p-6 shadow-sm ${
          ecoleStaffSimplified ? "grid-cols-1" : "md:grid-cols-[1.2fr_1fr]"
        }`}
      >
        <div>
          <div className="flex items-center gap-6">
            <div className="h-28 w-28 overflow-hidden rounded-full border border-[#E5E5EA] bg-[#F5F5F7] md:h-32 md:w-32">
              <img
                src={profile.avatar_url || fallbackAvatar}
                alt="Avatar"
                className="h-full w-full object-cover"
              />
            </div>
            <div>
              <h1 className="text-3xl font-semibold text-[#1D1D1F]">
                {(profile.first_name || "") + " " + (profile.last_name || "")}
              </h1>
              <p className="text-sm text-[#86868B]">{profile.email || "Email non renseigné"}</p>
              {placementLabel || dobDisplay || permisLabel ? (
                <div className="mt-2 flex flex-wrap gap-2 text-xs text-[#86868B]">
                  {placementLabel ? (
                    <span className="rounded-full bg-[#F5F5F7] px-3 py-1 font-semibold text-[#1D1D1F]">
                      {placementLabel}
                    </span>
                  ) : null}
                  {dobDisplay ? (
                    <span className="rounded-full bg-[#F5F5F7] px-3 py-1 font-medium text-[#1D1D1F]">{dobDisplay}</span>
                  ) : null}
                  {permisLabel ? (
                    <span className="rounded-full bg-[#F5F5F7] px-3 py-1 font-medium text-[#1D1D1F]">{permisLabel}</span>
                  ) : null}
                </div>
              ) : null}
              {!ecoleStaffSimplified ? (
                <span className="mt-2 inline-flex rounded-full bg-[#F5F5F7] px-3 py-1 text-xs font-semibold text-[#1D1D1F]">
                  Profil complété à 85%
                </span>
              ) : null}
            </div>
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-2 sm:gap-3">
            {profile.cv_url ? (
              <a
                href={profile.cv_url}
                className="inline-flex rounded-lg bg-[#1D1D1F] px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-white"
              >
                Télécharger CV
              </a>
            ) : (
              <span className="text-xs text-[#86868B]">CV non fourni</span>
            )}
            {ecoleStaffSimplified ? (
              <a
                href="#wallet-badges-ecole"
                className="rounded-full border border-[#E5E5EA] bg-white px-4 py-2 text-xs font-semibold text-[#1D1D1F]"
              >
                Wallet
              </a>
            ) : (
              <button
                type="button"
                className="rounded-full border border-transparent bg-white px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em]"
                style={{
                  background:
                    "linear-gradient(white, white) padding-box, linear-gradient(90deg, #3b82f6, #8b5cf6) border-box",
                  border: "1px solid transparent",
                }}
              >
                <span className="bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent">
                  Wallet Badges
                </span>
              </button>
            )}
            <button
              type="button"
              onClick={() => setShowAdmin((prev) => !prev)}
              className="rounded-full border border-black/10 bg-white px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-black/70"
            >
              Admin
            </button>
            <a
              href={`/dashboard/ecole/apprenants/${profile.id || "profil"}/suivi`}
              className="rounded-full border border-black/10 bg-white px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-black/70"
            >
              Suivi
            </a>
          </div>
        </div>
        {!ecoleStaffSimplified ? (
        <div className="rounded-2xl border border-[#E5E5EA] bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between text-xs text-[#86868B]">
            <span>Complétion administrative</span>
            <span className="font-semibold text-[#1D1D1F]">{adminPercent}%</span>
          </div>
          <div className="mt-2 h-2 w-full rounded-full bg-[#F5F5F7]">
            <div className="h-2 rounded-full bg-[#1D1D1F]" style={{ width: `${adminPercent}%` }} />
          </div>
          <p className="mt-4 text-xs font-semibold uppercase tracking-[0.2em] text-[#86868B]">+ Administratif</p>
          <div className="mt-4 space-y-3">
            {adminItems.map((item) => (
              <div
                key={item.label}
                className="flex items-center justify-between rounded-xl border border-[#E5E5EA] bg-white px-3 py-2"
              >
                <div>
                  <div className="flex items-center gap-2 text-sm text-[#1D1D1F]">
                    <FileText className="h-4 w-4 text-[#86868B]" />
                    <span>{item.label}</span>
                  </div>
                  {item.fileName ? (
                    <p className="mt-1 text-[11px] text-[#86868B]">{item.fileName}</p>
                  ) : null}
                </div>
                {item.ok ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-[#F5F5F7] px-2 py-1 text-xs font-semibold text-[#0071E3]">
                    <Check className="h-3 w-3" />
                    OK
                  </span>
                ) : (
                  <span className="rounded-full bg-[#F5F5F7] px-2 py-1 text-xs font-semibold text-[#86868B]">
                    À compléter
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
        ) : null}
      </motion.section>

      {!ecoleStaffSimplified ? (
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.05 }}
        className="lg:col-span-3"
      >
        <ProfileAIAnalysis />
      </motion.section>
      ) : null}

      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.06 }}
        className="lg:col-span-3 rounded-2xl border border-[#E5E5EA] bg-white p-6 shadow-sm"
      >
        <p className="text-xs uppercase tracking-[0.2em] text-[#86868B]">Profilage</p>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl border border-[#E5E5EA] bg-white p-4">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-[#1D1D1F]">Test MAI</p>
              <span className="text-xs font-semibold text-[#1D1D1F]">{mai?.global ?? 0}/100</span>
            </div>
            {!mai ? (
              <div className="mt-4 rounded-xl border border-dashed border-[#E5E5EA] bg-[#F5F5F7] px-4 py-3 text-xs text-[#86868B]">
                Test non réalisé.
              </div>
            ) : (
              <div className="mt-4 space-y-3 text-xs text-[#86868B]">
                {[
                  { label: "Connaissances déclaratives", value: mai.declarative ?? 0 },
                  { label: "Procédures", value: mai.procedures ?? 0 },
                  {
                    label: "Savoir conditionnel",
                    value: mai.conditional ?? 0,
                    hint: "Alerte planification (No : division des tâches)",
                  },
                ].map((item) => (
                  <div key={item.label}>
                    <div className="flex items-center justify-between">
                      <span>{item.label}</span>
                      <span className="font-semibold text-[#1D1D1F]">{item.value}/100</span>
                    </div>
                    <div className="mt-2 h-2 w-full rounded-full bg-[#F5F5F7]">
                      <div
                        className="h-2 rounded-full bg-[#1D1D1F]"
                        style={{ width: `${Math.min(100, item.value)}%` }}
                      />
                    </div>
                    {"hint" in item ? (
                      <p className="mt-1 text-[10px] text-[#86868B]">{item.hint}</p>
                    ) : null}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="relative rounded-2xl border border-[#E5E5EA] bg-white p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-[#1D1D1F]">Stress académique</p>
                <p className="text-[11px] text-[#86868B]">Score global: 16/50 · Modéré</p>
              </div>
            </div>
            {!stress ? (
              <div className="mt-4 rounded-xl border border-dashed border-[#E5E5EA] bg-[#F5F5F7] px-4 py-3 text-xs text-[#86868B]">
                Test non réalisé.
              </div>
            ) : (
              <div className="mt-4 space-y-3 text-xs text-[#86868B]">
                {[
                  { label: "Symptômes physiques", value: stress.physical ?? 0 },
                  { label: "Capacité de gestion", value: stress.management ?? 0 },
                ].map((item) => (
                  <div key={item.label}>
                    <div className="flex items-center justify-between">
                      <span>{item.label}</span>
                      <span className="font-semibold text-[#1D1D1F]">{item.value}/5</span>
                    </div>
                    <div className="mt-2 h-2 w-full rounded-full bg-[#F5F5F7]">
                      <div
                        className="h-2 rounded-full"
                        style={{
                          width: `${Math.min(100, (item.value / 5) * 100)}%`,
                          backgroundColor: handicapAccent,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
            {showRestricted ? (
              <>
                <div className="absolute inset-0 rounded-2xl bg-white/60 backdrop-blur-sm" />
                <div className="absolute right-4 top-4 rounded-full border border-[#E5E5EA] bg-white px-2 py-1 text-[10px] font-semibold text-[#1D1D1F]">
                  Accès réservé Référent Handicap
                </div>
              </>
            ) : null}
          </div>

          <div className="relative rounded-2xl border border-[#E5E5EA] bg-white p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-[#1D1D1F]">Pré-diagnostic DYS</p>
                <p className="text-[11px] text-[#86868B]">
                  Alerte: Fonctions exécutives · Concentration: Souvent
                </p>
              </div>
            </div>
            {!dys ? (
              <div className="mt-4 rounded-xl border border-dashed border-[#E5E5EA] bg-[#F5F5F7] px-4 py-3 text-xs text-[#86868B]">
                Test non réalisé.
              </div>
            ) : (
              <div className="mt-4 space-y-3 text-xs text-[#86868B]">
                {[
                  { label: "Langage oral", value: dys.oral_language ?? 0 },
                  { label: "Fonctions exécutives", value: dys.executive ?? 0 },
                  { label: "Motricité", value: dys.motor ?? 0 },
                ].map((item) => (
                  <div key={item.label}>
                    <div className="flex items-center justify-between">
                      <span>{item.label}</span>
                      <span className="font-semibold text-[#1D1D1F]">{item.value}/5</span>
                    </div>
                    <div className="mt-2 h-2 w-full rounded-full bg-[#F5F5F7]">
                      <div
                        className="h-2 rounded-full"
                        style={{
                          width: `${Math.min(100, (item.value / 5) * 100)}%`,
                          backgroundColor: handicapAccent,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
            {showRestricted ? (
              <>
                <div className="absolute inset-0 rounded-2xl bg-white/60 backdrop-blur-sm" />
                <div className="absolute right-4 top-4 rounded-full border border-[#E5E5EA] bg-white px-2 py-1 text-[10px] font-semibold text-[#1D1D1F]">
                  Accès réservé Référent Handicap
                </div>
              </>
            ) : null}
          </div>
        </div>
      </motion.section>

      {showAdmin ? (
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.06 }}
          className="lg:col-span-3 rounded-3xl border border-white/10 bg-white/70 p-6 shadow-[0_30px_80px_-60px_rgba(15,23,42,0.35)] backdrop-blur-xl"
        >
          <p className="text-xs uppercase tracking-[0.2em] text-black/50">Administration</p>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            {[
              { label: "CV", url: profile.cv_url },
              { label: "Lettre de Motivation", url: profile.motivation_letter_url },
              { label: "RQTH", url: profile.rqth_url },
              { label: "CERFA", url: profile.cerfa_url },
            ].map((doc) => (
              <div
                key={doc.label}
                className="flex items-center justify-between rounded-2xl border border-black/10 bg-white px-4 py-3"
              >
                <div>
                  <p className="text-sm font-semibold text-black">{doc.label}</p>
                  <p className="text-xs text-black/50">
                    {doc.url ? "Document disponible" : "Aucun document"}
                  </p>
                </div>
                {doc.url ? (
                  <a
                    href={doc.url}
                    className="rounded-full border border-black/10 px-3 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-black/70"
                  >
                    Voir / Télécharger
                  </a>
                ) : (
                  <span className="text-xs text-black/40">—</span>
                )}
              </div>
            ))}
          </div>
        </motion.section>
      ) : null}

      {!ecoleStaffSimplified ? (
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.15 }}
        className="rounded-3xl border border-white/10 bg-white/70 p-6 shadow-[0_30px_80px_-60px_rgba(15,23,42,0.35)] backdrop-blur-xl"
      >
        <p className="text-xs uppercase tracking-[0.2em] text-black/50">Spider Chart</p>
        <div className="mt-4 h-60">
          <ResponsiveContainer width="100%" height={350}>
            <RadarChart data={radarData}>
              <PolarGrid stroke="rgba(15,23,42,0.12)" />
              <PolarAngleAxis dataKey="skill" tick={{ fill: "#0F172A", fontSize: 10 }} />
              <PolarRadiusAxis
                tick={{ fill: "#0F172A", fontSize: 10 }}
                angle={30}
                domain={[0, Math.ceil(maxRadar)]}
              />
              <Radar dataKey="value" stroke="#0F172A" fill="rgba(15,23,42,0.15)" />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </motion.section>
      ) : null}

      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
        className="rounded-2xl border border-[#E5E5EA] bg-white p-6 shadow-sm"
      >
        <div className="flex items-center justify-between gap-3">
          <p className="text-xs uppercase tracking-[0.2em] text-[#86868B]">Top 5 Soft Skills</p>
          <button
            type="button"
            onClick={() => setSoftSkillsOpen(true)}
            className="rounded-full border border-[#E5E5EA] px-3 py-2 text-xs font-semibold text-[#1D1D1F]"
          >
            Voir toutes
          </button>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          {topFiveSkills.map((item) => (
            <div
              key={item.skill}
              className="inline-flex items-center gap-2 rounded-full border border-[#E5E5EA] bg-[#F5F5F7] px-3 py-1 text-xs font-semibold text-[#1D1D1F]"
            >
              <Star className="h-3 w-3 text-[#0071E3]" />
              <span>{item.skill}</span>
              <span className="text-[#86868B]">{item.value * 10}/100</span>
            </div>
          ))}
        </div>
      </motion.section>

      {softSkillsOpen ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/30 p-4 backdrop-blur-sm md:items-center md:p-6">
          <div className="w-full max-w-3xl rounded-t-2xl bg-white p-6 shadow-sm md:rounded-2xl">
            <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-[#E5E5EA] md:hidden" />
            <div className="flex items-center justify-between">
              <h4 className="text-lg font-semibold text-[#1D1D1F]">Soft Skills évaluées</h4>
              <button
                type="button"
                onClick={() => setSoftSkillsOpen(false)}
                className="flex h-11 w-11 items-center justify-center rounded-full border border-[#E5E5EA] text-sm font-semibold text-[#1D1D1F]"
                aria-label="Fermer"
              >
                ✕
              </button>
            </div>
            <div className="mt-4 space-y-2">
              {sortedSkills.map((item) => (
                <div
                  key={item.skill}
                  className="flex items-center justify-between rounded-xl border border-[#E5E5EA] bg-white px-4 py-3 text-sm"
                >
                  <span className="font-medium text-[#1D1D1F]">{item.skill}</span>
                  <span className="font-semibold text-[#0071E3]">{item.value * 10}/100</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : null}

      {!ecoleStaffSimplified ? (
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.25 }}
        className="rounded-3xl border border-white/10 bg-white/70 p-6 shadow-[0_30px_80px_-60px_rgba(15,23,42,0.35)] backdrop-blur-xl"
      >
        <p className="text-xs uppercase tracking-[0.2em] text-black/50">Timeline</p>
        <div className="mt-4 space-y-4">
          {hardSkills.length ? (
            hardSkills.map((skill) => (
              <div key={skill} className="flex items-start gap-3">
                <div className="mt-1 h-2 w-2 rounded-full bg-black/60" />
                <div>
                  <p className="text-sm font-semibold text-black">{skill}</p>
                  <p className="text-xs text-black/50">Expérience & diplôme</p>
                </div>
              </div>
            ))
          ) : (
            <p className="text-sm text-black/40">Aucune expérience renseignée.</p>
          )}
        </div>
      </motion.section>
      ) : null}

      <motion.section
        id={ecoleStaffSimplified ? "wallet-badges-ecole" : undefined}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.27 }}
        className="lg:col-span-3 rounded-[32px] border border-white/10 bg-black p-8 text-white shadow-[0_30px_80px_-60px_rgba(0,0,0,0.45)]"
      >
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-white/60">Wallet Badges</p>
            <h3 className="mt-2 text-2xl font-semibold text-white">
              Le wallet de {profile.first_name || "cet apprenant"}
            </h3>
          </div>
          <button
            type="button"
            onClick={handleShareWallet}
            className="rounded-full border border-white/20 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-white/90 hover:border-white/40"
          >
            Partager le Wallet
          </button>
        </div>
        {walletShareLink ? (
          <p className="mt-3 text-xs text-white/60">
            Lien du wallet genere : <span className="text-white">{walletShareLink}</span>
          </p>
        ) : null}
        {walletList.length ? (
          <div className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            {walletList.map((badge) => (
              <button
                key={badge.key}
                type="button"
                onClick={() => setActiveBadge(badge)}
                className="group relative overflow-hidden rounded-[28px] border border-white/10 bg-black p-6 text-white shadow-[0_20px_60px_-30px_rgba(0,0,0,0.8)]"
              >
                <div className="absolute inset-0 opacity-0 transition group-hover:opacity-100">
                  <div className="h-full w-full bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.35),_transparent_60%)]" />
                </div>
                <div className="relative z-10 flex flex-col gap-6">
                  <div className="mx-auto flex h-16 w-16 items-center justify-center overflow-hidden rounded-full bg-white/10 shadow-[0_0_20px_rgba(59,130,246,0.35)]">
                    {badge.imageUrl ? (
                      <img
                        src={badge.imageUrl}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <span className="text-sm font-bold tracking-tight text-white">{badgeInitials(badge.name)}</span>
                    )}
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-semibold">{badge.name}</p>
                    <p className="text-xs text-white/60">Obtenu le {badge.dateLabel}</p>
                  </div>
                  <div className="mx-auto inline-flex items-center gap-2 rounded-full border border-white/10 px-3 py-1 text-[11px] font-semibold text-white/80">
                    <ShieldCheck className="h-3 w-3 text-blue-400" />
                    Parcours Beyond Connect
                  </div>
                </div>
              </button>
            ))}
          </div>
        ) : (
          <p className="mt-6 max-w-xl text-sm leading-relaxed text-white/55">
            Aucun badge enregistré pour le moment. Les badges obtenus sur les parcours (table des récompenses LMS)
            apparaîtront ici ; vous pouvez aussi renseigner des références sur le profil apprenant.
          </p>
        )}
        {walletList.length ? (
          <button
            type="button"
            className="mt-6 inline-flex rounded-full border border-white/20 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-white/80 hover:border-white/40"
          >
            Voir d&apos;autres badges
          </button>
        ) : null}
      </motion.section>

      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.28 }}
        className="lg:col-span-3 rounded-[28px] border border-white/10 bg-[#1C1C1E] p-6 text-white shadow-[0_30px_80px_-60px_rgba(0,0,0,0.45)]"
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs uppercase tracking-[0.2em] text-white/60">Suivi Apprenant</p>
          <button
            type="button"
            onClick={() => setShowForm((prev) => !prev)}
            className="rounded-full bg-gradient-to-r from-blue-500 to-purple-600 px-3 py-2 text-xs font-semibold text-white"
          >
            + Ajouter un rendez-vous
          </button>
        </div>
        {showForm ? (
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-white/70">Type</label>
              <select
                value={newType}
                onChange={(event) => setNewType(event.target.value)}
                className="w-full rounded-lg border border-white/10 bg-[#1C1C1E] px-3 py-2 text-white"
              >
                <option>Visio</option>
                <option>Telephone</option>
                <option>Presentiel</option>
              </select>
            </div>
            <div className="space-y-2 md:col-span-2">
              <label className="text-xs font-semibold text-white/70">Notes</label>
              <textarea
                value={newNotes}
                onChange={(event) => setNewNotes(event.target.value)}
                className="h-24 w-full rounded-lg border border-white/10 bg-[#1C1C1E] px-3 py-2 text-white"
              />
            </div>
            <button
              type="button"
              onClick={handleAddAppointment}
              className="inline-flex w-fit rounded-lg bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-white"
            >
              Enregistrer
            </button>
          </div>
        ) : null}
        <div className="mt-4 space-y-3">
          {appointments.length ? (
            appointments.map((item) => (
              <div key={item.id} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <div className="flex items-center justify-between text-xs text-white/60">
                  <span>{item.type}</span>
                  <button
                    type="button"
                    onClick={() => handleMagicAI(item.id)}
                    className="rounded-full bg-gradient-to-r from-blue-500 to-purple-600 px-3 py-1 text-[10px] font-semibold text-white"
                  >
                    Magie IA
                  </button>
                </div>
                <p className="mt-2 text-sm text-white/80">{item.notes}</p>
                {item.summary ? (
                  <p className="mt-2 text-xs text-white/60">{item.summary}</p>
                ) : null}
              </div>
            ))
          ) : (
            <p className="text-sm text-white/50">Aucun rendez-vous pour le moment.</p>
          )}
        </div>
      </motion.section>

      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.3 }}
        className="rounded-3xl border border-white/10 bg-white/70 p-6 shadow-[0_30px_80px_-60px_rgba(15,23,42,0.35)] backdrop-blur-xl"
      >
        <p className="text-xs uppercase tracking-[0.2em] text-black/50">Portfolio & Liens</p>
        <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-sm text-black/70">
          <a href="https://github.com" className="rounded-lg hover:underline" target="_blank" rel="noreferrer">
            GitHub
          </a>
          <a href="https://behance.net" className="rounded-lg hover:underline" target="_blank" rel="noreferrer">
            Behance
          </a>
          <a href="https://example.com" className="rounded-lg hover:underline" target="_blank" rel="noreferrer">
            Étude de cas
          </a>
        </div>
      </motion.section>

      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.35 }}
        className="lg:col-span-3 rounded-3xl border border-white/10 bg-white/70 p-6 shadow-[0_30px_80px_-60px_rgba(15,23,42,0.35)] backdrop-blur-xl"
      >
        <p className="text-xs uppercase tracking-[0.2em] text-black/50">Opportunités de Carrière</p>
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          {offers.length ? (
            offers.map((offer) => (
              <div
                key={offer.id}
                className="rounded-2xl border border-transparent bg-white/80 p-4 shadow-sm"
                style={{
                  borderImage: "linear-gradient(135deg, rgba(59,130,246,0.25), rgba(168,85,247,0.25)) 1",
                }}
              >
                <p className="text-xs text-black/50">Jean, cette offre te correspond à 94%</p>
                <div className="mt-3 flex items-center justify-between">
                  <p className="text-sm font-semibold text-black">{offer.title || "Offre"}</p>
                  <span className="rounded-full bg-[#F5F5F7] px-2 py-1 text-xs font-semibold text-[#1D1D1F]">
                    Match à 92%
                  </span>
                </div>
                <p className="mt-1 text-xs text-black/50">
                  {offer.city || "Ville"} · {offer.salary || "Salaire"}
                </p>
                <a
                  href={`mailto:?subject=Je postule&body=Bonjour,%0D%0AJe souhaite postuler. Soft skills: ${encodeURIComponent(
                    mailtoSkills
                  )}`}
                  className="mt-4 inline-flex rounded-lg bg-black px-3 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-white"
                >
                  Postuler en 1 clic
                </a>
              </div>
            ))
          ) : (
            <p className="text-sm text-black/50">Aucune offre disponible.</p>
          )}
        </div>
      </motion.section>

      {activeBadge ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
          <div className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-3xl border border-white/10 bg-black p-6 text-white md:p-8">
            <div className="flex items-center justify-between gap-3">
              <p className="text-xl font-semibold">Détail du badge</p>
              <button
                type="button"
                onClick={() => setActiveBadge(null)}
                className="text-2xl leading-none text-white/70 hover:text-white"
                aria-label="Fermer"
              >
                ×
              </button>
            </div>
            <div className="mt-6 grid gap-8 lg:grid-cols-2">
              <div>
                <div className="flex items-center gap-4">
                  {activeBadge.imageUrl ? (
                    <img
                      src={activeBadge.imageUrl}
                      alt=""
                      className="h-16 w-16 shrink-0 rounded-full object-cover"
                    />
                  ) : (
                    <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-white/10 text-lg font-bold">
                      {badgeInitials(activeBadge.name)}
                    </div>
                  )}
                  <div>
                    <p className="text-2xl font-semibold md:text-3xl">{activeBadge.name}</p>
                    <p className="text-sm text-white/60">Obtenu le {activeBadge.dateLabel}</p>
                  </div>
                </div>
                <p className="mt-4 text-sm text-white/60">Date d&apos;expiration : {activeBadge.expiration}</p>
                <p className="text-sm text-white/60">Référence : {activeBadge.hash}</p>
                <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-4">
                  <p className="text-xs uppercase tracking-[0.3em] text-white/50">Description</p>
                  <p className="mt-2 text-sm text-white/70">{activeBadge.description}</p>
                </div>
                {activeBadge.criteria.trim() ? (
                  <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-4">
                    <p className="text-xs uppercase tracking-[0.3em] text-white/50">Critères</p>
                    <p className="mt-2 text-sm text-white/70">{activeBadge.criteria}</p>
                  </div>
                ) : null}
                <div className="mt-4 flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-4">
                  <ShieldCheck className="h-10 w-10 shrink-0 text-blue-400" />
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-white/50">Émetteur</p>
                    <p className="text-sm text-white/80">{activeBadge.issuer}</p>
                  </div>
                </div>
              </div>
              <div>
                {activeBadge.evidenceUrl.trim() && activeBadge.evidenceLabel.trim() ? (
                  <>
                    <p className="text-xs uppercase tracking-[0.3em] text-white/50">Preuves</p>
                    <a
                      href={activeBadge.evidenceUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-4 inline-flex items-center gap-2 rounded-lg bg-white px-5 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-black"
                    >
                      {activeBadge.evidenceLabel}
                    </a>
                  </>
                ) : (
                  <p className="text-sm text-white/50">Aucun lien de preuve associé à ce badge.</p>
                )}
                <div className="mt-6 overflow-hidden rounded-3xl border border-white/10 bg-white/5">
                  {activeBadge.imageUrl ? (
                    <div className="relative aspect-video w-full bg-black">
                      <img
                        src={activeBadge.imageUrl}
                        alt=""
                        className="h-full w-full object-contain opacity-90"
                      />
                    </div>
                  ) : (
                    <div className="flex min-h-[200px] items-center justify-center px-6 py-12 text-center text-sm text-white/45">
                      Aperçu graphique non disponible pour ce badge.
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </motion.div>
  );
}
