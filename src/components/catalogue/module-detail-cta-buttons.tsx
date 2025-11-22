"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Play, CreditCard } from "lucide-react";

type ModuleDetailCTAButtonsProps = {
  hasAccess: boolean;
  formationUrl: string | null;
  paymentUrl: string;
  primaryColor: string;
  textColor: string;
  heroImage: string | null;
};

export function ModuleDetailCTAButtons({
  hasAccess,
  formationUrl,
  paymentUrl,
  primaryColor,
  textColor,
  heroImage,
}: ModuleDetailCTAButtonsProps) {
  return (
    <div className="flex gap-4 justify-center flex-wrap">
      <Button
        asChild
        size="lg"
        className="rounded-full px-8 py-6 text-lg font-medium shadow-lg transition-all hover:shadow-xl"
        style={{ 
          fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif',
          backgroundColor: primaryColor,
          color: '#FFFFFF',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = primaryColor;
          e.currentTarget.style.opacity = '0.9';
          e.currentTarget.style.transform = 'scale(1.05)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = primaryColor;
          e.currentTarget.style.opacity = '1';
          e.currentTarget.style.transform = 'scale(1)';
        }}
      >
        {hasAccess && formationUrl ? (
          <Link href={formationUrl}>Commencer maintenant</Link>
        ) : (
          <Link href={paymentUrl}>Se former maintenant</Link>
        )}
      </Button>
      <Button
        asChild
        variant="outline"
        size="lg"
        className="rounded-full border-2 px-8 py-6 text-lg font-medium backdrop-blur-sm"
        style={{ 
          fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif',
          borderColor: heroImage ? 'rgba(255, 255, 255, 0.6)' : `${primaryColor}60`,
          backgroundColor: heroImage ? 'rgba(255, 255, 255, 0.1)' : `${primaryColor}10`,
          color: heroImage ? '#FFFFFF' : textColor,
        }}
        onMouseEnter={(e) => {
          if (heroImage) {
            e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.2)';
            e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.9)';
          } else {
            e.currentTarget.style.backgroundColor = `${primaryColor}20`;
            e.currentTarget.style.borderColor = `${primaryColor}80`;
          }
        }}
        onMouseLeave={(e) => {
          if (heroImage) {
            e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
            e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.6)';
          } else {
            e.currentTarget.style.backgroundColor = `${primaryColor}10`;
            e.currentTarget.style.borderColor = `${primaryColor}60`;
          }
        }}
      >
        <Link href={paymentUrl}>
          <CreditCard className="h-5 w-5 mr-2 inline" />
          {hasAccess && formationUrl ? "En savoir plus" : "Acheter"}
        </Link>
      </Button>
    </div>
  );
}

