"use client";

import { useState } from "react";
import {
  AlertCircle,
  AlertTriangle,
  BarChart3,
  Calendar,
  CheckCircle2,
  Circle,
  Download,
  FileText,
  Layers,
  NotebookPen,
  Phone,
  Rocket,
  Send,
  ShieldCheck,
  Target,
  TrendingDown,
  TrendingUp,
  UserSquare2,
  XCircle,
} from "lucide-react";
import { PolarAngleAxis, PolarGrid, Radar, RadarChart, ResponsiveContainer, Tooltip } from "recharts";

type BeyondAssessment = {
  disc_profile: string;
  mai_scores: {
    declarative: boolean;
    procedures: boolean;
    planification: boolean;
  };
  stress_level: number;
  dys_indicators: {
    concentration: "Jamais" | "Parfois" | "Souvent" | string;
    executive_alert?: boolean;
  };
};

type AdminCompletion = {
  cv: boolean;
  cerfa: boolean;
  dossier_candidature: boolean;
  dossier_inscription: boolean;
};

const calculateCompletion = (apprenant: {
  admin: AdminCompletion;
  assessment: BeyondAssessment;
}) => {
  const adminFields = Object.values(apprenant.admin);
  const adminScore = adminFields.filter(Boolean).length / adminFields.length;

  const testFlags = [
    apprenant.assessment.disc_profile,
    apprenant.assessment.mai_scores,
    apprenant.assessment.stress_level,
  ];
  const testsCompleted =
    (apprenant.assessment.disc_profile ? 1 : 0) +
    (apprenant.assessment.mai_scores ? 1 : 0) +
    (Number.isFinite(apprenant.assessment.stress_level) ? 1 : 0);
  const testsScore = testsCompleted / testFlags.length;

  return Math.round(adminScore * 40 + testsScore * 60);
};

const jade = {
  name: "Jade Letellier",
  cursus: "BTS MCO2",
  avatar:
    "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=400&q=80",
  verbatim: "J’ai l’impression d’avoir évolué grandi et m’être senti comprise.",
  aiSummary:
    "Profil stable (Test comportemental) avec une forte autonomie cognitive (MAI), nécessitant un cadre structuré pour compenser les difficultés de planification identifiées (DYS/MAI).",
  satisfaction: "4.6/5",
  tests: [
    { label: "MAI", value: "Visuel/Kinesthésique" },
    { label: "STRESS", value: "4/10 (Géré)" },
    { label: "Test comportemental", value: "Stable" },
    { label: "Pré-diag DYS", value: "Dyslexie détectée" },
  ],
  softSkills: [
    { subject: "Confiance", A: 90 },
    { subject: "Estime", A: 85 },
    { subject: "Organisation", A: 40 },
    { subject: "Communication", A: 70 },
    { subject: "Résilience", A: 80 },
  ],
  admin: {
    status: "✅ Obtenue (Expire 01/2028)",
    accommodations: [
      { label: "Tiers-temps examens", status: "ok" },
      { label: "Poste adapté", status: "pending" },
      { label: "Suivi psychopédagogue", status: "ok" },
    ],
    deadline: "Janvier 2028",
  },
  assessment: {
    disc_profile: "Stable",
    mai_scores: {
      declarative: true,
      procedures: true,
      planification: true,
    },
    stress_level: 4,
    dys_indicators: {
      concentration: "Parfois",
      executive_alert: false,
    },
  },
  alerts: [
    { level: "urgent", text: "RDV psychopédagogue non planifié (> 45 jours)." },
    { level: "warning", text: "Entreprise non informée de la dyslexie (accord requis)." },
    { level: "ok", text: "Tiers-temps validé pour partiels de mars." },
  ],
  consent: {
    cfa: true,
    psycho: true,
    trainers: false,
    company: false,
  },
  entreprise: {
    mentor: "Mme Lefèvre",
    contact: "06 45 22 13 89",
    informed: false,
    accommodations: false,
  },
  progression: {
    stressBefore: 7,
    stressAfter: 4,
    satisfactionBefore: 3.2,
    satisfactionAfter: 4.6,
    absencesBefore: 8,
    absencesAfter: 2,
    resultsBefore: 10.2,
    resultsAfter: 13.5,
  },
  journal: [
    { date: "15/02", note: "RDV Psy" },
    { date: "02/02", note: "Call Entreprise" },
    { date: "15/01", note: "Dépôt MDPH" },
  ],
  compliance: {
    cv: true,
    cerfa: false,
    dossier_candidature: false,
    dossier_inscription: true,
  },
  maiSignals: {
    globalSense: true,
    taskSplit: false,
  },
  stressSignal: "orange",
  dysSignal: "red",
  lastEnterpriseContactDays: 32,
};

