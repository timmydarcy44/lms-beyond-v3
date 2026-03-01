"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight, ChevronLeft, ChevronRight, BookOpen } from "lucide-react";

type Formation = {
  id: string;
  title: string;
  description?: string;
  cover_image?: string;
  price?: number;
  item_type: string;
};

export function FormationsSlider() {
  const [formations, setFormations] = useState<Formation[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const blue = "#006CFF";
  const gold = "#D4AF37";

  useEffect(() => {
    async function fetchFormations() {
      try {
        console.log("[FormationsSlider] Fetching formations from API...");
        const response = await fetch("/api/beyond-center/formations");
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          console.error("[FormationsSlider] API error:", response.status, errorData);
          throw new Error(`Failed to fetch formations: ${response.status}`);
        }
        
        const data = await response.json();
        console.log("[FormationsSlider] Received data:", data);
        setFormations(data.formations || []);
      } catch (error) {
        console.error("[FormationsSlider] Error fetching formations:", error);
        // Même en cas d'erreur, on arrête le chargement pour ne pas bloquer l'UI
        setFormations([]);
      } finally {
        setIsLoading(false);
      }
    }

    fetchFormations();
  }, []);

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev + 1) % Math.max(1, formations.length - 2));
  };

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev - 1 + Math.max(1, formations.length - 2)) % Math.max(1, formations.length - 2));
  };

  if (isLoading) {
    return (
      <div className="py-32 bg-black">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center text-white/60 font-light">
            Chargement des formations...
          </div>
        </div>
      </div>
    );
  }

  if (formations.length === 0) {
    return null;
  }

  // Afficher 3 formations à la fois sur desktop
  const visibleCount = 3;
  const maxIndex = Math.max(0, formations.length - visibleCount);

  return (
    <section className="py-32 bg-white border-t border-gray-200">
      <div className="max-w-7xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <h2 
              className="text-6xl md:text-7xl font-light mb-6 leading-[1.05] tracking-tight text-black"
              style={{ 
                fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif',
                letterSpacing: '-0.03em',
                fontWeight: 300
              }}
            >
              Découvrez nos formations
              <br />
              <span className="font-light" style={{ color: blue }}>Beyond No School</span>
            </h2>
            <p 
              className="text-xl text-gray-600 font-light max-w-2xl mx-auto"
              style={{ 
                fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif'
              }}
            >
              Développez vos compétences avec nos formations en ligne
            </p>
        </motion.div>

        {/* Slider */}
        <div className="relative">
          {/* Boutons de navigation */}
          {formations.length > visibleCount && (
            <>
              <button
                onClick={prevSlide}
                className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 z-10 w-12 h-12 rounded-full border border-white/20 bg-black/80 backdrop-blur-sm text-white hover:bg-white/10 hover:border-[#006CFF] transition-all duration-300 flex items-center justify-center"
                aria-label="Formation précédente"
              >
                <ChevronLeft className="h-6 w-6" />
              </button>
              <button
                onClick={nextSlide}
                className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 z-10 w-12 h-12 rounded-full border border-white/20 bg-black/80 backdrop-blur-sm text-white hover:bg-white/10 hover:border-[#006CFF] transition-all duration-300 flex items-center justify-center"
                aria-label="Formation suivante"
              >
                <ChevronRight className="h-6 w-6" />
              </button>
            </>
          )}

          {/* Container du slider */}
          <div className="overflow-hidden">
            <motion.div
              className="flex gap-6"
              animate={{
                x: `-${currentIndex * (100 / visibleCount)}%`,
              }}
              transition={{
                type: "spring",
                stiffness: 300,
                damping: 30,
              }}
            >
              {formations.map((formation, index) => (
                <motion.div
                  key={formation.id}
                  className="flex-shrink-0 w-full md:w-1/3"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  whileHover={{ y: -8 }}
                >
                  <Link href={`/dashboard/catalogue/module/${formation.id}`}>
                    <div className="group relative flex aspect-video w-full overflow-hidden rounded-xl border border-black/10 bg-black/90 transition-all duration-500 cursor-pointer md:hover:z-10 md:hover:scale-105 md:hover:border-[#D4AF37] md:hover:shadow-[0_20px_60px_-24px_rgba(212,175,55,0.4)]">
                      {/* Image de couverture */}
                      {formation.cover_image ? (
                        <Image
                          src={formation.cover_image}
                          alt={formation.title}
                          fill
                          className="object-cover transition-transform duration-500 group-hover:scale-110"
                        />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-white/10 via-white/5 to-transparent">
                          <BookOpen className="h-16 w-16" style={{ color: gold, opacity: 0.6 }} />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
                      <div className="absolute right-3 top-3 flex flex-col gap-2 text-[11px] text-white/80">
                        <span className="rounded-full border border-white/20 bg-black/50 px-2 py-1 backdrop-blur">
                          Formation
                        </span>
                        <span className="rounded-full border border-white/20 bg-black/50 px-2 py-1 backdrop-blur">
                          {formation.price !== undefined && formation.price > 0
                            ? `${formation.price.toFixed(2)} €`
                            : "Gratuit"}
                        </span>
                      </div>
                      <div className="absolute inset-x-0 bottom-0 space-y-1 bg-gradient-to-t from-black/80 via-black/40 to-transparent px-4 pb-4 pt-10">
                        <p className="text-[11px] uppercase tracking-[0.2em] text-[#999]">
                          Beyond No School
                        </p>
                        <p className="text-sm font-semibold text-white line-clamp-2">{formation.title}</p>
                        {formation.description ? (
                          <p className="text-[11px] text-white/70 line-clamp-2">{formation.description}</p>
                        ) : null}
                      </div>
                      <div className="absolute bottom-0 left-0 h-[2px] w-full bg-white/10">
                        <div className="h-[2px] w-0 bg-[#D4AF37] transition-all duration-500 group-hover:w-full" />
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </motion.div>
          </div>

          {/* Indicateurs de pagination */}
          {formations.length > visibleCount && (
            <div className="flex items-center justify-center gap-2 mt-8">
              {Array.from({ length: maxIndex + 1 }).map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentIndex(index)}
                  className={`h-2 rounded-full transition-all duration-300 ${
                    index === currentIndex
                      ? "w-8"
                      : "w-2"
                  }`}
                  style={{
                    backgroundColor: index === currentIndex ? blue : "rgba(255, 255, 255, 0.2)",
                  }}
                  aria-label={`Aller à la page ${index + 1}`}
                />
              ))}
            </div>
          )}
        </div>

        {/* CTA pour voir toutes les formations */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="text-center mt-12"
        >
          <Link href="/dashboard/catalogue">
            <Button 
              variant="outline"
              className="border border-gray-300 text-black hover:bg-gray-50 px-8 py-6 font-light rounded-full transition-all duration-300"
            >
              Voir toutes les formations
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </motion.div>
      </div>
    </section>
  );
}

