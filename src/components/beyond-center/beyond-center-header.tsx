"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  Brain,
  ChevronDown,
  LayoutDashboard,
  Menu,
  Sparkles,
  Users,
  X,
} from "lucide-react";

type SectionTheme = { id: string; theme: "dark" | "light" };

const SECTION_THEME_HOME: SectionTheme[] = [
  { id: "hero", theme: "dark" },
  { id: "probleme", theme: "dark" },
  { id: "transition", theme: "light" },
  { id: "comment", theme: "light" },
  { id: "plateforme", theme: "light" },
  { id: "humain", theme: "light" },
  { id: "preuve", theme: "light" },
  { id: "ressources", theme: "light" },
  { id: "pilote", theme: "dark" },
];

const SECTION_THEME_SOLUTION: SectionTheme[] = [
  { id: "sol-hero", theme: "dark" },
  { id: "sol-probleme", theme: "dark" },
  { id: "sol-pivot", theme: "dark" },
  { id: "sol-methode", theme: "light" },
  { id: "sol-produit", theme: "light" },
  { id: "sol-humain", theme: "light" },
  { id: "sol-resultats", theme: "light" },
  { id: "sol-cta", theme: "dark" },
];

const SECTION_THEME_APPROCHE: SectionTheme[] = [
  { id: "app-hero", theme: "dark" },
  { id: "app-why", theme: "light" },
  { id: "app-how-thinking", theme: "light" },
  { id: "app-how-methode", theme: "light" },
  { id: "app-what", theme: "light" },
  { id: "app-philo", theme: "light" },
  { id: "app-cta", theme: "dark" },
];

const SECTION_THEME_PLATEFORME: SectionTheme[] = [
  { id: "plt-hero", theme: "dark" },
  { id: "plt-corps", theme: "light" },
  { id: "plt-cta", theme: "dark" },
];

const SECTION_THEME_RESSOURCES: SectionTheme[] = [
  { id: "res-hero", theme: "dark" },
  { id: "res-corps", theme: "light" },
  { id: "res-cta", theme: "dark" },
];

const SECTION_THEME_PILOTE: SectionTheme[] = [
  { id: "pil-hero", theme: "dark" },
  { id: "pil-corps", theme: "light" },
  { id: "pil-cta", theme: "dark" },
];

const THEME_BY_PATH: Record<string, SectionTheme[]> = {
  "/": SECTION_THEME_HOME,
  "/solution": SECTION_THEME_SOLUTION,
  "/approche": SECTION_THEME_APPROCHE,
  "/plateforme": SECTION_THEME_PLATEFORME,
  "/beyond-center/ressources": SECTION_THEME_RESSOURCES,
  "/pilote": SECTION_THEME_PILOTE,
};

