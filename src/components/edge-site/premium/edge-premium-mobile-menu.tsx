"use client";

import Image from "next/image";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";
import type { EdgePremiumConfig } from "@/lib/edge-site/premium-constants";
import { EDGE_LOGO_PATH } from "@/lib/edge-site/premium-constants";
import { EdgePremiumButton } from "@/components/edge-site/premium/edge-premium-button";
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
  const [openTitle, setOpenTitle] = useState<string | null>(null);

  return (
    <div>
      {sections.map((section) => {
        const isOpen = openTitle === section.title;
        return (
          <div key={section.title} className="border-b border-white/[0.06]">
            <button
              type="button"
              className="flex w-full items-center justify-between py-5 text-left"
              aria-expanded={isOpen}
              onClick={() => setOpenTitle((prev) => (prev === section.title ? null : section.title))}
            >
              <span className="text-[17px] font-medium tracking-[-0.01em] text-white">{section.title}</span>
              <ChevronRight
                className={cn(
                  "h-[18px] w-[18px] shrink-0 text-white/35 transition-transform duration-200",
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
                    className="block py-2.5 text-[15px] text-white/55 transition hover:text-white"
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
            "linear-gradient(180deg, #0a1628 0%, #0d1f3c 38%, #091525 72%, #060e1a 100%)",
        }}
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 90% 45% at 50% -5%, rgba(56, 120, 210, 0.22), transparent 60%)",
        }}
        aria-hidden
      />

      <div className="relative flex shrink-0 items-center justify-between px-6 pb-4 pt-6">
        <Link href={config.links.home} onClick={onClose} aria-label="EDGE — Accueil">
          <Image src={EDGE_LOGO_PATH} alt="EDGE" width={88} height={28} className="h-7 w-auto" priority />
        </Link>
        <button
          type="button"
          className="flex h-10 w-10 items-center justify-center text-2xl text-white/70 transition hover:text-white"
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
                activeTab === tab.id
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
              className="mb-8 inline-flex items-center gap-1.5 text-[15px] font-medium text-white/75 transition hover:text-white"
              onClick={onClose}
            >
              {current.discoverLabel}
              <ChevronRight className="h-4 w-4 text-white/40" />
            </Link>
            <RevolutAccordion sections={current.sections} onNavigate={onClose} />
          </>
        ) : null}
      </div>

      <div className="fixed bottom-0 left-0 right-0 z-[101] border-t border-white/[0.06] bg-[#060e1a]/95 px-6 py-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] backdrop-blur-xl lg:hidden">
        <div className="mx-auto flex max-w-lg flex-col gap-3">
          <Link
            href={loginHref}
            className="flex h-[52px] items-center justify-center rounded-2xl border border-white/12 text-[15px] font-semibold text-white transition hover:bg-white/[0.06]"
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
