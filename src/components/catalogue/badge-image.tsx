"use client";

import Image from "next/image";
import { useState } from "react";

type BadgeImageProps = {
  src: string;
  alt: string;
  className?: string;
};

export function BadgeImage({ src, alt, className = "" }: BadgeImageProps) {
  const [hasError, setHasError] = useState(false);

  if (hasError) {
    return null;
  }

  if (src.startsWith('data:image/')) {
    return (
      <img
        src={src}
        alt={alt}
        className={`w-full h-full object-contain ${className}`}
        onError={() => setHasError(true)}
      />
    );
  }

  return (
    <Image
      src={src}
      alt={alt}
      fill
      className={`object-contain ${className}`}
      unoptimized={true}
      onError={() => setHasError(true)}
    />
  );
}








