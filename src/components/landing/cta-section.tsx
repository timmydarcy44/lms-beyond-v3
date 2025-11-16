"use client";

import { motion } from "framer-motion";
import { useInView } from "framer-motion";
import { useRef } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

export function CTASection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.3 });

  return (
    <section ref={ref} className="py-40 bg-gradient-to-b from-[#0B0B0C] via-[#1A1A1C] to-[#0B0B0C] relative overflow-hidden">
      {/* Lumière Douce au Centre */}
      <motion.div
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.15, 0.25, 0.15],
        }}
        transition={{
          duration: 10,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[900px] h-[900px] bg-[#D1D5FF] rounded-full blur-[140px]"
      />

      <div className="relative z-10 max-w-5xl mx-auto px-6 lg:px-8 text-center">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 40 }}
          transition={{ duration: 1.5, ease: [0.22, 1, 0.36, 1] }}
        >
          {/* Main Message */}
          <h2 className="text-5xl md:text-7xl font-semibold text-white mb-12 leading-[1.1] tracking-[-0.02em]" style={{ fontFamily: 'var(--font-geist-sans), system-ui, -apple-system, sans-serif' }}>
            Beyond
            <br />
            <span className="text-white/70 font-medium">parce qu'un esprit apaisé</span>
            <br />
            apprend mieux.
          </h2>

          {/* Supporting Text */}
          <p className="text-xl md:text-2xl text-white/60 mb-16 max-w-2xl mx-auto font-light leading-relaxed" style={{ fontFamily: 'var(--font-geist-sans), system-ui, -apple-system, sans-serif', letterSpacing: '-0.01em' }}>
            Commencez votre voyage dès aujourd'hui.
          </p>

          {/* CTA Button */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={isInView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.95 }}
            transition={{ duration: 1.5, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
          >
            <Button
              asChild
              size="lg"
              className="bg-white text-[#0B0B0C] hover:bg-white/90 text-lg px-12 py-8 h-auto rounded-full font-semibold transition-all duration-500 shadow-xl hover:shadow-2xl"
              style={{ fontFamily: 'var(--font-geist-sans), system-ui, -apple-system, sans-serif' }}
            >
              <Link href="/login">
                Découvrir Beyond
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
