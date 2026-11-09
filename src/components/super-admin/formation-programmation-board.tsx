"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { parseFetchJson } from "@/lib/api/parse-fetch-json";
import {
  FORMATION_DOSSIER_STATUSES,
  FORMATION_DOSSIER_STATUS_LABELS,
  isIncomingInboxDossier,
  type FormationDossierStatus,
} from "@/lib/formation-dossier/constants";
import type { FormationDossierBoardCard } from "@/lib/formation-dossier/board";
import { FormationDossierSheet } from "@/components/super-admin/formation-dossier-sheet";

export function FormationProgrammationBoard() {
  const [cards, setCards] = useState<FormationDossierBoardCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [motifOpen, setMotifOpen] = useState<{
    id: string;
    toStatus: FormationDossierStatus;
  } | null>(null);
  const [motif, setMotif] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/super-admin/crm/formation-dossiers?enriched=1");
      const json = await parseFetchJson<{ dossiers?: FormationDossierBoardCard[]; error?: string }>(
        res,
      );
      if (!res.ok) throw new Error(json.error);
      // Les demandes dashboard/site en qualification vivent dans « Demandes entrantes ».
      setCards((json.dossiers ?? []).filter((d) => !isIncomingInboxDossier(d)));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Chargement impossible");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const byStatus = useMemo(() => {
    const map = new Map<FormationDossierStatus, FormationDossierBoardCard[]>();
    for (const status of FORMATION_DOSSIER_STATUSES) map.set(status, []);
    for (const card of cards) {
      const list = map.get(card.status) ?? [];
      list.push(card);
      map.set(card.status, list);
    }
    return map;
  }, [cards]);

  const devisStats = useMemo(() => {
    const devis = byStatus.get("devis") ?? [];
    const totalHtCents = devis.reduce((sum, c) => sum + (c.amount_ht_cents ?? 0), 0);
    return { count: devis.length, totalHtCents };
  }, [byStatus]);

  const formatHt = (cents: number) =>
    new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: "EUR",
      maximumFractionDigits: 0,
    })
      .format(cents / 100)
      .replace(/[\u202f\u00a0]/g, " ");

  const transition = async (
    id: string,
    toStatus: FormationDossierStatus,
    motifText?: string,
  ) => {
    const res = await fetch(`/api/super-admin/crm/formation-dossiers/${id}/transition`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ to_status: toStatus, motif: motifText || null }),
    });
    const json = await parseFetchJson<{ error?: string; code?: string }>(res);
    if (!res.ok) {
      if (json.code === "motif_required") {
        setMotifOpen({ id, toStatus });
        setMotif("");
        return;
      }
      toast.error(json.error ?? "Transition refusée");
      return;
    }
    toast.success("Statut mis à jour");
    await load();
  };

  const onDrop = (toStatus: FormationDossierStatus, dossierId: string) => {
    const card = cards.find((c) => c.id === dossierId);
    if (!card || card.status === toStatus) return;
    void transition(dossierId, toStatus);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[#F3F4FA] sm:text-3xl">Programmation</h1>
          <p className="mt-1 max-w-2xl text-sm text-[#A3A8C7]">
            Cockpit ops des dossiers formation. Le drag passe par la transition serveur (pas de
            saut d&apos;étape).
          </p>
        </div>
        <Button
          type="button"
          className="bg-[#6C5CF5] text-white hover:bg-[#5B4DE0]"
          onClick={() => toast.message("Créez un dossier depuis la fiche entreprise ou un deal.")}
        >
          <Plus className="mr-1 h-4 w-4" />
          Nouveau dossier
        </Button>
      </div>

      {!loading ? (
        <section className="rounded-2xl border border-[#262A4A] bg-gradient-to-br from-[#1A1440] via-[#141731] to-[#141731] px-5 py-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-[#B7AEFF]">
            Devis en cours
          </p>
          <div className="mt-2 flex flex-wrap items-end justify-between gap-3">
            <p className="text-3xl font-extrabold tracking-tight text-white">
              {formatHt(devisStats.totalHtCents)}
              <span className="ml-2 text-sm font-semibold text-[#A3A8C7]">HT</span>
            </p>
            <p className="text-sm text-[#A3A8C7]">
              {devisStats.count} dossier{devisStats.count === 1 ? "" : "s"} en colonne Devis
            </p>
          </div>
        </section>
      ) : null}

      {loading ? (
        <p className="text-sm text-[#A3A8C7]">Chargement…</p>
      ) : (
        <div className="flex snap-x snap-mandatory gap-3 overflow-x-auto pb-4">
          {FORMATION_DOSSIER_STATUSES.map((status) => {
            const column = byStatus.get(status) ?? [];
            return (
              <div
                key={status}
                className="flex w-[min(280px,calc(100vw-2.5rem))] shrink-0 snap-start flex-col rounded-2xl border border-[#262A4A] bg-[#141731] sm:w-[280px]"
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  const id = e.dataTransfer.getData("dossierId");
                  if (id) onDrop(status, id);
                }}
              >
                <div className="border-b border-[#262A4A] px-3 py-2">
                  <p className="text-sm font-semibold text-[#F3F4FA]">
                    {FORMATION_DOSSIER_STATUS_LABELS[status]}
                  </p>
                  <p className="text-xs text-[#A3A8C7]">
                    {column.length} dossier{column.length > 1 ? "s" : ""}
                  </p>
                </div>
                <div className="min-h-[120px] flex-1 space-y-2 p-2">
                  {column.map((card) => (
                    <article
                      key={card.id}
                      draggable
                      onDragStart={(e) => e.dataTransfer.setData("dossierId", card.id)}
                      onClick={() => setSelectedId(card.id)}
                      className="cursor-grab rounded-xl border border-[#262A4A] bg-[#0A0C1B] p-3 text-[#F3F4FA] shadow-sm active:cursor-grabbing"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold">{card.organization_name}</p>
                          <p className="mt-0.5 truncate text-xs text-[#A3A8C7]">
                            {card.course_title?.trim() || "Formation à confirmer"}
                          </p>
                        </div>
                        {card.owner_initials ? (
                          <span
                            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#6C5CF5]/30 text-[11px] font-bold text-[#B7AEFF]"
                            title={card.owner_label ?? undefined}
                          >
                            {card.owner_initials}
                          </span>
                        ) : (
                          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[#262A4A] text-[10px] text-[#A3A8C7]">
                            —
                          </span>
                        )}
                      </div>
                      <div className="mt-2 flex flex-wrap items-center gap-1.5 text-[11px]">
                        {card.next_slot_date ? (
                          <span className="rounded-full bg-[#141731] px-2 py-0.5 text-[#A3A8C7]">
                            {new Date(card.next_slot_date).toLocaleDateString("fr-FR")}
                          </span>
                        ) : null}
                        {card.overdue ? (
                          <span className="rounded-full bg-red-500/20 px-2 py-0.5 font-semibold text-red-300">
                            En retard
                          </span>
                        ) : null}
                        {card.bpf_incomplete ? (
                          <span className="rounded-full bg-amber-500/20 px-2 py-0.5 font-semibold text-amber-200">
                            BPF incomplet
                          </span>
                        ) : null}
                        {card.deal_regressed ? (
                          <span className="rounded-full bg-orange-500/20 px-2 py-0.5 text-orange-200">
                            Deal reculé
                          </span>
                        ) : null}
                      </div>
                    </article>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {motifOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-md rounded-2xl border border-[#262A4A] bg-[#141731] p-5 text-[#F3F4FA]">
            <h2 className="text-lg font-semibold">Motif du retour arrière</h2>
            <p className="mt-1 text-sm text-[#A3A8C7]">Obligatoire pour reculer d&apos;une étape.</p>
            <textarea
              value={motif}
              onChange={(e) => setMotif(e.target.value)}
              rows={3}
              className="mt-3 w-full rounded-xl border border-[#262A4A] bg-[#0A0C1B] p-3 text-sm"
              placeholder="Ex. montant à revoir avec le client"
            />
            <div className="mt-4 flex justify-end gap-2">
              <Button
                variant="outline"
                className="border-[#262A4A] bg-transparent text-[#F3F4FA]"
                onClick={() => setMotifOpen(null)}
              >
                Annuler
              </Button>
              <Button
                className="bg-[#6C5CF5] text-white hover:bg-[#5B4DE0]"
                disabled={!motif.trim()}
                onClick={() => {
                  const target = motifOpen;
                  setMotifOpen(null);
                  void transition(target.id, target.toStatus, motif.trim());
                }}
              >
                Confirmer
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      <FormationDossierSheet
        dossierId={selectedId}
        onClose={() => setSelectedId(null)}
        onChanged={() => void load()}
      />
    </div>
  );
}
