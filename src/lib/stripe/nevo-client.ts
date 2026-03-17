import Stripe from "stripe";

let stripeInstance: Stripe | null = null;

export function getNevoStripeClient() {
  const secretKey = process.env.NEVO_STRIPE_SECRET_KEY;
  if (process.env.NODE_ENV !== "production") {
    console.log("[nevo/stripe] NEVO_STRIPE_SECRET_KEY set:", !!secretKey);
  }
  if (!secretKey) {
    if (process.env.NODE_ENV !== "production") {
      console.warn("[nevo/stripe] NEVO_STRIPE_SECRET_KEY manquant");
    }
    return null;
  }

  if (!stripeInstance) {
    stripeInstance = new Stripe(secretKey, {
      apiVersion: "2025-10-29.clover",
    });
  }

  return stripeInstance;
}
