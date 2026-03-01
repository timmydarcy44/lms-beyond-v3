"use client";

import {
  Activity,
  Moon,
  Sparkles,
  Zap,
  BadgeCheck,
} from "lucide-react";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  PolarAngleAxis,
  PolarGrid,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

interface RadarMetric {
  metric: string;
  value: number;
  max: number;
}

interface WeeklyMetric {
  week: string;
  stress: number;
  cognitiveLoad: number;
}

interface KpiSet {
  sleepQuality: number;
  mentalLoad: number;
  flowState: "Faible" | "Stable" | "Optimal";
}

const radarData: RadarMetric[] = [
  { metric: "Focus", value: 78, max: 100 },
  { metric: "Régulation émotionnelle", value: 72, max: 100 },
  { metric: "Mémoire", value: 81, max: 100 },
  { metric: "Récupération", value: 64, max: 100 },
  { metric: "Adaptabilité", value: 76, max: 100 },
];

const weeklyData: WeeklyMetric[] = [
  { week: "Semaine 1", stress: 62, cognitiveLoad: 58 },
  { week: "Semaine 2", stress: 68, cognitiveLoad: 71 },
  { week: "Semaine 3", stress: 74, cognitiveLoad: 79 },
  { week: "Semaine 4", stress: 66, cognitiveLoad: 72 },
];

const kpis: KpiSet = {
  sleepQuality: 57,
  mentalLoad: 74,
  flowState: "Stable",
};

const player = {
  name: "Jessica Contentin",
  status: "Prêt pour la performance",
  lastUpdated: "Il y a 2h",
};

function getAdviceMessage(
  latestWeek: WeeklyMetric,
  sleepQuality: number
) {
  if (latestWeek.stress >= 80 || latestWeek.cognitiveLoad >= 80) {
    return "Semaine chargée : active le protocole de récupération mentale";
  }
  if (sleepQuality < 60) {
    return "Priorité sommeil : micro-ajustements ce soir";
  }
  return "Continue comme ça : maintien du rythme";
}

