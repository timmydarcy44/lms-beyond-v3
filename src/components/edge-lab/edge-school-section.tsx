"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { EDGE_CTA_LABELS } from "@/lib/edge-site/constants";

export function EdgeSchoolSection() {
  return (
    <section id="ecole" className="scroll-mt-20 border-t border-zinc-200 bg-white py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-5 sm:px-8">
        <div className="grid gap-10 lg:grid-cols-2 lg:items-center lg:gap-16">
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.5 }}
          >
            <p className="text-[11px] font-semibold uppercase tracking-[0.38em] text-emerald-700">EDGE École</p>
            <h2 className="mt-4 text-3xl font-semibold tracking-[-0.03em] text-zinc-950 sm:text-4xl">Rejoindre EDGE École.</h2>
            <p className="mt-6 text-lg leading-relaxed text-zinc-600">
              Parcours métier, alternance et accompagnement — pour celles et ceux qui visent l&apos;excellence opérationnelle.
            </p>
            <Link
              href="#ecole"
              className="mt-10 inline-flex h-12 items-center justify-center rounded-full bg-blue-600 px-8 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-500 hover:shadow-[0_16px_40px_-16px_rgba(37,99,235,0.45)]"
            >
              {EDGE_CTA_LABELS.cohort}
            </Link>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.55, delay: 0.08 }}
            className="relative aspect-[4/3] overflow-hidden rounded-2xl border border-zinc-200 bg-zinc-950 shadow-[0_24px_60px_-40px_rgba(0,0,0,0.35)]"
          >
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(56,189,248,0.2),transparent_50%),radial-gradient(circle_at_70%_80%,rgba(52,211,153,0.15),transparent_45%)]" />
            <div className="absolute inset-8 rounded-xl border border-white/[0.08] bg-white/[0.03]" />
            <div className="absolute inset-x-12 top-12 h-2 rounded-full bg-white/15" />
            <div className="absolute inset-x-12 top-20 space-y-2">
              <div className="h-2 w-3/4 max-w-[75%] rounded-full bg-white/[0.08]" />
              <div className="h-2 w-1/2 max-w-[50%] rounded-full bg-white/[0.08]" />
            </div>
            <div className="absolute bottom-10 left-10 right-10 rounded-lg border border-white/[0.08] bg-gradient-to-t from-violet-500/15 to-transparent p-4">
              <div className="text-[10px] font-semibold uppercase tracking-wider text-white/45">Parcours diplômant</div>
              <div className="mt-2 text-sm font-medium text-white/80">Sélection · Projets · Soutenances</div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
