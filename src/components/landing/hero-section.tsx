"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

export function HeroSection() {
  return (
    <section className="relative h-[calc(100vh-64px)] flex items-center justify-center overflow-hidden">
      {/* Background Image/Video - Capture d'écran du front du LMS */}
      <div className="absolute inset-0 z-0">
        {/* Image de fond - Capture d'écran du LMS Beyond */}
        {/* Pour utiliser votre propre capture d'écran, ajoutez l'image dans /public/lms-hero.jpg */}
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: `url('/lms-hero.jpg'), url('https://images.unsplash.com/photo-1460925895917-afdab827c52f?q=80&w=2015&auto=format&fit=crop')`,
          }}
        >
          {/* Overlay gradient pour la lisibilité */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/50 to-black/80" />
        </div>
        
        {/* Alternative: Vidéo de fond si disponible */}
        {/* 
        <video
          autoPlay
          loop
          muted
          playsInline
          className="absolute inset-0 w-full h-full object-cover"
        >
          <source src="/videos/lms-hero.mp4" type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-black/40" />
        */}
      </div>

      {/* Halo Lumineux Subtil - Réduit pour ne pas masquer l'image */}
      <motion.div
        animate={{
          scale: [1, 1.1, 1],
          opacity: [0.08, 0.12, 0.08],
        }}
        transition={{
          duration: 10,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[900px] h-[900px] bg-[#99A7FF] rounded-full blur-[140px] z-10"
      />

      <div className="relative z-10 max-w-5xl mx-auto px-6 lg:px-8 py-12 text-center">
        {/* Main Heading - Taille optimisée pour tenir au-dessus de la ligne de flottaison */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.5, ease: [0.22, 1, 0.36, 1] }}
          className="text-3xl md:text-4xl lg:text-5xl font-medium text-white mb-4 leading-[1.15] tracking-[-0.02em]"
          style={{ fontFamily: 'var(--font-geist-sans), system-ui, -apple-system, sans-serif' }}
        >
          Réapprendre à apprendre.
          <br />
          <span className="text-white/80 text-2xl md:text-3xl lg:text-4xl font-light">Parce que la performance commence par le bien-être.</span>
        </motion.h1>

        {/* Subtitle - Compact */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.5, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
          className="text-sm md:text-base text-white/60 mb-8 max-w-2xl mx-auto leading-relaxed font-light"
          style={{ fontFamily: 'var(--font-geist-sans), system-ui, -apple-system, sans-serif', letterSpacing: '-0.01em' }}
        >
          Beyond est une expérience d'apprentissage pensée pour le cerveau humain.
          <br />
          <span className="text-white/50 text-xs md:text-sm">
            Ici, on n'accumule pas du savoir. On apprend à apprendre, à son rythme, dans le calme.
          </span>
        </motion.p>

        {/* CTA Buttons - Compact */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.5, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
          className="flex flex-col sm:flex-row items-center justify-center gap-3"
        >
          <Button
            asChild
            size="lg"
            className="bg-white text-[#0B0B0C] hover:bg-white/90 text-sm px-8 py-5 h-auto rounded-full font-medium transition-all duration-500 shadow-lg hover:shadow-xl"
            style={{ fontFamily: 'var(--font-geist-sans), system-ui, -apple-system, sans-serif' }}
          >
            <Link href="#philosophie">
              Découvrir Beyond
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
          <Button
            asChild
            size="lg"
            variant="outline"
            className="border border-white/20 text-white hover:bg-white/5 text-sm px-8 py-5 h-auto rounded-full font-medium transition-all duration-500 backdrop-blur-sm"
            style={{ fontFamily: 'var(--font-geist-sans), system-ui, -apple-system, sans-serif' }}
          >
            <Link href="/login">
              Demander une démo
            </Link>
          </Button>
        </motion.div>
      </div>

      {/* Scroll Indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.8 }}
        className="absolute bottom-12 left-1/2 transform -translate-x-1/2 z-10"
      >
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
          className="w-6 h-10 border border-white/20 rounded-full flex items-start justify-center p-2 backdrop-blur-sm"
        >
          <motion.div
            animate={{ y: [0, 14, 0] }}
            transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
            className="w-1 h-3 bg-white/40 rounded-full"
          />
        </motion.div>
      </motion.div>
    </section>
  );
}
