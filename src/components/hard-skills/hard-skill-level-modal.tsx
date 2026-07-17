"use client";

import { useEffect, useState } from "react";
import type { HardSkillLevel } from "@/lib/particulier/profil-edge-maturity";
import { SkillLevelSelector } from "@/components/hard-skills/skill-level-selector";
import { CONNECT_BTN_PRIMARY, CONNECT_BTN_SECONDARY } from "@/lib/apprenant/connect-nav";

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
    <div className="fixed inset-0 z-[140] flex items-end justify-center bg-black/70 px-0 sm:items-center sm:px-4">
      <div className="w-full max-w-md rounded-t-[28px] border border-white/10 bg-[#121820] p-6 shadow-2xl sm:rounded-[28px]">
        <p className="text-xs uppercase tracking-wider text-white/40">Modifier le niveau</p>
        <h3 className="mt-2 text-lg font-semibold text-white">{skillName}</h3>
        <p className="mt-2 text-sm text-white/55">
          Le niveau déclaré reste distinct du statut (auto-déclarée, prouvée, validée).
        </p>

        <div className="mt-5">
          <SkillLevelSelector value={level} onChange={setLevel} />
        </div>

        <div className="mt-6 flex flex-col gap-2 sm:flex-row-reverse">
          <button
            type="button"
            disabled={saving}
            onClick={() => onSave(level)}
            className={`${CONNECT_BTN_PRIMARY} w-full justify-center sm:w-auto`}
          >
            Enregistrer
          </button>
          <button type="button" onClick={onClose} className={`${CONNECT_BTN_SECONDARY} w-full justify-center sm:w-auto`}>
            Annuler
          </button>
        </div>
      </div>
    </div>
  );
}
