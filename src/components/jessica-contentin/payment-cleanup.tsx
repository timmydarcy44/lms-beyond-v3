"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

/**
 * Composant qui nettoie les paramètres de paiement Stripe de l'URL
 * pour éviter d'afficher le message "Vous avez terminé" de Stripe
 */
export function PaymentCleanup() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    // Vérifier si l'URL contient des paramètres de paiement Stripe
    const payment = searchParams.get("payment");
    const sessionId = searchParams.get("session_id");
    const paymentIntent = searchParams.get("payment_intent");
    const paymentIntentClientSecret = searchParams.get("payment_intent_client_secret");

    // Si des paramètres de paiement sont présents, les nettoyer de l'URL
    if (payment || sessionId || paymentIntent || paymentIntentClientSecret) {
      // Créer une nouvelle URL sans les paramètres de paiement
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.delete("payment");
      newUrl.searchParams.delete("session_id");
      newUrl.searchParams.delete("payment_intent");
      newUrl.searchParams.delete("payment_intent_client_secret");
      newUrl.searchParams.delete("redirect_status");

      // Remplacer l'URL sans recharger la page
      router.replace(newUrl.pathname + (newUrl.search ? newUrl.search : ""), { scroll: false });
    }
  }, [router, searchParams]);

  return null; // Ce composant ne rend rien
}

