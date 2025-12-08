"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { CreditCard } from "lucide-react";
import { BuyButton } from "./buy-button";

type ResourcePurchaseSectionProps = {
  user: { id: string } | null;
  hasAccess: boolean;
  catalogItemId: string;
  contentId: string;
  price: number;
  title: string;
  contentType: "module" | "test" | "ressource" | "parcours";
  isFree: boolean;
  stripeCheckoutUrl?: string | null;
  primaryColor: string;
  textColor: string;
  currentPath: string;
};

export function ResourcePurchaseSection({
  user,
  hasAccess,
  catalogItemId,
  contentId,
  price,
  title,
  contentType,
  isFree,
  stripeCheckoutUrl,
  primaryColor,
  textColor,
  currentPath,
}: ResourcePurchaseSectionProps) {
  if (hasAccess) {
    return null; // Le bouton "Accéder au contenu" est géré ailleurs
  }

  return (
    <div className="space-y-4">
      <div className="text-center">
        <div 
          className="inline-flex items-center justify-center w-12 h-12 rounded-full mb-3"
          style={{ backgroundColor: `${primaryColor}20` }}
        >
          <div className="text-xl">🔒</div>
        </div>
        <h3 
          className="text-lg font-bold mb-2"
          style={{ color: textColor }}
        >
          {isFree ? "Accès gratuit" : `${price}€`}
        </h3>
        {!user && !isFree && (
          <p 
            className="text-sm mb-4"
            style={{ color: `${textColor}AA` }}
          >
            Connectez-vous ou créez un compte pour acheter
          </p>
        )}
        {user && !isFree && (
          <p 
            className="text-sm mb-4"
            style={{ color: `${textColor}AA` }}
          >
            Achetez cette ressource pour y accéder immédiatement
          </p>
        )}
        {isFree && (
          <p 
            className="text-sm mb-4"
            style={{ color: `${textColor}AA` }}
          >
            Connectez-vous pour accéder gratuitement à cette ressource
          </p>
        )}
      </div>
      {!user ? (
        <div className="space-y-3">
          <Link
            href={`/jessica-contentin/inscription?redirect=${encodeURIComponent(currentPath)}`}
            className="w-full rounded-full px-6 py-4 text-base font-semibold text-white shadow-lg hover:shadow-xl transition-all hover:scale-105 block text-center"
            style={{
              backgroundColor: primaryColor,
            }}
          >
            Créer un compte
          </Link>
          <Link
            href={`/jessica-contentin/login?redirect=${encodeURIComponent(currentPath)}`}
            className="w-full rounded-full px-6 py-4 text-base font-semibold border-2 shadow-lg hover:shadow-xl transition-all hover:scale-105 block text-center"
            style={{
              borderColor: primaryColor,
              color: primaryColor,
            }}
          >
            Se connecter
          </Link>
        </div>
      ) : (
        stripeCheckoutUrl ? (
          <Button 
            asChild 
            className="w-full rounded-full px-6 py-4 text-base font-semibold text-white shadow-lg hover:shadow-xl transition-all hover:scale-105"
            style={{
              backgroundColor: primaryColor,
            }}
          >
            <a href={stripeCheckoutUrl} target="_blank" rel="noopener noreferrer">
              <CreditCard className="h-5 w-5" />
              <span className="ml-2">Acheter pour {price}€</span>
            </a>
          </Button>
        ) : (
          <BuyButton
            catalogItemId={catalogItemId}
            contentId={contentId}
            price={price}
            title={title}
            contentType={contentType}
            hasAccess={hasAccess}
            className="w-full rounded-full px-6 py-4 text-base font-semibold text-white shadow-lg hover:shadow-xl transition-all hover:scale-105"
            style={{
              backgroundColor: primaryColor,
            }}
          />
        )
      )}
    </div>
  );
}

