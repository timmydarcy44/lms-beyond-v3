"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

type RituelSommeilCommanderButtonProps = {
  catalogItemId: string | null;
  contentId: string | null;
  price: number;
  quantity: number;
  stripeCheckoutUrl?: string | null;
  className?: string;
};

export function RituelSommeilCommanderButton({
  catalogItemId,
  contentId,
  price,
  quantity,
  stripeCheckoutUrl,
  className,
}: RituelSommeilCommanderButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleCommander = async () => {
    if (stripeCheckoutUrl) {
      window.location.href = stripeCheckoutUrl;
      return;
    }

    if (!catalogItemId && !contentId) {
      window.open(
        "https://perfactive.fr/psychopedagogue/rocquancourt/jessica-contentin",
        "_blank",
        "noopener,noreferrer",
      );
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch("/api/stripe/create-checkout-session-jessica", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          catalogItemId,
          contentId,
          quantity,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 401) {
          router.push(
            `/jessica-contentin/inscription?redirect=${encodeURIComponent(window.location.pathname)}`,
          );
          return;
        }
        throw new Error(data.error || "Erreur lors de la commande");
      }

      if (data.url) {
        window.location.href = data.url;
      } else if (data.sessionId) {
        const { loadStripe } = await import("@stripe/stripe-js");
        const stripePublishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
        if (!stripePublishableKey) throw new Error("Paiement indisponible");
        const stripe = await loadStripe(stripePublishableKey);
        if (stripe) await stripe.redirectToCheckout({ sessionId: data.sessionId });
      }
    } catch (error) {
      console.error("[RituelSommeilCommanderButton]", error);
      alert(error instanceof Error ? error.message : "Une erreur est survenue. Veuillez réessayer.");
    } finally {
      setIsLoading(false);
    }
  };

  const total = (price * quantity).toLocaleString("fr-FR", { minimumFractionDigits: 2 });

  return (
    <button
      type="button"
      onClick={handleCommander}
      disabled={isLoading}
      className={cn(
        "flex w-full items-center justify-center gap-2 rounded-full py-4 text-base font-semibold text-white transition hover:bg-[#B88A44] disabled:cursor-wait disabled:opacity-70",
        className,
      )}
      style={{ backgroundColor: "#C6A664" }}
    >
      {isLoading ? (
        <>
          <Loader2 className="h-5 w-5 animate-spin" />
          Redirection…
        </>
      ) : (
        <>Commander — {total} €</>
      )}
    </button>
  );
}
