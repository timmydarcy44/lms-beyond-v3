"use client";

import { motion } from "framer-motion";

const badges = [
  {
    title: "Prompt Engineering",
    description: "Réseaux neuronaux néon",
    image:
      "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1400&q=80",
    icon: "✨",
  },
  {
    title: "SEO Avancé & Data",
    description: "Graphiques de croissance 3D",
    image:
      "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=1400&q=80",
    icon: "📈",
  },
  {
    title: "Leadership Hybride",
    description: "Collaboration à distance",
    image:
      "https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=1400&q=80",
    icon: "🤝",
  },
  {
    title: "Agilité Émotionnelle",
    description: "Formes organiques abstraites",
    image:
      "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1400&q=80",
    icon: "🫧",
  },
];

export default function BadgeSlider() {
  return (
    <section className="mt-10 rounded-[24px] border border-white/5 bg-white/5 p-6">
      <div className="flex items-center justify-between">
        <h2 className="text-[18px] font-extrabold text-white">Parcours de Progression</h2>
        <button className="text-[12px] font-semibold text-[#007BFF]">Voir plus</button>
      </div>

      <div className="mt-5 flex gap-4 overflow-x-auto pb-2 scrollbar-hide snap-x snap-mandatory">
        {badges.map((badge, index) => (
          <motion.div
            key={badge.title}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 120, damping: 16, delay: index * 0.06 }}
            className="group relative min-h-[280px] min-w-[220px] snap-start overflow-hidden rounded-[24px] border border-white/10 bg-white/5 shadow-[0_12px_30px_rgba(0,0,0,0.35)]"
          >
            <div className="absolute inset-0">
              <img
                src={badge.image}
                alt={badge.title}
                className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
            </div>
            <div className="absolute left-4 top-4 rounded-full border border-white/10 bg-white/10 px-2 py-1 text-[12px] text-white/90 backdrop-blur-md">
              {badge.icon}
            </div>
            <div className="absolute inset-x-0 bottom-0 p-4">
              <div className="text-[14px] font-bold text-white">{badge.title}</div>
              <div className="mt-1 text-[11px] text-white/70">{badge.description}</div>
            </div>
            <div className="absolute inset-0 rounded-[24px] border border-transparent transition group-hover:border-blue-500/60 group-hover:shadow-[0_0_18px_rgba(0,123,255,0.55)]" />
          </motion.div>
        ))}
      </div>
    </section>
  );
}
