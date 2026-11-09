"use client";

import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { Inbox } from "lucide-react";
import { parseFetchJson } from "@/lib/api/parse-fetch-json";
import {
  FORMATION_DOSSIER_SOURCE_LABELS,
  type FormationDossierSource,
} from "@/lib/formation-dossier/constants";
import type { FormationDossierBoardCard } from "@/lib/formation-dossier/board";
import { FormationDossierSheet } from "@/components/super-admin/formation-dossier-sheet";

export function FormationDemandesInbox() {
  const searchParams = useSearchParams();
  const [cards, setCards] = useState<FormationDossierBoardCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/super-admin/crm/formation-dossiers?enriched=1&inbox=1");
      const json = await parseFetchJson<{ dossiers?: FormationDossierBoardCard[]; error?: string }>(
        res,
      );
      if (!res.ok) throw new Error(json.error);
      setCards(json.dossiers ?? []);
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("formation-incoming-changed"));
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Chargement impossible");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    const dossier = searchParams.get("dossier")?.trim();
    if (dossier) setSelectedId(dossier);
  }, [searchParams]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#F3F4FA] sm:text-3xl">Demandes entrantes</h1>
        <p className="mt-1 max-w-2xl text-sm text-[#A3A8C7]">
          Demandes envoyées depuis le dashboard entreprise ou le site. Traitez-les ici (devis),
          puis elles passent dans Programmation.
        </p>
      </div>

      {loading ? (
        <p className="text-sm text-[#A3A8C7]">Chargement…</p>
      ) : cards.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-[28px] border border-dashed border-[#262A4A] bg-[#111831]/60 px-6 py-16 text-center">
          <Inbox className="mb-3 h-8 w-8 text-[#6C5CF5]" />
          <p className="font-semibold text-[#F3F4FA]">Aucune demande en attente</p>
          <p className="mt-1 text-sm text-[#A3A8C7]">
            Les nouvelles demandes dashboard / site apparaîtront ici.
          </p>
        </div>
      ) : (
        <ul className="space-y-3">
          {cards.map((card) => {
            const sourceLabel =
              FORMATION_DOSSIER_SOURCE_LABELS[card.source as FormationDossierSource] ??
              card.source;
            return (
              <li key={card.id}>
                <button
                  type="button"
                  onClick={() => setSelectedId(card.id)}
                  className="flex w-full flex-col gap-2 rounded-[22px] border border-[#262A4A] bg-[#111831] px-4 py-4 text-left transition hover:border-[#6C5CF5]/50 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-[#6C5CF5]/20 px-2 py-0.5 text-[11px] font-semibold text-[#B7AEFF]">
                        Nouveau
                      </span>
                      <span className="rounded-full bg-[#0A0C1B] px-2 py-0.5 text-[11px] text-[#A3A8C7]">
                        {sourceLabel}
                      </span>
                    </div>
                    <p className="mt-2 truncate text-base font-semibold text-[#F3F4FA]">
                      {card.course_title || "Formation à préciser"}
                    </p>
                    <p className="mt-0.5 text-sm text-[#A3A8C7]">{card.organization_name}</p>
                  </div>
                  <div className="shrink-0 text-left text-xs text-[#A3A8C7] sm:text-right">
                    <p>
                      {card.amount_ht_cents != null && card.amount_ht_cents > 0
                        ? `${(card.amount_ht_cents / 100).toLocaleString("fr-FR")} € HT`
                        : "Montant à définir"}
                    </p>
                    <p className="mt-1">
                      {new Date(card.updated_at).toLocaleString("fr-FR", {
                        dateStyle: "short",
                        timeStyle: "short",
                      })}
                    </p>
                    <p className="mt-2 font-semibold text-[#B7AEFF]">Ouvrir →</p>
                  </div>
                </button>
              </li>
            );
          })}
        </ul>
      )}

      <FormationDossierSheet
        dossierId={selectedId}
        onClose={() => setSelectedId(null)}
        onChanged={() => void load()}
      />
    </div>
  );
}
