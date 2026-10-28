export const CARE_PLANS = {
  bilan: {
    id: "bilan",
    name: "Bilan",
    priceCents: 0,
    sessionsLabel: "[1 séance]",
    features: [
      "Un bilan unique, dans six domaines de vie",
      "Une restitution avec un praticien certifié",
      "Des pistes d'action concrètes",
    ],
  },
  accompagnement: {
    id: "accompagnement",
    name: "Accompagnement",
    priceCents: 0,
    sessionsLabel: "[séances]",
    featured: true as const,
    features: [
      "Le bilan inclus",
      "Un suivi avec un praticien certifié",
      "Le compagnon IA entre les séances",
    ],
  },
  compagnon: {
    id: "compagnon",
    name: "Compagnon",
    priceCents: 0,
    sessionsLabel: "[illimité]",
    features: [
      "Accès au compagnon IA",
      "Rappels et suivi au quotidien",
      "Sans remplacer l'humain",
    ],
  },
} as const;

export type CarePlanId = keyof typeof CARE_PLANS;

export function formatCarePrice(cents: number | null | undefined) {
  if (cents == null || !Number.isFinite(cents) || cents <= 0) return "[prix]";
  return `${Math.round(cents / 100)} €`;
}
