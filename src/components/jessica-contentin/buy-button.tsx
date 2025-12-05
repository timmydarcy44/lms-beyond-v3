"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { CreditCard, Loader2, ShoppingCart, ArrowRight, Check } from "lucide-react";
import { useRouter } from "next/navigation";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useCart } from "@/lib/stores/use-cart";
import type { CartItem } from "@/lib/stores/use-cart";

type BuyButtonProps = {
  catalogItemId: string;
  contentId: string;
  price: number;
  title: string;
  contentType?: "module" | "test" | "ressource" | "parcours";
  thumbnailUrl?: string | null;
  className?: string;
  style?: React.CSSProperties;
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
}: BuyButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const router = useRouter();
  const { addItem } = useCart();

  const handleBuy = async () => {
    setIsLoading(true);
    try {
      // Ajouter l'item au panier
      const item: CartItem = {
        id: `${contentId}-${contentType}`,
        content_id: catalogItemId, // Utiliser catalogItemId comme content_id pour le panier
        content_type: contentType,
        title,
        price,
        thumbnail_url: thumbnailUrl,
      };

      await addItem(item);
      setIsLoading(false);
      setShowDialog(true);
    } catch (error) {
      console.error("[BuyButton] Error:", error);
      alert("Une erreur est survenue lors de l'ajout au panier. Veuillez réessayer.");
      setIsLoading(false);
    }
  };

  const handleGoToCart = () => {
    setShowDialog(false);
    router.push('/jessica-contentin/panier');
  };

  const handleContinueShopping = () => {
    setShowDialog(false);
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

      {/* Dialog de confirmation */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Check className="h-5 w-5 text-green-600" />
              Article ajouté au panier
            </DialogTitle>
            <DialogDescription>
              {title} a été ajouté à votre panier avec succès.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={handleContinueShopping}
              className="w-full sm:w-auto"
            >
              Continuer mes achats
            </Button>
            <Button
              onClick={handleGoToCart}
              className="w-full sm:w-auto"
              style={{
                backgroundColor: "#C6A664",
                color: '#FFFFFF',
              }}
            >
              <ShoppingCart className="h-4 w-4 mr-2" />
              Passer au paiement
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

