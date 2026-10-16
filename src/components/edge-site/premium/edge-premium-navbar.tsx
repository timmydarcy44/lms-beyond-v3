"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { useEdgePremiumConfig } from "@/components/edge-site/premium/edge-premium-config-context";
import { EdgePremiumButton } from "@/components/edge-site/premium/edge-premium-button";
import { EdgePremiumLogo } from "@/components/edge-site/premium/edge-premium-logo";
import {
  EdgePremiumMegaColumnsPanel,
  EdgePremiumMegaTrigger,
} from "@/components/edge-site/premium/edge-premium-mega-menu";
import { MegaMenu } from "@/components/edge-site/premium/mega-menu";
import { EdgePremiumMobileMenu } from "@/components/edge-site/premium/edge-premium-mobile-menu";
import { getNeoMegaMenus } from "@/lib/edge-site/neo-mega-menus";

type DropdownKey = "plateforme";
type MegaKey = "alternants" | "entreprises" | "particuliers";

function NavDropdown({
  label,
  items,
  open,
  onToggle,
  onClose,
  scrolled,
  light,
}: {
  label: string;
  items: readonly { label: string; href: string }[];
  open: boolean;
  onToggle: () => void;
  onClose: () => void;
  scrolled: boolean;
  light: boolean;
}) {
  return (
    <div className="relative">
      <button
        type="button"
        className={cn(
          "flex items-center gap-1 px-2.5 py-2 text-sm font-medium transition-colors xl:px-3",
          light
            ? open
              ? "text-neutral-950"
              : "text-neutral-700 hover:text-neutral-950"
            : open
              ? "text-white"
              : "text-white/60 hover:text-white",
        )}
        aria-expanded={open}
        onClick={onToggle}
      >
        {label}
        <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", open && "rotate-180")} />
      </button>
      {open ? (
        <div
          className={cn(
            "absolute left-0 top-full z-50 mt-2 min-w-[220px] rounded-2xl p-2 shadow-2xl backdrop-blur-xl",
            light
              ? "border border-black/[0.08] bg-white/95"
              : cn(
                  "border border-white/10",
                  scrolled ? "bg-[#070b1f]/95" : "bg-[#070b1f]/90",
                ),
          )}
        >
          {items.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className={cn(
                "block rounded-xl px-4 py-2.5 text-sm transition-colors",
                light
                  ? "text-neutral-700 hover:bg-black/[0.04] hover:text-neutral-950"
                  : "text-white/70 hover:bg-white/[0.06] hover:text-white",
              )}
              onClick={onClose}
            >
              {item.label}
            </Link>
          ))}
        </div>
      ) : null}
    </div>
  );
}

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
  const { links, nav, megaParticulier, routes } = config;
  const neoMenus = getNeoMegaMenus(routes);
  const schoolMenu = neoMenus[0];
  const businessMenu = neoMenus[1];
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<DropdownKey | null>(null);
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
      setOpenDropdown(null);
    }, 120);
  };

  const toggleMega = (key: MegaKey) => {
    clearMegaTimers();
    setOpenDropdown(null);
    setOpenMega((current) => (current === key ? null : key));
  };

  useEffect(() => {
    return () => clearMegaTimers();
  }, []);

  useEffect(() => {
    setOpenMega(null);
    setOpenDropdown(null);
    setMobileOpen(false);
  }, [pathname]);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (!headerRef.current?.contains(e.target as Node)) {
        setOpenDropdown(null);
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
        setOpenDropdown(null);
        setOpenMega(null);
        setMobileOpen(false);
        if (current) triggerRefs.current[current]?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const closeAll = () => {
    setOpenDropdown(null);
    setOpenMega(null);
    setMobileOpen(false);
  };

  const openMegaMenu = (key: MegaKey) => {
    clearMegaTimers();
    setOpenMega(key);
    setOpenDropdown(null);
  };

  const isSolid = pageScrolled || openDropdown !== null || openMega !== null || mobileOpen;

  const megaData = openMega === "particuliers" ? megaParticulier : null;
  const neoMenu = openMega === "alternants" ? schoolMenu : openMega === "entreprises" ? businessMenu : null;

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
          {([
            ["alternants", "École"],
            ["entreprises", "Entreprises"],
          ] as const).map(([key, label]) => {
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
                {label}
                <ChevronDown
                  className={cn("transition-transform duration-200", open && "rotate-180")}
                  size={14}
                  strokeWidth={2}
                  aria-hidden
                />
              </button>
            );
          })}
          <EdgePremiumMegaTrigger
            label="Particuliers"
            open={openMega === "particuliers"}
            onOpen={() => openMegaMenu("particuliers")}
            light={light}
          />
          <NavDropdown
            label="La plateforme"
            items={nav.plateforme}
            open={openDropdown === "plateforme"}
            scrolled={isSolid}
            light={light}
            onToggle={() => {
              setOpenMega(null);
              setOpenDropdown((d) => (d === "plateforme" ? null : "plateforme"));
            }}
            onClose={() => setOpenDropdown(null)}
          />
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
            href={routes.alternance}
            variant={light ? "primary" : "white"}
            shape="revolut"
            className="!px-5 !py-2.5 !text-sm"
          >
            Découvrir l&apos;alternance
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

      {megaData ? (
        <div
          className="absolute left-0 right-0 top-full z-50 hidden px-4 pt-3 pb-5 sm:px-6 lg:block lg:px-8"
          onMouseEnter={cancelMegaClose}
        >
          <EdgePremiumMegaColumnsPanel
            data={megaData}
            onClose={() => setOpenMega(null)}
            light={light}
          />
        </div>
      ) : null}

      <EdgePremiumMobileMenu
        open={mobileOpen}
        onClose={closeAll}
        config={config}
        loginHref={links.login}
        discoverHref={routes.alternance}
        light={light}
      />
    </header>
  );
}
