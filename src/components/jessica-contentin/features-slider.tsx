"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { env } from "@/lib/env";
import { cn } from "@/lib/utils";

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

type FeatureSlide = {
  id: string;
  title: string;
  description: string;
  videoPath: string; // Chemin de la vidéo dans Supabase Storage
};

const features: FeatureSlide[] = [
  {
    id: "1",
    title: "Accompagnement personnalisé",
    description: "Un suivi adapté à vos besoins spécifiques pour vous aider à atteindre vos objectifs et révéler votre potentiel.",
    videoPath: "Design sans titre (2).mp4", // Vidéo dans Supabase Storage
  },
  {
    id: "2",
    title: "Expertise en neuroéducation",
    description: "Des méthodes basées sur les dernières recherches en neurosciences pour optimiser l'apprentissage et le développement.",
    videoPath: "Design sans titre (2).mp4", // Vidéo dans Supabase Storage
  },
  {
    id: "3",
    title: "Approche bienveillante",
    description: "Un espace d'écoute et de compréhension où chaque individu est valorisé et accompagné avec respect et empathie.",
    videoPath: "Design sans titre (2).mp4", // Vidéo dans Supabase Storage
  },
];

export function FeaturesSlider() {
  const [currentIndex, setCurrentIndex] = useState(0);

  // Auto-play du slider
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % features.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev + 1) % features.length);
  };

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev - 1 + features.length) % features.length);
  };

  const currentFeature = features[currentIndex];
  const videoUrl = getSupabaseStorageUrl(BUCKET_NAME, currentFeature.videoPath);

  return (
    <section className="py-20 bg-[#2F2A25] relative overflow-hidden">
      <div className="mx-auto max-w-7xl px-6">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Texte à gauche */}
          <div className="relative z-10">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentIndex}
                initial={{ opacity: 0, x: -50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 50 }}
                transition={{ duration: 0.5 }}
                className="space-y-6"
              >
                <h2
                  className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-6 leading-tight"
                  style={{
                    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif',
                  }}
                >
                  {currentFeature.title}
                </h2>
                <p
                  className="text-lg md:text-xl text-white/90 leading-relaxed"
                  style={{
                    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif',
                  }}
                >
                  {currentFeature.description}
                </p>
              </motion.div>
            </AnimatePresence>

            {/* Indicateurs */}
            <div className="flex gap-2 mt-8">
              {features.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentIndex(index)}
                  className={cn(
                    "h-1 rounded-full transition-all duration-300",
                    index === currentIndex ? "w-8 bg-[#C6A664]" : "w-1 bg-white/30 hover:bg-white/50"
                  )}
                  aria-label={`Aller au slide ${index + 1}`}
                />
              ))}
            </div>
          </div>

          {/* MacBook Pro avec vidéo à droite - Style Tony Robbins */}
          <div className="relative">
            <motion.div
              key={currentIndex}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
              className="relative"
            >
              {/* MacBook Pro - Design réaliste style Tony Robbins */}
              <div className="relative mx-auto" style={{ maxWidth: "700px" }}>
                {/* Container avec légère perspective */}
                <div className="relative" style={{ transform: "perspective(1200px) rotateX(2deg)" }}>
                  {/* Écran (partie supérieure) */}
                  <div className="relative">
                    {/* Top bezel avec notch - Style MacBook Pro Space Gray */}
                    <div className="relative bg-[#2d2d2d] rounded-t-[16px] pt-3 pb-2 px-4 shadow-2xl border border-black/20">
                      {/* Notch MacBook Pro - Plus réaliste */}
                      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-5 bg-[#2d2d2d] rounded-b-[8px] z-10 border-x border-black/20">
                        <div className="absolute top-0.5 left-1/2 -translate-x-1/2 w-14 h-1 bg-black/40 rounded-full"></div>
                      </div>
                      {/* Window controls macOS */}
                      <div className="flex gap-1.5 justify-start relative z-20 pt-1">
                        <div className="w-2.5 h-2.5 rounded-full bg-[#ff5f57] shadow-sm"></div>
                        <div className="w-2.5 h-2.5 rounded-full bg-[#ffbd2e] shadow-sm"></div>
                        <div className="w-2.5 h-2.5 rounded-full bg-[#28ca42] shadow-sm"></div>
                      </div>
                    </div>

                    {/* Écran avec vidéo */}
                    <div className="relative bg-[#2d2d2d] px-[1px] pb-[1px]">
                      <div className="relative aspect-[16/10] bg-black rounded-b-[4px] overflow-hidden shadow-inner border border-black/50">
                        {/* Vidéo dans l'écran */}
                        {videoUrl ? (
                          <video
                            src={videoUrl}
                            autoPlay
                            loop
                            muted
                            playsInline
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-[#1a1a1a] to-black flex items-center justify-center">
                            <p className="text-white/50 text-sm">Vidéo en chargement...</p>
                          </div>
                        )}
                        {/* Bordure intérieure pour effet d'écran */}
                        <div className="absolute inset-0 border border-black/40 pointer-events-none rounded-b-[4px]"></div>
                      </div>
                    </div>

                    {/* Hinge (charnière) - Fine ligne */}
                    <div className="relative h-1 bg-gradient-to-b from-[#2d2d2d] to-[#1a1a1a] mx-12">
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/3 to-transparent"></div>
                    </div>
                  </div>

                  {/* Base (clavier/trackpad) - Style Space Gray */}
                  <div className="relative mt-1">
                    {/* Base principale */}
                    <div className="relative h-6 bg-gradient-to-b from-[#2d2d2d] via-[#1a1a1a] to-[#2d2d2d] rounded-b-[16px] shadow-2xl border border-black/20">
                      {/* Ligne de séparation subtile */}
                      <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/5 to-transparent"></div>
                      
                      {/* Trackpad - Plus réaliste */}
                      <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-40 h-18 bg-gradient-to-b from-[#3a3a3a] via-[#2d2d2d] to-[#3a3a3a] rounded-[8px] border border-black/50 shadow-inner">
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="w-24 h-14 bg-black/20 rounded-md border border-black/30"></div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Ombres réalistes pour effet 3D */}
                <div className="absolute -inset-6 bg-gradient-to-br from-white/2 via-transparent to-transparent rounded-[20px] -z-10 blur-xl"></div>
                <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-2/3 h-6 bg-black/30 rounded-full blur-lg -z-10"></div>
              </div>
            </motion.div>

            {/* Boutons de navigation */}
            <button
              onClick={prevSlide}
              className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 lg:-translate-x-12 h-12 w-12 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white flex items-center justify-center transition-all z-20"
              aria-label="Précédent"
            >
              <ChevronLeft className="h-6 w-6" />
            </button>
            <button
              onClick={nextSlide}
              className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 lg:translate-x-12 h-12 w-12 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white flex items-center justify-center transition-all z-20"
              aria-label="Suivant"
            >
              <ChevronRight className="h-6 w-6" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

