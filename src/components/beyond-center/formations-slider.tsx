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
  const white = "#FFFFFF";
  const black = "#000000";

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
                    <div className="group relative h-full bg-white border border-gray-200 rounded-2xl overflow-hidden hover:border-[#006CFF] hover:shadow-[0_0_30px_rgba(0,108,255,0.2)] transition-all duration-500 cursor-pointer">
                      {/* Image de couverture */}
                      <div className="relative h-48 w-full overflow-hidden">
                        {formation.cover_image ? (
                          <Image
                            src={formation.cover_image}
                            alt={formation.title}
                            fill
                            className="object-cover group-hover:scale-110 transition-transform duration-500"
                          />
                        ) : (
                          <div 
                            className="w-full h-full flex items-center justify-center"
                            style={{ backgroundColor: `${blue}20` }}
                          >
                            <BookOpen className="h-16 w-16" style={{ color: blue, opacity: 0.5 }} />
                          </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
                      </div>

                      {/* Contenu */}
                      <div className="p-6">
                        <h3 
                          className="text-2xl font-light mb-3 text-black line-clamp-2"
                          style={{ 
                            fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif',
                            letterSpacing: '-0.02em'
                          }}
                        >
                          {formation.title}
                        </h3>
                        {formation.description && (
                          <p 
                            className="text-sm text-gray-600 font-light mb-4 line-clamp-2"
                            style={{ 
                              fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif'
                            }}
                          >
                            {formation.description}
                          </p>
                        )}
                        <div className="flex items-center justify-between">
                          {formation.price !== undefined && formation.price > 0 ? (
                            <span 
                              className="text-lg font-light"
                              style={{ color: blue }}
                            >
                              {formation.price.toFixed(2)} €
                            </span>
                          ) : (
                            <span 
                              className="text-sm font-light text-gray-400"
                            >
                              Gratuit
                            </span>
                          )}
                          <div className="flex items-center gap-2 text-gray-600 group-hover:text-[#006CFF] transition-colors">
                            <span className="text-sm font-light">Découvrir</span>
                            <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                          </div>
                        </div>
                      </div>

                      {/* Ligne bleue animée au hover */}
                      <div 
                        className="absolute bottom-0 left-0 right-0 h-px w-0 group-hover:w-full transition-all duration-500"
                        style={{ backgroundColor: blue }}
                      />
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

