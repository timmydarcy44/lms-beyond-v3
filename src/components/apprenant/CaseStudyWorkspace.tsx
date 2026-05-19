"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type CaseStudyWorkspaceProps = {
  value: string;
  onChange: (next: string) => void;
  storageKey?: string;
  prompt?: string | null;
  expectedProofs?: string[];
  onSubmitToAi: (payload: { text: string; expectedProofs: string[] }) => Promise<void>;
  className?: string;
};

export function CaseStudyWorkspace({
  value,
  onChange,
  storageKey,
  prompt,
  expectedProofs = [],
  onSubmitToAi,
  className,
}: CaseStudyWorkspaceProps) {
  const [hydrated, setHydrated] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const proofsLabel = useMemo(() => {
    const items = expectedProofs.filter(Boolean).slice(0, 6);
    if (items.length === 0) return "Aucune preuve attendue configurée.";
    return items.join(" · ");
  }, [expectedProofs]);

  useEffect(() => {
    if (!storageKey) return;
    try {
      const saved = sessionStorage.getItem(storageKey);
      if (saved && !value) {
        onChange(saved);
      }
    } catch {
      // ignore
    } finally {
      setHydrated(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storageKey]);

  useEffect(() => {
    if (!storageKey) return;
    if (!hydrated) return;
    const id = window.setTimeout(() => {
      try {
        sessionStorage.setItem(storageKey, value);
      } catch {
        // ignore
      }
    }, 500);
    return () => window.clearTimeout(id);
  }, [storageKey, value, hydrated]);

  return (
    <div className={cn("rounded-2xl border border-slate-200 bg-slate-100 p-4", className)}>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-500">Étude de cas</div>
          <div className="mt-1 text-sm text-slate-600">
            <span className="font-semibold text-slate-800">Preuves attendues</span>{" "}
            <span className="text-slate-500">·</span> {proofsLabel}
          </div>
        </div>
        <Button
          type="button"
          disabled={isSubmitting || !value.trim()}
          className="rounded-full bg-slate-900 text-white hover:bg-slate-800"
          onClick={async () => {
            setIsSubmitting(true);
            try {
              await onSubmitToAi({ text: value, expectedProofs });
            } finally {
              setIsSubmitting(false);
            }
          }}
        >
          {isSubmitting ? "Analyse…" : "Soumettre à Beyond AI"}
        </Button>
      </div>

      {prompt ? (
        <div className="mb-4 rounded-2xl border border-slate-200 bg-white px-5 py-4 text-slate-900 shadow-sm">
          <div className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-500">La problématique</div>
          <div className="mt-3 whitespace-pre-wrap text-sm leading-relaxed">{prompt}</div>
        </div>
      ) : null}

      <div className="flex justify-center">
        <div className="w-full max-w-4xl">
          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 px-6 py-3">
              <div className="text-[11px] font-semibold uppercase tracking-[0.35em] text-slate-400">
                Workspace (style Google Doc)
              </div>
            </div>
            <div className="bg-slate-50 px-3 py-6 sm:px-6">
              <div className="mx-auto w-full max-w-3xl rounded-md bg-white px-6 py-8 shadow-[0_12px_40px_-24px_rgba(15,23,42,0.35)]">
                <textarea
                  value={value}
                  onChange={(e) => onChange(e.target.value)}
                  className="min-h-[520px] w-full resize-none bg-white text-[15px] leading-7 text-slate-900 outline-none placeholder:text-slate-400"
                  placeholder="Rédigez votre livrable…"
                  style={{ fontFamily: "ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial" }}
                />
              </div>
            </div>
            <div className="flex items-center justify-between gap-3 border-t border-slate-100 px-6 py-3">
              <div className="text-xs text-slate-500">Autosave {storageKey ? "activé" : "désactivé"}</div>
              {storageKey ? (
                <Button
                  type="button"
                  variant="outline"
                  className="rounded-full border-slate-200 bg-white text-slate-900 hover:bg-slate-50"
                  onClick={() => {
                    try {
                      sessionStorage.setItem(storageKey, value);
                    } catch {
                      // ignore
                    }
                  }}
                >
                  Enregistrer
                </Button>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

