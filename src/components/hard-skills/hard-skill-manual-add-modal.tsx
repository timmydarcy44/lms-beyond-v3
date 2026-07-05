"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import type { HardSkillLevel } from "@/lib/particulier/profil-edge-maturity";
import { HARD_SKILL_LEVELS } from "@/lib/hard-skills/hard-skills-portfolio";
import { CONNECT_BTN_PRIMARY, CONNECT_BTN_SECONDARY } from "@/lib/apprenant/connect-nav";
import { EDGE_INPUT_CLASS } from "@/components/ui/edge-select";

type Props = {
  open: boolean;
  existingSkills: string[];
  saving?: boolean;
  onClose: () => void;
  onSave: (name: string, level: HardSkillLevel) => void;
};

export function HardSkillManualAddModal({ open, existingSkills, saving, onClose, onSave }: Props) {
  const [name, setName] = useState("");
  const [level, setLevel] = useState<HardSkillLevel>("Intermédiaire");

  useEffect(() => {
    if (!open) return;
    setName("");
    setLevel("Intermédiaire");
  }, [open]);

  if (!open) return null;

  const trimmed = name.trim();
  const duplicate = existingSkills.some((s) => s.toLowerCase() === trimmed.toLowerCase());
  const canSave = trimmed.length > 1 && !duplicate;

  return (
    <div className="fixed inset-0 z-[135] flex items-center justify-center bg-black/70 px-4">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#121820] p-6 shadow-2xl">
        <p className="text-xs uppercase tracking-wider text-white/40">Ajout manuel</p>
        <h3 className="mt-2 text-lg font-semibold text-white">Nouvelle compétence</h3>
        <p className="mt-2 text-sm text-white/55">Créez une compétence hors catalogue EDGE.</p>

        <label className="mt-5 block text-sm">
          <span className="mb-1 block text-white/70">Nom</span>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ex. Excel avancé, Prospection B2B…"
            className={EDGE_INPUT_CLASS}
          />
        </label>

        <label className="mt-4 block text-sm">
          <span className="mb-1 block text-white/70">Niveau</span>
          <select
            value={level}
            onChange={(e) => setLevel(e.target.value as HardSkillLevel)}
            className={EDGE_INPUT_CLASS}
          >
            {HARD_SKILL_LEVELS.map((l) => (
              <option key={l} value={l}>
                {l}
              </option>
            ))}
          </select>
        </label>

        {duplicate ? <p className="mt-3 text-xs text-amber-300">Cette compétence existe déjà.</p> : null}

        <div className="mt-6 flex justify-end gap-2">
          <button type="button" onClick={onClose} className={CONNECT_BTN_SECONDARY}>
            Annuler
          </button>
          <button
            type="button"
            disabled={saving || !canSave}
            onClick={() => onSave(trimmed, level)}
            className={CONNECT_BTN_PRIMARY}
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Ajouter
          </button>
        </div>
      </div>
    </div>
  );
}
