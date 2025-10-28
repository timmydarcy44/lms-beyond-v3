"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

type HeroProps = {
  title: string;
  subtitle?: string;
  ctaLabel: string;
  href: string;
  imageSrc: string;
  priority?: boolean;
};

export default function Hero({
  title,
  subtitle,
  ctaLabel,
  href,
  imageSrc,
  priority = false,
}: HeroProps) {
  return (
    <section className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-8 pt-8">
      <div className="relative h-[420px] md:h-[480px] lg:h-[520px] rounded-3xl overflow-hidden shadow-2xl ring-1 ring-white/10">
        {/* Image de fond */}
        <Image
          src={imageSrc}
          alt={title}
          fill
          className="object-cover"
          priority={priority}
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 1400px"
        />

        {/* Overlay gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/60 to-transparent" />

        {/* Contenu */}
        <div className="absolute inset-0 flex flex-col justify-end p-8 md:p-10 lg:p-14">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-semibold tracking-tight text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)] max-w-2xl">
            {title}
          </h1>
          {subtitle && (
            <p className="mt-4 text-lg md:text-xl text-white/90 drop-shadow-[0_1px_4px_rgba(0,0,0,0.6)] max-w-xl">
              {subtitle}
            </p>
          )}

          {/* CTA */}
          <Link
            href={href}
            className="mt-8 inline-flex items-center gap-2 rounded-xl bg-gradient-to-br from-white to-zinc-200 text-black px-5 py-2.5 font-medium shadow-sm ring-1 ring-white/20 hover:ring-white/40 transition-all hover:scale-[1.01] max-w-fit group"
            aria-label={`${ctaLabel} - ${title}`}
          >
            {ctaLabel}
            <span className="inline-block translate-x-0 group-hover:translate-x-0.5 transition-transform">→</span>
          </Link>
        </div>
      </div>
    </section>
  );
}
