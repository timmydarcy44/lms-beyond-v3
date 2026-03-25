"use client";

import { motion } from "framer-motion";
import { useState } from "react";
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
    open_badges?: Array<string | { name?: string; image_url?: string; url?: string }> | null;
    soft_skills_scores?: Record<string, number> | null;
    disc_profile?: string | null;
    disc_scores?: { D: number; I: number; S: number; C: number } | null;
    tutor_feedback?: string | null;
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
};

const defaultRadarLabels = ["Leadership", "Organisation", "Communication", "Adaptabilite", "Creativite"];
const demoRadarLabels = ["Empathie", "Resilience", "Leadership", "Negotiation", "Rigueur"];

export function SchoolStudentProfile({ profile, offers }: SchoolStudentProfileProps) {
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
  const discProfile = profile.disc_profile || null;
  const discLabel = profile.disc_scores
    ? `D:${profile.disc_scores.D} I:${profile.disc_scores.I} S:${profile.disc_scores.S} C:${profile.disc_scores.C}`
    : null;
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
    : `Le profil DISC "${discProfile || "Stable"}" de cet apprenant, couplé à un score MAI ${maiLabel} en gestion de l'erreur, indique une forte résilience opérationnelle malgré un stress académique ${stressLabel}.`;
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
  const [activeBadge, setActiveBadge] = useState<null | {
    name: string;
    date: string;
    issuer: string;
    description: string;
    criteria: string;
    evidenceLabel: string;
    evidenceUrl: string;
    expiration: string;
    hash: string;
    image: string;
  }>(null);
  const badgeImage =
    "https://fqqqejpakbccwvrlolpc.supabase.co/storage/v1/object/public/Center/20260125_2104_Image%20Generation_simple_compose_01kfvc2fm7f8at8xz8bpktqt6q.png";
  const badgeVideo =
    "https://fqqqejpakbccwvrlolpc.supabase.co/storage/v1/object/public/Center/20260131_1658_New%20Video_simple_compose_01kgace1jve2d9y5pqwnabcpp5.mp4";
  const [walletShareLink, setWalletShareLink] = useState<string | null>(null);

  const walletBadges = [
    {
      name: "Expert Prospection B2B",
      date: "10/02/2026",
      issuer: "Beyond No School",
      description:
        "Cet Open Badge valide le fait que la personne a su faire preuve de négociation professionnelle et de résilience à travers une étude de cas complexe.",
      criteria: "A réalisé 50 appels à froid avec succès et présenté une stratégie d'approche.",
      evidenceLabel: "Télécharger l'étude de cas",
      evidenceUrl: "https://example.com/etude-de-cas.pdf",
      expiration: "10/02/2029",
      hash: "0x7b9d3a8f51c4e1a2",
      image: badgeImage,
    },
    {
      name: "Leadership",
      date: "25/01/2026",
      issuer: "Beyond No School",
      description:
        "Ce badge certifie la capacité à mobiliser un collectif et à maintenir un cap ambitieux en contexte exigeant.",
      criteria: "A piloté un projet en autonomie et validé 3 évaluations terrain.",
      evidenceLabel: "Voir le livrable",
      evidenceUrl: "https://example.com/livrable.pdf",
      expiration: "25/01/2029",
      hash: "0x1f4a9d2c7e6b8031",
      image: badgeImage,
    },
    {
      name: "Négociation",
      date: "12/12/2025",
      issuer: "Beyond No School",
      description:
        "Validation des compétences de négociation stratégique et de pilotage d'accords commerciaux.",
      criteria: "A conclu 2 accords B2B et défendu une grille tarifaire.",
      evidenceLabel: "Télécharger la synthèse",
      evidenceUrl: "https://example.com/synthese.pdf",
      expiration: "12/12/2028",
      hash: "0x9c21b0d54e7f3a11",
      image: badgeImage,
    },
    {
      name: "Organisation",
      date: "30/11/2025",
      issuer: "Beyond No School",
      description:
        "Certification d'une capacité d'organisation avancée et d'une exécution rigoureuse des priorités.",
      criteria: "A structuré un plan d'action sur 6 semaines avec KPI validés.",
      evidenceLabel: "Voir le plan d'action",
      evidenceUrl: "https://example.com/plan-action.pdf",
      expiration: "30/11/2028",
      hash: "0x4ea2f6b18c0d9e23",
      image: badgeImage,
    },
  ];

  const handleShareWallet = () => {
    const token = Math.random().toString(36).slice(2, 10);
    const baseUrl = typeof window !== "undefined" ? window.location.origin : "https://beyond-connect.fr";
    const link = `${baseUrl}/wallet/${token}`;
    setWalletShareLink(link);
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(link).catch(() => undefined);
    }
  };

  const tutorComments = [
    profile.tutor_feedback ||
      "Très bonne posture terrain, progression notable sur la prise de rendez-vous.",
    "Objectifs atteints sur la prospection, continuer à renforcer la négociation.",
  ];
  const missionsAverage = 85;

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
      className="grid gap-6 lg:grid-cols-3"
    >
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.02 }}
        className="lg:col-span-3 grid gap-6 rounded-2xl border border-[#E5E5EA] bg-white p-6 shadow-sm md:grid-cols-[1.2fr_1fr]"
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
              <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-[#86868B]">
                {discProfile ? (
                  <span className="rounded-full bg-[#F5F5F7] px-3 py-1 font-semibold text-[#1D1D1F]">
                    {discProfile}
                  </span>
                ) : null}
                {discLabel ? <span className="text-xs text-[#86868B]">{discLabel}</span> : null}
              </div>
              <span className="mt-2 inline-flex rounded-full bg-[#F5F5F7] px-3 py-1 text-xs font-semibold text-[#1D1D1F]">
                Profil complété à 85%
              </span>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-3">
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
      </motion.section>

      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.05 }}
        className="lg:col-span-3"
      >
        <ProfileAIAnalysis />
      </motion.section>

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

          <div className="rounded-2xl border border-[#E5E5EA] bg-white p-4">
            <p className="text-sm font-semibold text-[#1D1D1F]">DISC</p>
            <div className="mt-4 grid grid-cols-4 gap-3 text-center text-xs text-[#86868B]">
              {[
                { label: "D", value: rawScores.Rouge ?? 80, color: "bg-red-500" },
                { label: "I", value: rawScores.Jaune ?? 55, color: "bg-yellow-400" },
                { label: "S", value: rawScores.Vert ?? 80, color: "bg-[#8E8E93]" },
                { label: "C", value: rawScores.Bleu ?? 75, color: "bg-blue-600" },
              ].map((item) => (
                <div key={item.label} className="flex flex-col items-center gap-2">
                  <div className="flex h-28 w-7 items-end rounded-full bg-[#F5F5F7]">
                    <div className={`w-full rounded-t-full ${item.color}`} style={{ height: `${item.value}%` }} />
                  </div>
                  <span className="font-semibold text-[#1D1D1F]">{item.label}</span>
                </div>
              ))}
            </div>
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

      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.06 }}
        className="lg:col-span-3 rounded-3xl border border-white/10 bg-white/70 p-6 shadow-[0_30px_80px_-60px_rgba(15,23,42,0.35)] backdrop-blur-xl"
      >
        <p className="text-xs uppercase tracking-[0.2em] text-black/50">Retours tuteur</p>
        <div className="mt-4 space-y-3 text-sm text-black/70">
          {tutorComments.map((comment) => (
            <div key={comment} className="rounded-2xl border border-slate-200 bg-white/70 p-4">
              {comment}
            </div>
          ))}
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

      <motion.section
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
        <div className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          {walletBadges.map((badge) => (
            <button
              key={badge.name}
              type="button"
              onClick={() => setActiveBadge(badge)}
              className="group relative overflow-hidden rounded-[28px] border border-white/10 bg-black p-6 text-white shadow-[0_20px_60px_-30px_rgba(0,0,0,0.8)]"
            >
              <div className="absolute inset-0 opacity-0 transition group-hover:opacity-100">
                <div className="h-full w-full bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.35),_transparent_60%)]" />
              </div>
              <div className="relative z-10 flex flex-col gap-6">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-black shadow-[0_0_20px_rgba(59,130,246,0.35)]">
                  <img src={badge.image} alt={badge.name} className="h-10 w-10 rounded-full object-cover" />
                </div>
                <div className="text-center">
                  <p className="text-lg font-semibold">{badge.name}</p>
                  <p className="text-xs text-white/60">Obtenu le {badge.date}</p>
                </div>
                <div className="mx-auto inline-flex items-center gap-2 rounded-full border border-white/10 px-3 py-1 text-[11px] font-semibold text-white/80">
                  <ShieldCheck className="h-3 w-3 text-blue-400" />
                  Certifie par l'IA Beyond
                </div>
              </div>
            </button>
          ))}
        </div>
        <button
          type="button"
          className="mt-6 inline-flex rounded-full border border-white/20 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-white/80 hover:border-white/40"
        >
          Voir d'autres badges
        </button>
      </motion.section>

      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.29 }}
        className="lg:col-span-3 rounded-3xl border border-white/10 bg-gradient-to-r from-[#C2410C] to-[#FB923C] p-6 text-white shadow-[0_30px_80px_-60px_rgba(194,65,12,0.6)]"
      >
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-white/70">Suivi de l'apprenant</p>
            <p className="mt-2 text-lg font-semibold">Derniers retours du tuteur</p>
            <div className="mt-3 space-y-2 text-sm text-white/90">
              {tutorComments.map((comment) => (
                <div key={comment} className="rounded-2xl border border-white/30 bg-white/10 px-3 py-2">
                  {comment}
                </div>
              ))}
            </div>
            <p className="mt-3 text-sm text-white/90">
              Moyenne générale des missions : <span className="font-semibold">{missionsAverage}%</span>
            </p>
          </div>
          <a
            href={`/dashboard/ecole/apprenants/${profile.id || "profil"}/suivi`}
            className="rounded-full bg-white px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-[#C2410C]"
          >
            Accéder au suivi complet
          </a>
        </div>
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
        <div className="mt-4 space-y-2 text-sm text-black/70">
          <a href="https://github.com" className="hover:underline">GitHub</a>
          <a href="https://behance.net" className="hover:underline">Behance</a>
          <a href="https://example.com" className="hover:underline">Étude de cas</a>
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

      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.4 }}
        className="lg:col-span-3 rounded-3xl border border-white/10 bg-gradient-to-r from-white/80 to-white/60 p-6 shadow-[0_30px_80px_-60px_rgba(15,23,42,0.35)] backdrop-blur-xl"
      >
        <div className="flex flex-wrap items-center justify-between gap-4">
          <p className="text-sm font-semibold text-black/70">
            Préparez votre audit Qualiopi en toute sécurité
          </p>
          <a
            href="/dashboard/ecole/qualiopi"
            className="inline-flex rounded-lg bg-black px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-white"
          >
            Accéder à Qualiopi
          </a>
        </div>
      </motion.section>
      {activeBadge ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80">
          <div className="h-[90vh] w-[90vw] overflow-hidden rounded-3xl border border-white/10 bg-black p-8 text-white">
            <div className="flex items-center justify-between">
              <p className="text-xl font-semibold">Open Badge</p>
              <button
                type="button"
                onClick={() => setActiveBadge(null)}
                className="text-2xl text-white/70 hover:text-white"
              >
                ×
              </button>
            </div>
            <div className="mt-6 grid gap-8 lg:grid-cols-2">
              <div>
                <div className="flex items-center gap-4">
                  <img src={activeBadge.image} alt={activeBadge.name} className="h-16 w-16 rounded-full" />
                  <div>
                    <p className="text-3xl font-semibold">{activeBadge.name}</p>
                    <p className="text-sm text-white/60">Obtenu le {activeBadge.date}</p>
                  </div>
                </div>
                <p className="mt-4 text-sm text-white/60">Date d'expiration : {activeBadge.expiration}</p>
                <p className="text-sm text-white/60">Identifiant unique : {activeBadge.hash}</p>
                <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-4">
                  <p className="text-xs uppercase tracking-[0.3em] text-white/50">Description</p>
                  <p className="mt-2 text-sm text-white/70">{activeBadge.description}</p>
                </div>
                <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-4">
                  <p className="text-xs uppercase tracking-[0.3em] text-white/50">Critères</p>
                  <p className="mt-2 text-sm text-white/70">{activeBadge.criteria}</p>
                </div>
                <div className="mt-4 flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-4">
                  <img src={badgeImage} alt="Verified by Beyond" className="h-10 w-10 rounded-full" />
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-white/50">Issuer</p>
                    <p className="text-sm text-white/80">
                      {activeBadge.issuer} · Verified by Beyond
                    </p>
                  </div>
                </div>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-white/50">Preuves</p>
                <a
                  href={activeBadge.evidenceUrl}
                  className="mt-4 inline-flex items-center gap-2 rounded-lg bg-white px-5 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-black"
                >
                  {activeBadge.evidenceLabel}
                </a>
                <div className="mt-6 overflow-hidden rounded-3xl border border-white/10 bg-white/5">
                  <div className="relative h-[36vh] w-full bg-black">
                    <img src={activeBadge.image} alt="Vignette" className="h-full w-full object-cover opacity-60" />
                    <button
                      type="button"
                      className="absolute inset-0 m-auto h-12 w-48 rounded-full bg-white/20 text-xs font-semibold uppercase tracking-[0.2em] text-white backdrop-blur-md"
                    >
                      Voir la vidéo
                    </button>
                  </div>
                  <video className="hidden" src={badgeVideo} />
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </motion.div>
  );
}
