import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";

const BOOKING_URL = "https://perfactive.fr/psychopedagogue/rocquancourt/jessica-contentin";

type Props = {
  imageUrl: string;
  imageAlt: string;
  /** Vidéo de fond (même média que la carte d’accueil si défini dans le catalogue) */
  backgroundVideoUrl?: string;
  /** Poster optionnel avant la première image de la vidéo */
  videoPosterUrl?: string;
  kicker?: string;
  title: string;
  subtitle: string;
  specialityHref: string;
};

/**
 * Bannière cinématique type référence : image ou vidéo cover, voile sombre, texte centré, CTA pill doré.
 */
export function ProgrammeHeroBanner({
  imageUrl,
  imageAlt,
  backgroundVideoUrl,
  videoPosterUrl,
  kicker,
  title,
  subtitle,
  specialityHref,
}: Props) {
  return (
    <section className="w-full px-0 pb-8 md:pb-12" aria-labelledby="programme-hero-title">
      <div className="relative w-full overflow-hidden bg-[#1a1512] shadow-[0_28px_60px_-24px_rgba(45,36,28,0.45)]">
        <div className="relative aspect-[4/3] min-h-[260px] w-full sm:aspect-[21/9] sm:min-h-[240px] md:min-h-[300px] lg:aspect-[2.4/1] lg:min-h-[340px]">
          {backgroundVideoUrl ? (
            <video
              className="absolute inset-0 h-full w-full object-cover"
              src={backgroundVideoUrl}
              {...(videoPosterUrl ? { poster: videoPosterUrl } : {})}
              muted
              loop
              playsInline
              autoPlay
              preload="metadata"
              aria-hidden
            />
          ) : (
            <Image src={imageUrl} alt={imageAlt} fill className="object-cover" sizes="100vw" priority />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/55 to-black/35" />
        </div>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center px-5 text-center md:px-10">
          {kicker ? (
            <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.35em] text-white/90 md:text-xs">{kicker}</p>
          ) : null}
          <h1
            id="programme-hero-title"
            className="max-w-4xl text-2xl font-bold leading-tight tracking-tight text-white [text-shadow:0_2px_28px_rgba(0,0,0,0.85),0_1px_3px_rgba(0,0,0,0.9)] md:text-4xl lg:text-5xl"
          >
            {title}
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-white/95 [text-shadow:0_1px_12px_rgba(0,0,0,0.75)] md:text-lg">
            {subtitle}
          </p>
          <div className="pointer-events-auto mt-8 flex flex-wrap items-center justify-center gap-3">
            <Button
              asChild
              size="lg"
              className="pointer-events-auto rounded-full border-0 bg-[#C6A664] px-8 py-6 text-base font-semibold text-white shadow-lg hover:bg-[#B88A44]"
            >
              <a href={BOOKING_URL} target="_blank" rel="noopener noreferrer">
                Commencer
              </a>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="pointer-events-auto rounded-full border-white/40 bg-white/10 px-6 py-6 text-base text-white backdrop-blur-sm hover:bg-white/20"
            >
              <Link href={specialityHref}>Fiche détaillée</Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
