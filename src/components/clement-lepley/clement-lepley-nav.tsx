"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import {
  COPPER,
  LOGO_URL,
  MEGA_MENU_COLUMNS,
  MEGA_MENU_INTRO,
  SF_PRO,
} from "@/lib/clement-lepley/constants";

type ClementLepleyNavProps = {
  onSimulateClick?: () => void;
};

export function ClementLepleyNav({ onSimulateClick }: ClementLepleyNavProps) {
  const [megaOpen, setMegaOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const megaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (megaRef.current && !megaRef.current.contains(e.target as Node)) {
        setMegaOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const scrollTo = (id: string) => {
    setMobileOpen(false);
    setMegaOpen(false);
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${
        scrolled || megaOpen || mobileOpen ? "bg-black/90 backdrop-blur-md" : "bg-transparent"
      }`}
      style={{ fontFamily: SF_PRO }}
    >
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-6 lg:px-10">
        <div className="flex flex-1 items-center gap-6">
          <div ref={megaRef} className="relative hidden md:block">
            <button
              type="button"
              onClick={() => setMegaOpen((v) => !v)}
              onMouseEnter={() => setMegaOpen(true)}
              className="text-sm font-medium tracking-wide text-white/90 transition hover:text-white"
            >
              Transformer votre extérieur
            </button>

            {megaOpen ? (
              <div
                className="absolute left-0 top-full pt-4"
                onMouseLeave={() => setMegaOpen(false)}
              >
                <div className="w-[min(920px,calc(100vw-3rem))] rounded-sm bg-[#0d0d0d] p-8 shadow-2xl ring-1 ring-white/10">
                  <div className="grid gap-8 md:grid-cols-4">
                    <div className="md:col-span-1">
                      <p
                        className="text-[11px] font-semibold uppercase tracking-[0.18em]"
                        style={{ color: COPPER }}
                      >
                        {MEGA_MENU_INTRO.label}
                      </p>
                      <p className="mt-4 text-lg font-semibold leading-snug text-white">
                        {MEGA_MENU_INTRO.title}
                      </p>
                      <p className="mt-3 text-sm leading-relaxed text-white/70">
                        {MEGA_MENU_INTRO.description}
                      </p>
                    </div>

                    {MEGA_MENU_COLUMNS.map((col) => (
                      <div key={col.label}>
                        <p
                          className="text-[11px] font-semibold uppercase tracking-[0.18em]"
                          style={{ color: COPPER }}
                        >
                          {col.label}
                        </p>
                        <ul className="mt-4 space-y-0">
                          {col.items.map((item) => (
                            <li key={item}>
                              <button
                                type="button"
                                onClick={() => scrollTo("prestations")}
                                className="block w-full border-b border-white/10 py-3 text-left text-sm text-white transition hover:text-white/80"
                              >
                                {item}
                              </button>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        </div>

        <Link href="/clementlepley" className="absolute left-1/2 -translate-x-1/2">
          <Image
            src={LOGO_URL}
            alt="Clément Lepley — Valorise votre maison"
            width={160}
            height={48}
            priority
            className="h-10 w-auto md:h-12"
          />
        </Link>

        <div className="flex flex-1 items-center justify-end gap-6">
          <button
            type="button"
            onClick={() => scrollTo("realisations")}
            className="hidden text-sm font-medium text-white/90 transition hover:text-white md:block"
          >
            Nos réalisations
          </button>
          <button
            type="button"
            onClick={() => scrollTo("contact")}
            className="hidden text-sm font-medium text-white/90 transition hover:text-white md:block"
          >
            Contact
          </button>

          <button
            type="button"
            onClick={() => setMobileOpen((v) => !v)}
            className="flex h-10 w-10 items-center justify-center rounded-md border border-white/20 md:hidden"
            aria-label="Menu"
          >
            <span className="sr-only">Menu</span>
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden>
              {mobileOpen ? (
                <path d="M4 4L16 16M16 4L4 16" stroke="white" strokeWidth="1.5" />
              ) : (
                <path d="M3 6H17M3 10H17M3 14H17" stroke="white" strokeWidth="1.5" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {mobileOpen ? (
        <div className="border-t border-white/10 bg-black/95 px-6 py-6 md:hidden">
          <button
            type="button"
            onClick={() => {
              setMobileOpen(false);
              scrollTo("prestations");
            }}
            className="block w-full py-3 text-left text-sm text-white"
          >
            Transformer votre extérieur
          </button>
          <button
            type="button"
            onClick={() => scrollTo("realisations")}
            className="block w-full py-3 text-left text-sm text-white"
          >
            Nos réalisations
          </button>
          <button
            type="button"
            onClick={() => scrollTo("contact")}
            className="block w-full py-3 text-left text-sm text-white"
          >
            Contact
          </button>
          {onSimulateClick ? (
            <button
              type="button"
              onClick={() => {
                setMobileOpen(false);
                onSimulateClick();
              }}
              className="mt-2 block w-full py-3 text-left text-sm font-medium"
              style={{ color: COPPER }}
            >
              Simuler mon extérieur
            </button>
          ) : null}
        </div>
      ) : null}
    </header>
  );
}
