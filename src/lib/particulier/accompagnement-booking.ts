/** Tunnel réservation accompagnement EDGE — offres, créneaux, Stripe. */

import { publicAppUrl } from "@/lib/env";

export type EdgeAccompagnementOfferSlug =
  | "coaching-progression"
  | "simulation-professionnelle"
  | "programme-progression";

export type EdgeAccompagnementReservationStatus =
  | "pending"
  | "paid"
  | "confirmed"
  | "cancelled"
  | "refunded";

export type EdgeAccompagnementPaymentStatus =
  | "pending"
  | "paid"
  | "cancelled"
  | "refunded"
  | "failed";

export const PAYMENT_STATUS_LABELS: Record<EdgeAccompagnementPaymentStatus, string> = {
  pending: "Paiement en attente",
  paid: "Paiement validé",
  cancelled: "Paiement annulé",
  refunded: "Paiement remboursé",
  failed: "Paiement échoué",
};

export type BookableEdgeOffer = {
  slug: EdgeAccompagnementOfferSlug;
  title: string;
  priceLabel: string;
  priceCents: number;
  duration: string;
  description: string;
  stripePriceIdEnv?: string;
  bookable: boolean;
};

export const EDGE_ADMIN_EMAIL = "timmydarcy44@gmail.com";

export const EDGE_BOOKABLE_OFFERS: BookableEdgeOffer[] = [
  {
    slug: "coaching-progression",
    title: "Coaching Progression EDGE",
    priceLabel: "149 €",
    priceCents: 14900,
    duration: "60 min",
    description:
      "Un accompagnement individuel pour construire votre feuille de route de progression.",
    stripePriceIdEnv: "STRIPE_PRICE_ID_COACHING_PROGRESS",
    bookable: true,
  },
  {
    slug: "simulation-professionnelle",
    title: "Simulation Professionnelle EDGE",
    priceLabel: "179 €",
    priceCents: 17900,
    duration: "60 à 90 min",
    description: "Préparez-vous à une situation professionnelle réelle.",
    stripePriceIdEnv: "STRIPE_PRICE_ID_SIMULATION_PRO",
    bookable: true,
  },
  {
    slug: "programme-progression",
    title: "Programme Progression EDGE",
    priceLabel: "À partir de 390 €",
    priceCents: 39000,
    duration: "Sur mesure",
    description: "Un accompagnement dans la durée pour accélérer votre évolution.",
    bookable: false,
  },
];

export function getBookableOffer(slug: string | null | undefined): BookableEdgeOffer | null {
  if (!slug) return null;
  return EDGE_BOOKABLE_OFFERS.find((o) => o.slug === slug) ?? null;
}

export function getStripePriceIdForOffer(offer: BookableEdgeOffer): string | null {
  if (!offer.stripePriceIdEnv) return null;
  const value = process.env[offer.stripePriceIdEnv]?.trim();
  return value || null;
}

export function getReservationPageHref(slug: EdgeAccompagnementOfferSlug): string {
  return `/dashboard/accompagnement/reserver?offer=${slug}`;
}

export function getProgrammeRequestHref(): string {
  return "/dashboard/accompagnement/demande-programme";
}

export function getConfirmationPageHref(sessionId: string): string {
  return `/dashboard/accompagnement/confirmation?session_id=${encodeURIComponent(sessionId)}`;
}

/** URL Stripe Checkout — le placeholder ne doit pas être encodé. */
export function getStripeCheckoutSuccessUrl(): string {
  return `${publicAppUrl()}/dashboard/accompagnement/confirmation?session_id={CHECKOUT_SESSION_ID}`;
}

export type AccompagnementSlot = {
  id: string;
  startsAt: string;
  label: string;
};

const SLOT_HOURS = [9, 11, 14, 16, 18];

/** Créneaux disponibles sur les 14 prochains jours ouvrés (lun–ven). */
export function generateAccompagnementSlots(now = new Date()): AccompagnementSlot[] {
  const slots: AccompagnementSlot[] = [];
  const cursor = new Date(now);
  cursor.setHours(0, 0, 0, 0);

  let daysAdded = 0;
  while (daysAdded < 14) {
    cursor.setDate(cursor.getDate() + 1);
    const day = cursor.getDay();
    if (day === 0 || day === 6) continue;
    daysAdded++;

    for (const hour of SLOT_HOURS) {
      const start = new Date(cursor);
      start.setHours(hour, 0, 0, 0);
      if (start.getTime() <= now.getTime() + 2 * 60 * 60 * 1000) continue;

      const id = start.toISOString();
      const label = new Intl.DateTimeFormat("fr-FR", {
        weekday: "long",
        day: "numeric",
        month: "long",
        hour: "2-digit",
        minute: "2-digit",
        timeZone: "Europe/Paris",
      }).format(start);

      slots.push({ id, startsAt: id, label });
    }
  }

  return slots;
}

export function formatSlotLabel(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return new Intl.DateTimeFormat("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/Paris",
  }).format(d);
}

export function formatEurosFromCents(cents: number): string {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

export function accompagnementProfileAdminUrl(userId: string): string {
  return `${publicAppUrl()}/dashboard/apprenant?user=${userId}`;
}
