"use client";

import { cn } from "@/lib/utils";

function DeviceFrame({
  children,
  className,
  label,
}: {
  children: React.ReactNode;
  className?: string;
  label?: string;
}) {
  return (
    <div
      className={cn(
        "overflow-hidden rounded-2xl border border-white/10 bg-[#0B2442] shadow-2xl shadow-black/40",
        className
      )}
    >
      <div className="flex items-center gap-1.5 border-b border-white/[0.06] px-4 py-2.5">
        <span className="h-2 w-2 rounded-full bg-white/20" />
        <span className="h-2 w-2 rounded-full bg-white/15" />
        <span className="h-2 w-2 rounded-full bg-white/10" />
        {label && (
          <span className="ml-2 truncate text-[10px] font-medium text-slate-500">{label}</span>
        )}
      </div>
      <div className="p-4 md:p-5">{children}</div>
    </div>
  );
}

function RadarMini({ className }: { className?: string }) {
  const axes = ["Soft skills", "Hard skills", "Leadership", "IA", "Transmission", "Vision RH"];
  const values = [82, 64, 71, 58, 75, 68];
  return (
    <div className={cn("relative mx-auto aspect-square max-w-[220px]", className)}>
      <svg viewBox="0 0 200 200" className="h-full w-full">
        {[0.25, 0.5, 0.75, 1].map((r) => (
          <polygon
            key={r}
            points={axes
              .map((_, i) => {
                const angle = (Math.PI * 2 * i) / axes.length - Math.PI / 2;
                const rad = 80 * r;
                return `${100 + rad * Math.cos(angle)},${100 + rad * Math.sin(angle)}`;
              })
              .join(" ")}
            fill="none"
            stroke="rgba(255,255,255,0.08)"
            strokeWidth="1"
          />
        ))}
        <polygon
          points={values
            .map((v, i) => {
              const angle = (Math.PI * 2 * i) / values.length - Math.PI / 2;
              const rad = (v / 100) * 80;
              return `${100 + rad * Math.cos(angle)},${100 + rad * Math.sin(angle)}`;
            })
            .join(" ")}
          fill="rgba(6,182,212,0.25)"
          stroke="#06B6D4"
          strokeWidth="1.5"
        />
      </svg>
    </div>
  );
}

