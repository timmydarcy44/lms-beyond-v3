"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { EmptyState } from "./chrome";
import { AccountBesoinDialog } from "./account-besoin-dialog";
import { PLACE_MODE_LABEL, type OrganizationNeedAnalysis } from "@/lib/control/need-analyses";
import { surmesureNewHref } from "@/lib/training-courses/surmesure-ui";

type DealOption = { id: string; label: string; stage: string | null };

type Scope =
  | { kind: "organization"; organizationId: string; dealId?: string | null }
  | { kind: "deal"; dealId: string; organizationId?: string | null };

function listUrl(scope: Scope) {
  if (scope.kind === "organization") {
    return `/api/super/comptes-clients/${scope.organizationId}/besoins`;
  }
  return `/api/super-admin/crm/pipeline/deals/${scope.dealId}/besoins`;
}

function itemUrl(scope: Scope, analysisId: string) {
  if (scope.kind === "organization") {
    return `/api/super/comptes-clients/${scope.organizationId}/besoins/${analysisId}`;
  }
  return `/api/super-admin/crm/pipeline/deals/${scope.dealId}/besoins/${analysisId}`;
}

function sendClientUrl(scope: Scope, analysisId: string) {
  return `${itemUrl(scope, analysisId)}/send-client`;
}

function fmtDay(value: string | null | undefined) {
  if (!value) return "—";
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? value.slice(0, 10) : d.toLocaleDateString("fr-FR");
}

