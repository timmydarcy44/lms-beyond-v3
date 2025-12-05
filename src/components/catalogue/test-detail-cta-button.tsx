"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Play } from "lucide-react";
import { AddToCartButton } from "@/components/catalogue/add-to-cart-button";

type TestDetailCTAButtonProps = {
  hasAccess: boolean;
  testUrl: string | null;
  paymentUrl: string;
  isFree: boolean;
  price: number | null;
  primaryColor: string;
  catalogItemId?: string;
  contentId?: string;
  title?: string;
  thumbnailUrl?: string | null;
};

export function TestDetailCTAButton({
  hasAccess,
  testUrl,
  paymentUrl,
  isFree,
  price,
  primaryColor,
  catalogItemId,
  contentId,
  title,
  thumbnailUrl,
}: TestDetailCTAButtonProps) {
  if (hasAccess && testUrl) {
    return (
      <Button
        asChild
        size="lg"
        className="rounded-lg px-8 py-6 text-lg font-semibold"
        style={{
          backgroundColor: primaryColor,
          color: '#FFFFFF',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = primaryColor;
          e.currentTarget.style.opacity = '0.9';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = primaryColor;
          e.currentTarget.style.opacity = '1';
        }}
      >
        <Link href={testUrl}>
          <Play className="h-5 w-5 mr-2" />
          Démarrer le test
        </Link>
      </Button>
    );
  }

  // Si gratuit, rediriger directement
  if (isFree || price === 0) {
    return (
      <Button
        asChild
        size="lg"
        className="rounded-lg px-8 py-6 text-lg font-semibold"
        style={{
          backgroundColor: primaryColor,
          color: '#FFFFFF',
        }}
      >
        <Link href={paymentUrl}>
          Accéder gratuitement
        </Link>
      </Button>
    );
  }

  // Si payant, utiliser AddToCartButton pour ajouter au panier
  if (catalogItemId && contentId && title && price) {
    return (
      <AddToCartButton
        contentId={catalogItemId}
        contentType="test"
        title={title}
        price={price}
        thumbnailUrl={thumbnailUrl}
        size="lg"
        className="rounded-lg px-8 py-6 text-lg font-semibold"
      />
    );
  }

  // Fallback : rediriger vers la page de paiement
  return (
    <Button
      asChild
      size="lg"
      className="rounded-lg px-8 py-6 text-lg font-semibold"
      style={{
        backgroundColor: primaryColor,
        color: '#FFFFFF',
      }}
    >
      <Link href={paymentUrl}>
        Acheter pour {price?.toFixed(2)}€
      </Link>
    </Button>
  );
}

