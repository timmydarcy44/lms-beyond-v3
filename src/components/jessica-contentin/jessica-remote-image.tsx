"use client";

import { cn } from "@/lib/utils";

type JessicaRemoteImageProps = {
  src: string;
  alt: string;
  className?: string;
  fill?: boolean;
  priority?: boolean;
  sizes?: string;
};

/**
 * Images Supabase Storage — on évite next/image dont l'optimiseur
 * échoue souvent sur les URLs avec espaces encodés dans le bucket.
 */
export function JessicaRemoteImage({
  src,
  alt,
  className,
  fill,
  priority,
}: JessicaRemoteImageProps) {
  const imgClass = cn(fill ? "absolute inset-0 h-full w-full" : "", className);

  if (fill) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt={alt}
        loading={priority ? "eager" : "lazy"}
        decoding="async"
        className={imgClass}
        onError={(e) => {
          const el = e.currentTarget;
          if (!el.dataset.fallbackApplied) {
            el.dataset.fallbackApplied = "1";
            el.src = "/jessica-contentin/parcours-tdah/section-04.jpg";
          }
        }}
      />
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      loading={priority ? "eager" : "lazy"}
      decoding="async"
      className={imgClass}
      onError={(e) => {
        const el = e.currentTarget;
        if (!el.dataset.fallbackApplied) {
          el.dataset.fallbackApplied = "1";
          el.src = "/jessica-contentin/parcours-tdah/section-04.jpg";
        }
      }}
    />
  );
}