export function MockupRadarCompetences({ className }: { className?: string }) {
  return (
    <DeviceFrame label="Beyond Skills · Radar" className={className}>
      <p className="text-xs font-medium text-slate-400">Cartographie · Équipe Marketing</p>
      <p className="mt-1 text-lg font-semibold text-white">Profil compétences</p>
      <RadarMini className="mt-3" />
      <div className="mt-4 space-y-2">
        {[
          { l: "Communication", v: 82 },
          { l: "Analyse", v: 64 },
          { l: "Adaptabilité", v: 71 },
        ].map((row) => (
          <div key={row.l} className="flex items-center gap-2">
            <span className="w-24 truncate text-[10px] text-slate-400">{row.l}</span>
            <div className="h-1 flex-1 overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full bg-gradient-to-r from-violet-500 to-cyan-400"
                style={{ width: `${row.v}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </DeviceFrame>
  );
}

export function MockupBeyondIndex({ className }: { className?: string }) {
  return (
    <DeviceFrame label="Beyond Index" className={className}>
      <div className="flex items-end justify-between">
        <div>
          <p className="text-[10px] uppercase tracking-widest text-cyan-400/80">Maturité</p>
          <p className="text-4xl font-bold tabular-nums text-white">67</p>
          <p className="text-xs text-slate-400">Organisation structurée</p>
        </div>
        <RadarMini className="max-w-[120px]" />
      </div>
      <div className="mt-4 grid grid-cols-3 gap-2">
        {["Compétences", "Formation", "IA"].map((a, i) => (
          <div key={a} className="rounded-lg bg-white/[0.04] p-2 text-center">
            <p className="text-[9px] text-slate-500">{a}</p>
            <p className="text-sm font-semibold text-white">{[72, 58, 81][i]}</p>
          </div>
        ))}
      </div>
    </DeviceFrame>
  );
}

export function MockupIARecommendations({ className }: { className?: string }) {
  return (
    <DeviceFrame label="Beyond AI · Recommandations" className={className}>
      <div className="flex items-start gap-2">
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-violet-500/20 text-[10px] text-violet-300">
          AI
        </div>
        <div>
          <p className="text-xs font-medium text-white">3 parcours recommandés</p>
          <p className="mt-0.5 text-[10px] text-slate-500">Basé sur les écarts identifiés</p>
        </div>
      </div>
      <div className="mt-4 space-y-2">
        {[
          { t: "Leadership & feedback", p: "Priorité haute" },
          { t: "Compétences IA métier", p: "Priorité moyenne" },
          { t: "Communication client", p: "Consolidation" },
        ].map((r) => (
          <div
            key={r.t}
            className="rounded-xl border border-white/[0.06] bg-white/[0.03] px-3 py-2.5"
          >
            <p className="text-[11px] font-medium text-slate-200">{r.t}</p>
            <p className="mt-0.5 text-[9px] text-cyan-400/90">{r.p}</p>
          </div>
        ))}
      </div>
    </DeviceFrame>
  );
}

export function MockupOpenBadge({ className }: { className?: string }) {
  return (
    <DeviceFrame label="Beyond Badges" className={cn("text-center", className)}>
      <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full border-4 border-amber-400/40 bg-gradient-to-br from-amber-500/20 to-violet-500/20">
        <div className="text-center">
          <p className="text-[8px] font-bold uppercase tracking-wider text-amber-300">Open Badge</p>
          <p className="mt-1 text-[10px] font-semibold text-white">Soft Skills</p>
          <p className="text-[8px] text-slate-400">Niveau 3</p>
        </div>
      </div>
      <p className="mt-4 text-sm font-semibold text-white">Communication avancée</p>
      <p className="mt-1 text-[10px] text-slate-500">Validé · Portfolio mis à jour</p>
    </DeviceFrame>
  );
}

export function MockupPortfolio({ className }: { className?: string }) {
  return (
    <DeviceFrame label="Portfolio compétences" className={className}>
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-full bg-gradient-to-br from-cyan-400/30 to-violet-500/30" />
        <div>
          <p className="text-sm font-semibold text-white">Marie Dupont</p>
          <p className="text-[10px] text-slate-500">12 compétences certifiées</p>
        </div>
      </div>
      <div className="mt-4 flex flex-wrap gap-1.5">
        {["DISC", "Soft skills", "IA", "Management", "Badge RH"].map((tag) => (
          <span
            key={tag}
            className="rounded-full border border-white/10 bg-white/[0.04] px-2 py-0.5 text-[9px] text-slate-300"
          >
            {tag}
          </span>
        ))}
      </div>
      <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-white/10">
        <div className="h-full w-[78%] rounded-full bg-gradient-to-r from-violet-500 to-cyan-400" />
      </div>
      <p className="mt-1 text-right text-[9px] text-slate-500">Progression globale 78%</p>
    </DeviceFrame>
  );
}

/** Petit objet produit flottant pour le hero */
export function MockupHeroFloat({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "w-[260px] overflow-hidden rounded-2xl border border-white/15 bg-[#0B2442]/95 p-4 shadow-2xl backdrop-blur-xl md:w-[280px]",
        className
      )}
    >
      <p className="text-[10px] font-medium uppercase tracking-widest text-cyan-400/80">Beyond</p>
      <p className="mt-1 text-sm font-semibold text-white">Compétences · Équipe</p>
      <RadarMini className="mt-3 max-w-[180px]" />
      <div className="mt-3 flex justify-between text-[10px] text-slate-400">
        <span>Écarts détectés</span>
        <span className="font-medium text-cyan-400">4</span>
      </div>
    </div>
  );
}

export function MockupIndexSpectacular({ className }: { className?: string }) {
  return (
    <div className={cn("relative", className)}>
      <div className="absolute -left-4 top-8 z-10 w-[55%] md:-left-8">
        <MockupBeyondIndex />
      </div>
      <div className="ml-auto w-[55%] pt-32 md:pt-40">
        <MockupIARecommendations />
      </div>
      <div className="absolute bottom-0 left-1/4 z-20 w-[45%] -translate-x-1/4">
        <div className="rounded-2xl border border-white/10 bg-[#071A2F]/90 px-4 py-3 backdrop-blur-md">
          <p className="text-[10px] text-slate-500">Recommandation prioritaire</p>
          <p className="text-sm font-medium text-white">Structurer la mobilité interne</p>
        </div>
      </div>
    </div>
  );
}

export function ProductShowcaseStage({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative mx-auto max-w-5xl">
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-cyan-500/5 via-transparent to-violet-500/5" />
      <div className="relative grid gap-6 sm:grid-cols-2 lg:grid-cols-3 lg:gap-5">{children}</div>
    </div>
  );
}
