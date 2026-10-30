"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { useEdgePremiumConfig } from "@/components/edge-site/premium/edge-premium-config-context";
import { EdgePremiumButton } from "@/components/edge-site/premium/edge-premium-button";
import { EdgePremiumLogo } from "@/components/edge-site/premium/edge-premium-logo";
import { MegaMenu } from "@/components/edge-site/premium/mega-menu";
import { EdgePremiumMobileMenu } from "@/components/edge-site/premium/edge-premium-mobile-menu";
import { getNeoMegaMenus, type NeoMegaMenuConfig } from "@/lib/edge-site/neo-mega-menus";

type MegaKey = NeoMegaMenuConfig["id"];

type NavbarProps = {
  overlay?: boolean;
  pageScrolled?: boolean;
  light?: boolean;
};

export function EdgePremiumNavbar({
  overlay = false,
  pageScrolled = false,
  light = false,
}: NavbarProps) {
  const config = useEdgePremiumConfig();
  const { links, routes } = config;
  const neoMenus = getNeoMegaMenus(routes);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openMega, setOpenMega] = useState<MegaKey | null>(null);
  const headerRef = useRef<HTMLElement>(null);
  const openMegaRef = useRef<MegaKey | null>(null);
  const triggerRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const megaTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const openTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pathname = usePathname();
  openMegaRef.current = openMega;

  const clearMegaTimers = () => {
    if (megaTimer.current) clearTimeout(megaTimer.current);
    if (openTimer.current) clearTimeout(openTimer.current);
  };

  const scheduleMegaClose = () => {
    if (openTimer.current) clearTimeout(openTimer.current);
    if (megaTimer.current) clearTimeout(megaTimer.current);
    megaTimer.current = setTimeout(() => setOpenMega(null), 200);
  };

  const cancelMegaClose = () => {
    if (megaTimer.current) clearTimeout(megaTimer.current);
  };

  const intentOpen = (key: MegaKey) => {
    cancelMegaClose();
    if (openTimer.current) clearTimeout(openTimer.current);
    openTimer.current = setTimeout(() => {
      setOpenMega(key);
    }, 120);
  };

  const toggleMega = (key: MegaKey) => {
    clearMegaTimers();
    setOpenMega((current) => (current === key ? null : key));
  };

  useEffect(() => {
    return () => clearMegaTimers();
  }, []);

  useEffect(() => {
    setOpenMega(null);
    setMobileOpen(false);
  }, [pathname]);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (!headerRef.current?.contains(e.target as Node)) {
        setOpenMega(null);
      }
    };
    document.addEventListener("pointerdown", onClick);
    return () => document.removeEventListener("pointerdown", onClick);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        const current = openMegaRef.current;
        setOpenMega(null);
        setMobileOpen(false);
        if (current) triggerRefs.current[current]?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const closeAll = () => {
    setOpenMega(null);
    setMobileOpen(false);
  };

  const isSolid = pageScrolled || openMega !== null || mobileOpen;
  const neoMenu = neoMenus.find((menu) => menu.id === openMega) ?? null;

  return (
    <header
      ref={headerRef}
      className={cn(
        "relative z-50 isolate overflow-visible transition-all duration-300",
        light
          ? cn(
              overlay && !isSolid
                ? "border-b border-transparent bg-transparent"
                : "border-b border-black/[0.06] bg-white",
              !overlay && "border-b border-black/[0.06] bg-white",
            )
          : cn(
              overlay && !isSolid
                ? "border-b border-transparent bg-transparent"
                : "border-b border-white/[0.06] bg-[#070b1f]",
              !overlay && "border-b border-white/[0.06] bg-[#070b1f]",
            ),
      )}
      onMouseLeave={scheduleMegaClose}
    >
      <div className="relative z-50 mx-auto flex h-16 max-w-7xl items-center justify-between gap-3 px-5 sm:px-8 lg:gap-4 lg:px-10">
        <EdgePremiumLogo light={light} />

        <nav className="hidden items-center lg:flex" aria-label="Navigation principale">
          {neoMenus.map((menu) => {
            const key = menu.id;
            const open = openMega === key;
            return (
              <button
                key={key}
                ref={(node) => {
                  triggerRefs.current[key] = node;
                }}
                type="button"
                className={cn(
                  "inline-flex items-center gap-1 rounded-full text-sm transition-colors",
                  open
                    ? light
                      ? "bg-black/5 px-3 py-2 font-bold text-neutral-950"
                      : "bg-white/10 px-3 py-2 font-bold text-white"
                    : light
                      ? "px-2.5 py-2 font-medium text-neutral-700 hover:text-neutral-950 xl:px-3"
                      : "px-2.5 py-2 font-medium text-white/60 hover:text-white xl:px-3",
                )}
                aria-expanded={open}
                aria-controls={`mega-${key}`}
                onMouseEnter={() => intentOpen(key)}
                onMouseLeave={scheduleMegaClose}
                onClick={() => toggleMega(key)}
              >
                {menu.label}
                <ChevronDown
                  className={cn("transition-transform duration-200", open && "rotate-180")}
                  size={14}
                  strokeWidth={2}
                  aria-hidden
                />
              </button>
            );
          })}
          <Link
            href="/offres"
            className={cn(
              "rounded-full px-3 py-2 text-sm transition-colors",
              pathname.startsWith("/offres")
                ? light
                  ? "bg-black/5 font-bold text-neutral-950"
                  : "bg-white/10 font-bold text-white"
                : light
                  ? "font-medium text-neutral-700 hover:text-neutral-950"
                  : "font-medium text-white/60 hover:text-white",
            )}
          >
            Offres d&apos;emploi
          </Link>
          <Link
            href={routes.tarifs}
            className={cn(
              "px-2.5 py-2 text-sm font-medium transition-colors xl:px-3",
              light
                ? "text-neutral-700 hover:text-neutral-950"
                : "text-white/60 hover:text-white",
            )}
          >
            Tarifs
          </Link>
          <Link
            href={routes.aPropos}
            className={cn(
              "px-2.5 py-2 text-sm font-medium transition-colors xl:px-3",
              light
                ? "text-neutral-700 hover:text-neutral-950"
                : "text-white/60 hover:text-white",
            )}
          >
            À propos
          </Link>
        </nav>

        <div className="hidden items-center gap-4 lg:flex xl:gap-5">
          <Link
            href={links.login}
            className={cn(
              "text-sm font-medium transition-colors",
              light
                ? "text-neutral-700 hover:text-neutral-950"
                : "text-white/60 hover:text-white",
            )}
          >
            Connexion
          </Link>
          <EdgePremiumButton
            href={routes.entrepriseSignup}
            variant={light ? "primary" : "white"}
            shape="revolut"
            className="!px-5 !py-2.5 !text-sm"
          >
            Créer un compte
          </EdgePremiumButton>
        </div>

        <button
          type="button"
          className={cn(
            "flex h-10 w-10 items-center justify-center rounded-full lg:hidden",
            light ? "text-neutral-950" : "text-white",
          )}
          aria-expanded={mobileOpen}
          aria-label={mobileOpen ? "Fermer le menu" : "Ouvrir le menu"}
          onClick={() => setMobileOpen((o) => !o)}
        >
          {mobileOpen ? (
            <span className="text-2xl leading-none">×</span>
          ) : (
            <span className="text-xl leading-none">≡</span>
          )}
        </button>
      </div>

      {neoMenu ? (
        <button
          type="button"
          className="fixed inset-0 z-40 hidden bg-[rgba(7,12,28,0.45)] lg:block"
          aria-label="Fermer le menu"
          onClick={() => setOpenMega(null)}
        />
      ) : null}

      {neoMenu ? (
        <div
          className="absolute left-0 right-0 top-full z-50 hidden pt-3 lg:block"
          onMouseEnter={cancelMegaClose}
        >
          <div className="neo-mega-panel mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
            <MegaMenu
              menu={neoMenu}
              id={`mega-${openMega}`}
              onNavigate={() => setOpenMega(null)}
            />
          </div>
        </div>
      ) : null}

      <EdgePremiumMobileMenu
        open={mobileOpen}
        onClose={closeAll}
        config={config}
        loginHref={links.login}
        discoverHref={routes.entrepriseSignup}
        light={light}
      />
    </header>
  );
}
