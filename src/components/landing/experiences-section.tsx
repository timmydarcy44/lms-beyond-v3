"use client";

import { motion } from "framer-motion";
import { useInView } from "framer-motion";
import { useRef } from "react";
import { Focus, Timer, Accessibility, Heart, Gamepad2 } from "lucide-react";

const experiences = [
  {
    icon: Focus,
    title: "Mode Focus",
    description: "Apprendre dans le calme, sans distractions.",
    color: "#D1D5FF",
  },
  {
    icon: Timer,
    title: "Pomodoro",
    description: "Trouver le bon rythme entre effort et récupération.",
    color: "#99A7FF",
  },
  {
    icon: Accessibility,
    title: "Accessibilité DYS",
    description: "Un apprentissage sans friction ni fatigue visuelle.",
    color: "#D1D5FF",
  },
  {
    icon: Heart,
    title: "Beyond Care",
    description: "Suivre son équilibre mental grâce à des questionnaires intelligents.",
    color: "#99A7FF",
  },
  {
    icon: Gamepad2,
    title: "Beyond Play",
    description: "Apprendre par immersion, émotions et scénarios.",
    color: "#D1D5FF",
  },
];

export function ExperiencesSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.2 });

  return (
    <section ref={ref} id="fonctionnalités" className="py-40 bg-white relative overflow-hidden">
      {/* Background Image - Trail runner ou personne en mouvement dans la nature */}
      <div className="absolute inset-0 z-0">
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-10"
          style={{
            backgroundImage: `url('https://images.unsplash.com/photo-1571008887538-b36bb32f4571?q=80&w=2070&auto=format&fit=crop')`,
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-white/90 via-white/70 to-white" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-8">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 1.5, ease: [0.22, 1, 0.36, 1] }}
          className="text-center mb-24"
        >
          <h2 className="text-5xl md:text-7xl font-medium text-[#0B0B0C] mb-6 leading-[1.1] tracking-[-0.02em]" style={{ fontFamily: 'var(--font-geist-sans), system-ui, -apple-system, sans-serif' }}>
            Les expériences Beyond
            <br />
            <span className="text-3xl md:text-5xl font-normal text-[#0B0B0C]/60">
              Cinq façons de repenser l'apprentissage
            </span>
          </h2>
        </motion.div>

        {/* Experiences Grid - Frosted Glass Effect */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {experiences.map((experience, index) => {
            const Icon = experience.icon;
            return (
              <motion.div
                key={experience.title}
                initial={{ opacity: 0, y: 30 }}
                animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
                transition={{ duration: 1.5, delay: index * 0.1, ease: [0.22, 1, 0.36, 1] }}
                className="group"
              >
                <div className="bg-white/60 backdrop-blur-xl rounded-3xl p-10 h-full border border-[#0B0B0C]/5 hover:border-[#0B0B0C]/10 transition-all duration-700 hover:shadow-xl hover:shadow-[#0B0B0C]/5">
                  {/* Icon */}
                  <div 
                    className="w-16 h-16 rounded-2xl flex items-center justify-center mb-6 transition-transform duration-700 group-hover:scale-105"
                    style={{ backgroundColor: `${experience.color}20` }}
                  >
                    <Icon 
                      className="h-8 w-8" 
                      style={{ color: experience.color }}
                      strokeWidth={1.5}
                    />
                  </div>

                  {/* Content */}
                  <h3 className="text-2xl font-medium text-[#0B0B0C] mb-3 tracking-tight" style={{ fontFamily: 'var(--font-geist-sans), system-ui, -apple-system, sans-serif' }}>
                    {experience.title}
                  </h3>
                  <p className="text-[#0B0B0C]/60 font-light leading-relaxed text-lg" style={{ fontFamily: 'var(--font-geist-sans), system-ui, -apple-system, sans-serif', letterSpacing: '-0.01em' }}>
                    {experience.description}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
