"use client";

import { ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  score: number;
  className?: string;
  theme?: "light" | "dark";
};

export function EdgeReliabilityBadge({ score, className, theme = "light" }: Props) {
  const label =
    score >= 85
      ? "Profil très fiable"
      : score >= 65
        ? "Profil fiable"
        : score >= 40
          ? "Fiabilité en progression"
          : "Profil à consolider";

  const dark = theme === "dark";

  return (
    <div
      className={cn(
        "rounded-2xl p-5",
        dark
          ? "border border-white/[0.08] bg-white/[0.04]"
          : "border border-[#FF3B30]/15 bg-gradient-to-br from-[#FF3B30]/[0.06] to-white shadow-[0_8px_32px_rgba(255,59,48,0.08)]",
        className,
      )}
    >
      <div className={cn("flex items-center gap-2", dark ? "text-[#9EC0FF]" : "text-[#FF3B30]")}>
        <ShieldCheck className="h-5 w-5" />
        <p className="text-[10px] font-semibold uppercase tracking-[0.22em]">
          Indice de fiabilité Byound
        </p>
      </div>
      <p
        className={cn(
          "mt-3 text-4xl font-bold tracking-tight",
          dark ? "text-white" : "text-[#0a0a0a]",
        )}
      >
        {score} %
      </p>
      <p className={cn("mt-1 text-sm", dark ? "text-white/55" : "text-black/55")}>{label}</p>
      <p
        className={cn(
          "mt-3 rounded-xl border px-3 py-2.5 text-[12px] leading-relaxed",
          dark
            ? "border-[#3D7BFF]/20 bg-[#3D7BFF]/[0.08] text-[#B8D0FF]"
            : "border-[#3D7BFF]/15 bg-[#3D7BFF]/[0.06] text-[#1e3a8a]/90",
        )}
      >
        <span className="font-semibold">Ce n&apos;est pas le taux de complétion du profil.</span>{" "}
        La complétion mesure ce que vous avez renseigné (identité, projet, 3 tests, expériences,
        diplômes). L&apos;indice de fiabilité mesure, pour un recruteur, à quel point vos compétences
        métiers sont <span className="font-medium">prouvées et validées</span>.
      </p>
      <ul className={cn("mt-4 space-y-1.5 text-xs", dark ? "text-white/45" : "text-black/50")}>
        <li>✔ Statut de chaque compétence (déclarée → justifiée → validée)</li>
        <li>✔ Preuves, entretiens et validations expertes</li>
        <li>✔ Score de confiance Byound sur les analyses disponibles</li>
      </ul>
      <p className={cn("mt-3 text-[11px] leading-relaxed", dark ? "text-white/35" : "text-black/40")}>
        Vous pouvez avoir 100&nbsp;% de complétion (tests DISC, IDMC et soft skills faits) et un
        indice de fiabilité modeste tant que peu de compétences métier sont attestées.
      </p>
    </div>
  );
}
