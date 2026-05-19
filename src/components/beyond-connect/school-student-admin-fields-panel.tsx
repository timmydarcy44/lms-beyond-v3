"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

const PLACEMENT_OPTIONS: { value: string; label: string }[] = [
  { value: "", label: "— Non renseigné —" },
  { value: "initial", label: "Initial (sans entreprise)" },
  { value: "recherche_alternance", label: "En recherche d'alternance" },
  { value: "en_alternance", label: "En alternance" },
  { value: "en_stage", label: "En stage" },
  { value: "contrat_fip", label: "Contrat FIP" },
];

type Props = {
  schoolId: string | null;
  learnerId: string;
  initialPlacementStatus: string | null;
  initialDateOfBirth: string | null;
  initialHasDrivingLicenseB: boolean | null;
  appearance?: "light" | "dark";
  /** `dobPermis` : naissance + permis uniquement (sans statut de placement ni carte « Statut & administratif »). */
  fields?: "all" | "dobPermis";
};

export function SchoolStudentAdminFieldsPanel({
  schoolId,
  learnerId,
  initialPlacementStatus,
  initialDateOfBirth,
  initialHasDrivingLicenseB,
  appearance = "light",
  fields = "all",
}: Props) {
  const router = useRouter();
  const [placement, setPlacement] = useState(initialPlacementStatus || "");
  const [dob, setDob] = useState(
    initialDateOfBirth && /^\d{4}-\d{2}-\d{2}/.test(initialDateOfBirth) ? initialDateOfBirth.slice(0, 10) : "",
  );
  const [permis, setPermis] = useState<boolean | "">(
    initialHasDrivingLicenseB === true ? true : initialHasDrivingLicenseB === false ? false : "",
  );
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setPlacement(initialPlacementStatus || "");
    setDob(
      initialDateOfBirth && /^\d{4}-\d{2}-\d{2}/.test(initialDateOfBirth) ? initialDateOfBirth.slice(0, 10) : "",
    );
    setPermis(
      initialHasDrivingLicenseB === true ? true : initialHasDrivingLicenseB === false ? false : "",
    );
  }, [initialPlacementStatus, initialDateOfBirth, initialHasDrivingLicenseB]);

  const save = async () => {
    if (!schoolId) {
      toast.error("École non identifiée.");
      return;
    }
    setSaving(true);
    try {
      const body: Record<string, unknown> = {
        learnerId,
        date_of_birth: dob.trim() || null,
        has_driving_license_b: permis === "" ? null : permis === true,
      };
      if (fields === "all") {
        body.placement_status = placement || null;
      }
      const res = await fetch("/api/dashboard/ecole/apprenants/alternance", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.success) throw new Error(data?.error || "Enregistrement impossible");
      toast.success(fields === "dobPermis" ? "Naissance et permis enregistrés." : "Informations administratives enregistrées.");
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erreur");
    } finally {
      setSaving(false);
    }
  };

  const dark = appearance === "dark";
  const dobPermisOnly = fields === "dobPermis";

  const inputClass = dark
    ? "w-full rounded-xl border border-white/15 bg-zinc-950 px-3 py-2 text-zinc-100"
    : "w-full rounded-xl border border-[#E5E5EA] px-3 py-2";

  const labelClass = dark ? "text-zinc-500" : "text-[#86868B]";

  const btnClass = dark
    ? "rounded-full bg-gradient-to-r from-violet-600 to-fuchsia-600 px-5 py-2 text-sm font-semibold text-white disabled:opacity-50"
    : "rounded-full bg-[#1D1D1F] px-5 py-2 text-sm font-semibold text-white disabled:opacity-50";

  const inner = (
    <>
      <div className={`mt-0 grid gap-4 ${dobPermisOnly ? "md:grid-cols-2" : "md:grid-cols-3"}`}>
        {!dobPermisOnly ? (
          <label className="space-y-1 text-sm">
            <span className={`text-xs font-semibold ${labelClass}`}>Statut (alternance / stage / FIP)</span>
            <select value={placement} onChange={(e) => setPlacement(e.target.value)} className={inputClass}>
              {PLACEMENT_OPTIONS.map((o) => (
                <option key={o.value || "none"} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </label>
        ) : null}
        <label className="space-y-1 text-sm">
          <span className={`text-xs font-semibold ${labelClass}`}>Date de naissance</span>
          <input type="date" value={dob} onChange={(e) => setDob(e.target.value)} className={inputClass} />
        </label>
        <label className="flex flex-col gap-2 text-sm">
          <span className={`text-xs font-semibold ${labelClass}`}>Permis B</span>
          <select
            value={permis === true ? "yes" : permis === false ? "no" : ""}
            onChange={(e) => {
              const v = e.target.value;
              setPermis(v === "yes" ? true : v === "no" ? false : "");
            }}
            className={inputClass}
          >
            <option value="">— Non renseigné —</option>
            <option value="yes">Oui</option>
            <option value="no">Non</option>
          </select>
        </label>
      </div>

      <div className={`flex justify-end ${dobPermisOnly ? "mt-4" : "mt-6"}`}>
        <button type="button" disabled={saving} onClick={() => void save()} className={btnClass}>
          {saving ? "Enregistrement…" : "Enregistrer"}
        </button>
      </div>
    </>
  );

  if (dobPermisOnly) {
    return <div className="space-y-1">{inner}</div>;
  }

  return (
    <section
      className={
        dark
          ? "rounded-2xl border border-white/10 bg-zinc-900/70 p-6 shadow-none backdrop-blur-sm"
          : "rounded-2xl border border-[#E5E5EA] bg-white p-6 shadow-sm"
      }
    >
      <h2 className={`text-lg font-semibold ${dark ? "text-white" : "text-[#1D1D1F]"}`}>Statut & administratif</h2>
      <p className={`mt-2 text-sm ${dark ? "text-zinc-400" : "text-[#86868B]"}`}>
        Statut de placement, date de naissance et permis B — visibles sur la fiche pour le suivi pédagogique.
      </p>
      <div className="mt-4">{inner}</div>
    </section>
  );
}
