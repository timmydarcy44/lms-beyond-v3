"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { ChevronRight, GraduationCap } from "lucide-react";
import { EDGE_MARKETING_HREFS } from "@/lib/edge-lab-marketing";

const cards = [
  {
    id: "online",
    label: "EDGE Online",
    title: "Se former rapidement sur des compétences ciblées",
    description: "Micro-formations, badges et progression autonome.",
    href: EDGE_MARKETING_HREFS.onlineFormations,
    imageSrc: "/edge-lab/objective-online-devices.png",
    imageAlt: "EDGE Online sur ordinateur et iPad",
    vignetteClass:
      "relative [background-image:radial-gradient(circle_at_50%_100%,rgba(14,165,233,0.12),transparent_62%),linear-gradient(to_bottom,#f8fafc,#ffffff)]",
  },
  {
    id: "executive",
    label: "Formation Continue",
    title: "Monter en compétences ou évoluer professionnellement",
    description: "Parcours structurés pour salariés, indépendants et entreprises.",
    href: "#entreprises",
    imageSrc:
      "https://zmcefidiiqqppowymoqb.supabase.co/storage/v1/object/public/EDGE%20Lab/EDGE%20Executive.png",
    imageAlt: "Formation continue EDGE",
    vignetteClass:
      "[background-image:radial-gradient(circle_at_50%_100%,rgba(5,150,105,0.1),transparent_60%),linear-gradient(to_bottom,#f0fdf9,#ffffff)]",
  },
  {
    id: "school",
    label: "EDGE École",
    title: "Se former à un métier et construire un parcours complet",
    description: "Alternance, accompagnement et montée en compétences.",
    href: "#ecole",
    Icon: GraduationCap,
    iconWrap: "text-zinc-800",
    vignetteClass:
      "relative [background-image:linear-gradient(to_bottom,#f4f4f5,#fafafa)] after:pointer-events-none after:absolute after:inset-x-10 after:bottom-0 after:h-px after:bg-gradient-to-r after:from-transparent after:via-zinc-200/80 after:to-transparent",
  },
] as const;

export function EdgeVotreObjectifSection() {
  return (
    <section
      id="portes"
      className="scroll-mt-20 border-t border-zinc-200 bg-white pb-14 pt-12 sm:pb-20 sm:pt-16"
    >
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.45 }}
          className="max-w-3xl"
        >
          <h2 className="text-3xl font-semibold tracking-[-0.04em] text-zinc-950 sm:text-[2.25rem] sm:leading-[1.1] md:text-[2.5rem]">
            Un écosystème complet pour apprendre, évoluer et se former.
          </h2>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed tracking-[-0.01em] text-zinc-500 sm:text-[15px]">
            Trois façons d&apos;accéder à EDGE selon votre objectif.
          </p>
        </motion.div>

        <div
          className="mt-10 flex gap-4 overflow-x-auto pb-2 [-ms-overflow-style:none] [scrollbar-width:none] sm:mt-12 sm:grid sm:gap-6 sm:overflow-visible lg:grid-cols-3 [&::-webkit-scrollbar]:hidden"
        >
          {cards.map((c, i) => (
            <motion.div
              key={c.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-30px" }}
              transition={{ duration: 0.4, delay: i * 0.05 }}
              className="min-w-[min(18.5rem,calc(100vw-5rem))] shrink-0 snap-center sm:min-w-0 sm:snap-none"
            >
              <Link
                href={c.href}
                className="group relative flex h-full min-h-[30rem] flex-col rounded-[28px] bg-white p-9 pb-16 shadow-[0_1px_2px_rgba(0,0,0,0.04)] ring-1 ring-zinc-950/[0.06] transition duration-300 hover:shadow-[0_24px_48px_-28px_rgba(0,0,0,0.14)] hover:ring-zinc-950/[0.1]"
              >
                <p className="text-[13px] font-semibold tracking-[-0.02em] text-zinc-500">{c.label}</p>
                <h3 className="mt-5 text-[1.5rem] font-semibold leading-[1.1] tracking-[-0.04em] text-zinc-950 sm:text-[1.625rem]">
                  {c.title}
                </h3>
                <p className="mt-4 text-[15px] leading-relaxed tracking-[-0.01em] text-zinc-600">{c.description}</p>

                <div className={`relative mt-8 flex flex-1 flex-col ${c.vignetteClass}`}>
                  {"imageSrc" in c ? (
                    <div className="relative mt-auto w-full overflow-hidden rounded-2xl bg-white shadow-[0_28px_60px_-36px_rgba(0,0,0,0.22)]">
                      <div className="relative h-[260px] w-full sm:h-[280px]">
                        <Image
                          src={c.imageSrc}
                          alt={c.imageAlt}
                          fill
                          className={c.id === "online" ? "object-contain p-2" : "object-cover"}
                          sizes="(max-width: 1024px) 90vw, 420px"
                          priority={c.id === "online" || c.id === "executive"}
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="mt-auto flex h-[240px] w-full items-center justify-center rounded-2xl bg-white/60 shadow-[0_28px_60px_-36px_rgba(0,0,0,0.18)] sm:h-[260px]">
                      <c.Icon className={`h-20 w-20 ${c.iconWrap}`} strokeWidth={1.1} aria-hidden />
                    </div>
                  )}
                </div>

                <span
                  className="absolute bottom-5 right-5 z-[2] flex h-10 w-10 items-center justify-center rounded-full bg-zinc-950 text-white shadow-sm transition duration-300 group-hover:scale-[1.05]"
                  aria-hidden
                >
                  <ChevronRight className="relative -mr-[1px] h-[18px] w-[18px]" strokeWidth={2.75} />
                </span>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
