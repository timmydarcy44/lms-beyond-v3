"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  QUALIOPI_CARD,
  QUALIOPI_CARD_INNER,
  QUALIOPI_MUTED,
} from "@/components/super-admin/qualiopi/qualiopi-audit-styles";
import { cn } from "@/lib/utils";

type ProcessDoc = {
  id: string;
  kind: string;
  title: string;
  body: string;
  status: "draft" | "ready" | "attested";
  file_url: string | null;
};

export function QualiopiProcessDocsPanel() {
  const [docs, setDocs] = useState<ProcessDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [active, setActive] = useState<string | null>(null);
  const [draftBody, setDraftBody] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/super-admin/crm/qualiopi/process-docs");
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Documents process");
      const list = (json.docs ?? []) as ProcessDoc[];
      setDocs(list);
      if (!active && list[0]) {
        setActive(list[0].kind);
        setDraftBody(list[0].body);
      } else if (active) {
        const current = list.find((d) => d.kind === active);
        if (current) setDraftBody(current.body);
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Chargement impossible");
    } finally {
      setLoading(false);
    }
  }, [active]);

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- initial load once
  }, []);

  const current = docs.find((d) => d.kind === active) ?? null;

  const select = (kind: string) => {
    const doc = docs.find((d) => d.kind === kind);
    setActive(kind);
    setDraftBody(doc?.body ?? "");
  };

  const save = async (status?: ProcessDoc["status"]) => {
    if (!active) return;
    const res = await fetch("/api/super-admin/crm/qualiopi/process-docs", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ kind: active, body: draftBody, status }),
    });
    const json = await res.json();
    if (!res.ok) {
      toast.error(json.error || "Enregistrement impossible");
      return;
    }
    toast.success(status === "ready" ? "Document marqué prêt" : "Brouillon enregistré");
    await load();
  };

  const download = () => {
    if (!current) return;
    const blob = new Blob([draftBody], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${new Date().toISOString().slice(0, 10)}_${current.kind}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white sm:text-3xl">Documents process</h1>
        <p className={cn("mt-1 max-w-2xl text-sm", QUALIOPI_MUTED)}>
          Trames réclamations, PAQ, formateurs, handicap, moyens. Adaptez le texte, marquez « prêt », déposez le PDF
          final dans votre Drive auditeur.
        </p>
      </div>

      {loading ? (
        <p className={cn("flex items-center gap-2 text-sm", QUALIOPI_MUTED)}>
          <Loader2 className="h-4 w-4 animate-spin" /> Chargement…
        </p>
      ) : (
        <div className="grid gap-4 lg:grid-cols-[240px_1fr]">
          <ul className="space-y-2">
            {docs.map((doc) => (
              <li key={doc.kind}>
                <button
                  type="button"
                  onClick={() => select(doc.kind)}
                  className={cn(
                    QUALIOPI_CARD_INNER,
                    "w-full px-3 py-3 text-left text-sm",
                    active === doc.kind ? "border-[#6E5BFF]/40 bg-[#6E5BFF]/10" : "",
                  )}
                >
                  <p className="font-semibold text-white">{doc.title}</p>
                  <p className={cn("mt-1 text-[11px] uppercase tracking-wide", QUALIOPI_MUTED)}>{doc.status}</p>
                </button>
              </li>
            ))}
          </ul>

          <section className={cn(QUALIOPI_CARD, "p-5")}>
            {current ? (
              <>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h2 className="text-lg font-semibold text-white">{current.title}</h2>
                  <div className="flex flex-wrap gap-2">
                    <Button type="button" variant="outline" onClick={download} className="border-white/15 bg-transparent text-white">
                      Télécharger .md
                    </Button>
                    <Button type="button" variant="outline" onClick={() => void save()} className="border-white/15 bg-transparent text-white">
                      Sauver brouillon
                    </Button>
                    <Button type="button" onClick={() => void save("ready")} className="bg-[#6E5BFF] text-white hover:bg-[#5a49e6]">
                      Marquer prêt
                    </Button>
                  </div>
                </div>
                <textarea
                  value={draftBody}
                  onChange={(e) => setDraftBody(e.target.value)}
                  className="mt-4 min-h-[420px] w-full rounded-xl border border-white/10 bg-[#0B1122] px-3 py-3 font-mono text-sm leading-relaxed text-white outline-none focus:border-[#6E5BFF]"
                />
              </>
            ) : (
              <p className={cn("text-sm", QUALIOPI_MUTED)}>Aucun document.</p>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
