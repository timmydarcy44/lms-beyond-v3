"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { useEdgePremiumConfig } from "@/components/edge-site/premium/edge-premium-config-context";
import { EdgePremiumButton } from "@/components/edge-site/premium/edge-premium-button";
import { EdgePremiumLogo } from "@/components/edge-site/premium/edge-premium-logo";
import { EdgePremiumMobileMenu } from "@/components/edge-site/premium/edge-premium-mobile-menu";
import {
  EdgePremiumPillarMegaPanel,
  EdgePremiumPillarMegaTrigger,
} from "@/components/edge-site/premium/edge-premium-pillar-mega-menu";
import type { PillarMegaMenuId } from "@/lib/edge-site/pillar-mega-menu-data";

const HOVER_OPEN_MS = 120;
const HOVER_CLOSE_MS = 180;

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
  const { links, nav } = config;
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openPillar, setOpenPillar] = useState<PillarMegaMenuId | null>(null);
  const headerRef = useRef<HTMLElement>(null);
  const hoverTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearHoverTimer = () => {
    if (hoverTimerRef.current) {
      clearTimeout(hoverTimerRef.current);
      hoverTimerRef.current = null;
    }
  };

  const scheduleOpen = (id: PillarMegaMenuId) => {
    clearHoverTimer();
    hoverTimerRef.current = setTimeout(() => setOpenPillar(id), HOVER_OPEN_MS);
  };

  const scheduleClose = () => {
    clearHoverTimer();
    hoverTimerRef.current = setTimeout(() => setOpenPillar(null), HOVER_CLOSE_MS);
  };

  useEffect(() => {
    return () => clearHoverTimer();
  }, []);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (!headerRef.current?.contains(e.target as Node)) {
        setOpenPillar(null);
      }
    };
    document.addEventListener("pointerdown", onClick);
    return () => document.removeEventListener("pointerdown", onClick);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpenPillar(null);
        setMobileOpen(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const closeAll = () => {
    setOpenPillar(null);
    setMobileOpen(false);
  };

  const isSolid = pageScrolled || openPillar !== null || mobileOpen;

  return (
    <header
      ref={headerRef}
      className={cn(
        "relative overflow-visible transition-all duration-300",
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
                : "border-b border-white/[0.06] bg-edge-black-deep",
              !overlay && "border-b border-white/[0.06] bg-edge-black-deep",
            ),
      )}
    >
      <div className="relative mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-5 sm:px-8 lg:px-10">
        <EdgePremiumLogo light={light} />

        <nav className="hidden items-center lg:flex" aria-label="Navigation principale">
          {nav.pillarMegaMenus.map((pillar) => {
            const panelId = `edge-pillar-mega-${pillar.id}`;
            const open = openPillar === pillar.id;

            return (
              <div
                key={pillar.id}
                className="relative"
                onMouseEnter={() => scheduleOpen(pillar.id)}
                onMouseLeave={scheduleClose}
              >
                <EdgePremiumPillarMegaTrigger
                  label={pillar.label}
                  open={open}
                  controlsId={panelId}
                  light={light}
                  onOpen={() => scheduleOpen(pillar.id)}
                  onToggle={() =>
                    setOpenPillar((current) => (current === pillar.id ? null : pillar.id))
                  }
                />
                {open ? (
                  <div className="absolute left-0 top-full z-50 mt-2 origin-top animate-in fade-in slide-in-from-top-1 duration-200">
                    <EdgePremiumPillarMegaPanel
                      data={pillar}
                      panelId={panelId}
                      light={light}
                      onClose={() => setOpenPillar(null)}
                    />
                  </div>
                ) : null}
              </div>
            );
          })}
          <Link
            href={links.tarifs}
            className={cn(
              "px-2.5 py-2 text-sm font-medium transition-colors xl:px-3",
              light
                ? "text-neutral-700 hover:text-neutral-950"
                : "text-white/60 hover:text-white",
            )}
          >
            Tarifs
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
            href={links.decouvrirEdge}
            variant={light ? "primary" : "white"}
            shape="revolut"
            className="!px-5 !py-2.5 !text-sm"
          >
            Découvrir EDGE
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

      <EdgePremiumMobileMenu
        open={mobileOpen}
        onClose={closeAll}
        config={config}
        loginHref={links.login}
        discoverHref={links.decouvrirEdge}
        light={light}
      />
    </header>
  );
}
