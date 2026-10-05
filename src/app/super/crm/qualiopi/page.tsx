"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { ChevronRight, FileText, Plus, Trash2, Upload } from "lucide-react";
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
import { QualiopiRnqPanel } from "@/components/super-admin/qualiopi-rnq-panel";
import {
  QUALIOPI_CORE_DOCS,
  formatSignedAt,
  qualiopiSessionStatusLabel,
  type QualiopiDocKind,
  type QualiopiDocument,
  type QualiopiSession,
} from "@/lib/crm/qualiopi-shared";
import {
  QUALIOPI_CARD,
  QUALIOPI_CARD_INNER,
  QUALIOPI_MUTED,
  QUALIOPI_PAGE_BG,
} from "@/components/super-admin/qualiopi/qualiopi-audit-styles";
import { cn } from "@/lib/utils";

function sessionDateBadge(scheduledAt: string | null) {
  if (!scheduledAt) {
    return { line1: "—", line2: "À FIXER", subtitle: "Date non renseignée" };
  }
  const d = new Date(scheduledAt);
  if (Number.isNaN(d.getTime())) {
    return { line1: "—", line2: "À FIXER", subtitle: "Date non renseignée" };
  }
  const line1 = String(d.getDate());
  const line2 = d
    .toLocaleDateString("fr-FR", { month: "short" })
    .replace(".", "")
    .toUpperCase();
  const subtitle = d.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" });
  return { line1, line2, subtitle };
}

function signatureSummary(session: QualiopiSession) {
  const attendees = session.attendees ?? [];
  const signed = attendees.filter((a) => a.signed_at).length;
  const total = attendees.length;
  if (total === 0) return "— signatures";
  return `${signed}/${total} signatures`;
}

