"use client";

import { useState } from "react";
import {
  Brain,
  Calendar,
  GraduationCap,
  HeartHandshake,
  Rocket,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import {
  PolarAngleAxis,
  PolarGrid,
  Radar,
  RadarChart,
  ResponsiveContainer,
} from "recharts";

const mockData = {
  identite: {
    nom: "Jade Letellier",
    cursus: "BTS MCO2",
    suivi: "Régulier",
    referent: "Mme CONTENTIN",
    verbatim: "J’ai l’impression d’avoir évolué grandi et m’être senti comprise.",
  },
  focus: ["Confiance en soi", "Estime de soi", "Fiches de révision"],
  handicap: {
    mai: "Visuel & Kinesthésique (besoin de schémas et manipulation)",
    stress: "4/10 (stable, vigilance en période d'examens)",
    dys: "Signaux de Dyslexie (lenteur de lecture, polices adaptées)",
    disc: "Stable (cadre sécurisant, consignes claires)",
  },
  softSkills: [
    { subject: "Écoute", A: 90 },
    { subject: "Adaptabilité", A: 75 },
    { subject: "Organisation", A: 40 },
    { subject: "Communication", A: 65 },
    { subject: "Résilience", A: 85 },
  ],
  accommodations: [
    "Tiers-temps sur les évaluations",
    "Consignes reformulées en entreprise",
    "Supports visuels structurés",
    "Rituels de préparation avant examens",
  ],
};

export default function CentrePilotageHandicap() {
  const [showPlan, setShowPlan] = useState(false);

  return (
    <div
      className="min-h-screen bg-[#F5F5F7] px-4 py-8 text-slate-900 md:px-8"
      style={{ fontFamily: "Inter, system-ui, sans-serif" }}
    >
      <div className="mx-auto w-full max-w-[1200px] space-y-6">
        <header className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50">
              <ShieldCheck className="h-6 w-6 text-indigo-600" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Beyond Care</p>
              <h1 className="text-2xl font-semibold">{mockData.identite.nom}</h1>
              <p className="text-sm text-slate-500">{mockData.identite.cursus}</p>
            </div>
          </div>
          <div className="text-sm text-slate-500">
            Référente : <span className="font-semibold text-slate-900">{mockData.identite.referent}</span>
          </div>
        </header>

        <section className="grid gap-4 md:grid-cols-3">
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-slate-500">
              <Sparkles className="h-4 w-4 text-indigo-500" />
              Soft Skills
            </div>
            <div className="mt-4 h-48">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={mockData.softSkills}>
                  <PolarGrid stroke="#E2E8F0" />
                  <PolarAngleAxis dataKey="subject" tick={{ fill: "#64748B", fontSize: 10 }} />
                  <Radar dataKey="A" stroke="#4F46E5" fill="rgba(79,70,229,0.2)" />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-slate-500">
              <Brain className="h-4 w-4 text-indigo-500" />
              Profil cognitif & handicap
            </div>
            <div className="mt-4 space-y-3 text-sm">
              {[
                { label: "MAI", value: mockData.handicap.mai, icon: Brain },
                { label: "Stress", value: mockData.handicap.stress, icon: HeartHandshake },
                { label: "DYS", value: mockData.handicap.dys, icon: ShieldCheck },
                { label: "DISC", value: mockData.handicap.disc, icon: GraduationCap },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <div
                    key={item.label}
                    className="flex items-start justify-between rounded-lg border border-slate-100 bg-slate-50 px-3 py-2"
                  >
                    <div className="flex items-center gap-2">
                      <Icon className="mt-0.5 h-4 w-4 text-indigo-500" />
                      <span className="font-semibold text-slate-900">{item.label}</span>
                    </div>
                    <span className="text-slate-600">{item.value}</span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-slate-500">
              <HeartHandshake className="h-4 w-4 text-indigo-500" />
              Signaux faibles
            </div>
            <p className="mt-3 text-sm text-slate-600">{mockData.identite.verbatim}</p>
            <div className="mt-4 flex flex-wrap gap-2 text-xs">
              {mockData.focus.map((item) => (
                <span key={item} className="rounded-full bg-indigo-50 px-3 py-1 text-indigo-700">
                  {item}
                </span>
              ))}
            </div>
          </div>
        </section>

        <section className="grid gap-3 md:grid-cols-2">
          <button
            type="button"
            onClick={() => setShowPlan((prev) => !prev)}
            className="flex items-center justify-between rounded-xl bg-indigo-600 px-6 py-4 text-left text-white shadow-sm"
          >
            <span className="text-sm font-semibold">
              Comment améliorer la scolarité et l'alternance de ce jeune ?
            </span>
            <Rocket className="h-5 w-5" />
          </button>
          <button
            type="button"
            className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-6 py-4 text-left text-slate-900 shadow-sm"
          >
            <span className="text-sm font-semibold">Prendre rendez-vous avec la psychopédagogue</span>
            <Calendar className="h-5 w-5 text-indigo-600" />
          </button>
        </section>

        {showPlan ? (
          <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Plan d'aménagement</p>
            <ul className="mt-4 space-y-2 text-sm text-slate-700">
              {mockData.accommodations.map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <Sparkles className="mt-0.5 h-4 w-4 text-indigo-500" />
                  {item}
                </li>
              ))}
            </ul>
          </section>
        ) : null}
      </div>
    </div>
  );
}
