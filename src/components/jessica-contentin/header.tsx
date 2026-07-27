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
  Sparkles,
  Compass,
  Target,
  Puzzle,
  type LucideIcon,
  Smartphone,
  Download,
  GraduationCap,
  FileText,
  HelpCircle,
  Newspaper,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { getUserName } from "@/lib/utils/user-name";

const BOOKING_URL = "https://perfactive.fr/psychopedagogue/rocquancourt/jessica-contentin";

const apprentissageMegaMenu: { label: string; href: string; icon: LucideIcon }[] = [
  { label: "Difficultés d'apprentissage", href: "/specialites/strategie-apprentissage", icon: BookOpen },
  { label: "Méthodologie de travail", href: "/specialites/methodologie-de-travail", icon: Target },
  { label: "Collège", href: "/specialites/college", icon: BookOpen },
  { label: "Lycée", href: "/specialites/lycee", icon: GraduationCap },
  { label: "Études supérieures", href: "/specialites/etudes-superieures", icon: GraduationCap },
  { label: "Orientation", href: "/specialites/orientation-professionnelle", icon: Compass },
];

const neurodeveloppementMegaMenu: { label: string; href: string; icon: LucideIcon }[] = [
  { label: "TDAH", href: "/specialites/tdah", icon: Brain },
  { label: "Troubles DYS", href: "/specialites/troubles-dys", icon: Puzzle },
  { label: "TSA", href: "/specialites/tsa", icon: Puzzle },
  { label: "Haut potentiel intellectuel (HPI)", href: "/specialites/haut-potentiel", icon: Sparkles },
];

const emotionsMegaMenu: { label: string; href: string; icon: LucideIcon }[] = [
  { label: "Régulation émotionnelle", href: "/specialites/regulation-emotionnelle", icon: Heart },
  { label: "Confiance en soi", href: "/specialites/confiance-en-soi", icon: Sparkles },
  { label: "Motivation", href: "/specialites/confiance-en-soi", icon: Target },
];

const ressourcesMegaMenu: { label: string; href: string; icon: LucideIcon; description: string }[] = [
  {
    label: "Articles",
    href: "/blog",
    icon: FileText,
    description: "Conseils et décryptages en neuroéducation",
  },
  {
    label: "Guides PDF",
    href: "/ressources/telecharger",
    icon: Download,
    description: "Fiches et guides psychopédagogiques",
  },
  {
    label: "Conseils",
    href: "/blog",
    icon: Sparkles,
    description: "Astuces pratiques pour le quotidien",
  },
  {
    label: "FAQ",
    href: "/consultations",
    icon: HelpCircle,
    description: "Questions fréquentes sur les accompagnements",
  },
  {
    label: "Actualités",
    href: "/blog",
    icon: Newspaper,
    description: "Dernières publications et actualités",
  },
  {
    label: "NEVO",
    href: "/ressources/application-neuro-adaptee",
    icon: Smartphone,
    description: "La plateforme qui prolonge les séances entre deux rendez-vous",
  },
];

