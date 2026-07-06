/**
 * ═══════════════════════════════════════════════════════════════════════════
 * TODO STRIPE — REMPLACER LES CLÉS LORS DE LA RÉCUPÉRATION DU COMPTE
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Variables à renseigner sur Vercel (Production + Preview) :
 *
 *   STRIPE_SECRET_KEY=sk_live_…                    ← clé secrète (serveur uniquement)
 *   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_…   ← clé publique (client si besoin)
 *   STRIPE_WEBHOOK_SECRET=whsec_…                  ← webhook principal
 *   STRIPE_EDGE_ACCOMPAGNEMENT_WEBHOOK_SECRET=…    ← optionnel, dédié accompagnement
 *
 * Optionnel (sinon price_data automatique) :
 *   STRIPE_PRICE_ID_COACHING_PROGRESS=price_…
 *   STRIPE_PRICE_ID_SIMULATION_PRO=price_…
 *
 * Webhook Stripe Dashboard → URL :
 *   https://edgebs.fr/api/stripe/edge-accompagnement/webhook
 *   Événements : checkout.session.completed, checkout.session.expired
 *
 * Test après configuration :
 *   Carte 4242 4242 4242 4242 — parcours complet réservation → confirmation → email
 * ═══════════════════════════════════════════════════════════════════════════
 */

import Stripe from "stripe";

export const EDGE_ACCOMPAGNEMENT_STRIPE_TENANT = "edge_accompagnement";

export const EDGE_ACCOMPAGNEMENT_HOLD_MINUTES = 30;

export function isEdgeAccompagnementStripeConfigured(): boolean {
  return Boolean(process.env.STRIPE_SECRET_KEY?.trim());
}

export function getEdgeAccompagnementStripeWebhookSecret(): string {
  return (
    process.env.STRIPE_EDGE_ACCOMPAGNEMENT_WEBHOOK_SECRET?.trim() ||
    process.env.STRIPE_WEBHOOK_SECRET?.trim() ||
    ""
  );
}

export function getEdgeAccompagnementStripeClient(): Stripe | null {
  const secretKey = process.env.STRIPE_SECRET_KEY?.trim();
  if (!secretKey) {
    if (process.env.NODE_ENV !== "production") {
      console.warn(
        "[edge-accompagnement/stripe] TODO: STRIPE_SECRET_KEY manquante — renseigner sur Vercel",
      );
    }
    return null;
  }
  return new Stripe(secretKey, { apiVersion: "2025-10-29.clover" });
}

export function edgeAccompagnementStripeNotConfiguredError(): string {
  return "Paiement temporairement indisponible. Configuration Stripe en cours — réessayez sous peu.";
}
