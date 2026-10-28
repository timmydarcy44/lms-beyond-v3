export const CARE_PLANS = {
  bilan: {
    id: "bilan",
    name: "Bilan",
    priceCents: 0,
    sessionsLabel: "[1 séance]",
  },
  accompagnement: {
    id: "accompagnement",
    name: "Accompagnement",
    priceCents: 0,
    sessionsLabel: "[séances]",
    featured: true as const,
  },
  compagnon: {
    id: "compagnon",
    name: "Compagnon",
    priceCents: 0,
    sessionsLabel: "[illimité]",
  },
} as const;

export type CarePlanId = keyof typeof CARE_PLANS;

export function formatCarePrice(cents: number | null | undefined) {
  if (cents == null || !Number.isFinite(cents) || cents <= 0) return "[prix]";
  return `${Math.round(cents / 100)} €`;
}
