"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { EDGE_CTA_LABELS } from "@/lib/edge-site/constants";
import { EDGE_MARKETING_HREFS } from "@/lib/edge-lab-marketing";

export function EdgeFinalCta() {
  return (
    <section id="cta" className="scroll-mt-20 border-t border-zinc-200 bg-white py-24 sm:py-32">
      <div className="mx-auto max-w-[720px] px-5 text-center sm:px-8">
        <motion.h2
          initial={{ opacity: 0, y: 14 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.5 }}
          className="text-3xl font-semibold tracking-[-0.03em] text-zinc-950 sm:text-4xl"
        >
          Choisissez votre prochain niveau.
        </motion.h2>
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.5, delay: 0.06 }}
          className="mt-12 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:flex-wrap sm:justify-center"
        >
          <Link
            href={EDGE_MARKETING_HREFS.onlineCatalog}
            className="inline-flex h-12 items-center justify-center rounded-full bg-blue-600 px-7 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-500"
          >
            Explorer
          </Link>
          <Link
            href={EDGE_MARKETING_HREFS.formationContinueParcours}
            className="inline-flex h-12 items-center justify-center rounded-full border-2 border-blue-600 bg-white px-7 text-sm font-semibold text-blue-600 transition hover:bg-blue-50"
          >
            Construire mon parcours
          </Link>
          <Link
            href="#ecole"
            className="inline-flex h-12 items-center justify-center rounded-full px-6 text-sm font-semibold text-zinc-500 underline decoration-zinc-300 underline-offset-[6px] transition hover:text-zinc-800 hover:decoration-zinc-400"
          >
            {EDGE_CTA_LABELS.cohort}
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
