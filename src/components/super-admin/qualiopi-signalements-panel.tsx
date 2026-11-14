"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  QUALIOPI_CARD,
  QUALIOPI_CARD_INNER,
  QUALIOPI_MUTED,
} from "@/components/super-admin/qualiopi/qualiopi-audit-styles";
import {
  SIGNALEMENT_CATEGORIES,
  SIGNALEMENT_CATEGORY_LABELS,
  SIGNALEMENT_STATUS_LABELS,
  type SignalementCategory,
  type SignalementStatus,
} from "@/lib/qualiopi/signalements";
import { cn } from "@/lib/utils";

type Signalement = {
  id: string;
  category: SignalementCategory;
  subject: string;
  description: string;
  status: SignalementStatus;
  is_anonymous: boolean;
  requester_name: string | null;
  requester_email: string | null;
  audience: string | null;
  received_at: string;
  ack_at: string | null;
  in_progress_at: string | null;
  closed_at: string | null;
  response: string | null;
  internal_notes: string | null;
};

export function QualiopiSignalementsPanel() {
  const [rows, setRows] = useState<Signalement[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [notes, setNotes] = useState("");
  const [response, setResponse] = useState("");
  const [busy, setBusy] = useState(false);
  const [ackDays, setAckDays] = useState(2);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/super-admin/crm/qualiopi/signalements");
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Signalements");
      const list = (json.signalements ?? []) as Signalement[];
      setRows(list);
      setAckDays(Number(json.settings?.ackBusinessDays ?? 2));
      setSelectedId((prev) => {
        if (prev && list.some((r) => r.id === prev)) return prev;
        return list[0]?.id ?? null;
      });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Chargement impossible");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const selected = useMemo(
    () => rows.find((r) => r.id === selectedId) ?? rows[0] ?? null,
    [rows, selectedId],
  );

  useEffect(() => {
    setNotes(selected?.internal_notes ?? "");
    setResponse(selected?.response ?? "");
  }, [selected?.id, selected?.internal_notes, selected?.response]);

  const transition = async (status: SignalementStatus) => {
    if (!selected) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/super-admin/crm/qualiopi/signalements/${selected.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status,
          internal_notes: notes,
          response,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Mise à jour impossible");
      toast.success(`Statut → ${SIGNALEMENT_STATUS_LABELS[status]}`);
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erreur");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className={cn(QUALIOPI_CARD, "space-y-4")}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-white">Signalements sensibles</h2>
          <p className={cn("mt-1 text-sm", QUALIOPI_MUTED)}>
            Violences / harcèlement / discriminations — registre séparé. Accusé de réception cible :{" "}
            {ackDays} j ouvrés.
          </p>
        </div>
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="border-white/15 bg-transparent text-white"
          onClick={() => void load()}
        >
          Rafraîchir
        </Button>
      </div>

      {loading ? (
        <p className={cn("flex items-center gap-2 text-sm", QUALIOPI_MUTED)}>
          <Loader2 className="h-4 w-4 animate-spin" /> Chargement…
        </p>
      ) : (
        <div className="grid gap-4 lg:grid-cols-[1fr_1.1fr]">
          <ul className="max-h-[420px] space-y-2 overflow-y-auto">
            {rows.length === 0 ? (
              <li className={cn("rounded-xl border border-white/10 px-3 py-4 text-sm", QUALIOPI_MUTED)}>
                Aucun signalement.
              </li>
            ) : (
              rows.map((r) => (
                <li key={r.id}>
                  <button
                    type="button"
                    onClick={() => setSelectedId(r.id)}
                    className={cn(
                      "w-full rounded-xl border px-3 py-2 text-left text-sm transition",
                      selected?.id === r.id
                        ? "border-[#6E5BFF] bg-[#6E5BFF]/15"
                        : "border-white/10 bg-white/[0.03] hover:border-white/20",
                    )}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-medium text-white">{r.subject}</span>
                      <span className="shrink-0 rounded-full bg-white/10 px-2 py-0.5 text-[10px] text-white/80">
                        {SIGNALEMENT_STATUS_LABELS[r.status]}
                      </span>
                    </div>
                    <p className={cn("mt-1 text-[11px]", QUALIOPI_MUTED)}>
                      {SIGNALEMENT_CATEGORY_LABELS[r.category]} ·{" "}
                      {new Date(r.received_at).toLocaleDateString("fr-FR")}
                      {r.is_anonymous ? " · Anonyme" : r.requester_name ? ` · ${r.requester_name}` : ""}
                    </p>
                  </button>
                </li>
              ))
            )}
          </ul>

          {selected ? (
            <div className={cn(QUALIOPI_CARD_INNER, "space-y-3")}>
              <div>
                <p className="text-sm font-semibold text-white">{selected.subject}</p>
                <p className={cn("mt-1 text-xs", QUALIOPI_MUTED)}>
                  {SIGNALEMENT_CATEGORY_LABELS[selected.category]} ·{" "}
                  {SIGNALEMENT_STATUS_LABELS[selected.status]}
                </p>
              </div>
              <p className="whitespace-pre-wrap text-sm text-white/80">{selected.description}</p>
              <div>
                <label className={cn("mb-1 block text-xs", QUALIOPI_MUTED)}>Notes internes</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  className="w-full rounded-xl border border-white/10 bg-[#0B1122] px-3 py-2 text-sm text-white"
                />
              </div>
              <div>
                <label className={cn("mb-1 block text-xs", QUALIOPI_MUTED)}>
                  Réponse (si non anonyme)
                </label>
                <textarea
                  value={response}
                  onChange={(e) => setResponse(e.target.value)}
                  rows={3}
                  className="w-full rounded-xl border border-white/10 bg-[#0B1122] px-3 py-2 text-sm text-white"
                />
              </div>
              <div className="flex flex-wrap gap-2">
                {(
                  [
                    ["acked", "Accuser réception"],
                    ["in_progress", "En traitement"],
                    ["closed", "Clôturer"],
                  ] as const
                ).map(([st, label]) => (
                  <Button
                    key={st}
                    type="button"
                    size="sm"
                    disabled={busy || selected.status === st}
                    className="bg-[#6E5BFF] text-white"
                    onClick={() => void transition(st)}
                  >
                    {label}
                  </Button>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      )}

      <p className={cn("text-[11px]", QUALIOPI_MUTED)}>
        Catégories : {SIGNALEMENT_CATEGORIES.map((c) => SIGNALEMENT_CATEGORY_LABELS[c]).join(" · ")}
      </p>
    </div>
  );
}
