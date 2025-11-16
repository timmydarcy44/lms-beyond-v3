"use client";

import { Button } from "@/components/ui/button";
import { ShoppingBag, Check } from "lucide-react";
import { useCart } from "@/lib/stores/use-cart";
import { useState } from "react";
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
  variant = "outline",
  size = "default",
  className = "",
}: AddToCartButtonProps) {
  const { items, addItem, openCart } = useCart();
  const [isAdding, setIsAdding] = useState(false);
  const [justAdded, setJustAdded] = useState(false);

  const isInCart = items.some(
    (item) => item.content_id === contentId && item.content_type === contentType
  );

  const handleAddToCart = async () => {
    if (isInCart) {
      openCart();
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
      
      // Le drawer s'ouvre automatiquement via addItem, donc on n'a pas besoin d'appeler openCart
      // Mais on peut garder le timeout pour l'état visuel
      setTimeout(() => {
        setJustAdded(false);
      }, 2000);
    } catch (error) {
      console.error("[AddToCartButton] Error adding item:", error);
      setIsAdding(false);
    }
  };

  return (
    <Button
      onClick={handleAddToCart}
      disabled={isAdding}
      variant={isInCart ? "default" : variant}
      size={size}
      className={className}
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
  );
}

