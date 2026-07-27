"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

const SERIF = 'var(--font-fraunces), "Fraunces", Georgia, "Times New Roman", serif';

type Pillar = {
  title: string;
  description: string;
  image: string;
  /** Fond carte (ex. blanc pour Adapter). */
  cardBg: string;
  /** object-fit / position de la photo. */
  imageClass: string;
  /** Texte sombre si fond clair. */
  lightCard?: boolean;
};

const PILLARS: Pillar[] = [
  {
    title: "Comprendre",
    description: "Identifier son fonctionnement cognitif.",
    image:
      "https://zmcefidiiqqppowymoqb.supabase.co/storage/v1/object/public/jessica%20contentin/cover%20comprendre.png",
    cardBg: "bg-[#1a1510]",
    imageClass: "object-cover object-[center_30%]",
  },
  {
    title: "Adapter",
    description: "Mettre en place des stratégies concrètes.",
    image:
      "https://zmcefidiiqqppowymoqb.supabase.co/storage/v1/object/public/jessica%20contentin/cover%20adapter.png",
    cardBg: "bg-black",
    // Téléphone un peu réduit, sans halo blanc (fond noir = fond de la mockup)
    imageClass: "object-contain object-center scale-[0.82]",
  },
  {
    title: "Progresser",
    description: "Retrouver confiance et autonomie.",
    image:
      "https://zmcefidiiqqppowymoqb.supabase.co/storage/v1/object/public/jessica%20contentin/cover%20retrouver%20confiance.png",
    cardBg: "bg-[#1a1510]",
    // Visage plein cadre (ancré à droite / haut)
    imageClass: "object-cover object-[78%_22%]",
  },
];

/** Trois piliers — cartes photo plein cadre, style Apple. */
export function JessicaTroisPiliersSection() {
  return (
    <section
      id="trois-piliers"
      className="scroll-mt-24 bg-[#F7F3EC] py-16 md:py-24"
      aria-labelledby="trois-piliers-title"
    >
      <div className="mx-auto max-w-6xl px-4 md:px-8">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mx-auto max-w-2xl text-center"
        >
          <div className="mb-4 inline-flex items-center gap-1" aria-hidden>
            {Array.from({ length: 5 }).map((_, i) => (
              <Star key={i} className="h-4 w-4 fill-[#C6A664] text-[#C6A664]" />
            ))}
          </div>
          <h2
            id="trois-piliers-title"
            className="text-3xl font-medium tracking-tight text-[#2F2A25] md:text-[2.5rem] md:leading-tight"
            style={{ fontFamily: SERIF }}
          >
            Les trois piliers
          </h2>
          <p className="mt-3 text-base text-[#5C5348] md:text-lg">
            Une méthode claire, progressive et personnalisée.
          </p>
        </motion.div>

        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:mt-14 lg:grid-cols-3 lg:gap-6">
          {PILLARS.map((pillar, index) => (
            <motion.article
              key={pillar.title}
              initial={{ opacity: 0, y: 28 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.55, delay: index * 0.08 }}
              className={cn(
                "group relative isolate min-h-[420px] overflow-hidden rounded-[1.75rem] shadow-[0_28px_60px_-32px_rgba(47,42,37,0.45)] sm:min-h-[460px] lg:min-h-[520px]",
                pillar.cardBg,
              )}
            >
              <Image
                src={pillar.image}
                alt=""
                fill
                sizes="(min-width: 1024px) 30vw, (min-width: 640px) 45vw, 100vw"
                className={cn(
                  "transition duration-700 ease-out group-hover:scale-[1.03]",
                  pillar.imageClass,
                )}
              />

              {!pillar.lightCard ? (
                <>
                  <div
                    className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent"
                    aria-hidden
                  />
                  <div
                    className="pointer-events-none absolute inset-x-0 bottom-0 h-2/5 bg-gradient-to-t from-black/45 to-transparent"
                    aria-hidden
                  />
                </>
              ) : (
                <div
                  className="pointer-events-none absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-white via-white/90 to-transparent"
                  aria-hidden
                />
              )}

              <div className="absolute inset-x-0 bottom-0 z-10 p-7 sm:p-8">
                <div className="flex min-h-[7.75rem] flex-col justify-end sm:min-h-[8.25rem]">
                  <h3
                    className={cn(
                      "text-[1.85rem] font-semibold leading-none tracking-tight sm:text-[2rem]",
                      pillar.lightCard ? "text-[#2F2A25]" : "text-white",
                    )}
                    style={{ fontFamily: SERIF }}
                  >
                    {pillar.title}
                  </h3>
                  <p
                    className={cn(
                      "mt-2 min-h-[2.75rem] max-w-[16rem] text-[15px] leading-snug sm:min-h-[3rem] sm:text-base",
                      pillar.lightCard ? "text-[#5C5348]" : "text-white/90",
                    )}
                  >
                    {pillar.description}
                  </p>
                </div>
              </div>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
}
