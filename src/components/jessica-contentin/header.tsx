"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { ChevronDown, Menu, X, Heart, Brain, Users, BookOpen, Shield, Target, Lightbulb, Baby, GraduationCap, BookMarked, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { env } from "@/lib/env";
import { motion, AnimatePresence } from "framer-motion";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { getUserName } from "@/lib/utils/user-name";

// Fonction pour construire l'URL Supabase Storage
function getSupabaseStorageUrl(bucket: string, path: string): string {
  // Utiliser la même méthode que le client Supabase pour obtenir l'URL
  const supabaseUrl = 
    env.supabaseUrl || 
    (typeof window !== 'undefined' ? (window as any).__NEXT_DATA__?.env?.NEXT_PUBLIC_SUPABASE_URL : undefined) ||
    (typeof process !== 'undefined' ? process.env.NEXT_PUBLIC_SUPABASE_URL : undefined);
  
  if (!supabaseUrl) {
    console.warn("[jessica-contentin-header] NEXT_PUBLIC_SUPABASE_URL not found");
    return "";
  }
  
  // Encoder le bucket et le chemin pour gérer les espaces
  const encodedBucket = encodeURIComponent(bucket);
  const pathParts = path.split('/');
  const encodedPath = pathParts.map(part => encodeURIComponent(part)).join('/');
  
  // Construire l'URL complète avec le chemin Supabase Storage
  const fullUrl = `${supabaseUrl}/storage/v1/object/public/${encodedBucket}/${encodedPath}`;
  return fullUrl;
}

// Chemin de l'image dans Supabase Storage
// Nom exact du fichier confirmé : "Copie de Copie de Copie de Copie de Sans titre.png"
const HERO_IMAGE_PATH = "Copie de Copie de Copie de Copie de Sans titre.png"; // À la racine du bucket

// IMPORTANT: Le bucket dans Supabase s'appelle "Jessica CONTENTIN" (avec un espace)
// L'URL de l'image confirme que le bucket ID est "Jessica CONTENTIN"
const BUCKET_NAME = "Jessica CONTENTIN"; // Nom exact du bucket avec l'espace

// Construire l'URL au moment du rendu (pas au niveau du module pour avoir accès aux variables d'environnement)
const getHeroImageSrc = () => {
  const url = getSupabaseStorageUrl(BUCKET_NAME, HERO_IMAGE_PATH);
  if (url) {
    console.log("[jessica-contentin-header] Hero image URL:", url);
  }
  return url || "";
};

const HERO_IMAGE_FALLBACK = "https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=1920&q=80";

const BOOKING_URL = "https://perfactive.fr/psychopedagogue/rocquancourt/jessica-contentin";

const specialitesWithIcons = [
  { label: "Gestion de la confiance en soi", href: "/jessica-contentin/specialites/confiance-en-soi", icon: Heart },
  { label: "Gestion du stress", href: "/jessica-contentin/specialites/gestion-stress", icon: Brain },
  { label: "Accompagnement TND", href: "/jessica-contentin/specialites/tnd", icon: Users },
  { label: "Guidance parentale", href: "/jessica-contentin/specialites/guidance-parentale", icon: Baby },
  { label: "Tests de connaissance de soi", href: "/jessica-contentin/specialites/tests", icon: BookOpen },
  { label: "Harcèlement Scolaire", href: "/jessica-contentin/specialites/harcelement", icon: Shield },
  { label: "Orientation professionnelle", href: "/jessica-contentin/specialites/orientation-professionnelle", icon: Target },
  { label: "Thérapie psycho-émotionnelle", href: "/jessica-contentin/specialites/therapie", icon: Lightbulb },
  { label: "Neuroéducation", href: "/jessica-contentin/specialites/neuroeducation", icon: GraduationCap },
  { label: "Stratégie d'apprentissage", href: "/jessica-contentin/specialites/strategie-apprentissage", icon: BookMarked },
];

