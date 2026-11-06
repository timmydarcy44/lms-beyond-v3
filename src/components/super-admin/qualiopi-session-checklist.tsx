"use client";

import { useMemo } from "react";
import { CheckCircle2, Circle } from "lucide-react";
import type { QualiopiSession } from "@/lib/crm/qualiopi-shared";
import { cn } from "@/lib/utils";

export function QualiopiSessionChecklist({
  session,
  className,
}: {
  session: QualiopiSession;
  className?: string;
}) {
  const attendees = session.attendees ?? [];
  const signed = attendees.filter((a) => a.signed_at).length;
  const satisfied = attendees.filter((a) => a.satisfaction_at || a.satisfaction_score != null).length;

  const steps = useMemo(
    () => [
      { label: "Programmée", done: Boolean(session.scheduled_at) },
      {
        label: "Pack envoyé",
        done: Boolean(session.convention_sent_at && session.reglement_sent_at && session.livret_sent_at),
      },
      { label: "Démarrée", done: session.status === "in_progress" || session.status === "done" },
      { label: "Émargée", done: attendees.length > 0 && signed === attendees.length },
      { label: "Clôturée", done: session.status === "done" },
      { label: "Satisfaction", done: attendees.length > 0 && satisfied === attendees.length },
    ],
    [session, attendees.length, signed, satisfied],
  );

  return (
    <div className={cn("flex flex-wrap gap-1.5", className)}>
      {steps.map((step) => (
        <span
          key={step.label}
          className={cn(
            "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px]",
            step.done
              ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-200"
              : "border-white/10 bg-white/5 text-white/45",
          )}
          title={step.label}
        >
          {step.done ? <CheckCircle2 className="h-3 w-3" /> : <Circle className="h-3 w-3" />}
          {step.label}
        </span>
      ))}
    </div>
  );
}
