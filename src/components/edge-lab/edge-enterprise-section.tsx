"use client";

import Link from "next/link";
import { motion } from "framer-motion";

export function EdgeEnterpriseSection() {
  return (
    <section id="entreprises" className="scroll-mt-20 border-t border-zinc-200 bg-white py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-5 sm:px-8">
        <div className="relative overflow-hidden rounded-3xl border border-zinc-200 bg-gradient-to-br from-zinc-50 to-white p-10 shadow-[0_28px_80px_-48px_rgba(0,0,0,0.15)] sm:p-14">
          <div className="pointer-events-none absolute -right-24 top-0 h-72 w-72 rounded-full bg-emerald-400/15 blur-3xl" />
          <div className="pointer-events-none absolute -left-20 bottom-0 h-64 w-64 rounded-full bg-sky-400/12 blur-3xl" />

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.5 }}
            className="relative max-w-2xl"
          >
            <p className="text-[11px] font-semibold uppercase tracking-[0.38em] text-zinc-400">Entreprise</p>
            <h2 className="mt-4 text-3xl font-semibold tracking-[-0.03em] text-zinc-950 sm:text-4xl md:text-[2.35rem]">
              Former des équipes performantes.
            </h2>
            <p className="mt-6 text-lg leading-relaxed text-zinc-600">
              Montée en compétences rapide, formations concrètes, suivi via LMS et parcours personnalisés.
            </p>
            <Link
              href="#contact"
              className="mt-10 inline-flex h-12 items-center justify-center rounded-full bg-blue-600 px-8 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-500 hover:shadow-[0_16px_40px_-16px_rgba(37,99,235,0.45)]"
            >
              Former mon équipe
            </Link>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
