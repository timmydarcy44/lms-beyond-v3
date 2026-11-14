"use client";

import { useState } from "react";
import type { RegistreRow } from "@/lib/handicap/registre-data";
import { HANDICAP_THEME as T } from "@/lib/handicap/theme";

function fmtDate(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function HandicapRegistre({ rows }: { rows: Omit<RegistreRow, "caseId">[] }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function exportPdf() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/handicap/registre?format=pdf");
      if (!res.ok) {
        const json = (await res.json().catch(() => null)) as { error?: string } | null;
        throw new Error(json?.error || "Export impossible");
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `registre-qualiopi-handicap-${new Date().toISOString().slice(0, 10)}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p
            className="inline-flex rounded-full px-2.5 py-1 text-[11px] font-bold"
            style={{ background: T.accentSoft, color: T.accent }}
          >
            Indicateur 26
          </p>
          <h1 className="mt-2 text-[24px] font-extrabold">Registre Qualiopi</h1>
          <p className="mt-1 max-w-xl text-sm" style={{ color: T.muted }}>
            Identifiants anonymisés uniquement — besoins, actions et dates. Aucun nom, document
            ni note.
          </p>
        </div>
        <button
          type="button"
          disabled={busy}
          onClick={() => void exportPdf()}
          className="rounded-full px-4 py-2.5 text-[13px] font-bold disabled:opacity-60"
          style={{ background: T.accent, color: T.accentOn }}
        >
          {busy ? "Export…" : "Exporter le registre (PDF)"}
        </button>
      </div>

      {error ? (
        <p className="text-sm" style={{ color: T.red }}>
          {error}
        </p>
      ) : null}

      <div
        className="overflow-x-auto rounded-[24px] border"
        style={{ background: T.card, borderColor: T.border }}
      >
        <table className="w-full min-w-[860px] text-left text-[13px]">
          <thead>
            <tr style={{ color: T.tertiary }}>
              <th className="px-4 py-3 font-semibold">Dossier</th>
              <th className="px-4 py-3 font-semibold">Date demande</th>
              <th className="px-4 py-3 font-semibold">Parcours</th>
              <th className="px-4 py-3 font-semibold">Aménagements</th>
              <th className="px-4 py-3 font-semibold">Actions</th>
              <th className="px-4 py-3 font-semibold">Partenaires</th>
              <th className="px-4 py-3 font-semibold">Clôture</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-8" style={{ color: T.muted }}>
                  Aucun dossier dans le registre.
                </td>
              </tr>
            ) : (
              rows.map((r) => (
                <tr key={r.dossierCode} className="border-t" style={{ borderColor: T.border }}>
                  <td className="px-4 py-3 font-bold" style={{ color: T.accent }}>
                    {r.dossierCode}
                  </td>
                  <td className="px-4 py-3">{fmtDate(r.requestDate)}</td>
                  <td className="px-4 py-3">{r.pathType}</td>
                  <td className="px-4 py-3" style={{ color: T.muted }}>
                    {r.accommodationCategories.length
                      ? r.accommodationCategories.join(" · ")
                      : "—"}
                  </td>
                  <td className="px-4 py-3">
                    {r.actionsTotal > 0 ? `${r.actionsDone}/${r.actionsTotal}` : "—"}
                  </td>
                  <td className="px-4 py-3" style={{ color: T.muted }}>
                    {r.partners.length ? r.partners.join(" · ") : "—"}
                  </td>
                  <td className="px-4 py-3">{fmtDate(r.closedAt)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
