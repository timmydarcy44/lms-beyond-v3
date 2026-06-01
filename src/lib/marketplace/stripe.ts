import Stripe from "stripe";
import { publicAppUrl } from "@/lib/env";

let stripeSingleton: Stripe | null = null;

export function getMarketplaceStripe(): Stripe | null {
  const key = process.env.STRIPE_SECRET_KEY?.trim();
  if (!key) {
    if (process.env.NEVO_STRIPE_SECRET_KEY?.trim()) {
      console.error(
        "[marketplace/stripe] STRIPE_SECRET_KEY absente mais NEVO_STRIPE_SECRET_KEY est définie — utiliser STRIPE_SECRET_KEY (compte Beyond/marketplace), pas Nevo.",
      );
    }
    return null;
  }
  if (key.startsWith("rk_")) {
    console.error(
      "[marketplace/stripe] STRIPE_SECRET_KEY semble être une clé restreinte (rk_). Utilisez une clé secrète standard (sk_live_ ou sk_test_).",
    );
    return null;
  }
  if (!stripeSingleton) {
    stripeSingleton = new Stripe(key, { apiVersion: "2025-10-29.clover" });
  }
  return stripeSingleton;
}

export function marketplaceAppOrigin(): string {
  return publicAppUrl();
}

export function praticienStripeRefreshUrl(): string {
  return `${marketplaceAppOrigin()}/dashboard/praticien/stripe-refresh`;
}

export function praticienStripeSuccessUrl(): string {
  return `${marketplaceAppOrigin()}/dashboard/praticien/stripe-success`;
}

export function marketplaceWebhookSecret(): string | null {
  return (
    process.env.STRIPE_MARKETPLACE_WEBHOOK_SECRET?.trim() ||
    process.env.STRIPE_WEBHOOK_SECRET?.trim() ||
    null
  );
}
