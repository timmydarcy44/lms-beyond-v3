"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { Button } from "@/components/ui/button";

const heroVisuals = [
  {
    id: "1",
    title: "AI Creative Studio",
    description: "Maîtrisez la création de contenus immersifs avec l'intelligence artificielle.",
    cta: "Découvrir",
    image: "https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=1200&q=80",
  },
  {
    id: "2",
    title: "Leadership 3.0",
    description: "Les clés d'un management inspirant, inspiré de Nike et Apple.",
    cta: "Commencer",
    image: "https://images.unsplash.com/photo-1529336953121-4970b11f3264?auto=format&fit=crop&w=1200&q=80",
  },
];

export const HeroBanner = () => {
  const visual = heroVisuals[0];

  return (
    <motion.section
      className="relative overflow-hidden rounded-[32px] bg-gradient-to-br from-white/10 via-white/5 to-white/0"
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
    >
      <div className="absolute inset-0">
        <Image
          src={visual.image}
          alt={visual.title}
          fill
          className="object-cover opacity-80"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/60 to-transparent" />
      </div>
      <div className="relative flex flex-col gap-6 p-10 text-white md:p-16">
        <div className="max-w-xl space-y-4">
          <p className="text-sm uppercase tracking-[0.4em] text-white/60">
            Programme premium
          </p>
          <h2 className="text-3xl font-semibold leading-tight md:text-5xl">
            {visual.title}
          </h2>
          <p className="text-base text-white/70 md:text-lg">{visual.description}</p>
        </div>
        <div className="flex items-center gap-4">
          <Button size="lg" className="rounded-full bg-white text-black hover:bg-white/80">
            {visual.cta}
          </Button>
          <Button
            size="lg"
            variant="outline"
            className="rounded-full border-white/40 text-white hover:bg-white/10"
          >
            Ajouter à ma liste
          </Button>
        </div>
      </div>
    </motion.section>
  );
};










