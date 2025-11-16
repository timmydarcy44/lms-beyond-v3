"use client";

import { motion } from "framer-motion";
import { useInView } from "framer-motion";
import { useRef } from "react";
import { Brain, MessageCircle, Feather } from "lucide-react";

const pillars = [
  {
    icon: Brain,
    title: "Neurosciences",
    description: "Décoder les mécanismes de l'attention et de la mémoire",
  },
  {
    icon: MessageCircle,
    title: "Psychologie",
    description: "Apprendre à gérer les émotions, la motivation et la fatigue",
  },
  {
    icon: Feather,
    title: "Design humain",
    description: "Créer des espaces numériques qui favorisent la clarté mentale",
  },
];

export function ScienceSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.3 });

  return (
    <section ref={ref} id="science" className="py-40 bg-[#0B0B0C] relative overflow-hidden">
      {/* Background Image - Personne en train de courir dans la nature ou montagne */}
      <div className="absolute inset-0 z-0">
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-30"
          style={{
            backgroundImage: `url('https://images.unsplash.com/photo-1544966503-7cc5ac882d5f?q=80&w=2070&auto=format&fit=crop')`,
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#0B0B0C] via-[#0B0B0C]/90 to-[#0B0B0C]" />
      </div>

      {/* Halo Lumineux */}
      <motion.div
        animate={{
          scale: [1, 1.1, 1],
          opacity: [0.1, 0.15, 0.1],
        }}
        transition={{
          duration: 10,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-[#99A7FF] rounded-full blur-[140px] z-10"
      />

      <div className="relative z-10 max-w-6xl mx-auto px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 40 }}
          transition={{ duration: 1.5, ease: [0.22, 1, 0.36, 1] }}
          className="text-center mb-20"
        >
          <h2 className="text-5xl md:text-7xl font-medium text-white mb-8 leading-[1.1] tracking-[-0.02em]" style={{ fontFamily: 'var(--font-geist-sans), system-ui, -apple-system, sans-serif' }}>
            Ancré dans les neurosciences,
            <br />
            <span className="text-white/70">inspiré par l'humain.</span>
          </h2>
          <p className="text-xl md:text-2xl text-white/60 font-light leading-relaxed max-w-3xl mx-auto mt-8" style={{ fontFamily: 'var(--font-geist-sans), system-ui, -apple-system, sans-serif', letterSpacing: '-0.01em' }}>
            Parce que comprendre comment le cerveau apprend, c'est aussi apprendre à le respecter.
          </p>
        </motion.div>

        {/* Pillars Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {pillars.map((pillar, index) => {
            const Icon = pillar.icon;
            return (
              <motion.div
                key={pillar.title}
                initial={{ opacity: 0, y: 30 }}
                animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
                transition={{ duration: 1.5, delay: 0.3 + index * 0.15, ease: [0.22, 1, 0.36, 1] }}
                className="bg-white/5 backdrop-blur-xl rounded-3xl p-10 border border-white/10 hover:border-white/20 transition-all duration-700 hover:bg-white/8"
              >
                <div className="w-16 h-16 rounded-2xl bg-white/10 flex items-center justify-center mb-8">
                  <Icon className="h-8 w-8 text-[#99A7FF]" strokeWidth={1.5} />
                </div>
                <h3 className="text-2xl font-medium text-white mb-4 tracking-tight" style={{ fontFamily: 'var(--font-geist-sans), system-ui, -apple-system, sans-serif' }}>
                  {pillar.title}
                </h3>
                <p className="text-white/60 font-light leading-relaxed text-lg" style={{ fontFamily: 'var(--font-geist-sans), system-ui, -apple-system, sans-serif', letterSpacing: '-0.01em' }}>
                  {pillar.description}
                </p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
