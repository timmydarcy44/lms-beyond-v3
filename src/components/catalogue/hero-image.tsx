"use client";

import Image from "next/image";
import { useState } from "react";

type HeroImageProps = {
  src: string;
  alt: string;
  className?: string;
};

export function HeroImage({ src, alt, className = "" }: HeroImageProps) {
  const [hasError, setHasError] = useState(false);

  if (hasError) {
    return (
      <div className={`absolute inset-0 bg-gradient-to-br from-blue-900 via-violet-900 to-purple-900 ${className}`} />
    );
  }

  // Si c'est une image base64 ou un GIF, utiliser img natif pour préserver l'animation
  const isGif = src.toLowerCase().endsWith('.gif') || 
                src.includes('data:image/gif') || 
                src.includes('.gif?') ||
                src.includes('/gif');
  
  if (src.startsWith('data:image/') || isGif) {
    return (
      <img
        src={src}
        alt={alt}
        className={`absolute inset-0 h-full w-full object-cover ${className}`}
        onError={() => {
          console.error("[catalogue/module] Image/GIF load error");
          setHasError(true);
        }}
      />
    );
  }

  return (
    <Image
      src={src}
      alt={alt}
      fill
      priority
      className={`object-cover ${className}`}
      unoptimized={true}
      onError={() => {
        console.error("[catalogue/module] Image load error:", src);
        setHasError(true);
      }}
    />
  );
}

