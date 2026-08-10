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
import {
  getMobileRevolutTabs,
  type MobileRevolutTabId,
} from "@/lib/edge-site/mobile-revolut-nav";

function RevolutAccordion({
  sections,
  onNavigate,
  light,
}: {
  sections: { title: string; links: { label: string; href: string }[] }[];
  onNavigate: () => void;
  light: boolean;
}) {
  const [openTitle, setOpenTitle] = useState<string | null>(null);

  return (
    <div>
      {sections.map((section) => {
        const isOpen = openTitle === section.title;
        return (
          <div
            key={section.title}
            className={cn("border-b", light ? "border-black/[0.06]" : "border-white/[0.06]")}
          >
            <button
              type="button"
              className="flex w-full items-center justify-between py-5 text-left"
              aria-expanded={isOpen}
              onClick={() => setOpenTitle((prev) => (prev === section.title ? null : section.title))}
            >
              <span
                className={cn(
                  "text-[17px] font-medium tracking-[-0.01em]",
                  light ? "text-neutral-950" : "text-white",
                )}
              >
                {section.title}
              </span>
              <ChevronRight
                className={cn(
                  "h-[18px] w-[18px] shrink-0 transition-transform duration-200",
                  light ? "text-neutral-400" : "text-white/35",
                  isOpen && "rotate-90",
                )}
              />
            </button>
            {isOpen ? (
              <div className="pb-5 pl-1">
                {section.links.map((link) => (
                  <Link
                    key={link.label}
                    href={link.href}
                    className={cn(
                      "block py-2.5 text-[15px] transition",
                      light
                        ? "text-neutral-600 hover:text-neutral-950"
                        : "text-white/55 hover:text-white",
                    )}
                    onClick={onNavigate}
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
  );
}

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
  const tabs = getMobileRevolutTabs(config);
  const [activeTab, setActiveTab] = useState<MobileRevolutTabId>("business");
  const [mounted, setMounted] = useState(false);

  const current = tabs.find((t) => t.id === activeTab) ?? tabs[0];

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
      {light ? (
        <div className="pointer-events-none absolute inset-0 bg-white" aria-hidden />
      ) : (
        <>
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                "linear-gradient(180deg, #050505 0%, #0a0a0a 38%, #080808 72%, #050505 100%)",
            }}
            aria-hidden
          />
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                "radial-gradient(ellipse 90% 45% at 50% -5%, rgba(255, 255, 255, 0.08), transparent 60%)",
            }}
            aria-hidden
          />
        </>
      )}

      <div className="relative flex shrink-0 items-center justify-between px-6 pb-4 pt-6">
        <Link href={config.links.home} onClick={onClose} aria-label="EDGE — Accueil">
          <Image
            src={light ? EDGE_LOGO_BLACK_PATH : EDGE_LOGO_PATH}
            alt="EDGE"
            width={88}
            height={28}
            className="h-7 w-auto"
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

      <div className="relative shrink-0 px-6 pb-5">
        <div className="flex gap-1 overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "shrink-0 rounded-full px-5 py-2.5 text-sm font-medium transition",
                light
                  ? activeTab === tab.id
                    ? "bg-neutral-950 text-white"
                    : "text-neutral-500 hover:text-neutral-950"
                  : activeTab === tab.id
                    ? "bg-white/12 text-white backdrop-blur-sm"
                    : "text-white/40 hover:text-white/65",
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div
        className="relative flex-1 overflow-y-auto overscroll-contain px-6"
        style={{ paddingBottom: "140px" }}
      >
        {current ? (
          <>
            <Link
              href={current.discoverHref}
              className={cn(
                "mb-8 inline-flex items-center gap-1.5 text-[15px] font-medium transition",
                light ? "text-neutral-800 hover:text-neutral-950" : "text-white/75 hover:text-white",
              )}
              onClick={onClose}
            >
              {current.discoverLabel}
              <ChevronRight
                className={cn("h-4 w-4", light ? "text-neutral-400" : "text-white/40")}
              />
            </Link>
            <RevolutAccordion sections={current.sections} onNavigate={onClose} light={light} />
          </>
        ) : null}
      </div>

      <div
        className={cn(
          "fixed bottom-0 left-0 right-0 z-[101] px-6 py-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] backdrop-blur-xl lg:hidden",
          light
            ? "border-t border-black/[0.06] bg-white/95"
            : "border-t border-white/[0.06] bg-[#060e1a]/95",
        )}
      >
        <div className="mx-auto flex max-w-lg flex-col gap-3">
          <Link
            href={loginHref}
            className={cn(
              "flex h-[52px] items-center justify-center rounded-2xl text-[15px] font-semibold transition",
              light
                ? "border border-black/12 text-neutral-950 hover:bg-black/[0.03]"
                : "border border-white/12 text-white hover:bg-white/[0.06]",
            )}
            onClick={onClose}
          >
            Se connecter
          </Link>
          <EdgePremiumButton
            href={discoverHref}
            variant={light ? "primary" : "white"}
            shape="revolut"
            className="w-full"
            onClick={onClose}
          >
            Découvrir EDGE
          </EdgePremiumButton>
        </div>
      </div>
    </div>,
    document.body,
  );
}
