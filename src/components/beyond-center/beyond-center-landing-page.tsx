"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { useRef, useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { env } from "@/lib/env";
import { FormationsSlider } from "./formations-slider";
import { EcosystemIPhone } from "./ecosystem-iphone";
import { PodcastsSection } from "./podcasts-section";
import { EcosystemDropdown } from "./ecosystem-dropdown";
import { 
  GraduationCap, 
  Award, 
  FileCheck, 
  Users, 
  Target, 
  ArrowRight, 
  CheckCircle2,
  BookOpen,
  Briefcase,
  Heart,
  Network,
  Sparkles,
  TrendingUp,
  Shield,
  Brain,
  Building2,
  Calendar,
  Clock,
  MapPin
} from "lucide-react";

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

export function BeyondCenterLandingPage() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const heroRef = useRef<HTMLDivElement>(null);
  const [navbarOpacity, setNavbarOpacity] = useState(0.8);
  const [isVideoLoaded, setIsVideoLoaded] = useState(false);
  const { scrollY } = useScroll();
  const y = useTransform(scrollY, [0, 500], [0, 150]);

  // Couleurs Beyond Center - Identité visuelle premium
  const black = "#000000";
  const white = "#FFFFFF";
  const blue = "#006CFF";
  const gray = "#1A1A1A";

  // URL de la vidéo depuis Supabase Storage
  const videoUrl = getSupabaseStorageUrl("center", "Video center.mp4");
  
  useEffect(() => {
    if (videoUrl) {
      console.log("[Beyond Center] Video URL:", videoUrl);
    } else {
      console.warn("[Beyond Center] Video URL is empty - Supabase URL might not be configured");
    }
  }, [videoUrl]);

  useEffect(() => {
    const handleScroll = () => {
      const scrolled = window.scrollY;
      setNavbarOpacity(Math.min(0.95, 0.8 + scrolled / 500));
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-white">
      {/* Navbar - Style Apple minimaliste avec effet scroll */}
      <header 
        className="fixed top-0 left-0 right-0 z-50 backdrop-blur-xl border-b border-white/10 transition-all duration-300"
        style={{ 
          backgroundColor: `rgba(0, 0, 0, ${navbarOpacity})`
        }}
      >
        <div className="mx-auto max-w-7xl px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span 
                className="text-xl tracking-tight text-white"
                style={{ 
                  fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif',
                  letterSpacing: '-0.02em',
                  fontWeight: 700
                }}
              >
                BEYOND <span style={{ fontWeight: 300 }}>Center</span>
              </span>
            </div>
            <nav className="hidden md:flex items-center gap-8">
              <EcosystemDropdown />
              <Link href="#formations" className="text-sm text-white/80 hover:text-white transition-colors font-light">
                Formations
              </Link>
              <Link href="#psychopedagogie" className="text-sm text-white/80 hover:text-white transition-colors font-light">
                Psychopédagogie
              </Link>
              <Link href="#entreprises" className="text-sm text-white/80 hover:text-white transition-colors font-light">
                Entreprises
              </Link>
              <Link href="#ressources" className="text-sm text-white/80 hover:text-white transition-colors font-light">
                Ressources
              </Link>
            </nav>
            <div className="flex items-center gap-4">
              <Link href="/beyond-center/pre-inscription">
                <Button 
                  variant="outline"
                  className="transition-all duration-300 font-light text-sm rounded-full px-6 border border-white/30 text-white hover:bg-white/10"
                >
                  Pré-inscription
                </Button>
              </Link>
              <Link href="/beyond-center/pre-inscription">
                <Button 
                  className="transition-all duration-300 font-light text-sm rounded-full px-6"
                  style={{ 
                    backgroundColor: blue,
                    color: white
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#0052CC';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = blue;
                  }}
                >
                  Espace étudiant
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* 1️⃣ Hero Section */}
      <section 
        ref={heroRef}
        className="relative min-h-screen flex items-center justify-center overflow-hidden bg-black"
      >
        {/* Vidéo YouTube en arrière-plan */}
        <div className="absolute inset-0 z-0">
          <iframe
            src="https://www.youtube.com/embed/KKJ8nfsEsaE?autoplay=1&loop=1&playlist=KKJ8nfsEsaE&mute=1&controls=0&showinfo=0&rel=0&iv_load_policy=3&playlist=KKJ8nfsEsaE&start=0"
            className="absolute inset-0 w-full h-full scale-110"
            style={{ 
              pointerEvents: 'none',
              border: 'none',
            }}
            allow="autoplay; encrypted-media"
            allowFullScreen
          />
          {/* Overlay pour assombrir et améliorer la lisibilité */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/50 to-black/70" />
          {/* Légère teinte bleue pour l'ambiance Beyond Center */}
          <div className="absolute inset-0 bg-[#006CFF]/5" />
        </div>

        {/* Ligne bleue "scan" animée */}
        <motion.div
          animate={{
            y: ["-100%", "200%"],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: "linear",
          }}
          className="absolute inset-0 z-10 pointer-events-none"
        >
          <div 
            className="w-full h-px opacity-20"
            style={{ backgroundColor: blue }}
          />
        </motion.div>

        {/* Contenu Hero */}
        <div className="relative z-20 max-w-6xl mx-auto px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
          >
            <h1 
              className="mb-6 text-7xl md:text-8xl lg:text-9xl font-light leading-[1.05] tracking-tight text-white"
              style={{ 
                fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif',
                letterSpacing: '-0.04em',
                fontWeight: 300
              }}
            >
              Bienvenue au
              <br />
              Beyond Center.
            </h1>
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1.2, delay: 0.3 }}
              className="mb-12 text-2xl md:text-3xl font-light leading-relaxed"
              style={{ 
                color: blue,
                fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif',
                letterSpacing: '-0.01em'
              }}
            >
              Développez les compétences de demain.
            </motion.p>
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1.2, delay: 0.5 }}
              className="flex flex-col sm:flex-row items-center justify-center gap-4"
            >
              <Link href="/beyond-center/decouvrir-ecosysteme">
                <Button 
                  size="lg" 
                  className="text-lg px-10 py-7 font-light rounded-full transition-all duration-300 hover:scale-105"
                  style={{ 
                    backgroundColor: blue,
                    color: white
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#0052CC';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = blue;
                  }}
                >
                  Découvrir l'écosystème
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link href="/beyond-center/rendez-vous">
                <Button 
                  size="lg" 
                  variant="outline" 
                  className="border border-white/30 text-white hover:bg-white/10 backdrop-blur-sm text-lg px-10 py-7 font-light rounded-full transition-all duration-300"
                >
                  Réserver un rendez-vous
                </Button>
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Section blanche de transition */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent" />
        </div>
      </section>

      {/* 2️⃣ Section : "Un écosystème unique en France" */}
      <section id="ecosysteme" className="py-32 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="text-center mb-20"
          >
            <h2 
              className="text-6xl md:text-7xl font-light mb-6 leading-[1.05] tracking-tight text-black"
              style={{ 
                fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif',
                letterSpacing: '-0.03em',
                fontWeight: 300
              }}
            >
              Un écosystème unique
              <br />
              <span className="font-light" style={{ color: blue }}>en France</span>
            </h2>
          </motion.div>

          {/* iPhone interactif avec cartes */}
          <EcosystemIPhone />
        </div>
      </section>

      {/* Section blanche de transition */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent" />
        </div>
      </section>

      {/* 3️⃣ Section : "Pourquoi Beyond Center ?" */}
      <section id="pourquoi" className="py-32 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="text-center mb-20"
          >
            <h2 
              className="text-6xl md:text-7xl font-light mb-6 leading-[1.05] tracking-tight text-black"
              style={{ 
                fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif',
                letterSpacing: '-0.03em',
                fontWeight: 300
              }}
            >
              Pourquoi Beyond Center ?
            </h2>
          </motion.div>

          {/* 3 piliers */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-20">
            {[
              {
                icon: Brain,
                title: "Un accompagnement neuroadapté",
                description: "Basé sur les neurosciences et la psychopédagogie.",
              },
              {
                icon: Network,
                title: "Un réseau d'entreprises partenaires",
                description: "Prêtes à recruter, former et collaborer.",
              },
              {
                icon: GraduationCap,
                title: "Des formations certifiantes",
                description: "Titres professionnels reconnus et Open Badge.",
              },
            ].map((pillar, index) => {
              const Icon = pillar.icon;
              return (
                <motion.div
                  key={pillar.title}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.8, delay: index * 0.15 }}
                  className="text-center"
                >
                  <div className="mb-6 flex justify-center">
                    <div 
                      className="flex h-20 w-20 items-center justify-center rounded-3xl"
                      style={{ backgroundColor: `${blue}20` }}
                    >
                      <Icon className="h-10 w-10" style={{ color: blue }} />
                    </div>
                  </div>
                  <h3 
                    className="text-2xl font-light mb-4 text-black"
                    style={{ 
                      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif',
                      letterSpacing: '-0.02em'
                    }}
                  >
                    {pillar.title}
                  </h3>
                  <p 
                    className="text-lg text-gray-600 font-light leading-relaxed"
                    style={{ 
                      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif'
                    }}
                  >
                    {pillar.description}
                  </p>
                </motion.div>
              );
            })}
          </div>

        </div>
      </section>

      {/* Section blanche de transition */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent" />
        </div>
      </section>

      {/* 4️⃣ Section : "Les parcours disponibles" */}
      <section id="formations" className="py-32 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="text-center mb-20"
          >
            <h2 
              className="text-6xl md:text-7xl font-light mb-6 leading-[1.05] tracking-tight text-black"
              style={{ 
                fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif',
                letterSpacing: '-0.03em',
                fontWeight: 300
              }}
            >
              Les parcours disponibles
            </h2>
          </motion.div>

          <div className="space-y-8">
            {[
              {
                title: "Titre Professionnel NTC",
                subtitle: "Négociateur Technico-Commercial",
                duration: "12 mois",
                rythme: "Alternance ou formation continue",
                debouches: "Commercial, Business Developer, Account Manager",
                color: blue,
              },
              {
                title: "Ateliers & séminaires",
                subtitle: "Beyond Center",
                duration: "1 à 3 jours",
                rythme: "Intensif",
                debouches: "Communication, soft skills, intelligence émotionnelle, neurosciences",
                color: blue,
              },
              {
                title: "Psychopédagogie",
                subtitle: "Accompagnement individuel",
                duration: "Sur mesure",
                rythme: "Flexible",
                debouches: "Enfants, ado, adultes, préparation examens, gestion du stress",
                color: blue,
              },
            ].map((parcours, index) => (
              <motion.div
                key={parcours.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, delay: index * 0.15 }}
                whileHover={{ scale: 1.02 }}
                className="group"
              >
                <Card className="border-2 bg-white hover:border-[#006CFF] hover:shadow-[0_0_40px_rgba(0,108,255,0.2)] transition-all duration-500">
                  <CardContent className="p-12">
                    <div className="flex flex-col md:flex-row items-start justify-between gap-8">
                      <div className="flex-1">
                        <div 
                          className="text-sm font-light mb-3 uppercase tracking-wider"
                          style={{ color: blue }}
                        >
                          {parcours.title}
                        </div>
                        <h3 
                          className="text-4xl font-light mb-6 text-black"
                          style={{ 
                            fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif',
                            letterSpacing: '-0.02em'
                          }}
                        >
                          {parcours.subtitle}
                        </h3>
                        <div className="space-y-3 text-gray-600 font-light">
                          <div className="flex items-center gap-3">
                            <Clock className="h-5 w-5" style={{ color: blue }} />
                            <span>Durée : {parcours.duration}</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <Calendar className="h-5 w-5" style={{ color: blue }} />
                            <span>Rythme : {parcours.rythme}</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <Target className="h-5 w-5" style={{ color: blue }} />
                            <span>Débouchés : {parcours.debouches}</span>
                          </div>
                        </div>
                      </div>
                      <Link href={parcours.title === "Titre Professionnel NTC" ? "/beyond-center/formations/ntc" : "/beyond-center/pre-inscription"}>
                        <Button 
                          className="rounded-full px-8 py-6 font-light transition-all duration-300 group-hover:scale-105"
                          style={{ 
                            backgroundColor: blue,
                            color: white
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = '#0052CC';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = blue;
                          }}
                        >
                          En savoir plus
                          <ArrowRight className="ml-2 h-5 w-5" />
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Section blanche de transition */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent" />
        </div>
      </section>

      {/* Slider des formations Beyond No School */}
      <FormationsSlider />

      {/* Section blanche de transition */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent" />
        </div>
      </section>

      {/* Section Podcasts */}
      <PodcastsSection />

      {/* Section blanche de transition */}
      <section className="py-20 bg-black">
        <div className="max-w-7xl mx-auto px-6">
          <div className="h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
        </div>
      </section>

      {/* 5️⃣ Section : "Ils nous font confiance" */}
      <section id="entreprises" className="py-32 bg-black border-t border-white/10">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <h2 
              className="text-5xl md:text-6xl font-light mb-6 leading-[1.05] tracking-tight text-white"
              style={{ 
                fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif',
                letterSpacing: '-0.03em',
                fontWeight: 300
              }}
            >
              Ils nous font confiance
            </h2>
          </motion.div>

          {/* Logos partenaires - Style minimaliste */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-12 items-center opacity-60">
            {Array.from({ length: 6 }).map((_, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                whileHover={{ opacity: 1, scale: 1.1 }}
                className="flex items-center justify-center h-16"
              >
                <div 
                  className="w-full h-px"
                  style={{ backgroundColor: white, opacity: 0.3 }}
                />
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* 7️⃣ Footer futuriste */}
      <footer className="border-t border-white/10 bg-black py-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-16 mb-16">
            <div>
              <h4 
                className="font-light mb-6 text-white text-lg"
                style={{ 
                  fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif'
                }}
              >
                Formation
              </h4>
              <ul className="space-y-3 text-sm text-white/60 font-light">
                <li>
                  <Link 
                    href="#formations" 
                    className="hover:text-[#006CFF] transition-colors"
                    style={{ 
                      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif'
                    }}
                  >
                    Parcours disponibles
                  </Link>
                </li>
                <li>
                  <Link 
                    href="#certifications" 
                    className="hover:text-[#006CFF] transition-colors"
                    style={{ 
                      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif'
                    }}
                  >
                    Certifications
                  </Link>
                </li>
                <li>
                  <Link 
                    href="#ecosysteme" 
                    className="hover:text-[#006CFF] transition-colors"
                    style={{ 
                      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif'
                    }}
                  >
                    Écosystème
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 
                className="font-light mb-6 text-white text-lg"
                style={{ 
                  fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif'
                }}
              >
                Psychopédagogie
              </h4>
              <ul className="space-y-3 text-sm text-white/60 font-light">
                <li>
                  <Link 
                    href="#psychopedagogie" 
                    className="hover:text-[#006CFF] transition-colors"
                    style={{ 
                      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif'
                    }}
                  >
                    Accompagnement
                  </Link>
                </li>
                <li>
                  <Link 
                    href="/pages/beyond-care" 
                    className="hover:text-[#006CFF] transition-colors"
                    style={{ 
                      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif'
                    }}
                  >
                    Beyond Care
                  </Link>
                </li>
                <li>
                  <Link 
                    href="#ressources" 
                    className="hover:text-[#006CFF] transition-colors"
                    style={{ 
                      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif'
                    }}
                  >
                    Ressources
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 
                className="font-light mb-6 text-white text-lg"
                style={{ 
                  fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif'
                }}
              >
                Recrutement
              </h4>
              <ul className="space-y-3 text-sm text-white/60 font-light">
                <li>
                  <Link 
                    href="/beyond-connect" 
                    className="hover:text-[#006CFF] transition-colors"
                    style={{ 
                      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif'
                    }}
                  >
                    Beyond Connect
                  </Link>
                </li>
                <li>
                  <Link 
                    href="#entreprises" 
                    className="hover:text-[#006CFF] transition-colors"
                    style={{ 
                      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif'
                    }}
                  >
                    Entreprises partenaires
                  </Link>
                </li>
                <li>
                  <Link 
                    href="/beyond-center/contact" 
                    className="hover:text-[#006CFF] transition-colors"
                    style={{ 
                      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif'
                    }}
                  >
                    Nous contacter
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          {/* Ligne bleue animée */}
          <motion.div
            animate={{
              scaleX: [0, 1, 0],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            className="h-px mb-8 origin-left"
            style={{ backgroundColor: blue, opacity: 0.3 }}
          />

          <div className="text-center">
            <p 
              className="text-sm text-white/40 font-light"
              style={{ 
                fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif'
              }}
            >
              &copy; {new Date().getFullYear()} Beyond Center. Tous droits réservés.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
