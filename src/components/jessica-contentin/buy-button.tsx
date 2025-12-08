"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { CreditCard, Loader2, Info, ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";

type BuyButtonProps = {
  catalogItemId: string;
  contentId: string;
  price: number;
  title: string;
  contentType?: "module" | "test" | "ressource" | "parcours";
  thumbnailUrl?: string | null;
  className?: string;
  style?: React.CSSProperties;
  hasAccess?: boolean; // Indique si l'utilisateur a déjà accès à cette ressource
};

export function BuyButton({ 
  catalogItemId, 
  contentId, 
  price, 
  title,
  contentType = "ressource",
  thumbnailUrl = null,
  className = "",
  style = {},
  hasAccess = false, // Par défaut, pas d'accès
}: BuyButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [showAlreadyOwnedDialog, setShowAlreadyOwnedDialog] = useState(false);
  const router = useRouter();

  const handleBuy = async () => {
    // Si l'utilisateur a déjà accès, afficher le pop-up d'information
    if (hasAccess) {
      setShowAlreadyOwnedDialog(true);
      return;
    }

    setIsLoading(true);
    try {
      // Appeler directement l'API Stripe checkout
      const response = await fetch("/api/stripe/create-checkout-session-jessica", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          catalogItemId,
          contentId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        // Si l'utilisateur n'est pas authentifié (401), rediriger vers inscription/connexion
        // avec redirection vers la page de paiement après connexion
        if (response.status === 401) {
          // Construire l'URL de la page de paiement selon le type de contenu
          let paymentUrl = "";
          if (contentType === "module" || contentType === "parcours") {
            paymentUrl = `/dashboard/catalogue/module/${catalogItemId}/payment`;
          } else if (contentType === "test") {
            paymentUrl = `/dashboard/catalogue/test/${catalogItemId}/payment`;
          } else {
            // Pour les ressources, utiliser l'API Stripe directement (pas de page de paiement dédiée)
            // On redirige vers la page de présentation et le BuyButton réessaiera après connexion
            paymentUrl = window.location.pathname;
          }
          
          router.push(`/jessica-contentin/inscription?redirect=${encodeURIComponent(paymentUrl)}`);
          setIsLoading(false);
          return;
        }

        // Si l'utilisateur a déjà accès
        if (data.alreadyOwned) {
          setShowAlreadyOwnedDialog(true);
          setIsLoading(false);
          return;
        }

        throw new Error(data.error || "Erreur lors de la création de la session de paiement");
      }

      // Rediriger vers Stripe Checkout
      if (data.url) {
        window.location.href = data.url;
      } else if (data.sessionId) {
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
      alert(error instanceof Error ? error.message : "Une erreur est survenue lors de la création de la session de paiement. Veuillez réessayer.");
      setIsLoading(false);
    }
  };

  const handleGoToAccount = () => {
    setShowAlreadyOwnedDialog(false);
    router.push('/jessica-contentin/mon-compte');
  };

  return (
    <>
      <Button
        onClick={handleBuy}
        disabled={isLoading}
        className={className}
        style={style}
      >
        {isLoading ? (
          <>
            <Loader2 className="h-5 w-5 animate-spin" />
            <span className="ml-2">Ajout...</span>
          </>
        ) : (
          <>
            <CreditCard className="h-5 w-5" />
            <span className="ml-2">Acheter pour {price}€</span>
          </>
        )}
      </Button>

      {/* Dialog "Vous avez déjà cette ressource" */}
      <Dialog open={showAlreadyOwnedDialog} onOpenChange={setShowAlreadyOwnedDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Info className="h-5 w-5 text-blue-600" />
              Ressource déjà acquise
            </DialogTitle>
            <DialogDescription>
              Vous avez déjà cette ressource. Rendez-vous dans votre espace pour y accéder.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              onClick={handleGoToAccount}
              className="w-full sm:w-auto"
              style={{
                backgroundColor: "#C6A664",
                color: '#FFFFFF',
              }}
            >
              Accéder à mon espace
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

