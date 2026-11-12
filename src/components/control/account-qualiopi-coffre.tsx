"use client";

import { useCallback, useEffect, useState } from "react";
import { EmptyState } from "./chrome";

type CoffreItem = {
  key: string;
  label: string;
  status: "ready" | "partial" | "missing" | "not_due";
  detail?: string | null;
};

type OrgDoc = {
  id: string;
  dossier_id: string;
  kind: string;
  title: string;
  status: string;
  has_file: boolean;
  signed_at: string | null;
  sent_at: string | null;
  generated_at: string | null;
};

type OrgDossier = {
  dossier_id: string;
  course_title: string | null;
  status: string;
  ready_count: number;
  total_count: number;
  items: CoffreItem[];
  documents: OrgDoc[];
};

type OrgSnap = {
  organization_id: string;
  dossiers: OrgDossier[];
  document_count: number;
  ready_count: number;
  total_count: number;
};

const STATUS_TONE: Record<CoffreItem["status"], { bg: string; fg: string }> = {
  ready: { bg: "#163228", fg: "#6BE39B" },
  partial: { bg: "#3A3118", fg: "#F2CF6B" },
  missing: { bg: "#3A1818", fg: "#FF8E8E" },
  not_due: { bg: "#1A2340", fg: "#8A93AE" },
};

const STATUS_LABEL: Record<CoffreItem["status"], string> = {
  ready: "Prêt",
  partial: "Partiel",
  missing: "Manquant",
  not_due: "Pas dû",
};

const DOC_KIND_COLOR: Record<string, string> = {
  devis: "#F2CF6B",
  convention: "#8DB8FF",
  convocation: "#A99BFF",
  emargement: "#5EDCC3",
  facture: "#6BE39B",
  certificat: "#C9C2FF",
  attestation: "#C9C2FF",
};

function docPdfHref(doc: OrgDoc) {
  return `/api/super-admin/crm/formation-documents/${doc.id}/pdf`;
}

function shortDate(value: string | null) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString("fr-FR");
}

