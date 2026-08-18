"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { FileText, Plus, Trash2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { PipelineBtobSubnav } from "@/components/super-admin/pipeline-btob-subnav";
import {
  formatSignedAt,
  qualiopiKindLabel,
  type QualiopiDocKind,
  type QualiopiDocument,
  type QualiopiSession,
} from "@/lib/crm/qualiopi-shared";

export default function CrmQualiopiPage() {
  const [documents, setDocuments] = useState<QualiopiDocument[]>([]);
  const [sessions, setSessions] = useState<QualiopiSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [kind, setKind] = useState<QualiopiDocKind>("autre");
  const [replaceId, setReplaceId] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const [docsRes, sessionsRes] = await Promise.all([
        fetch("/api/super-admin/crm/qualiopi/documents"),
        fetch("/api/super-admin/crm/qualiopi/sessions"),
      ]);
      const docsJson = await docsRes.json();
      const sessionsJson = await sessionsRes.json();
      if (!docsRes.ok) throw new Error(docsJson.error || "Documents indisponibles");
      setDocuments(docsJson.documents ?? []);
      setSessions(sessionsJson.sessions ?? []);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Chargement impossible");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const openAdd = (preset?: { id?: string; kind?: QualiopiDocKind; title?: string }) => {
    setReplaceId(preset?.id ?? null);
    setKind(preset?.kind ?? "autre");
    setTitle(preset?.title ?? "");
    setFile(null);
    setDialogOpen(true);
  };

  const saveDoc = async () => {
    if (!title.trim()) {
      toast.error("Titre obligatoire");
      return;
    }
    setSaving(true);
    try {
      const form = new FormData();
      form.set("title", title.trim());
      form.set("kind", kind);
      if (replaceId) form.set("id", replaceId);
      if (file) form.set("file", file);
      const res = await fetch("/api/super-admin/crm/qualiopi/documents", { method: "POST", body: form });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Enregistrement impossible");
      toast.success("Document enregistré");
      setDialogOpen(false);
      await load();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Enregistrement impossible");
    } finally {
      setSaving(false);
    }
  };

  const removeDoc = async (doc: QualiopiDocument) => {
    if (!confirm(doc.kind === "autre" ? "Supprimer ce document ?" : "Retirer le fichier de ce modèle ?")) return;
    const res = await fetch(`/api/super-admin/crm/qualiopi/documents/${doc.id}`, { method: "DELETE" });
    if (!res.ok) {
      toast.error("Suppression impossible");
      return;
    }
    await load();
  };

  return (
    <div className="space-y-6 px-3 py-6 sm:px-6 sm:py-8">
      <div className="space-y-3">
        <p className="text-xs font-medium uppercase tracking-wider text-gray-500">CRM / Qualiopi</p>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">Administratif Qualiopi</h1>
            <p className="mt-1 max-w-2xl text-sm text-gray-600">
              Coffre des pièces (convention, règlement intérieur, livret d’accueil). Elles partent automatiquement
              quand un client passe en formation programmée, puis en formation en cours.
            </p>
          </div>
          <Button onClick={() => openAdd()} className="rounded-full bg-indigo-600 hover:bg-indigo-500">
            <Plus className="mr-1 h-4 w-4" />
            Ajouter un document
          </Button>
        </div>
        <PipelineBtobSubnav />
      </div>

      {loading ? (
        <p className="text-sm text-gray-500">Chargement…</p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {documents.map((doc) => (
            <div key={doc.id} className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="text-xs font-semibold uppercase tracking-wider text-indigo-600">
                    {qualiopiKindLabel(doc.kind)}
                  </div>
                  <div className="mt-1 font-semibold text-gray-900">{doc.title}</div>
                  <div className="mt-1 text-xs text-gray-500">
                    {doc.file_name ? doc.file_name : "Aucun fichier — cliquez pour en déposer un"}
                  </div>
                </div>
                <FileText className="h-5 w-5 text-gray-400" />
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <Button size="sm" variant="outline" onClick={() => openAdd(doc)}>
                  <Upload className="mr-1 h-3 w-3" />
                  {doc.file_url ? "Remplacer" : "Déposer"}
                </Button>
                {doc.file_url ? (
                  <a
                    href={doc.file_url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex h-8 items-center rounded-md border px-3 text-xs"
                  >
                    Voir
                  </a>
                ) : null}
                <Button size="sm" variant="ghost" onClick={() => void removeDoc(doc)}>
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <section className="rounded-2xl border border-gray-200 bg-white p-5">
        <h2 className="text-lg font-semibold text-gray-900">Émargements horodatés</h2>
        <p className="mt-1 text-sm text-gray-500">
          Preuve Qualiopi : jour + heure de signature du collaborateur.
        </p>
        {sessions.length === 0 ? (
          <p className="mt-4 text-sm text-gray-500">Aucune session pour le moment.</p>
        ) : (
          <div className="mt-4 space-y-4">
            {sessions.map((session) => (
              <div key={session.id} className="rounded-xl border border-gray-100 bg-gray-50 p-4">
                <div className="font-medium text-gray-900">{session.course_name}</div>
                <div className="text-xs text-gray-500">
                  {session.scheduled_at
                    ? new Date(session.scheduled_at).toLocaleDateString("fr-FR")
                    : "Date non renseignée"}{" "}
                  · {session.status === "in_progress" ? "Formation en cours" : "Programmée"}
                </div>
                <ul className="mt-3 space-y-1 text-sm">
                  {(session.attendees ?? []).map((attendee) => {
                    const signed = formatSignedAt(attendee.signed_at);
                    return (
                      <li key={attendee.id} className="flex flex-wrap justify-between gap-2">
                        <span>
                          {attendee.full_name}{" "}
                          <span className="text-gray-400">({attendee.email})</span>
                        </span>
                        <span className={signed ? "text-emerald-700" : "text-amber-700"}>
                          {signed ? `Signé ${signed.label}` : "En attente d’émargement"}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </div>
        )}
      </section>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{replaceId ? "Mettre à jour le document" : "Ajouter un document"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label>Titre</Label>
              <Input value={title} onChange={(event) => setTitle(event.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Type</Label>
              <select
                value={kind}
                onChange={(event) => setKind(event.target.value as QualiopiDocKind)}
                className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                disabled={Boolean(replaceId && kind !== "autre")}
              >
                <option value="convention">Convention de formation</option>
                <option value="reglement">Règlement intérieur</option>
                <option value="livret">Livret d’accueil</option>
                <option value="autre">Autre</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <Label>Fichier (PDF)</Label>
              <Input type="file" accept=".pdf,application/pdf,image/*" onChange={(event) => setFile(event.target.files?.[0] ?? null)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Annuler
            </Button>
            <Button onClick={() => void saveDoc()} disabled={saving}>
              {saving ? "Enregistrement…" : "Enregistrer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