function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) {
    return null;
  }

  return (
    <div className="rounded-lg border border-white/10 bg-[#0b0b0b] px-3 py-2 text-xs text-white shadow-xl">
      <p className="mb-1 text-white/70">{label}</p>
      <div className="space-y-1">
        {payload.map((entry: any) => (
          <div key={entry.dataKey} className="flex items-center gap-2">
            <span
              className="h-2 w-2 rounded-full"
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-white/70">{entry.name}</span>
            <span className="font-semibold text-white">{entry.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function BeyondCareElitePage() {
  const todayLabel = new Date().toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  const latestWeek = weeklyData[weeklyData.length - 1];
  const adviceMessage = getAdviceMessage(latestWeek, kpis.sleepQuality);

  return (
    <div className="min-h-screen bg-[#050505] px-4 pb-16 pt-10 text-[#E5E7EB] md:px-10">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8">
        <header className="flex flex-col gap-4 rounded-2xl border border-white/10 bg-white/5 p-6 md:flex-row md:items-center md:justify-between">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 rounded-full border border-blue-500/40 bg-blue-500/10 px-3 py-1 text-xs font-semibold text-blue-300">
              <BadgeCheck className="h-4 w-4" />
              {player.status}
            </div>
            <h1 className="text-2xl font-semibold text-white md:text-3xl">
              Elite Performance — {player.name}
            </h1>
          </div>
          <div className="text-sm text-white/70">
            <p className="capitalize">{todayLabel}</p>
            <p className="text-white/40">
              Dernière mise à jour: {player.lastUpdated}
            </p>
          </div>
        </header>

        <section className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-white">
                Baseline Cognitif
              </h2>
              <span className="text-xs text-white/50">0 — 100</span>
            </div>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={radarData}>
                  <PolarGrid stroke="rgba(255,255,255,0.1)" />
                  <PolarAngleAxis
                    dataKey="metric"
                    tick={{ fill: "rgba(229,231,235,0.8)", fontSize: 12 }}
                  />
                  <Radar
                    name="Indice"
                    dataKey="value"
                    stroke="#3B82F6"
                    fill="rgba(59,130,246,0.4)"
                    strokeWidth={2}
                  />
                  <Tooltip content={<ChartTooltip />} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
            <div className="mb-4">
              <h2 className="text-lg font-semibold text-white">
                Baromètre Hebdo
              </h2>
              <p className="text-xs text-white/50">
                Stress vs Charge cognitive
              </p>
            </div>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={weeklyData}>
                  <CartesianGrid stroke="rgba(255,255,255,0.08)" />
                  <XAxis
                    dataKey="week"
                    tick={{ fill: "rgba(229,231,235,0.6)", fontSize: 12 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    domain={[0, 100]}
                    tick={{ fill: "rgba(229,231,235,0.6)", fontSize: 12 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip content={<ChartTooltip />} />
                  <Legend
                    verticalAlign="top"
                    align="right"
                    wrapperStyle={{ color: "rgba(229,231,235,0.6)" }}
                  />
                  <Line
                    type="monotone"
                    dataKey="stress"
                    name="Stress"
                    stroke="#3B82F6"
                    strokeWidth={2}
                    dot={{ r: 3 }}
                    activeDot={{ r: 6 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="cognitiveLoad"
                    name="Charge cognitive"
                    stroke="#60A5FA"
                    strokeWidth={2}
                    dot={{ r: 3 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </section>

        <section className="grid gap-6 md:grid-cols-3">
          <div className="group rounded-2xl border border-white/10 bg-white/5 p-5 transition duration-300 hover:shadow-[0_0_30px_rgba(59,130,246,0.25)]">
            <div className="flex items-center justify-between">
              <p className="text-sm text-white/60">Qualité du sommeil</p>
              <Moon className="h-5 w-5 text-blue-400" />
            </div>
            <p className="mt-4 text-3xl font-semibold text-white">
              {kpis.sleepQuality}%
            </p>
            <p className="mt-1 text-xs text-white/40">
              Moyenne sur 7 jours
            </p>
          </div>

          <div className="group rounded-2xl border border-white/10 bg-white/5 p-5 transition duration-300 hover:shadow-[0_0_30px_rgba(59,130,246,0.25)]">
            <div className="flex items-center justify-between">
              <p className="text-sm text-white/60">Charge mentale</p>
              <Activity className="h-5 w-5 text-blue-400" />
            </div>
            <p className="mt-4 text-3xl font-semibold text-white">
              {kpis.mentalLoad}%
            </p>
            <div className="mt-3 h-2 w-full rounded-full bg-white/10">
              <div
                className="h-2 rounded-full bg-[#3B82F6] shadow-[0_0_12px_rgba(59,130,246,0.6)]"
                style={{ width: `${kpis.mentalLoad}%` }}
              />
            </div>
            <p className="mt-2 text-xs text-white/40">
              Charge cognitive perçue
            </p>
          </div>

          <div className="group rounded-2xl border border-white/10 bg-white/5 p-5 transition duration-300 hover:shadow-[0_0_30px_rgba(59,130,246,0.25)]">
            <div className="flex items-center justify-between">
              <p className="text-sm text-white/60">État de flux</p>
              <Zap className="h-5 w-5 text-blue-400" />
            </div>
            <p className="mt-4 text-3xl font-semibold text-white">
              {kpis.flowState}
            </p>
            <div className="mt-3 flex items-center gap-2 text-xs text-white/40">
              <span className="h-2 w-2 rounded-full bg-blue-400" />
              <span>Activation stabilisée</span>
            </div>
          </div>
        </section>

        <section className="flex flex-col gap-4 rounded-2xl border border-blue-500/30 bg-gradient-to-r from-blue-500/10 via-white/5 to-transparent p-6">
          <div className="flex items-center gap-3">
            <Sparkles className="h-5 w-5 text-blue-300" />
            <h2 className="text-lg font-semibold text-white">
              Le conseil de Jessica
            </h2>
          </div>
          <p className="text-sm text-white/70">{adviceMessage}</p>
          <button
            type="button"
            className="inline-flex w-fit items-center gap-2 rounded-full bg-blue-500 px-5 py-2 text-sm font-semibold text-white transition hover:bg-blue-400"
          >
            <Zap className="h-4 w-4" />
            Voir le protocole
          </button>
        </section>
      </div>
    </div>
  );
}
