"use client";

import {
  Activity,
  Moon,
  Zap,
} from "lucide-react";
import {
  Line,
  LineChart,
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Legend,
} from "recharts";

type PlayerInfo = {
  displayName: string;
  statusLabel: string;
  lastUpdatedAt: string;
};

type BaselinePillar = {
  key: string;
  label: string;
  value: number;
};

type WeeklyMetric = {
  weekLabel: string;
  stress: number;
  cognitiveLoad: number;
};

type Kpis = {
  sleepQuality: number;
  mentalLoad: number;
  flowState: "low" | "medium" | "high";
};

type BeyondCareDashboardData = {
  player: PlayerInfo;
  baseline: BaselinePillar[];
  weekly: WeeklyMetric[];
  kpis: Kpis;
};

const DASHBOARD_DATA: BeyondCareDashboardData = {
  player: {
    displayName: "J. Contentin",
    statusLabel: "Prêt pour la performance",
    lastUpdatedAt: "2026-01-27T18:45:00.000Z",
  },
  baseline: [
    { key: "focus", label: "Focus", value: 78 },
    { key: "emotion", label: "Régulation émotionnelle", value: 72 },
    { key: "memory", label: "Mémoire", value: 80 },
    { key: "recovery", label: "Récupération", value: 68 },
    { key: "adaptability", label: "Adaptabilité", value: 75 },
  ],
  weekly: [
    { weekLabel: "Semaine 1", stress: 58, cognitiveLoad: 62 },
    { weekLabel: "Semaine 2", stress: 64, cognitiveLoad: 70 },
    { weekLabel: "Semaine 3", stress: 72, cognitiveLoad: 76 },
    { weekLabel: "Semaine 4", stress: 79, cognitiveLoad: 82 },
  ],
  kpis: {
    sleepQuality: 62,
    mentalLoad: 78,
    flowState: "medium",
  },
};

const formatDateFR = (date: Date) =>
  new Intl.DateTimeFormat("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);

const getJessicaAdvice = (data: BeyondCareDashboardData) => {
  const latest = data.weekly[data.weekly.length - 1];
  if (latest.stress >= 80 || latest.cognitiveLoad >= 80) {
    return "Semaine chargée : active le protocole de récupération mentale";
  }
  if (data.kpis.sleepQuality < 60) {
    return "Priorité sommeil : micro-ajustements ce soir";
  }
  return "Continue comme ça : maintien du rythme";
};

const GlassCard = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <div
    className={`rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl shadow-[0_30px_60px_-40px_rgba(0,0,0,0.6)] ${className}`}
  >
    {children}
  </div>
);

const SectionHeader = ({ title, subtitle }: { title: string; subtitle?: string }) => (
  <div className="space-y-2">
    <p className="text-xs uppercase tracking-[0.35em] text-white/50">{subtitle}</p>
    <h2 className="text-2xl md:text-3xl font-semibold text-[#E5E7EB]">{title}</h2>
  </div>
);

const ProgressBar = ({ value }: { value: number }) => (
  <div className="h-2 w-full rounded-full bg-white/10">
    <div
      className="h-full rounded-full bg-[#3B82F6]"
      style={{ width: `${value}%` }}
    />
  </div>
);

const FlowIndicator = ({ level }: { level: "low" | "medium" | "high" }) => {
  const levels = ["low", "medium", "high"] as const;
  return (
    <div className="flex items-center gap-2">
      {levels.map((item) => (
        <span
          key={item}
          className={`h-2.5 w-2.5 rounded-full ${
            item === level ? "bg-[#3B82F6]" : "bg-white/20"
          }`}
        />
      ))}
      <span className="text-xs text-white/60">
        {level === "low" ? "Bas" : level === "medium" ? "Moyen" : "Élevé"}
      </span>
    </div>
  );
};

const KpiCard = ({
  title,
  value,
  helper,
  icon,
  children,
}: {
  title: string;
  value: string;
  helper: string;
  icon: React.ReactNode;
  children?: React.ReactNode;
}) => (
  <GlassCard className="p-5 transition hover:shadow-[0_0_40px_rgba(59,130,246,0.25)]">
    <div className="flex items-center justify-between">
      <div className="space-y-1">
        <p className="text-sm text-white/60">{title}</p>
        <p className="text-2xl font-semibold text-[#E5E7EB]">{value}</p>
        <p className="text-xs text-white/50">{helper}</p>
      </div>
      <div className="rounded-2xl bg-[#3B82F6]/15 p-3 text-[#3B82F6]">
        {icon}
      </div>
    </div>
    {children ? <div className="mt-4">{children}</div> : null}
  </GlassCard>
);

