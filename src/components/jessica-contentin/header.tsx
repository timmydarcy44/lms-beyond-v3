"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ChevronDown,
  Menu,
  X,
  User,
  Heart,
  Brain,
  BookOpen,
  BrainCircuit,
  Shield,
  Sparkles,
  Compass,
  Target,
  Activity,
  Briefcase,
  Lightbulb,
  Users,
  Puzzle,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { getUserName } from "@/lib/utils/user-name";

const BOOKING_URL = "https://perfactive.fr/psychopedagogue/rocquancourt/jessica-contentin";

const specialitesMegaMenu: {
  title: string;
  items: { label: string; href: string; icon: LucideIcon }[];
}[] = [
  {
    title: "ENFANTS & ADOS",
    items: [
      { label: "Accompagnement TND", href: "/jessica-contentin/specialites/tnd", icon: Puzzle },
      { label: "Harcèlement scolaire", href: "/jessica-contentin/specialites/harcelement", icon: Shield },
      { label: "Gestion des émotions", href: "/jessica-contentin/specialites/therapie", icon: Heart },
      { label: "Neuroéducation", href: "/jessica-contentin/specialites/neuroeducation", icon: BrainCircuit },
    ],
  },
  {
    title: "ÉTUDIANTS",
    items: [
      { label: "Orientation & projet de vie", href: "/jessica-contentin/specialites/orientation-professionnelle", icon: Compass },
      { label: "Stratégie d'apprentissage", href: "/jessica-contentin/specialites/strategie-apprentissage", icon: Target },
      { label: "Gestion du stress examens", href: "/jessica-contentin/specialites/gestion-stress", icon: Activity },
      { label: "Neuroéducation", href: "/jessica-contentin/specialites/neuroeducation", icon: Brain },
      { label: "Confiance en soi", href: "/jessica-contentin/specialites/confiance-en-soi", icon: Sparkles },
    ],
  },
  {
    title: "ADULTES",
    items: [
      { label: "Orientation professionnelle", href: "/jessica-contentin/specialites/orientation-professionnelle", icon: Briefcase },
      { label: "Gestion des émotions", href: "/jessica-contentin/specialites/therapie", icon: Heart },
      { label: "Confiance en soi", href: "/jessica-contentin/specialites/confiance-en-soi", icon: Sparkles },
      { label: "Gestion du stress", href: "/jessica-contentin/specialites/gestion-stress", icon: Activity },
      { label: "Soft skills & reconversion", href: "/jessica-contentin/orientation", icon: Lightbulb },
    ],
  },
  {
    title: "PARENTS",
    items: [
      { label: "Guidance parentale", href: "/jessica-contentin/specialites/guidance-parentale", icon: Users },
      { label: "Comprendre le TND de mon enfant", href: "/jessica-contentin/specialites/tnd", icon: Puzzle },
      { label: "Accompagnement parental TND", href: "/jessica-contentin/specialites/tnd", icon: Heart },
      { label: "Harcèlement — que faire ?", href: "/jessica-contentin/specialites/harcelement", icon: Shield },
      { label: "Stratégies éducatives", href: "/jessica-contentin/specialites/guidance-parentale", icon: BookOpen },
    ],
  },
];

