"use client";

import { useRef, useState } from "react";
import { Download, Upload, UserPlus, X } from "lucide-react";
import { toast } from "sonner";
import type { EntrepriseEmployee } from "@/hooks/use-entreprise-overview";

type Props = {
  organisationId: string | null;
  employees: EntrepriseEmployee[];
  organisationName?: string;
  onSuccess: () => void;
  departments?: string[];
};

export function exportEmployeesCsv(employees: EntrepriseEmployee[], organisationName?: string) {
  if (!employees.length) {
    toast.error("Aucun collaborateur à exporter");
    return;
  }
  const header = "Nom,Prénom,Email,Département,Poste,Date d'ajout,Statut diagnostic,Score IDMC";
  const rows = employees.map((e) => {
    const diag = e.diagnostic_done ? "Complété" : "En attente";
    const score = e.idmc_score != null ? String(Math.round(e.idmc_score)) : "";
    const date = e.created_at ? new Date(e.created_at).toLocaleDateString("fr-FR") : "";
    return [e.last_name ?? "", e.first_name ?? "", e.email ?? "", e.department ?? "", e.job_title ?? "", date, diag, score]
      .map((c) => `"${String(c).replace(/"/g, '""')}"`)
      .join(",");
  });
  const csv = [header, ...rows].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `collaborateurs-${organisationName || "entreprise"}.csv`;
  a.click();
  URL.revokeObjectURL(url);
  toast.success("Export CSV téléchargé");
}

