"use client";

import { useEffect, useState } from "react";
import type { HardSkillProof } from "@/lib/hard-skills/hard-skills-portfolio";
import { CONNECT_BTN_PRIMARY, CONNECT_BTN_SECONDARY } from "@/lib/apprenant/connect-nav";

const PROOF_TYPES: Array<{ value: HardSkillProof["type"]; label: string }> = [
  { value: "link", label: "Lien (LinkedIn, portfolio…)" },
  { value: "document", label: "Document / certificat" },
  { value: "portfolio", label: "Portfolio" },
  { value: "cv", label: "CV" },
  { value: "other", label: "Autre preuve" },
];

type Props = {
  open: boolean;
  skillName: string | null;
  initialProof?: HardSkillProof;
  saving?: boolean;
  onClose: () => void;
  onSave: (proof: HardSkillProof) => void;
};

export function HardSkillProofModal({ open, skillName, initialProof, saving, onClose, onSave }: Props) {
  const [type, setType] = useState<HardSkillProof["type"]>("link");
  const [url, setUrl] = useState("");
  const [note, setNote] = useState("");

  useEffect(() => {
    if (!open) return;
    setType(initialProof?.type ?? "link");
    setUrl(initialProof?.url ?? "");
    setNote(initialProof?.note ?? "");
  }, [open, initialProof, skillName]);

  if (!open || !skillName) return null;

  const canSave = url.trim().length > 0 || note.trim().length > 0;

  return (
    <div className="fixed inset-0 z-[140] flex items-center justify-center bg-black/70 px-4">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#121820] p-6 shadow-2xl">
        <p className="text-xs uppercase tracking-wider text-white/40">Niveau de preuve</p>
        <h3 className="mt-2 text-lg font-semibold text-white">{skillName}</h3>
        <p className="mt-2 text-sm text-white/55">
          Ajoutez un lien, un document ou une description pour justifier cette compétence.
        </p>

        <label className="mt-5 block text-sm">
          <span className="mb-1 block text-white/70">Type de preuve</span>
          <select
            value={type}
            onChange={(e) => setType(e.target.value as HardSkillProof["type"])}
            className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2.5 text-sm text-white outline-none"
          >
            {PROOF_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </label>

        <label className="mt-4 block text-sm">
          <span className="mb-1 block text-white/70">Lien ou URL</span>
          <input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://linkedin.com/in/…"
            className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2.5 text-sm text-white outline-none"
          />
        </label>

        <label className="mt-4 block text-sm">
          <span className="mb-1 block text-white/70">Description (optionnel)</span>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={3}
            placeholder="Précisez le contexte de cette preuve…"
            className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2.5 text-sm text-white outline-none"
          />
        </label>

        <div className="mt-6 flex justify-end gap-2">
          <button type="button" onClick={onClose} className={CONNECT_BTN_SECONDARY}>
            Annuler
          </button>
          <button
            type="button"
            disabled={saving || !canSave}
            onClick={() => onSave({ type, url: url.trim() || undefined, note: note.trim() || undefined })}
            className={CONNECT_BTN_PRIMARY}
          >
            Enregistrer la preuve
          </button>
        </div>
      </div>
    </div>
  );
}
