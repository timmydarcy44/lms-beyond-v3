"use client";

import Link from "next/link";
import {
  BarChart3,
  Brain,
  ChevronDown,
  GraduationCap,
  Layers,
  Menu,
  Search,
  Sparkles,
  Target,
  Trophy,
  Wallet,
  X,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { cn } from "@/lib/utils";

const demoMail = "mailto:contact@beyondcenter.fr?subject=D%C3%A9mo%20Beyond";

type SolutionPillar = {
  title: string;
  description: string;
  icon: React.ReactNode;
  links: { label: string; href: string }[];
};

const solutionPillars: SolutionPillar[] = [
  {
    title: "Recruter",
    description: "Identifier les compétences avant l'embauche et réduire les erreurs de recrutement.",
    icon: <Search className="h-4 w-4" />,
    links: [
      { label: "Recrutement par compétences", href: "/#solutions" },
      { label: "Soft skills", href: "/#solutions" },
      { label: "Potentiel & profils", href: "/#solutions" },
    ],
  },
  {
    title: "Développer",
    description: "Construire les bons parcours de progression pour chaque profil.",
    icon: <GraduationCap className="h-4 w-4" />,
    links: [
      { label: "Parcours personnalisés", href: "/#solutions" },
      { label: "Recommandations IA", href: "/#beyond-ai" },
      { label: "Développement des compétences", href: "/#solutions" },
    ],
  },
  {
    title: "Reconnaître",
    description: "Valoriser les acquis avec des cartes de compétences vérifiables.",
    icon: <Trophy className="h-4 w-4" />,
    links: [
      { label: "Open Badges", href: "/#open-badges" },
      { label: "Wallet compétences", href: "/#wallet" },
      { label: "Portfolios", href: "/#wallet" },
    ],
  },
  {
    title: "Décider",
    description: "Piloter les compétences avec des données claires.",
    icon: <Target className="h-4 w-4" />,
    links: [
      { label: "Beyond Index", href: "/beyond-index" },
      { label: "Analytics", href: "/#beyond-index" },
      { label: "Beyond AI", href: "/#beyond-ai" },
    ],
  },
];

type NavItem = { label: string; href: string; desc?: string; icon?: React.ReactNode };

const platformItems: NavItem[] = [
  { label: "Beyond Index", href: "/beyond-index", desc: "Maturité compétences", icon: <BarChart3 className="h-4 w-4" /> },
  { label: "Beyond AI", href: "/#beyond-ai", desc: "Copilote décisionnel", icon: <Sparkles className="h-4 w-4" /> },
  { label: "Cartes de compétences", href: "/#open-badges", desc: "Reconnaissance vérifiable", icon: <Layers className="h-4 w-4" /> },
  { label: "Wallet compétences", href: "/#wallet", desc: "Portefeuille personnel", icon: <Wallet className="h-4 w-4" /> },
  { label: "Analytics", href: "/#beyond-index", desc: "Pilotage et tableaux de bord", icon: <Brain className="h-4 w-4" /> },
];

const resourceItems: NavItem[] = [
  { label: "Documentation", href: "/login", desc: "Guides et ressources" },
  { label: "Blog", href: "https://beyondcenter.fr", desc: "Actualités Beyond" },
  { label: "Contact", href: "mailto:contact@beyondcenter.fr", desc: "Parler à l'équipe" },
];

type MenuKey = "Solutions" | "Plateforme" | "Ressources";

export function BeyondMegaNav({ variant = "transparent" }: { variant?: "transparent" | "solid" }) {
  const [openMenu, setOpenMenu] = useState<MenuKey | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const isTransparent = variant === "transparent" && !scrolled;

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const closeAll = useCallback(() => {
    setOpenMenu(null);
    setMobileOpen(false);
  }, []);

  const textMuted = isTransparent ? "text-slate-300" : "text-[#64748B]";
  const textMain = isTransparent ? "text-white" : "text-[#0F172A]";
  const hover = isTransparent ? "hover:text-white" : "hover:text-[#0F172A]";

  const menuLabels: MenuKey[] = ["Solutions", "Plateforme", "Ressources"];

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 transition-all duration-300",
        isTransparent
          ? "border-b border-white/[0.06] bg-[#071A2F]/15 backdrop-blur-xl"
          : "border-b border-[#E2E8F0]/80 bg-white/85 backdrop-blur-xl shadow-sm"
      )}
      onMouseLeave={() => setOpenMenu(null)}
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-3.5 md:px-8">
        <Link href="/" className={cn("text-[15px] font-semibold tracking-tight", textMain)} onClick={closeAll}>
          Beyond
        </Link>

        <nav className="hidden items-center gap-1 lg:flex">
          {menuLabels.map((name) => (
            <div key={name} className="relative">
              <button
                type="button"
                className={cn(
                  "flex items-center gap-1 rounded-lg px-3 py-2 text-[13px] font-medium transition",
                  textMuted,
                  hover,
                  openMenu === name && (isTransparent ? "text-white" : "text-[#0F172A]")
                )}
                onMouseEnter={() => setOpenMenu(name)}
                onClick={() => setOpenMenu(openMenu === name ? null : name)}
              >
                {name}
                <ChevronDown className={cn("h-3.5 w-3.5 transition", openMenu === name && "rotate-180")} />
              </button>
            </div>
          ))}
          <Link
            href="/prix"
            className={cn("rounded-lg px-3 py-2 text-[13px] font-medium transition", textMuted, hover)}
          >
            Tarifs
          </Link>
        </nav>

        <div className="hidden items-center gap-3 lg:flex">
          <Link href="/login" className={cn("text-[13px] font-medium transition", textMuted, hover)}>
            Connexion
          </Link>
          <a
            href={demoMail}
            className={cn(
              "rounded-full px-4 py-2 text-[13px] font-semibold transition",
              isTransparent
                ? "bg-white text-[#0F172A] hover:bg-[#F8FAFC]"
                : "bg-[#071A2F] text-white hover:bg-[#0B2442]"
            )}
          >
            Demander une démo
          </a>
        </div>

        <button
          type="button"
          className={cn("rounded-lg p-2 lg:hidden", textMain)}
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Menu"
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Solutions mega panel */}
      {openMenu === "Solutions" && (
        <div
          className={cn(
            "hidden border-t lg:block",
            isTransparent
              ? "border-white/[0.06] bg-[#071A2F]/95 backdrop-blur-2xl shadow-2xl shadow-black/20"
              : "border-[#E2E8F0] bg-white/95 backdrop-blur-2xl shadow-xl shadow-slate-200/50"
          )}
          onMouseEnter={() => setOpenMenu("Solutions")}
        >
          <div className="mx-auto max-w-6xl px-5 py-8 md:px-8">
            <p className={cn("text-xs font-semibold uppercase tracking-[0.2em]", textMuted)}>
              Solutions
            </p>
            <div className="mt-6 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              {solutionPillars.map((pillar) => (
                <div key={pillar.title} className="group">
                  <div className="flex items-center gap-2.5">
                    <span
                      className={cn(
                        "flex h-8 w-8 items-center justify-center rounded-lg transition",
                        isTransparent
                          ? "bg-white/[0.08] text-cyan-300 group-hover:bg-white/[0.12]"
                          : "bg-[#F1F5F9] text-[#0F172A] group-hover:bg-[#E2E8F0]"
                      )}
                    >
                      {pillar.icon}
                    </span>
                    <p className={cn("text-sm font-semibold", textMain)}>{pillar.title}</p>
                  </div>
                  <p className={cn("mt-2 text-xs leading-relaxed", textMuted)}>{pillar.description}</p>
                  <ul className="mt-4 space-y-2">
                    {pillar.links.map((link) => (
                      <li key={link.label}>
                        <Link
                          href={link.href}
                          className={cn(
                            "text-[13px] font-medium transition",
                            isTransparent ? "text-slate-300 hover:text-white" : "text-[#475569] hover:text-[#0F172A]"
                          )}
                          onClick={closeAll}
                        >
                          {link.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Plateforme / Ressources panel */}
      {openMenu && openMenu !== "Solutions" && (
        <div
          className={cn(
            "hidden border-t lg:block",
            isTransparent
              ? "border-white/[0.06] bg-[#071A2F]/95 backdrop-blur-2xl shadow-2xl shadow-black/20"
              : "border-[#E2E8F0] bg-white/95 backdrop-blur-2xl shadow-xl shadow-slate-200/50"
          )}
          onMouseEnter={() => setOpenMenu(openMenu)}
        >
          <div className="mx-auto grid max-w-6xl gap-1 px-5 py-4 md:grid-cols-2 md:px-8 lg:grid-cols-3">
            {(openMenu === "Plateforme" ? platformItems : resourceItems).map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className={cn(
                  "group flex items-start gap-3 rounded-xl px-4 py-3 transition",
                  isTransparent ? "hover:bg-white/[0.06]" : "hover:bg-[#F8FAFC]"
                )}
                onClick={closeAll}
              >
                {item.icon && (
                  <span
                    className={cn(
                      "mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
                      isTransparent ? "bg-white/[0.08] text-cyan-300" : "bg-[#F1F5F9] text-[#0F172A]"
                    )}
                  >
                    {item.icon}
                  </span>
                )}
                <div>
                  <p className={cn("text-sm font-medium", textMain)}>{item.label}</p>
                  {item.desc && (
                    <p className={cn("mt-0.5 text-xs", textMuted)}>{item.desc}</p>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Mobile menu */}
      {mobileOpen && (
        <div
          className={cn(
            "border-t lg:hidden",
            isTransparent ? "border-white/10 bg-[#071A2F]" : "border-[#E2E8F0] bg-white"
          )}
        >
          <div className="mx-auto max-w-6xl space-y-6 px-5 py-6">
            <div>
              <p className={cn("text-xs font-semibold uppercase tracking-wider", textMuted)}>Solutions</p>
              <div className="mt-3 space-y-4">
                {solutionPillars.map((pillar) => (
                  <div key={pillar.title}>
                    <p className={cn("text-sm font-semibold", textMain)}>{pillar.title}</p>
                    <ul className="mt-1 space-y-1 pl-2">
                      {pillar.links.map((link) => (
                        <li key={link.label}>
                          <Link href={link.href} className={cn("block py-1 text-sm", textMuted)} onClick={closeAll}>
                            {link.label}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <p className={cn("text-xs font-semibold uppercase tracking-wider", textMuted)}>Plateforme</p>
              <ul className="mt-2 space-y-1">
                {platformItems.map((item) => (
                  <li key={item.label}>
                    <Link href={item.href} className={cn("block py-2 text-sm font-medium", textMain)} onClick={closeAll}>
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className={cn("text-xs font-semibold uppercase tracking-wider", textMuted)}>Ressources</p>
              <ul className="mt-2 space-y-1">
                {resourceItems.map((item) => (
                  <li key={item.label}>
                    <Link href={item.href} className={cn("block py-2 text-sm font-medium", textMain)} onClick={closeAll}>
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <Link href="/prix" className={cn("block text-sm font-medium", textMain)} onClick={closeAll}>
              Tarifs
            </Link>
            <div className="flex flex-col gap-3 pt-2">
              <Link href="/login" className={cn("text-sm font-medium", textMuted)} onClick={closeAll}>
                Connexion
              </Link>
              <a href={demoMail} className="rounded-full bg-[#071A2F] px-4 py-3 text-center text-sm font-semibold text-white">
                Demander une démo
              </a>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
