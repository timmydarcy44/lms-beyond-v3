"use client";

import { useCart } from "@/lib/stores/use-cart";
import { ShoppingBag } from "lucide-react";
import { useRouter, usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

// Couleurs de branding Jessica Contentin
const primaryColor = "#8B6F47";
const accentColor = "#D4AF37";
const bgColor = "#F8F5F0";

export function FloatingCartBadge() {
  const { getItemCount, items } = useCart();
  const router = useRouter();
  const pathname = usePathname();
  
  const itemCount = getItemCount();
  const isJessicaContentin = pathname?.startsWith('/jessica-contentin') || false;
  
  // Ne pas afficher sur la page panier elle-même
  const isOnCartPage = pathname === '/jessica-contentin/panier';
  
  // Ne pas afficher si le panier est vide
  if (itemCount === 0 || isOnCartPage) {
    return null;
  }

  const handleClick = () => {
    if (isJessicaContentin) {
      router.push('/jessica-contentin/panier');
    } else {
      // Pour les autres sites, ouvrir le drawer
      // (on pourrait aussi créer une page panier pour eux)
      router.push('/dashboard/catalogue/checkout');
    }
  };

  return (
    <AnimatePresence>
      <motion.button
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0, opacity: 0 }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        onClick={handleClick}
        className="fixed bottom-6 right-6 z-50 flex items-center justify-center w-16 h-16 rounded-full shadow-2xl transition-all duration-300 hover:shadow-3xl"
        style={{
          backgroundColor: primaryColor,
          color: 'white',
        }}
        aria-label={`Panier (${itemCount} ${itemCount === 1 ? 'article' : 'articles'})`}
      >
        <ShoppingBag className="h-6 w-6" />
        {itemCount > 0 && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-1 -right-1 flex items-center justify-center min-w-[24px] h-6 px-1.5 text-xs font-bold rounded-full"
            style={{
              backgroundColor: accentColor,
              color: 'white',
            }}
          >
            {itemCount > 99 ? "99+" : itemCount}
          </motion.span>
        )}
      </motion.button>
    </AnimatePresence>
  );
}

