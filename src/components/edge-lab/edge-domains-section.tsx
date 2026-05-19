"use client";

import { motion } from "framer-motion";

const domains = [
  "IA",
  "Automatisation",
  "Vente",
  "Communication",
  "Comportement",
  "Leadership",
  "Soft skills",
] as const;

export function EdgeDomainsSection() {
  return (
    <section id="domaines" className="scroll-mt-20 border-t border-zinc-200 bg-white py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-5 sm:px-8">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.45 }}
          className="max-w-2xl"
        >
          <p className="text-[11px] font-semibold uppercase tracking-[0.38em] text-zinc-400">Domaines</p>
          <h2 className="mt-4 text-3xl font-semibold tracking-[-0.03em] text-zinc-950 sm:text-4xl">
            Les compétences que vous développez
          </h2>
        </motion.div>

        <ul className="mt-14 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {domains.map((label, i) => (
            <motion.li
              key={label}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-30px" }}
              transition={{ duration: 0.35, delay: i * 0.04 }}
              className="rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-4 text-center text-sm font-semibold text-zinc-900 transition duration-300 hover:border-sky-300 hover:bg-white hover:shadow-[0_12px_40px_-24px_rgba(14,165,233,0.35)]"
            >
              {label}
            </motion.li>
          ))}
        </ul>
      </div>
    </section>
  );
}
