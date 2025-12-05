"use client";

import { useState, useEffect } from "react";
import { useCart } from "@/lib/stores/use-cart";
import { ShoppingBag } from "lucide-react";
import { useRouter, usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

// Couleurs de branding Jessica Contentin
const primaryColor = "#8B6F47";
const accentColor = "#D4AF37";
const bgColor = "#F8F5F0";

export function FloatingCartBadge() {
  const [mounted, setMounted] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const { getItemCount, items, syncWithServer, clearCart } = useCart();
  const router = useRouter();
  const pathname = usePathname();

  // Éviter l'erreur d'hydratation en ne rendant que côté client
  useEffect(() => {
    setMounted(true);
    
    // Vérifier l'authentification
    const supabase = createSupabaseBrowserClient();
    if (!supabase) {
      setIsAuthenticated(false);
      return;
    }

    // Vérifier l'état initial
    supabase.auth.getUser().then(({ data: { user } }) => {
      setIsAuthenticated(!!user);
      if (user) {
        // Synchroniser le panier avec le serveur lors de la connexion
        syncWithServer();
      } else {
        // Vider le panier si l'utilisateur n'est pas connecté
        clearCart();
      }
    });

    // Écouter les changements d'authentification
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const wasAuthenticated = isAuthenticated;
      const isNowAuthenticated = !!session?.user;
      
      setIsAuthenticated(isNowAuthenticated);
      
      if (isNowAuthenticated && !wasAuthenticated) {
        // Utilisateur vient de se connecter : synchroniser avec le serveur
        syncWithServer();
      } else if (!isNowAuthenticated && wasAuthenticated) {
        // Utilisateur vient de se déconnecter : vider le panier
        clearCart();
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [syncWithServer, clearCart, isAuthenticated]);
  
  const itemCount = getItemCount();
  const isJessicaContentin = pathname?.startsWith('/jessica-contentin') || false;
  
  // Ne pas afficher sur la page panier elle-même
  const isOnCartPage = pathname === '/jessica-contentin/panier';
  
  // Ne pas afficher si :
  // - pas encore monté (pour éviter l'erreur d'hydratation)
  // - utilisateur non authentifié
  // - panier vide
  // - sur la page panier elle-même
  if (!mounted || isAuthenticated === false || itemCount === 0 || isOnCartPage) {
    return null;
  }
  
  // Ne pas afficher pendant la vérification de l'authentification
  if (isAuthenticated === null) {
    return null;
  }

  const handleClick = () => {
    // Détecter si on est sur le domaine de Jessica Contentin
    const isJessicaDomain = 
      typeof window !== 'undefined' && 
      (window.location.hostname === 'jessicacontentin.fr' || 
       window.location.hostname === 'www.jessicacontentin.fr' ||
       window.location.hostname === 'localhost' ||
       window.location.hostname === '127.0.0.1' ||
       pathname?.startsWith('/jessica-contentin') ||
       pathname?.startsWith('/ressources'));
    
    if (isJessicaDomain) {
      router.push('/jessica-contentin/panier');
    } else {
      // Pour les autres sites, ouvrir le drawer
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

