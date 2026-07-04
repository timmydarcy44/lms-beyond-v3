"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  normalizeParticulierObjectiveType,
  OBJECTIVE_DETAIL_FIELDS,
  type ParticulierObjectiveType,
} from "@/lib/particulier/objective-detail-fields";

type Props = {
  open: boolean;
  typeProfil: string | null | undefined;
  onSaved: () => void;
  onClose?: () => void;
};

const inputClass =
  "mt-2 w-full rounded-xl border border-black/[0.06] bg-[#f5f5f3] px-3 py-2 text-sm text-[#0a0a0a] outline-none focus:border-[#3D7BFF]/50";

export function ObjectiveDetailStepModal({ open, typeProfil, onSaved, onClose }: Props) {
  const objectiveType = useMemo(() => normalizeParticulierObjectiveType(typeProfil), [typeProfil]);
  const fields = OBJECTIVE_DETAIL_FIELDS[objectiveType];
  const [values, setValues] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setValues({});
  }, [open, objectiveType]);

  if (!open) return null;

  const handleSave = async () => {
    const filled = fields.filter((f) => values[f.key]?.trim());
    if (filled.length < Math.min(2, fields.length)) {
      toast.error("Renseignez au moins deux champs pour personnaliser votre parcours.");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/learner/objective-details", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          objective_type: objectiveType,
          details: values,
        }),
      });
      const data = (await res.json().catch(() => null)) as { error?: string } | null;
      if (!res.ok) throw new Error(data?.error ?? "Enregistrement impossible");
      onSaved();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erreur");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[10007] flex items-center justify-center bg-black/55 px-4">
      <div className="w-full max-w-lg rounded-2xl border border-black/[0.08] bg-white p-6 shadow-2xl">
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#635BFF]">EDGE Particulier</p>
        <h2 className="mt-2 text-xl font-semibold tracking-tight text-[#0a0a0a]">Construisons votre objectif</h2>
        <p className="mt-2 text-sm leading-relaxed text-black/60">
          Pour personnaliser vos recommandations, précisez votre projet actuel.
        </p>

        <div className="mt-6 space-y-4">
          {fields.map((field) => (
            <label key={field.key} className="block text-sm font-medium text-[#0a0a0a]">
              {field.label}
              <input
                className={inputClass}
                value={values[field.key] ?? ""}
                placeholder={field.placeholder}
                onChange={(e) => setValues((prev) => ({ ...prev, [field.key]: e.target.value }))}
              />
            </label>
          ))}
        </div>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          {onClose ? (
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-[10px] border border-black/10 px-5 py-[11px] text-[13px] font-semibold text-black/60"
            >
              Plus tard
            </button>
          ) : null}
          <button
            type="button"
            disabled={saving}
            onClick={() => void handleSave()}
            className="inline-flex flex-1 items-center justify-center rounded-[10px] bg-[#050505] px-5 py-[11px] text-[13px] font-bold text-white disabled:opacity-50"
          >
            {saving ? "Enregistrement…" : "Voir mon Profil EDGE"}
          </button>
        </div>
      </div>
    </div>
  );
}
