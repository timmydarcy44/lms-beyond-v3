import { isSuperAdmin } from "@/lib/auth/super-admin";

// Lazy import de Stripe pour éviter les erreurs si le package n'est pas installé
let Stripe: any = null;
let stripeInstance: any = null;

/**
 * Obtient une instance Stripe (uniquement pour les super admins)
 */
export async function getStripeClient() {
  // Vérifier si l'utilisateur est super admin
  const isSuper = await isSuperAdmin();
  if (!isSuper) {
    console.warn("[stripe/client] Stripe n'est disponible que pour les super admins");
    return null;
  }

  if (!process.env.STRIPE_SECRET_KEY) {
    console.warn("[stripe/client] STRIPE_SECRET_KEY non configuré");
    return null;
  }

  // Lazy import de Stripe
  if (!Stripe) {
    try {
      Stripe = (await import("stripe")).default;
    } catch (error) {
      console.error("[stripe/client] Package stripe non installé:", error);
      return null;
    }
  }

  // Créer l'instance Stripe si elle n'existe pas
  if (!stripeInstance) {
    stripeInstance = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: "2024-11-20.acacia",
    });
  }

  return stripeInstance;
}
