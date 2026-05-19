"use client";

import { motion } from "framer-motion";
import { BookOpen, Video, Sparkles, Mic2 } from "lucide-react";

const tiles = [
  {
    icon: BookOpen,
    title: "Étude de cas",
    visual: "from-amber-500/15 via-transparent to-sky-500/10",
    bars: [100, 88, 72],
  },
  {
    icon: Video,
    title: "Vidéo",
    visual: "from-sky-500/20 via-transparent to-violet-500/10",
    bars: [100, 65, 80],
  },
  {
    icon: Sparkles,
    title: "Simulation",
    visual: "from-emerald-500/18 via-transparent to-cyan-500/10",
    bars: [100, 92, 95],
  },
  {
    icon: Mic2,
    title: "Présentation",
    visual: "from-violet-500/18 via-transparent to-rose-500/10",
    bars: [100, 78, 90],
  },
] as const;

export function EdgeWhatYouProduceSection() {
  return (
    <section id="produire" className="scroll-mt-20 border-t border-zinc-200 bg-white py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-5 sm:px-8">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-70px" }}
          transition={{ duration: 0.5 }}
          className="max-w-3xl"
        >
          <p className="text-[11px] font-semibold uppercase tracking-[0.38em] text-zinc-400">Livrables</p>
          <h2 className="mt-4 text-3xl font-semibold leading-tight tracking-[-0.03em] text-zinc-950 sm:text-4xl md:text-[2.4rem]">
            Ce que vous allez produire.
          </h2>
          <p className="mt-5 text-lg text-zinc-600">Des preuves tangibles — pas des cases à cocher.</p>
        </motion.div>

        <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {tiles.map((t, i) => (
            <motion.div
              key={t.title}
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.4, delay: i * 0.06 }}
              className="group flex flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-zinc-50 transition duration-300 hover:border-sky-200 hover:bg-white hover:shadow-[0_12px_48px_-28px_rgba(14,165,233,0.22)]"
            >
              <div className={`relative h-36 bg-gradient-to-br ${t.visual} p-4`}>
                <div className="absolute inset-0 opacity-50 [background-image:linear-gradient(rgba(0,0,0,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.04)_1px,transparent_1px)] [background-size:16px_16px]" />
                <div className="relative flex h-full flex-col justify-between">
                  <t.icon className="h-6 w-6 text-zinc-600 transition group-hover:text-zinc-900" strokeWidth={1.25} />
                  <div className="space-y-2">
                    {t.bars.map((w, j) => (
                      <div key={j} className="h-1.5 overflow-hidden rounded-full bg-zinc-200/90">
                        <div
                          className="h-full rounded-full bg-zinc-400 transition duration-500 group-hover:bg-sky-500/70"
                          style={{ width: `${w}%` }}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div className="p-5">
                <div className="text-sm font-semibold text-zinc-950">{t.title}</div>
                <div className="mt-1 text-xs text-zinc-500">Placeholder visuel</div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
