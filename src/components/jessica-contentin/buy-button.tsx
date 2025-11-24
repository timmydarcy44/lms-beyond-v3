"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { CreditCard, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

type BuyButtonProps = {
  catalogItemId: string;
  contentId: string;
  price: number;
  title: string;
  className?: string;
  style?: React.CSSProperties;
};

export function BuyButton({ 
  catalogItemId, 
  contentId, 
  price, 
  title,
  className = "",
  style = {},
}: BuyButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleBuy = async () => {
    setIsLoading(true);
    try {
      // Créer une session de paiement Stripe
      const response = await fetch("/api/stripe/create-checkout-session-jessica", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          catalogItemId,
          contentId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Erreur lors de la création de la session de paiement");
      }

      // Rediriger vers Stripe Checkout
      if (data.url) {
        // Si on a une URL directe, rediriger
        window.location.href = data.url;
      } else if (data.sessionId) {
        // Sinon, utiliser Stripe.js pour rediriger
        const { loadStripe } = await import("@stripe/stripe-js");
        
        const stripePublishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
        if (!stripePublishableKey) {
          throw new Error("Clé publique Stripe non configurée");
        }
        
        const stripe = await loadStripe(stripePublishableKey);
        
        if (stripe) {
          await stripe.redirectToCheckout({ sessionId: data.sessionId });
        } else {
          throw new Error("Stripe n'est pas disponible");
        }
      }
    } catch (error) {
      console.error("[BuyButton] Error:", error);
      alert("Une erreur est survenue lors du paiement. Veuillez réessayer.");
      setIsLoading(false);
    }
  };

  return (
    <Button
      onClick={handleBuy}
      disabled={isLoading}
      className={className}
      style={style}
    >
      {isLoading ? (
        <>
          <Loader2 className="h-5 w-5 animate-spin" />
          <span className="ml-2">Chargement...</span>
        </>
      ) : (
        <>
          <CreditCard className="h-5 w-5" />
          <span className="ml-2">Acheter pour {price}€</span>
        </>
      )}
    </Button>
  );
}

