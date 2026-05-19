"use client";

import { motion } from "framer-motion";
import { EdgeLmsMockup } from "@/components/edge-lab/placeholders/edge-lms-mockup";
import { EdgeVideoPlaceholder } from "@/components/edge-lab/placeholders/edge-video-placeholder";

export function EdgeProductShowcaseSection() {
  return (
    <section id="plateforme" className="scroll-mt-20 border-t border-zinc-200 bg-white py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-5 sm:px-8">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-70px" }}
          transition={{ duration: 0.5 }}
          className="max-w-3xl"
        >
          <p className="text-[11px] font-semibold uppercase tracking-[0.38em] text-zinc-400">Produit</p>
          <h2 className="mt-4 text-3xl font-semibold leading-tight tracking-[-0.03em] text-zinc-950 sm:text-4xl md:text-[2.4rem]">
            Une plateforme pensée pour apprendre et appliquer.
          </h2>
          <p className="mt-5 text-lg text-zinc-600">
            Tableau de bord, progression, badges — tout orienté vers la preuve de ce que vous savez faire.
          </p>
        </motion.div>

        <div className="mt-14 grid gap-8 lg:grid-cols-[1.15fr_0.85fr] lg:items-start">
          <EdgeLmsMockup className="lg:translate-y-2" />
          <div className="space-y-6">
            <EdgeVideoPlaceholder caption="Module vidéo · zone interactive" />
            <motion.p
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="text-center text-xs text-zinc-400 lg:text-left"
            >
              Placeholders visuels — remplacez par captures ou médias réels quand disponibles.
            </motion.p>
          </div>
        </div>
      </div>
    </section>
  );
}
