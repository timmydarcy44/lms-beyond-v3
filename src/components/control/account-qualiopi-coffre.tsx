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

const STATUS_TONE: Record<CoffreItem["status"], string> = {
  ready: "bg-[#163228] text-[#6BE39B]",
  partial: "bg-[#3A3118] text-[#F2CF6B]",
  missing: "bg-[#3A1818] text-[#FF8E8E]",
  not_due: "bg-[#1A2340] text-[#8A93AE]",
};

const STATUS_LABEL: Record<CoffreItem["status"], string> = {
  ready: "Prêt",
  partial: "Partiel",
  missing: "Manquant",
  not_due: "Pas dû",
};

export function AccountQualiopiCoffre({ organizationId }: { organizationId: string }) {
  const [snap, setSnap] = useState<OrgSnap | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [openId, setOpenId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const res = await fetch(`/api/super-admin/crm/organisations/${organizationId}/coffre`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Coffre indisponible");
      const next = json as OrgSnap;
      setSnap(next);
      setOpenId((current) => current ?? (next.dossiers[0] ? String(next.dossiers[0].dossier_id) : null));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur");
      setSnap(null);
    }
  }, [organizationId]);

  useEffect(() => {
    setOpenId(null);
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

  if (error && !snap) {
    return <EmptyState title={error} />;
  }
  if (!snap) {
    return (
      <p className="mt-6 text-sm text-[#8A93AE]">Chargement du coffre Qualiopi…</p>
    );
  }
  if (!snap.dossiers.length) {
    return (
      <EmptyState title="Aucune formation sur ce compte — le coffre Qualiopi se remplira dès le premier dossier." />
    );
  }

  return (
    <div className="mt-6 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-[22px] border border-[#1A2340] bg-[#111831] px-5 py-4">
        <div>
          <p className="text-sm font-semibold text-white">Coffre Qualiopi</p>
          <p className="mt-1 text-xs text-[#8A93AE]">
            {snap.ready_count}/{snap.total_count} preuves prêtes · {snap.document_count} document(s)
            · {snap.dossiers.length} dossier(s)
          </p>
        </div>
        <button
          type="button"
          disabled={busy}
          onClick={() => void exportZip()}
          className="rounded-full bg-[#6E5BFF] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
        >
          {busy ? "Export…" : "Exporter ZIP"}
        </button>
      </div>

      {error ? <p className="text-sm text-[#FF8E8E]">{error}</p> : null}

      <ul className="space-y-3">
        {snap.dossiers.map((dossier) => {
          const open = openId === dossier.dossier_id;
          return (
            <li
              key={dossier.dossier_id}
              className="overflow-hidden rounded-[22px] border border-[#1A2340] bg-[#111831]"
            >
              <button
                type="button"
                onClick={() => setOpenId(open ? null : dossier.dossier_id)}
                className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-white">
                    {dossier.course_title || "Formation"}
                  </p>
                  <p className="mt-0.5 text-xs text-[#8A93AE]">
                    Statut {dossier.status} · {dossier.ready_count}/{dossier.total_count} preuves ·{" "}
                    {dossier.documents.length} fichier(s)
                  </p>
                </div>
                <span className="text-xs font-semibold text-[#C4BAFF]">
                  {open ? "Masquer" : "Ouvrir"}
                </span>
              </button>

              {open ? (
                <div className="space-y-4 border-t border-[#1A2340] px-5 py-4">
                  <div>
                    <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-[#8A93AE]">
                      Checklist
                    </p>
                    <ul className="space-y-1.5">
                      {dossier.items.map((item) => (
                        <li
                          key={item.key}
                          className="flex items-center justify-between gap-2 rounded-xl bg-[#0A0F1E] px-3 py-2"
                        >
                          <div className="min-w-0">
                            <p className="text-sm text-white">{item.label}</p>
                            {item.detail ? (
                              <p className="truncate text-[11px] text-[#8A93AE]">{item.detail}</p>
                            ) : null}
                          </div>
                          <span
                            className={`shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-bold ${STATUS_TONE[item.status]}`}
                          >
                            {STATUS_LABEL[item.status]}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-[#8A93AE]">
                      Documents archivés
                    </p>
                    {dossier.documents.length === 0 ? (
                      <p className="text-sm text-[#8A93AE]">Aucun document généré pour l’instant.</p>
                    ) : (
                      <ul className="space-y-1.5">
                        {dossier.documents.map((doc) => (
                          <li
                            key={doc.id}
                            className="flex items-center justify-between gap-2 rounded-xl bg-[#0A0F1E] px-3 py-2"
                          >
                            <div className="min-w-0">
                              <p className="truncate text-sm text-white">{doc.title}</p>
                              <p className="text-[11px] text-[#8A93AE]">
                                {doc.kind}
                                {doc.signed_at
                                  ? ` · signé ${new Date(doc.signed_at).toLocaleDateString("fr-FR")}`
                                  : doc.sent_at
                                    ? ` · envoyé ${new Date(doc.sent_at).toLocaleDateString("fr-FR")}`
                                    : doc.generated_at
                                      ? ` · généré ${new Date(doc.generated_at).toLocaleDateString("fr-FR")}`
                                      : ""}
                              </p>
                            </div>
                            {doc.has_file ? (
                              <a
                                href={`/api/super-admin/crm/formation-documents/${doc.id}/pdf`}
                                target="_blank"
                                rel="noreferrer"
                                className="shrink-0 rounded-full border border-[#26304F] px-3 py-1 text-xs font-semibold text-[#C4BAFF] hover:bg-[#1A2340]"
                              >
                                Voir PDF
                              </a>
                            ) : (
                              <span className="shrink-0 text-[11px] text-[#8A93AE]">Pas de fichier</span>
                            )}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              ) : null}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
