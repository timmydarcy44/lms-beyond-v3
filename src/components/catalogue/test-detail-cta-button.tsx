"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Play } from "lucide-react";

type TestDetailCTAButtonProps = {
  hasAccess: boolean;
  testUrl: string | null;
  paymentUrl: string;
  isFree: boolean;
  price: number | null;
  primaryColor: string;
};

export function TestDetailCTAButton({
  hasAccess,
  testUrl,
  paymentUrl,
  isFree,
  price,
  primaryColor,
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
      <Link href={paymentUrl}>
        {isFree || price === 0
          ? "Accéder gratuitement"
          : `Acheter pour ${price?.toFixed(2)}€`}
      </Link>
    </Button>
  );
}

