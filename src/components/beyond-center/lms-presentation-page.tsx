"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { useState, useRef, useEffect, useMemo, ReactNode } from "react";
import { 
  Brain, 
  CheckCircle2,
  ArrowRight,
  Award,
  Globe,
  Smartphone,
  Wand2,
  Layers,
  GitBranch,
  Eye,
  MessageSquare,
  Lock,
  Network,
  UserCheck,
  Users,
  Building2,
  Rocket,
  Code,
  Database,
  Settings,
  BrainCircuit,
  Accessibility,
  Timer,
  Gauge,
  Heart,
  Sparkle,
  Crown,
  Gem,
  Feather,
  Infinity as InfinityIcon,
  Zap,
  Target,
  TrendingUp,
  BookOpen,
  FolderOpen,
  BarChart3,
  FileText,
  PlayCircle,
  ChevronDown
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EcosystemDropdown } from "./ecosystem-dropdown";
import { ArrowLeft, ChevronLeft, ChevronRight } from "lucide-react";
import Image from "next/image";
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

const BUCKET_NAME = "Center";

function resolveStorageUrls(paths: readonly string[]): string[] {
  return paths
    .map((path) => path.trim())
    .filter(Boolean)
    .map((path) => getSupabaseStorageUrl(BUCKET_NAME, path))
    .filter((url): url is string => Boolean(url));
}

