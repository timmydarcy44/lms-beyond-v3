"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import type { MicroCheckinQuestion } from "@/lib/radar-equipe/micro-checkin-questions";
import { cn } from "@/lib/utils";

export function MicroCheckinWidget() {
  const [question, setQuestion] = useState<MicroCheckinQuestion | null>(null);
  const [dejaRepondu, setDejaRepondu] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    void (async () => {
      try {
        const res = await fetch("/api/radar-equipe/micro-checkin");
        const json = (await res.json()) as {
          question?: MicroCheckinQuestion;
          dejaRepondu?: boolean;
        };
        setQuestion(json.question ?? null);
        setDejaRepondu(Boolean(json.dejaRepondu));
      } catch {
        setQuestion(null);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const submit = async (score: number) => {
    if (!question) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/radar-equipe/micro-checkin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ questionId: question.id, score }),
      });
      const json = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(json.error ?? "Erreur");
      setDejaRepondu(true);
      toast.success("Merci — réponse enregistrée (anonyme)");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erreur");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || !question || dejaRepondu) return null;

  return (
    <div className="rounded-3xl border border-indigo-500/25 bg-indigo-950/30 p-5">
      <p className="text-[11px] font-bold uppercase tracking-widest text-indigo-300">
        Micro check-in — ~3 secondes
      </p>
      <p className="mt-2 text-sm font-medium text-white">{question.texte}</p>
      <p className="mt-1 text-xs text-white/50">
        Votre réponse est anonyme et ne sera jamais communiquée individuellement à votre employeur.
      </p>
      <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {question.options.map((opt, i) => (
          <Button
            key={opt}
            type="button"
            variant="outline"
            disabled={submitting}
            className={cn(
              "h-auto min-h-[44px] whitespace-normal border-white/15 bg-white/5 py-2 text-xs text-white",
              "hover:border-violet-400 hover:bg-violet-600/20",
            )}
            onClick={() => void submit(question.scores[i] ?? i + 1)}
          >
            {opt}
          </Button>
        ))}
      </div>
    </div>
  );
}