export default function CrmQualiopiPage() {
  const [documents, setDocuments] = useState<QualiopiDocument[]>([]);
  const [sessions, setSessions] = useState<QualiopiSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [complianceRefreshKey, setComplianceRefreshKey] = useState(0);
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
      setComplianceRefreshKey((k) => k + 1);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Chargement impossible");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const vaultDocs = useMemo(() => {
    const byKind = new Map(documents.filter((d) => d.kind !== "autre").map((d) => [d.kind, d]));
    return QUALIOPI_CORE_DOCS.map((template) => byKind.get(template.kind)).filter(Boolean) as QualiopiDocument[];
  }, [documents]);

  const vaultDeposited = vaultDocs.filter((d) => d.file_url).length;

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
    <div className={cn(QUALIOPI_PAGE_BG, "space-y-8 px-3 py-6 sm:px-6 sm:py-8")}>
      <div className="space-y-4">
        <p className="text-xs font-medium uppercase tracking-wider text-white/35">CRM / Qualiopi</p>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-white sm:text-3xl">Qualiopi</h1>
            <p className={cn("mt-1 max-w-2xl text-sm", QUALIOPI_MUTED)}>
              Référentiel RNQ, coffre administratif et preuves de session : convention, émargement, satisfaction.
            </p>
          </div>
          <Button
            onClick={() => openAdd()}
            className="rounded-full bg-white text-[#0b0e18] hover:bg-white/90"
          >
            <Plus className="mr-1 h-4 w-4" />
            Ajouter un document
          </Button>
        </div>
        <PipelineBtobSubnav variant="dark" />
      </div>

      <QualiopiRnqPanel refreshKey={complianceRefreshKey} />

      <section className="space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div>
            <h2 className="text-lg font-semibold text-white">Coffre administratif</h2>
            <p className={cn("mt-1 text-sm", QUALIOPI_MUTED)}>
              Envoyé automatiquement dès qu&apos;une formation B2B est programmée ou démarre.
            </p>
          </div>
          <span className="text-sm font-medium tabular-nums text-white/70">
            {vaultDeposited} / {QUALIOPI_CORE_DOCS.length} déposés
          </span>
        </div>

        {loading ? (
          <p className={cn("text-sm", QUALIOPI_MUTED)}>Chargement…</p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {vaultDocs.map((doc) => {
              const deposited = Boolean(doc.file_url);
              return (
                <div key={doc.id} className={cn(QUALIOPI_CARD, "relative p-4")}>
                  <span
                    className={cn(
                      "absolute right-3 top-3 rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
                      deposited
                        ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-200"
                        : "border-amber-500/25 bg-amber-500/10 text-amber-200",
                    )}
                  >
                    {deposited ? "Déposé" : "À déposer"}
                  </span>
                  <FileText className="h-8 w-8 text-[#3D7BFF]/80" />
                  <div className="mt-3 pr-16 font-semibold text-white">{doc.title}</div>
                  <p className={cn("mt-1 text-xs", QUALIOPI_MUTED)}>
                    {doc.file_name ? doc.file_name : "Aucun fichier — glissez un modèle ici"}
                  </p>
                  <div className="mt-4 flex flex-wrap items-center gap-2">
                    <Button
                      size="sm"
                      onClick={() => openAdd(doc)}
                      className="rounded-lg bg-[#3D7BFF] text-white hover:bg-[#3568d4]"
                    >
                      <Upload className="mr-1 h-3 w-3" />
                      {deposited ? "Remplacer" : "Déposer"}
                    </Button>
                    {doc.file_url ? (
                      <a
                        href={doc.file_url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 text-white/60 hover:bg-white/5"
                        title="Voir le fichier"
                      >
                        <ChevronRight className="h-4 w-4" />
                      </a>
                    ) : null}
                    {doc.file_url ? (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-white/40 hover:bg-white/5 hover:text-white/70"
                        onClick={() => void removeDoc(doc)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      <section className={cn(QUALIOPI_CARD, "p-5 sm:p-6")}>
        <h2 className="text-lg font-semibold text-white">Émargements horodatés</h2>
        <p className={cn("mt-1 text-sm", QUALIOPI_MUTED)}>
          Preuve Qualiopi : jour et heure de signature de chaque collaborateur.
        </p>
        {loading ? (
          <p className={cn("mt-4 text-sm", QUALIOPI_MUTED)}>Chargement…</p>
        ) : sessions.length === 0 ? (
          <p className={cn("mt-4 text-sm", QUALIOPI_MUTED)}>Aucune session pour le moment.</p>
        ) : (
          <ul className="mt-4 space-y-2">
            {sessions.map((session) => {
              const badge = sessionDateBadge(session.scheduled_at);
              const statusLabel =
                session.status === "scheduled"
                  ? "Programmée"
                  : qualiopiSessionStatusLabel(session.status);
              return (
                <li key={session.id}>
                  <details className={cn("group", QUALIOPI_CARD_INNER, "overflow-hidden")}>
                    <summary className="flex cursor-pointer list-none items-center gap-3 px-3 py-3 sm:px-4 [&::-webkit-details-marker]:hidden">
                      <div className="flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-center leading-tight">
                        <span className="text-lg font-bold tabular-nums text-white">{badge.line1}</span>
                        <span className="text-[10px] font-semibold uppercase tracking-wide text-white/50">
                          {badge.line2}
                        </span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium text-white">{session.course_name}</p>
                        <p className={cn("text-xs", QUALIOPI_MUTED)}>{badge.subtitle}</p>
                      </div>
                      <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
                        <span className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-0.5 text-[11px] font-medium text-white/70">
                          {statusLabel}
                        </span>
                        <span className={cn("hidden text-xs sm:inline", QUALIOPI_MUTED)}>
                          {signatureSummary(session)}
                        </span>
                        <ChevronRight className="h-4 w-4 text-white/30 transition group-open:rotate-90" />
                      </div>
                    </summary>
                    <ul className="space-y-1 border-t border-white/[0.06] px-4 py-3">
                      {(session.attendees ?? []).length === 0 ? (
                        <li className={cn("text-sm", QUALIOPI_MUTED)}>Aucun participant inscrit.</li>
                      ) : (
                        (session.attendees ?? []).map((attendee) => {
                          const signed = formatSignedAt(attendee.signed_at);
                          return (
                            <li
                              key={attendee.id}
                              className="flex flex-wrap justify-between gap-2 rounded-lg px-2 py-1.5 text-sm text-white/80"
                            >
                              <span>
                                {attendee.full_name}{" "}
                                <span className="text-white/35">({attendee.email})</span>
                              </span>
                              <span className={signed ? "text-emerald-300/90" : "text-amber-200/90"}>
                                {signed ? `Signé ${signed.label}` : "En attente d’émargement"}
                              </span>
                            </li>
                          );
                        })
                      )}
                    </ul>
                  </details>
                </li>
              );
            })}
          </ul>
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
                <option value="livret">Livret d&apos;accueil</option>
                <option value="autre">Autre</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <Label>Fichier (PDF)</Label>
              <Input
                type="file"
                accept=".pdf,application/pdf,image/*"
                onChange={(event) => setFile(event.target.files?.[0] ?? null)}
              />
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
