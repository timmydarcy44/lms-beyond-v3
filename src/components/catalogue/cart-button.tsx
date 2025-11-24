"use client";

import { useCart } from "@/lib/stores/use-cart";
import { Button } from "@/components/ui/button";
import { ShoppingBag } from "lucide-react";
import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";

export function CartButton() {
  const { getItemCount, openCart, syncWithServer } = useCart();
  const router = useRouter();
  const pathname = usePathname();
  const itemCount = getItemCount();

  // Déterminer si on est sur le site Jessica Contentin
  const isJessicaContentin = pathname?.startsWith('/jessica-contentin') || false;

  // Synchroniser avec le serveur au montage
  useEffect(() => {
    syncWithServer();
  }, [syncWithServer]);

  const handleClick = () => {
    if (isJessicaContentin) {
      router.push('/jessica-contentin/panier');
    } else {
      openCart();
    }
  };

  return (
    <button
      onClick={handleClick}
      className="relative p-2 hover:bg-gray-100 rounded-lg transition-colors"
      aria-label={isJessicaContentin ? "Voir le panier" : "Ouvrir le panier"}
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









