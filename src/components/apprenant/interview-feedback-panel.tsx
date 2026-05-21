"use client";

import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { InterviewFeedbackPayload } from "@/app/api/ai/experiential-interview/feedback/route";
import { cn } from "@/lib/utils";

type InterviewFeedbackPanelProps = {
  feedback: InterviewFeedbackPayload | null;
  loading?: boolean;
  error?: string | null;
  onContinue: () => void;
  className?: string;
};

function BulletSection({
  title,
  items,
  tone,
}: {
  title: string;
  items: string[];
  tone: "emerald" | "amber" | "violet" | "rose";
}) {
  if (!items.length) return null;
  const tones = {
    emerald: "border-emerald-200 bg-emerald-50 text-emerald-950",
    amber: "border-amber-200 bg-amber-50 text-amber-950",
    violet: "border-violet-200 bg-violet-50 text-violet-950",
    rose: "border-rose-200 bg-rose-50 text-rose-950",
  };
  return (
    <div className={cn("rounded-2xl border p-4", tones[tone])}>
      <h4 className="text-xs font-bold uppercase tracking-[0.28em] text-inherit opacity-90">{title}</h4>
      <ul className="mt-3 space-y-2 text-sm leading-relaxed text-inherit">
        {items.map((item, i) => (
          <li key={`${title}-${i}`} className="flex gap-2 text-inherit">
            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-current opacity-60" />
            <span className="text-inherit">{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function InterviewFeedbackPanel({
  feedback,
  loading,
  error,
  onContinue,
  className,
}: InterviewFeedbackPanelProps) {
  return (
    <div
      className={cn(
        "apprenant-studio-light mx-auto w-full max-w-2xl space-y-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-xl sm:p-8 text-slate-900",
        className,
      )}
    >
      <div className="space-y-2 text-center">
        <p className="text-[10px] font-semibold uppercase tracking-[0.4em] text-violet-600">
          Bilan de l&apos;entretien
        </p>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900">Vos axes de progression</h2>
        <p className="text-sm text-slate-600">Pas de note — uniquement des pistes pour aller plus loin.</p>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center gap-3 py-16 text-slate-500">
          <Loader2 className="h-8 w-8 animate-spin text-violet-600" />
          <p className="text-sm">Analyse de votre entretien…</p>
        </div>
      ) : error ? (
        <p className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">{error}</p>
      ) : feedback ? (
        <div className="space-y-4">
          <p className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm leading-relaxed text-slate-800">
            {feedback.summary}
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            <BulletSection title="Ce que vous avez bien exprimé" items={feedback.bien_dit} tone="emerald" />
            <BulletSection title="À reformuler ou approfondir" items={feedback.a_revoir} tone="amber" />
            <BulletSection title="Ce que vous semblez avoir compris" items={feedback.compris} tone="violet" />
            <BulletSection title="Encore flou ou à consolider" items={feedback.pas_compris} tone="rose" />
          </div>
          <BulletSection
            title="Axes d'amélioration"
            items={feedback.axes_amelioration}
            tone="violet"
          />
        </div>
      ) : null}

      <div className="flex justify-center pt-2">
        <Button
          type="button"
          onClick={onContinue}
          disabled={loading}
          className="rounded-full bg-slate-900 px-8 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-white hover:bg-slate-800"
        >
          Continuer le parcours
        </Button>
      </div>
    </div>
  );
}
