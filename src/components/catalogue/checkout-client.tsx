"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { CreditCard, ArrowLeft, Trash2 } from "lucide-react";
import Image from "next/image";
import { useCart } from "@/lib/stores/use-cart";
import { CatalogTopNavClient } from "@/components/catalogue/catalog-top-nav-client";

type CartItem = {
  id: string;
  content_id: string;
  content_type: string;
  title: string;
  price: number;
  thumbnail_url?: string | null;
};

type CheckoutClientProps = {
  initialCartItems: CartItem[];
};

export function CheckoutClient({ initialCartItems }: CheckoutClientProps) {
  const router = useRouter();
  const { items, removeItem, getTotal, clearCart, syncWithServer } = useCart();
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Synchroniser le panier local avec le serveur
  useEffect(() => {
    syncWithServer();
  }, [syncWithServer]);

  const cartItems = items.length > 0 ? items : initialCartItems;
  const total = cartItems.reduce((sum, item) => sum + item.price, 0);

  const handleCheckout = async () => {
    if (cartItems.length === 0) {
      setError("Votre panier est vide");
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      // Créer une session de paiement Stripe
      const response = await fetch("/api/stripe/checkout-cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: cartItems.map((item) => ({
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
          await stripe.redirectToCheckout({ sessionId: data.sessionId });
        } else {
          throw new Error("Stripe n'est pas disponible");
        }
      }
    } catch (err) {
      console.error("[checkout] Error:", err);
      setError(err instanceof Error ? err.message : "Une erreur est survenue");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <CatalogTopNavClient />
      
      <main className="max-w-4xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.push("/dashboard/catalogue")}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="text-sm">Retour au catalogue</span>
          </button>
          <h1 className="text-3xl font-bold text-gray-900">Finaliser votre commande</h1>
        </div>

        <div className="grid gap-8 lg:grid-cols-3">
          {/* Panier */}
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Votre panier ({cartItems.length} {cartItems.length > 1 ? "articles" : "article"})
              </h2>

              <div className="space-y-4">
                {cartItems.map((item) => (
                  <div
                    key={`${item.content_id}-${item.content_type}`}
                    className="flex gap-4 p-4 border border-gray-200 rounded-lg"
                  >
                    {/* Thumbnail */}
                    <div className="relative w-24 h-24 flex-shrink-0 rounded-lg overflow-hidden bg-gray-100">
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
                          <h3 className="text-base font-semibold text-gray-900 mb-2">
                            {item.title}
                          </h3>
                          <p className="text-lg font-bold text-gray-900">
                            {item.price.toFixed(2)}€
                          </p>
                        </div>
                        <button
                          onClick={() => removeItem(item.content_id, item.content_type)}
                          className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                          title="Retirer"
                        >
                          <Trash2 className="h-4 w-4 text-red-600" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Résumé */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 sticky top-4">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Résumé</h2>

              <div className="space-y-3 mb-6">
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Sous-total ({cartItems.length} {cartItems.length > 1 ? "articles" : "article"})</span>
                  <span>{total.toFixed(2)}€</span>
                </div>
                <div className="border-t border-gray-200 pt-3">
                  <div className="flex justify-between text-lg font-bold text-gray-900">
                    <span>Total</span>
                    <span>{total.toFixed(2)}€</span>
                  </div>
                </div>
              </div>

              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-800">{error}</p>
                </div>
              )}

              <Button
                onClick={handleCheckout}
                disabled={isProcessing || cartItems.length === 0}
                className="w-full bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-700 hover:to-violet-700"
                size="lg"
              >
                {isProcessing ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                    Traitement...
                  </>
                ) : (
                  <>
                    <CreditCard className="h-4 w-4 mr-2" />
                    Payer {total.toFixed(2)}€
                  </>
                )}
              </Button>

              <p className="text-xs text-gray-500 text-center mt-4">
                Paiement sécurisé par Stripe
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}