export function JessicaContentinHeader() {
  const pathname = usePathname();
  const isHomePage =
    pathname === "/" ||
    pathname === "/jessica-contentin" ||
    pathname?.replace(/\/$/, "") === "/jessica-contentin";
  
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileOpenCategory, setMobileOpenCategory] = useState<string | null>(null);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const dropdownTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [userFirstName, setUserFirstName] = useState<string | null>(null);
  const [isMounted, setIsMounted] = useState(false);
  const [scrolledPastHero, setScrolledPastHero] = useState(false);

  // S'assurer que le composant est monté côté client avant de faire des opérations client-side
  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!isMounted || !isHomePage) {
      setScrolledPastHero(false);
      return;
    }

    const hero = document.getElementById("accueil-video");
    if (!hero) return;

    const updateHeaderState = () => {
      const heroBottom = hero.getBoundingClientRect().bottom;
      setScrolledPastHero(heroBottom <= 72);
    };

    updateHeaderState();
    window.addEventListener("scroll", updateHeaderState, { passive: true });
    window.addEventListener("resize", updateHeaderState);

    return () => {
      window.removeEventListener("scroll", updateHeaderState);
      window.removeEventListener("resize", updateHeaderState);
    };
  }, [isHomePage, isMounted]);
  
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

  const closeMenus = () => {
    if (dropdownTimeoutRef.current) {
      clearTimeout(dropdownTimeoutRef.current);
      dropdownTimeoutRef.current = null;
    }
    setActiveDropdown(null);
    setMobileMenuOpen(false);
    setMobileOpenCategory(null);
  };

  useEffect(() => {
    if (!mobileMenuOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [mobileMenuOpen]);
 
  const menuItems = [
    {
      label: "Apprentissage et méthodologie",
      href: "/specialites/strategie-apprentissage",
      submenuItems: apprentissageMegaMenu,
    },
    {
      label: "Neurodéveloppement",
      href: "/specialites/tnd",
      submenuItems: neurodeveloppementMegaMenu,
    },
    {
      label: "Emotions et confiance",
      href: "/specialites/regulation-emotionnelle",
      submenuItems: emotionsMegaMenu,
    },
    {
      label: "Méthode",
      href: "/methode",
    },
    {
      label: "Ressources",
      href: "/ressources",
      submenuItems: ressourcesMegaMenu,
    },
  ];

  return (
    <>
      <div className={cn(isHomePage ? "fixed top-0 left-0 right-0 z-50" : "mx-4 mt-4")}>
        <header
          className={cn(
            "border-b border-black/[0.06] bg-white/70 shadow-[0_8px_30px_-18px_rgba(47,42,37,0.35)] backdrop-blur-xl backdrop-saturate-150 transition-[background-color,box-shadow] duration-300",
            isHomePage
              ? scrolledPastHero
                ? "bg-white/80 shadow-[0_10px_36px_-16px_rgba(47,42,37,0.4)]"
                : "bg-white/65"
              : "sticky top-4 z-50 mx-0 rounded-2xl bg-white/75 shadow-lg",
          )}
        >
        <nav className="mx-auto max-w-7xl px-6">
          <div className="flex h-16 items-center justify-between lg:h-20">
          {/* Logo */}
          <Link href="/" className="flex items-center">
            <span
              className="whitespace-nowrap text-xl font-normal text-[#2F2A25]"
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
                  if (item.submenuColumns || item.submenuItems) {
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
                  onClick={() => {
                    if (item.submenuColumns || item.submenuItems) {
                      closeMenus();
                    }
                  }}
                  className={cn(
                    "flex items-center gap-1 whitespace-nowrap rounded-lg px-4 py-2 text-sm font-medium text-[#2F2A25] transition-colors hover:bg-black/[0.04]",
                    activeDropdown === item.href && "bg-black/[0.04]",
                  )}
                >
                  {item.label}
                  {item.submenuColumns && <ChevronDown className="h-4 w-4" />}
                  {item.submenuItems && <ChevronDown className="h-4 w-4" />}
                </Link>

                {/* Dropdown Menu avec icônes et colonnes */}
                <AnimatePresence>
                  {item.submenuItems && activeDropdown === item.href && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.3, ease: "easeOut" }}
                      className="absolute left-1/2 top-full mt-3 w-[min(380px,calc(100vw-2rem))] -translate-x-1/2 rounded-2xl border border-[#E6D9C6] bg-[#F8F5F0] py-4 shadow-xl z-50"
                      onMouseEnter={() => {
                        if (dropdownTimeoutRef.current) {
                          clearTimeout(dropdownTimeoutRef.current);
                          dropdownTimeoutRef.current = null;
                        }
                      }}
                      onMouseLeave={() => {
                        dropdownTimeoutRef.current = setTimeout(() => {
                          setActiveDropdown(null);
                        }, 300);
                      }}
                    >
                      <div className="space-y-1 px-3">
                        {item.submenuItems.map((subItem) => (
                          <Link
                            key={`${subItem.href}-${subItem.label}`}
                            href={subItem.href}
                            onClick={closeMenus}
                            className="flex items-start gap-3 rounded-xl px-3 py-3 text-[#2F2A25] hover:bg-[#E6D9C6]/40 transition-colors"
                          >
                            <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white ring-1 ring-[#E6D9C6]">
                              <subItem.icon className="h-4 w-4 text-[#8B6F47]" />
                            </span>
                            <span>
                              <span className="block text-sm font-medium leading-snug">{subItem.label}</span>
                              <span className="mt-0.5 block text-xs text-[#5C5348]">{subItem.description}</span>
                            </span>
                          </Link>
                        ))}
                      </div>
                    </motion.div>
                  )}
                  {item.submenuColumns && activeDropdown === item.href && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.3, ease: "easeOut" }}
                      className="absolute left-1/2 top-full mt-3 w-[920px] max-w-[calc(100vw-2rem)] -translate-x-1/2 rounded-2xl bg-[#F8F5F0] border border-[#E6D9C6] shadow-xl py-6 z-50"
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
                      <div className="grid grid-cols-3 gap-8 px-8">
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
                                  onClick={closeMenus}
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
              className={cn(
                "!rounded-full !border !border-[#E5DED4] !bg-[#F5F0E9] !px-7 !py-5 !text-sm !font-semibold !text-[#2F2A25] !shadow-[0_10px_28px_-16px_rgba(60,48,36,0.3)] hover:!bg-[#EBE4D8]",
              )}
              style={{
                fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif',
              }}
            >
              <a href={BOOKING_URL} target="_blank" rel="noopener noreferrer">
                Prendre rendez-vous
              </a>
            </Button>
            {/* Mon compte - tout à droite, plus petit, sans bordure */}
            {/* Utiliser isMounted pour éviter les problèmes d'hydratation */}
            {isMounted && isAuthenticated && userFirstName ? (
              <Link 
                href="/mon-compte"
                className="flex items-center gap-1.5 whitespace-nowrap px-3 py-1.5 text-sm text-[#2F2A25] transition-colors hover:text-[#5C5348]"
                style={{
                  fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif',
                }}
              >
                Bonjour {userFirstName}
              </Link>
            ) : (
              <Link 
                href="/mon-compte"
                className="flex items-center gap-1.5 whitespace-nowrap px-3 py-1.5 text-sm text-[#2F2A25] transition-colors hover:text-[#5C5348]"
              >
                <User className="h-3.5 w-3.5" />
              </Link>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="p-2 text-[#2F2A25] lg:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="mx-3 mb-3 max-h-[min(70dvh,calc(100dvh-5.5rem))] overflow-y-auto overscroll-contain rounded-2xl border border-black/[0.06] bg-white/80 py-3 shadow-lg backdrop-blur-xl lg:hidden">
            <div className="flex flex-col gap-1 px-1">
              {menuItems.map((item) => {
                const hasSub =
                  Boolean(item.submenuItems?.length) || Boolean(item.submenuColumns?.length);
                const isOpen = mobileOpenCategory === item.href;

                if (!hasSub) {
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className="block rounded-lg px-4 py-3 text-sm font-medium text-[#2F2A25] hover:bg-black/[0.04]"
                      onClick={closeMenus}
                    >
                      {item.label}
                    </Link>
                  );
                }

                return (
                  <div key={item.href} className="border-b border-black/5 last:border-0">
                    <button
                      type="button"
                      className="flex w-full items-center justify-between rounded-lg px-4 py-3 text-left text-sm font-medium text-[#2F2A25] hover:bg-black/[0.04]"
                      onClick={() =>
                        setMobileOpenCategory((prev) => (prev === item.href ? null : item.href))
                      }
                      aria-expanded={isOpen}
                    >
                      <span>{item.label}</span>
                      <ChevronDown
                        className={cn(
                          "h-4 w-4 shrink-0 text-[#8B6F47] transition-transform",
                          isOpen && "rotate-180",
                        )}
                      />
                    </button>

                    {isOpen ? (
                      <div className="space-y-1 pb-3 pl-2 pr-2">
                        <Link
                          href={item.href}
                          className="block rounded-lg px-4 py-2 text-xs font-semibold uppercase tracking-wide text-[#8B6F47] hover:bg-black/[0.04]"
                          onClick={closeMenus}
                        >
                          Voir la page
                        </Link>
                        {item.submenuItems?.map((subItem, idx) => (
                          <Link
                            key={`${subItem.href}-${subItem.label}-${idx}`}
                            href={subItem.href}
                            className="block rounded-lg px-4 py-2.5 text-sm text-[#5C5348] hover:bg-black/[0.04] hover:text-[#2F2A25]"
                            onClick={closeMenus}
                          >
                            {subItem.label}
                          </Link>
                        ))}
                        {item.submenuColumns?.map((column) => (
                          <div key={column.title} className="space-y-1 pt-1">
                            <div className="px-4 pt-2 text-xs font-semibold uppercase tracking-wider text-[#8B6F47]">
                              {column.title}
                            </div>
                            {column.items.map((subItem) => (
                              <Link
                                key={subItem.href + subItem.label}
                                href={subItem.href}
                                className="block rounded-lg px-4 py-2.5 text-sm text-[#5C5348] hover:bg-black/[0.04] hover:text-[#2F2A25]"
                                onClick={closeMenus}
                              >
                                {subItem.label}
                              </Link>
                            ))}
                          </div>
                        ))}
                      </div>
                    ) : null}
                  </div>
                );
              })}

              <div className="mt-3 flex flex-col gap-3 px-3 pb-2">
                <Button
                  asChild
                  className="!rounded-full !border !border-[#E5DED4] !bg-[#F5F0E9] !px-6 !py-5 !text-sm !font-semibold !text-[#2F2A25] !shadow-md hover:!bg-[#EBE4D8]"
                  style={{
                    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif',
                  }}
                >
                  <a href={BOOKING_URL} target="_blank" rel="noopener noreferrer">
                    Prendre rendez-vous
                  </a>
                </Button>
                {isMounted && isAuthenticated && userFirstName ? (
                  <Link
                    href="/jessica-contentin/mon-compte"
                    className="flex items-center gap-1.5 whitespace-nowrap px-3 py-1.5 text-sm text-[#2F2A25] transition-colors hover:text-[#5C5348]"
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
                    className="flex items-center gap-1.5 whitespace-nowrap px-3 py-1.5 text-sm text-[#2F2A25] transition-colors hover:text-[#5C5348]"
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

