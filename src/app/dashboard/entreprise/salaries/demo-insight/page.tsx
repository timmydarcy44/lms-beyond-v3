"use client";

import React, { useMemo } from "react";
import { useRouter } from "next/navigation";
import EnterpriseSidebar from "@/components/EnterpriseSidebar";
import { cn } from "@/lib/utils";
import { AlertTriangle, ChevronRight } from "lucide-react";
import {
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
} from "recharts";

type DimensionKey = "stress" | "organisation" | "communication" | "decision" | "leadership";
type DimScore = { key: DimensionKey; label: string; score: number };

function clamp01(n: number) {
  return Math.min(1, Math.max(0, n));
}

function scoreToVigilance(stressScore: number | null | undefined) {
  const v = typeof stressScore === "number" ? stressScore : null;
  if (v == null) return { label: "Attention", tone: "amber" as const, emoji: "🟡" };
  if (v < 30) return { label: "Critique", tone: "red" as const, emoji: "🔴" };
  if (v < 60) return { label: "Attention", tone: "amber" as const, emoji: "🟡" };
  return { label: "OK", tone: "emerald" as const, emoji: "🟢" };
}

function MiniBar({ label, score }: { label: string; score: number }) {
  const tone = score < 40 ? "red" : score < 60 ? "amber" : "emerald";
  const fill =
    tone === "red" ? "bg-red-500" : tone === "amber" ? "bg-amber-500" : "bg-emerald-500";
  const qualifier = score < 50 ? "Sous le seuil recommandé" : score > 70 ? "Optimal" : "";
  return (
    <div>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="text-xs font-bold uppercase tracking-widest text-gray-500">{label}</div>
          {qualifier ? <div className="text-xs font-semibold text-gray-500">{qualifier}</div> : null}
        </div>
        <div className="text-sm font-black text-gray-900">{score}</div>
      </div>
      <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-gray-100">
        <div
          className={cn("h-full rounded-full", fill)}
          style={{ width: `${Math.round(clamp01(score / 100) * 100)}%` }}
        />
      </div>
    </div>
  );
}

function ProgressRing({ value }: { value: number }) {
  const size = 84;
  const stroke = 10;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const pct = clamp01(value / 100);
  const dash = c * (1 - pct);
  return (
    <div className="relative h-[84px] w-[84px]">
      <svg width={size} height={size} className="block">
        <circle cx={size / 2} cy={size / 2} r={r} stroke="#E5E7EB" strokeWidth={stroke} fill="none" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke="url(#idmc)"
          strokeWidth={stroke}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={dash}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
        <defs>
          <linearGradient id="idmc" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#1E3A8A" />
            <stop offset="1" stopColor="#6D28D9" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute inset-0 grid place-items-center">
        <div className="text-center">
          <div className="text-2xl font-black tracking-tight text-gray-950">{Math.round(value)}</div>
          <div className="text-[10px] font-bold uppercase tracking-widest text-gray-500">IDMC</div>
        </div>
      </div>
    </div>
  );
}

