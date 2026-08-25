"use client";

import Link from "next/link";
import { ChevronDown } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { useEdgePremiumConfig } from "@/components/edge-site/premium/edge-premium-config-context";
import { EdgePremiumButton } from "@/components/edge-site/premium/edge-premium-button";
import { EdgePremiumLogo } from "@/components/edge-site/premium/edge-premium-logo";
import { EdgePremiumMobileMenu } from "@/components/edge-site/premium/edge-premium-mobile-menu";

type PillarId = "former" | "developper" | "recruter" | "piloter";

function NavDropdown({
  label,
  items,
  open,
  onToggle,
  onClose,
  light,
}: {
  label: string;
  items: readonly { label: string; href: string }[];
  open: boolean;
  onToggle: () => void;
  onClose: () => void;
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
            "absolute left-0 top-full z-50 mt-2 min-w-[240px] rounded-2xl p-2 shadow-2xl backdrop-blur-xl",
            light
              ? "border border-black/[0.08] bg-white/95"
              : "border border-white/10 bg-edge-black-deep/95",
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
  const { links, nav } = config;
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openPillar, setOpenPillar] = useState<PillarId | null>(null);
  const headerRef = useRef<HTMLElement>(null);

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
          {nav.pillars.map((pillar) => (
            <NavDropdown
              key={pillar.id}
              label={pillar.label}
              items={pillar.items}
              open={openPillar === pillar.id}
              light={light}
              onToggle={() =>
                setOpenPillar((current) => (current === pillar.id ? null : pillar.id))
              }
              onClose={() => setOpenPillar(null)}
            />
          ))}
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
