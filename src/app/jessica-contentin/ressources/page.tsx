"use client";

import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BookOpen, FileText, Video, ArrowRight, ChevronLeft, ChevronRight, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import Image from "next/image";
import { cn } from "@/lib/utils";

type CatalogItem = {
  id: string;
  title: string;
  description: string | null;
  short_description: string | null;
  price: number;
  is_free: boolean;
  category: string | null;
  hero_image_url: string | null;
  thumbnail_url: string | null;
  item_type: "module" | "ressource" | "test";
  content_id: string;
};

export default function RessourcesPage() {
  const [showWelcome, setShowWelcome] = useState(false);
  const [showContent, setShowContent] = useState(false);
  const [catalogItems, setCatalogItems] = useState<CatalogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [heroIndex, setHeroIndex] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const sliderRefs = useRef<Record<string, HTMLDivElement | null>>({});

  useEffect(() => {
    // Charger les ressources immédiatement
    loadResources();
    
    // Afficher le contenu rapidement (réduire l'animation de bienvenue)
    const timer = setTimeout(() => {
      setShowWelcome(true);
    }, 50);

    // Afficher le contenu après une animation très courte
    const contentTimer = setTimeout(() => {
      setShowContent(true);
    }, 800); // Réduit de 2000ms à 800ms

    return () => {
      clearTimeout(timer);
      clearTimeout(contentTimer);
    };
  }, []);

  // Auto-play du slider hero
  useEffect(() => {
    if (showContent && catalogItems.length > 0) {
      const featured = catalogItems
        .filter((item) => item.hero_image_url || item.thumbnail_url)
        .slice(0, 3);
      if (featured.length > 1) {
        const interval = setInterval(() => {
          setHeroIndex((prev) => (prev + 1) % featured.length);
        }, 5000); // Change toutes les 5 secondes
        return () => clearInterval(interval);
      }
    }
  }, [showContent, catalogItems]);

  const loadResources = async () => {
    try {
      // Récupérer les items du catalogue pour Jessica Contentin
      // L'API détectera automatiquement le tenant depuis les headers
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
        
        // Vérification supplémentaire côté client : filtrer uniquement les items de Jessica Contentin
        // Récupérer l'ID de Jessica Contentin pour vérification
        const jessicaEmail = "contentin.cabinet@gmail.com";
        const filteredItems = items.filter((item: any) => {
          // Si l'item a un creator_id, on le garde (l'API devrait déjà avoir filtré)
          // Sinon, on vérifie via l'email si nécessaire
          return item.creator_id; // L'API devrait déjà avoir filtré correctement
        });
        
        setCatalogItems(filteredItems);
        console.log("[RessourcesPage] Items chargés:", filteredItems.length, "sur", items.length, "totaux");
        
        if (filteredItems && filteredItems.length > 0) {
          console.log("[RessourcesPage] Premier item:", {
            title: filteredItems[0].title,
            creator_id: (filteredItems[0] as any).creator_id,
            category: filteredItems[0].category,
          });
          
          // Vérifier s'il y a des items avec un creator_id différent
          const uniqueCreatorIds = [...new Set(filteredItems.map((item: any) => item.creator_id))];
          if (uniqueCreatorIds.length > 1) {
            console.warn("[RessourcesPage] ⚠️ Multiple creator_ids found:", uniqueCreatorIds);
          }
        }
      } else {
        console.error("[RessourcesPage] Erreur lors du chargement des ressources");
      }
    } catch (error) {
      console.error("[RessourcesPage] Erreur:", error);
    } finally {
      setLoading(false);
    }
  };

  const getItemUrl = (item: CatalogItem) => {
    if (item.item_type === "module") {
      // Pour les modules de Jessica, utiliser la route formations avec l'interface apprenant
      return `/formations/${item.content_id}`;
    } else if (item.item_type === "ressource") {
      // Utiliser la route ressources pour Jessica Contentin
      return `/ressources/${item.content_id}`;
    } else if (item.item_type === "test") {
      return `/dashboard/catalogue/test/${item.content_id}`;
    }
    return "#";
  };

  // Ressources mises en avant pour le hero (2-3 premières avec images)
  const featuredItems = catalogItems
    .filter((item) => item.hero_image_url || item.thumbnail_url)
    .slice(0, 3);

  // Grouper les ressources par catégorie
  const itemsByCategory = catalogItems.reduce((acc, item) => {
    const category = item.category || "Autres";
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(item);
    return acc;
  }, {} as Record<string, CatalogItem[]>);

  // Catégories dans l'ordre souhaité
  const categoryOrder = ["DYS", "TDAH", "Guidance parentale", "Apprentissage", "Neuropsychologie", "Troubles de l'apprentissage", "Parentalité", "Éducation", "Soft skills"];
  const sortedCategories = [
    ...categoryOrder.filter((cat) => itemsByCategory[cat]?.length > 0),
    ...Object.keys(itemsByCategory).filter((cat) => !categoryOrder.includes(cat) && itemsByCategory[cat]?.length > 0),
  ];

  // Filtrer les catégories affichées si une catégorie est sélectionnée
  const displayedCategories = selectedCategory 
    ? sortedCategories.filter(cat => cat === selectedCategory)
    : sortedCategories;

  // Fonction pour scroller vers une catégorie
  const scrollToCategory = (category: string) => {
    setSelectedCategory(category);
    // Attendre un peu pour que le DOM se mette à jour
    setTimeout(() => {
      const element = document.getElementById(`category-${category}`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);
  };

  // Fonction pour scroller horizontalement dans un slider
  const scrollSlider = (category: string, direction: "left" | "right") => {
    const slider = sliderRefs.current[category];
    if (!slider) return;
    const scrollAmount = slider.clientWidth * 0.8;
    slider.scrollBy({
      left: direction === "left" ? -scrollAmount : scrollAmount,
      behavior: "smooth",
    });
  };

  return (
    <div className="relative min-h-screen overflow-hidden">
        {/* Animation effet sable */}
        <AnimatePresence>
          {showWelcome && !showContent && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5 }}
              className="fixed inset-0 z-50 flex items-center justify-center bg-[#F8F5F0]"
            >
              {/* Effet de particules/sable */}
              <div className="absolute inset-0 overflow-hidden">
                {typeof window !== 'undefined' && [...Array(50)].map((_, i) => {
                  const width = window.innerWidth || 1920;
                  const height = window.innerHeight || 1080;
                  return (
                    <motion.div
                      key={i}
                      className="absolute w-1 h-1 bg-[#C6A664] rounded-full"
                      initial={{
                        x: Math.random() * width,
                        y: Math.random() * height,
                        opacity: 0,
                      }}
                      animate={{
                        y: [null, Math.random() * height],
                        opacity: [0, 0.6, 0],
                        scale: [0, 1, 0],
                      }}
                      transition={{
                        duration: 2 + Math.random() * 2,
                        repeat: Infinity,
                        delay: Math.random() * 2,
                      }}
                    />
                  );
                })}
              </div>

              {/* Texte "Bienvenue" */}
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                transition={{
                  type: "spring",
                  stiffness: 200,
                  damping: 15,
                  delay: 0.3,
                }}
                className="relative z-10 text-center"
              >
                <motion.h1
                  initial={{ y: 50, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.5, duration: 0.8 }}
                  className="text-6xl md:text-8xl font-bold text-[#2F2A25] mb-4"
                  style={{
                    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif',
                  }}
                >
                  Bienvenue
                </motion.h1>
                <motion.p
                  initial={{ y: 30, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.7, duration: 0.8 }}
                  className="text-xl md:text-2xl text-[#2F2A25]/80"
                  style={{
                    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif',
                  }}
                >
                  Dans mes ressources
                </motion.p>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Contenu principal */}
        <AnimatePresence>
          {showContent && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6 }}
              className="pb-20"
            >
              {/* Section "Vous êtes" avec filtres par catégorie */}
              <section className="py-8 mx-4 mb-6">
                <div className="mx-auto max-w-7xl px-6">
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="bg-white rounded-2xl shadow-md p-6 border border-[#E6D9C6]"
                  >
                    <h2
                      className="text-xl font-semibold text-[#2F2A25] mb-4"
                      style={{
                        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif',
                      }}
                    >
                      Comment puis-je vous aider ?
                    </h2>
                    <div className="flex flex-wrap gap-3">
                      <button
                        onClick={() => {
                          setSelectedCategory(null);
                          window.scrollTo({ top: 0, behavior: 'smooth' });
                        }}
                        className={cn(
                          "px-4 py-2 rounded-full text-sm font-medium transition-all",
                          selectedCategory === null
                            ? "bg-[#C6A664] text-white shadow-md"
                            : "bg-[#E6D9C6]/50 text-[#2F2A25] hover:bg-[#E6D9C6]"
                        )}
                        style={{
                          fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif',
                        }}
                      >
                        Tous
                      </button>
                      {sortedCategories.map((category) => (
                        <button
                          key={category}
                          onClick={() => scrollToCategory(category)}
                          className={cn(
                            "px-4 py-2 rounded-full text-sm font-medium transition-all",
                            selectedCategory === category
                              ? "bg-[#C6A664] text-white shadow-md"
                              : "bg-[#E6D9C6]/50 text-[#2F2A25] hover:bg-[#E6D9C6]"
                          )}
                          style={{
                            fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif',
                          }}
                        >
                          {category}
                        </button>
                      ))}
                    </div>
                  </motion.div>
                </div>
              </section>

              {/* Hero Section avec Slider */}
              {featuredItems.length > 0 && (
                <section className="relative h-[60vh] min-h-[500px] max-h-[700px] overflow-hidden mx-4 mb-4 rounded-2xl shadow-lg">
                  <AnimatePresence mode="wait">
                    {featuredItems.map((item, index) => {
                      if (index !== heroIndex) return null;
                      return (
                        <motion.div
                          key={item.id}
                          initial={{ opacity: 0, x: 100 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -100 }}
                          transition={{ duration: 0.5 }}
                          className="absolute inset-0"
                        >
                          <div className="relative w-full h-full">
                            {(item.hero_image_url || item.thumbnail_url) ? (
                              <Image
                                src={item.hero_image_url || item.thumbnail_url || ""}
                                alt={item.title}
                                fill
                                priority={index === 0}
                                quality={85}
                                className="object-cover"
                                sizes="100vw"
                                unoptimized={false}
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement;
                                  target.src = "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=1920&q=80";
                                }}
                              />
                            ) : (
                              <div className="absolute inset-0 bg-gradient-to-br from-[#E6D9C6] to-[#C6A664]" />
                            )}
                            <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/60 to-black/50" />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
                          </div>
                          
                          {/* Badge catégorie en haut */}
                          {item.category && (
                            <div className="absolute top-6 left-6 z-30">
                              <motion.span
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.1 }}
                                className="inline-block px-4 py-2 bg-[#C6A664] text-white text-sm font-semibold rounded-full shadow-2xl"
                                style={{
                                  fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif',
                                }}
                              >
                                {item.category}
                              </motion.span>
                            </div>
                          )}

                          {/* Contenu du hero */}
                          <div className="absolute inset-0 z-20 flex flex-col justify-end px-6 lg:px-16 pb-12">
                            <div className="max-w-3xl relative">
                              <motion.h1
                                initial={{ opacity: 0, y: 30 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.2 }}
                                className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4 leading-tight drop-shadow-2xl"
                                style={{
                                  fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif',
                                  textShadow: '0 4px 30px rgba(0,0,0,0.8), 0 2px 10px rgba(0,0,0,0.6)',
                                }}
                              >
                                {item.title}
                              </motion.h1>
                              <motion.p
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.3 }}
                                className="text-lg md:text-xl text-white mb-6 line-clamp-2 drop-shadow-lg"
                                style={{
                                  fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif',
                                  textShadow: '0 2px 15px rgba(0,0,0,0.7), 0 1px 5px rgba(0,0,0,0.5)',
                                }}
                              >
                                {item.short_description || item.description || ""}
                              </motion.p>
                              <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.4 }}
                                className="flex flex-wrap gap-4 z-30 relative"
                              >
                                <Link href={getItemUrl(item)}>
                                  <Button
                                    size="lg"
                                    className="bg-[#C6A664] hover:bg-[#B88A44] text-white rounded-full px-8 py-6 text-lg shadow-2xl transition-transform hover:scale-105"
                                    style={{
                                      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif',
                                    }}
                                  >
                                    <Play className="mr-2 h-5 w-5" />
                                    Découvrir
                                  </Button>
                                </Link>
                                <Link href="/quiz">
                                  <Button
                                    size="lg"
                                    variant="outline"
                                    className="bg-white/20 hover:bg-white/30 backdrop-blur-md border-2 border-white text-white rounded-full px-8 py-6 text-lg shadow-2xl transition-transform hover:scale-105"
                                    style={{
                                      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif',
                                    }}
                                  >
                                    Commencer maintenant
                                    <ArrowRight className="ml-2 h-5 w-5" />
                                  </Button>
                                </Link>
                              </motion.div>
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>

                  {/* Indicateurs du slider */}
                  {featuredItems.length > 1 && (
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex gap-2">
                      {featuredItems.map((_, index) => (
                        <button
                          key={index}
                          onClick={() => setHeroIndex(index)}
                          className={cn(
                            "h-2 rounded-full transition-all duration-300",
                            index === heroIndex ? "w-8 bg-[#C6A664]" : "w-2 bg-white/50 hover:bg-white/70"
                          )}
                          aria-label={`Aller à la ressource ${index + 1}`}
                        />
                      ))}
                    </div>
                  )}
                </section>
              )}

              {/* Sliders par catégorie - Style Netflix */}
              <div className="space-y-8 mt-8 px-6 lg:px-16">
                {loading && catalogItems.length === 0 ? (
                  <div className="space-y-6">
                    {/* Skeleton loaders */}
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="space-y-4">
                        <div className="h-8 w-48 bg-[#E6D9C6] rounded animate-pulse" />
                        <div className="flex gap-4 overflow-hidden">
                          {[1, 2, 3, 4].map((j) => (
                            <div key={j} className="flex-shrink-0 w-[280px] md:w-[320px] aspect-video bg-[#E6D9C6] rounded-lg animate-pulse" />
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : displayedCategories.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-[#2F2A25]/70 mb-4">
                      Aucune ressource disponible pour le moment.
                    </p>
                    <p className="text-sm text-[#2F2A25]/60">
                      Les ressources seront bientôt disponibles.
                    </p>
                  </div>
                ) : (
                  displayedCategories.map((category, categoryIndex) => {
                    const items = itemsByCategory[category];
                    if (!items || items.length === 0) return null;

                    return (
                      <motion.div
                        key={category}
                        id={`category-${category}`}
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: categoryIndex * 0.1 }}
                        className="space-y-4"
                      >
                        {/* Titre de la catégorie */}
                        <h2
                          className="text-2xl md:text-3xl font-bold text-[#2F2A25]"
                          style={{
                            fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif',
                          }}
                        >
                          {category}
                        </h2>

                        {/* Slider horizontal */}
                        <div className="relative group">
                          {/* Bouton gauche */}
                          {items.length > 4 && (
                            <button
                              onClick={() => scrollSlider(category, "left")}
                              className="absolute left-0 top-1/2 -translate-y-1/2 z-10 h-12 w-12 rounded-full bg-black/50 hover:bg-black/70 text-white opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                              aria-label="Précédent"
                            >
                              <ChevronLeft className="h-6 w-6" />
                            </button>
                          )}

                          {/* Container du slider */}
                          <div
                            ref={(el) => { sliderRefs.current[category] = el; }}
                            className="flex gap-4 overflow-x-auto scrollbar-hide scroll-smooth pb-4"
                            style={{
                              scrollbarWidth: 'none',
                              msOverflowStyle: 'none',
                            }}
                          >
                            {items.map((item) => (
                              <Link
                                key={item.id}
                                href={getItemUrl(item)}
                                className="flex-shrink-0 w-[280px] md:w-[320px] group/item"
                              >
                                <div className="relative aspect-video rounded-lg overflow-hidden bg-[#E6D9C6] border border-[#E6D9C6] hover:border-[#C6A664] transition-all hover:scale-105 hover:shadow-xl">
                                  {/* Image */}
                                  {item.hero_image_url || item.thumbnail_url ? (
                                    <Image
                                      src={item.hero_image_url || item.thumbnail_url || ""}
                                      alt={item.title}
                                      fill
                                      quality={80}
                                      className="object-cover transition-transform duration-300 group-hover/item:scale-110"
                                      sizes="(max-width: 768px) 280px, 320px"
                                      unoptimized={false}
                                      loading="lazy"
                                      onError={(e) => {
                                        const target = e.target as HTMLImageElement;
                                        target.src = "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=800&q=80";
                                      }}
                                    />
                                  ) : (
                                    <div className="absolute inset-0 bg-gradient-to-br from-[#E6D9C6] to-[#C6A664] flex items-center justify-center">
                                      {item.item_type === "module" && <BookOpen className="h-16 w-16 text-white/50" />}
                                      {item.item_type === "ressource" && <FileText className="h-16 w-16 text-white/50" />}
                                      {item.item_type === "test" && <Video className="h-16 w-16 text-white/50" />}
                                    </div>
                                  )}
                                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
                                  
                                  {/* Badge catégorie */}
                                  {item.category && (
                                    <div className="absolute top-3 left-3 bg-[#C6A664] text-white px-3 py-1 rounded-full text-xs font-semibold">
                                      {item.category}
                                    </div>
                                  )}
                                  
                                  {/* Badge gratuit */}
                                  {item.is_free && (
                                    <div className="absolute top-3 right-3 bg-[#C6A664] text-white px-3 py-1 rounded-full text-xs font-semibold">
                                      Gratuit
                                    </div>
                                  )}

                                  {/* Contenu en bas */}
                                  <div className="absolute bottom-0 left-0 right-0 p-4">
                                    <h3
                                      className="text-lg font-bold text-white mb-1 line-clamp-2"
                                      style={{
                                        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif',
                                        textShadow: '0 1px 5px rgba(0,0,0,0.5)',
                                      }}
                                    >
                                      {item.title}
                                    </h3>
                                    <p className="text-sm text-white/90 line-clamp-1" style={{ textShadow: '0 1px 3px rgba(0,0,0,0.3)' }}>
                                      {item.short_description || item.description || ""}
                                    </p>
                                  </div>
                                </div>
                              </Link>
                            ))}
                          </div>

                          {/* Bouton droit */}
                          {items.length > 4 && (
                            <button
                              onClick={() => scrollSlider(category, "right")}
                              className="absolute right-0 top-1/2 -translate-y-1/2 z-10 h-12 w-12 rounded-full bg-black/50 hover:bg-black/70 text-white opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                              aria-label="Suivant"
                            >
                              <ChevronRight className="h-6 w-6" />
                            </button>
                          )}
                        </div>
                      </motion.div>
                    );
                  })
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
    </div>
  );
}
