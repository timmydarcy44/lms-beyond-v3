"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Plus, X } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

function splitLines(text: string) {
  return text
    .split(/\r?\n/)
    .map((line) => line.replace(/^[\s\-*•\d.)]+/, "").trim())
    .filter(Boolean);
}

export function LineList({
  value,
  onChange,
  placeholder,
  kind,
  title,
}: {
  value: string[];
  onChange: (next: string[]) => void;
  placeholder: string;
  kind: "objectifs" | "prerequis";
  title: string;
}) {
  const rows = value.length ? value : [""];
  const [mode, setMode] = useState<"lines" | "paste" | "ai">("lines");
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const append = (lines: string[]) => {
    const kept = rows.map((row) => row.trim()).filter(Boolean);
    onChange([...kept, ...lines]);
    setDraft("");
    setMode("lines");
  };
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        <Button type="button" variant={mode === "paste" ? "default" : "ghost"} className="rounded-full" onClick={() => setMode(mode === "paste" ? "lines" : "paste")}>
          Faire un copier/coller
        </Button>
        <Button type="button" variant={mode === "ai" ? "default" : "ghost"} className="rounded-full" onClick={() => setMode(mode === "ai" ? "lines" : "ai")}>
          Avec l&apos;IA
        </Button>
      </div>
      {mode === "paste" ? (
        <div className="space-y-2">
          <Textarea value={draft} onChange={(event) => setDraft(event.target.value)} placeholder="Une ligne par élément" className="min-h-[120px] rounded-2xl border-0 bg-slate-50 text-slate-950" />
          <Button type="button" className="rounded-full" onClick={() => append(splitLines(draft))}>
            Ajouter ces lignes
          </Button>
        </div>
      ) : null}
      {mode === "ai" ? (
        <div className="space-y-2">
          <Textarea value={draft} onChange={(event) => setDraft(event.target.value)} placeholder="Décrivez le public et le sujet" className="min-h-[96px] rounded-2xl border-0 bg-slate-50 text-slate-950" />
          <Button
            type="button"
            disabled={busy}
            className="rounded-full"
            onClick={() => {
              setBusy(true);
              void fetch("/api/course-builder/lines", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ kind, title, prompt: draft }),
              })
                .then(async (response) => {
                  const json = (await response.json()) as { lines?: string[]; error?: string };
                  if (!response.ok || !json.lines?.length) {
                    toast.error(json.error ?? "L'IA n'a pas répondu");
                    return;
                  }
                  append(json.lines);
                })
                .finally(() => setBusy(false));
            }}
          >
            {busy ? "Génération…" : "Générer"}
          </Button>
        </div>
      ) : null}
      <AnimatePresence initial={false}>
        {rows.map((row, idx) => (
          <motion.div key={`${kind}-${idx}`} layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="flex items-center gap-2">
            <Input
              value={row}
              onChange={(event) => {
                const next = [...rows];
                next[idx] = event.target.value;
                onChange(next);
              }}
              placeholder={`${placeholder} ${idx + 1}`}
              className="rounded-2xl border-0 bg-slate-50 text-slate-950 placeholder:text-slate-400 shadow-sm"
            />
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                const next = rows.filter((_, index) => index !== idx);
                onChange(next.length ? next : [""]);
              }}
              className="h-10 w-10 rounded-full bg-slate-100 p-0 text-slate-700 hover:bg-slate-200"
              aria-label="Supprimer"
            >
              <X className="h-4 w-4" />
            </Button>
          </motion.div>
        ))}
      </AnimatePresence>
      <Button type="button" onClick={() => onChange([...rows, ""])} className="rounded-full bg-gradient-to-r from-[#003366] via-[#6633CC] to-[#FF00FF] px-5 py-2 text-sm font-medium text-white hover:opacity-95">
        <Plus className="mr-2 h-4 w-4" />
        Ajouter une ligne
      </Button>
    </div>
  );
}
