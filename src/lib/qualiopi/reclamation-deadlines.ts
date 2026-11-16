import { addFrenchBusinessDays, frenchBusinessDaysBetween } from "@/lib/qualiopi/business-days";
import type { ReclamationStep } from "@/lib/qualiopi/reclamation-status";
import { resolveReclamationStep } from "@/lib/qualiopi/reclamation-status";
import { formatFrDateShort, formatFrDateTime } from "@/lib/qualiopi/reclamation-format";

export type ReclamationDeadlineSettings = {
  ackBusinessDays: number;
  replyBusinessDays: number;
};

export const DEFAULT_RECLAMATION_DEADLINES: ReclamationDeadlineSettings = {
  ackBusinessDays: 2,
  replyBusinessDays: 10,
};

export type DeadlineBadge = {
  tone: "amber" | "red" | "green" | "muted";
  label: string;
  overdue: boolean;
};

export function computeDeadlineBadge(
  row: {
    status?: string | null;
    received_at?: string | null;
    ack_at?: string | null;
    answered_at?: string | null;
    closed_at?: string | null;
    response?: string | null;
  },
  settings: ReclamationDeadlineSettings = DEFAULT_RECLAMATION_DEADLINES,
  now = new Date(),
): DeadlineBadge {
  const step: ReclamationStep = resolveReclamationStep(row);
  if (step === "closed") {
    return {
      tone: "green",
      label: `Résolue le ${formatFrDateShort(row.closed_at ?? row.answered_at)}`,
      overdue: false,
    };
  }

  const received = row.received_at ? new Date(row.received_at) : now;

  if (step === "received") {
    const due = addFrenchBusinessDays(received, settings.ackBusinessDays);
    const overdue = now > due;
    if (overdue) {
      const days = frenchBusinessDaysBetween(due, now);
      return { tone: "red", label: `En retard de ${Math.max(1, days)} j`, overdue: true };
    }
    return {
      tone: "amber",
      label: `À accuser avant ${formatFrDateTime(due)}`,
      overdue: false,
    };
  }

  const replyStart = row.ack_at ? new Date(row.ack_at) : received;
  const due = addFrenchBusinessDays(replyStart, settings.replyBusinessDays);
  const overdue = now > due && (step === "acknowledged" || step === "analysis" || step === "answered");
  // answered but not closed still "à traiter" lightly — overdue only if past reply deadline without answer
  if (step === "answered") {
    return {
      tone: "amber",
      label: `Réponse le ${formatFrDateShort(row.answered_at)}`,
      overdue: false,
    };
  }
  if (overdue || (!row.answered_at && now > due)) {
    const days = frenchBusinessDaysBetween(due, now);
    return { tone: "red", label: `En retard de ${Math.max(1, days)} j`, overdue: true };
  }
  return {
    tone: "amber",
    label: `Réponse avant le ${formatFrDateShort(due)}`,
    overdue: false,
  };
}