function useHeaderTheme(pathname: string | null) {
  const [theme, setTheme] = useState<"dark" | "light">("dark");

  const update = useCallback(() => {
    const map = (pathname && THEME_BY_PATH[pathname]) ?? SECTION_THEME_HOME;
    const probe = window.scrollY + 76;
    let next: "dark" | "light" = "dark";
    for (const { id, theme: t } of map) {
      const el = document.getElementById(id);
      if (!el) continue;
      const top = el.offsetTop;
      if (probe >= top - 2) next = t;
    }
    setTheme(next);
  }, [pathname]);

  useEffect(() => {
    const raf = requestAnimationFrame(() => update());
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, [update]);

  return theme;
}

function useHeaderThemeBridge() {
  const pathname = usePathname();
  return useHeaderTheme(pathname);
}

const MEGA_COLUMNS = [
  {
    title: "Comprendre vos équipes",
    description: "Identifiez comment vos collaborateurs pensent, réagissent et fonctionnent.",
    icon: Brain,
    items: [
      "Diagnostic cognitif",
      "Analyse des soft skills",
      "Stress et charge mentale",
      "Fonctionnement individuel",
    ],
  },
  {
    title: "Structurer votre développement",
    description: "Transformez l’analyse en stratégie concrète de progression.",
    icon: LayoutDashboard,
    items: [
      "Stratégie RH personnalisée",
      "Cartographie des profils",
      "Plans de développement",
      "Recommandations ciblées",
    ],
  },
  {
    title: "Déployer la progression",
    description: "Activez la montée en compétences grâce à un système digital durable.",
    icon: Sparkles,
    items: [
      "Plateforme digitale",
      "Micro-learning",
      "Parcours personnalisés",
      "Suivi de progression",
    ],
  },
  {
    title: "Accompagnement humain",
    description: "Ajoutez une couche humaine pour transformer les insights en action.",
    icon: Users,
    items: [
      "Restitution individuelle",
      "Sessions 1:1",
      "Ateliers équipe",
      "Coaching ciblé",
    ],
  },
];

function cn(...p: (string | false | undefined)[]) {
  return p.filter(Boolean).join(" ");
}

export function BeyondCenterHeader() {
  const theme = useHeaderThemeBridge();
  const pathname = usePathname();
  const homeHref = pathname && pathname !== "/" ? "/" : "/#hero";
  const [megaOpen, setMegaOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mobileSolutionOpen, setMobileSolutionOpen] = useState(false);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const headerRef = useRef<HTMLElement>(null);

  const clearClose = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
  };

  const scheduleClose = () => {
    clearClose();
    closeTimer.current = setTimeout(() => setMegaOpen(false), 160);
  };

  useEffect(() => {
    if (!megaOpen) return;
    const onDown = (e: MouseEvent) => {
      if (headerRef.current && !headerRef.current.contains(e.target as Node)) setMegaOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [megaOpen]);

  useEffect(() => {
    if (mobileOpen) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  const isLight = theme === "light";

  const shell = cn(
    "border-b transition-[background-color,border-color,box-shadow] duration-300 ease-out",
    isLight
      ? "border-slate-200/70 bg-[rgba(255,255,255,0.72)] shadow-[0_1px_0_rgba(15,23,42,0.04)]"
      : "border-white/[0.08] bg-[rgba(10,10,20,0.55)] shadow-[0_1px_0_rgba(255,255,255,0.04)]",
  );

  const link = cn(
    "rounded-lg px-3 py-2 text-[13.5px] font-medium transition-colors duration-200",
    isLight ? "text-slate-600 hover:bg-slate-900/[0.04] hover:text-slate-900" : "text-slate-300 hover:bg-white/[0.06] hover:text-white",
  );

  const logoClass = cn("text-[17px] font-semibold tracking-[-0.03em] transition-colors", isLight ? "text-slate-900" : "text-white");

  return (
    <>
      <header ref={headerRef} className="relative sticky top-0 z-[100]">
        <div className={shell} style={{ WebkitBackdropFilter: "blur(18px)", backdropFilter: "blur(18px)" }}>
          <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-3.5 md:px-8 md:py-4">
            <Link href={homeHref} className={logoClass} onClick={() => setMobileOpen(false)}>
              Beyond Center
            </Link>

            <nav className="hidden items-center gap-1 lg:flex" aria-label="Navigation principale">
              <Link href="/approche" className={link}>
                Approche
              </Link>
              <div
                className="relative"
                onMouseEnter={() => {
                  clearClose();
                  setMegaOpen(true);
                }}
                onMouseLeave={scheduleClose}
              >
                <Link
                  href="/solution"
                  className={cn(
                    "flex items-center gap-1 rounded-lg px-3 py-2 text-[13.5px] font-medium transition-colors duration-200",
                    isLight ? "text-slate-600 hover:bg-slate-900/[0.04] hover:text-slate-900" : "text-slate-300 hover:bg-white/[0.06] hover:text-white",
                    megaOpen && (isLight ? "text-slate-900" : "text-white"),
                    pathname === "/solution" && (isLight ? "text-slate-900" : "text-white"),
                  )}
                >
                  Solution
                  <ChevronDown
                    className={cn("h-3.5 w-3.5 opacity-60 transition-transform", megaOpen && "rotate-180")}
                    aria-hidden
                  />
                </Link>
              </div>
              <Link href="/plateforme" className={link}>
                Plateforme
              </Link>
              <Link href="/ressources" className={link}>
                Ressources
              </Link>
              <Link
                href="/login"
                className={cn(
                  "ml-2 rounded-lg px-3 py-2 text-[13.5px] font-medium transition-colors duration-200",
                  isLight ? "text-slate-500 hover:text-slate-800" : "text-slate-400 hover:text-white",
                )}
              >
                Connexion
              </Link>
            </nav>

            <div className="flex items-center gap-3">
              <motion.a
                href="/pilote"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={cn(
                  "hidden rounded-full px-5 py-2.5 text-[13.5px] font-semibold transition-shadow duration-300 sm:inline-flex",
                  isLight
                    ? "bg-slate-900 text-white shadow-[0_8px_24px_-6px_rgba(15,23,42,0.35)] hover:shadow-[0_12px_28px_-6px_rgba(99,102,241,0.25)]"
                    : "bg-gradient-to-r from-violet-500 to-cyan-400 text-slate-950 shadow-[0_8px_28px_-8px_rgba(139,92,246,0.45)] hover:shadow-[0_12px_32px_-6px_rgba(34,211,238,0.35)]",
                )}
              >
                Lancer un pilote
              </motion.a>
              <button
                type="button"
                className={cn(
                  "flex h-10 w-10 items-center justify-center rounded-xl border transition-colors lg:hidden",
                  isLight ? "border-slate-200/80 text-slate-800 hover:bg-slate-100" : "border-white/15 text-white hover:bg-white/10",
                )}
                aria-label={mobileOpen ? "Fermer le menu" : "Ouvrir le menu"}
                onClick={() => setMobileOpen((o) => !o)}
              >
                {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mega menu desktop */}
        <AnimatePresence>
          {megaOpen && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
              className="absolute left-0 right-0 top-full hidden border-b border-slate-200/60 bg-[rgba(255,255,255,0.88)] shadow-[0_24px_48px_-24px_rgba(15,23,42,0.18)] lg:block"
              style={{ WebkitBackdropFilter: "blur(20px)", backdropFilter: "blur(20px)" }}
              onMouseEnter={clearClose}
              onMouseLeave={scheduleClose}
            >
              <div className="mx-auto grid max-w-6xl gap-8 px-6 py-10 md:px-8 lg:grid-cols-[260px_1fr] lg:gap-10">
                <div className="rounded-2xl border border-slate-200/60 bg-gradient-to-br from-violet-50/90 via-white to-cyan-50/50 p-7 shadow-sm">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-violet-600/80">Beyond Center</p>
                  <h3 className="mt-3 text-[18px] font-semibold leading-snug tracking-[-0.02em] text-slate-900">
                    Une nouvelle façon de développer les équipes
                  </h3>
                  <p className="mt-3 text-[14px] font-medium text-slate-600">Comprendre. Structurer. Déployer.</p>
                  <Link
                    href="/solution"
                    className="mt-4 inline-block text-[12px] font-semibold text-violet-700 transition-colors hover:text-violet-900"
                    onClick={() => setMegaOpen(false)}
                  >
                    Page Solution complète →
                  </Link>
                  <Link
                    href="/pilote"
                    onClick={() => setMegaOpen(false)}
                    className="mt-6 inline-flex w-full items-center justify-center rounded-full bg-slate-900 py-3 text-[13.5px] font-semibold text-white transition-shadow hover:shadow-lg"
                  >
                    Lancer un pilote
                  </Link>
                </div>
                <div className="grid gap-8 sm:grid-cols-2 xl:grid-cols-4">
                  {MEGA_COLUMNS.map((col, colIndex) => (
                    <div
                      key={col.title}
                      className={cn("min-w-0", colIndex > 0 && "xl:border-l xl:border-slate-200/60 xl:pl-6")}
                    >
                      <div className="mb-3 flex items-center gap-2">
                        <col.icon className="h-4 w-4 text-violet-500/80" strokeWidth={1.75} />
                        <h4 className="text-[14px] font-semibold tracking-[-0.01em] text-slate-900">{col.title}</h4>
                      </div>
                      <ul className="space-y-2.5">
                        {col.items.map((item) => (
                          <li key={item}>
                            <span className="text-[13px] leading-snug text-slate-600 transition-colors hover:text-slate-900">
                              {item}
                            </span>
                          </li>
                        ))}
                      </ul>
                      <p className="mt-4 text-[12px] leading-relaxed text-slate-500">{col.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.button
              type="button"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[110] bg-slate-950/40 backdrop-blur-sm lg:hidden"
              aria-label="Fermer"
              onClick={() => setMobileOpen(false)}
            />
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "tween", duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
              className="fixed inset-y-0 right-0 z-[120] flex w-[min(100%,380px)] flex-col bg-white shadow-[-12px_0_48px_rgba(15,23,42,0.12)] lg:hidden"
            >
              <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
                <span className="text-[16px] font-semibold text-slate-900">Menu</span>
                <button
                  type="button"
                  className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-600 hover:bg-slate-100"
                  onClick={() => setMobileOpen(false)}
                  aria-label="Fermer"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <nav className="flex flex-1 flex-col gap-1 overflow-y-auto px-4 py-6" aria-label="Navigation mobile">
                <Link
                  href="/approche"
                  className="rounded-xl px-4 py-3.5 text-[15px] font-medium text-slate-800 hover:bg-slate-50"
                  onClick={() => setMobileOpen(false)}
                >
                  Approche
                </Link>
                <div>
                  <Link
                    href="/solution"
                    className="block rounded-xl px-4 py-3 text-[13px] font-medium text-violet-700 hover:bg-violet-50"
                    onClick={() => setMobileOpen(false)}
                  >
                    Page Solution — vue d&apos;ensemble
                  </Link>
                  <button
                    type="button"
                    className="flex w-full items-center justify-between rounded-xl px-4 py-3.5 text-left text-[15px] font-medium text-slate-800 hover:bg-slate-50"
                    onClick={() => setMobileSolutionOpen((v) => !v)}
                  >
                    Parcourir l&apos;offre
                    <ChevronDown className={cn("h-4 w-4 transition-transform", mobileSolutionOpen && "rotate-180")} />
                  </button>
                  <AnimatePresence initial={false}>
                    {mobileSolutionOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25 }}
                        className="overflow-hidden"
                      >
                        <div className="space-y-4 border-l-2 border-violet-100 py-3 pl-4">
                          {MEGA_COLUMNS.map((col) => (
                            <div key={col.title}>
                              <p className="text-[12px] font-semibold text-slate-900">{col.title}</p>
                              <ul className="mt-2 space-y-1.5">
                                {col.items.map((item) => (
                                  <li key={item} className="text-[13px] text-slate-600">
                                    {item}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
                <Link
                  href="/plateforme"
                  className="rounded-xl px-4 py-3.5 text-[15px] font-medium text-slate-800 hover:bg-slate-50"
                  onClick={() => setMobileOpen(false)}
                >
                  Plateforme
                </Link>
                <Link
                  href="/beyond-center/ressources"
                  className="rounded-xl px-4 py-3.5 text-[15px] font-medium text-slate-800 hover:bg-slate-50"
                  onClick={() => setMobileOpen(false)}
                >
                  Ressources
                </Link>
                <Link
                  href="/login"
                  className="rounded-xl px-4 py-3.5 text-[15px] font-medium text-slate-500 hover:bg-slate-50"
                  onClick={() => setMobileOpen(false)}
                >
                  Connexion
                </Link>
              </nav>
              <div className="border-t border-slate-100 p-5">
                <Link
                  href="/pilote"
                  className="flex w-full items-center justify-center rounded-full bg-slate-900 py-3.5 text-[15px] font-semibold text-white"
                  onClick={() => setMobileOpen(false)}
                >
                  Lancer un pilote
                </Link>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
