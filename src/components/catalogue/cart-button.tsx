"use client";

import { useCart } from "@/lib/stores/use-cart";
import { Button } from "@/components/ui/button";
import { ShoppingBag } from "lucide-react";
import { useEffect } from "react";

export function CartButton() {
  const { getItemCount, openCart, syncWithServer } = useCart();
  const itemCount = getItemCount();

  // Synchroniser avec le serveur au montage
  useEffect(() => {
    syncWithServer();
  }, [syncWithServer]);

  return (
    <button
      onClick={openCart}
      className="relative p-2 hover:bg-gray-100 rounded-lg transition-colors"
      aria-label="Ouvrir le panier"
    >
      <ShoppingBag className="h-6 w-6 text-gray-700" />
      {itemCount > 0 && (
        <span className="absolute -top-1 -right-1 flex items-center justify-center min-w-[20px] h-5 px-1.5 text-xs font-bold text-white bg-red-500 rounded-full">
          {itemCount > 99 ? "99+" : itemCount}
        </span>
      )}
    </button>
  );
}








