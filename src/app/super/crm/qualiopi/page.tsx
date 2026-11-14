"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
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
import { QualiopiCoffreSlot } from "@/components/super-admin/qualiopi-coffre-slot";
import { QualiopiOverviewV2 } from "@/components/super-admin/qualiopi-overview-v2";
import {
  QUALIOPI_CORE_DOCS,
  formatSignedAt,
  qualiopiSessionStatusLabel,
  type QualiopiDocKind,
  type QualiopiDocument,
  type QualiopiSession,
} from "@/lib/crm/qualiopi-shared";
import { getCoffreAdminStatus } from "@/lib/qualiopi/coffre-admin";

function sessionDateBadge(scheduledAt: string | null) {
  if (!scheduledAt) {
    return { line1: "—", line2: "À fixer", subtitle: "Date non renseignée" };
  }
  const d = new Date(scheduledAt);
  if (Number.isNaN(d.getTime())) {
    return { line1: "—", line2: "À fixer", subtitle: "Date non renseignée" };
  }
  const line1 = String(d.getDate());
  const line2 = d
    .toLocaleDateString("fr-FR", { month: "short" })
    .replace(".", "")
    .toUpperCase();
  const subtitle = d.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
  return { line1, line2, subtitle };
}

function signatureSummary(session: QualiopiSession) {
  const attendees = session.attendees ?? [];
  const signed = attendees.filter((a) => a.signed_at).length;
  const total = attendees.length;
  if (total === 0) return "— signatures";
  return `${signed}/${total} signatures`;
}

type TabId = "overview" | "coffre" | "emargements" | "veilles" | "qualite" | "risques";

export default function CrmQualiopiPage() {
  const [documents, setDocuments] = useState<QualiopiDocument[]>([]);
  const [sessions, setSessions] = useState<QualiopiSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [tab, setTab] = useState<TabId>("overview");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [kind, setKind] = useState<QualiopiDocKind>("autre");
  const [replaceId, setReplaceId] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 15000);
      const [docsRes, sessionsRes] = await Promise.all([
        fetch("/api/super-admin/crm/qualiopi/documents", { signal: controller.signal }),
        fetch("/api/super-admin/crm/qualiopi/sessions", { signal: controller.signal }),
      ]);
      clearTimeout(timer);
      const docsJson = await docsRes.json();
      const sessionsJson = await sessionsRes.json();
      if (!docsRes.ok) throw new Error(docsJson.error || "Documents indisponibles");
      if (!sessionsRes.ok) throw new Error(sessionsJson.error || "Sessions indisponibles");
      setDocuments(docsJson.documents ?? []);
      setSessions(sessionsJson.sessions ?? []);
    } catch (error) {
      const msg =
        error instanceof Error
          ? error.name === "AbortError"
            ? "Délai dépassé — réessayez"
            : error.message
          : "Chargement impossible";
      setLoadError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const t = params.get("tab");
    if (t === "coffre" || t === "emargements" || t === "overview") setTab(t);
  }, []);

  const coffre = useMemo(() => getCoffreAdminStatus(documents), [documents]);

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
      const res = await fetch("/api/super-admin/crm/qualiopi/documents", {
        method: "POST",
        body: form,
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Enregistrement impossible");
      toast.success("Document enregistré");
      setDialogOpen(false);
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erreur");
    } finally {
      setSaving(false);
    }
  };

  const removeDoc = async (doc: QualiopiDocument) => {
    if (!confirm("Supprimer ce fichier du coffre ?")) return;
    const res = await fetch(`/api/super-admin/crm/qualiopi/documents?id=${doc.id}`, {
      method: "DELETE",
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      toast.error(json.error || "Suppression impossible");
      return;
    }
    toast.success("Supprimé");
    await load();
  };

  const coffreSlot = (
    <QualiopiCoffreSlot
      coffre={coffre}
      loading={loading}
      loadError={loadError}
      onRetry={() => void load()}
      onDeposit={(slot) =>
        openAdd({
          id: slot.document?.id,
          kind: slot.kind,
          title: slot.title,
        })
      }
      onRemove={(doc) => void removeDoc(doc)}
    />
  );

  const emargementsSlot = (
    <section className="rounded-[24px] border border-[#1A2340] bg-[#111831] p-5 sm:p-6">
      <h2 className="text-lg font-semibold text-white">Émargements horodatés</h2>
      <p className="mt-1 text-sm text-[#9AA3BD]">
        Une session est complète quand tous les participants ont signé.
      </p>
      {loading ? (
        <div className="mt-4 h-24 animate-pulse rounded-xl bg-white/5" />
      ) : loadError ? (
        <div className="mt-4 text-sm text-[#FF8A9B]">
          {loadError}{" "}
          <button type="button" className="underline" onClick={() => void load()}>
            Réessayer
          </button>
        </div>
      ) : sessions.length === 0 ? (
        <p className="mt-4 text-sm text-[#9AA3BD]">Aucune session pour le moment.</p>
      ) : (
        <ul className="mt-4 space-y-2">
          {sessions.map((session) => {
            const badge = sessionDateBadge(session.scheduled_at);
            const statusLabel =
              session.status === "scheduled"
                ? "Programmée"
                : qualiopiSessionStatusLabel(session.status);
            return (
              <li
                key={session.id}
                className="flex flex-wrap items-center gap-3 rounded-xl border border-[#1A2340] bg-[#0B1122] px-3 py-2.5"
              >
                <div className="flex h-12 w-12 flex-col items-center justify-center rounded-lg bg-[#6E5BFF]/15 text-[#C9C2FF]">
                  <span className="text-lg font-bold leading-none">{badge.line1}</span>
                  <span className="text-[10px] uppercase">{badge.line2}</span>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-white">
                    {session.course_name || "Formation"}
                  </p>
                  <p className="text-xs text-[#9AA3BD]">
                    {session.company_name} · {statusLabel} · {signatureSummary(session)}
                    {session.scheduled_at ? ` · ${formatSignedAt(session.scheduled_at)}` : ""}
                  </p>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );

  return (
    <div className="min-h-screen px-4 py-6 sm:px-6" style={{ background: "#0A0F1E" }}>
      <div className="mx-auto max-w-[1200px]">
        <QualiopiOverviewV2
          tab={tab}
          onTabChange={setTab}
          coffreSlot={coffreSlot}
          emargementsSlot={emargementsSlot}
        />
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="border-[#1A2340] bg-[#111831] text-white">
          <DialogHeader>
            <DialogTitle>{replaceId ? "Remplacer le document" : "Déposer un document"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label>Titre</Label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="border-[#26304F] bg-[#0B1122]"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Type</Label>
              <select
                value={kind}
                onChange={(e) => setKind(e.target.value as QualiopiDocKind)}
                className="w-full rounded-md border border-[#26304F] bg-[#0B1122] px-3 py-2 text-sm"
              >
                {QUALIOPI_CORE_DOCS.map((d) => (
                  <option key={d.kind} value={d.kind}>
                    {d.title}
                  </option>
                ))}
                <option value="autre">Autre</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <Label>Fichier PDF</Label>
              <Input
                type="file"
                accept="application/pdf"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                className="border-[#26304F] bg-[#0B1122]"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDialogOpen(false)}>
              Annuler
            </Button>
            <Button
              disabled={saving}
              onClick={() => void saveDoc()}
              className="bg-[#6E5BFF] text-white"
            >
              {saving ? "…" : "Enregistrer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
