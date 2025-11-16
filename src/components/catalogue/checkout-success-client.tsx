"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { CheckCircle2, ArrowRight } from "lucide-react";
import { useCart } from "@/lib/stores/use-cart";

type CheckoutSuccessClientProps = {
  orderId: string | null;
};

export function CheckoutSuccessClient({ orderId }: CheckoutSuccessClientProps) {
  const router = useRouter();
  const { clearCart } = useCart();

  // Vider le panier local après paiement réussi
  useEffect(() => {
    clearCart();
  }, [clearCart]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-6">
      <div className="max-w-2xl w-full bg-white rounded-2xl shadow-xl p-8 md:p-12 text-center">
        <div className="flex justify-center mb-6">
          <div className="flex items-center justify-center w-20 h-20 bg-green-100 rounded-full">
            <CheckCircle2 className="h-12 w-12 text-green-600" />
          </div>
        </div>

        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
          Paiement réussi !
        </h1>

        <p className="text-lg text-gray-600 mb-8">
          Votre commande a été traitée avec succès. Vous avez maintenant accès à tous les contenus achetés.
        </p>

        {orderId && (
          <p className="text-sm text-gray-500 mb-8">
            Numéro de commande : <span className="font-mono">{orderId.substring(0, 8)}</span>
          </p>
        )}

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button
            onClick={() => router.push("/dashboard/catalogue")}
            variant="outline"
            size="lg"
          >
            Continuer mes achats
          </Button>
          <Button
            onClick={() => router.push("/dashboard")}
            size="lg"
            className="bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-700 hover:to-violet-700"
          >
            Accéder à mes contenus
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
      </div>
    </div>
  );
}



