"use client";

import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowRight, BookOpen, FileText, Video, ChevronLeft, ChevronRight, Play } from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { cn } from "@/lib/utils";

type CatalogItem = {
  id: string;
  title: string;
  description: string | null;
  short_description: string | null;
  category: string | null;
  hero_image_url: string | null;
  thumbnail_url: string | null;
  item_type: "module" | "ressource" | "test";
  content_id: string;
};

export function ResourcesSection() {
  const router = useRouter();
  const [latestResources, setLatestResources] = useState<CatalogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const sliderRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadLatestResources();
  }, []);

  const loadLatestResources = async () => {
    try {
      const response = await fetch(
        `/api/catalogue?superAdminEmail=${encodeURIComponent("contentin.cabinet@gmail.com")}`,
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
      
      if (response.ok) {
        const data = await response.json();
        const items = data.items || [];
        // Prendre les 4-5 derniers contenus (les plus récents)
        const latest = items.slice(-5);
        setLatestResources(latest);
      }
    } catch (error) {
      console.error("[ResourcesSection] Erreur:", error);
    } finally {
      setLoading(false);
    }
  };

  const getItemUrl = (item: CatalogItem) => {
    if (item.item_type === "module") {
      return `/dashboard/catalogue/module/${item.content_id}`;
    } else if (item.item_type === "ressource") {
      return `/dashboard/catalogue/ressource/${item.content_id}`;
    } else if (item.item_type === "test") {
      return `/dashboard/catalogue/test/${item.content_id}`;
    }
    return "#";
  };

  const handleGoToResources = () => {
    router.push('/ressources');
  };

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev + 1) % Math.max(1, latestResources.length));
  };

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev - 1 + latestResources.length) % Math.max(1, latestResources.length));
  };

  // Auto-play du slider
  useEffect(() => {
    if (latestResources.length > 1) {
      const interval = setInterval(nextSlide, 5000);
      return () => clearInterval(interval);
    }
  }, [latestResources.length]);

  return (
    <motion.section
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6 }}
      className="py-20 bg-[#F8F5F0] mx-4 mb-4 rounded-2xl"
    >
      <div className="mx-auto max-w-7xl px-6">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Texte à gauche */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="space-y-6"
          >
            <div>
              <h2
                className="text-4xl md:text-5xl font-bold text-[#2F2A25] mb-4"
                style={{
                  fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif',
                }}
              >
                Mes Ressources
              </h2>
              <p
                className="text-lg md:text-xl text-[#2F2A25]/80 leading-relaxed"
                style={{
                  fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif',
                }}
              >
                Découvrez une collection de ressources pour vous accompagner dans votre développement personnel et professionnel.
              </p>
            </div>

            <div className="space-y-4">
              <div className="flex items-start gap-4">
                <div className="p-2 bg-[#E6D9C6]/30 rounded-lg">
                  <BookOpen className="h-6 w-6 text-[#C6A664]" />
                </div>
                <div>
                  <h3
                    className="text-lg font-semibold text-[#2F2A25] mb-1"
                    style={{
                      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif',
                    }}
                  >
                    Guides et documents
                  </h3>
                  <p className="text-[#2F2A25]/70 text-sm">
                    Accédez à des guides pratiques et des documents téléchargeables
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="p-2 bg-[#E6D9C6]/30 rounded-lg">
                  <Video className="h-6 w-6 text-[#C6A664]" />
                </div>
                <div>
                  <h3
                    className="text-lg font-semibold text-[#2F2A25] mb-1"
                    style={{
                      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif',
                    }}
                  >
                    Vidéos et formations
                  </h3>
                  <p className="text-[#2F2A25]/70 text-sm">
                    Explorez des contenus vidéo et des formations en ligne
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="p-2 bg-[#E6D9C6]/30 rounded-lg">
                  <FileText className="h-6 w-6 text-[#C6A664]" />
                </div>
                <div>
                  <h3
                    className="text-lg font-semibold text-[#2F2A25] mb-1"
                    style={{
                      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif',
                    }}
                  >
                    Ressources personnalisées
                  </h3>
                  <p className="text-[#2F2A25]/70 text-sm">
                    Des ressources adaptées à vos besoins spécifiques
                  </p>
                </div>
              </div>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="pt-4"
            >
              <Button
                onClick={handleGoToResources}
                size="lg"
                className="bg-[#C6A664] hover:bg-[#B88A44] text-white rounded-full px-8 py-6 text-lg transition-transform hover:scale-105"
                style={{
                  fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif',
                }}
              >
                Accéder aux ressources
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </motion.div>
          </motion.div>

          {/* Slider des dernières ressources à droite */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="relative"
          >
            {loading ? (
              <div className="relative rounded-2xl overflow-hidden shadow-2xl bg-gradient-to-br from-[#E6D9C6] to-[#C6A664] aspect-[4/3] flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
              </div>
            ) : latestResources.length > 0 ? (
              <div className="relative rounded-2xl overflow-hidden shadow-2xl aspect-[4/3]">
                {/* Slider */}
                <div className="relative w-full h-full">
                  {latestResources.map((resource, index) => (
                    <motion.div
                      key={resource.id}
                      initial={{ opacity: 0, x: 100 }}
                      animate={{ 
                        opacity: index === currentIndex ? 1 : 0,
                        x: index === currentIndex ? 0 : 100,
                        display: index === currentIndex ? 'block' : 'none'
                      }}
                      transition={{ duration: 0.5 }}
                      className={cn(
                        "absolute inset-0",
                        index === currentIndex ? "z-10" : "z-0"
                      )}
                    >
                      <Link href={getItemUrl(resource)}>
                        <div className="relative w-full h-full group cursor-pointer">
                          {/* Image de fond */}
                          {resource.hero_image_url || resource.thumbnail_url ? (
                            <Image
                              src={resource.hero_image_url || resource.thumbnail_url || ""}
                              alt={resource.title}
                              fill
                              className="object-cover transition-transform duration-300 group-hover:scale-110"
                              sizes="(max-width: 1024px) 100vw, 50vw"
                              unoptimized={false}
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.src = "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=800&q=80";
                              }}
                            />
                          ) : (
                            <div className="absolute inset-0 bg-gradient-to-br from-[#E6D9C6] to-[#C6A664]" />
                          )}
                          
                          {/* Overlay */}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/50 to-black/30" />
                          
                          {/* Contenu */}
                          <div className="absolute inset-0 flex flex-col justify-end p-6">
                            <div className="relative z-10">
                              {resource.category && (
                                <span className="inline-block px-3 py-1 bg-[#C6A664] text-white text-xs font-semibold rounded-full mb-3">
                                  {resource.category}
                                </span>
                              )}
                              <h3
                                className="text-2xl font-bold text-white mb-2 line-clamp-2"
                                style={{
                                  fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif',
                                  textShadow: '0 2px 10px rgba(0,0,0,0.5)',
                                }}
                              >
                                {resource.title}
                              </h3>
                              {(resource.short_description || resource.description) && (
                                <p
                                  className="text-white/90 text-sm line-clamp-2"
                                  style={{
                                    textShadow: '0 1px 5px rgba(0,0,0,0.5)',
                                  }}
                                >
                                  {resource.short_description || resource.description}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      </Link>
                    </motion.div>
                  ))}
                </div>

                {/* Boutons de navigation */}
                {latestResources.length > 1 && (
                  <>
                    <button
                      onClick={prevSlide}
                      className="absolute left-4 top-1/2 -translate-y-1/2 z-20 h-10 w-10 rounded-full bg-black/50 hover:bg-black/70 text-white flex items-center justify-center transition-all"
                      aria-label="Précédent"
                    >
                      <ChevronLeft className="h-5 w-5" />
                    </button>
                    <button
                      onClick={nextSlide}
                      className="absolute right-4 top-1/2 -translate-y-1/2 z-20 h-10 w-10 rounded-full bg-black/50 hover:bg-black/70 text-white flex items-center justify-center transition-all"
                      aria-label="Suivant"
                    >
                      <ChevronRight className="h-5 w-5" />
                    </button>

                    {/* Indicateurs */}
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex gap-2">
                      {latestResources.map((_, index) => (
                        <button
                          key={index}
                          onClick={() => setCurrentIndex(index)}
                          className={cn(
                            "h-2 rounded-full transition-all duration-300",
                            index === currentIndex ? "w-8 bg-[#C6A664]" : "w-2 bg-white/50 hover:bg-white/70"
                          )}
                          aria-label={`Aller à la ressource ${index + 1}`}
                        />
                      ))}
                    </div>
                  </>
                )}
              </div>
            ) : (
              <div className="relative rounded-2xl overflow-hidden shadow-2xl bg-gradient-to-br from-[#E6D9C6] to-[#C6A664] aspect-[4/3] flex items-center justify-center">
                <div className="text-center space-y-4">
                  <FileText className="h-16 w-16 text-white/50 mx-auto" />
                  <p className="text-white/80">
                    Aucune ressource disponible pour le moment
                  </p>
                </div>
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </motion.section>
  );
}
