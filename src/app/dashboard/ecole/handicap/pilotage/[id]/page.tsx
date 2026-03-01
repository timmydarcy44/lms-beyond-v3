"use client";

import { useState } from "react";
import {
  AlertCircle,
  BarChart3,
  Calendar,
  Download,
  Layers,
  NotebookPen,
  ShieldCheck,
  Target,
  TrendingDown,
  TrendingUp,
  UserSquare2,
} from "lucide-react";
import { PolarAngleAxis, PolarGrid, Radar, RadarChart, ResponsiveContainer, Tooltip } from "recharts";
import { mockUsers } from "@/lib/mocks/appData";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

type PageProps = {
  params: { id: string };
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

const buildRadarData = () =>
  softSkillsCatalog.flatMap((group) => group.items.map((item) => ({ subject: item.label, A: item.score })));

export default function HandicapPilotagePage({ params }: PageProps) {
  const supabase = createSupabaseBrowserClient();
  const profile =
    mockUsers.find((user) => user.id === params.id) ||
    mockUsers.find((user) => `${user.first_name} ${user.last_name}`.toLowerCase().includes("valentin"));
  const displayName = profile ? `${profile.first_name} ${profile.last_name}` : "Valentin Lamaille";
  const avatar =
    profile?.avatar_url ||
    "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80";
  const radarData = buildRadarData();
  const stressScore = 16;
  const dysConcentration = "Souvent";
  const [syntheseIA, setSyntheseIA] = useState(
    String((profile as Record<string, unknown> | null)?.synthese_ia_profonde ?? "") ||
      "Profil stable (Test comportemental) avec une forte autonomie cognitive (MAI), nécessitant un cadre structuré pour compenser les difficultés de planification identifiées (DYS/MAI)."
  );
  const [analysisStatus, setAnalysisStatus] = useState<null | string>(null);
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [rqthUploaded, setRqthUploaded] = useState(true);
  const [posteAdapte, setPosteAdapte] = useState(false);
  const [suiviPsy, setSuiviPsy] = useState(false);
  const [contactJessica, setContactJessica] = useState(false);
  const [consentRgpdStatus, setConsentRgpdStatus] = useState<"À demander" | "En attente" | "Validé">("À demander");
  const [journalEntries, setJournalEntries] = useState([
    { date: "15/02/2026", type: "RDV Psy", content: "Bilan trimestriel" },
    { date: "02/02/2026", type: "Call Entreprise", content: "Alignement sur les adaptations" },
    { date: "15/01/2026", type: "Dépôt MDPH", content: "Dossier transmis" },
  ]);
  const [newRdvType, setNewRdvType] = useState("");
  const [newRdvDate, setNewRdvDate] = useState("");
  const [newRdvContent, setNewRdvContent] = useState("");

  const handleGenerateAnalysis = async () => {
    setAnalysisLoading(true);
    setAnalysisStatus(null);
    try {
      const payload = {
        first_name: profile?.first_name || "Valentin",
        disc_profile: profile?.disc_profile || "Stable",
        mai_scores: { declarative: true, procedures: true, planification: false },
        stress_level: stressScore,
        dys_indicators: { concentration: dysConcentration },
        soft_skills: radarData,
      };
      const res = await fetch("/api/beyond-care/profile-analysis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || "Erreur IA");
      }
      const summary = data?.analysis || data?.summary || "";
      if (summary) {
        setSyntheseIA(summary);
      }
      await supabase
        ?.from("apprenants")
        .upsert(
          {
            id: profile?.id,
            synthese_ia_profonde: summary,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "id" }
        );
      setAnalysisStatus("Synthèse IA enregistrée.");
    } catch (error) {
      console.error(error);
      setAnalysisStatus("Impossible de générer la synthèse IA.");
    } finally {
      setAnalysisLoading(false);
    }
  };

  const handleRgpdConsent = async () => {
    const nextStatus = consentRgpdStatus === "Validé" ? "Validé" : "En attente";
    setConsentRgpdStatus(nextStatus);
    try {
      await supabase
        ?.from("apprenants")
        .upsert(
          {
            id: profile?.id,
            consentement_rgpd: nextStatus,
            consentement_rgpd_at: new Date().toISOString(),
          },
          { onConflict: "id" }
        );
    } catch (error) {
      console.error(error);
    }
  };

  const handleAddJournal = async () => {
    if (!newRdvType || !newRdvDate || !newRdvContent) return;
    const entry = { date: newRdvDate, type: newRdvType, content: newRdvContent };
    setJournalEntries((prev) => [entry, ...prev]);
    setNewRdvType("");
    setNewRdvDate("");
    setNewRdvContent("");
    try {
      await supabase?.from("journal_suivi").insert({
        apprenant_id: profile?.id,
        type: entry.type,
        date: entry.date,
        content: entry.content,
      });
    } catch (error) {
      console.error(error);
    }
  };

  const handleUploadRqth = async () => {
    setRqthUploaded(true);
    try {
      await supabase
        ?.from("apprenants")
        .upsert({ id: profile?.id, rqth_uploaded: true }, { onConflict: "id" });
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F5F7] px-4 py-8 text-[#1D1D1F] md:px-8">
      <div className="mx-auto w-full max-w-[1200px] space-y-6">
        <header className="rounded-2xl border border-[#E5E5EA] bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <img src={avatar} alt={displayName} className="h-16 w-16 rounded-full border border-[#E5E5EA]" />
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-[#D65151]">COCKPIT DE PILOTAGE</p>
                <h1 className="text-2xl font-semibold text-[#1D1D1F]">{displayName}</h1>
                <p className="text-sm text-[#86868B]">BTS MCO 1</p>
              </div>
              <span className="rounded-full border border-[#D65151] px-3 py-1 text-xs font-semibold text-[#D65151]">
                80% Complet
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handleGenerateAnalysis}
                className="inline-flex items-center gap-2 rounded-full bg-[#D65151] px-4 py-2 text-xs font-semibold text-white"
              >
                Demande d&apos;analyse du profil
              </button>
              <button className="inline-flex items-center gap-2 rounded-full border border-[#D65151] px-4 py-2 text-xs font-semibold text-[#D65151]">
                <Download className="h-4 w-4" />
                Exporter en PDF ✨
              </button>
            </div>
          </div>
          {analysisLoading ? (
            <p className="mt-3 text-xs text-[#D65151]">Analyse en cours...</p>
          ) : analysisStatus ? (
            <p className="mt-3 text-xs text-[#86868B]">{analysisStatus}</p>
          ) : null}
        </header>

        <section className="grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl border border-[#E5E5EA] bg-white p-5 shadow-sm">
            <div className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-[#D65151]">
              <Target className="h-4 w-4 text-[#D65151]" />
              Synthèse IA
            </div>
            <p className="mt-4 text-sm text-[#86868B]">
              {syntheseIA}
            </p>
            <div className="mt-4 space-y-2 text-xs text-[#86868B]">
              <div className="flex items-center justify-between rounded-xl bg-[#F5F5F7] px-3 py-2">
                <span>Stress</span>
                <span className="inline-flex items-center gap-2 text-[#D65151]">
                  <span className="h-2 w-2 rounded-full bg-orange-400" />
                  Score {stressScore}
                </span>
              </div>
              <div className="flex items-center justify-between rounded-xl bg-[#F5F5F7] px-3 py-2">
                <span>DYS · Concentration</span>
                <span className="inline-flex items-center gap-2 text-[#D65151]">
                  <span className="h-2 w-2 rounded-full bg-[#D65151]" />
                  {dysConcentration}
                </span>
              </div>
              <div className="flex items-center justify-between rounded-xl bg-[#F5F5F7] px-3 py-2">
                <span>MAI · Planification</span>
                <span className="inline-flex items-center gap-2 text-[#D65151]">
                  <span className="h-2 w-2 rounded-full bg-[#D65151]" />
                  Non
                </span>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-[#E5E5EA] bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <p className="text-xs uppercase tracking-[0.2em] text-[#D65151]">Radar Soft Skills</p>
              <BarChart3 className="h-4 w-4 text-[#D65151]" />
            </div>
            {radarData.length ? (
              <div className="mt-4 h-[400px]">
                <ResponsiveContainer width="100%" height={400}>
                  <RadarChart data={radarData}>
                    <PolarGrid stroke="#E2E8F0" />
                    <PolarAngleAxis dataKey="subject" tick={{ fill: "#64748B", fontSize: 9 }} />
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
                Analyse des Soft Skills en cours...
              </div>
            )}
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl border border-[#E5E5EA] bg-white p-5 shadow-sm">
            <div className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-[#D65151]">
              <Target className="h-4 w-4 text-[#D65151]" />
              Dossier administratif RQTH
            </div>
            <div className="mt-4 space-y-2 text-sm text-[#86868B]">
              <div className="flex items-center justify-between rounded-xl bg-[#F5F5F7] px-3 py-2">
                <span>Statut</span>
                <span className="text-[#D65151]">{rqthUploaded ? "✅ Obtenue (Expire 01/2028)" : "À compléter"}</span>
              </div>
              <div className="flex items-center justify-between rounded-xl bg-[#F5F5F7] px-3 py-2">
                <span>Tiers-temps examens</span>
                <span>✅</span>
              </div>
              <div className="flex items-center justify-between rounded-xl bg-[#F5F5F7] px-3 py-2">
                <span>Poste adapté</span>
                <span>{posteAdapte ? "✅" : "⚠️"}</span>
              </div>
              <div className="flex items-center justify-between rounded-xl bg-[#F5F5F7] px-3 py-2">
                <span>Suivi psychopédagogue</span>
                <span>{suiviPsy ? "✅" : "—"}</span>
              </div>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setShowUploadModal(true)}
                className="inline-flex items-center gap-2 rounded-full border border-[#D65151] px-3 py-1 text-xs font-semibold text-[#D65151]"
              >
                Uploader des documents
              </button>
              <button
                type="button"
                onClick={() => setContactJessica((prev) => !prev)}
                className="inline-flex items-center gap-2 rounded-full border border-[#E5E5EA] px-3 py-1 text-xs font-semibold text-[#86868B]"
              >
                {contactJessica ? "Contact Jessica établi" : "Déclarer contact Jessica"}
              </button>
            </div>
          </div>
          <div className="rounded-2xl border border-[#E5E5EA] bg-white p-5 shadow-sm">
            <div className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-[#D65151]">
              <AlertCircle className="h-4 w-4 text-[#D65151]" />
              Alertes actives
            </div>
            <div className="mt-4 space-y-2 text-sm text-[#86868B]">
              <div className="rounded-xl bg-[#F5F5F7] px-3 py-2">🔴 RDV psychopédagogue non planifié</div>
              <div className="rounded-xl bg-[#F5F5F7] px-3 py-2">🟠 Entreprise non informée</div>
              <div className="rounded-xl bg-[#F5F5F7] px-3 py-2">🟢 Tiers-temps validé</div>
            </div>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-[#E5E5EA] bg-white p-5 shadow-sm">
            <div className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-[#D65151]">
              <ShieldCheck className="h-4 w-4 text-[#D65151]" />
              Confidentialité & RGPD
            </div>
            <div className="mt-4 space-y-2 text-sm text-[#86868B]">
              <div className="flex items-center justify-between rounded-xl bg-[#F5F5F7] px-3 py-2">
                <span>Référent CFA</span>
                <span>✅</span>
              </div>
              <div className="flex items-center justify-between rounded-xl bg-[#F5F5F7] px-3 py-2">
                <span>Psychopédagogue</span>
                <span>✅</span>
              </div>
              <div className="flex items-center justify-between rounded-xl bg-[#F5F5F7] px-3 py-2">
                <span>Formateurs</span>
                <span>❌</span>
              </div>
              <div className="flex items-center justify-between rounded-xl bg-[#F5F5F7] px-3 py-2">
                <span>Entreprise</span>
                <span>❌</span>
              </div>
            </div>
            <button
              type="button"
              onClick={handleRgpdConsent}
              className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-[#D65151] px-3 py-2 text-xs font-semibold text-[#D65151]"
            >
              Demander le consentement ({consentRgpdStatus})
            </button>
          </div>
          <div className="rounded-2xl border border-[#E5E5EA] bg-white p-5 shadow-sm">
            <div className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-[#D65151]">
              <UserSquare2 className="h-4 w-4 text-[#D65151]" />
              Suivi entreprise
            </div>
            <p className="mt-4 text-sm text-[#86868B]">Maître d’apprentissage : Mme Lefèvre · 06 45 22 13 89</p>
            <button className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#D65151] px-4 py-2 text-xs font-semibold text-white">
              <Calendar className="h-4 w-4" />
              Urgence : Aucun contact depuis 32 jours
            </button>
          </div>
          <div className="rounded-2xl border border-[#E5E5EA] bg-white p-5 shadow-sm">
            <div className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-[#D65151]">
              <TrendingUp className="h-4 w-4 text-[#D65151]" />
              Progression & ROI
            </div>
            <div className="mt-4 space-y-2 text-sm text-[#86868B]">
              <div className="flex items-center justify-between rounded-xl bg-[#F5F5F7] px-3 py-2">
                <span>Stress</span>
                <span>
                  7/10 → 4/10 <TrendingDown className="inline h-4 w-4 text-[#D65151]" />
                </span>
              </div>
              <div className="flex items-center justify-between rounded-xl bg-[#F5F5F7] px-3 py-2">
                <span>Satisfaction</span>
                <span>
                  3.2 → 4.6/5 <TrendingUp className="inline h-4 w-4 text-[#D65151]" />
                </span>
              </div>
              <div className="flex items-center justify-between rounded-xl bg-[#F5F5F7] px-3 py-2">
                <span>Absences</span>
                <span>8/mois → 2/mois ✅</span>
              </div>
              <div className="flex items-center justify-between rounded-xl bg-[#F5F5F7] px-3 py-2">
                <span>Résultats</span>
                <span>10.2 → 13.5/20 🚀</span>
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-[#E5E5EA] bg-white p-5 shadow-sm">
          <div className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-[#D65151]">
            <NotebookPen className="h-4 w-4 text-[#D65151]" />
            Journal de suivi
          </div>
          <div className="mt-4 rounded-2xl border border-[#E5E5EA] bg-[#F5F5F7] px-4 py-3 text-xs text-[#1D1D1F]">
            <span className="font-semibold">Prochain RDV :</span> 15/03/2026 - Psychopédagogue{" "}
            <span className="text-[#D65151]">⚠️ Dans 26 jours</span>
          </div>
          <div className="mt-4 grid gap-2 rounded-2xl border border-[#E5E5EA] bg-white p-3 text-xs text-[#86868B]">
            <div className="grid gap-2 md:grid-cols-3">
              <input
                value={newRdvType}
                onChange={(event) => setNewRdvType(event.target.value)}
                placeholder="Type"
                className="rounded-lg border border-[#E5E5EA] px-3 py-2 text-xs text-[#1D1D1F]"
              />
              <input
                value={newRdvDate}
                onChange={(event) => setNewRdvDate(event.target.value)}
                placeholder="Date (JJ/MM/AAAA)"
                className="rounded-lg border border-[#E5E5EA] px-3 py-2 text-xs text-[#1D1D1F]"
              />
              <input
                value={newRdvContent}
                onChange={(event) => setNewRdvContent(event.target.value)}
                placeholder="Contenu"
                className="rounded-lg border border-[#E5E5EA] px-3 py-2 text-xs text-[#1D1D1F]"
              />
            </div>
            <button
              type="button"
              onClick={handleAddJournal}
              className="inline-flex w-full items-center justify-center rounded-lg bg-[#D65151] px-3 py-2 text-xs font-semibold text-white"
            >
              + Nouveau rendez-vous
            </button>
          </div>
          <div className="mt-3 space-y-2 text-sm text-[#86868B]">
            {journalEntries.map((entry) => (
              <div key={`${entry.date}-${entry.type}`} className="rounded-xl bg-[#F5F5F7] px-3 py-2">
                {entry.date} · {entry.type} — {entry.content}
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-2xl border border-[#E5E5EA] bg-white p-5 shadow-sm">
          <div className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-[#D65151]">
            <Layers className="h-4 w-4 text-[#D65151]" />
            Méthodologie Beyond 360°
          </div>
          <p className="mt-4 text-sm text-[#86868B]">
            Notre IA croise 5 couches de données : Comportement (Test comportemental), Aptitudes (Soft Skills), Métacognition (MAI),
            Résilience (Stress) et Besoins Spécifiques (DYS) pour une vision holistique de l&apos;apprenant.
          </p>
        </section>

        <section className="grid gap-3 md:grid-cols-2">
          <button className="flex items-center justify-between rounded-xl bg-[#D65151] px-6 py-4 text-left text-white shadow-sm">
            <span className="text-sm font-semibold">Comment améliorer la scolarité et l&apos;alternance ?</span>
            <Target className="h-5 w-5" />
          </button>
          <button className="flex items-center justify-between rounded-xl border border-[#D65151] bg-white px-6 py-4 text-left text-[#D65151] shadow-sm">
            <span className="text-sm font-semibold">Prendre rendez-vous avec la psychopédagogue</span>
            <Calendar className="h-5 w-5 text-[#D65151]" />
          </button>
        </section>
      </div>
      {showUploadModal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between">
              <p className="text-xs uppercase tracking-[0.2em] text-[#D65151]">Uploader des documents</p>
              <button
                type="button"
                onClick={() => setShowUploadModal(false)}
                className="rounded-full border border-[#E5E5EA] px-3 py-1 text-xs font-semibold text-[#1D1D1F]"
              >
                Fermer
              </button>
            </div>
            <div className="mt-4 space-y-3 text-xs text-[#86868B]">
              <label className="flex items-center justify-between rounded-xl border border-[#E5E5EA] px-3 py-2">
                <span>RQTH</span>
                <button
                  type="button"
                  onClick={handleUploadRqth}
                  className="rounded-full border border-[#D65151] px-3 py-1 text-[10px] font-semibold text-[#D65151]"
                >
                  Marquer comme uploadé
                </button>
              </label>
              <label className="flex items-center justify-between rounded-xl border border-[#E5E5EA] px-3 py-2">
                <span>Poste adapté</span>
                <button
                  type="button"
                  onClick={() => setPosteAdapte(true)}
                  className="rounded-full border border-[#D65151] px-3 py-1 text-[10px] font-semibold text-[#D65151]"
                >
                  Valider
                </button>
              </label>
              <label className="flex items-center justify-between rounded-xl border border-[#E5E5EA] px-3 py-2">
                <span>Suivi psychopédagogique</span>
                <button
                  type="button"
                  onClick={() => setSuiviPsy(true)}
                  className={`rounded-full px-3 py-1 text-[10px] font-semibold ${
                    contactJessica
                      ? "border border-[#D65151] text-[#D65151]"
                      : "border border-[#E5E5EA] text-[#86868B]"
                  }`}
                  disabled={!contactJessica}
                >
                  {contactJessica ? "Activer" : "Contact Jessica requis"}
                </button>
              </label>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
