"use client";

import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { Loader2, Plus, Upload } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  QUALIOPI_CARD,
  QUALIOPI_MUTED,
} from "@/components/super-admin/qualiopi/qualiopi-audit-styles";
import {
  CRITICALITY_BAND_LABELS,
  RISK_STATUSES,
  RISK_STATUS_LABELS,
  computeCriticality,
  criticalityBand,
  type QualiopiRiskRow,
  type RiskStatus,
} from "@/lib/qualiopi/risks";
import { cn } from "@/lib/utils";

const EMPTY_FORM = {
  label: "",
  cause: "",
  probability: 2,
  severity: 2,
  preventive_action: "",
  owner_name: "",
  due_at: "",
  reviewed_at: "",
  status: "open" as RiskStatus,
};

export function QualiopiRisksPanel() {
  const [risks, setRisks] = useState<QualiopiRiskRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<RiskStatus | "all">("all");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/super-admin/crm/qualiopi/risks");
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Chargement impossible");
      const list = (json.risks ?? []) as QualiopiRiskRow[];
      setRisks(list);
      setSelectedId((prev) => {
        if (prev && list.some((r) => r.id === prev)) return prev;
        return list[0]?.id ?? null;
      });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erreur");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const filtered = useMemo(() => {
    if (statusFilter === "all") return risks;
    return risks.filter((r) => r.status === statusFilter);
  }, [risks, statusFilter]);

  const selected = useMemo(
    () => filtered.find((r) => r.id === selectedId) ?? filtered[0] ?? null,
    [filtered, selectedId],
  );

  useEffect(() => {
    if (!selected) return;
    setForm({
      label: selected.label,
      cause: selected.cause ?? "",
      probability: selected.probability,
      severity: selected.severity,
      preventive_action: selected.preventive_action ?? "",
      owner_name: selected.owner_name ?? "",
      due_at: selected.due_at ?? "",
      reviewed_at: selected.reviewed_at ?? "",
      status: selected.status,
    });
  }, [selected?.id]);

  const previewCrit = computeCriticality(form.probability, form.severity);

  const create = async () => {
    setBusy(true);
    try {
      const res = await fetch("/api/super-admin/crm/qualiopi/risks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Création impossible");
      toast.success("Risque ajouté");
      setForm(EMPTY_FORM);
      await load();
      if (json.risk?.id) setSelectedId(json.risk.id);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erreur");
    } finally {
      setBusy(false);
    }
  };

  const save = async () => {
    if (!selected) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/super-admin/crm/qualiopi/risks/${selected.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Enregistrement impossible");
      toast.success("Risque mis à jour");
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erreur");
    } finally {
      setBusy(false);
    }
  };

  const linkPaq = async () => {
    if (!selected) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/super-admin/crm/qualiopi/risks/${selected.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "link_paq" }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Lien PAQ impossible");
      toast.success("Action PAQ créée et liée");
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erreur");
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    if (!selected) return;
    if (!window.confirm("Supprimer ce risque ?")) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/super-admin/crm/qualiopi/risks/${selected.id}`, {
        method: "DELETE",
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Suppression impossible");
      toast.success("Risque supprimé");
      setSelectedId(null);
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erreur");
    } finally {
      setBusy(false);
    }
  };

  const exportPdf = async () => {
    const res = await fetch("/api/super-admin/crm/qualiopi/risks?format=pdf");
    if (!res.ok) {
      toast.error("Export PDF impossible");
      return;
    }
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `registre-risques-qualiopi-${new Date().toISOString().slice(0, 10)}.pdf`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("PDF téléchargé");
  };

  const importCsv = async (file: File) => {
    setBusy(true);
    try {
      const text = await file.text();
      const res = await fetch("/api/super-admin/crm/qualiopi/risks?import=1", {
        method: "POST",
        headers: { "Content-Type": "text/csv" },
        body: text,
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Import impossible");
      toast.success(`${json.imported ?? 0} risque(s) importé(s)`);
      if (json.errors?.length) toast.message(String(json.errors[0]));
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erreur");
    } finally {
      setBusy(false);
    }
  };

  const field = (
    label: string,
    children: ReactNode,
    className?: string,
  ) => (
    <div className={cn("space-y-1", className)}>
      <label className={cn("block text-[11px]", QUALIOPI_MUTED)}>{label}</label>
      {children}
    </div>
  );

  const inputClass =
    "w-full rounded-xl border border-white/10 bg-[#0B1122] px-3 py-2 text-sm text-white outline-none focus:border-[#6E5BFF]";

  return (
    <div className={cn(QUALIOPI_CARD, "space-y-5")}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white sm:text-3xl">Registre des risques</h1>
          <p className={cn("mt-1 max-w-2xl text-sm", QUALIOPI_MUTED)}>
            Qualiopi ind. 32 — criticité = probabilité × gravité (1–16). Lien possible vers une
            action PAQ, une réclamation ou un highlight de veille.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="border-white/15 bg-transparent text-white"
            onClick={() => void exportPdf()}
          >
            Export PDF
          </Button>
          <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-md border border-white/15 px-3 py-1.5 text-sm text-white hover:bg-white/5">
            <Upload className="h-3.5 w-3.5" />
            Import CSV
            <input
              type="file"
              accept=".csv,text/csv"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) void importCsv(f);
                e.target.value = "";
              }}
            />
          </label>
        </div>
      </div>

      <p className={cn("text-[11px]", QUALIOPI_MUTED)}>
        CSV attendu : libelle,cause,probabilite,gravite,action_preventive,responsable,echeance,statut
      </p>

      {loading ? (
        <p className={cn("flex items-center gap-2 text-sm", QUALIOPI_MUTED)}>
          <Loader2 className="h-4 w-4 animate-spin" /> Chargement…
        </p>
      ) : (
        <div className="grid gap-4 lg:grid-cols-[1fr_1.15fr]">
          <div className="space-y-3">
            <div className="flex flex-wrap gap-1">
              {(["all", ...RISK_STATUSES] as const).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setStatusFilter(s)}
                  className={cn(
                    "rounded-full px-2.5 py-1 text-[11px] font-semibold",
                    statusFilter === s
                      ? "bg-[#6E5BFF] text-white"
                      : "bg-white/5 text-white/70 hover:bg-white/10",
                  )}
                >
                  {s === "all" ? `Tous (${risks.length})` : RISK_STATUS_LABELS[s]}
                </button>
              ))}
            </div>
            <ul className="max-h-[480px] space-y-2 overflow-y-auto">
              {filtered.length === 0 ? (
                <li className={cn("rounded-xl border border-white/10 px-3 py-4 text-sm", QUALIOPI_MUTED)}>
                  Aucun risque — créez-en un ou importez un CSV.
                </li>
              ) : (
                filtered.map((r) => {
                  const band = criticalityBand(r.criticality);
                  return (
                    <li key={r.id}>
                      <button
                        type="button"
                        onClick={() => setSelectedId(r.id)}
                        className={cn(
                          "w-full rounded-xl border px-3 py-2 text-left text-sm transition",
                          selected?.id === r.id
                            ? "border-[#6E5BFF] bg-[#6E5BFF]/15"
                            : "border-white/10 bg-white/[0.03] hover:border-white/20",
                        )}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <span className="font-medium text-white">{r.label}</span>
                          <span
                            className={cn(
                              "shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold",
                              band === "critique"
                                ? "bg-[#7F1D1D] text-white"
                                : band === "eleve"
                                  ? "bg-[#CA8A04] text-white"
                                  : band === "modere"
                                    ? "bg-[#1D4ED8] text-white"
                                    : "bg-white/10 text-white/80",
                            )}
                          >
                            C{r.criticality} · {CRITICALITY_BAND_LABELS[band]}
                          </span>
                        </div>
                        <p className={cn("mt-1 text-[11px]", QUALIOPI_MUTED)}>
                          P{r.probability}×G{r.severity} · {RISK_STATUS_LABELS[r.status]}
                          {r.owner_name ? ` · ${r.owner_name}` : ""}
                          {r.due_at ? ` · échéance ${r.due_at}` : ""}
                        </p>
                      </button>
                    </li>
                  );
                })
              )}
            </ul>
          </div>

          <div className="space-y-3 rounded-xl border border-white/10 bg-white/[0.03] p-4">
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-semibold text-white">
                {selected ? "Éditer le risque" : "Nouveau risque"}
              </p>
              <span className="rounded-full bg-white/10 px-2.5 py-0.5 text-[11px] text-white/80">
                Criticité {previewCrit} · {CRITICALITY_BAND_LABELS[criticalityBand(previewCrit)]}
              </span>
            </div>

            {field(
              "Libellé",
              <Input
                value={form.label}
                onChange={(e) => setForm((f) => ({ ...f, label: e.target.value }))}
                className={inputClass}
                placeholder="Ex. Abandon en cours de formation distancielle"
              />,
            )}
            {field(
              "Cause",
              <textarea
                value={form.cause}
                onChange={(e) => setForm((f) => ({ ...f, cause: e.target.value }))}
                rows={2}
                className={inputClass}
              />,
            )}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {field(
                "Probabilité (1–4)",
                <Input
                  type="number"
                  min={1}
                  max={4}
                  value={form.probability}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, probability: Number(e.target.value) || 1 }))
                  }
                  className={inputClass}
                />,
              )}
              {field(
                "Gravité (1–4)",
                <Input
                  type="number"
                  min={1}
                  max={4}
                  value={form.severity}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, severity: Number(e.target.value) || 1 }))
                  }
                  className={inputClass}
                />,
              )}
              {field(
                "Échéance",
                <Input
                  type="date"
                  value={form.due_at}
                  onChange={(e) => setForm((f) => ({ ...f, due_at: e.target.value }))}
                  className={inputClass}
                />,
              )}
              {field(
                "Date de revue",
                <Input
                  type="date"
                  value={form.reviewed_at}
                  onChange={(e) => setForm((f) => ({ ...f, reviewed_at: e.target.value }))}
                  className={inputClass}
                />,
              )}
            </div>
            {field(
              "Action préventive",
              <textarea
                value={form.preventive_action}
                onChange={(e) =>
                  setForm((f) => ({ ...f, preventive_action: e.target.value }))
                }
                rows={2}
                className={inputClass}
              />,
            )}
            <div className="grid gap-3 sm:grid-cols-2">
              {field(
                "Responsable",
                <Input
                  value={form.owner_name}
                  onChange={(e) => setForm((f) => ({ ...f, owner_name: e.target.value }))}
                  className={inputClass}
                />,
              )}
              {field(
                "Statut",
                <select
                  value={form.status}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, status: e.target.value as RiskStatus }))
                  }
                  className={inputClass}
                >
                  {RISK_STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {RISK_STATUS_LABELS[s]}
                    </option>
                  ))}
                </select>,
              )}
            </div>

            <div className="flex flex-wrap gap-2 pt-1">
              {selected ? (
                <>
                  <Button
                    type="button"
                    disabled={busy}
                    className="bg-[#6E5BFF] text-white"
                    onClick={() => void save()}
                  >
                    Enregistrer
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    disabled={busy || Boolean(selected.action_id)}
                    className="border-white/15 bg-transparent text-white"
                    onClick={() => void linkPaq()}
                  >
                    {selected.action_id ? "Action PAQ liée" : "Créer action PAQ"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    disabled={busy}
                    className="border-white/15 bg-transparent text-[#F87171]"
                    onClick={() => void remove()}
                  >
                    Supprimer
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="border-white/15 bg-transparent text-white"
                    onClick={() => {
                      setSelectedId(null);
                      setForm(EMPTY_FORM);
                    }}
                  >
                    <Plus className="mr-1 h-3.5 w-3.5" />
                    Nouveau
                  </Button>
                </>
              ) : (
                <Button
                  type="button"
                  disabled={busy || form.label.trim().length < 3}
                  className="bg-[#6E5BFF] text-white"
                  onClick={() => void create()}
                >
                  <Plus className="mr-1 h-3.5 w-3.5" />
                  Ajouter le risque
                </Button>
              )}
            </div>
            {selected?.action_id ? (
              <p className={cn("text-[11px]", QUALIOPI_MUTED)}>
                Lié à l&apos;action PAQ {selected.action_id.slice(0, 8)}…
                {selected.reclamation_id ? " · réclamation" : ""}
                {selected.highlight_id ? " · veille" : ""}
              </p>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}
