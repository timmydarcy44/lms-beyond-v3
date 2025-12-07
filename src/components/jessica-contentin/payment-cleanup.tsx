"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * Composant qui nettoie les paramètres de paiement Stripe de l'URL
 * pour éviter d'afficher le message "Vous avez terminé" de Stripe
 */
export function PaymentCleanup() {
  const router = useRouter();

  useEffect(() => {
    // Vérifier si l'URL contient des paramètres de paiement Stripe
    // Utiliser window.location directement pour éviter les problèmes avec useSearchParams
    if (typeof window === "undefined") return;

    const urlParams = new URLSearchParams(window.location.search);
    const payment = urlParams.get("payment");
    const sessionId = urlParams.get("session_id");
    const paymentIntent = urlParams.get("payment_intent");
    const paymentIntentClientSecret = urlParams.get("payment_intent_client_secret");
    const redirectStatus = urlParams.get("redirect_status");

    // Si des paramètres de paiement sont présents, les nettoyer de l'URL
    if (payment || sessionId || paymentIntent || paymentIntentClientSecret || redirectStatus) {
      // Créer une nouvelle URL sans les paramètres de paiement
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.delete("payment");
      newUrl.searchParams.delete("session_id");
      newUrl.searchParams.delete("payment_intent");
      newUrl.searchParams.delete("payment_intent_client_secret");
      newUrl.searchParams.delete("redirect_status");

      // Remplacer l'URL sans recharger la page
      const newPath = newUrl.pathname + (newUrl.search ? newUrl.search : "");
      if (window.location.pathname + window.location.search !== newPath) {
        router.replace(newPath, { scroll: false });
      }
    }
  }, [router]);

  return null; // Ce composant ne rend rien
}

