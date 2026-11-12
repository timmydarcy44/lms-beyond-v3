import type { FormationDossierStatus } from "@/lib/formation-dossier/constants";

/** Étapes UI consolidées (maquette Compte client · Formations). */
export const DOSSIER_STAGES = ["devis", "convention", "session", "cloture"] as const;
export type DossierStage = (typeof DOSSIER_STAGES)[number];

export const DOSSIER_STAGE_COLORS: Record<DossierStage, string> = {
  devis: "#F2CF6B",
  convention: "#8DB8FF",
  session: "#5EDCC3",
  cloture: "#6BE39B",
};

export const DOSSIER_STAGE_LABELS: Record<DossierStage, string> = {
  devis: "Devis",
  convention: "Convention",
  session: "Session",
  cloture: "Clôturé",
};

export const DOSSIER_STAGE_COUNT_LABELS: Record<DossierStage, string> = {
  devis: "en devis",
  convention: "en convention",
  session: "en session",
  cloture: "clôturé",
};

/** Seuils d’alertes (jours). */
export const DOSSIER_ALERT_THRESHOLDS = {
  devisNoReplyDays: 7,
  conventionUnsignedDays: 5,
  sessionSoonDays: 7,
  clotureAfterEndDays: 15,
} as const;

/**
 * Mapping statut DB → étape UI.
 *
 * Statuts en base (formation_dossiers.status) :
 * - qualification → devis
 * - devis → devis
 * - convention → convention
 * - mise_en_place → convention
 * - session → session
 * - fin → session (fin pédagogique, avant clôture Qualiopi)
 * - cloture → cloture
 * Tout autre / annulé / perdu → null (gris, hors résumé)
 */
export function getDossierStage(status: string | null | undefined): DossierStage | null {
  switch (String(status ?? "").toLowerCase()) {
    case "qualification":
    case "devis":
      return "devis";
    case "convention":
    case "mise_en_place":
      return "convention";
    case "session":
    case "fin":
      return "session";
    case "cloture":
      return "cloture";
    default:
      return null;
  }
}

export function stageIndex(stage: DossierStage | null): number {
  if (!stage) return -1;
  return DOSSIER_STAGES.indexOf(stage);
}

export type DossierAlertKind =
  | "devis_no_reply"
  | "convention_unsigned"
  | "session_unsigned"
  | "attendance_incomplete"
  | "to_close";

export type DossierAlert = {
  kind: DossierAlertKind;
  text: string;
  urgency: number;
};

export type DossierAlertInput = {
  status: string;
  stage: DossierStage | null;
  devisSentAt: string | null;
  devisSignedAt: string | null;
  conventionSentAt: string | null;
  conventionSignedAt: string | null;
  nextSlotDate: string | null;
  lastSlotDate: string | null;
  attendanceComplete: boolean | null;
  updatedAt?: string | null;
};

function daysBetween(fromIso: string, to = new Date()): number {
  const from = Date.parse(fromIso);
  if (!Number.isFinite(from)) return 0;
  return Math.floor((to.getTime() - from) / (24 * 60 * 60 * 1000));
}

function daysUntil(dateIso: string, from = new Date()): number {
  const target = Date.parse(dateIso.length <= 10 ? `${dateIso}T12:00:00` : dateIso);
  if (!Number.isFinite(target)) return Number.POSITIVE_INFINITY;
  return Math.ceil((target - from.getTime()) / (24 * 60 * 60 * 1000));
}

/** Une seule alerte : la plus urgente. */
export function pickDossierAlert(input: DossierAlertInput): DossierAlert | null {
  const alerts: DossierAlert[] = [];
  const {
    devisNoReplyDays,
    conventionUnsignedDays,
    sessionSoonDays,
    clotureAfterEndDays,
  } = DOSSIER_ALERT_THRESHOLDS;

  if (
    input.stage === "devis" &&
    input.devisSentAt &&
    !input.devisSignedAt
  ) {
    const n = daysBetween(input.devisSentAt);
    if (n >= devisNoReplyDays) {
      alerts.push({
        kind: "devis_no_reply",
        text: `Devis envoyé il y a ${n} jours, sans réponse`,
        urgency: 40 + n,
      });
    }
  }

  if (
    (input.stage === "convention" || input.stage === "session") &&
    input.conventionSentAt &&
    !input.conventionSignedAt
  ) {
    const n = daysBetween(input.conventionSentAt);
    if (n >= conventionUnsignedDays) {
      alerts.push({
        kind: "convention_unsigned",
        text: `Convention envoyée il y a ${n} jours, non signée`,
        urgency: 60 + n,
      });
    }
  }

  if (
    input.nextSlotDate &&
    !input.conventionSignedAt &&
    (input.stage === "convention" || input.stage === "session")
  ) {
    const n = daysUntil(input.nextSlotDate);
    if (n >= 0 && n < sessionSoonDays) {
      alerts.push({
        kind: "session_unsigned",
        text: `Session dans ${n} jour${n > 1 ? "s" : ""}, convention non signée`,
        urgency: 80 + (sessionSoonDays - n),
      });
    }
  }

  if (
    input.lastSlotDate &&
    daysUntil(input.lastSlotDate) < 0 &&
    input.attendanceComplete === false
  ) {
    alerts.push({
      kind: "attendance_incomplete",
      text: "Émargements incomplets",
      urgency: 90,
    });
  }

  if (input.stage === "session" && (input.status === "fin" || input.lastSlotDate)) {
    const endRef = input.lastSlotDate || input.updatedAt;
    if (endRef) {
      const n = daysBetween(endRef.length <= 10 ? `${endRef}T12:00:00` : endRef);
      if (n >= clotureAfterEndDays && input.status !== "cloture") {
        alerts.push({
          kind: "to_close",
          text: "À clôturer (Qualiopi)",
          urgency: 70 + n,
        });
      }
    }
  }

  if (!alerts.length) return null;
  return alerts.sort((a, b) => b.urgency - a.urgency)[0] ?? null;
}

export function formatHtFr(cents: number | null | undefined): string {
  if (cents == null) return "—";
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  })
    .format(cents / 100)
    .replace(/\u202f/g, "\u00a0");
}
