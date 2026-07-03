"use client";

import Link from "next/link";
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
import { EdgePremiumMobileMenu } from "@/components/edge-site/premium/edge-premium-mobile-menu";

type DropdownKey = "fonctionnalites" | "ressources";
type MegaKey = "apprenants" | "business" | "particulier";

function NavDropdown({
  label,
  items,
  open,
  onToggle,
  onClose,
  scrolled,
}: {
  label: string;
  items: readonly { label: string; href: string }[];
  open: boolean;
  onToggle: () => void;
  onClose: () => void;
  scrolled: boolean;
}) {
  return (
    <div className="relative">
      <button
        type="button"
        className={cn(
          "flex items-center gap-1 px-2.5 py-2 text-sm font-medium transition-colors xl:px-3",
          open ? "text-white" : "text-white/60 hover:text-white",
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
            "absolute left-0 top-full z-50 mt-2 min-w-[220px] rounded-2xl border border-white/10 p-2 shadow-2xl backdrop-blur-xl",
            scrolled ? "bg-edge-black-deep/95" : "bg-[#0a0c14]/90",
          )}
        >
          {items.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className="block rounded-xl px-4 py-2.5 text-sm text-white/70 transition-colors hover:bg-white/[0.06] hover:text-white"
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
};

export function EdgePremiumNavbar({ overlay = false, pageScrolled = false }: NavbarProps) {
  const config = useEdgePremiumConfig();
  const { links, nav, megaApprenants, megaBusiness, megaParticulier } = config;
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<DropdownKey | null>(null);
  const [openMega, setOpenMega] = useState<MegaKey | null>(null);
  const headerRef = useRef<HTMLElement>(null);
  const megaTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const scheduleMegaClose = () => {
    if (megaTimer.current) clearTimeout(megaTimer.current);
    megaTimer.current = setTimeout(() => setOpenMega(null), 180);
  };

  const cancelMegaClose = () => {
    if (megaTimer.current) clearTimeout(megaTimer.current);
  };

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
        setOpenDropdown(null);
        setOpenMega(null);
        setMobileOpen(false);
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
    cancelMegaClose();
    setOpenMega(key);
    setOpenDropdown(null);
  };

  const isSolid = pageScrolled || openDropdown !== null || mobileOpen;

  return (
    <header
      ref={headerRef}
      className={cn(
        "relative overflow-visible transition-all duration-300",
        overlay && !isSolid
          ? "border-b border-transparent bg-transparent"
          : "border-b border-white/[0.06] bg-edge-black-deep",
        !overlay && "border-b border-white/[0.06] bg-edge-black-deep",
      )}
      onMouseLeave={scheduleMegaClose}
    >
      <div className="relative mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-5 sm:px-8 lg:px-10">
        <EdgePremiumLogo />

        <nav className="hidden items-center lg:flex" aria-label="Navigation principale">
          <EdgePremiumMegaTrigger
            label="Apprenants"
            open={openMega === "apprenants"}
            onOpen={() => openMegaMenu("apprenants")}
          />
          <EdgePremiumMegaTrigger
            label="Business"
            open={openMega === "business"}
            onOpen={() => openMegaMenu("business")}
          />
          <EdgePremiumMegaTrigger
            label="Particulier"
            open={openMega === "particulier"}
            onOpen={() => openMegaMenu("particulier")}
          />
          <NavDropdown
            label="Fonctionnalités"
            items={nav.fonctionnalites}
            open={openDropdown === "fonctionnalites"}
            scrolled={isSolid}
            onToggle={() => {
              setOpenMega(null);
              setOpenDropdown((d) => (d === "fonctionnalites" ? null : "fonctionnalites"));
            }}
            onClose={() => setOpenDropdown(null)}
          />
          <NavDropdown
            label="Ressources"
            items={nav.ressources}
            open={openDropdown === "ressources"}
            scrolled={isSolid}
            onToggle={() => {
              setOpenMega(null);
              setOpenDropdown((d) => (d === "ressources" ? null : "ressources"));
            }}
            onClose={() => setOpenDropdown(null)}
          />
          <Link
            href={links.tarifs}
            className="px-2.5 py-2 text-sm font-medium text-white/60 transition-colors hover:text-white xl:px-3"
          >
            Tarifs
          </Link>
        </nav>

        <div className="hidden items-center gap-4 lg:flex xl:gap-5">
          <Link
            href={links.login}
            className="text-sm font-medium text-white/60 transition-colors hover:text-white"
          >
            Connexion
          </Link>
          <EdgePremiumButton
            href={links.decouvrirEdge}
            variant="white"
            shape="revolut"
            className="!px-5 !py-2.5 !text-sm"
          >
            Découvrir EDGE
          </EdgePremiumButton>
        </div>

        <button
          type="button"
          className="flex h-10 w-10 items-center justify-center rounded-full text-white lg:hidden"
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

      {openMega ? (
        <div
          className="absolute left-0 right-0 top-full z-50 hidden px-4 pt-3 pb-5 sm:px-6 lg:block lg:px-8"
          onMouseEnter={cancelMegaClose}
        >
          <EdgePremiumMegaColumnsPanel
            data={
              openMega === "apprenants"
                ? megaApprenants
                : openMega === "business"
                  ? megaBusiness
                  : megaParticulier
            }
            onClose={() => setOpenMega(null)}
          />
        </div>
      ) : null}

      <EdgePremiumMobileMenu
        open={mobileOpen}
        onClose={closeAll}
        config={config}
        loginHref={links.login}
        discoverHref={links.decouvrirEdge}
      />
    </header>
  );
}
