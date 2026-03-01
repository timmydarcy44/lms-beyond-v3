"use client";

import Link from "next/link";
import { motion } from "framer-motion";

import { competencies } from "@/components/beyond-no-school/competences-data";

const fadeUp = {
  initial: { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0 },
  transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] as const },
  viewport: { once: true, margin: "-120px" },
};

export default function CompetencesPage() {
  return (
    <main className="min-h-screen bg-black text-white">
      <section className="relative overflow-hidden px-6 pb-16 pt-24">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,59,48,0.22),transparent_50%)]" />
        <div className="relative mx-auto max-w-6xl space-y-6">
          <motion.p {...fadeUp} className="text-xs uppercase tracking-[0.4em] text-white/50">
            Beyond No School
          </motion.p>
          <motion.h1 {...fadeUp} className="text-4xl font-semibold sm:text-5xl md:text-6xl">
            Choisis ta compétence.
          </motion.h1>
          <motion.p {...fadeUp} className="max-w-2xl text-lg text-white/70">
            Chaque page est une immersion complète. Tu y trouveras le plan d’exécution, la preuve finale et l’offre.
          </motion.p>
        </div>
      </section>

      <section className="px-6 pb-24">
        <div className="mx-auto max-w-6xl">
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {competencies.map((item, index) => (
              <motion.div
                key={item.slug}
                {...fadeUp}
                transition={{ ...fadeUp.transition, delay: index * 0.04 }}
              >
                <Link
                  href={`/beyond-no-school/competences/${item.slug}`}
                  className="group relative flex h-full flex-col justify-between overflow-hidden rounded-3xl border border-white/10 bg-white/[0.04] p-6 transition-transform duration-300 hover:-translate-y-1"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-transparent" />
                  <div className="relative space-y-3">
                    <p className="text-xs uppercase tracking-[0.35em] text-white/50">Compétence</p>
                    <h2 className="text-2xl font-semibold text-white">{item.name}</h2>
                    <p className="text-sm text-white/60">{item.meta.shortDescription}</p>
                  </div>
                  <div className="relative mt-6 flex items-center justify-between text-xs uppercase tracking-[0.3em] text-white/50">
                    <span>{item.meta.duration}</span>
                    <span>0{index + 1}</span>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}