export function JessicaContentinHeader() {
  const pathname = usePathname();
  
  // Détecter si on est sur une page interne (pas la page d'accueil)
  // Pages internes : consultations, a-propos, orientation, specialites, ressources
  // + pages de détail du catalogue (test, ressource, module)
  // + pages de formations (interface apprenant)
  // + page mon-compte
  const isInternalPage = 
    pathname === "/consultations" || 
    pathname === "/a-propos" || 
    pathname === "/specialites" || 
    pathname.startsWith("/specialites/") || 
    pathname === "/jessica-contentin/mon-compte" || 
    pathname === "/jessica-contentin/login" ||
    pathname === "/jessica-contentin/inscription" ||
    pathname === "/jessica-contentin/panier" ||
    pathname === "/ressources" || 
    pathname.startsWith("/ressources/") ||
    pathname === "/blog" ||
    pathname.startsWith("/blog/") ||
    pathname.startsWith("/formations/") ||
    pathname === "/jessica-contentin/ressources" ||
    pathname.startsWith("/jessica-contentin/ressources/") ||
    pathname === "/jessica-contentin/consultations" ||
    pathname === "/jessica-contentin/a-propos" ||
    pathname === "/jessica-contentin/specialites" ||
    pathname.startsWith("/jessica-contentin/specialites/") ||
    pathname.startsWith("/dashboard/catalogue/test/") ||
    pathname.startsWith("/dashboard/catalogue/ressource/") ||
    pathname.startsWith("/dashboard/catalogue/module/");
  
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [isAppDomain, setIsAppDomain] = useState(false);
  const [ressourcesImageError, setRessourcesImageError] = useState(false);
  const dropdownTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [userFirstName, setUserFirstName] = useState<string | null>(null);
  
  useEffect(() => {
    // Détecter si on est sur app.jessicacontentin.fr
    if (typeof window !== 'undefined') {
      setIsAppDomain(window.location.hostname === 'app.jessicacontentin.fr');
    }

    // Vérifier l'authentification et récupérer le prénom
    const supabase = createSupabaseBrowserClient();
    if (!supabase) {
      setIsAuthenticated(false);
      return;
    }

    // Vérifier l'état initial
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (user) {
        setIsAuthenticated(true);
        // Récupérer le profil pour obtenir le prénom
        const { data: profile } = await supabase
          .from("profiles")
          .select("full_name, email")
          .eq("id", user.id)
          .maybeSingle();
        
        const firstName = getUserName(profile?.full_name || profile?.email || user.email || "");
        setUserFirstName(firstName);
      } else {
        setIsAuthenticated(false);
        setUserFirstName(null);
      }
    });

    // Écouter les changements d'authentification
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        setIsAuthenticated(true);
        const { data: profile } = await supabase
          .from("profiles")
          .select("full_name, email")
          .eq("id", session.user.id)
          .maybeSingle();
        
        const firstName = getUserName(profile?.full_name || profile?.email || session.user.email || "");
        setUserFirstName(firstName);
      } else {
        setIsAuthenticated(false);
        setUserFirstName(null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);
  
  // Initialiser l'URL de l'image hero
  const [heroImageSrc, setHeroImageSrc] = useState(() => {
    const src = getHeroImageSrc();
    if (src) {
      console.log("[jessica-contentin-header] ✅ Hero image URL from Supabase:", src);
    } else {
      console.warn("[jessica-contentin-header] ⚠️ Could not generate Supabase URL, using fallback");
      console.warn("[jessica-contentin-header] NEXT_PUBLIC_SUPABASE_URL:", process.env.NEXT_PUBLIC_SUPABASE_URL ? "✅ Found" : "❌ Not found");
    }
    return src || HERO_IMAGE_FALLBACK;
  });

  const menuItems = [
    {
      label: "A propos",
      href: "/a-propos",
    },
    {
      label: "Consultations",
      href: "/consultations",
    },
    {
      label: "Spécialités",
      href: "/jessica-contentin/specialites",
      submenu: specialitesWithIcons,
    },
    {
      label: "Ressources",
      href: "/jessica-contentin/ressources",
    },
    {
      label: "Blog",
      href: "/blog",
    },
  ];

  return (
    <>
      <div className="mx-4 mt-4">
        <header className="sticky top-4 z-50 bg-[#F8F5F0]/90 backdrop-blur-md border-b border-[#E6D9C6]/50 rounded-2xl shadow-lg">
        <nav className="mx-auto max-w-7xl px-6">
          <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center">
            <span
              className="text-xl font-normal text-[#2F2A25] whitespace-nowrap"
              style={{
                fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif',
              }}
            >
              Jessica Contentin
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center gap-1">
            {menuItems.map((item) => (
              <div
                key={item.href}
                className="relative group"
                onMouseEnter={() => {
                  if (item.submenu) {
                    // Annuler le timeout de fermeture s'il existe
                    if (dropdownTimeoutRef.current) {
                      clearTimeout(dropdownTimeoutRef.current);
                      dropdownTimeoutRef.current = null;
                    }
                    setActiveDropdown(item.href);
                  }
                }}
                onMouseLeave={() => {
                  // Délai avant de fermer le menu (300ms)
                  dropdownTimeoutRef.current = setTimeout(() => {
                    setActiveDropdown(null);
                  }, 300);
                }}
              >
                <Link
                  href={item.href}
                  className={cn(
                    "flex items-center gap-1 px-4 py-2 text-sm font-medium text-[#2F2A25] rounded-lg transition-colors hover:bg-[#E6D9C6]/50 whitespace-nowrap",
                    activeDropdown === item.href && "bg-[#E6D9C6]/50"
                  )}
                >
                  {item.label}
                  {item.submenu && <ChevronDown className="h-4 w-4" />}
                </Link>

                {/* Dropdown Menu avec icônes et colonnes */}
                <AnimatePresence>
                  {item.submenu && activeDropdown === item.href && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.3, ease: "easeOut" }}
                      className="absolute left-0 top-full mt-2 w-[900px] rounded-xl bg-[#F8F5F0] border border-[#E6D9C6] shadow-lg py-4 z-50"
                      onMouseEnter={() => {
                        // Annuler le timeout de fermeture quand la souris entre dans le menu
                        if (dropdownTimeoutRef.current) {
                          clearTimeout(dropdownTimeoutRef.current);
                          dropdownTimeoutRef.current = null;
                        }
                      }}
                      onMouseLeave={() => {
                        // Délai avant de fermer le menu (300ms)
                        dropdownTimeoutRef.current = setTimeout(() => {
                          setActiveDropdown(null);
                        }, 300);
                      }}
                    >
                      <div className="grid grid-cols-3 gap-4 px-4">
                        {item.submenu.map((subItem) => {
                          const Icon = subItem.icon;
                          return (
                            <Link
                              key={subItem.href}
                              href={subItem.href}
                              className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-[#E6D9C6]/50 transition-colors group"
                            >
                              <div className="p-1.5 bg-[#E6D9C6]/30 rounded-lg group-hover:bg-[#C6A664]/20 transition-colors">
                                <Icon className="h-4 w-4 text-[#C6A664]" />
                              </div>
                              <span className="text-sm text-[#2F2A25] font-medium">{subItem.label}</span>
                            </Link>
                          );
                        })}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>

          {/* CTA Buttons */}
          <div className="hidden lg:flex items-center gap-4">
            <Button
              asChild
              className="bg-[#C6A664] hover:bg-[#B88A44] text-white rounded-full px-6"
              style={{
                fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif',
              }}
            >
              <a href={BOOKING_URL} target="_blank" rel="noopener noreferrer">
                Prendre rendez-vous
              </a>
            </Button>
            <Button
              asChild
              variant="outline"
              className="bg-transparent hover:bg-[#C6A664]/10 border-2 border-[#8B6F47] text-[#8B6F47] hover:text-[#B88A44] hover:border-[#B88A44] rounded-full px-6"
              style={{
                fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif',
                borderColor: '#8B6F47',
                borderWidth: '2px',
              }}
            >
              <Link href="/quiz">
                Commencer
              </Link>
            </Button>
            {/* Mon compte - tout à droite, plus petit, sans bordure */}
            {isAuthenticated && userFirstName ? (
              <Link 
                href="/jessica-contentin/mon-compte"
                className="text-sm text-[#2F2A25] hover:text-[#C6A664] transition-colors flex items-center gap-1.5 px-3 py-1.5 whitespace-nowrap"
                style={{
                  fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif',
                }}
              >
                Bonjour {userFirstName}
              </Link>
            ) : (
              <Link 
                href="/jessica-contentin/mon-compte"
                className="text-sm text-[#2F2A25] hover:text-[#C6A664] transition-colors flex items-center gap-1.5 px-3 py-1.5 whitespace-nowrap"
                style={{
                  fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif',
                }}
              >
                <User className="h-3.5 w-3.5" />
              </Link>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="lg:hidden p-2 text-[#2F2A25]"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-[#E6D9C6] py-4">
            <div className="flex flex-col gap-2">
              {menuItems.map((item) => (
                <div key={item.href}>
                  <Link
                    href={item.href}
                    className="block px-4 py-2 text-sm font-medium text-[#2F2A25] rounded-lg hover:bg-[#E6D9C6]/50"
                    onClick={() => !item.submenu && setMobileMenuOpen(false)}
                  >
                    {item.label}
                  </Link>
                  {item.submenu && (
                    <div className="pl-6 mt-1 space-y-1">
                      {item.submenu.map((subItem) => {
                        const Icon = subItem.icon;
                        return (
                          <Link
                            key={subItem.href}
                            href={subItem.href}
                            className="flex items-center gap-2 px-4 py-2 text-sm text-[#2F2A25] rounded-lg hover:bg-[#E6D9C6]/50"
                            onClick={() => setMobileMenuOpen(false)}
                          >
                            <Icon className="h-4 w-4 text-[#C6A664]" />
                            {subItem.label}
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              ))}
              <div className="mt-4 flex flex-col gap-3">
                <Button
                  asChild
                  className="bg-[#C6A664] hover:bg-[#B88A44] text-white rounded-full"
                  style={{
                    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif',
                  }}
                >
                  <a href={BOOKING_URL} target="_blank" rel="noopener noreferrer">
                    Prendre rendez-vous
                  </a>
                </Button>
                <Button
                  asChild
                  variant="outline"
                  className="bg-transparent hover:bg-[#C6A664]/10 border-2 border-[#8B6F47] text-[#8B6F47] hover:text-[#B88A44] hover:border-[#B88A44] rounded-full"
                  style={{
                    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif',
                    borderColor: '#8B6F47',
                    borderWidth: '2px',
                  }}
                >
                  <Link href="/quiz">
                    Commencer
                  </Link>
                </Button>
                {/* Mon compte - plus petit, sans bordure */}
                {isAuthenticated && userFirstName ? (
                  <Link 
                    href="/jessica-contentin/mon-compte"
                    className="text-sm text-[#2F2A25] hover:text-[#C6A664] transition-colors flex items-center gap-1.5 px-3 py-1.5 whitespace-nowrap"
                    style={{
                      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif',
                    }}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Bonjour {userFirstName}
                  </Link>
                ) : (
                  <Link 
                    href="/jessica-contentin/mon-compte"
                    className="text-sm text-[#2F2A25] hover:text-[#C6A664] transition-colors flex items-center gap-1.5 px-3 py-1.5 whitespace-nowrap"
                    style={{
                      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif',
                    }}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <User className="h-3.5 w-3.5" />
                    Mon compte
                  </Link>
                )}
              </div>
            </div>
          </div>
        )}
        </nav>
      </header>
      </div>

      {/* Hero Section avec image - Masquer sur les pages internes */}
      {!isInternalPage && (
      <div className="mx-4 mb-4">
        <section className="relative w-full h-[calc(100vh-4rem)] min-h-[600px] overflow-hidden rounded-2xl shadow-lg">
        <div className="absolute inset-0">
          <div className="relative w-full h-full">
            <Image
              src={heroImageSrc || HERO_IMAGE_FALLBACK}
              alt="Hero image - Femme rayonnante avec bracelets et tissu"
              fill
              priority
              quality={85}
              className="object-cover rounded-2xl"
              sizes="100vw"
              unoptimized={heroImageSrc?.includes('supabase') ? false : true}
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                console.error("[jessica-contentin-header] ❌ Error loading image:", target.src);
                if (heroImageSrc !== HERO_IMAGE_FALLBACK) {
                  console.log("[jessica-contentin-header] Switching to fallback image");
                  setHeroImageSrc(HERO_IMAGE_FALLBACK);
                }
              }}
              onLoad={() => {
                console.log("[jessica-contentin-header] ✅ Image loaded successfully from:", heroImageSrc);
              }}
            />
          </div>
          {/* Overlay pour améliorer la lisibilité */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/10 to-black/30" />
        </div>
        
        {/* Contenu aligné à gauche sur l'image */}
        <div className="relative z-10 h-full flex flex-col items-start justify-center px-6 lg:px-16">
          <div className="text-left max-w-2xl">
            <h1
              className="text-5xl lg:text-7xl font-bold text-white mb-8 leading-tight"
              style={{
                fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif',
                textShadow: '0 2px 20px rgba(0,0,0,0.3)',
              }}
            >
              Ensemble, révélons votre potentiel
            </h1>
            <Button
              asChild
              size="lg"
              className="bg-[#C6A664] hover:bg-[#B88A44] text-white rounded-full px-8 py-6 text-lg shadow-xl"
              style={{
                fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif',
              }}
            >
              <a href={BOOKING_URL} target="_blank" rel="noopener noreferrer">
                Prendre rendez-vous
              </a>
            </Button>
          </div>
        </div>
      </section>
      </div>
      )}

      {/* Ligne de flottaison avec 3 CTA avec images - Masquer sur les pages internes */}
      {!isInternalPage && (
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="bg-[#F8F5F0] border-b border-[#E6D9C6] mx-4 mb-4 rounded-2xl overflow-hidden"
      >
        <div className="mx-auto max-w-7xl px-6 py-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 }}
              whileHover={{ scale: 1.05, y: -5 }}
            >
              <Link
                href="/consultations"
                className="group relative overflow-hidden rounded-xl bg-white border border-[#E6D9C6] hover:border-[#C6A664] hover:shadow-lg transition-all block"
              >
              <div className="relative h-48 overflow-hidden">
                <video
                  src={getSupabaseStorageUrl("Jessica CONTENTIN", "IMG_7452.mp4")}
                  autoPlay
                  loop
                  muted
                  playsInline
                  preload="metadata"
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                  onError={(e) => {
                    console.error("[Header] Erreur lors du chargement de la vidéo IMG_7452.mp4:", e);
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
              </div>
              <div className="p-6 flex flex-col items-center">
                <div className="p-3 bg-[#E6D9C6]/30 rounded-full mb-3 group-hover:bg-[#C6A664]/20 transition-colors">
                  <Heart className="h-6 w-6 text-[#C6A664]" />
                </div>
                <span
                  className="text-lg font-semibold text-[#2F2A25]"
                  style={{
                    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif',
                  }}
                >
                  Consultations
                </span>
              </div>
            </Link>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.2 }}
              whileHover={{ scale: 1.05, y: -5 }}
            >
              <Link
                href="/jessica-contentin/specialites"
                className="group relative overflow-hidden rounded-xl bg-white border border-[#E6D9C6] hover:border-[#C6A664] hover:shadow-lg transition-all block"
              >
              <div className="relative h-48 overflow-hidden">
                <Image
                  src={getSupabaseStorageUrl("Jessica CONTENTIN", "IMG_8896.jpeg") || "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=800&q=80"}
                  alt="Formations"
                  fill
                  className="object-cover transition-transform duration-300 group-hover:scale-110"
                  sizes="(max-width: 768px) 100vw, 33vw"
                  unoptimized={false}
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    console.error("[Header] Erreur lors du chargement de l'image IMG_8896.jpeg:", target.src);
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
              </div>
              <div className="p-6 flex flex-col items-center">
                <div className="p-3 bg-[#E6D9C6]/30 rounded-full mb-3 group-hover:bg-[#C6A664]/20 transition-colors">
                  <Brain className="h-6 w-6 text-[#C6A664]" />
                </div>
                <span
                  className="text-lg font-semibold text-[#2F2A25]"
                  style={{
                    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif',
                  }}
                >
                  Formations
                </span>
              </div>
            </Link>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.3 }}
              whileHover={{ scale: 1.05, y: -5 }}
            >
              <Link
                href="/jessica-contentin/ressources"
                className="group relative overflow-hidden rounded-xl bg-white border border-[#E6D9C6] hover:border-[#C6A664] hover:shadow-lg transition-all block"
              >
              <div className="relative h-48 overflow-hidden">
                <Image
                  src={ressourcesImageError 
                    ? "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=800&q=80"
                    : (getSupabaseStorageUrl("Jessica CONTENTIN", "cta/ressources.jpg") || "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=800&q=80")
                  }
                  alt="Ressources"
                  fill
                  className="object-cover transition-transform duration-300 group-hover:scale-110"
                  sizes="(max-width: 768px) 100vw, 33vw"
                  unoptimized={true}
                  onError={() => {
                    if (!ressourcesImageError) {
                      console.warn("[Header] Image ressources.jpg non trouvée, utilisation du fallback");
                      setRessourcesImageError(true);
                    }
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
              </div>
              <div className="p-6 flex flex-col items-center">
                <div className="p-3 bg-[#E6D9C6]/30 rounded-full mb-3 group-hover:bg-[#C6A664]/20 transition-colors">
                  <BookOpen className="h-6 w-6 text-[#C6A664]" />
                </div>
                <span
                  className="text-lg font-semibold text-[#2F2A25]"
                  style={{
                    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif',
                  }}
                >
                  Ressources
                </span>
              </div>
            </Link>
            </motion.div>
          </div>
        </div>
      </motion.div>
      )}
    </>
  );
}

