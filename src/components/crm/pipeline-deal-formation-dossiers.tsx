"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { parseFetchJson } from "@/lib/api/parse-fetch-json";
import { FORMATION_DOSSIER_STATUS_LABELS, type FormationDossierStatus } from "@/lib/formation-dossier/constants";

type DossierRow = {
  id: string;
  course_title: string | null;
  status: FormationDossierStatus;
  amount_ht_cents: number | null;
  deal_regressed: boolean;
  pending_confirm_fields: string[] | null;
  created_at: string;
};

export function PipelineDealFormationDossiers({
  dealId,
  organizationId,
  tone = "light",
}: {
  dealId?: string;
  organizationId?: string | null;
  tone?: "light" | "dark";
}) {
  const [dossiers, setDossiers] = useState<DossierRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);

  const load = useCallback(async () => {
    if (!dealId) return;
    setLoading(true);
    try {
      const res = await fetch(
        `/api/super-admin/crm/formation-dossiers?deal_id=${encodeURIComponent(dealId)}`,
      );
      const json = await parseFetchJson<{ dossiers?: DossierRow[]; error?: string }>(res);
      if (!res.ok) throw new Error(json.error);
      setDossiers(json.dossiers ?? []);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Dossiers indisponibles");
    } finally {
      setLoading(false);
    }
  }, [dealId]);

  useEffect(() => {
    void load();
  }, [load]);

  const create = async () => {
    if (!organizationId) {
      toast.error("Liez d'abord une organisation au deal");
      return;
    }
    setCreating(true);
    try {
      const res = await fetch("/api/super-admin/crm/formation-dossiers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          organization_id: organizationId,
          deal_id: dealId,
          source: "manual",
        }),
      });
      const json = await parseFetchJson<{ error?: string }>(res);
      if (!res.ok) throw new Error(json.error);
      toast.success("Dossier formation créé");
      await load();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Création impossible");
    } finally {
      setCreating(false);
    }
  };

  const dark = tone === "dark";

  if (!dealId) {
    return (
      <p className={cn("text-sm", dark ? "text-slate-400" : "text-gray-500")}>
        Enregistrez la fiche pour créer un dossier formation.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className={cn("text-sm font-semibold", dark ? "text-white" : "text-gray-900")}>
            Dossiers formation
          </p>
          <p className={cn("mt-1 text-xs", dark ? "text-slate-400" : "text-gray-500")}>
            Qualification → clôture Qualiopi. Un deal gagné crée un dossier automatiquement.
          </p>
        </div>
        <Button
          type="button"
          size="sm"
          variant="outline"
          className={dark ? "border-white/25 bg-white/10 text-white hover:bg-white/20" : ""}
          disabled={creating || !organizationId}
          onClick={() => void create()}
        >
          <Plus className="mr-1 h-3 w-3" />
          Nouveau dossier
        </Button>
      </div>

      {loading ? (
        <p className={cn("text-sm", dark ? "text-slate-400" : "text-gray-500")}>Chargement…</p>
      ) : dossiers.length === 0 ? (
        <p className={cn("text-sm", dark ? "text-slate-400" : "text-gray-500")}>
          Aucun dossier pour l’instant.
        </p>
      ) : (
        dossiers.map((dossier) => {
          const pending = Array.isArray(dossier.pending_confirm_fields)
            ? dossier.pending_confirm_fields.length
            : 0;
          return (
            <article
              key={dossier.id}
              className={cn(
                "rounded-xl border p-4",
                dark ? "border-white/10 bg-slate-900/50" : "border-gray-200 bg-gray-50",
              )}
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className={cn("font-medium", dark ? "text-white" : "text-gray-900")}>
                    {dossier.course_title?.trim() || "Formation à confirmer"}
                  </p>
                  <p className={cn("mt-0.5 text-xs", dark ? "text-slate-400" : "text-gray-500")}>
                    {FORMATION_DOSSIER_STATUS_LABELS[dossier.status] ?? dossier.status}
                    {dossier.amount_ht_cents != null
                      ? ` · ${(dossier.amount_ht_cents / 100).toLocaleString("fr-FR")} € HT`
                      : ""}
                    {pending > 0 ? ` · ${pending} champ(s) à confirmer` : ""}
                  </p>
                </div>
                {dossier.deal_regressed ? (
                  <span className="rounded-full bg-amber-500/20 px-2 py-0.5 text-[11px] font-semibold text-amber-300">
                    Deal reculé
                  </span>
                ) : null}
              </div>
            </article>
          );
        })
      )}
    </div>
  );
}
