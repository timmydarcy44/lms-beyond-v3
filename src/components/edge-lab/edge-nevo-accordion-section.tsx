"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

const ITEMS = [
  {
    id: "fiches",
    title: "Transformer vos cours en fiche",
    description:
      "Générez instantanément des fiches claires à partir de vos contenus (cours, PDF, slides) — structurées, prêtes à être réutilisées.",
    imageSrc:
      "https://zmcefidiiqqppowymoqb.supabase.co/storage/v1/object/public/EDGE%20Lab/transformer%20vos%20cours%20en%20fiche.png",
    imageAlt: "Transformer vos cours en fiche",
  },
  {
    id: "dys-schema",
    title: "Adapter aux profil DYS et transformation en schéma",
    description:
      "Adaptez automatiquement le contenu pour les profils DYS et générez des schémas pour faciliter la compréhension et la mémorisation.",
    imageSrc:
      "https://zmcefidiiqqppowymoqb.supabase.co/storage/v1/object/public/EDGE%20Lab/Gemini_Generated_Image_n90j1qn90j1qn90j.png",
    imageAlt: "Adapter aux profils DYS et transformation en schéma",
  },
  {
    id: "quiz",
    title: "Créer des quiz",
    description:
      "Générez des quiz à partir de vos leçons, pour valider la compréhension et ancrer les acquis.",
    imageSrc:
      "https://zmcefidiiqqppowymoqb.supabase.co/storage/v1/object/public/EDGE%20Lab/Gemini_Generated_Image_8dkorw8dkorw8dko.png",
    imageAlt: "Créer des quiz",
  },
] as const;

export function EdgeNevoAccordionSection() {
  const [activeId, setActiveId] = useState<(typeof ITEMS)[number]["id"]>("fiches");
  const active = useMemo(() => ITEMS.find((x) => x.id === activeId) ?? ITEMS[0], [activeId]);

  return (
    <section className="scroll-mt-20 border-t border-zinc-200 bg-white py-16 sm:py-24">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <div className="grid gap-10 lg:grid-cols-[1fr_1.05fr] lg:items-start lg:gap-14">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.38em] text-zinc-400">nevo</p>
            <h2 className="mt-4 text-3xl font-semibold tracking-[-0.03em] text-zinc-950 sm:text-4xl md:text-[2.4rem]">
              Bien plus qu&apos;un partenariat
            </h2>

            <div className="mt-10 rounded-3xl bg-zinc-50 p-2">
              {ITEMS.map((item) => {
                const isActive = item.id === activeId;
                return (
                  <div key={item.id} className="relative">
                    <button
                      type="button"
                      onClick={() => setActiveId(item.id)}
                      className={cn(
                        "group relative flex w-full items-center justify-between gap-4 rounded-2xl px-5 py-5 text-left transition",
                        isActive ? "bg-white" : "hover:bg-white/70",
                      )}
                    >
                      <span className="text-lg font-semibold tracking-[-0.02em] text-zinc-950 sm:text-xl">
                        {item.title}
                      </span>
                      <ChevronDown
                        className={cn(
                          "h-5 w-5 shrink-0 text-zinc-400 transition",
                          isActive ? "rotate-180 text-zinc-700" : "group-hover:text-zinc-600",
                        )}
                        strokeWidth={2.5}
                        aria-hidden
                      />
                      {isActive ? (
                        <motion.span
                          layoutId="nevo-accordion-active"
                          className="pointer-events-none absolute inset-0 rounded-2xl ring-1 ring-zinc-200"
                        />
                      ) : null}
                      {isActive ? (
                        <motion.span
                          layoutId="nevo-accordion-progress"
                          className="pointer-events-none absolute inset-x-5 bottom-3 h-0.5 overflow-hidden rounded-full bg-zinc-100"
                        >
                          <motion.span
                            className="block h-full w-full origin-left bg-zinc-900/70"
                            initial={{ scaleX: 0 }}
                            animate={{ scaleX: 1 }}
                            transition={{ duration: 3.2, ease: "linear" }}
                          />
                        </motion.span>
                      ) : null}
                    </button>

                    <AnimatePresence initial={false}>
                      {isActive ? (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
                          className="overflow-hidden px-5 pb-4"
                        >
                          <p className="max-w-[52ch] text-sm leading-relaxed text-zinc-600">{item.description}</p>
                        </motion.div>
                      ) : null}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="relative overflow-hidden rounded-3xl border border-zinc-200 bg-white shadow-[0_28px_90px_-55px_rgba(0,0,0,0.22)]">
            <div className="relative aspect-[4/3] w-full bg-zinc-50">
              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={active.id}
                  initial={{ opacity: 0, x: 18, scale: 0.99 }}
                  animate={{ opacity: 1, x: 0, scale: 1 }}
                  exit={{ opacity: 0, x: -18, scale: 0.99 }}
                  transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                  className="absolute inset-0"
                >
                  <Image
                    src={active.imageSrc}
                    alt={active.imageAlt ?? active.title}
                    fill
                    className="object-cover"
                    sizes="(max-width: 1024px) 100vw, 720px"
                    priority={false}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-white/65 via-white/15 to-transparent" />
                </motion.div>
              </AnimatePresence>
            </div>
            <div className="p-6 sm:p-8">
              <div className="text-sm font-semibold text-zinc-950">{active.title}</div>
              <div className="mt-1 text-sm text-zinc-500">Aperçu visuel</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

