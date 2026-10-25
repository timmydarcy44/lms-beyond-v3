"use client";

import { useEffect, useRef, useState } from "react";
import { Calendar, FileText, Mail, Phone, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";
import { formatSeniority } from "@/lib/entreprise/seniority";
import { cn } from "@/lib/utils";

export type HrDocument = {
  id: string;
  document_type: string;
  title: string;
  document_date: string | null;
  notes: string | null;
  file_url: string | null;
  file_name: string | null;
  created_at: string;
};

const DOC_TYPE_LABEL: Record<string, string> = {
  entretien_individuel: "Entretien individuel",
  bilan_annuel: "Bilan annuel",
  autre: "Autre document",
};

type Props = {
  employeeId: string;
  email: string | null;
  phone: string | null;
  hireDate: string | null;
  jobTitle?: string | null;
  metier?: string | null;
  documents: HrDocument[];
  editing?: boolean;
  /** Affiche uniquement les coordonnées (sans entretiens). */
  showContactOnly?: boolean;
  /** Affiche uniquement la section entretiens. */
  showEntretiensOnly?: boolean;
  onProfileChange: (patch: {
    phone?: string | null;
    hire_date?: string | null;
    job_title?: string | null;
    metier?: string | null;
  }) => void;
  onDocumentsChange: (docs: HrDocument[]) => void;
  /** Incrémenté par « Terminer » pour enregistrer poste et téléphone. */
  saveRequest?: number;
  onSaved?: () => void;
};

export function EnterpriseEmployeeHrPanel({
  employeeId,
  email,
  phone,
  hireDate,
  jobTitle = null,
  metier = null,
  documents,
  editing = false,
  showContactOnly = false,
  showEntretiensOnly = false,
  onProfileChange,
  onDocumentsChange,
  saveRequest = 0,
  onSaved,
}: Props) {
  const [editPhone, setEditPhone] = useState(phone ?? "");
  const [editHireDate, setEditHireDate] = useState(hireDate ?? "");
  const [editPoste, setEditPoste] = useState(jobTitle ?? "");
  const [editMetier, setEditMetier] = useState(metier ?? "");
  const [metiers, setMetiers] = useState<{ id: string; title: string }[]>([]);
  const [savingProfile, setSavingProfile] = useState(false);
  const [docType, setDocType] = useState("entretien_individuel");
  const [docTitle, setDocTitle] = useState("");
  const [docDate, setDocDate] = useState("");
  const [docNotes, setDocNotes] = useState("");
  const [docFile, setDocFile] = useState<File | null>(null);
  const [addingDoc, setAddingDoc] = useState(false);

  useEffect(() => {
    setEditPhone(phone ?? "");
    setEditHireDate(hireDate ?? "");
    setEditPoste(jobTitle ?? "");
    setEditMetier(metier ?? "");
  }, [phone, hireDate, jobTitle, metier]);

  useEffect(() => {
    if (!editing) return;
    let cancelled = false;
    void fetch("/api/dashboard/entreprise/metiers")
      .then((res) => res.json())
      .then((json: { roles?: { id: string; title: string }[] }) => {
        if (!cancelled) setMetiers(json.roles ?? []);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [editing]);

  const seniority = formatSeniority(hireDate);
  const showContact = !showEntretiensOnly;
  const showEntretiens = !showContactOnly;

  const draftRef = useRef({ phone: "", hireDate: "", poste: "", metier: "" });
  draftRef.current = {
    phone: editPhone,
    hireDate: editHireDate,
    poste: editPoste,
    metier: editMetier,
  };

  const saveProfile = async () => {
    const current = draftRef.current;
    setSavingProfile(true);
    try {
      const res = await fetch(`/api/dashboard/entreprise/employees/${employeeId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: current.phone.trim() || null,
          hire_date: current.hireDate || null,
          job_title: current.poste.trim() || null,
          metier: current.metier.trim() || null,
        }),
      });
      const json = (await res.json()) as { error?: string; warning?: string };
      if (!res.ok) throw new Error(json.error ?? "Erreur");
      if (json.warning) toast.warning(json.warning);
      onProfileChange({
        phone: current.phone.trim() || null,
        hire_date: current.hireDate || null,
        job_title: current.poste.trim() || null,
        metier: current.metier.trim() || null,
      });
      toast.success("Fiche mise à jour");
      return true;
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erreur");
      return false;
    } finally {
      setSavingProfile(false);
    }
  };

  useEffect(() => {
    if (!saveRequest) return;
    void saveProfile().then((ok) => {
      if (ok) onSaved?.();
    });
    // L'incrément vient du bouton Terminer, avec les champs déjà à jour.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [saveRequest]);

  const addDocument = async () => {
    if (!docTitle.trim()) {
      toast.error("Titre requis");
      return;
    }
    setAddingDoc(true);
    try {
      const form = new FormData();
      form.set("document_type", docType);
      form.set("title", docTitle.trim());
      if (docDate) form.set("document_date", docDate);
      if (docNotes.trim()) form.set("notes", docNotes.trim());
      if (docFile) form.set("file", docFile);

      const res = await fetch(`/api/dashboard/entreprise/employees/${employeeId}/documents`, {
        method: "POST",
        body: form,
      });
      const json = (await res.json()) as { document?: HrDocument; error?: string };
      if (!res.ok || !json.document) throw new Error(json.error ?? "Erreur");
      onDocumentsChange([json.document, ...documents]);
      setDocTitle("");
      setDocDate("");
      setDocNotes("");
      setDocFile(null);
      toast.success("Document ajouté");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erreur");
    } finally {
      setAddingDoc(false);
    }
  };

  const removeDocument = async (docId: string) => {
    if (!confirm("Supprimer ce document ?")) return;
    try {
      const res = await fetch(
        `/api/dashboard/entreprise/employees/${employeeId}/documents?docId=${encodeURIComponent(docId)}`,
        { method: "DELETE" },
      );
      const json = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(json.error ?? "Erreur");
      onDocumentsChange(documents.filter((d) => d.id !== docId));
      toast.success("Document supprimé");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erreur");
    }
  };

  return (
    <div className="space-y-6">
      {showContact ? (
        <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-sm font-bold uppercase tracking-widest text-gray-500">
            Coordonnées &amp; ancienneté
          </h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div className="flex items-start gap-3 rounded-2xl bg-gray-50 px-4 py-3">
              <Mail className="mt-0.5 h-4 w-4 text-gray-400" />
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Email</p>
                <p className="mt-1 text-sm font-medium text-gray-900">{email ?? "—"}</p>
              </div>
            </div>

            {editing ? (
              <div>
                <label className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
                  <Phone className="h-4 w-4" /> Téléphone
                </label>
                <input
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                  placeholder="06 12 34 56 78"
                  className="mt-1.5 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm"
                />
              </div>
            ) : (
              <div className="flex items-start gap-3 rounded-2xl bg-gray-50 px-4 py-3">
                <Phone className="mt-0.5 h-4 w-4 text-gray-400" />
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Téléphone</p>
                  <p className="mt-1 text-sm font-medium text-gray-900">{phone?.trim() || "—"}</p>
                </div>
              </div>
            )}

            {editing ? (
              <div>
                <label className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
                  <Calendar className="h-4 w-4" /> Date d&apos;entrée
                </label>
                <input
                  type="date"
                  value={editHireDate}
                  onChange={(e) => setEditHireDate(e.target.value)}
                  className="mt-1.5 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm"
                />
              </div>
            ) : (
              <div className="flex items-start gap-3 rounded-2xl bg-gray-50 px-4 py-3">
                <Calendar className="mt-0.5 h-4 w-4 text-gray-400" />
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Date d&apos;entrée</p>
                  <p className="mt-1 text-sm font-medium text-gray-900">
                    {hireDate
                      ? new Date(hireDate).toLocaleDateString("fr-FR", {
                          day: "2-digit",
                          month: "long",
                          year: "numeric",
                        })
                      : "—"}
                  </p>
                </div>
              </div>
            )}

            <div className="flex items-end">
              <div className="w-full rounded-2xl bg-violet-50 px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-violet-600">Ancienneté</p>
                <p className="mt-1 text-lg font-black text-violet-900">{seniority ?? "—"}</p>
              </div>
            </div>
          </div>
          {editing ? (
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div>
                <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">Poste</label>
                <input
                  value={editPoste}
                  onChange={(e) => setEditPoste(e.target.value)}
                  placeholder="Ex. Responsable commercial"
                  className="mt-1.5 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">Métier</label>
                <select
                  value={editMetier}
                  onChange={(e) => setEditMetier(e.target.value)}
                  className="mt-1.5 w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm"
                >
                  <option value="">Choisir un métier</option>
                  {editMetier && !metiers.some((role) => role.title === editMetier) ? (
                    <option value={editMetier}>{editMetier}</option>
                  ) : null}
                  {metiers.map((role) => (
                    <option key={role.id} value={role.title}>
                      {role.title}
                    </option>
                  ))}
                </select>
                {metiers.length === 0 ? (
                  <p className="mt-1.5 text-xs text-gray-500">
                    Ajoutez d&apos;abord un métier dans la section Métiers.
                  </p>
                ) : null}
              </div>
            </div>
          ) : null}
          {editing ? (
            <button
              type="button"
              disabled={savingProfile}
              onClick={() => void saveProfile()}
              className="mt-4 rounded-xl bg-gray-900 px-4 py-2 text-sm font-semibold text-white hover:bg-gray-800 disabled:opacity-60"
            >
              {savingProfile ? "Enregistrement…" : "Enregistrer les informations"}
            </button>
          ) : null}
        </section>
      ) : null}

      {showEntretiens ? (
        <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-black tracking-tight text-gray-950">Entretiens &amp; bilans RH</h2>
          <p className="mt-1 text-sm text-gray-500">
            Entretiens individuels, bilans annuels et documents associés.
          </p>

          {editing ? (
            <div className="mt-4 grid gap-3 rounded-2xl border border-dashed border-gray-200 bg-gray-50/80 p-4 sm:grid-cols-2">
              <select
                value={docType}
                onChange={(e) => setDocType(e.target.value)}
                className="rounded-xl border border-gray-200 px-3 py-2 text-sm"
              >
                <option value="entretien_individuel">Entretien individuel</option>
                <option value="bilan_annuel">Bilan annuel</option>
                <option value="autre">Autre</option>
              </select>
              <input
                value={docTitle}
                onChange={(e) => setDocTitle(e.target.value)}
                placeholder="Titre du document *"
                className="rounded-xl border border-gray-200 px-3 py-2 text-sm"
              />
              <input
                type="date"
                value={docDate}
                onChange={(e) => setDocDate(e.target.value)}
                className="rounded-xl border border-gray-200 px-3 py-2 text-sm"
              />
              <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-600">
                <Upload className="h-4 w-4" />
                <span className="truncate">{docFile?.name ?? "Joindre un fichier (PDF, DOC…)"}</span>
                <input
                  type="file"
                  className="hidden"
                  accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
                  onChange={(e) => setDocFile(e.target.files?.[0] ?? null)}
                />
              </label>
              <textarea
                value={docNotes}
                onChange={(e) => setDocNotes(e.target.value)}
                placeholder="Notes (optionnel)"
                rows={2}
                className="sm:col-span-2 rounded-xl border border-gray-200 px-3 py-2 text-sm"
              />
              <button
                type="button"
                disabled={addingDoc}
                onClick={() => void addDocument()}
                className="sm:col-span-2 rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-violet-700 disabled:opacity-60"
              >
                {addingDoc ? "Ajout…" : "+ Ajouter le document"}
              </button>
            </div>
          ) : null}

          <ul className="mt-4 space-y-2">
            {documents.length === 0 ? (
              <li className="text-sm text-gray-500">Aucun document RH enregistré.</li>
            ) : (
              documents.map((doc) => (
                <li
                  key={doc.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-gray-100 bg-white px-4 py-3"
                >
                  <div className="flex min-w-0 items-start gap-3">
                    <FileText className="mt-0.5 h-4 w-4 shrink-0 text-violet-500" />
                    <div className="min-w-0">
                      <p className="font-semibold text-gray-900">{doc.title}</p>
                      <p className="text-xs text-gray-500">
                        {DOC_TYPE_LABEL[doc.document_type] ?? doc.document_type}
                        {doc.document_date
                          ? ` · ${new Date(doc.document_date).toLocaleDateString("fr-FR")}`
                          : ""}
                      </p>
                      {doc.notes ? <p className="mt-1 text-xs text-gray-600">{doc.notes}</p> : null}
                      {doc.file_url ? (
                        <a
                          href={doc.file_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-1 inline-block text-xs font-semibold text-violet-600 underline"
                        >
                          {doc.file_name ?? "Ouvrir le fichier"}
                        </a>
                      ) : null}
                    </div>
                  </div>
                  {editing ? (
                    <button
                      type="button"
                      onClick={() => void removeDocument(doc.id)}
                      className={cn(
                        "rounded-lg p-2 text-gray-400 transition hover:bg-red-50 hover:text-red-600",
                      )}
                      aria-label="Supprimer"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  ) : null}
                </li>
              ))
            )}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