const valentinAssessment: BeyondAssessment = {
  disc_profile: "Stable",
  mai_scores: {
    declarative: true,
    procedures: true,
    planification: false,
  },
  stress_level: 16,
  dys_indicators: {
    concentration: "Souvent",
    executive_alert: true,
  },
};

const softSkillsCatalog = [
  {
    category: "Communication",
    items: [
      { label: "Écoute active", score: 92 },
      { label: "Clarté d'expression", score: 84 },
      { label: "Storytelling", score: 78 },
      { label: "Présence orale", score: 80 },
      { label: "Négociation", score: 72 },
    ],
  },
  {
    category: "Adaptabilité",
    items: [
      { label: "Souplesse cognitive", score: 86 },
      { label: "Agilité terrain", score: 82 },
      { label: "Curiosité", score: 88 },
      { label: "Gestion du changement", score: 74 },
      { label: "Vitesse d'apprentissage", score: 79 },
    ],
  },
  {
    category: "Résolution de problèmes",
    items: [
      { label: "Analyse", score: 76 },
      { label: "Esprit critique", score: 70 },
      { label: "Synthèse", score: 83 },
      { label: "Priorisation", score: 68 },
      { label: "Prise de décision", score: 73 },
    ],
  },
  {
    category: "Organisation",
    items: [
      { label: "Planification", score: 61 },
      { label: "Rigueur", score: 74 },
      { label: "Fiabilité", score: 80 },
      { label: "Gestion du temps", score: 65 },
      { label: "Autonomie", score: 88 },
    ],
  },
  {
    category: "Leadership & collaboration",
    items: [
      { label: "Esprit d'équipe", score: 90 },
      { label: "Influence positive", score: 77 },
      { label: "Empathie", score: 91 },
      { label: "Résilience", score: 85 },
      { label: "Orientation client", score: 81 },
    ],
  },
];