export function LMSPresentationPage() {
  // Palette Apple/Revolut - Ultra premium
  const black = "#000000";
  const white = "#FFFFFF";
  const gray50 = "#FAFAFA";
  const gray100 = "#F5F5F5";
  const gray200 = "#E5E5E5";
  const gray400 = "#A3A3A3";
  const gray600 = "#525252";
  const gray900 = "#171717";
  
  const [scrolled, setScrolled] = useState(false);
  const [featuresMenuOpen, setFeaturesMenuOpen] = useState(false);
  const featuresMenuRef = useRef<HTMLDivElement>(null);
  const featuresMenuItems = [
    {
      icon: Wand2,
      label: "Builder",
      description: "Créez sans limites",
      href: "/beyond-center/fonctionnalites/builder",
    },
    {
      icon: BookOpen,
      label: "Parcours",
      description: "Structurez l'apprentissage",
      href: "/beyond-center/fonctionnalites/parcours",
    },
    {
      icon: FolderOpen,
      label: "Drive",
      description: "Tous vos fichiers",
      href: "/beyond-center/fonctionnalites/drive",
    },
    {
      icon: MessageSquare,
      label: "Messagerie",
      description: "Restez connectés",
      href: "/beyond-center/fonctionnalites/messagerie",
    },
    {
      icon: FileText,
      label: "Tests",
      description: "Évaluez facilement",
      href: "/beyond-center/fonctionnalites/tests",
    },
    {
      icon: BarChart3,
      label: "Analytics",
      description: "Mesurez l'impact",
      href: "/beyond-center/fonctionnalites/analytics",
    },
  ] as const;
  const heroRef = useRef<HTMLDivElement>(null);
  const overviewRef = useRef<HTMLDivElement>(null);
  const creationRef = useRef<HTMLDivElement>(null);
  const holisticRef = useRef<HTMLDivElement>(null);
  const enterpriseRef = useRef<HTMLDivElement>(null);
  const featuresRef = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"]
  });

  const opacity = useTransform(scrollYProgress, [0, 0.6], [1, 0]);
  const y = useTransform(scrollYProgress, [0, 0.6], [0, 100]);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Fermer le menu au clic en dehors
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (featuresMenuRef.current && !featuresMenuRef.current.contains(event.target as Node)) {
        setFeaturesMenuOpen(false);
      }
    };
    if (featuresMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [featuresMenuOpen]);

  const scrollToSection = (ref: React.RefObject<HTMLDivElement | null>) => {
    if (ref.current) {
      ref.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  // Composant Image avec fallback
  const ImageWithFallback = ({
    sources,
    fallback,
    alt,
    priority = false,
    sizes: imageSizes = "100vw",
    className,
  }: {
    sources: string[];
    fallback: string;
    alt: string;
    priority?: boolean;
    sizes?: string;
    className?: string;
  }) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [useFallback, setUseFallback] = useState(sources.length === 0);

    useEffect(() => {
      setCurrentIndex(0);
      setUseFallback(sources.length === 0);
    }, [sources]);

    const currentSrc =
      useFallback || sources.length === 0
        ? fallback
        : sources[currentIndex] ?? fallback;

    return (
      <Image
        src={currentSrc || fallback}
        alt={alt}
        fill
        className={cn("object-cover", className)}
        priority={priority}
        sizes={imageSizes}
        onError={() => {
          if (!useFallback && currentIndex < sources.length - 1) {
            setCurrentIndex((prev) => prev + 1);
          } else if (!useFallback) {
            setUseFallback(true);
          }
        }}
      />
    );
  };

  // Composant Slider simple
  type SliderItem =
    | { type: "image"; src: string; alt?: string }
    | { type: "video"; src: string; poster?: string; alt?: string };

  const ImageSlider = ({ slides, className = "" }: { slides: SliderItem[]; className?: string }) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const sliderRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
      if (slides.length <= 1) {
        return;
      }
      const interval = setInterval(() => {
        setCurrentIndex((prev) => (prev + 1) % slides.length);
      }, 5000);
      return () => clearInterval(interval);
    }, [slides.length]);

    const nextSlide = () => {
      setCurrentIndex((prev) => (prev + 1) % slides.length);
    };

    const prevSlide = () => {
      setCurrentIndex((prev) => (prev - 1 + slides.length) % slides.length);
    };

    return (
      <div className={`relative ${className}`} ref={sliderRef}>
        <div className="relative h-[400px] md:h-[500px] rounded-2xl overflow-hidden">
          {slides.map((slide, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0 }}
              animate={{ 
                opacity: index === currentIndex ? 1 : 0,
                scale: index === currentIndex ? 1 : 1.05
              }}
              transition={{ duration: 0.6 }}
              className={`absolute inset-0 ${index === currentIndex ? 'z-10' : 'z-0'}`}
            >
              {slide.type === "video" ? (
                <video
                  key={slide.src}
                  className="absolute inset-0 h-full w-full object-cover"
                  autoPlay
                  muted
                  loop
                  playsInline
                  controls={false}
                  poster={slide.poster}
                >
                  <source src={slide.src} type="video/mp4" />
                  {slide.alt && <track kind="captions" label={slide.alt} />}
                </video>
              ) : (
                <Image
                  src={slide.src}
                  alt={slide.alt ?? `Slide ${index + 1}`}
                  fill
                  className="object-cover"
                  priority={index === 0}
                  sizes="(min-width: 1024px) 50vw, 100vw"
                />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
            </motion.div>
          ))}
        </div>
        
        {/* Navigation */}
        <button
          onClick={prevSlide}
          className="absolute left-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center hover:bg-white/30 transition-all"
          style={{ color: white }}
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <button
          onClick={nextSlide}
          className="absolute right-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center hover:bg-white/30 transition-all"
          style={{ color: white }}
        >
          <ChevronRight className="h-5 w-5" />
        </button>

        {/* Indicateurs */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex gap-2">
          {slides.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={`h-1.5 rounded-full transition-all ${
                index === currentIndex ? 'w-8 bg-white' : 'w-1.5 bg-white/40'
              }`}
            />
          ))}
        </div>
      </div>
    );
  };

  const IMacFrame = ({ children }: { children: ReactNode }) => (
    <div className="relative mx-auto w-full max-w-[520px]">
      <div className="relative aspect-[16/10] rounded-[2.4rem] border border-white/10 bg-gradient-to-br from-[#2b2b2b] via-[#111] to-black shadow-[0_40px_70px_-30px_rgba(15,23,42,0.65)]">
        <div className="absolute inset-[6%] rounded-[1.6rem] bg-black overflow-hidden ring-1 ring-white/10">
          {children}
        </div>
        <div className="absolute top-[5%] left-1/2 h-2 w-2 -translate-x-1/2 rounded-full bg-[#0f0f0f] shadow-[0_0_0_4px_rgba(255,255,255,0.12)]" />
      </div>
      <div className="mx-auto mt-6 h-6 w-28 rounded-b-[14px] bg-gradient-to-b from-[#d1d5db] via-[#cbd5f5] to-[#94a3b8] shadow-[0_12px_24px_rgba(15,23,42,0.25)]" />
      <div className="mx-auto mt-2 h-1.5 w-40 rounded-full bg-gradient-to-r from-[#d1d5db] via-white to-[#d1d5db]" />
    </div>
  );

  // Composant Slider pour la section Création - Style Tony Robbins
  const CreationSlider = () => {
    const [selectedIndex, setSelectedIndex] = useState(0);

    const creationItems = useMemo(() => {
      const itemsConfig = [
        {
          id: "builder",
          title: "Builder Modulaire",
          description:
            "Une interface qui respire l'élégance et l'intuition. Structurez vos formations avec une précision chirurgicale, sans jamais toucher une ligne de code. Laissez votre créativité s'exprimer.",
          icon: Layers,
          storagePaths: [
            "Builder.png",
            "builder.png",
            "Builder.PNG",
            "builder.PNG",
            "creation/builder.png",
            "creation/builder.PNG",
          ],
          fallbackImage:
            "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=1200&q=80",
        },
        {
          id: "ai",
          title: "Intelligence Artificielle",
          description:
            "Votre assistant créatif de confiance. Générez du contenu pédagogique qui capte l'attention, créez des évaluations qui révèlent le vrai potentiel, analysez les résultats pour transformer chaque apprenant.",
          icon: Brain,
          storagePaths: [
            "creation cours.png",
            "creation cours.jpg",
            "creation-cours.png",
            "creation-cours.jpg",
            "creation/creation cours.png",
            "creation/creation cours.jpg",
          ],
          fallbackImage:
            "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=1200&q=80",
        },
        {
          id: "templates",
          title: "Templates Premium",
          description:
            "Des modèles conçus par des experts pédagogiques. Démarrez avec des structures éprouvées, personnalisez-les à l'infini. Chaque template est une œuvre d'art prête à être adaptée à votre vision.",
          icon: Zap,
          storagePaths: [
            "templates premium.png",
            "templates premium.jpg",
            "templates.png",
            "templates.jpg",
          ],
          fallbackImage:
            "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1200&q=80",
        },
      ] as const;

      return itemsConfig.map((item) => ({
        ...item,
        imageSources: resolveStorageUrls(item.storagePaths),
      }));
    }, []);

    const activeIndex =
      selectedIndex >= creationItems.length ? 0 : selectedIndex;
    const selectedItem = creationItems[activeIndex];

    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center min-h-[600px]">
        {/* Liste à gauche */}
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
          className="space-y-2"
        >
          {creationItems.map((item, index) => {
            const Icon = item.icon;
            const isSelected = index === activeIndex;
            
            return (
              <motion.button
                key={item.id}
                onClick={() => setSelectedIndex(index)}
                className="w-full text-left p-6 rounded-xl transition-all duration-300 group"
                style={{
                  backgroundColor: isSelected ? 'transparent' : 'transparent',
                  borderLeft: isSelected ? `3px solid ${black}` : '3px solid transparent'
                }}
                whileHover={{ x: 4 }}
              >
                <div className="flex items-start gap-4">
                  <div 
                    className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 transition-all duration-300"
                    style={{
                      backgroundColor: isSelected ? black : 'rgba(0, 0, 0, 0.05)'
                    }}
                  >
                    <Icon 
                      className="h-5 w-5 transition-colors"
                      style={{ color: isSelected ? white : black }}
                    />
                  </div>
                  <div className="flex-1">
                    <h3 
                      className="text-xl font-semibold mb-2 tracking-tight transition-colors"
                      style={{ 
                        color: isSelected ? black : gray600,
                        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", system-ui, sans-serif',
                        fontWeight: isSelected ? 600 : 500
                      }}
                    >
                      {item.title}
                    </h3>
                    {isSelected && (
                      <motion.p
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="text-base leading-relaxed font-light"
                        style={{ 
                          color: gray600,
                          fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", system-ui, sans-serif',
                          fontWeight: 300
                        }}
                      >
                        {item.description}
                      </motion.p>
                    )}
                  </div>
                  {isSelected && (
                    <motion.div
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="flex items-center"
                    >
                      <ArrowRight className="h-5 w-5" style={{ color: black }} />
                    </motion.div>
                  )}
                </div>
              </motion.button>
            );
          })}
        </motion.div>

        {/* Image à droite */}
        <motion.div
          key={activeIndex}
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] as const }}
          className="flex min-h-[500px] items-center justify-center"
        >
          <IMacFrame>
            <ImageWithFallback
              sources={selectedItem.imageSources ?? []}
              fallback={selectedItem.fallbackImage}
              alt={selectedItem.title}
              priority={activeIndex === 0}
              sizes="(min-width: 1024px) 45vw, 90vw"
              className="object-contain"
            />
          </IMacFrame>
        </motion.div>
      </div>
    );
  };

  // Images pour les sliders (placeholder - à remplacer par de vraies photos)
  const dysVideoUrl = getSupabaseStorageUrl(BUCKET_NAME, "video demonstration dys.mp4");

  const holisticSlides: SliderItem[] = [
    dysVideoUrl
      ? {
          type: "video",
          src: dysVideoUrl,
          poster: "https://images.unsplash.com/photo-1509062522246-3755977927d7?w=1200&q=80",
          alt: "Démonstration vidéo de la transformation automatique pour DYS",
        }
      : {
          type: "image",
          src: "https://images.unsplash.com/photo-1509062522246-3755977927d7?w=1200&q=80",
          alt: "Démonstration visuelle de la transformation automatique pour DYS",
        },
    {
      type: "image",
      src: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=1200&q=80",
      alt: "Collaboration d'une équipe pédagogique",
    },
    {
      type: "image",
      src: "https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=1200&q=80",
      alt: "Accompagnement individualisé des apprenants",
    },
  ];

  const enterpriseSlides: SliderItem[] = [
    {
      type: "image",
      src: "https://images.unsplash.com/photo-1552664730-d307ca884978?w=1200&q=80",
      alt: "Pilotage stratégique en entreprise",
    },
    {
      type: "image",
      src: "https://images.unsplash.com/photo-1556761175-5973dc0f32e7?w=1200&q=80",
      alt: "Réunion d'équipes en formation",
    },
    {
      type: "image",
      src: "https://images.unsplash.com/photo-1556761175-4b46a572b786?w=1200&q=80",
      alt: "Analyse de performances pédagogiques",
    },
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Header avec logo Beyond et menu - Style Apple */}
      <header 
        className={`fixed top-0 left-0 right-0 z-50 backdrop-blur-xl border-b transition-all duration-300 ${
          scrolled ? 'bg-white/80 border-gray-200' : 'bg-black/80 border-white/10'
        }`}
      >
        <div className="mx-auto max-w-7xl px-6 py-4">
          <div className="flex items-center justify-between">
            <Link href="/beyond-center">
              <span 
                className="text-xl tracking-tight transition-colors"
                style={{ 
                  color: scrolled ? black : white,
                  fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif',
                  letterSpacing: '-0.02em',
                  fontWeight: 700
                }}
              >
                BEYOND <span style={{ fontWeight: 300 }}>Center</span>
              </span>
            </Link>
            <nav className="hidden md:flex items-center gap-8">
              <EcosystemDropdown />
              <button
                onClick={() => scrollToSection(overviewRef)}
                className="text-sm transition-colors font-light"
                style={{ 
                  color: scrolled ? gray600 : 'rgba(255, 255, 255, 0.8)',
                  fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", system-ui, sans-serif'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = scrolled ? black : 'white';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = scrolled ? gray600 : 'rgba(255, 255, 255, 0.8)';
                }}
              >
                Vue d'ensemble
              </button>
              <button
                onClick={() => scrollToSection(creationRef)}
                className="text-sm transition-colors font-light"
                style={{ 
                  color: scrolled ? gray600 : 'rgba(255, 255, 255, 0.8)',
                  fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", system-ui, sans-serif'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = scrolled ? black : 'white';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = scrolled ? gray600 : 'rgba(255, 255, 255, 0.8)';
                }}
              >
                Création
              </button>
              <button
                onClick={() => scrollToSection(holisticRef)}
                className="text-sm transition-colors font-light"
                style={{ 
                  color: scrolled ? gray600 : 'rgba(255, 255, 255, 0.8)',
                  fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", system-ui, sans-serif'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = scrolled ? black : 'white';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = scrolled ? gray600 : 'rgba(255, 255, 255, 0.8)';
                }}
              >
                Holistique
              </button>
              <button
                onClick={() => scrollToSection(enterpriseRef)}
                className="text-sm transition-colors font-light"
                style={{ 
                  color: scrolled ? gray600 : 'rgba(255, 255, 255, 0.8)',
                  fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", system-ui, sans-serif'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = scrolled ? black : 'white';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = scrolled ? gray600 : 'rgba(255, 255, 255, 0.8)';
                }}
              >
                Entreprises
              </button>
              <div
                className="relative"
                ref={featuresMenuRef}
                onMouseEnter={() => setFeaturesMenuOpen(true)}
                onMouseLeave={() => setFeaturesMenuOpen(false)}
              >
                <Link
                  href="/beyond-center/fonctionnalites"
                  className="text-sm transition-colors font-light flex items-center gap-1"
                  style={{ 
                    color: scrolled ? gray600 : 'rgba(255, 255, 255, 0.8)',
                    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", system-ui, sans-serif'
                  }}
                  onClick={() => setFeaturesMenuOpen(false)}
                >
                  Fonctionnalités
                  <ChevronDown 
                    className={`h-3 w-3 transition-transform duration-200 ${featuresMenuOpen ? 'rotate-180' : ''}`}
                  />
                </Link>
              </div>
            </nav>
          </div>
        </div>

        {/* Sous-menu Fonctionnalités */}
        {featuresMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="border-t py-6"
            style={{ 
              borderColor: scrolled ? gray200 : 'rgba(255, 255, 255, 0.1)'
            }}
            onMouseEnter={() => setFeaturesMenuOpen(true)}
            onMouseLeave={() => setFeaturesMenuOpen(false)}
          >
            <div className="max-w-7xl mx-auto px-6">
              <div className="flex items-center justify-center gap-12">
                {featuresMenuItems.map((feature, idx) => {
                  const Icon = feature.icon;
                  return (
                    <Link
                      key={feature.href}
                      href={feature.href}
                      onClick={() => setFeaturesMenuOpen(false)}
                      className="group flex flex-col items-center gap-2"
                    >
                      <motion.div
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.2, delay: idx * 0.05 }}
                        className="flex flex-col items-center gap-2"
                      >
                        <div 
                          className="w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-300 group-hover:scale-110"
                          style={{
                            backgroundColor: scrolled ? 'rgba(0, 0, 0, 0.05)' : 'rgba(255, 255, 255, 0.1)'
                          }}
                        >
                          <Icon 
                            className="h-6 w-6 transition-colors"
                            style={{ 
                              color: scrolled ? black : 'rgba(255, 255, 255, 0.9)'
                            }}
                          />
                        </div>
                        <div className="text-center">
                          <div 
                            className="text-xs font-medium mb-0.5"
                            style={{ 
                              color: scrolled ? black : 'rgba(255, 255, 255, 0.9)',
                              fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", system-ui, sans-serif'
                            }}
                          >
                            {feature.label}
                          </div>
                          <div 
                            className="text-[10px] opacity-70"
                            style={{ 
                              color: scrolled ? gray600 : 'rgba(255, 255, 255, 0.7)',
                              fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", system-ui, sans-serif'
                            }}
                          >
                            {feature.description}
                          </div>
                        </div>
                      </motion.div>
                    </Link>
                  );
                })}
              </div>
            </div>
          </motion.div>
        )}
      </header>

      {/* Hero Section - Style Apple */}
      <section 
        ref={heroRef}
        className="relative pt-40 pb-40 px-6 overflow-hidden"
        style={{ backgroundColor: black }}
      >
        <motion.div
          style={{ opacity, y }}
          className="relative max-w-6xl mx-auto text-center"
        >
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] as const }}
          >
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] as const }}
              className="text-7xl md:text-9xl font-semibold mb-1 leading-[1.05] tracking-tight text-white"
              style={{ 
                fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", system-ui, sans-serif',
                fontWeight: 600,
                letterSpacing: '-0.04em'
              }}
            >
              Beyond
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.25, ease: [0.16, 1, 0.3, 1] as const }}
              className="text-lg md:text-xl mb-12 font-light text-white/70"
              style={{ 
                fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", system-ui, sans-serif',
                fontWeight: 300,
                letterSpacing: '-0.01em',
                lineHeight: '1.2',
                marginTop: '0.35em'
              }}
            >
              Learning Management System
            </motion.p>
            
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.3, ease: [0.16, 1, 0.3, 1] as const }}
              className="text-2xl md:text-3xl mb-12 font-light leading-relaxed max-w-3xl mx-auto text-white/80"
              style={{ 
                fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", system-ui, sans-serif',
                fontWeight: 300
              }}
            >
              Donnez vie à vos idées pédagogiques.
              <br />
              <span className="text-white/60">Le seul LMS qui comprend vraiment chaque apprenant.</span>
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.5, ease: [0.16, 1, 0.3, 1] as const }}
              className="flex flex-wrap items-center justify-center gap-4 mb-20"
            >
              <Link href="/beyond-center/rendez-vous">
                <Button 
                  size="lg"
                  className="rounded-full px-8 py-6 text-base font-medium transition-all duration-300 hover:scale-105 hover:shadow-2xl"
                  style={{ 
                    backgroundColor: white, 
                    color: black,
                    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", system-ui, sans-serif'
                  }}
                >
                  Réserver une démo
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link href="#overview">
                <Button 
                  variant="outline"
                  size="lg"
                  className="rounded-full px-8 py-6 text-base font-medium border-2 transition-all duration-300 hover:bg-white/10"
                  style={{ 
                    borderColor: "rgba(255, 255, 255, 0.3)", 
                    color: white,
                    backgroundColor: "transparent",
                    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", system-ui, sans-serif'
                  }}
                >
                  En savoir plus
                </Button>
              </Link>
            </motion.div>

            {/* Stats minimalistes */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.6 }}
              className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto pt-16 border-t"
              style={{ borderColor: "rgba(255, 255, 255, 0.1)" }}
            >
              {[
                { label: "Création", value: "Sans limites", icon: InfinityIcon },
                { label: "Neuro-adaptatif", value: "Unique", icon: Brain },
                { label: "Accessibilité DYS", value: "Native", icon: Heart },
                { label: "Holistique", value: "Intégré", icon: Feather }
              ].map((stat, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5, delay: 0.7 + index * 0.1 }}
                  className="text-center"
                >
                  <stat.icon className="h-5 w-5 mx-auto mb-3 text-white/60" />
                  <div className="text-3xl md:text-4xl font-semibold mb-1.5 text-white" 
                    style={{ 
                      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", system-ui, sans-serif',
                      fontWeight: 600
                    }}>
                    {stat.value}
                  </div>
                  <div className="text-xs text-white/50 uppercase tracking-wider" style={{ letterSpacing: '0.1em' }}>
                    {stat.label}
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>
        </motion.div>
      </section>

      {/* Section Vue d'ensemble */}
      <section ref={overviewRef} id="overview" className="py-32 px-6 bg-white">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6 }}
            className="space-y-32"
          >
            <div className="text-center mb-24">
              <h2 className="text-5xl md:text-7xl font-semibold mb-6 tracking-tight text-black"
                style={{ 
                  fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", system-ui, sans-serif',
                  fontWeight: 600,
                  letterSpacing: '-0.03em'
                }}>
                Une expérience d'apprentissage
                <br />
                <span style={{ color: gray600 }}>qui vous ressemble</span>
              </h2>
              <p className="text-xl md:text-2xl max-w-2xl mx-auto font-light leading-relaxed"
                style={{ 
                  color: gray600,
                  fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", system-ui, sans-serif',
                  fontWeight: 300
                }}>
                Au-delà de la technologie, une approche humaine qui place l'individu au cœur de l'expérience
              </p>
            </div>

            {/* Cards Premium */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                {
                  icon: Wand2,
                  title: "Création sans limites",
                  description: "Donnez vie à vos idées pédagogiques. De la première inspiration à la distribution, créez des formations qui marquent les esprits et transforment les compétences.",
                  features: ["Builder intuitif", "Génération IA", "Multi-format", "Templates premium"]
                },
                {
                  icon: Heart,
                  title: "Approche Holistique",
                  description: "Le seul LMS qui considère l'apprenant dans sa globalité : rythme, bien-être, potentiel.",
                  features: ["Neuro-adaptatif", "Transformation DYS", "Pomodoro", "Personnalisation"]
                },
                {
                  icon: Crown,
                  title: "Pour les organisations",
                  description: "Une plateforme complète pour créer, distribuer et animer vos formations internes.",
                  features: ["Multi-utilisateurs", "Pilotage temps réel", "Certifications", "Support dédié"]
                }
              ].map((card, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-100px" }}
                  transition={{ duration: 0.6, delay: index * 0.1, ease: [0.16, 1, 0.3, 1] as const }}
                  whileHover={{ y: -8 }}
                  className="group"
                >
                  <Card className="h-full border-0 transition-all duration-300 hover:shadow-xl bg-white rounded-2xl overflow-hidden"
                    style={{ 
                      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)'
                    }}>
                    <CardHeader className="pb-6 pt-8 px-8">
                      <div className="w-12 h-12 rounded-xl mb-6 flex items-center justify-center transition-all duration-300 group-hover:scale-110 bg-black/5">
                        <card.icon className="h-6 w-6 text-black" />
                      </div>
                      <CardTitle className="text-2xl mb-3 font-semibold tracking-tight text-black"
                        style={{ 
                          fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", system-ui, sans-serif',
                          fontWeight: 600
                        }}>
                        {card.title}
                      </CardTitle>
                      <CardDescription className="text-base leading-relaxed font-light"
                        style={{ 
                          color: gray600,
                          fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", system-ui, sans-serif',
                          fontWeight: 300
                        }}>
                        {card.description}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="px-8 pb-8">
                      <ul className="space-y-3">
                        {card.features.map((feature, idx) => (
                          <li key={idx} className="flex items-center gap-3">
                            <div className="w-1 h-1 rounded-full bg-black" />
                            <span className="text-sm font-light"
                              style={{ 
                                color: gray600,
                                fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", system-ui, sans-serif'
                              }}>
                              {feature}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Section Création A à Z */}
      <section ref={creationRef} id="creation" className="py-32 px-6 bg-gray50">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6 }}
            className="space-y-24"
          >
            <div className="text-center mb-20">
              <h2 className="text-5xl md:text-7xl font-semibold mb-6 tracking-tight text-black"
                style={{ 
                  fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", system-ui, sans-serif',
                  fontWeight: 600,
                  letterSpacing: '-0.03em'
                }}>
                Créez des formations <span style={{ color: gray600 }}>qui inspirent</span>
              </h2>
              <p className="text-xl md:text-2xl max-w-2xl mx-auto font-light leading-relaxed"
                style={{ 
                  color: gray600,
                  fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", system-ui, sans-serif',
                  fontWeight: 300
                }}>
                Transformez vos idées en expériences d'apprentissage mémorables. Chaque outil est pensé pour libérer votre créativité et maximiser l'impact de vos formations.
              </p>
            </div>

            {/* Slider style Tony Robbins - Liste à gauche, image à droite */}
            <CreationSlider />
          </motion.div>
        </div>
      </section>

      {/* Section Holistique */}
      <section ref={holisticRef} id="holistic" className="py-32 px-6 bg-white">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6 }}
            className="space-y-24"
          >
            <div className="text-center mb-20">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-8 bg-black/5">
                <Gem className="h-4 w-4 text-black/60" />
                <span className="text-xs font-medium text-black/60 tracking-wider uppercase" style={{ letterSpacing: '0.1em' }}>
                  Unique sur le marché
                </span>
              </motion.div>
              <h2 className="text-5xl md:text-7xl font-semibold mb-6 tracking-tight text-black"
                style={{ 
                  fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", system-ui, sans-serif',
                  fontWeight: 600,
                  letterSpacing: '-0.03em'
                }}>
                Une approche <span style={{ color: gray600 }}>holistique</span>
              </h2>
              <p className="text-xl md:text-2xl max-w-2xl mx-auto font-light leading-relaxed"
                style={{ 
                  color: gray600,
                  fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", system-ui, sans-serif',
                  fontWeight: 300
                }}>
                Le seul LMS qui s'adapte vraiment à chaque individu
              </p>
            </div>

            {/* Feature principale */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center mb-24">
              <motion.div
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] as const }}
              >
                <div 
                  className="p-10 rounded-3xl bg-gray50 border"
                  style={{ 
                    borderColor: gray200,
                    boxShadow: '0 4px 24px rgba(0, 0, 0, 0.04)'
                  }}
                >
                  <div className="w-14 h-14 rounded-xl mb-6 flex items-center justify-center bg-black/5">
                    <Accessibility className="h-7 w-7 text-black" />
                  </div>
                  <h3 className="text-3xl font-semibold mb-4 tracking-tight text-black"
                    style={{ 
                      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", system-ui, sans-serif',
                      fontWeight: 600
                    }}>
                    Transformation automatique pour DYS
                  </h3>
                  <p className="text-lg mb-8 leading-relaxed font-light"
                    style={{ 
                      color: gray600,
                      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", system-ui, sans-serif',
                      fontWeight: 300
                    }}>
                    Le contenu se transforme automatiquement pour s'adapter aux besoins des personnes dyslexiques, dyspraxiques et autres troubles DYS.
                  </p>
                  <ul className="space-y-3">
                    {[
                      "Police adaptée (OpenDyslexic)",
                      "Espacement optimisé",
                      "Couleurs personnalisables",
                      "Syllabation automatique",
                      "Lecture vocale intégrée"
                    ].map((feature, idx) => (
                      <li key={idx} className="flex items-center gap-3">
                        <CheckCircle2 className="h-5 w-5 text-black flex-shrink-0" />
                        <span className="font-light"
                          style={{ 
                            color: gray600,
                            fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", system-ui, sans-serif'
                          }}>
                          {feature}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] as const }}
                className="relative"
              >
              <ImageSlider slides={holisticSlides} />
              </motion.div>
            </div>

            {/* Autres features */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[
                {
                  icon: Timer,
                  title: "Méthode Pomodoro",
                  description: "Respect du rythme naturel d'apprentissage avec la technique Pomodoro intégrée"
                },
                {
                  icon: BrainCircuit,
                  title: "Parcours personnalisés",
                  description: "Chaque apprenant reçoit un parcours adapté à son profil et ses besoins"
                },
                {
                  icon: Gauge,
                  title: "Focus Mode",
                  description: "Mode concentration pour éliminer les distractions et maximiser l'engagement"
                },
                {
                  icon: Feather,
                  title: "Bien-être intégré",
                  description: "Une approche qui considère l'apprenant dans sa globalité"
                }
              ].map((feature, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-50px" }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  whileHover={{ y: -4 }}
                >
                  <Card className="h-full border-0 transition-all duration-300 hover:shadow-lg bg-white rounded-2xl"
                    style={{ 
                      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)'
                    }}>
                    <CardHeader className="pb-4">
                      <div className="w-12 h-12 rounded-xl mb-4 flex items-center justify-center bg-black/5">
                        <feature.icon className="h-6 w-6 text-black" />
                      </div>
                      <CardTitle className="text-xl mb-2 font-semibold tracking-tight text-black"
                        style={{ 
                          fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", system-ui, sans-serif',
                          fontWeight: 600
                        }}>
                        {feature.title}
                      </CardTitle>
                      <CardDescription className="text-base font-light leading-relaxed"
                        style={{ 
                          color: gray600,
                          fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", system-ui, sans-serif',
                          fontWeight: 300
                        }}>
                        {feature.description}
                      </CardDescription>
                    </CardHeader>
                  </Card>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Section Entreprises */}
      <section ref={enterpriseRef} id="enterprise" className="py-32 px-6 bg-gray50">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6 }}
            className="space-y-24"
          >
            <div className="text-center mb-20">
              <h2 className="text-5xl md:text-7xl font-semibold mb-6 tracking-tight text-black"
                style={{ 
                  fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", system-ui, sans-serif',
                  fontWeight: 600,
                  letterSpacing: '-0.03em'
                }}>
                Pour les <span style={{ color: gray600 }}>entreprises</span>
              </h2>
              <p className="text-xl md:text-2xl max-w-2xl mx-auto font-light leading-relaxed"
                style={{ 
                  color: gray600,
                  fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", system-ui, sans-serif',
                  fontWeight: 300
                }}>
                Créez de A à Z vos formations internes et développez le potentiel de vos équipes
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
              <motion.div
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] as const }}
                className="space-y-10"
              >
                <div>
                  <h3 className="text-3xl font-semibold mb-4 tracking-tight text-black"
                    style={{ 
                      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", system-ui, sans-serif',
                      fontWeight: 600
                    }}>
                    Création complète de A à Z
                  </h3>
                  <p className="text-lg leading-relaxed mb-8 font-light"
                    style={{ 
                      color: gray600,
                      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", system-ui, sans-serif',
                      fontWeight: 300
                    }}>
                    De la conception à la distribution, créez vos formations internes sans dépendre d'outils externes.
                  </p>
                </div>

                <div className="space-y-8">
                  {[
                    {
                      icon: Users,
                      title: "Gestion multi-utilisateurs",
                      description: "Rôles et permissions granulaires pour gérer vos équipes efficacement"
                    },
                    {
                      icon: Eye,
                      title: "Pilotage en temps réel",
                      description: "Tableaux de bord élégants pour suivre les progrès de chaque collaborateur"
                    },
                    {
                      icon: Award,
                      title: "Certifications internes",
                      description: "Délivrez des certifications et badges pour valider les compétences acquises"
                    },
                    {
                      icon: Network,
                      title: "Intégrations premium",
                      description: "Connectez vos outils existants : RH, CRM, systèmes de gestion"
                    }
                  ].map((item, idx) => (
                    <div key={idx} className="flex items-start gap-5">
                      <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 bg-black/5">
                        <item.icon className="h-5 w-5 text-black" />
                      </div>
                      <div>
                        <h4 className="text-lg font-semibold mb-1.5 tracking-tight text-black"
                          style={{ 
                            fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", system-ui, sans-serif',
                            fontWeight: 600
                          }}>
                          {item.title}
                        </h4>
                        <p className="text-sm font-light"
                          style={{ 
                            color: gray600,
                            fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", system-ui, sans-serif',
                            fontWeight: 300
                          }}>
                          {item.description}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] as const }}
                className="relative"
              >
              <ImageSlider slides={enterpriseSlides} />
              </motion.div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Section Fonctionnalités */}
      <section ref={featuresRef} id="features" className="py-32 px-6 bg-white">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6 }}
            className="space-y-24"
          >
            <div className="text-center mb-20">
              <h2 className="text-5xl md:text-7xl font-semibold mb-6 tracking-tight text-black"
                style={{ 
                  fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", system-ui, sans-serif',
                  fontWeight: 600,
                  letterSpacing: '-0.03em'
                }}>
                Toutes les fonctionnalités
              </h2>
              <p className="text-xl md:text-2xl max-w-2xl mx-auto font-light leading-relaxed"
                style={{ 
                  color: gray600,
                  fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", system-ui, sans-serif',
                  fontWeight: 300
                }}>
                Une plateforme complète, pensée dans les moindres détails
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                { icon: Eye, title: "Suivi détaillé", description: "Analytics avancés et rapports personnalisés" },
                { icon: MessageSquare, title: "Communication", description: "Messagerie interne et notifications" },
                { icon: Globe, title: "Multi-langues", description: "Interface et contenus multilingues" },
                { icon: Smartphone, title: "100% Responsive", description: "Accessible sur tous les appareils" },
                { icon: Lock, title: "Sécurité", description: "Chiffrement et conformité RGPD" },
                { icon: Settings, title: "Personnalisation", description: "Branding et configuration complète" },
                { icon: Database, title: "Base de données", description: "Supabase scalable et performant" },
                { icon: Code, title: "API ouverte", description: "Intégrations et extensions possibles" },
                { icon: Rocket, title: "Performance", description: "Rapidité et scalabilité garanties" }
              ].map((feature, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-50px" }}
                  transition={{ duration: 0.4, delay: index * 0.05 }}
                  whileHover={{ y: -4 }}
                >
                  <Card className="h-full border-0 transition-all duration-300 hover:shadow-lg bg-white rounded-2xl"
                    style={{ 
                      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)'
                    }}>
                    <CardHeader>
                      <div className="w-11 h-11 rounded-xl mb-4 flex items-center justify-center bg-black/5">
                        <feature.icon className="h-5 w-5 text-black" />
                      </div>
                      <CardTitle className="text-lg mb-1.5 font-semibold tracking-tight text-black"
                        style={{ 
                          fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", system-ui, sans-serif',
                          fontWeight: 600
                        }}>
                        {feature.title}
                      </CardTitle>
                      <CardDescription className="text-sm font-light"
                        style={{ 
                          color: gray600,
                          fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", system-ui, sans-serif',
                          fontWeight: 300
                        }}>
                        {feature.description}
                      </CardDescription>
                    </CardHeader>
                  </Card>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Section CTA Final - Style Apple */}
      <section className="py-32 px-6 bg-black">
        <div className="max-w-5xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] as const }}
          >
            <h2 className="text-5xl md:text-7xl font-semibold mb-6 text-white tracking-tight"
              style={{ 
                fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", system-ui, sans-serif',
                fontWeight: 600,
                letterSpacing: '-0.03em'
              }}>
              Prêt à créer des formations
              <br />
              <span className="text-white/60">qui marquent</span> ?
            </h2>
            <p className="text-xl mb-12 text-white/60 font-light max-w-2xl mx-auto leading-relaxed"
              style={{ 
                fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", system-ui, sans-serif',
                fontWeight: 300
              }}>
              Rejoignez les organisations qui font confiance à Beyond LMS
            </p>
            <div className="flex flex-wrap items-center justify-center gap-4">
              <Link href="/beyond-center/rendez-vous">
                <Button 
                  size="lg"
                  className="rounded-full px-8 py-6 text-base font-medium transition-all duration-300 hover:scale-105 hover:shadow-2xl"
                  style={{ 
                    backgroundColor: white, 
                    color: black,
                    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", system-ui, sans-serif'
                  }}
                >
                  Réserver une démo
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link href="/beyond-center/fonctionnalites">
                <Button 
                  variant="outline"
                  size="lg"
                  className="rounded-full px-8 py-6 text-base font-medium border-2 transition-all duration-300 hover:bg-white/10"
                  style={{ 
                    borderColor: "rgba(255, 255, 255, 0.3)", 
                    color: white,
                    backgroundColor: "transparent",
                    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", system-ui, sans-serif'
                  }}
                >
                  Découvrir les fonctionnalités
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Bouton flottant retour à Beyond Center */}
      <Link href="/beyond-center">
        <motion.button
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 1 }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          className="fixed bottom-8 left-8 z-50 w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-all duration-300"
          style={{
            backgroundColor: black,
            color: white
          }}
        >
          <ArrowLeft className="h-5 w-5" />
        </motion.button>
      </Link>
    </div>
  );
}

