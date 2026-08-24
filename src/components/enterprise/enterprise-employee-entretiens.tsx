"use client";

import { useMemo, useState } from "react";
import { FileText, MapPin, Pencil, Plus, Trash2, Users } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { isEdgebsDemoEmployeeId } from "@/lib/entreprise/edgebs-demo-enrich";
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

export type InterviewDetails = {
  participants: string;
  location: string;
  time: string;
  employee_feedback: string;
  hr_feedback: string;
  extra_notes: string;
};

const DOC_TYPE_LABEL: Record<string, string> = {
  entretien_individuel: "Entretien individuel",
  bilan_annuel: "Bilan annuel",
  autre: "Autre",
};

const EMPTY_DETAILS: InterviewDetails = {
  participants: "",
  location: "",
  time: "",
  employee_feedback: "",
  hr_feedback: "",
  extra_notes: "",
};

type FormState = {
  document_type: string;
  title: string;
  document_date: string;
  details: InterviewDetails;
};

const EMPTY_FORM: FormState = {
  document_type: "entretien_individuel",
  title: "",
  document_date: "",
  details: EMPTY_DETAILS,
};

export function parseInterviewDetails(notes: string | null | undefined): InterviewDetails {
  if (!notes?.trim()) return { ...EMPTY_DETAILS };
  try {
    const parsed = JSON.parse(notes) as Partial<InterviewDetails> & { kind?: string };
    if (parsed && typeof parsed === "object") {
      return {
        participants: String(parsed.participants ?? ""),
        location: String(parsed.location ?? ""),
        time: String(parsed.time ?? ""),
        employee_feedback: String(parsed.employee_feedback ?? ""),
        hr_feedback: String(parsed.hr_feedback ?? ""),
        extra_notes: String(parsed.extra_notes ?? (parsed.kind ? "" : notes)),
      };
    }
  } catch {
    // notes libres historiques
  }
  return { ...EMPTY_DETAILS, extra_notes: notes };
}

export function serializeInterviewDetails(details: InterviewDetails): string {
  return JSON.stringify({
    kind: "entretien_v1",
    participants: details.participants.trim(),
    location: details.location.trim(),
    time: details.time.trim(),
    employee_feedback: details.employee_feedback.trim(),
    hr_feedback: details.hr_feedback.trim(),
    extra_notes: details.extra_notes.trim(),
  });
}

function defaultTitle(type: string, date: string) {
  const label = DOC_TYPE_LABEL[type] ?? "Entretien";
  if (!date) return label;
  return `${label} — ${new Date(date).toLocaleDateString("fr-FR")}`;
}

type Props = {
  employeeId: string;
  documents: HrDocument[];
  onDocumentsChange: (docs: HrDocument[]) => void;
};

