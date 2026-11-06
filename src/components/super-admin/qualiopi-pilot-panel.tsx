"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { CheckCircle2, Circle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  QUALIOPI_CARD,
  QUALIOPI_CARD_INNER,
  QUALIOPI_MUTED,
} from "@/components/super-admin/qualiopi/qualiopi-audit-styles";
import { cn } from "@/lib/utils";

type Step = { id: string; label: string; done: boolean; href: string };

export function QualiopiPilotPanel() {
  const [steps, setSteps] = useState<Step[]>([]);
  const [progress, setProgress] = useState({ done: 0, total: 0 });
  const [bestSession, setBestSession] = useState<{
    id: string;
    course_name: string;
    status: string;
  } | null>(null);
  const [vault, setVault] = useState<Array<{ kind: string; title: string; uploaded: boolean }>>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/super-admin/crm/qualiopi/pilot");
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Pilote");
      setSteps(json.steps ?? []);
      setProgress(json.progress ?? { done: 0, total: 0 });
      setBestSession(json.bestSession);
      setVault(json.vault ?? []);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Chargement impossible");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white sm:text-3xl">Session pilote</h1>
        <p className={cn("mt-1 max-w-2xl text-sm", QUALIOPI_MUTED)}>
          Bouclez une session réelle ou démo pour verrouiller les preuves runtime (pack, émargement, satisfaction) + 1
          action PAQ.
        </p>
      </div>

      {loading ? (
        <p className={cn("flex items-center gap-2 text-sm", QUALIOPI_MUTED)}>
          <Loader2 className="h-4 w-4 animate-spin" /> Chargement…
        </p>
      ) : (
        <>
          <div className={cn(QUALIOPI_CARD, "p-5")}>
            <p className="text-sm text-white/80">
              Progression {progress.done}/{progress.total}
              {bestSession ? ` · session « ${bestSession.course_name} » (${bestSession.status})` : ""}
            </p>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full bg-[#6E5BFF]"
                style={{
                  width: `${progress.total ? Math.round((progress.done / progress.total) * 100) : 0}%`,
                }}
              />
            </div>
          </div>

          <section className={cn(QUALIOPI_CARD, "p-5")}>
            <h2 className="text-lg font-semibold text-white">Checklist</h2>
            <ul className="mt-4 space-y-2">
              {steps.map((step) => (
                <li key={step.id} className={cn(QUALIOPI_CARD_INNER, "flex items-center justify-between gap-3 p-3")}>
                  <div className="flex items-center gap-3">
                    {step.done ? (
                      <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                    ) : (
                      <Circle className="h-5 w-5 text-white/30" />
                    )}
                    <span className={cn("text-sm", step.done ? "text-white" : "text-white/70")}>{step.label}</span>
                  </div>
                  <Link href={step.href} className="text-xs text-[#9BB0FF] hover:underline">
                    Ouvrir
                  </Link>
                </li>
              ))}
            </ul>
          </section>

          <section className={cn(QUALIOPI_CARD, "p-5")}>
            <h2 className="text-lg font-semibold text-white">Coffre (garde-fou démarrage)</h2>
            <ul className="mt-3 space-y-1">
              {vault.map((v) => (
                <li key={v.kind} className="flex items-center gap-2 text-sm text-white/75">
                  {v.uploaded ? (
                    <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                  ) : (
                    <Circle className="h-4 w-4 text-amber-300" />
                  )}
                  {v.title}
                </li>
              ))}
            </ul>
            <p className={cn("mt-3 text-xs", QUALIOPI_MUTED)}>
              Le démarrage d’une session est bloqué si un des 3 PDF modèles manque.
            </p>
          </section>
        </>
      )}
    </div>
  );
}
