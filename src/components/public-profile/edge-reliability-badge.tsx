"use client";

import { ShieldCheck } from "lucide-react";

type Props = {
  score: number;
  className?: string;
};

export function EdgeReliabilityBadge({ score, className }: Props) {
  const label =
    score >= 85 ? "Profil très fiable" : score >= 65 ? "Profil fiable" : score >= 40 ? "Fiabilité en progression" : "Profil à consolider";

  return (
    <div
      className={`rounded-2xl border border-[#FF3B30]/15 bg-gradient-to-br from-[#FF3B30]/[0.06] to-white p-5 shadow-[0_8px_32px_rgba(255,59,48,0.08)] ${className ?? ""}`}
    >
      <div className="flex items-center gap-2 text-[#FF3B30]">
        <ShieldCheck className="h-5 w-5" />
        <p className="text-[10px] font-semibold uppercase tracking-[0.22em]">Indice de fiabilité EDGE</p>
      </div>
      <p className="mt-3 text-4xl font-bold tracking-tight text-[#0a0a0a]">{score} %</p>
      <p className="mt-1 text-sm text-black/55">{label}</p>
      <ul className="mt-4 space-y-1.5 text-xs text-black/50">
        <li>✔ Compétences évaluées par l&apos;IA</li>
        <li>✔ Preuves et entretiens expérientiels</li>
        <li>✔ Cohérence du parcours EDGE</li>
      </ul>
    </div>
  );
}