export function LearnerBeyondCareDashboard() {
  const todayLabel = formatDateFR(new Date());
  const advice = getJessicaAdvice(DASHBOARD_DATA);

  return (
    <div className="flex flex-col gap-10 text-[#E5E7EB]">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-3 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs text-white/70">
            <span className="h-2.5 w-2.5 rounded-full bg-[#3B82F6]" />
            {DASHBOARD_DATA.player.statusLabel}
          </div>
          <h1 className="text-3xl md:text-4xl font-semibold">
            {DASHBOARD_DATA.player.displayName}
          </h1>
          <p className="text-sm text-white/50">
            Dernière mise à jour :{" "}
            {formatDateFR(new Date(DASHBOARD_DATA.player.lastUpdatedAt))}
          </p>
        </div>
        <div className="text-sm text-white/60">{todayLabel}</div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <GlassCard className="p-6">
          <SectionHeader
            title="Baseline Cognitif"
            subtitle="Votre profil de référence"
          />
          <div className="mt-6 h-[320px]">
            <ResponsiveContainer width="100%" height={350}>
              <RadarChart data={DASHBOARD_DATA.baseline} outerRadius="70%">
                <PolarGrid stroke="rgba(255,255,255,0.12)" />
                <PolarAngleAxis dataKey="label" tick={{ fill: "#9CA3AF", fontSize: 12 }} />
                <PolarRadiusAxis tick={false} axisLine={false} />
                <Radar
                  dataKey="value"
                  stroke="#3B82F6"
                  fill="#3B82F6"
                  fillOpacity={0.35}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>

        <GlassCard className="p-6">
          <SectionHeader title="Baromètre Hebdo" subtitle="Stress & charge cognitive" />
          <div className="mt-6 h-[320px]">
            <ResponsiveContainer width="100%" height={350}>
              <LineChart data={DASHBOARD_DATA.weekly}>
                <XAxis dataKey="weekLabel" tick={{ fill: "#9CA3AF", fontSize: 12 }} />
                <YAxis tick={{ fill: "#9CA3AF", fontSize: 12 }} />
                <Tooltip
                  contentStyle={{
                    background: "#0B0B0B",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: "12px",
                    color: "#E5E7EB",
                  }}
                />
                <Legend wrapperStyle={{ color: "#9CA3AF", fontSize: "12px" }} />
                <Line type="monotone" dataKey="stress" stroke="#3B82F6" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="cognitiveLoad" stroke="#93C5FD" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <KpiCard
          title="Qualité du sommeil"
          value={`${DASHBOARD_DATA.kpis.sleepQuality}%`}
          helper="Sur les 7 derniers jours"
          icon={<Moon className="h-5 w-5" />}
        />
        <KpiCard
          title="Charge mentale"
          value={`${DASHBOARD_DATA.kpis.mentalLoad}%`}
          helper="Charge perçue"
          icon={<Activity className="h-5 w-5" />}
        >
          <ProgressBar value={DASHBOARD_DATA.kpis.mentalLoad} />
        </KpiCard>
        <KpiCard
          title="État de flux"
          value="Niveau"
          helper="Synchronisation cognitive"
          icon={<Zap className="h-5 w-5" />}
        >
          <FlowIndicator level={DASHBOARD_DATA.kpis.flowState} />
        </KpiCard>
      </div>

      <GlassCard className="p-6 border-[#3B82F6]/40 bg-gradient-to-r from-[#3B82F6]/20 via-white/5 to-transparent">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.35em] text-white/60">
              Le conseil de Jessica
            </p>
            <h3 className="mt-3 text-2xl font-semibold text-[#E5E7EB]">
              {advice}
            </h3>
          </div>
          <button
            type="button"
            className="rounded-full border border-[#3B82F6] bg-[#3B82F6]/15 px-6 py-3 text-sm font-semibold text-[#E5E7EB] transition hover:bg-[#3B82F6]/25 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#3B82F6]"
          >
            Voir le protocole
          </button>
        </div>
      </GlassCard>
    </div>
  );
}
