"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  mergeVeilleHighlightNote,
  type VeilleHighlight,
  type VeillePlanDraft,
  type VeillePlanDraftItem,
  splitVeilleHighlightNote,
} from "@/lib/qualiopi/veille-shared";

type Props = {
  highlight: VeilleHighlight;
  planBusy: boolean;
  onGeneratePlan: () => void;
  onUpdateNote: (note: string) => Promise<void>;
  onReload: () => Promise<void>;
};

export function VeilleHighlightPlan({
  highlight,
  planBusy,
  onGeneratePlan,
  onUpdateNote,
  onReload,
}: Props) {
  const parsed = splitVeilleHighlightNote(highlight.note);
  const [preface, setPreface] = useState(parsed.preface);
  const [items, setItems] = useState<VeillePlanDraftItem[]>(parsed.planDraft?.items ?? []);
  const [summary, setSummary] = useState(parsed.planDraft?.summary ?? "");
  const [paqBusy, setPaqBusy] = useState(false);

  useEffect(() => {
    const next = splitVeilleHighlightNote(highlight.note);
    setPreface(next.preface);
    setItems(next.planDraft?.items ?? []);
    setSummary(next.planDraft?.summary ?? "");
  }, [highlight.id, highlight.note, highlight.updated_at]);

  const persistDraft = async (nextItems: VeillePlanDraftItem[], nextPreface = preface) => {
    const draft: VeillePlanDraft = {
      version: 1,
      summary: summary || undefined,
      items: nextItems,
    };
    await onUpdateNote(mergeVeilleHighlightNote(nextPreface, draft));
  };

  const sendToPaq = async () => {
    const selected = items.filter((item) => item.selected !== false && item.title.trim());
    if (!selected.length) {
      toast.error("Cochez au moins une action retenue");
      return;
    }
    setPaqBusy(true);
    try {
      const res = await fetch(
        `/api/super-admin/crm/qualiopi/veilles/highlights/${highlight.id}/send-to-paq`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            decisionNote: preface,
            items,
          }),
        },
      );
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || "Envoi PAQ impossible");
      toast.success(`${selected.length} action(s) créée(s) dans le PAQ · information Traitée`);
      await onReload();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Envoi PAQ impossible");
    } finally {
      setPaqBusy(false);
    }
  };

  return (
    <div className="space-y-3">
      {items.length > 0 ? (
        <div className="rounded-lg border border-[#6E5BFF]/30 bg-[#6E5BFF]/10 px-3 py-3">
          <p className="text-[10px] font-bold uppercase tracking-wide text-[#c4bcff]">
            Proposition IA (brouillon)
          </p>
          {summary ? (
            <p className="mt-1 text-sm leading-relaxed text-[#e8e4ff]/summary}</p>
          ) : null}
          <ul className="mt-3 space-y-3">
            {items.map((item, index) => (
              <li key={item.id} className="rounded-lg border border-white/10 bg-[#0B1122]/60 p-3">
                <label className="flex items-start gap-2">
                  <input
                    type="checkbox"
                    className="mt-1"
                    checked={item.selected !== false}
                    onChange={(event) => {
                      const next = items.map((row, i) =>
                        i === index ? { ...row, selected: event.target.checked } : row,
                      );
                      setItems(next);
                    }}
                  />
                  <div className="min-w-0 flex-1 space-y-2">
                    <input
                      value={item.title}
                      onChange={(event) => {
                        const next = items.map((row, i) =>
                          i === index ? { ...row, title: event.target.value } : row,
                        );
                        setItems(next);
                      }}
                      className="w-full rounded-lg border border-white/10 bg-transparent px-2 py-1.5 text-sm text-white outline-none focus:border-[#6E5BFF]"
                    />
                    <div className="flex flex-wrap gap-2">
                      <input
                        value={item.owner_name ?? ""}
                        onChange={(event) => {
                          const next = items.map((row, i) =>
                            i === index
                              ? { ...row, owner_name: event.target.value || null }
                              : row,
                          );
                          setItems(next);
                        }}
                        placeholder="Responsable"
                        className="min-w-[140px] flex-1 rounded-lg border border-white/10 bg-transparent px-2 py-1 text-xs text-white outline-none focus:border-[#6E5BFF]"
                      />
                      <input
                        type="date"
                        value={item.due_at ?? ""}
                        onChange={(event) => {
                          const next = items.map((row, i) =>
                            i === index
                              ? { ...row, due_at: event.target.value || null }
                              : row,
                          );
                          setItems(next);
                        }}
                        className="rounded-lg border border-white/10 bg-transparent px-2 py-1 text-xs text-white outline-none focus:border-[#6E5BFF]"
                      />
                    </div>
                  </div>
                </label>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <div>
        <p className="text-[10px] font-bold uppercase tracking-wide text-white/40">
          Note de retravail
        </p>
        <textarea
          value={preface}
          onChange={(event) => setPreface(event.target.value)}
          onBlur={() => {
            const current = splitVeilleHighlightNote(highlight.note);
            if (preface.trim() === current.preface.trim()) return;
            void persistDraft(items, preface);
          }}
          placeholder="Ce que vous décidez…"
          className="mt-1 min-h-20 w-full rounded-xl border border-white/10 bg-[#0B1122] px-3 py-2 text-sm text-white outline-none focus:border-[#6E5BFF]"
        />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="button"
          size="sm"
          disabled={planBusy}
          onClick={onGeneratePlan}
          className="bg-[#6E5BFF] text-white hover:bg-[#5a49e6]"
        >
          {planBusy ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : null}
          {items.length ? "Régénérer la proposition IA" : "Faire un plan d’action"}
        </Button>
        {items.length > 0 ? (
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={paqBusy || highlight.status === "done"}
            onClick={() => void sendToPaq()}
            className="border-[#6E5BFF]/40 bg-[#6E5BFF]/10 text-[#d9d4ff] hover:bg-[#6E5BFF]/20"
          >
            {paqBusy ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : null}
            Envoyer au PAQ
          </Button>
        ) : null}
      </div>
    </div>
  );
}
