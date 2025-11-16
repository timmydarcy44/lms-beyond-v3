"use client";

import { Button } from "@/components/ui/button";
import { CreditCard, CheckCircle2, AlertCircle } from "lucide-react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

type StripeConnectStatus = {
  connected: boolean;
  charges_enabled: boolean;
  payouts_enabled: boolean;
  account_id?: string;
};

export function StripeConnectButton() {
  const router = useRouter();
  const [status, setStatus] = useState<StripeConnectStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);

  useEffect(() => {
    checkStripeStatus();
  }, []);

  const checkStripeStatus = async () => {
    try {
      const response = await fetch("/api/stripe/connect/status");
      const data = await response.json();
      setStatus(data);
    } catch (error) {
      console.error("[StripeConnectButton] Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = async () => {
    setConnecting(true);
    try {
      const response = await fetch("/api/stripe/connect/authorize");
      const data = await response.json();

      if (data.url) {
        // Rediriger vers Stripe Connect
        window.location.href = data.url;
      } else if (data.connected) {
        // Déjà connecté
        setStatus({
          connected: true,
          charges_enabled: true,
          payouts_enabled: true,
        });
      }
    } catch (error) {
      console.error("[StripeConnectButton] Error:", error);
    } finally {
      setConnecting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  const isFullyConnected = status?.connected && status?.charges_enabled && status?.payouts_enabled;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Connexion Stripe
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            Connectez votre compte Stripe pour recevoir les paiements de vos contenus
          </p>
        </div>
      </div>

      {isFullyConnected ? (
        <div className="rounded-lg border border-green-200 bg-green-50 p-4">
          <div className="flex items-center gap-2 text-green-800">
            <CheckCircle2 className="h-5 w-5" />
            <span className="font-medium">Compte Stripe connecté</span>
          </div>
          <p className="text-sm text-green-700 mt-2">
            Votre compte Stripe est configuré et prêt à recevoir des paiements.
          </p>
        </div>
      ) : status?.connected && (!status?.charges_enabled || !status?.payouts_enabled) ? (
        <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4">
          <div className="flex items-center gap-2 text-yellow-800">
            <AlertCircle className="h-5 w-5" />
            <span className="font-medium">Configuration incomplète</span>
          </div>
          <p className="text-sm text-yellow-700 mt-2">
            Votre compte Stripe est connecté mais nécessite une configuration supplémentaire.
          </p>
          <Button
            onClick={handleConnect}
            disabled={connecting}
            className="mt-3"
            variant="outline"
          >
            {connecting ? "Connexion..." : "Compléter la configuration"}
          </Button>
        </div>
      ) : (
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
          <p className="text-sm text-gray-700 mb-4">
            Connectez votre compte Stripe pour créer des produits payants et recevoir des paiements.
          </p>
          <Button
            onClick={handleConnect}
            disabled={connecting}
            className="w-full"
          >
            {connecting ? "Connexion..." : "Connecter mon compte Stripe"}
          </Button>
        </div>
      )}
    </div>
  );
}