export function AccountQualiopiCoffre({ organizationId }: { organizationId: string }) {
  const [snap, setSnap] = useState<OrgSnap | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [selectedDossierId, setSelectedDossierId] = useState<string | null>(null);
  const [preview, setPreview] = useState<{ title: string; href: string } | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const res = await fetch(`/api/super-admin/crm/organisations/${organizationId}/coffre`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Coffre indisponible");
      const next = json as OrgSnap;
      setSnap(next);
      setSelectedDossierId((current) => {
        if (current && next.dossiers.some((d) => d.dossier_id === current)) return current;
        return next.dossiers[0]?.dossier_id ?? null;
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur");
      setSnap(null);
    }
  }, [organizationId]);

  useEffect(() => {
    setSelectedDossierId(null);
    void load();
  }, [load]);

  const exportZip = async () => {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/super-admin/crm/organisations/${organizationId}/coffre?format=zip`,
      );
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json.error || "Export impossible");
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `coffre-qualiopi-${organizationId.slice(0, 8)}.zip`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Export impossible");
    } finally {
      setBusy(false);
    }
  };

  const openDoc = (doc: OrgDoc) => {
    if (!doc.has_file) {
      // Tentative de génération à la volée via le kind du dossier
      const href = `/api/super-admin/crm/formation-dossiers/${doc.dossier_id}/documents/${doc.kind}/pdf`;
      setPreview({ title: doc.title, href });
      return;
    }
    setPreview({ title: doc.title, href: docPdfHref(doc) });
  };

  if (error && !snap) {
    return <EmptyState title={error} />;
  }
  if (!snap) {
    return <p className="mt-6 text-sm text-[#8A93AE]">Chargement du coffre Qualiopi…</p>;
  }
  if (!snap.dossiers.length) {
    return (
      <EmptyState title="Aucune formation sur ce compte — le coffre Qualiopi se remplira dès le premier dossier." />
    );
  }

  const selected = snap.dossiers.find((d) => d.dossier_id === selectedDossierId) ?? snap.dossiers[0]!;
  const viewableDocs = selected.documents.filter((doc) => doc.has_file || Boolean(doc.kind));

  return (
    <div className="mt-6 space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-[24px] border border-[#1A2340] bg-[#111831] px-5 py-4">
        <div>
          <p className="text-lg font-extrabold text-[#F2F4FA]">Coffre Qualiopi</p>
          <p className="mt-1 text-sm text-[#9AA3BD]">
            {snap.ready_count}/{snap.total_count} preuves prêtes · {snap.document_count} document(s) ·{" "}
            {snap.dossiers.length} dossier(s)
          </p>
        </div>
        <button
          type="button"
          disabled={busy}
          onClick={() => void exportZip()}
          className="rounded-full border border-[#26304F] bg-[#151C33] px-4 py-2 text-sm font-semibold text-[#E8ECF8] disabled:opacity-50"
        >
          {busy ? "Export…" : "Exporter ZIP"}
        </button>
      </div>

      {error ? <p className="text-sm text-[#FF8E8E]">{error}</p> : null}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {snap.dossiers.map((dossier) => {
          const active = dossier.dossier_id === selected.dossier_id;
          const ratio =
            dossier.total_count > 0
              ? Math.round((dossier.ready_count / dossier.total_count) * 100)
              : 0;
          return (
            <button
              key={dossier.dossier_id}
              type="button"
              onClick={() => setSelectedDossierId(dossier.dossier_id)}
              className="rounded-[24px] border p-5 text-left transition"
              style={{
                background: "#111831",
                borderColor: active ? "#6E5BFF" : "#1A2340",
                boxShadow: active ? "inset 0 0 0 1px rgba(110,91,255,0.35)" : undefined,
              }}
            >
              <div className="flex items-start justify-between gap-2">
                <h3 className="line-clamp-2 text-[15px] font-extrabold text-[#F2F4FA]">
                  {dossier.course_title || "Formation"}
                </h3>
                <span className="rounded-full bg-[#1A2340] px-2 py-0.5 text-[11px] text-[#9AA3BD]">
                  {dossier.status}
                </span>
              </div>
              <p className="mt-2 text-xs text-[#9AA3BD]">
                {dossier.ready_count}/{dossier.total_count} preuves · {dossier.documents.length} fichier(s)
              </p>
              <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-[#0B1122]">
                <div
                  className="h-full rounded-full bg-[#6E5BFF]"
                  style={{ width: `${ratio}%` }}
                />
              </div>
            </button>
          );
        })}
      </div>

      <section className="rounded-[24px] border border-[#1A2340] bg-[#111831] p-5">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h3 className="text-lg font-extrabold text-[#F2F4FA]">
              {selected.course_title || "Formation"}
            </h3>
            <p className="mt-1 text-sm text-[#9AA3BD]">
              Checklist Qualiopi et documents — cliquez un document pour l&apos;ouvrir
            </p>
          </div>
        </div>

        <div className="mt-5 grid gap-5 lg:grid-cols-[280px_minmax(0,1fr)]">
          <div>
            <p className="mb-2 text-xs font-semibold text-[#9AA3BD]">Checklist</p>
            <ul className="space-y-1.5">
              {selected.items.map((item) => {
                const tone = STATUS_TONE[item.status];
                return (
                  <li
                    key={item.key}
                    className="flex items-center justify-between gap-2 rounded-xl bg-[#0B1122] px-3 py-2"
                  >
                    <div className="min-w-0">
                      <p className="text-sm text-[#F2F4FA]">{item.label}</p>
                      {item.detail ? (
                        <p className="truncate text-[11px] text-[#6C7593]">{item.detail}</p>
                      ) : null}
                    </div>
                    <span
                      className="shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-bold"
                      style={{ background: tone.bg, color: tone.fg }}
                    >
                      {STATUS_LABEL[item.status]}
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>

          <div>
            <p className="mb-2 text-xs font-semibold text-[#9AA3BD]">Documents</p>
            {viewableDocs.length === 0 ? (
              <p className="rounded-2xl border border-dashed border-[#26304F] px-4 py-8 text-center text-sm text-[#6C7593]">
                Aucun document généré pour l’instant.
              </p>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {viewableDocs.map((doc) => {
                  const color = DOC_KIND_COLOR[doc.kind] || "#A99BFF";
                  const when =
                    shortDate(doc.signed_at) ||
                    shortDate(doc.sent_at) ||
                    shortDate(doc.generated_at);
                  return (
                    <button
                      key={doc.id}
                      type="button"
                      onClick={() => openDoc(doc)}
                      className="rounded-[20px] border border-[#1A2340] bg-[#0B1122] p-4 text-left transition hover:border-[#6E5BFF]/50"
                    >
                      <div
                        className="mb-3 grid h-24 place-items-center rounded-2xl text-sm font-extrabold"
                        style={{
                          background: `linear-gradient(135deg, ${color}33 0%, #111831 100%)`,
                          color,
                        }}
                      >
                        PDF
                      </div>
                      <p className="line-clamp-2 text-sm font-semibold text-[#F2F4FA]">{doc.title}</p>
                      <p className="mt-1 text-[11px] text-[#6C7593]">
                        {doc.kind}
                        {when ? ` · ${when}` : ""}
                        {!doc.has_file ? " · à générer" : ""}
                      </p>
                      <span
                        className="mt-3 inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold"
                        style={{ background: `${color}22`, color }}
                      >
                        Ouvrir
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </section>

      {preview ? (
        <div className="fixed inset-0 z-50 flex flex-col bg-[#0A0F1E]/95 p-4 backdrop-blur-sm">
          <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-3 pb-3">
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-[#F2F4FA]">{preview.title}</p>
              <p className="text-xs text-[#9AA3BD]">Aperçu PDF</p>
            </div>
            <div className="flex shrink-0 gap-2">
              <a
                href={preview.href}
                target="_blank"
                rel="noreferrer"
                className="rounded-full border border-[#26304F] bg-[#151C33] px-4 py-2 text-sm font-semibold text-[#E8ECF8]"
              >
                Nouvel onglet
              </a>
              <button
                type="button"
                onClick={() => setPreview(null)}
                className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-[#0A0F1E]"
              >
                Fermer
              </button>
            </div>
          </div>
          <iframe
            title={preview.title}
            src={preview.href}
            className="mx-auto h-full w-full max-w-6xl flex-1 rounded-[20px] border border-[#1A2340] bg-white"
          />
        </div>
      ) : null}
    </div>
  );
}
