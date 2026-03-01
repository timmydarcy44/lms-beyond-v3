"use client";

import {
  Calendar,
  GraduationCap,
  Rocket,
  ShieldCheck,
  Sparkles,
  UserCircle,
} from "lucide-react";
import {
  PolarAngleAxis,
  PolarGrid,
  Radar,
  RadarChart,
  ResponsiveContainer,
} from "recharts";

const defaultData = {
  eleve: {
    nom: "Jade Letellier",
    cursus: "BTS MCO2",
    suivi: "Régulier",
    referent: "Mme CONTENTIN",
    verbatim: "J'ai l'impression d'avoir évolué, grandi et m'être sentie comprise.",
  },
  scores: {
    disc: { profil: "Stable / Consciencieux", couleur: "Vert/Bleu" },
    soft_skills: [
      { subject: "Adaptabilité", A: 85 },
      { subject: "Écoute", A: 95 },
      { subject: "Organisation", A: 70 },
      { subject: "Communication", A: 60 },
      { subject: "Résilience", A: 90 },
    ],
    tests: {
      mai: "Visuel / Kinesthésique",
      stress: "4/10 (Géré)",
      dys: "Aucun signal majeur",
    },
    focus: ["Confiance en soi", "Estime de soi", "Fiches de révision"],
  },
};

export default function PilotageBeyondCare() {
  return (
    <div
      className="min-h-screen bg-[#F5F5F7] font-sans text-[#1D1D1F]"
      style={{ fontFamily: "Inter, system-ui, sans-serif" }}
    >
      <div className="flex min-h-screen">
        <aside className="hidden w-64 flex-col border-r border-[#E5E5EA] bg-white px-6 py-8 md:flex">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-indigo-600" />
            <p className="text-sm font-semibold">Beyond Care</p>
          </div>
          <div className="mt-6 space-y-3 text-sm text-[#86868B]">
            <div className="flex items-center gap-2">
              <UserCircle className="h-4 w-4" />
              <span>Centre individuel</span>
            </div>
            <div className="flex items-center gap-2">
              <GraduationCap className="h-4 w-4" />
              <span>Suivi scolaire</span>
            </div>
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4" />
              <span>Data 360°</span>
            </div>
          </div>
        </aside>

        <main className="flex-1 px-4 py-8 md:px-8">
          <div className="mx-auto w-full max-w-[1200px] space-y-6">
            <header className="rounded-xl border border-[#E5E5EA] bg-white p-6 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-[#86868B]">Centre de pilotage</p>
                  <h1 className="mt-2 text-2xl font-semibold">{defaultData.eleve.nom}</h1>
                  <p className="mt-1 text-sm text-[#86868B]">{defaultData.eleve.cursus}</p>
                </div>
                <div className="text-sm text-[#86868B]">
                  Référente :{" "}
                  <span className="font-semibold text-[#1D1D1F]">{defaultData.eleve.referent}</span>
                </div>
              </div>
            </header>

            <section className="grid gap-4 md:grid-cols-3">
              <div className="rounded-xl border border-[#E5E5EA] bg-white p-5 shadow-sm">
                <p className="text-xs uppercase tracking-[0.2em] text-[#86868B]">Profil DISC</p>
                <div className="mt-4 flex items-center justify-between">
                  <div>
                    <p className="text-lg font-semibold">{defaultData.scores.disc.profil}</p>
                    <p className="text-xs text-[#86868B]">Couleur : {defaultData.scores.disc.couleur}</p>
                  </div>
                  <div className="h-12 w-12 rounded-full bg-gradient-to-br from-emerald-400 to-blue-500" />
                </div>
              </div>
              <div className="rounded-xl border border-[#E5E5EA] bg-white p-5 shadow-sm">
                <p className="text-xs uppercase tracking-[0.2em] text-[#86868B]">Suivi</p>
                <p className="mt-3 text-lg font-semibold">{defaultData.eleve.suivi}</p>
                <p className="mt-2 text-sm text-[#86868B]">{defaultData.eleve.verbatim}</p>
              </div>
              <div className="rounded-xl border border-[#E5E5EA] bg-white p-5 shadow-sm">
                <p className="text-xs uppercase tracking-[0.2em] text-[#86868B]">Focus</p>
                <div className="mt-3 flex flex-wrap gap-2 text-xs">
                  {defaultData.scores.focus.map((item) => (
                    <span key={item} className="rounded-full bg-[#F5F5F7] px-3 py-1">
                      {item}
                    </span>
                  ))}
                </div>
              </div>
            </section>

            <section className="grid gap-4 md:grid-cols-2">
              <div className="rounded-xl border border-[#E5E5EA] bg-white p-5 shadow-sm">
                <p className="text-xs uppercase tracking-[0.2em] text-[#86868B]">Soft Skills</p>
                <div className="mt-4 h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart data={defaultData.scores.soft_skills}>
                      <PolarGrid stroke="#E5E5EA" />
                      <PolarAngleAxis dataKey="subject" tick={{ fill: "#86868B", fontSize: 10 }} />
                      <Radar dataKey="A" stroke="#4F46E5" fill="rgba(79,70,229,0.2)" />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="rounded-xl border border-[#E5E5EA] bg-white p-5 shadow-sm">
                <p className="text-xs uppercase tracking-[0.2em] text-[#86868B]">Signaux faibles</p>
                <div className="mt-4 grid gap-3 text-sm">
                  <div className="flex items-center justify-between rounded-lg border border-[#E5E5EA] px-4 py-3">
                    <span>MAI</span>
                    <span className="text-[#1D1D1F]">{defaultData.scores.tests.mai}</span>
                  </div>
                  <div className="flex items-center justify-between rounded-lg border border-[#E5E5EA] px-4 py-3">
                    <span>Stress</span>
                    <span className="text-[#1D1D1F]">{defaultData.scores.tests.stress}</span>
                  </div>
                  <div className="flex items-center justify-between rounded-lg border border-[#E5E5EA] px-4 py-3">
                    <span>DYS</span>
                    <span className="text-[#1D1D1F]">{defaultData.scores.tests.dys}</span>
                  </div>
                </div>
              </div>
            </section>

            <section className="grid gap-3 md:grid-cols-2">
              <button
                type="button"
                className="flex items-center justify-between rounded-xl bg-indigo-600 px-6 py-4 text-left text-white shadow-sm"
              >
                <span className="text-sm font-semibold">Optimiser la scolarité et l'alternance</span>
                <Rocket className="h-5 w-5" />
              </button>
              <button
                type="button"
                className="flex items-center justify-between rounded-xl border border-[#E5E5EA] bg-white px-6 py-4 text-left text-[#1D1D1F] shadow-sm"
              >
                <span className="text-sm font-semibold">Réserver un créneau avec Mme CONTENTIN</span>
                <Calendar className="h-5 w-5 text-indigo-600" />
              </button>
            </section>
          </div>
        </main>
      </div>
    </div>
  );
}
