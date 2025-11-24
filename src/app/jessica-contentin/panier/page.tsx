"use client";

import { useCart } from "@/lib/stores/use-cart";
import { Button } from "@/components/ui/button";
import { ShoppingBag, Trash2, CreditCard, ArrowLeft } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import Link from "next/link";

// Couleurs de branding Jessica Contentin
const primaryColor = "#8B6F47";
const accentColor = "#D4AF37";
const secondaryColor = "#E6D9C6";
const bgColor = "#F8F5F0";
const surfaceColor = "#FFFFFF";
const textColor = "#2F2A25";

export default function JessicaContentinCartPage({
  params,
}: {
  params?: Promise<Record<string, string>>;
}) {
  const { items, removeItem, getTotal, clearCart } = useCart();
  const router = useRouter();

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
        const { env } = await import("@/lib/env");
        
        if (!env.stripePublishableKey) {
          throw new Error("Clé publique Stripe non configurée");
        }
        
        const stripe = await loadStripe(env.stripePublishableKey);
        
        if (stripe) {
          await stripe.redirectToCheckout({ sessionId: data.sessionId });
        } else {
          throw new Error("Stripe n'est pas disponible");
        }
      }
    } catch (error) {
      console.error("[CartPage] Error during checkout:", error);
      alert("Une erreur est survenue lors du paiement. Veuillez réessayer.");
    }
  };

  return (
    <div style={{ backgroundColor: bgColor }}>
      <div className="max-w-4xl mx-auto px-4 py-8 md:py-12">
        {/* Header */}
        <div className="mb-8">
          <Link 
            href="/jessica-contentin/ressources"
            className="inline-flex items-center gap-2 text-sm mb-4 hover:underline"
            style={{ color: primaryColor }}
          >
            <ArrowLeft className="h-4 w-4" />
            Retour aux ressources
          </Link>
          <div className="flex items-center gap-3">
            <ShoppingBag className="h-8 w-8" style={{ color: primaryColor }} />
            <h1 
              className="text-3xl md:text-4xl font-bold"
              style={{ color: textColor }}
            >
              Mon panier
            </h1>
            {items.length > 0 && (
              <span 
                className="px-3 py-1 text-sm font-medium rounded-full"
                style={{ 
                  backgroundColor: `${primaryColor}15`,
                  color: primaryColor 
                }}
              >
                {items.length} {items.length === 1 ? 'article' : 'articles'}
              </span>
            )}
          </div>
        </div>

        {/* Cart Content */}
        {items.length === 0 ? (
          <div 
            className="rounded-2xl p-12 text-center"
            style={{ 
              backgroundColor: surfaceColor,
              border: `1px solid ${secondaryColor}`
            }}
          >
            <ShoppingBag className="h-16 w-16 mx-auto mb-4" style={{ color: secondaryColor, opacity: 0.5 }} />
            <h2 
              className="text-xl font-semibold mb-2"
              style={{ color: textColor }}
            >
              Votre panier est vide
            </h2>
            <p 
              className="text-sm mb-6"
              style={{ color: textColor, opacity: 0.7 }}
            >
              Ajoutez des contenus depuis le catalogue
            </p>
            <Button
              asChild
              style={{
                backgroundColor: primaryColor,
                color: 'white'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = accentColor;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = primaryColor;
              }}
            >
              <Link href="/jessica-contentin/ressources">
                Parcourir les ressources
              </Link>
            </Button>
          </div>
        ) : (
          <div className="grid md:grid-cols-3 gap-6">
            {/* Items List */}
            <div className="md:col-span-2 space-y-4">
              {items.map((item) => (
                <div
                  key={`${item.content_id}-${item.content_type}`}
                  className="rounded-xl p-4 flex gap-4"
                  style={{ 
                    backgroundColor: surfaceColor,
                    border: `1px solid ${secondaryColor}`
                  }}
                >
                  {/* Thumbnail */}
                  <div className="relative w-24 h-24 flex-shrink-0 rounded-lg overflow-hidden" style={{ backgroundColor: bgColor }}>
                    {item.thumbnail_url ? (
                      <Image
                        src={item.thumbnail_url}
                        alt={item.title}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <span className="text-2xl font-semibold" style={{ color: secondaryColor }}>
                          {item.title.charAt(0)}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p 
                          className="text-xs font-medium uppercase mb-1"
                          style={{ color: primaryColor, opacity: 0.7 }}
                        >
                          {item.content_type}
                        </p>
                        <h3 
                          className="text-base font-semibold mb-2 line-clamp-2"
                          style={{ color: textColor }}
                        >
                          {item.title}
                        </h3>
                        <p 
                          className="text-lg font-bold"
                          style={{ color: primaryColor }}
                        >
                          {item.price.toFixed(2)}€
                        </p>
                      </div>
                      <button
                        onClick={() => removeItem(item.content_id, item.content_type)}
                        className="p-2 rounded-lg transition-colors flex-shrink-0"
                        style={{ 
                          backgroundColor: `${primaryColor}10`,
                          color: primaryColor
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = `${primaryColor}20`;
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = `${primaryColor}10`;
                        }}
                        title="Retirer"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Summary */}
            <div className="md:col-span-1">
              <div 
                className="rounded-xl p-6 sticky top-4"
                style={{ 
                  backgroundColor: surfaceColor,
                  border: `1px solid ${secondaryColor}`
                }}
              >
                <h2 
                  className="text-lg font-semibold mb-4"
                  style={{ color: textColor }}
                >
                  Résumé de la commande
                </h2>
                
                <div className="space-y-3 mb-6">
                  <div className="flex items-center justify-between text-sm">
                    <span style={{ color: textColor, opacity: 0.7 }}>
                      Sous-total ({items.length} {items.length === 1 ? 'article' : 'articles'})
                    </span>
                    <span style={{ color: textColor }}>
                      {getTotal().toFixed(2)}€
                    </span>
                  </div>
                  <div className="border-t pt-3 flex items-center justify-between">
                    <span 
                      className="text-lg font-semibold"
                      style={{ color: textColor }}
                    >
                      Total
                    </span>
                    <span 
                      className="text-2xl font-bold"
                      style={{ color: primaryColor }}
                    >
                      {getTotal().toFixed(2)}€
                    </span>
                  </div>
                </div>

                <div className="space-y-3">
                  <Button
                    onClick={handleCheckout}
                    className="w-full"
                    style={{
                      backgroundColor: primaryColor,
                      color: 'white'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = accentColor;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = primaryColor;
                    }}
                  >
                    <CreditCard className="h-4 w-4 mr-2" />
                    Passer au paiement
                  </Button>
                  <Button
                    onClick={clearCart}
                    variant="outline"
                    className="w-full"
                    style={{
                      borderColor: secondaryColor,
                      color: textColor
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = bgColor;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }}
                  >
                    Vider le panier
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

