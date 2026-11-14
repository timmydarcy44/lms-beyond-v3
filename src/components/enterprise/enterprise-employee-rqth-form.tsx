"use client";

import { useState } from "react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type Props = {
  employeeId: string;
  initialRqth?: boolean;
  initialNeeds?: string;
  onSaved?: (next: { rqth: boolean; needs_summary: string | null }) => void;
  className?: string;
};

export function EnterpriseEmployeeRqthForm({
  employeeId,
  initialRqth = false,
  initialNeeds = "",
  onSaved,
  className,
}: Props) {
  const [rqth, setRqth] = useState(initialRqth);
  const [accommodationNeeded, setAccommodationNeeded] = useState(
    Boolean(initialNeeds?.trim()),
  );
  const [needs, setNeeds] = useState(initialNeeds);
  const [saving, setSaving] = useState(false);

  return (
    <form
      className={cn("rounded-2xl border border-teal-100 bg-teal-50/40 p-4", className)}
      onSubmit={(e) => {
        e.preventDefault();
        void (async () => {
          setSaving(true);
          try {
            const res = await fetch(
              `/api/dashboard/entreprise/employees/${encodeURIComponent(employeeId)}/rqth`,
              {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  rqth,
                  accommodation_needed: accommodationNeeded,
                  needs_summary:
                    rqth || accommodationNeeded ? needs.trim() || null : null,
                }),
              },
            );
            const json = (await res.json()) as {
              error?: string;
              employee?: { rqth: boolean; rqth_needs_summary: string | null };
            };
            if (!res.ok) throw new Error(json.error ?? "Enregistrement impossible");
            toast.success(
              accommodationNeeded || rqth
                ? "Demande transmise à la référente handicap"
                : "Enregistrement effectué",
            );
            onSaved?.({
              rqth: Boolean(json.employee?.rqth),
              needs_summary: json.employee?.rqth_needs_summary ?? null,
            });
          } catch (err) {
            toast.error(err instanceof Error ? err.message : "Erreur");
          } finally {
            setSaving(false);
          }
        })();
      }}
    >
      <p className="text-sm font-bold text-teal-950">Déclaration RQTH & aménagements</p>
      <p className="mt-1 text-xs text-teal-900/70">
        Information confidentielle. Le suivi détaillé est réservé à la référente handicap
        Byound. Décrivez le besoin, pas la situation médicale.
      </p>
      <label className="mt-3 flex items-center gap-2 text-sm font-semibold text-gray-900">
        <input
          type="checkbox"
          checked={rqth}
          onChange={(e) => setRqth(e.target.checked)}
          className="h-4 w-4 rounded border-gray-300"
        />
        Je dispose d&apos;une RQTH (ou le collaborateur en dispose)
      </label>
      <label className="mt-2 flex items-center gap-2 text-sm font-semibold text-gray-900">
        <input
          type="checkbox"
          checked={accommodationNeeded}
          onChange={(e) => setAccommodationNeeded(e.target.checked)}
          className="h-4 w-4 rounded border-gray-300"
        />
        J&apos;ai besoin d&apos;un aménagement
      </label>
      {rqth || accommodationNeeded ? (
        <textarea
          value={needs}
          onChange={(e) => setNeeds(e.target.value)}
          rows={3}
          placeholder="Besoins / aménagements souhaités (optionnel)"
          className="mt-3 w-full rounded-xl border border-teal-200 bg-white px-3 py-2 text-sm text-gray-900"
        />
      ) : null}
      <button
        type="submit"
        disabled={saving}
        className="mt-3 inline-flex rounded-full bg-teal-800 px-4 py-2 text-sm font-bold text-white hover:bg-teal-700 disabled:opacity-60"
      >
        {saving ? "Enregistrement…" : "Enregistrer"}
      </button>
    </form>
  );
}