function SoftSkillsRadar({ data }: { data: Array<{ skill: string; score: number }> }) {
  return (
    <div className="h-[260px]">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart data={data}>
          <PolarGrid stroke="rgba(15,23,42,0.10)" />
          <PolarAngleAxis dataKey="skill" tick={{ fill: "rgba(15,23,42,0.75)", fontSize: 10 }} />
          <PolarRadiusAxis domain={[0, 100]} tick={false} />
          {/* Zone de rupture (scores < 40) */}
          {/* eslint-disable-next-line react/no-unknown-property */}
          <circle cx="50%" cy="50%" r="22%" fill="rgba(244,63,94,0.12)" />
          {/* eslint-disable-next-line react/no-unknown-property */}
          <text x="50%" y="52%" textAnchor="middle" fill="rgba(244,63,94,0.65)" fontSize="10" fontWeight="700">
            Zone de Rupture
          </text>
          <Radar dataKey="score" stroke="#4F46E5" fill="rgba(79,70,229,0.22)" strokeWidth={2} />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}

export default function DemoInsightPage() {
  const router = useRouter();

  // Données forcées (démo) : Charlie Morel + stress critique + IDMC 58
  const displayEmployee = useMemo(
    () => ({ first_name: "Charlie", last_name: "Morel", role: "UX Designer", department: "Produit" }),
    [],
  );

  const idmc = 58;
  const dims: DimScore[] = [
    { key: "stress", label: "Stress", score: 22 },
    { key: "organisation", label: "Organisation", score: 64 },
    { key: "communication", label: "Communication", score: 58 },
    { key: "decision", label: "Décision", score: 52 },
    { key: "leadership", label: "Leadership", score: 60 },
  ];

  const radarData = dims.map((d) => ({ skill: d.label, score: d.score }));
  const vigilance = scoreToVigilance(dims.find((d) => d.key === "stress")?.score ?? null);

  const strengths = ["Communique de façon fluide et constructive.", "Travaille mieux avec des priorités claires.", "Posture stable en décision quand le cadre est posé."];
  const watchouts = ["Risque de surcharge cognitive si le rythme s’accélère.", "Besoin de pauses courtes pour maintenir la qualité.", "Sensibilité aux ambiguïtés (priorités floues)."];

  const aiInsight =
    "Ce collaborateur performe mieux dans un cadre structuré et prévisible. Quand la charge s’accélère, le stress devient le principal frein — à traiter avant d’exiger plus.";

  const actionBlock = {
    id: "demo-stress",
    title: "Coaching 1:1 recommandé",
    dimension_key: "stress",
    description: "Un atelier collectif est recommandé si plusieurs signaux convergent.",
  };

  return (
    <div className="flex min-h-screen bg-white font-sans text-gray-900 selection:bg-indigo-100 selection:text-indigo-900">
      <EnterpriseSidebar />
      <main className="relative z-10 flex-1 px-8 py-10 lg:pl-[280px]">
        <header className="mb-10 flex flex-wrap items-end justify-between gap-6">
          <div className="min-w-0">
            <p className="text-xs font-bold uppercase tracking-widest text-gray-500">Démo</p>
            <h1 className="mt-2 text-4xl font-black tracking-tight text-gray-950">
              {displayEmployee.first_name} {displayEmployee.last_name}
            </h1>
            <div className="mt-3 flex flex-wrap gap-2 text-sm text-gray-600">
              <span className="rounded-full border border-gray-200 bg-white px-3 py-1">{displayEmployee.role}</span>
              <span className="rounded-full border border-gray-200 bg-white px-3 py-1">{displayEmployee.department}</span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => router.push("/dashboard/entreprise")}
            className="rounded-full border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
          >
            ← Retour
          </button>
        </header>

        <section className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="rounded-3xl border border-gray-200 bg-white p-8 shadow-sm">
            <div className="flex items-start justify-between gap-6">
              <div>
                <div className="text-xs font-bold uppercase tracking-widest text-gray-500">Score global</div>
                <div className="mt-2 text-2xl font-black tracking-tight text-gray-950">IDMC</div>
                <p className="mt-2 text-sm text-gray-600">Synthèse de fonctionnement, compréhension, décision et activation.</p>
              </div>
              <ProgressRing value={idmc} />
            </div>
            <div className="mt-6 flex items-center justify-between">
              <div className="text-xs font-bold uppercase tracking-widest text-gray-500">Vigilance</div>
              <div
                className={cn(
                  "rounded-full px-4 py-2 text-sm font-black",
                  vigilance.tone === "emerald" && "bg-emerald-50 text-emerald-700",
                  vigilance.tone === "amber" && "bg-amber-50 text-amber-800",
                  vigilance.tone === "red" && "bg-red-50 text-red-700",
                )}
              >
                {vigilance.emoji} {vigilance.label}
              </div>
            </div>
            <p className="mt-4 text-xs text-gray-500">
              Démo volontaire : IDMC correct mais stress critique → priorité au contexte managérial.
            </p>
          </div>

          <div className="rounded-3xl border border-gray-200 bg-white p-8 shadow-sm lg:col-span-2">
            <h2 className="text-xl font-black tracking-tight text-gray-950">Profil synthétique</h2>
            <p className="mt-2 text-sm text-gray-600">Fonctionnement du collaborateur, en langage simple.</p>

            <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2">
              <div className="rounded-3xl border border-emerald-200 bg-emerald-50/40 p-6">
                <div className="text-xs font-black uppercase tracking-widest text-emerald-700">Forces</div>
                <ul className="mt-4 space-y-3 text-sm text-emerald-900">
                  {strengths.slice(0, 3).map((s) => (
                    <li key={s} className="flex items-start gap-3">
                      <span className="mt-1 h-2.5 w-2.5 rounded-full bg-emerald-500" aria-hidden />
                      <span>{s}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="rounded-3xl border border-amber-200 bg-amber-50/40 p-6">
                <div className="text-xs font-black uppercase tracking-widest text-amber-800">Points de vigilance</div>
                <ul className="mt-4 space-y-3 text-sm text-amber-900">
                  {watchouts.slice(0, 3).map((s) => (
                    <li key={s} className="flex items-start gap-3">
                      <span className="mt-1 h-2.5 w-2.5 rounded-full bg-amber-500" aria-hidden />
                      <span>{s}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="rounded-3xl border border-gray-200 bg-white p-8 shadow-sm lg:col-span-2">
            <h2 className="text-xl font-black tracking-tight text-gray-950">Dimensions clés</h2>
            <p className="mt-2 text-sm text-gray-600">Radar + repères lisibles pour décider vite.</p>
            <div className="mt-6">
              <SoftSkillsRadar data={radarData} />
            </div>
            <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
              {dims.map((d) => (
                <MiniBar key={d.key} label={d.label} score={Math.round(d.score)} />
              ))}
            </div>
          </div>

          <div className="rounded-3xl border border-gray-200 bg-white p-8 shadow-sm">
            <h2 className="text-xl font-black tracking-tight text-gray-950">Insights & recommandations</h2>
            <div className="mt-5 rounded-3xl border border-gray-200 bg-gray-50/60 p-6">
              <div className="text-xs font-black uppercase tracking-widest text-gray-500">Insight IA</div>
              <p className="mt-3 text-sm text-gray-700">{aiInsight}</p>
            </div>

            <div className="mt-5 rounded-3xl border border-indigo-200 bg-indigo-50 p-6">
              <div className="text-xs font-black uppercase tracking-widest text-indigo-900">Action recommandée</div>
              <p className="mt-3 text-sm font-bold text-indigo-950">{actionBlock.title}</p>
              <p className="mt-2 text-sm text-indigo-900/80">{actionBlock.description}</p>
              <button
                type="button"
                onClick={() => router.push("/dashboard/entreprise/actions/demo-stress")}
                className="mt-5 inline-flex items-center gap-2 rounded-2xl bg-gray-950 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-gray-900"
              >
                Accéder aux Experts Qualifiés <ChevronRight className="h-4 w-4" aria-hidden />
              </button>
              <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50/60 p-5">
                <div className="text-xs font-black uppercase tracking-widest text-emerald-800">Impact Business estimé</div>
                <p className="mt-2 text-sm font-semibold text-emerald-950">
                  Réduction du risque d&apos;absentéisme et gain de productivité estimé : +15% sur le trimestre.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="rounded-3xl border border-gray-200 bg-white p-8 shadow-sm">
            <h3 className="text-lg font-black tracking-tight text-gray-950">Autonome</h3>
            <p className="mt-2 text-sm text-gray-600">Micro-parcours et exercices ciblés (5 min).</p>
            <div className="mt-5 space-y-3">
              {["Respiration & pause", "Priorisation (1 chose)", "Feedback simple"].map((t) => (
                <div key={t} className="rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm font-semibold text-gray-800">
                  {t}
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-3xl border border-gray-200 bg-white p-8 shadow-sm">
            <h3 className="text-lg font-black tracking-tight text-gray-950">Accompagné</h3>
            <p className="mt-2 text-sm text-gray-600">Accès aux experts recommandés après prescription.</p>
            <button
              type="button"
              onClick={() => router.push(`/dashboard/entreprise?recommendedActionId=${encodeURIComponent(actionBlock.id)}`)}
              className="mt-5 w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm font-bold text-gray-950 transition hover:bg-gray-50"
            >
              Accéder aux experts recommandés
            </button>
            <div className="mt-4 flex items-start gap-3 rounded-2xl border border-gray-200 bg-gray-50/60 p-4 text-sm text-gray-700">
              <AlertTriangle className="mt-0.5 h-4 w-4 text-gray-500" aria-hidden />
              <span>Pas de marketplace : l’accès experts reste réservé au tunnel de recommandation Beyond.</span>
            </div>
          </div>

          <div className="rounded-3xl border border-gray-200 bg-white p-8 shadow-sm">
            <h3 className="text-lg font-black tracking-tight text-gray-950">Historique</h3>
            <p className="mt-2 text-sm text-gray-600">Diagnostics passés & actions engagées.</p>
            <div className="mt-5 space-y-4">
              {[
                { date: "31 mars 2026", idmc: 58, stress: 22 },
                { date: "15 fév. 2026", idmc: 62, stress: 44 },
                { date: "10 janv. 2026", idmc: 65, stress: 55 },
              ].map((d) => (
                <div key={d.date} className="flex items-start justify-between gap-4">
                  <div>
                    <div className="text-sm font-bold text-gray-900">{d.date}</div>
                    <div className="mt-1 text-xs text-gray-500">IDMC {d.idmc} · Stress {d.stress}</div>
                  </div>
                  <div className="h-2.5 w-2.5 rounded-full bg-gray-300" aria-hidden />
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