export function EnterpriseEmployeeCsvActions({
  organisationId,
  employees,
  organisationName,
  onSuccess,
  departments = [],
}: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importPreview, setImportPreview] = useState<{
    sample: Array<{ first_name: string; last_name: string; email: string | null }>;
    stats: { total: number };
  } | null>(null);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [addForm, setAddForm] = useState({
    first_name: "",
    last_name: "",
    email: "",
    department: "",
    job_title: "",
  });

  const deptOptions = [
    ...new Set([...departments, addForm.department].filter(Boolean) as string[]),
  ].sort();

  const requireOrg = () => {
    if (!organisationId) {
      toast.error("Organisation non configurée — complétez l'onboarding avant d'importer.");
      return false;
    }
    return true;
  };

  const handleImportFile = async (file: File) => {
    if (!requireOrg()) return;
    setPendingFile(file);
    const fd = new FormData();
    fd.append("file", file);
    fd.append("organisation_id", organisationId!);
    fd.append("preview", "1");
    try {
      const res = await fetch("/api/onboarding/import-csv", { method: "POST", body: fd });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Aperçu impossible");
      setImportPreview({ sample: json.sample ?? [], stats: json.stats ?? { total: 0 } });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erreur");
      setPendingFile(null);
    }
  };

  const confirmImport = async () => {
    if (!pendingFile || !organisationId) return;
    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append("file", pendingFile);
      fd.append("organisation_id", organisationId);
      const res = await fetch("/api/onboarding/import-csv", { method: "POST", body: fd });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Import impossible");

      const inviteRes = await fetch("/api/onboarding/invite-collaborators", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ organisation_id: organisationId }),
      });
      const inviteJson = await inviteRes.json();
      const invited = inviteRes.ok ? Number(inviteJson.sent ?? 0) : 0;
      const imported = Number(json.employes_importes ?? 0);

      toast.success(
        `${imported} collaborateurs importés${invited > 0 ? `, ${invited} invitations envoyées` : ""}`,
      );
      setImportPreview(null);
      setPendingFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      onSuccess();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erreur");
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddEmployee = async () => {
    if (!requireOrg()) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/dashboard/entreprise/employees", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(addForm),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Erreur");
      toast.success(json.invite_sent ? "Collaborateur ajouté — invitation envoyée" : "Collaborateur ajouté");
      setShowAddModal(false);
      setAddForm({ first_name: "", last_name: "", email: "", department: "", job_title: "" });
      onSuccess();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erreur");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <div className="flex flex-wrap gap-2">
        <label
          className={`flex cursor-pointer items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 ${!organisationId ? "pointer-events-none opacity-50" : ""}`}
        >
          <Upload size={15} />
          Importer CSV
          <input
            id="entreprise-csv-import"
            ref={fileInputRef}
            type="file"
            accept=".csv,.xlsx,.xls"
            className="hidden"
            disabled={!organisationId}
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void handleImportFile(f);
            }}
          />
        </label>
        <button
          type="button"
          onClick={() => exportEmployeesCsv(employees, organisationName)}
          className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
        >
          <Download size={15} />
          Exporter CSV
        </button>
        <button
          type="button"
          onClick={() => (organisationId ? setShowAddModal(true) : requireOrg())}
          className="flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2 text-sm font-semibold text-white hover:bg-violet-500"
        >
          <UserPlus size={15} />
          Ajouter
        </button>
      </div>

      {importPreview ? (
        <div className="mt-4 rounded-2xl border border-violet-200 bg-violet-50/50 p-5">
          <p className="font-semibold text-gray-900">Aperçu import — {importPreview.stats.total} lignes</p>
          <div className="mt-3 overflow-x-auto rounded-lg border border-gray-200 bg-white">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-xs uppercase text-gray-400">
                  <th className="px-3 py-2">Prénom</th>
                  <th className="px-3 py-2">Nom</th>
                  <th className="px-3 py-2">Email</th>
                </tr>
              </thead>
              <tbody>
                {importPreview.sample.slice(0, 5).map((row, i) => (
                  <tr key={i} className="border-b border-gray-50">
                    <td className="px-3 py-2">{row.first_name}</td>
                    <td className="px-3 py-2">{row.last_name}</td>
                    <td className="px-3 py-2">{row.email ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-4 flex gap-2">
            <button
              type="button"
              onClick={() => {
                setImportPreview(null);
                setPendingFile(null);
              }}
              className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700"
            >
              Annuler
            </button>
            <button
              type="button"
              disabled={submitting}
              onClick={() => void confirmImport()}
              className="rounded-xl bg-violet-600 px-4 py-2 text-sm font-semibold text-white hover:bg-violet-500 disabled:opacity-50"
            >
              Confirmer l&apos;import
            </button>
          </div>
        </div>
      ) : null}

      {showAddModal ? (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-900">Ajouter un collaborateur</h3>
              <button type="button" onClick={() => setShowAddModal(false)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-gray-500">Prénom *</label>
                  <input
                    className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                    value={addForm.first_name}
                    onChange={(e) => setAddForm((f) => ({ ...f, first_name: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500">Nom *</label>
                  <input
                    className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                    value={addForm.last_name}
                    onChange={(e) => setAddForm((f) => ({ ...f, last_name: e.target.value }))}
                  />
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500">Email *</label>
                <input
                  type="email"
                  className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                  value={addForm.email}
                  onChange={(e) => setAddForm((f) => ({ ...f, email: e.target.value }))}
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500">Département</label>
                <input
                  list="dept-list"
                  className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                  value={addForm.department}
                  onChange={(e) => setAddForm((f) => ({ ...f, department: e.target.value }))}
                />
                <datalist id="dept-list">
                  {deptOptions.map((d) => (
                    <option key={d} value={d} />
                  ))}
                </datalist>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500">Poste</label>
                <input
                  className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                  value={addForm.job_title}
                  onChange={(e) => setAddForm((f) => ({ ...f, job_title: e.target.value }))}
                />
              </div>
            </div>
            <p className="mt-4 rounded-lg bg-violet-50 px-3 py-2 text-xs text-violet-800">
              ✉️ Un email d&apos;invitation sera envoyé automatiquement
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700"
              >
                Annuler
              </button>
              <button
                type="button"
                disabled={submitting}
                onClick={() => void handleAddEmployee()}
                className="rounded-xl bg-violet-600 px-4 py-2 text-sm font-semibold text-white hover:bg-violet-500 disabled:opacity-50"
              >
                Ajouter →
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
