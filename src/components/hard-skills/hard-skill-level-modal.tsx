"use client";

import { useEffect, useState } from "react";
import type { HardSkillLevel } from "@/lib/particulier/profil-edge-maturity";
import { HARD_SKILL_LEVELS, LEVEL_CHIP_CLASS } from "@/lib/hard-skills/hard-skills-portfolio";
import { CONNECT_BTN_PRIMARY, CONNECT_BTN_SECONDARY } from "@/lib/apprenant/connect-nav";
import { cn } from "@/lib/utils";

type Props = {
  open: boolean;
  skillName: string | null;
  initialLevel?: HardSkillLevel;
  saving?: boolean;
  onClose: () => void;
  onSave: (level: HardSkillLevel) => void;
};

export function HardSkillLevelModal({ open, skillName, initialLevel, saving, onClose, onSave }: Props) {
  const [level, setLevel] = useState<HardSkillLevel>(initialLevel ?? "Intermédiaire");

  useEffect(() => {
    if (open) setLevel(initialLevel ?? "Intermédiaire");
  }, [open, initialLevel, skillName]);

  if (!open || !skillName) return null;

  return (
    <div className="fixed inset-0 z-[140] flex items-center justify-center bg-black/70 px-4">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#121820] p-6 shadow-2xl">
        <p className="text-xs uppercase tracking-wider text-white/40">Niveau de maîtrise</p>
        <h3 className="mt-2 text-lg font-semibold text-white">{skillName}</h3>
        <p className="mt-2 text-sm text-white/55">Choisissez votre niveau pour enregistrer cette compétence.</p>

        <div className="mt-5 grid grid-cols-2 gap-2">
          {HARD_SKILL_LEVELS.map((l) => (
            <button
              key={l}
              type="button"
              onClick={() => setLevel(l)}
              className={cn(
                "rounded-xl border px-3 py-3 text-sm font-semibold transition",
                level === l ? LEVEL_CHIP_CLASS[l] : "border-white/10 bg-white/[0.03] text-white/65 hover:bg-white/[0.06]",
              )}
            >
              {l}
            </button>
          ))}
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <button type="button" onClick={onClose} className={CONNECT_BTN_SECONDARY}>
            Annuler
          </button>
          <button type="button" disabled={saving} onClick={() => onSave(level)} className={CONNECT_BTN_PRIMARY}>
            Enregistrer
          </button>
        </div>
      </div>
    </div>
  );
}
