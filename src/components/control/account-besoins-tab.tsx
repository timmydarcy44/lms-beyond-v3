"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { EmptyState } from "./chrome";
import { AccountBesoinDialog } from "./account-besoin-dialog";
import type { OrganizationNeedAnalysis } from "@/lib/control/need-analyses";

type DealOption = { id: string; label: string; stage: string | null };

export function AccountBesoinsTab({
  organizationId,
  organizationName,
  initialDealId,
}: {
  organizationId: string;
  organizationName: string;
  /** Ouvre directement une nouvelle analyse liée à ce deal (depuis le pipeline). */
  initialDealId?: string | null;
}) {
  const [analyses, setAnalyses] = useState<OrganizationNeedAnalysis[]>([]);
  const [deals, setDeals] = useState<DealOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<OrganizationNeedAnalysis | null | "new">(null);
  const [prefillDealId, setPrefillDealId] = useState<string | null>(initialDealId ?? null);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/super/comptes-clients/${organizationId}/besoins`);
      const json = (await res.json()) as {
        analyses?: OrganizationNeedAnalysis[];
        deals?: DealOption[];
        error?: string;
      };
      if (!res.ok) throw new Error(json.error || "Chargement impossible");
      setAnalyses(json.analyses ?? []);
      setDeals(json.deals ?? []);
      if (json.error) setError(json.error);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Chargement impossible");
    } finally {
      setLoading(false);
    }
  }, [organizationId]);

  useEffect(() => {
    void reload();
  }, [reload]);

  useEffect(() => {
    if (initialDealId) {
      setPrefillDealId(initialDealId);
      setEditing("new");
    }
  }, [initialDealId]);

  async function removeAnalysis(row: OrganizationNeedAnalysis) {
    if (!confirm(`Supprimer « ${row.title || "Analyse"} » ?`)) return;
    try {
      const res = await fetch(
        `/api/super/comptes-clients/${organizationId}/besoins/${row.id}`,
        { method: "DELETE" },
      );
      const json = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(json.error || "Suppression impossible");
      setAnalyses((prev) => prev.filter((a) => a.id !== row.id));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Suppression impossible");
    }
  }

  const completeCount = analyses.filter((a) => a.status === "complete").length;

  return (
    <div className="mt-5 space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-extrabold">Besoins</h2>
          <p className="mt-1 max-w-2xl text-sm text-[#8A93AE]">
            Analyses du besoin pour {organizationName} — une fiche par demande. Les analyses
            complètes alimentent la preuve Qualiopi (indicateur 4).
          </p>
          {analyses.length > 0 ? (
            <p className="mt-2 text-xs text-[#6C7593]">
              {completeCount} complète{completeCount > 1 ? "s" : ""} · {analyses.length} au total
            </p>
          ) : null}
        </div>
        <button
          type="button"
          onClick={() => {
            setPrefillDealId(null);
            setEditing("new");
          }}
          className="inline-flex items-center gap-2 rounded-full bg-[#6E5BFF] px-4 py-2 text-sm font-semibold"
        >
          <Plus className="h-4 w-4" /> Nouvelle analyse
        </button>
      </div>

      {error ? <p className="text-sm text-[#FF8A9B]">{error}</p> : null}

      {loading ? (
        <p className="flex items-center gap-2 text-sm text-[#8A93AE]">
          <Loader2 className="h-4 w-4 animate-spin" /> Chargement…
        </p>
      ) : analyses.length === 0 ? (
        <EmptyState
          title="Aucune analyse du besoin pour ce compte."
          action={
            <button
              type="button"
              onClick={() => setEditing("new")}
              className="rounded-full bg-[#6E5BFF] px-4 py-2 text-sm font-semibold"
            >
              Créer la première
            </button>
          }
        />
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {analyses.map((row) => (
            <article
              key={row.id}
              className="rounded-[22px] border border-[#1A2340] bg-[#0B1122] p-5"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate text-[15px] font-extrabold text-[#F2F4FA]">
                    {row.title || "Sans titre"}
                  </p>
                  <p className="mt-1 text-xs text-[#6C7593]">
                    MAJ {row.updated_at ? row.updated_at.slice(0, 10) : "—"}
                    {row.deal_id ? " · Deal lié" : ""}
                  </p>
                </div>
                <span
                  className="shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold"
                  style={{
                    background: row.status === "complete" ? "#14301F" : "#1A2340",
                    color: row.status === "complete" ? "#6BE39B" : "#9AA3BD",
                  }}
                >
                  {row.status === "complete" ? "Complète" : "Brouillon"}
                </span>
              </div>
              <p className="mt-3 line-clamp-3 text-sm text-[#9AA3BD]">
                {row.context_problem || row.expected_outcomes || "Pas encore de contenu."}
              </p>
              <div className="mt-4 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setEditing(row)}
                  className="rounded-full bg-white px-3.5 py-1.5 text-xs font-bold text-[#0A0F1E]"
                >
                  Ouvrir
                </button>
                <button
                  type="button"
                  onClick={() => void removeAnalysis(row)}
                  className="inline-flex items-center gap-1 rounded-full px-2.5 py-1.5 text-xs font-semibold text-[#FF8A9B] hover:bg-[#2A1520]"
                >
                  <Trash2 className="h-3.5 w-3.5" /> Supprimer
                </button>
              </div>
            </article>
          ))}
        </div>
      )}

      {editing !== null ? (
        <AccountBesoinDialog
          organizationId={organizationId}
          analysis={editing === "new" ? null : editing}
          deals={deals}
          prefillDealId={editing === "new" ? prefillDealId : null}
          onClose={() => {
            setEditing(null);
            setPrefillDealId(null);
            if (initialDealId) {
              const url = new URL(window.location.href);
              url.searchParams.delete("dealId");
              window.history.replaceState(null, "", `${url.pathname}${url.search}`);
            }
          }}
          onSaved={(saved) => {
            setAnalyses((prev) => {
              const without = prev.filter((a) => a.id !== saved.id);
              return [saved, ...without];
            });
            setEditing(null);
            setPrefillDealId(null);
          }}
        />
      ) : null}
    </div>
  );
}
