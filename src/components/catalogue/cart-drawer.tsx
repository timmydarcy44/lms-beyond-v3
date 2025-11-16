"use client";

import { useCart } from "@/lib/stores/use-cart";
import { Button } from "@/components/ui/button";
import { X, ShoppingBag, Trash2, CreditCard } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export function CartDrawer() {
  const { items, isOpen, closeCart, removeItem, getTotal, clearCart } = useCart();
  const router = useRouter();

  // Fermer avec Escape
  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeCart();
    };

    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [isOpen, closeCart]);

  const handleCheckout = async () => {
    if (items.length === 0) return;

    try {
      // Créer une session Stripe Checkout directement
      const response = await fetch("/api/stripe/checkout-cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: items.map((item) => ({
            content_id: item.content_id,
            content_type: item.content_type,
            title: item.title,
            price: item.price,
          })),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Erreur lors de la création de la session de paiement");
      }

      // Rediriger vers Stripe Checkout
      if (data.sessionId && typeof window !== "undefined") {
        const { loadStripe } = await import("@stripe/stripe-js");
        const stripe = await loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || "");
        
        if (stripe) {
          closeCart();
          await stripe.redirectToCheckout({ sessionId: data.sessionId });
        } else {
          throw new Error("Stripe n'est pas disponible");
        }
      }
    } catch (error) {
      console.error("[CartDrawer] Error during checkout:", error);
      // En cas d'erreur, rediriger vers la page de checkout classique
      closeCart();
      router.push("/dashboard/catalogue/checkout");
    }
  };

  // Toujours rendre le drawer pour que l'animation fonctionne
  return (
    <>
      {/* Overlay avec animation douce */}
      <div
        className={`fixed inset-0 bg-black/50 z-[100] transition-opacity duration-500 ease-out ${
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={closeCart}
      />

      {/* Drawer avec animation slide-in depuis la droite */}
      <div 
        className={`fixed right-0 top-0 h-full w-full max-w-md bg-white shadow-2xl z-[101] flex flex-col transform transition-all duration-700 ease-out ${
          isOpen ? "translate-x-0 opacity-100" : "translate-x-full opacity-0 pointer-events-none"
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <ShoppingBag className="h-5 w-5 text-gray-900" />
            <h2 className="text-xl font-semibold text-gray-900">Mon panier</h2>
            {items.length > 0 && (
              <span className="px-2 py-0.5 text-xs font-medium bg-gray-100 text-gray-700 rounded-full">
                {items.length}
              </span>
            )}
          </div>
          <button
            onClick={closeCart}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="h-5 w-5 text-gray-600" />
          </button>
        </div>

        {/* Items List */}
        <div className="flex-1 overflow-y-auto p-6">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <ShoppingBag className="h-16 w-16 text-gray-300 mb-4" />
              <p className="text-lg font-medium text-gray-900 mb-2">Votre panier est vide</p>
              <p className="text-sm text-gray-600">
                Ajoutez des contenus depuis le catalogue
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {items.map((item) => (
                <div
                  key={`${item.content_id}-${item.content_type}`}
                  className="flex gap-4 p-4 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors"
                >
                  {/* Thumbnail */}
                  <div className="relative w-20 h-20 flex-shrink-0 rounded-lg overflow-hidden bg-gray-100">
                    {item.thumbnail_url ? (
                      <Image
                        src={item.thumbnail_url}
                        alt={item.title}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <span className="text-2xl font-semibold text-gray-400">
                          {item.title.charAt(0)}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-gray-500 uppercase mb-1">
                          {item.content_type}
                        </p>
                        <h3 className="text-sm font-semibold text-gray-900 line-clamp-2">
                          {item.title}
                        </h3>
                        <p className="text-sm font-bold text-gray-900 mt-1">
                          {item.price.toFixed(2)}€
                        </p>
                      </div>
                      <button
                        onClick={() => removeItem(item.content_id, item.content_type)}
                        className="p-1.5 hover:bg-red-50 rounded-lg transition-colors flex-shrink-0"
                        title="Retirer"
                      >
                        <Trash2 className="h-4 w-4 text-red-600" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="border-t border-gray-200 p-6 space-y-4 bg-gray-50">
            <div className="flex items-center justify-between">
              <span className="text-lg font-semibold text-gray-900">Total</span>
              <span className="text-2xl font-bold text-gray-900">
                {getTotal().toFixed(2)}€
              </span>
            </div>
            <div className="flex gap-3">
              <Button
                onClick={clearCart}
                variant="outline"
                className="flex-1"
              >
                Vider le panier
              </Button>
              <Button
                onClick={handleCheckout}
                className="flex-1 bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-600 hover:from-amber-600 hover:via-yellow-600 hover:to-amber-700 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
                style={{
                  background: "linear-gradient(135deg, #D4AF37 0%, #F4D03F 50%, #D4AF37 100%)",
                }}
              >
                <CreditCard className="h-4 w-4 mr-2" />
                Passer au paiement
              </Button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

