import Stripe from "stripe";
import { appOrigin } from "@/lib/onboarding/slug";

let stripeSingleton: Stripe | null = null;

export function getMarketplaceStripe(): Stripe | null {
  const key = process.env.STRIPE_SECRET_KEY?.trim();
  if (!key) return null;
  if (!stripeSingleton) {
    stripeSingleton = new Stripe(key, { apiVersion: "2025-10-29.clover" });
  }
  return stripeSingleton;
}

export function marketplaceAppOrigin(): string {
  return (
    process.env.NEXT_PUBLIC_BASE_URL?.trim() ||
    process.env.NEXT_PUBLIC_APP_URL?.trim() ||
    appOrigin()
  ).replace(/\/$/, "");
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