export default function HandicapPilotagePage() {
  const [softSkillsOpen, setSoftSkillsOpen] = useState(false);
  const completionScore = calculateCompletion({
    admin: jade.compliance,
    assessment: jade.assessment,
  });
  const missingItems = [
    !jade.compliance.cerfa ? "Cerfa non signé" : null,
    !jade.entreprise.informed ? "entreprise non informée" : null,
    !jade.assessment.mai_scores.planification ? "MAI planification non validée" : null,
  ].filter(Boolean) as string[];
  const badgeTooltip = missingItems.length
    ? `Il manque : ${missingItems.join(", ")}.`
    : "Tous les éléments clés sont complétés.";
  const isEnterpriseContactLate = jade.lastEnterpriseContactDays > 30;

  return (
    <div className="min-h-screen bg-[#F8FAFC] px-4 py-8 text-[#1D1D1F] md:px-8">
      <div className="mx-auto w-full max-w-[1200px] space-y-6">
        <header className="rounded-2xl border border-[#E5E5EA] bg-white p-6 shadow-sm">
          <p className="text-xs uppercase tracking-[0.2em] text-[#86868B]">Cockpit de pilotage</p>
          <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
            <img
              src={jade.avatar}
              alt={jade.name}
              className="h-16 w-16 rounded-2xl border border-[#E5E5EA] object-cover"
            />
            <div>
              <h1 className="text-2xl font-semibold text-[#1D1D1F]">{jade.name}</h1>
              <div className="mt-1 text-sm text-[#86868B]">{jade.cursus}</div>
            </div>
            <div className="relative">
              <span className="group inline-flex rounded-full border border-[#D65151] px-3 py-1 text-xs font-semibold text-[#D65151]">
                {completionScore}% Complet
              </span>
              <div className="pointer-events-none absolute left-1/2 top-full z-10 mt-2 w-64 -translate-x-1/2 rounded-lg border border-[#E5E5EA] bg-white px-3 py-2 text-[11px] text-[#1D1D1F] shadow-sm opacity-0 transition group-hover:opacity-100">
                {badgeTooltip}
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                const payload = {
                  apprenant: jade.name,
                  assessment: jade.assessment,
                  admin_completion: jade.compliance,
                  completion_score: completionScore,
                };
                const report = JSON.stringify(payload, null, 2);
                if (typeof window !== "undefined") {
                  window.alert(`Synthèse BeyondAssessment\n\n${report}`);
                }
              }}
              className="inline-flex items-center gap-2 rounded-full border border-[#D65151] px-4 py-2 text-xs font-semibold text-[#D65151]"
            >
              <Download className="h-4 w-4" />
              Exporter en PDF ✨
            </button>
          </div>
          <div className="mt-3 text-xs font-semibold text-[#1D1D1F]">Satisfaction : {jade.satisfaction}</div>
        </header>

        <section className="grid gap-4 md:grid-cols-6">
          <div className="rounded-2xl border border-[#E5E5EA] bg-white p-5 shadow-sm md:col-span-6">
            <div className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-[#D65151]">
              <Target className="h-4 w-4 text-[#D65151]" />
              Profil comportemental
            </div>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <div className="rounded-2xl border border-[#E5E5EA] bg-white p-4">
                <p className="text-sm font-semibold text-[#1D1D1F]">Synthèse IA</p>
                <p className="mt-3 text-sm text-[#86868B]">{jade.aiSummary}</p>
                <p className="mt-3 text-[11px] text-[#86868B]">“{jade.verbatim}”</p>
                <div className="mt-4 space-y-2 text-xs text-[#86868B]">
                  <div className="flex items-center justify-between rounded-xl bg-[#F5F5F7] px-3 py-2">
                    <span>MAI · Sens global</span>
                    {jade.maiSignals.globalSense ? (
                      <CheckCircle2 className="h-4 w-4 text-[#D65151]" />
                    ) : (
                      <XCircle className="h-4 w-4 text-[#D65151]" />
                    )}
                  </div>
                  <div className="flex items-center justify-between rounded-xl bg-[#F5F5F7] px-3 py-2">
                    <span>MAI · Division des tâches</span>
                    {jade.maiSignals.taskSplit ? (
                      <CheckCircle2 className="h-4 w-4 text-[#D65151]" />
                    ) : (
                      <XCircle className="h-4 w-4 text-[#D65151]" />
                    )}
                  </div>
                  <div className="flex items-center justify-between rounded-xl bg-[#F5F5F7] px-3 py-2">
                    <span>Stress</span>
                    <span className="inline-flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-orange-400" />
                      Orange
                    </span>
                  </div>
                  <div className="flex items-center justify-between rounded-xl bg-[#F5F5F7] px-3 py-2">
                    <span>DYS · Concentration</span>
                    <span className="inline-flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-[#D65151]" />
                      Rouge
                    </span>
                  </div>
                </div>
              </div>
              <div className="rounded-2xl border border-[#E5E5EA] bg-white p-4">
                <div className="flex items-center justify-between">
                  <p className="text-xs uppercase tracking-[0.2em] text-[#D65151]">Soft Skills</p>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setSoftSkillsOpen(true)}
                      className="rounded-full border border-[#E5E5EA] px-3 py-1 text-[10px] font-semibold text-[#1D1D1F]"
                    >
                      Voir le catalogue
                    </button>
                    <BarChart3 className="h-4 w-4 text-[#D65151]" />
                  </div>
                </div>
                {jade.softSkills?.length ? (
                  <div className="mt-4 h-[300px]">
                    <ResponsiveContainer width="100%" height={300}>
                      <RadarChart data={jade.softSkills}>
                        <PolarGrid stroke="#E2E8F0" />
                        <PolarAngleAxis dataKey="subject" tick={{ fill: "#64748B", fontSize: 10 }} />
                        <Radar dataKey="A" stroke="#D65151" fill="rgba(214,81,81,0.2)" />
                        <Tooltip
                          cursor={{ stroke: "#D65151", strokeWidth: 1 }}
                          content={({ active, payload }) => {
                            if (!active || !payload || !payload.length) return null;
                            const value = payload[0].value;
                            return (
                              <div className="rounded-lg border border-[#E5E5EA] bg-white px-3 py-2 text-xs text-[#1D1D1F] shadow-sm">
                                {value}/100
                              </div>
                            );
                          }}
                        />
                      </RadarChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="mt-4 rounded-xl border border-dashed border-[#E5E5EA] bg-[#F5F5F7] px-4 py-6 text-xs text-[#86868B]">
                    En attente des résultats du test.
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-[#E5E5EA] bg-white p-5 shadow-sm md:col-span-3">
            <div className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-[#D65151]">
              <FileText className="h-4 w-4 text-[#D65151]" />
              Dossier administratif RQTH
            </div>
            <p className="mt-3 text-sm font-semibold text-slate-900">Statut : {jade.admin.status}</p>
            <div className="mt-4 space-y-2 text-sm text-slate-700">
              {jade.admin.accommodations.map((item) => (
                <div key={item.label} className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2">
                  <span>{item.label}</span>
                  {item.status === "ok" ? (
                    <CheckCircle2 className="h-4 w-4 text-[#D65151]" />
                  ) : (
                    <AlertTriangle className="h-4 w-4 text-[#D65151]" />
                  )}
                </div>
              ))}
            </div>
            <p className="mt-4 text-xs text-slate-500">Échéance : {jade.admin.deadline}</p>
            <div className="mt-4 grid grid-cols-2 gap-2 text-xs text-[#1D1D1F]">
              <div className="flex items-center gap-2 rounded-xl border border-[#E5E5EA] bg-white px-3 py-2">
                {jade.compliance.cv ? (
                  <CheckCircle2 className="h-4 w-4 text-[#D65151]" />
                ) : (
                  <Circle className="h-4 w-4 text-[#D65151]" />
                )}
                CV
              </div>
              <div className="flex items-center gap-2 rounded-xl border border-[#E5E5EA] bg-white px-3 py-2">
                {jade.compliance.cerfa ? (
                  <CheckCircle2 className="h-4 w-4 text-[#D65151]" />
                ) : (
                  <Circle className="h-4 w-4 text-[#D65151]" />
                )}
                Cerfa
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-[#E5E5EA] bg-white p-5 shadow-sm md:col-span-3">
            <div className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-[#D65151]">
              <AlertCircle className="h-4 w-4 text-[#D65151]" />
              Alertes actives
            </div>
            <div className="mt-4 space-y-3 text-sm">
              {jade.alerts.map((alert) => (
                <div key={alert.text} className="flex items-start gap-2 rounded-xl bg-slate-50 px-3 py-2">
                  {alert.level === "urgent" ? "🔴" : alert.level === "warning" ? "🟠" : "🟢"} {alert.text}
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-[#E5E5EA] bg-white p-5 shadow-sm md:col-span-2">
            <div className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-[#D65151]">
              <ShieldCheck className="h-4 w-4 text-[#D65151]" />
              Confidentialité & RGPD
            </div>
            <div className="mt-4 space-y-2 text-sm text-slate-700">
              <div className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2">
                <span>Référent CFA</span>
                <span>{jade.consent.cfa ? "✅" : "❌"}</span>
              </div>
              <div className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2">
                <span>Psychopédagogue</span>
                <span>{jade.consent.psycho ? "✅" : "❌"}</span>
              </div>
              <div className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2">
                <span>Formateurs</span>
                <span>{jade.consent.trainers ? "✅" : "❌"}</span>
              </div>
              <div className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2">
                <span>Entreprise</span>
                <span>{jade.consent.company ? "✅" : "❌"}</span>
              </div>
            </div>
            <button
              type="button"
              className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700"
            >
              <Send className="h-4 w-4" />
              Envoyer demande de consentement à l&apos;apprenant
            </button>
          </div>

          <div className="rounded-2xl border border-[#E5E5EA] bg-white p-5 shadow-sm md:col-span-2">
            <div className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-[#D65151]">
              <UserSquare2 className="h-4 w-4 text-[#D65151]" />
              Suivi entreprise
            </div>
            <div className="mt-4 space-y-2 text-sm text-slate-700">
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-slate-400" />
                {jade.entreprise.mentor} · {jade.entreprise.contact}
              </div>
              <div className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2">
                <span>Informé</span>
                <span>{jade.entreprise.informed ? "✅" : "❌"}</span>
              </div>
              <div className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2">
                <span>Aménagements</span>
                <span>{jade.entreprise.accommodations ? "✅" : "❌"}</span>
              </div>
            </div>
            <button
              type="button"
              className={`mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold text-white ${
                isEnterpriseContactLate ? "bg-[#D65151]" : "bg-[#1D1D1F]"
              }`}
            >
              <Calendar className="h-4 w-4" />
              {isEnterpriseContactLate
                ? `Urgence : Aucun contact depuis ${jade.lastEnterpriseContactDays} jours`
                : "Planifier appel tripartite CFA-Apprenant-Entreprise"}
            </button>
          </div>

          <div className="rounded-2xl border border-[#E5E5EA] bg-white p-5 shadow-sm md:col-span-2">
            <div className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-[#D65151]">
              <TrendingUp className="h-4 w-4 text-[#D65151]" />
              Progression & ROI
            </div>
            <div className="mt-4 space-y-2 text-sm text-slate-700">
              <div className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2">
                <span>Stress</span>
                <span>
                  {jade.progression.stressBefore}/10 → {jade.progression.stressAfter}/10{" "}
                  <TrendingDown className="inline h-4 w-4 text-[#D65151]" />
                </span>
              </div>
              <div className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2">
                <span>Satisfaction</span>
                <span>
                  {jade.progression.satisfactionBefore} → {jade.progression.satisfactionAfter}/5{" "}
                  <TrendingUp className="inline h-4 w-4 text-[#D65151]" />
                </span>
              </div>
              <div className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2">
                <span>Absences</span>
                <span>
                  {jade.progression.absencesBefore}/mois → {jade.progression.absencesAfter}/mois ✅
                </span>
              </div>
              <div className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2">
                <span>Résultats</span>
                <span>
                  {jade.progression.resultsBefore} → {jade.progression.resultsAfter}/20 🚀
                </span>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-[#E5E5EA] bg-white p-5 shadow-sm md:col-span-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-[#D65151]">
                <NotebookPen className="h-4 w-4 text-[#D65151]" />
                Journal de suivi (preuve audit)
              </div>
              <button
                type="button"
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700"
              >
                <NotebookPen className="h-4 w-4" /> + Ajouter une note au journal
              </button>
            </div>
            <div className="mt-4 rounded-2xl border border-[#E5E5EA] bg-[#F5F5F7] px-4 py-3 text-xs text-[#1D1D1F]">
              <span className="font-semibold">Prochain RDV :</span> 15/03/2026 - Psychopédagogue{" "}
              <span className="text-[#D65151]">⚠️ Dans 26 jours</span>
            </div>
            <div className="mt-4 grid gap-3 md:grid-cols-3">
              {jade.journal.map((entry) => (
                <div key={entry.date} className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-3">
                  <p className="text-xs font-semibold text-slate-500">{entry.date}</p>
                  <p className="mt-1 text-sm font-semibold text-slate-900">{entry.note}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-[#E5E5EA] bg-white p-5 shadow-sm md:col-span-6">
            <div className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-[#D65151]">
              <Layers className="h-4 w-4 text-[#D65151]" />
              Méthodologie Beyond 360°
            </div>
            <p className="mt-4 text-sm text-[#86868B]">
              Notre IA croise 5 couches de données : Comportement (Test comportemental), Aptitudes (Soft Skills), Métacognition (MAI),
              Résilience (Stress) et Besoins Spécifiques (DYS) pour une vision holistique de l&apos;apprenant.
            </p>
          </div>
        </section>

        <section className="grid gap-3 md:grid-cols-2">
          <button
            type="button"
            className="flex items-center justify-between rounded-xl bg-[#D65151] px-6 py-4 text-left text-white shadow-sm"
          >
            <span className="text-sm font-semibold">
              Comment améliorer la scolarité et l&apos;alternance de ce jeune ?
            </span>
            <Rocket className="h-5 w-5" />
          </button>
          <button
            type="button"
            className="flex items-center justify-between rounded-xl border border-[#D65151] bg-white px-6 py-4 text-left text-[#D65151] shadow-sm"
          >
            <span className="text-sm font-semibold">Prendre rendez-vous avec la psychopédagogue</span>
            <Calendar className="h-5 w-5 text-[#D65151]" />
          </button>
        </section>
      </div>

      {softSkillsOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
          <div className="w-full max-w-2xl rounded-3xl bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-[#D65151]">Catalogue Soft Skills</p>
                <p className="mt-1 text-sm text-[#86868B]">25 compétences étudiées</p>
              </div>
              <button
                type="button"
                onClick={() => setSoftSkillsOpen(false)}
                className="rounded-full border border-[#E5E5EA] px-3 py-1 text-xs font-semibold text-[#1D1D1F]"
              >
                Fermer
              </button>
            </div>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              {softSkillsCatalog.map((group) => (
                <div key={group.category} className="rounded-2xl border border-[#E5E5EA] bg-[#F5F5F7] p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#D65151]">
                    {group.category}
                  </p>
                  <div className="mt-3 space-y-2 text-xs text-[#1D1D1F]">
                    {group.items.map((item) => (
                      <div key={item.label} className="flex items-center justify-between">
                        <span>{item.label}</span>
                        <span className="font-semibold text-[#D65151]">{item.score}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
