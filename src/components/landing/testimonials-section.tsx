"use client";

import { motion } from "framer-motion";
import { useInView } from "framer-motion";
import { useRef } from "react";

const testimonials = [
  {
    quote: "Beyond a transformé notre manière d'aborder les apprentissages. On se sent apaisé, concentré, connecté à soi.",
    author: "Sophie",
    role: "formatrice en entreprise",
  },
  {
    quote: "C'est la première fois qu'une plateforme prend autant soin de mon rythme cognitif.",
    author: "Malik",
    role: "étudiant",
  },
];

export function TestimonialsSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.2 });

  return (
    <section ref={ref} id="témoignages" className="py-40 bg-[#F8F9FB]">
      <div className="max-w-5xl mx-auto px-6 lg:px-8">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 1.5, ease: [0.22, 1, 0.36, 1] }}
          className="text-center mb-24"
        >
          <h2 className="text-5xl md:text-7xl font-medium text-[#0B0B0C] mb-6 leading-[1.1] tracking-[-0.02em]" style={{ fontFamily: 'var(--font-geist-sans), system-ui, -apple-system, sans-serif' }}>
            Ils ont redéfini
            <br />
            <span className="text-[#0B0B0C]/70">leur façon d'apprendre.</span>
          </h2>
        </motion.div>

        {/* Testimonials - Centered, Minimalist */}
        <div className="space-y-16">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
              transition={{ duration: 1.5, delay: index * 0.2, ease: [0.22, 1, 0.36, 1] }}
              className="text-center max-w-3xl mx-auto"
            >
              <blockquote className="text-2xl md:text-3xl text-[#0B0B0C] mb-8 leading-relaxed font-light italic" style={{ fontFamily: 'var(--font-geist-sans), system-ui, -apple-system, sans-serif', letterSpacing: '-0.01em' }}>
                "{testimonial.quote}"
              </blockquote>
              <div className="text-[#0B0B0C]/50 font-light" style={{ fontFamily: 'var(--font-geist-sans), system-ui, -apple-system, sans-serif', letterSpacing: '-0.01em' }}>
                — {testimonial.author}, {testimonial.role}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
