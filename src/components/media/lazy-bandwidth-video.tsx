"use client";

import { useEffect, useRef, useState, type ComponentPropsWithoutRef } from "react";

export type LazyBandwidthVideoProps = {
  src: string;
  className?: string;
  poster?: string;
  /** Si vrai, pas d’IntersectionObserver — la vidéo se charge tout de suite (toujours `preload="none"`). */
  eager?: boolean;
  /** Marge pour déclencher le chargement avant d’être visible (carrousels horizontaux, etc.). */
  rootMargin?: string;
  wrapperClassName?: string;
} & Omit<ComponentPropsWithoutRef<"video">, "src" | "poster" | "preload" | "ref">;

/**
 * Réduit la bande passante Supabase / Storage : pas de requête vidéo tant que le bloc
 * n’est pas proche du viewport, puis `preload="none"` pour limiter le buffer initial.
 */
export function LazyBandwidthVideo({
  src,
  className,
  poster,
  eager = false,
  rootMargin = "100px",
  wrapperClassName = "absolute inset-0",
  autoPlay = true,
  loop = true,
  muted = true,
  playsInline = true,
  controls,
  ...rest
}: LazyBandwidthVideoProps) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(eager);

  useEffect(() => {
    if (eager || active) return;
    const el = wrapRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) setActive(true);
      },
      { root: null, rootMargin, threshold: 0.01 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [eager, active, rootMargin]);

  return (
    <div ref={wrapRef} className={wrapperClassName}>
      {active ? (
        <video
          key={src}
          src={src}
          className={className}
          preload="none"
          poster={poster}
          autoPlay={autoPlay}
          loop={loop}
          muted={muted}
          playsInline={playsInline}
          controls={controls}
          {...rest}
        />
      ) : poster ? (
        <img src={poster} alt="" className={className} decoding="async" loading="lazy" />
      ) : (
        <div className={className} aria-hidden />
      )}
    </div>
  );
}