export function AccountBesoinsTab({
  organizationId,
  organizationName,
  dealId,
  scopeKind = "organization",
  initialDealId,
}: {
  organizationId?: string | null;
  organizationName: string;
  /** Mode pipeline : analyses liées au deal (org optionnelle). */
  dealId?: string | null;
  scopeKind?: "organization" | "deal";
  /** Ouvre directement une nouvelle analyse liée à ce deal. */
  initialDealId?: string | null;
}) {
  const scope: Scope | null =
    scopeKind === "deal" && dealId
      ? { kind: "deal", dealId, organizationId: organizationId ?? null }
      : organizationId
        ? { kind: "organization", organizationId, dealId: dealId ?? initialDealId ?? null }
        : null;

  const [analyses, setAnalyses] = useState<OrganizationNeedAnalysis[]>([]);
  const [deals, setDeals] = useState<DealOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [sendingId, setSendingId] = useState<string | null>(null);
  const [editing, setEditing] = useState<OrganizationNeedAnalysis | null | "new">(null);
  const [prefillDealId, setPrefillDealId] = useState<string | null>(
    initialDealId ?? dealId ?? null,
  );

  const reload = useCallback(async () => {
    if (scopeKind === "deal" && !dealId) {
      setLoading(false);
      setError("Enregistrez la fiche pour créer une analyse.");
      return;
    }
    if (scopeKind === "organization" && !organizationId) {
      setLoading(false);
      setError("Impossible de charger les besoins sans compte client.");
      return;
    }
    const nextScope: Scope =
      scopeKind === "deal" && dealId
        ? { kind: "deal", dealId, organizationId: organizationId ?? null }
        : { kind: "organization", organizationId: organizationId as string, dealId: dealId ?? null };
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(listUrl(nextScope));
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
  }, [scopeKind, dealId, organizationId]);

  useEffect(() => {
    void reload();
  }, [reload]);

  useEffect(() => {
    if (initialDealId || (scopeKind === "deal" && dealId)) {
      setPrefillDealId(initialDealId ?? dealId ?? null);
    }
  }, [initialDealId, dealId, scopeKind]);

  async function removeAnalysis(row: OrganizationNeedAnalysis) {
    if (!scope) return;
    if (!confirm(`Supprimer « ${row.title || "Analyse"} » ?`)) return;
    try {
      const res = await fetch(itemUrl(scope, row.id), { method: "DELETE" });
      const json = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(json.error || "Suppression impossible");
      setAnalyses((prev) => prev.filter((a) => a.id !== row.id));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Suppression impossible");
    }
  }

  async function requestClientValidation(row: OrganizationNeedAnalysis) {
    if (!scope) return;
    const email = window.prompt(
      `Faire valider « ${row.title || "Analyse"} » : email de l’interlocuteur client ?\nLe PDF et le lien de validation lui seront envoyés.`,
      "",
    );
    if (email === null) return;
    const trimmed = email.trim();
    if (!trimmed) {
      setError("Email de l’interlocuteur requis pour l’envoi.");
      return;
    }
    if (!window.confirm(`Envoyer l’analyse à ${trimmed} pour validation ?`)) return;
    setError(null);
    setNotice(null);
    setSendingId(row.id);
    try {
      const res = await fetch(sendClientUrl(scope, row.id), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ interlocutor_email: trimmed }),
      });
      const json = (await res.json()) as { analysis?: OrganizationNeedAnalysis; error?: string };
      if (!res.ok || !json.analysis) throw new Error(json.error || "Envoi impossible");
      const sent = json.analysis;
      setAnalyses((prev) => prev.map((a) => (a.id === sent.id ? sent : a)));
      setNotice(`Analyse envoyée à ${trimmed}.`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Envoi impossible");
    } finally {
      setSendingId(null);
    }
  }

  const completeCount = analyses.filter((a) => a.status === "complete").length;
  const surMesureOrgId = organizationId ?? null;

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
            setPrefillDealId(dealId ?? initialDealId ?? null);
            setEditing("new");
          }}
          className="inline-flex items-center gap-2 rounded-full bg-[#6E5BFF] px-4 py-2 text-sm font-semibold"
        >
          <Plus className="h-4 w-4" /> Nouvelle analyse
        </button>
      </div>

      {error ? <p className="text-sm text-[#FF8A9B]">{error}</p> : null}
      {notice ? <p className="text-sm text-[#6BE39B]">{notice}</p> : null}

      {loading ? (
        <p className="flex items-center gap-2 text-sm text-[#8A93AE]">
          <Loader2 className="h-4 w-4 animate-spin" /> Chargement…
        </p>
      ) : analyses.length === 0 ? (
        <EmptyState
          title="Aucune analyse du besoin pour cette fiche."
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
              role="button"
              tabIndex={0}
              onClick={() => setEditing(row)}
              onKeyDown={(e) => {
                if (e.target === e.currentTarget && (e.key === "Enter" || e.key === " ")) {
                  e.preventDefault();
                  setEditing(row);
                }
              }}
              className="cursor-pointer rounded-[22px] border border-[#1A2340] bg-[#0B1122] p-5"
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
              <div className="mt-3 flex flex-wrap gap-1.5">
                <span className="rounded-full bg-[#1A2340] px-2.5 py-0.5 text-[11px] text-[#C9D2E8]">
                  {row.request_type === "particulier" ? "Particulier" : "Entreprise"}
                </span>
                {row.details?.place_mode ? (
                  <span className="rounded-full bg-[#1A2340] px-2.5 py-0.5 text-[11px] text-[#C9D2E8]">
                    {PLACE_MODE_LABEL[row.details.place_mode]}
                  </span>
                ) : null}
                {row.details?.place ? (
                  <span className="rounded-full bg-[#1A2340] px-2.5 py-0.5 text-[11px] text-[#C9D2E8]">
                    {row.details.place}
                  </span>
                ) : null}
                {row.details?.duration ? (
                  <span className="rounded-full bg-[#1A2340] px-2.5 py-0.5 text-[11px] text-[#C9D2E8]">
                    {row.details.duration}
                  </span>
                ) : null}
                {row.request_type !== "particulier" && row.details?.headcount ? (
                  <span className="rounded-full bg-[#1A2340] px-2.5 py-0.5 text-[11px] text-[#C9D2E8]">
                    {row.details.headcount}
                  </span>
                ) : null}
              </div>
              <p className="mt-3 line-clamp-3 text-sm text-[#9AA3BD]">
                {row.context_problem || row.expected_outcomes || "Pas encore de contenu."}
              </p>
              {row.client_validated_at || row.client_sent_at ? (
                <p className="mt-2 text-xs text-[#6C7593]">
                  {row.client_validated_at
                    ? `Validée par le client le ${fmtDay(row.client_validated_at)}`
                    : `Envoyée au client le ${fmtDay(row.client_sent_at)}`}
                </p>
              ) : null}
              <div className="mt-4 flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setEditing(row);
                  }}
                  className="rounded-full bg-white px-3.5 py-1.5 text-xs font-bold text-[#0A0F1E]"
                >
                  Ouvrir
                </button>
                <button
                  type="button"
                  disabled={sendingId === row.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    void requestClientValidation(row);
                  }}
                  className="rounded-full border border-[#26304F] px-3.5 py-1.5 text-xs font-semibold text-[#C9D2E8] disabled:opacity-50"
                >
                  {sendingId === row.id ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    "Faire valider le besoin"
                  )}
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    void removeAnalysis(row);
                  }}
                  className="inline-flex items-center gap-1 rounded-full px-2.5 py-1.5 text-xs font-semibold text-[#FF8A9B] hover:bg-[#2A1520]"
                >
                  <Trash2 className="h-3.5 w-3.5" /> Supprimer
                </button>
              </div>
            </article>
          ))}
        </div>
      )}

      {editing !== null && scope ? (
        <AccountBesoinDialog
          scope={scope}
          analysis={editing === "new" ? null : editing}
          deals={deals}
          prefillDealId={editing === "new" ? prefillDealId : null}
          surMesureHref={surMesureOrgId ? surmesureNewHref(surMesureOrgId) : null}
          onClose={() => {
            setEditing(null);
            setPrefillDealId(null);
            if (initialDealId && typeof window !== "undefined") {
              const url = new URL(window.location.href);
              url.searchParams.delete("dealId");
              window.history.replaceState(null, "", `${url.pathname}${url.search}`);
            }
          }}
          onUpdated={(updated) => {
            setAnalyses((prev) =>
              prev.some((a) => a.id === updated.id)
                ? prev.map((a) => (a.id === updated.id ? updated : a))
                : [updated, ...prev],
            );
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
