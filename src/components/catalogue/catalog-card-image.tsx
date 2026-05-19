"use client";

import Image from "next/image";
import { useState } from "react";
import { LazyBandwidthVideo } from "@/components/media/lazy-bandwidth-video";

type CatalogCardImageProps = {
  src: string | null | undefined;
  alt: string;
  title: string;
};

export function CatalogCardImage({ src, alt, title }: CatalogCardImageProps) {
  const [hasError, setHasError] = useState(false);

  const isRemoteVideo = (url: string) => url.toLowerCase().endsWith(".mp4");

  if (!src || hasError) {
    return (
      <div className="absolute inset-0 flex h-full items-center justify-center bg-slate-800">
        <span className="text-4xl font-bold text-white/20">{title.charAt(0)}</span>
      </div>
    );
  }

  return (
    <div className="absolute inset-0">
      {isRemoteVideo(src) ? (
        <LazyBandwidthVideo
          src={src}
          rootMargin="120px"
          className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
          autoPlay
          loop
          muted
          playsInline
          onError={() => {
            console.error("[catalog-card-image] Video load error:", src);
            setHasError(true);
          }}
        />
      ) : (
        <Image
          src={src}
          alt={alt}
          fill
          className="object-cover transition-transform duration-300 group-hover:scale-110"
          sizes="(max-width: 768px) 280px, 320px"
          unoptimized={true}
          onError={() => {
            console.error("[catalog-card-image] Image load error:", src);
            setHasError(true);
          }}
        />
      )}
    </div>
  );
}