export function JessicaContentinHeader() {
  const pathname = usePathname();
  
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const dropdownTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [userFirstName, setUserFirstName] = useState<string | null>(null);
  const [isMounted, setIsMounted] = useState(false);
  
  // S'assurer que le composant est monté côté client avant de faire des opérations client-side
  useEffect(() => {
    setIsMounted(true);
  }, []);
  
  useEffect(() => {
    // Ne rien faire si le composant n'est pas encore monté
    if (!isMounted) return;
    
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
  }, [isMounted]);
  
  const menuItems = [
    {
      label: "Consultations",
      href: "/jessica-contentin/consultations",
    },
    {
      label: "Spécialités",
      href: "/jessica-contentin/specialites",
      submenuColumns: specialitesMegaMenu,
    },
    {
      label: "Ressources",
      href: "/jessica-contentin/ressources",
    },
    {
      label: "Blog",
      href: "/jessica-contentin/blog",
    },
  ];

  return (
    <>
      <div className="mx-4 mt-4">
        <header className="sticky top-4 z-50 bg-[#F8F5F0]/90 backdrop-blur-md border-b border-[#E6D9C6]/50 rounded-2xl shadow-lg">
        <nav className="mx-auto max-w-7xl px-6">
          <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/jessica-contentin" className="flex items-center">
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
                  if (item.submenuColumns) {
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
                  {item.submenuColumns && <ChevronDown className="h-4 w-4" />}
                </Link>

                {/* Dropdown Menu avec icônes et colonnes */}
                <AnimatePresence>
                  {item.submenuColumns && activeDropdown === item.href && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.3, ease: "easeOut" }}
                      className="absolute left-1/2 top-full mt-3 w-[1040px] max-w-[calc(100vw-2rem)] -translate-x-1/2 rounded-2xl bg-[#F8F5F0] border border-[#E6D9C6] shadow-xl py-6 z-50"
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
                      <div className="grid grid-cols-4 gap-8 px-8">
                        {item.submenuColumns.map((column) => (
                          <div key={column.title} className="space-y-4">
                            <div className="text-[11px] font-semibold text-[#8B6F47] uppercase tracking-[0.18em]">
                              {column.title}
                            </div>
                            <div className="h-px w-full bg-[#E6D9C6]" />
                            <div className="space-y-2">
                              {column.items.map((subItem) => (
                                <Link
                                  key={subItem.href + subItem.label}
                                  href={subItem.href}
                                  className="flex items-center gap-3 rounded-lg px-2.5 py-2 text-sm text-[#2F2A25] hover:text-[#8B6F47] hover:bg-[#E6D9C6]/40 transition-colors"
                                >
                                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/70 ring-1 ring-[#E6D9C6]">
                                    <subItem.icon className="h-4 w-4 text-[#8B6F47]" />
                                  </span>
                                  <span className="leading-snug">{subItem.label}</span>
                                </Link>
                              ))}
                            </div>
                          </div>
                        ))}
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
              className="!rounded-full !border !border-[#C6A664] !bg-[#C6A664] !px-6 !text-white hover:!bg-[#B88A44]"
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
              className="!rounded-full !border-2 !border-[#C6A664] !bg-transparent !px-6 !text-[#8B6F47] hover:!border-[#B88A44] hover:!bg-[#C6A664]/10 hover:!text-[#B88A44]"
              style={{
                fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif',
                borderColor: '#8B6F47',
                borderWidth: '2px',
              }}
            >
              <Link href="/jessica-contentin/inscription">
                Commencer
              </Link>
            </Button>
            {/* Mon compte - tout à droite, plus petit, sans bordure */}
            {/* Utiliser isMounted pour éviter les problèmes d'hydratation */}
            {isMounted && isAuthenticated && userFirstName ? (
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
                    onClick={() => !item.submenuColumns && setMobileMenuOpen(false)}
                  >
                    {item.label}
                  </Link>
                  {item.submenuColumns && (
                    <div className="pl-6 mt-3 space-y-4">
                      {item.submenuColumns.map((column) => (
                        <div key={column.title} className="space-y-2">
                          <div className="text-xs font-semibold text-[#8B6F47] uppercase tracking-wider">
                            {column.title}
                          </div>
                          <div className="space-y-1">
                            {column.items.map((subItem) => (
                              <Link
                                key={subItem.href + subItem.label}
                                href={subItem.href}
                                className="block px-4 py-2 text-sm text-[#2F2A25] rounded-lg hover:bg-[#E6D9C6]/50"
                                onClick={() => setMobileMenuOpen(false)}
                              >
                                {subItem.label}
                              </Link>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
              <div className="mt-4 flex flex-col gap-3">
                <Button
                  asChild
                  className="!rounded-full !border !border-[#C6A664] !bg-[#C6A664] !text-white hover:!bg-[#B88A44]"
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
                  className="!rounded-full !border-2 !border-[#C6A664] !bg-transparent !text-[#8B6F47] hover:!border-[#B88A44] hover:!bg-[#C6A664]/10 hover:!text-[#B88A44]"
                  style={{
                    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif',
                    borderColor: '#8B6F47',
                    borderWidth: '2px',
                  }}
                >
                  <Link href="/jessica-contentin/inscription">
                    Commencer
                  </Link>
                </Button>
                {/* Mon compte - plus petit, sans bordure */}
                {/* Utiliser isMounted pour éviter les problèmes d'hydratation */}
                {isMounted && isAuthenticated && userFirstName ? (
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

    </>
  );
}

