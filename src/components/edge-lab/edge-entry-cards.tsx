"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { Plus } from "lucide-react";
import { EDGE_MARKETING_HREFS } from "@/lib/edge-lab-marketing";
import { cn } from "@/lib/utils";
import { LazyBandwidthVideo } from "@/components/media/lazy-bandwidth-video";

const programmes = [
  {
    id: "ia",
    title: "IA",
    imageSrc: "/edge-lab/programme-ia.png",
    imageAlt: "Programme IA",
    href: EDGE_MARKETING_HREFS.onlineFormations,
  },
  {
    id: "auto",
    title: "Automatisation & intelligence commerciale",
    videoSrc: "https://zmcefidiiqqppowymoqb.supabase.co/storage/v1/object/public/EDGE%20Lab/auto_co.mp4",
    href: EDGE_MARKETING_HREFS.onlineFormations,
  },
  {
    id: "comportement",
    title: "Analyse comportementale",
    imageSrc: "/edge-lab/cover_analyse_comportementale.png",
    imageAlt: "Analyse comportementale",
    href: EDGE_MARKETING_HREFS.onlineFormations,
  },
  {
    id: "story",
    title: "Communication et story telling",
    videoSrc: "https://zmcefidiiqqppowymoqb.supabase.co/storage/v1/object/public/EDGE%20Lab/Pub%20Nevo.mp4",
    href: EDGE_MARKETING_HREFS.onlineFormations,
  },
  {
    id: "lead",
    title: "Leadership et management",
    imageSrc: "/edge-lab/cover_management.png",
    imageAlt: "Leadership et management",
    href: EDGE_MARKETING_HREFS.onlineFormations,
  },
  { id: "nego", title: "Négociation et influence", href: EDGE_MARKETING_HREFS.onlineFormations },
  { id: "meta", title: "Metacognition et apprentissage", href: EDGE_MARKETING_HREFS.onlineFormations },
  { id: "soft", title: "Soft skills", href: EDGE_MARKETING_HREFS.onlineFormations },
  { id: "kpi", title: "Pilotage de la performance & KPIs", href: EDGE_MARKETING_HREFS.onlineFormations },
  { id: "sport", title: "Sport Business", href: EDGE_MARKETING_HREFS.onlineFormations },
] as const;

/** Grandes cartes « mockup » pour détailler les formats (placée plus bas sur la landing). */
export function EdgeProgrammesCardsSection() {
  return (
    <section id="programmes-edge" className="scroll-mt-20 border-t border-zinc-200 bg-[#06060a] pb-20 pt-14 sm:pb-28 sm:pt-16">
      <div className="mx-auto max-w-6xl px-5 sm:px-8">
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.45 }}
          className="max-w-3xl"
        >
          <h2 className="text-3xl font-semibold tracking-[-0.03em] text-white sm:text-4xl md:text-[2.5rem] md:leading-[1.08]">
            Nos thématiques
          </h2>
          <p className="mt-3 text-base text-white/55 sm:text-lg">
            Des programmes conçus pour développer des compétences réelles — et les prouver.
          </p>
        </motion.div>

        <div
          className={cn(
            "mt-12 flex gap-5 overflow-x-auto pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
            "snap-x snap-mandatory",
          )}
        >
          {programmes.map((p, i) => (
            <motion.div
              key={p.id}
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.4, delay: i * 0.04 }}
              className="w-[360px] shrink-0 snap-start sm:w-[420px]"
            >
              <Link
                href={p.href}
                className={cn(
                  "group relative flex h-[520px] flex-col overflow-hidden rounded-[28px] bg-black text-white shadow-[0_40px_80px_-48px_rgba(0,0,0,0.85)] ring-1 ring-white/[0.08] transition duration-300 hover:ring-white/[0.14]",
                  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-blue-500",
                )}
              >
                {"videoSrc" in p && p.videoSrc ? (
                  <>
                    <LazyBandwidthVideo
                      src={p.videoSrc}
                      rootMargin="0px 280px 0px 280px"
                      className="absolute inset-0 h-full w-full object-cover opacity-[0.9]"
                      autoPlay
                      muted
                      loop
                      playsInline
                      aria-hidden
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/35 to-black/10" />
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_0%,rgba(255,255,255,0.14),transparent_55%)]" />
                  </>
                ) : p.imageSrc ? (
                  <>
                    <Image
                      src={p.imageSrc}
                      alt={p.imageAlt ?? p.title}
                      fill
                      className="object-cover opacity-[0.92]"
                      sizes="(max-width: 640px) 360px, 420px"
                      priority={i === 0}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/35 to-black/10" />
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_0%,rgba(255,255,255,0.14),transparent_55%)]" />
                  </>
                ) : null}

                <div className="relative z-10 px-8 pb-2 pt-10 sm:px-9 sm:pt-11">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-white/35">Programme</p>
                  <h3 className="mt-4 text-[1.55rem] font-semibold leading-[1.08] tracking-[-0.04em] sm:text-[1.75rem]">
                    {p.title}
                  </h3>
                </div>

                <span
                  className="absolute bottom-5 right-5 z-[2] flex h-11 w-11 items-center justify-center rounded-full bg-white/12 text-white ring-1 ring-white/20 backdrop-blur-md transition duration-300 group-hover:scale-[1.06] group-hover:bg-white/18"
                  aria-hidden
                >
                  <Plus className="h-5 w-5 stroke-[2.25]" />
                </span>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
