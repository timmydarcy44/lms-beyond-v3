"use client";

import { useCallback, useEffect, useState } from "react";
import { Download, Loader2, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  EMPLOYMENT_STATUSES,
  EMPLOYMENT_STATUS_LABELS,
  type EmploymentStatus,
} from "@/lib/expert/subcontracting";
import { cn } from "@/lib/utils";

export type SubcontractIntervenant = {
  id: string;
  name: string;
  email: string | null;
  employment_status: EmploymentStatus | null;
  employment_label: string;
  subcontract_signed_at: string | null;
  subcontract_ends_at: string | null;
  quality_commitment_at: string | null;
  has_signed_contract_doc: boolean;
  ready: boolean;
  message: string | null;
};

type Props = {
  open: boolean;
  onClose: () => void;
  /** Pré-sélectionner un intervenant à l’ouverture. */
  initialExpertId?: string | null;
  onSaved?: () => void;
};

export function QualiopiSubcontractEditor({
  open,
  onClose,
  initialExpertId = null,
  onSaved,
}: Props) {
  const [rows, setRows] = useState<SubcontractIntervenant[]>([]);
  const [loading, setLoading] = useState(false);
  const [editId, setEditId] = useState("");
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({
    employment_status: "" as "" | EmploymentStatus,
    subcontract_signed_at: "",
    subcontract_ends_at: "",
    quality_commitment: false,
  });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/super-admin/crm/qualiopi/formateurs/contractual");
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Chargement impossible");
      const list = (json.intervenants ?? []) as SubcontractIntervenant[];
      setRows(list);
      const prefer = initialExpertId && list.some((r) => r.id === initialExpertId)
        ? initialExpertId
        : list.find((r) => !r.ready)?.id ?? list[0]?.id ?? "";
      if (prefer) {
        const row = list.find((r) => r.id === prefer)!;
        setEditId(prefer);
        setForm({
          employment_status: row.employment_status ?? "",
          subcontract_signed_at: row.subcontract_signed_at ?? "",
          subcontract_ends_at: row.subcontract_ends_at ?? "",
          quality_commitment: Boolean(row.quality_commitment_at),
        });
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erreur");
    } finally {
      setLoading(false);
    }
  }, [initialExpertId]);

  useEffect(() => {
    if (open) void load();
  }, [open, load]);

  if (!open) return null;

  const current = rows.find((r) => r.id === editId) ?? null;

  const selectRow = (row: SubcontractIntervenant) => {
    setEditId(row.id);
    setForm({
      employment_status: row.employment_status ?? "",
      subcontract_signed_at: row.subcontract_signed_at ?? "",
      subcontract_ends_at: row.subcontract_ends_at ?? "",
      quality_commitment: Boolean(row.quality_commitment_at),
    });
  };

  const save = async () => {
    if (!editId) return;
    setBusy(true);
    try {
      const res = await fetch("/api/super-admin/crm/qualiopi/formateurs/contractual", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          expert_id: editId,
          employment_status: form.employment_status || null,
          subcontract_signed_at: form.subcontract_signed_at || null,
          subcontract_ends_at: form.subcontract_ends_at || null,
          quality_commitment: form.quality_commitment,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Enregistrement impossible");
      toast.success("Sous-traitance enregistrée");
      await load();
      onSaved?.();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erreur");
    } finally {
      setBusy(false);
    }
  };

  const downloadContract = () => {
    if (!editId) return;
    window.open(
      `/api/super-admin/crm/qualiopi/formateurs/contractual/contrat?expert_id=${encodeURIComponent(editId)}`,
      "_blank",
    );
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center bg-black/60 p-3 sm:items-center">
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Éditer la sous-traitance"
        className="flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-[#26304F] bg-[#0B1122] shadow-2xl"
      >
        <div className="flex items-center justify-between border-b border-[#1A2340] px-4 py-3">
          <div>
            <p className="text-sm font-semibold text-white">Sous-traitance (ind. 27)</p>
            <p className="text-[11px] text-[#9AA3BD]">
              Statut emploi · contrat type · engagement qualité
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-white/70 hover:bg-white/10"
            aria-label="Fermer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {loading ? (
          <p className="flex items-center gap-2 p-6 text-sm text-[#9AA3BD]">
            <Loader2 className="h-4 w-4 animate-spin" /> Chargement…
          </p>
        ) : rows.length === 0 ? (
          <p className="p-6 text-sm text-[#9AA3BD]">
            Aucun expert approuvé. Validez d’abord un intervenant dans Experts.
          </p>
        ) : (
          <div className="grid min-h-0 flex-1 gap-0 overflow-hidden md:grid-cols-[240px_1fr]">
            <ul className="max-h-[40vh] space-y-1 overflow-y-auto border-b border-[#1A2340] p-3 md:max-h-none md:border-b-0 md:border-r">
              {rows.map((row) => (
                <li key={row.id}>
                  <button
                    type="button"
                    onClick={() => selectRow(row)}
                    className={cn(
                      "w-full rounded-xl px-3 py-2 text-left text-sm",
                      editId === row.id ? "bg-[#6E5BFF]/20 text-white" : "text-white/80 hover:bg-white/5",
                    )}
                  >
                    <span className="block truncate font-medium">{row.name}</span>
                    <span
                      className={cn(
                        "mt-0.5 block text-[10px] font-semibold",
                        row.ready ? "text-emerald-300" : "text-amber-200",
                      )}
                    >
                      {row.ready ? "Conforme" : "À compléter"}
                    </span>
                  </button>
                </li>
              ))}
            </ul>

            <div className="space-y-3 overflow-y-auto p-4">
              {current ? (
                <>
                  <p className="text-sm font-semibold text-white">{current.name}</p>
                  {current.message ? (
                    <p className="rounded-lg bg-amber-500/10 px-3 py-2 text-[12px] text-amber-100">
                      {current.message}
                    </p>
                  ) : null}
                  <select
                    value={form.employment_status}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        employment_status: e.target.value as "" | EmploymentStatus,
                      }))
                    }
                    className="w-full rounded-xl border border-white/10 bg-[#12141A] px-3 py-2 text-sm text-white"
                  >
                    <option value="">— Statut emploi —</option>
                    {EMPLOYMENT_STATUSES.map((s) => (
                      <option key={s} value={s}>
                        {EMPLOYMENT_STATUS_LABELS[s]}
                      </option>
                    ))}
                  </select>
                  <div className="grid gap-2 sm:grid-cols-2">
                    <label className="text-[11px] text-[#9AA3BD]">
                      Contrat signé le
                      <input
                        type="date"
                        value={form.subcontract_signed_at}
                        onChange={(e) =>
                          setForm((f) => ({ ...f, subcontract_signed_at: e.target.value }))
                        }
                        className="mt-1 w-full rounded-xl border border-white/10 bg-[#12141A] px-3 py-2 text-sm text-white"
                      />
                    </label>
                    <label className="text-[11px] text-[#9AA3BD]">
                      Contrat fin
                      <input
                        type="date"
                        value={form.subcontract_ends_at}
                        onChange={(e) =>
                          setForm((f) => ({ ...f, subcontract_ends_at: e.target.value }))
                        }
                        className="mt-1 w-full rounded-xl border border-white/10 bg-[#12141A] px-3 py-2 text-sm text-white"
                      />
                    </label>
                  </div>
                  <label className="flex items-center gap-2 text-sm text-white/80">
                    <input
                      type="checkbox"
                      checked={form.quality_commitment}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, quality_commitment: e.target.checked }))
                      }
                    />
                    Engagement respect du référentiel qualité
                  </label>
                  <div className="flex flex-wrap gap-2 pt-1">
                    <Button
                      type="button"
                      disabled={busy}
                      className="bg-[#6E5BFF] text-white"
                      onClick={() => void save()}
                    >
                      {busy ? "…" : "Enregistrer"}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      className="border-white/15 bg-transparent text-white"
                      onClick={downloadContract}
                    >
                      <Download className="mr-1.5 h-3.5 w-3.5" />
                      Contrat type
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      className="border-white/15 bg-transparent text-white"
                      onClick={onClose}
                    >
                      Fermer
                    </Button>
                  </div>
                  <p className="text-[11px] text-[#9AA3BD]">
                    Le contrat type est uniformisé pour tous les indépendants / portage. Faites-le
                    signer puis déposez le PDF signé dans l’espace Expert → Documents → Contrats,
                    ou renseignez les dates ici.
                  </p>
                </>
              ) : (
                <p className="text-sm text-[#9AA3BD]">Sélectionnez un intervenant.</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
