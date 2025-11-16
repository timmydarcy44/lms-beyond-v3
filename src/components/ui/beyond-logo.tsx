"use client";

import { cn } from "@/lib/utils";

type BeyondLogoProps = {
  className?: string;
  size?: "sm" | "md" | "lg";
};

export function BeyondLogo({ className, size = "md" }: BeyondLogoProps) {
  const sizeClasses = {
    sm: "h-6 w-6",
    md: "h-8 w-8",
    lg: "h-12 w-12",
  };

  return (
    <svg
      viewBox="0 0 100 100"
      className={cn(sizeClasses[size], className)}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Lettre B stylisée - trait vertical gauche */}
      <path
        d="M 20 10 L 20 90"
        stroke="currentColor"
        strokeWidth="8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Courbe supérieure du B */}
      <path
        d="M 20 10 Q 20 10 50 10 Q 70 10 70 30 Q 70 45 50 50"
        stroke="currentColor"
        strokeWidth="8"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      {/* Courbe inférieure du B */}
      <path
        d="M 20 50 Q 20 50 50 50 Q 70 50 70 70 Q 70 90 50 90 Q 20 90 20 90"
        stroke="currentColor"
        strokeWidth="8"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      {/* Boucle intérieure (figure-8/infinity) */}
      <path
        d="M 50 35 Q 55 30 60 35 Q 55 40 50 35 M 50 65 Q 55 60 60 65 Q 55 70 50 65"
        stroke="currentColor"
        strokeWidth="4"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  );
}

