export const LOST_REASON_OPTIONS = [
  { value: "budget", label: "Budget" },
  { value: "concurrent", label: "Concurrent" },
  { value: "pas_de_besoin", label: "Pas de besoin" },
  { value: "projet_reporte", label: "Projet reporté" },
  { value: "timing", label: "Timing" },
  { value: "fonctionnalites", label: "Fonctionnalités" },
  { value: "interlocuteur_parti", label: "Interlocuteur parti" },
  { value: "decision_politique", label: "Décision politique" },
  { value: "internalisation", label: "Internalisation" },
  { value: "ne_repond_plus", label: "Ne répond plus" },
  { value: "autre", label: "Autre" },
] as const;

export const LOST_COMPETITOR_OPTIONS = [
  "Microsoft",
  "360Learning",
  "Didask",
  "CrossKnowledge",
  "Autre",
] as const;

export type LostReasonValue = (typeof LOST_REASON_OPTIONS)[number]["value"];
