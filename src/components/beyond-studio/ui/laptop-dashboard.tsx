"use client";

import { ArrowUpRight, Brain, Layers, Zap } from "lucide-react";

export function LaptopDashboardUI() {
  return (
    <div className="h-full w-full overflow-hidden rounded-lg bg-[#090a10] p-5 text-sm text-zinc-300">
      <div className="mb-4 flex items-center justify-between border-b border-white/[0.06] pb-3">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Beyond Studio</p>
          <p className="text-lg font-semibold text-white">Workflow Intelligence</p>
        </div>
        <span className="rounded-full border border-indigo-500/30 bg-indigo-500/10 px-3 py-1 text-xs text-indigo-200">
          Cognitive mode
        </span>
      </div>
      <div className="grid grid-cols-3 gap-3">
        {[
          { title: "Friction", value: "-42%", icon: Zap, tone: "text-emerald-400" },
          { title: "Adoption", value: "89%", icon: Layers, tone: "text-indigo-300" },
          { title: "Clarté", value: "9.2", icon: Brain, tone: "text-sky-300" },
        ].map((m) => (
          <div
            key={m.title}
            className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3 backdrop-blur-md"
          >
            <m.icon className={`mb-2 h-4 w-4 ${m.tone}`} strokeWidth={1.5} />
            <p className="text-[10px] text-zinc-500">{m.title}</p>
            <p className="text-xl font-semibold text-white">{m.value}</p>
          </div>
        ))}
      </div>
      <div className="mt-4 grid grid-cols-5 gap-2 rounded-xl border border-white/[0.05] bg-white/[0.02] p-3">
        {[40, 65, 45, 80, 55, 70, 90, 50, 75, 60].map((h, i) => (
          <div
            key={i}
            className="rounded-sm bg-gradient-to-t from-indigo-600/50 to-indigo-400/20"
            style={{ height: `${h}px` }}
          />
        ))}
      </div>
      <div className="mt-4 flex items-center justify-between rounded-xl border border-white/[0.06] px-4 py-3">
        <div>
          <p className="text-xs text-zinc-500">Pipeline — Onboarding client</p>
          <p className="font-medium text-white">Étape 4 · Validation humaine</p>
        </div>
        <ArrowUpRight className="h-4 w-4 text-indigo-400" />
      </div>
    </div>
  );
}
