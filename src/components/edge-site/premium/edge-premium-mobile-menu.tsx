"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";
import type { EdgePremiumConfig } from "@/lib/edge-site/premium-constants";
import { EdgePremiumButton } from "@/components/edge-site/premium/edge-premium-button";
import { EdgePremiumLogo } from "@/components/edge-site/premium/edge-premium-logo";
import {
  getMobileRevolutTabs,
  type MobileRevolutTabId,
} from "@/lib/edge-site/mobile-revolut-nav";

function RevolutAccordion({
  sections,
  onNavigate,
}: {
  sections: { title: string; links: { label: string; href: string }[] }[];
  onNavigate: () => void;
}) {
  const [openTitle, setOpenTitle] = useState<string | null>(sections[0]?.title ?? null);

  return (
    <div className="space-y-2">
      {sections.map((section) => {
        const isOpen = openTitle === section.title;
        return (
          <div key={section.title} className="overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.04]">
            <button
              type="button"
              className="flex w-full items-center justify-between px-4 py-3.5 text-left"
              aria-expanded={isOpen}
              onClick={() => setOpenTitle((prev) => (prev === section.title ? null : section.title))}
            >
              <span className="text-[15px] font-medium text-white">{section.title}</span>
              <ChevronRight
                className={cn(
                  "h-4 w-4 text-white/40 transition-transform duration-200",
                  isOpen && "rotate-90",
                )}
              />
            </button>
            {isOpen ? (
              <div className="border-t border-white/[0.06] px-2 pb-2 pt-1">
                {section.links.map((link) => (
                  <Link
                    key={link.label}
                    href={link.href}
                    className="block rounded-xl px-3 py-2.5 text-sm text-white/65 transition hover:bg-white/[0.06] hover:text-white"
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
};

export function EdgePremiumMobileMenu({ open, onClose, config, loginHref, discoverHref }: Props) {
  const tabs = getMobileRevolutTabs(config);
  const [activeTab, setActiveTab] = useState<MobileRevolutTabId>("apprenants");
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
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "linear-gradient(165deg, rgba(12, 18, 48, 0.97) 0%, rgba(5, 5, 12, 0.99) 45%, rgba(8, 12, 32, 0.98) 100%)",
        }}
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0 opacity-40"
        style={{
          background:
            "radial-gradient(ellipse 80% 50% at 20% 0%, rgba(99, 91, 255, 0.35), transparent 55%)",
        }}
        aria-hidden
      />

      <div className="relative flex shrink-0 items-center justify-between px-5 pb-2 pt-5">
        <EdgePremiumLogo />
        <button
          type="button"
          className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-xl text-white backdrop-blur-sm"
          aria-label="Fermer le menu"
          onClick={onClose}
        >
          ×
        </button>
      </div>

      <div className="relative shrink-0 px-5 pb-3">
        <div className="flex gap-2 overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "shrink-0 rounded-full px-4 py-2 text-sm font-medium transition",
                activeTab === tab.id
                  ? "bg-white/15 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.12)] backdrop-blur-md"
                  : "text-white/45 hover:text-white/70",
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div
        className="relative flex-1 overflow-y-auto overscroll-contain px-5 pt-2"
        style={{ paddingBottom: "140px" }}
      >
        {current ? (
          <>
            <Link
              href={current.discoverHref}
              className="mb-5 inline-flex items-center gap-1 text-sm font-medium text-white/80 hover:text-white"
              onClick={onClose}
            >
              {current.discoverLabel}
              <ChevronRight className="h-4 w-4" />
            </Link>
            <RevolutAccordion sections={current.sections} onNavigate={onClose} />
          </>
        ) : null}
      </div>

      <div className="fixed bottom-0 left-0 right-0 z-[101] border-t border-white/[0.08] bg-[#050508]/92 px-5 py-4 pb-[max(1.25rem,env(safe-area-inset-bottom))] backdrop-blur-xl lg:hidden">
        <div className="mx-auto flex max-w-lg flex-col gap-2.5">
          <Link
            href={loginHref}
            className="flex h-12 items-center justify-center rounded-2xl border border-white/15 bg-white/5 text-sm font-semibold text-white transition hover:bg-white/10"
            onClick={onClose}
          >
            Se connecter
          </Link>
          <EdgePremiumButton href={discoverHref} variant="white" shape="revolut" className="w-full" onClick={onClose}>
            Découvrir EDGE
          </EdgePremiumButton>
        </div>
      </div>
    </div>,
    document.body,
  );
}
