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

  const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
  
  // Log de configuration (côté serveur uniquement)
  if (typeof window === 'undefined') {
    console.log("[stripe/client] Module loaded - STRIPE_SECRET_KEY exists:", !!stripeSecretKey);
    if (stripeSecretKey) {
      console.log("[stripe/client] Module loaded - STRIPE_SECRET_KEY length:", stripeSecretKey.length);
      console.log("[stripe/client] Module loaded - STRIPE_SECRET_KEY starts with:", stripeSecretKey.substring(0, 7));
      console.log("[stripe/client] Module loaded - STRIPE_SECRET_KEY type:", 
        stripeSecretKey.startsWith('sk_live_') ? 'Live Secret Key' :
        stripeSecretKey.startsWith('sk_test_') ? 'Test Secret Key' :
        stripeSecretKey.startsWith('rk_live_') ? 'Live Restricted Key' :
        stripeSecretKey.startsWith('rk_test_') ? 'Test Restricted Key' : 'Unknown'
      );
    } else {
      console.warn("[stripe/client] STRIPE_SECRET_KEY non configuré");
      console.warn("[stripe/client] Variables disponibles:", {
        STRIPE_SECRET_KEY: !!process.env.STRIPE_SECRET_KEY,
        allStripeKeys: Object.keys(process.env).filter(key => key.includes('STRIPE')),
      });
    }
  }
  
  if (!stripeSecretKey) {
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
    stripeInstance = new Stripe(stripeSecretKey, {
      apiVersion: "2024-11-20.acacia",
    });
  }

  return stripeInstance;
}
