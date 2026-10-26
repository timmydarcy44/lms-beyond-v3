"use client";

import Image from "next/image";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";
import type { EdgePremiumConfig } from "@/lib/edge-site/premium-constants";
import { EDGE_LOGO_BLACK_PATH, EDGE_LOGO_PATH } from "@/lib/edge-site/premium-constants";
import { EdgePremiumButton } from "@/components/edge-site/premium/edge-premium-button";
import { MegaMenu } from "@/components/edge-site/premium/mega-menu";
import { getMobileRevolutTabs } from "@/lib/edge-site/mobile-revolut-nav";
import { getNeoMegaMenus } from "@/lib/edge-site/neo-mega-menus";

type Props = {
  open: boolean;
  onClose: () => void;
  config: EdgePremiumConfig;
  loginHref: string;
  discoverHref: string;
  light?: boolean;
};

export function EdgePremiumMobileMenu({
  open,
  onClose,
  config,
  loginHref,
  discoverHref,
  light = false,
}: Props) {
  const tabs = getMobileRevolutTabs(config).filter(
    (tab) => tab.id === "a-propos",
  );
  const neoMenus = getNeoMegaMenus(config.routes);
  const [openPanel, setOpenPanel] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  if (!mounted || !open) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex flex-col lg:hidden"
      style={{ height: "100dvh" }}
      role="dialog"
      aria-modal="true"
      aria-label="Menu de navigation"
    >
      <div className="pointer-events-none absolute inset-0 bg-[#070C1C]" aria-hidden />

      <div className="relative flex shrink-0 items-center justify-between px-6 pb-4 pt-6">
        <Link href={config.links.home} onClick={onClose} aria-label="Byound — Accueil">
          <Image
            src={light ? EDGE_LOGO_BLACK_PATH : EDGE_LOGO_PATH}
            alt="Byound"
            width={120}
            height={32}
            className={cn("h-9 w-auto", light && "brightness-0")}
            priority
          />
        </Link>
        <button
          type="button"
          className={cn(
            "flex h-10 w-10 items-center justify-center text-2xl transition",
            light ? "text-neutral-500 hover:text-neutral-950" : "text-white/70 hover:text-white",
          )}
          aria-label="Fermer le menu"
          onClick={onClose}
        >
          ×
        </button>
      </div>

      <div className="relative flex-1 overflow-y-auto overscroll-contain px-5" style={{ paddingBottom: "150px" }}>
        {neoMenus.map((menu) => {
          const open = openPanel === menu.id;
          return (
            <div key={menu.id} className="border-b border-white/10">
              <button
                type="button"
                className="flex min-h-14 w-full items-center justify-between py-4 text-left text-[17px] font-bold text-white"
                aria-expanded={open}
                aria-controls={`mobile-mega-${menu.id}`}
                onClick={() => setOpenPanel((current) => (current === menu.id ? null : menu.id))}
              >
                {menu.label}
                <ChevronRight className={cn("transition-transform", open && "rotate-90")} size={18} aria-hidden />
              </button>
              {open ? (
                <div id={`mobile-mega-${menu.id}`} className="pb-5">
                  <MegaMenu menu={menu} id={`mobile-panel-${menu.id}`} onNavigate={onClose} mobile />
                </div>
              ) : null}
            </div>
          );
        })}
        <Link
          href="/offres"
          className="flex min-h-14 items-center border-b border-white/10 text-[17px] font-bold text-white"
          onClick={onClose}
        >
          Offres d&apos;emploi
        </Link>
        <Link
          href={config.routes.tarifs}
          className="flex min-h-14 items-center border-b border-white/10 text-[17px] font-bold text-white"
          onClick={onClose}
        >
          Tarifs
        </Link>
        {tabs.map((tab) => {
          const open = openPanel === tab.id;
          return (
            <div key={tab.id} className="border-b border-white/10">
              <button
                type="button"
                className="flex min-h-14 w-full items-center justify-between py-4 text-left text-[17px] font-bold text-white"
                aria-expanded={open}
                onClick={() => setOpenPanel((current) => (current === tab.id ? null : tab.id))}
              >
                {tab.label}
                <ChevronRight className={cn("transition-transform", open && "rotate-90")} size={18} aria-hidden />
              </button>
              {open ? (
                <div className="pb-4">
                  {tab.sections.flatMap((section) => section.links).map((link) => (
                    <Link
                      key={link.label}
                      href={link.href}
                      className="block rounded-2xl px-3 py-3 text-[15px] font-semibold text-white hover:bg-white/6"
                      onClick={onClose}
                    >
                      {link.label}
                    </Link>
                  ))}
                </div>
              ) : null}
            </div>
          );
        })}
      </div>

      <div
        className={cn(
          "fixed bottom-0 left-0 right-0 z-[101] bg-[#070C1C] px-6 py-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] lg:hidden",
          "border-t border-white/10",
        )}
      >
        <div className="mx-auto flex max-w-lg flex-col gap-3">
          <Link
            href={loginHref}
            className={cn(
              "flex h-[52px] items-center justify-center rounded-2xl text-[15px] font-semibold transition",
              "border border-white/12 text-white hover:bg-white/[0.06]",
            )}
            onClick={onClose}
          >
            Se connecter
          </Link>
          <EdgePremiumButton
            href={discoverHref}
            variant="white"
            shape="revolut"
            className="w-full"
            onClick={onClose}
          >
            Créer un compte
          </EdgePremiumButton>
        </div>
      </div>
    </div>,
    document.body,
  );
}
