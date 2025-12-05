"use client";

import { Button } from "@/components/ui/button";
import { ShoppingBag, Check, ShoppingCart, ArrowRight } from "lucide-react";
import { useCart } from "@/lib/stores/use-cart";
import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import type { CartItem } from "@/lib/stores/use-cart";

type AddToCartButtonProps = {
  contentId: string;
  contentType: "module" | "test" | "ressource" | "parcours";
  title: string;
  price: number;
  thumbnailUrl?: string | null;
  variant?: "default" | "outline" | "ghost";
  size?: "default" | "sm" | "lg" | "icon";
  className?: string;
};

export function AddToCartButton({
  contentId,
  contentType,
  title,
  price,
  thumbnailUrl,
  variant = "default",
  size = "default",
  className = "",
}: AddToCartButtonProps) {
  const { items, addItem, openCart, syncWithServer } = useCart();
  const router = useRouter();
  const pathname = usePathname();
  const [isAdding, setIsAdding] = useState(false);
  const [justAdded, setJustAdded] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  // S'assurer que le composant est monté avant de vérifier le panier
  useEffect(() => {
    setIsMounted(true);
    // Synchroniser avec le serveur au montage pour avoir les bonnes données
    syncWithServer();
  }, [syncWithServer]);

  const isInCart = isMounted && items.some(
    (item) => item.content_id === contentId && item.content_type === contentType
  );

  // Déterminer si on est sur le site Jessica Contentin
  const isJessicaContentin = pathname?.startsWith('/jessica-contentin') || false;

  const handleAddToCart = async () => {
    if (isInCart) {
      if (isJessicaContentin) {
        router.push('/jessica-contentin/panier');
      } else {
        openCart();
      }
      return;
    }

    setIsAdding(true);

    const item: CartItem = {
      id: `${contentId}-${contentType}`,
      content_id: contentId,
      content_type: contentType,
      title,
      price,
      thumbnail_url: thumbnailUrl,
    };

    try {
      await addItem(item);
      setIsAdding(false);
      setJustAdded(true);
      setShowDialog(true);
    } catch (error) {
      console.error("[AddToCartButton] Error adding item:", error);
      setIsAdding(false);
    }
  };

  const handleViewCart = () => {
    setShowDialog(false);
    if (isJessicaContentin) {
      router.push('/jessica-contentin/panier');
    } else {
      openCart();
    }
  };

  const handleContinueShopping = () => {
    setShowDialog(false);
    setJustAdded(false);
  };

  // Déterminer le style du bouton selon le contexte
  // Pour "Ajouter à ma liste", utiliser un style plus visible avec fond coloré
  const buttonVariant = isInCart ? "default" : variant;
  const buttonStyle = isInCart ? {} : {
    backgroundColor: isJessicaContentin ? "#C6A664" : "#8B6F47",
    color: "#FFFFFF",
    borderColor: isJessicaContentin ? "#C6A664" : "#8B6F47",
    fontWeight: "600",
    boxShadow: "0 4px 14px 0 rgba(139, 111, 71, 0.3)",
  };

  return (
    <>
      <Button
        onClick={handleAddToCart}
        disabled={isAdding}
        variant={buttonVariant}
        size={size}
        className={`${className} ${!isInCart && !justAdded ? 'hover:opacity-90 hover:scale-105 transition-all' : ''}`}
        style={buttonStyle}
      >
        {isAdding ? (
          <>
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
            Ajout...
          </>
        ) : justAdded || isInCart ? (
          <>
            <Check className="h-4 w-4 mr-2" />
            {isInCart ? "Dans le panier" : "Ajouté !"}
          </>
        ) : (
          <>
            <ShoppingBag className="h-4 w-4 mr-2" />
            Ajouter à ma liste
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
              onClick={handleViewCart}
              className="w-full sm:w-auto"
            >
              <ShoppingCart className="h-4 w-4 mr-2" />
              Voir le panier
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

