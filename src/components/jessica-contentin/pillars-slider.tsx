"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronLeft, ChevronRight, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { env } from "@/lib/env";

// Fonction pour construire l'URL Supabase Storage
function getSupabaseStorageUrl(bucket: string, path: string): string {
  const supabaseUrl = 
    env.supabaseUrl || 
    (typeof window !== 'undefined' ? (window as any).__NEXT_DATA__?.env?.NEXT_PUBLIC_SUPABASE_URL : undefined) ||
    (typeof process !== 'undefined' ? process.env.NEXT_PUBLIC_SUPABASE_URL : undefined);
  
  if (!supabaseUrl) {
    return "";
  }
  
  const encodedBucket = encodeURIComponent(bucket);
  const pathParts = path.split('/');
  const encodedPath = pathParts.map(part => encodeURIComponent(part)).join('/');
  
  return `${supabaseUrl}/storage/v1/object/public/${encodedBucket}/${encodedPath}`;
}

const BUCKET_NAME = "Jessica CONTENTIN";

const pillars = [
  {
    id: "confiance",
    title: "Confiance en soi",
    description: "Développez votre estime de vous et révélez votre potentiel",
    image: getSupabaseStorageUrl(BUCKET_NAME, "Confiance_en_soi.jpg") || "https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=1200&q=80",
    href: "/jessica-contentin/specialites/confiance-en-soi",
  },
  {
    id: "stress",
    title: "Gestion du stress",
    description: "Apprenez à gérer votre stress et retrouvez votre sérénité",
    image: "https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=1200&q=80",
    href: "/jessica-contentin/specialites/gestion-stress",
  },
  {
    id: "tnd",
    title: "Accompagnement TND",
    description: "Un accompagnement spécialisé pour les troubles du neurodéveloppement",
    image: "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=1200&q=80",
    href: "/jessica-contentin/specialites/tnd",
  },
  {
    id: "neuroeducation",
    title: "Neuroéducation",
    description: "Comprendre le cerveau pour mieux apprendre et enseigner",
    image: getSupabaseStorageUrl(BUCKET_NAME, "Neuroeduction.jpg") || "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1200&q=80",
    href: "/jessica-contentin/specialites/neuroeducation",
  },
  {
    id: "strategie",
    title: "Stratégie d'apprentissage",
    description: "Développez des méthodes d'apprentissage efficaces et personnalisées",
    image: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=1200&q=80",
    href: "/jessica-contentin/specialites/strategie-apprentissage",
  },
  {
    id: "orientation",
    title: "Orientation scolaire",
    description: "Trouvez votre voie et construisez votre projet professionnel",
    image: getSupabaseStorageUrl(BUCKET_NAME, "parcoursup.jpg") || "https://images.unsplash.com/photo-1521737604893-d14cc237f11d?w=1200&q=80",
    href: "/jessica-contentin/specialites/orientation",
  },
];

export function PillarsSlider() {
  const [activeIndex, setActiveIndex] = useState(0);

  const nextPillar = () => {
    setActiveIndex((prev) => (prev + 1) % pillars.length);
  };

  const prevPillar = () => {
    setActiveIndex((prev) => (prev - 1 + pillars.length) % pillars.length);
  };

  const goToPillar = (index: number) => {
    setActiveIndex(index);
  };

  const activePillar = pillars[activeIndex];

  return (
    <motion.section
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6 }}
      className="relative bg-white py-20 mx-4 mb-4 rounded-2xl"
    >
      <div className="mx-auto max-w-7xl px-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mb-12 text-left"
        >
          <p className="text-sm uppercase tracking-wider text-[#C6A664] mb-2">Mes domaines d'expertise</p>
        </motion.div>

        {/* Slider */}
        <div className="grid lg:grid-cols-2 gap-8 items-center">
          {/* Left: Text Content */}
          <div className="space-y-6">
            {/* Active Pillar Title */}
            <AnimatePresence mode="wait">
              <motion.div
                key={activeIndex}
                initial={{ opacity: 0, x: -50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 50 }}
                transition={{ duration: 0.5 }}
                className="space-y-4"
              >
                <h3
                  className="text-5xl lg:text-6xl font-bold text-[#2F2A25]"
                  style={{
                    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif',
                  }}
                >
                  {activePillar.title}
                </h3>
                <p
                  className="text-xl text-[#2F2A25]/70 leading-relaxed"
                  style={{
                    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif',
                  }}
                >
                  {activePillar.description}
                </p>
              </motion.div>
            </AnimatePresence>

            {/* Pillar List */}
            <div className="space-y-2">
              {pillars.map((pillar, index) => (
                <motion.button
                  key={pillar.id}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: index * 0.1 }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => goToPillar(index)}
                  className={cn(
                    "w-full flex items-center justify-between p-4 rounded-lg transition-all duration-300 text-left group",
                    index === activeIndex
                      ? "bg-[#C6A664] text-white"
                      : "bg-[#F8F5F0] text-[#2F2A25] hover:bg-[#E6D9C6]"
                  )}
                >
                  <span
                    className={cn(
                      "text-lg font-medium transition-all duration-300",
                      index === activeIndex ? "text-white" : "text-[#2F2A25]"
                    )}
                    style={{
                      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif',
                    }}
                  >
                    {pillar.title}
                  </span>
                  {index === activeIndex && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.3 }}
                    >
                      <Button
                        asChild
                        variant="outline"
                        size="sm"
                        className="bg-white/20 border-white/30 text-white hover:bg-white/30 rounded-full"
                      >
                        <Link href={pillar.href}>
                          Explorer <ArrowRight className="ml-1 h-4 w-4 inline" />
                        </Link>
                      </Button>
                    </motion.div>
                  )}
                </motion.button>
              ))}
            </div>
          </div>

          {/* Right: Image */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="relative h-[600px] rounded-2xl overflow-hidden shadow-2xl"
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={activeIndex}
                initial={{ opacity: 0, scale: 1.1 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.5 }}
                className="relative w-full h-full"
              >
                <Image
                  src={activePillar.image}
                  alt={activePillar.title}
                  fill
                  className="object-cover"
                  priority
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    // Fallback vers une image par défaut si l'image Supabase ne charge pas
                    if (!target.src.includes('unsplash')) {
                      target.src = "https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=1200&q=80";
                    }
                  }}
                />
              </motion.div>
            </AnimatePresence>
          </motion.div>
        </div>

        {/* Navigation Arrows */}
        <div className="flex items-center justify-center gap-4 mt-12">
          <button
            onClick={prevPillar}
            className="p-3 rounded-full bg-[#F8F5F0] hover:bg-[#E6D9C6] text-[#2F2A25] transition-colors"
            aria-label="Précédent"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
          <div className="flex gap-2">
            {pillars.map((_, index) => (
              <button
                key={index}
                onClick={() => goToPillar(index)}
                className={cn(
                  "h-2 rounded-full transition-all duration-300",
                  index === activeIndex ? "w-8 bg-[#C6A664]" : "w-2 bg-[#E6D9C6]"
                )}
                aria-label={`Aller à ${pillars[index].title}`}
              />
            ))}
          </div>
          <button
            onClick={nextPillar}
            className="p-3 rounded-full bg-[#F8F5F0] hover:bg-[#E6D9C6] text-[#2F2A25] transition-colors"
            aria-label="Suivant"
          >
            <ChevronRight className="h-6 w-6" />
          </button>
        </div>
      </div>
    </motion.section>
  );
}

