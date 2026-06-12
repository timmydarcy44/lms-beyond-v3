"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { EdgeButton } from "@/components/edge-site/edge-button";
import { EDGE_CTA_LABELS, EDGE_HREFS } from "@/lib/edge-site/constants";
import { PARCOURS_BY_FAMILLE } from "@/lib/parcours";

const NAV = [
  { label: "EDGE Online", href: EDGE_HREFS.edgeOnline },
  { label: "Entreprises", href: EDGE_HREFS.entreprises },
  { label: "Tarifs", href: EDGE_HREFS.tarifs },
  { label: "École", href: EDGE_HREFS.ecole },
  { label: "À propos", href: EDGE_HREFS.aPropos },
] as const;

export function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [parcoursOpen, setParcoursOpen] = useState(false);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

  const scheduleClose = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    closeTimer.current = setTimeout(() => setParcoursOpen(false), 140);
  };

  const cancelClose = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setParcoursOpen(false);
        setMobileOpen(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setParcoursOpen(false);
    };
    document.addEventListener("pointerdown", onClick);
    return () => document.removeEventListener("pointerdown", onClick);
  }, []);

  return (
    <header className="sticky top-0 z-50 h-12 border-b border-black/[0.08] bg-white">
      <div className="mx-auto flex h-full max-w-6xl items-center justify-between gap-6 px-5 sm:px-10">
        <Link href={EDGE_HREFS.home} className="shrink-0 text-sm font-medium tracking-[0.12em] text-edge-black">
          EDGE
        </Link>

        <nav className="hidden items-center gap-1 lg:flex" aria-label="Navigation principale">
          <div
            ref={wrapRef}
            className="relative"
            onMouseEnter={() => {
              cancelClose();
              setParcoursOpen(true);
            }}
            onMouseLeave={scheduleClose}
          >
            <button
              type="button"
              className={cn(
                "px-3 py-1.5 text-[13px] font-medium transition-colors",
                parcoursOpen ? "text-edge-black" : "text-black/50 hover:text-edge-black",
              )}
              aria-expanded={parcoursOpen}
              aria-haspopup="true"
              onClick={() => setParcoursOpen((o) => !o)}
            >
              Parcours
            </button>

            <div
              className={cn(
                "fixed left-0 right-0 top-12 border-b border-black/[0.06] bg-white transition-opacity duration-200",
                parcoursOpen ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0",
              )}
              role="menu"
            >
              <div className="mx-auto grid max-w-6xl grid-cols-1 divide-y divide-black/[0.06] sm:grid-cols-2 sm:divide-x sm:divide-y-0 lg:grid-cols-4">
                {PARCOURS_BY_FAMILLE.map((col) => (
                  <div key={col.famille} className="px-6 py-8 sm:border-r sm:border-black/[0.06] last:sm:border-r-0">
                    <p className="text-[10px] font-normal uppercase tracking-[0.2em] text-edge-red">
                      {col.label}
                    </p>
                    <ul className="mt-5 space-y-1">
                      {col.items.map((item) => (
                        <li key={item.slug}>
                          <Link
                            href={EDGE_HREFS.parcoursSlug(item.slug)}
                            className="group block border-l-2 border-transparent py-2.5 pl-3 transition-colors duration-200 hover:border-edge-red hover:bg-edge-red/[0.03]"
                            role="menuitem"
                            onClick={() => setParcoursOpen(false)}
                          >
                            <span className="block text-[13px] font-medium text-edge-black">{item.titre}</span>
                            <span className="mt-0.5 block text-[11px] text-black/40">{item.duree}</span>
                          </Link>
                        </li>
                      ))}
                    </ul>
                    {col.famille === "innovation" ? (
                      <Link
                        href={EDGE_HREFS.orientation}
                        className="mt-4 inline-block pl-3 text-[13px] text-edge-red transition-opacity hover:opacity-80"
                      >
                        Faire le test d&apos;orientation →
                      </Link>
                    ) : null}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="px-3 py-1.5 text-[13px] font-medium text-black/50 transition-colors hover:text-edge-black"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-4 lg:flex">
          <Link
            href={EDGE_HREFS.login}
            className="text-[13px] font-medium text-black/50 transition-colors hover:text-edge-black"
          >
            Se connecter
          </Link>
          <EdgeButton href={EDGE_HREFS.candidater} className="!px-5 !py-2" ariaLabel={EDGE_CTA_LABELS.nav}>
            {EDGE_CTA_LABELS.nav}
          </EdgeButton>
          <EdgeButton
            variant="outline-red"
            href={EDGE_HREFS.edgeOnline}
            className="!px-5 !py-2"
            ariaLabel="Essayer EDGE Online"
          >
            Essayer Online
          </EdgeButton>
        </div>

        <button
          type="button"
          className="text-xl text-edge-black lg:hidden"
          aria-expanded={mobileOpen}
          aria-label={mobileOpen ? "Fermer le menu" : "Ouvrir le menu"}
          onClick={() => setMobileOpen((o) => !o)}
        >
          {mobileOpen ? "×" : "≡"}
        </button>
      </div>

      {mobileOpen ? (
        <div className="border-t border-black/[0.06] bg-white px-5 py-6 lg:hidden">
          <p className="text-[10px] uppercase tracking-[0.2em] text-black/30">Parcours</p>
          {PARCOURS_BY_FAMILLE.map((col) => (
            <div key={col.famille} className="mt-4">
              <p className="text-[10px] uppercase tracking-[0.2em] text-edge-red">{col.label}</p>
              <ul className="mt-2 space-y-2">
                {col.items.map((item) => (
                  <li key={item.slug}>
                    <Link
                      href={EDGE_HREFS.parcoursSlug(item.slug)}
                      className="text-sm text-edge-black"
                      onClick={() => setMobileOpen(false)}
                    >
                      {item.titre}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
          <div className="mt-6 space-y-3 border-t border-black/[0.06] pt-6">
            {NAV.map((item) => (
              <Link key={item.href} href={item.href} className="block text-sm" onClick={() => setMobileOpen(false)}>
                {item.label}
              </Link>
            ))}
          </div>
          <div className="mt-6 flex flex-col gap-2">
            <EdgeButton href={EDGE_HREFS.candidater}>{EDGE_CTA_LABELS.nav}</EdgeButton>
            <EdgeButton variant="outline-red" href={EDGE_HREFS.edgeOnline}>
              Essayer Online
            </EdgeButton>
          </div>
        </div>
      ) : null}
    </header>
  );
}
