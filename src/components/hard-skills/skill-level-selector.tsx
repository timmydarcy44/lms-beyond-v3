"use client";

import type { HardSkillLevel } from "@/lib/particulier/profil-edge-maturity";
import { HARD_SKILL_LEVELS } from "@/lib/hard-skills/hard-skills-portfolio";
import { cn } from "@/lib/utils";

const LEVEL_HELP: Record<HardSkillLevel, string> = {
  Débutant: "Je découvre la compétence et j’ai encore besoin d’accompagnement.",
  Intermédiaire: "Je peux l’utiliser dans des situations courantes.",
  Confirmé: "Je suis autonome et je l’utilise régulièrement.",
  Expert: "Je maîtrise la compétence dans des contextes complexes et je peux accompagner d’autres personnes.",
};

type Props = {
  value: HardSkillLevel;
  onChange: (level: HardSkillLevel) => void;
  className?: string;
};

export function SkillLevelSelector({ value, onChange, className }: Props) {
  return (
    <div className={cn("grid grid-cols-1 gap-2 sm:grid-cols-2", className)} role="radiogroup" aria-label="Niveau">
      {HARD_SKILL_LEVELS.map((level) => {
        const selected = value === level;
        return (
          <button
            key={level}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(level)}
            className={cn(
              "rounded-2xl border px-4 py-3.5 text-left transition",
              selected
                ? "border-[#3D7BFF]/55 bg-[#3D7BFF]/15 shadow-[0_0_0_1px_rgba(61,123,255,0.25)]"
                : "border-white/10 bg-white/[0.03] hover:bg-white/[0.06]",
            )}
          >
            <span className="block text-[15px] font-semibold text-white">{level}</span>
            <span className="mt-1.5 block text-[13px] leading-snug text-white/55">{LEVEL_HELP[level]}</span>
          </button>
        );
      })}
    </div>
  );
}