export function EnterpriseEmployeeEntretiensSection({
  employeeId,
  documents,
  onDocumentsChange,
}: Props) {
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const entretiens = useMemo(
    () =>
      documents.filter((d) =>
        ["entretien_individuel", "bilan_annuel", "autre"].includes(d.document_type),
      ),
    [documents],
  );

  const openCreate = () => {
    setEditingId(null);
    setForm({
      ...EMPTY_FORM,
      document_date: new Date().toISOString().slice(0, 10),
      title: "",
    });
    setOpen(true);
  };

  const openEdit = (doc: HrDocument) => {
    setEditingId(doc.id);
    setForm({
      document_type: doc.document_type || "entretien_individuel",
      title: doc.title,
      document_date: doc.document_date ?? "",
      details: parseInterviewDetails(doc.notes),
    });
    setOpen(true);
  };

  const save = async () => {
    const title = form.title.trim() || defaultTitle(form.document_type, form.document_date);
    if (!form.document_date) {
      toast.error("La date est requise");
      return;
    }
    setSaving(true);
    try {
      const notes = serializeInterviewDetails(form.details);
      const isDemo = isEdgebsDemoEmployeeId(employeeId);

      if (isDemo) {
        const nextDoc: HrDocument = {
          id: editingId ?? `edgebs-entretien-${Date.now()}`,
          document_type: form.document_type,
          title,
          document_date: form.document_date,
          notes,
          file_url: null,
          file_name: null,
          created_at: new Date().toISOString(),
        };
        if (editingId) {
          onDocumentsChange(documents.map((d) => (d.id === editingId ? { ...d, ...nextDoc, id: editingId } : d)));
        } else {
          onDocumentsChange([nextDoc, ...documents]);
        }
        toast.success(editingId ? "Entretien mis à jour" : "Entretien ajouté");
        setOpen(false);
        return;
      }

      if (editingId) {
        const res = await fetch(
          `/api/dashboard/entreprise/employees/${encodeURIComponent(employeeId)}/documents`,
          {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              docId: editingId,
              document_type: form.document_type,
              title,
              document_date: form.document_date,
              notes,
            }),
          },
        );
        const json = (await res.json()) as { document?: HrDocument; error?: string };
        if (!res.ok || !json.document) throw new Error(json.error ?? "Erreur");
        onDocumentsChange(documents.map((d) => (d.id === editingId ? json.document! : d)));
        toast.success("Entretien mis à jour");
      } else {
        const formData = new FormData();
        formData.set("document_type", form.document_type);
        formData.set("title", title);
        formData.set("document_date", form.document_date);
        formData.set("notes", notes);
        const res = await fetch(
          `/api/dashboard/entreprise/employees/${encodeURIComponent(employeeId)}/documents`,
          { method: "POST", body: formData },
        );
        const json = (await res.json()) as { document?: HrDocument; error?: string };
        if (!res.ok || !json.document) throw new Error(json.error ?? "Erreur");
        onDocumentsChange([json.document, ...documents]);
        toast.success("Entretien ajouté");
      }
      setOpen(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erreur");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (docId: string) => {
    if (!confirm("Supprimer cet entretien ?")) return;
    try {
      if (isEdgebsDemoEmployeeId(employeeId)) {
        onDocumentsChange(documents.filter((d) => d.id !== docId));
        toast.success("Entretien supprimé");
        return;
      }
      const res = await fetch(
        `/api/dashboard/entreprise/employees/${encodeURIComponent(employeeId)}/documents?docId=${encodeURIComponent(docId)}`,
        { method: "DELETE" },
      );
      const json = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(json.error ?? "Erreur");
      onDocumentsChange(documents.filter((d) => d.id !== docId));
      toast.success("Entretien supprimé");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erreur");
    }
  };

  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-black tracking-tight text-gray-950">Entretiens &amp; bilans RH</h2>
          <p className="mt-1 text-sm text-gray-500">
            Ajoutez ou modifiez un entretien : participants, lieu, retours collaborateur et RH.
          </p>
        </div>
        <Button
          type="button"
          onClick={openCreate}
          className="rounded-full bg-[#0f766e] text-white hover:bg-[#0d9488]"
        >
          <Plus className="h-4 w-4" />
          Ajouter
        </Button>
      </div>

      <ul className="mt-5 space-y-3">
        {entretiens.length === 0 ? (
          <li className="rounded-xl border border-dashed border-gray-200 bg-gray-50 px-4 py-6 text-center text-sm text-gray-500">
            Aucun entretien enregistré.
          </li>
        ) : (
          entretiens.map((doc) => {
            const details = parseInterviewDetails(doc.notes);
            return (
              <li
                key={doc.id}
                className="rounded-2xl border border-gray-100 bg-[#fafafa] px-4 py-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start gap-3">
                      <FileText className="mt-0.5 h-4 w-4 shrink-0 text-teal-600" />
                      <div className="min-w-0">
                        <p className="font-semibold text-gray-900">{doc.title}</p>
                        <p className="mt-1 text-xs text-gray-500">
                          {DOC_TYPE_LABEL[doc.document_type] ?? doc.document_type}
                          {doc.document_date
                            ? ` · ${new Date(doc.document_date).toLocaleDateString("fr-FR")}`
                            : ""}
                          {details.time ? ` · ${details.time}` : ""}
                        </p>
                        {details.participants ? (
                          <p className="mt-2 flex items-start gap-1.5 text-sm text-gray-700">
                            <Users className="mt-0.5 h-3.5 w-3.5 shrink-0 text-gray-400" />
                            {details.participants}
                          </p>
                        ) : null}
                        {details.location ? (
                          <p className="mt-1 flex items-start gap-1.5 text-sm text-gray-700">
                            <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-gray-400" />
                            {details.location}
                          </p>
                        ) : null}
                        {(details.employee_feedback || details.hr_feedback) && (
                          <div className="mt-3 grid gap-2 sm:grid-cols-2">
                            {details.employee_feedback ? (
                              <div className="rounded-xl bg-white px-3 py-2 text-xs text-gray-700">
                                <p className="font-bold uppercase tracking-wide text-gray-500">
                                  Retour collaborateur
                                </p>
                                <p className="mt-1 whitespace-pre-wrap">{details.employee_feedback}</p>
                              </div>
                            ) : null}
                            {details.hr_feedback ? (
                              <div className="rounded-xl bg-white px-3 py-2 text-xs text-gray-700">
                                <p className="font-bold uppercase tracking-wide text-gray-500">Retour RH</p>
                                <p className="mt-1 whitespace-pre-wrap">{details.hr_feedback}</p>
                              </div>
                            ) : null}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <button
                      type="button"
                      onClick={() => openEdit(doc)}
                      className="rounded-lg p-2 text-gray-400 transition hover:bg-teal-50 hover:text-teal-700"
                      aria-label="Modifier"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => void remove(doc.id)}
                      className={cn(
                        "rounded-lg p-2 text-gray-400 transition hover:bg-red-50 hover:text-red-600",
                      )}
                      aria-label="Supprimer"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </li>
            );
          })
        )}
      </ul>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto rounded-[24px]">
          <DialogHeader>
            <DialogTitle>{editingId ? "Modifier l'entretien" : "Ajouter un entretien"}</DialogTitle>
            <DialogDescription>
              Renseignez le cadre de l&apos;entretien et les retours collaborateur / RH.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="space-y-1.5 sm:col-span-2">
              <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">Type</span>
              <select
                value={form.document_type}
                onChange={(e) => setForm((prev) => ({ ...prev, document_type: e.target.value }))}
                className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm"
              >
                <option value="entretien_individuel">Entretien individuel</option>
                <option value="bilan_annuel">Bilan annuel</option>
                <option value="autre">Autre</option>
              </select>
            </label>

            <label className="space-y-1.5 sm:col-span-2">
              <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">Titre</span>
              <Input
                value={form.title}
                onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
                placeholder="Ex. Entretien individuel Q2"
              />
            </label>

            <label className="space-y-1.5">
              <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">Date</span>
              <Input
                type="date"
                value={form.document_date}
                onChange={(e) => setForm((prev) => ({ ...prev, document_date: e.target.value }))}
              />
            </label>

            <label className="space-y-1.5">
              <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">Heure</span>
              <Input
                type="time"
                value={form.details.time}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    details: { ...prev.details, time: e.target.value },
                  }))
                }
              />
            </label>

            <label className="space-y-1.5 sm:col-span-2">
              <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                Qui participe
              </span>
              <Input
                value={form.details.participants}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    details: { ...prev.details, participants: e.target.value },
                  }))
                }
                placeholder="Ex. Sarah Petit, Clara Martin (RH), Manager Sales"
              />
            </label>

            <label className="space-y-1.5 sm:col-span-2">
              <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">Lieu</span>
              <Input
                value={form.details.location}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    details: { ...prev.details, location: e.target.value },
                  }))
                }
                placeholder="Ex. Salle Horizon / Visio Teams"
              />
            </label>

            <label className="space-y-1.5 sm:col-span-2">
              <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                Retour du collaborateur
              </span>
              <Textarea
                value={form.details.employee_feedback}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    details: { ...prev.details, employee_feedback: e.target.value },
                  }))
                }
                placeholder="Points exprimés, besoins, ressenti…"
                className="min-h-[96px]"
              />
            </label>

            <label className="space-y-1.5 sm:col-span-2">
              <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                Retour du RH
              </span>
              <Textarea
                value={form.details.hr_feedback}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    details: { ...prev.details, hr_feedback: e.target.value },
                  }))
                }
                placeholder="Observation RH, décisions, prochaines étapes…"
                className="min-h-[96px]"
              />
            </label>

            <label className="space-y-1.5 sm:col-span-2">
              <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                Notes complémentaires
              </span>
              <Textarea
                value={form.details.extra_notes}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    details: { ...prev.details, extra_notes: e.target.value },
                  }))
                }
                placeholder="Optionnel"
                className="min-h-[72px]"
              />
            </label>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Annuler
            </Button>
            <Button
              type="button"
              className="bg-[#0f766e] text-white hover:bg-[#0d9488]"
              disabled={saving}
              onClick={() => void save()}
            >
              {saving ? "Enregistrement…" : editingId ? "Enregistrer" : "Ajouter l'entretien"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}
