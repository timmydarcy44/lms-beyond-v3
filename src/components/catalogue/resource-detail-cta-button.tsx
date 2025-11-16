"use client";

import { Button } from "@/components/ui/button";
import { Play, FileText, Headphones, Lock, CreditCard } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

type ResourceDetailCTAButtonProps = {
  hasAccess: boolean;
  resourceUrl: string | null;
  paymentUrl: string;
  isFree: boolean;
  price: number;
  primaryColor: string;
  resourceKind: string | null;
};

export function ResourceDetailCTAButton({
  hasAccess,
  resourceUrl,
  paymentUrl,
  isFree,
  price,
  primaryColor,
  resourceKind,
}: ResourceDetailCTAButtonProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  // Déterminer l'icône selon le type de ressource
  const getIcon = () => {
    if (resourceKind === "video") {
      return <Play className="h-5 w-5" />;
    } else if (resourceKind === "audio") {
      return <Headphones className="h-5 w-5" />;
    }
    return <FileText className="h-5 w-5" />;
  };

  const handleClick = async () => {
    if (hasAccess && resourceUrl) {
      // Ouvrir la ressource dans un nouvel onglet
      window.open(resourceUrl, '_blank');
    } else {
      // Rediriger vers la page de paiement
      setIsLoading(true);
      router.push(paymentUrl);
    }
  };

  if (hasAccess && resourceUrl) {
    return (
      <Button
        onClick={handleClick}
        size="lg"
        className="px-8 py-6 text-lg font-semibold rounded-full shadow-lg hover:shadow-xl transition-all"
        style={{
          backgroundColor: primaryColor,
          color: '#FFFFFF',
        }}
        disabled={isLoading}
      >
        {getIcon()}
        <span className="ml-2">
          {resourceKind === "video" ? "Regarder" : resourceKind === "audio" ? "Écouter" : "Consulter"}
        </span>
      </Button>
    );
  }

  return (
    <Button
      onClick={handleClick}
      size="lg"
      className="px-8 py-6 text-lg font-semibold rounded-full shadow-lg hover:shadow-xl transition-all"
      style={{
        backgroundColor: primaryColor,
        color: '#FFFFFF',
      }}
      disabled={isLoading}
    >
      <CreditCard className="h-5 w-5" />
      <span className="ml-2">
        {isFree ? "Accéder gratuitement" : `Acheter pour ${price}€`}
      </span>
    </Button>
  );
}

