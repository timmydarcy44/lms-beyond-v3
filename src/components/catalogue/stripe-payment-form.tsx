"use client";

import { Button } from "@/components/ui/button";
import { CreditCard, Lock } from "lucide-react";
import { useState } from "react";
import { loadStripe } from "@stripe/stripe-js";

type StripePaymentFormProps = {
  itemId: string;
  itemType: "ressource" | "test" | "module" | "parcours";
  itemTitle: string;
  price: number;
  primaryColor: string;
};

export function StripePaymentForm({
  itemId,
  itemType,
  itemTitle,
  price,
  primaryColor,
}: StripePaymentFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handlePayment = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Créer une session de paiement Stripe
      const response = await fetch("/api/stripe/create-checkout-session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          itemId,
          itemType,
          itemTitle,
          price,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Erreur lors de la création de la session de paiement");
      }

      // Rediriger vers Stripe Checkout
      if (data.sessionId && typeof window !== "undefined") {
        const stripe = await loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || "");
        if (stripe) {
          await stripe.redirectToCheckout({ sessionId: data.sessionId });
        } else {
          throw new Error("Stripe n'est pas disponible");
        }
      }
    } catch (err) {
      console.error("[StripePaymentForm] Error:", err);
      setError(err instanceof Error ? err.message : "Une erreur est survenue");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-gray-50 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <span className="text-lg font-semibold">{itemTitle}</span>
          <span className="text-2xl font-bold" style={{ color: primaryColor }}>
            {price}€
          </span>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Lock className="h-4 w-4" />
          <span>Paiement sécurisé par Stripe</span>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800 text-sm">{error}</p>
        </div>
      )}

      <Button
        onClick={handlePayment}
        disabled={isLoading}
        size="lg"
        className="w-full py-6 text-lg font-semibold rounded-full shadow-lg hover:shadow-xl transition-all"
        style={{
          backgroundColor: primaryColor,
          color: '#FFFFFF',
        }}
      >
        <CreditCard className="h-5 w-5 mr-2" />
        {isLoading ? "Traitement..." : `Payer ${price}€`}
      </Button>

      <p className="text-xs text-center text-gray-500">
        En cliquant sur "Payer", vous serez redirigé vers la page de paiement sécurisée de Stripe.
      </p>
    </div>
  );
}



