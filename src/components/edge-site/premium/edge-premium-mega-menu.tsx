"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import type { EdgeMegaColumnsData } from "@/lib/edge-site/premium-constants";

type PanelProps = {
  data: EdgeMegaColumnsData;
  onClose: () => void;
  light?: boolean;
};

export function EdgePremiumMegaColumnsPanel({ data, onClose, light = false }: PanelProps) {
  const columnCount = data.columns.length;
  const gridClass =
    columnCount >= 5
      ? "sm:grid-cols-2 lg:grid-cols-5"
      : columnCount === 4
        ? "sm:grid-cols-2 lg:grid-cols-4"
        : "sm:grid-cols-2 lg:grid-cols-3";

  return (
    <div
      className={cn(
        "overflow-hidden rounded-[32px] backdrop-blur-3xl",
        light
          ? "border border-black/[0.08] bg-white shadow-[0_28px_90px_rgba(0,0,0,0.12),inset_0_1px_0_rgba(255,255,255,0.8)]"
          : "border border-white/[0.12] bg-[linear-gradient(155deg,rgba(14,14,14,0.92)_0%,rgba(8,8,8,0.94)_42%,rgba(5,5,5,0.96)_100%)] shadow-[0_28px_90px_rgba(0,0,0,0.45),inset_0_1px_0_rgba(255,255,255,0.06)]",
      )}
      role="menu"
    >
      <div className="px-8 py-10 sm:px-10 sm:py-12 lg:px-14 lg:py-14">
        <div>
          <Link
            href={data.headerHref}
            className={cn(
              "group inline-flex items-center gap-2 text-lg font-semibold tracking-[-0.02em] transition-colors",
              light ? "text-neutral-950 hover:text-neutral-950" : "text-white hover:text-white",
            )}
            onClick={onClose}
          >
            {data.headerTitle}
            <ArrowRight
              className={cn(
                "h-4 w-4 transition-transform group-hover:translate-x-0.5",
                light
                  ? "text-neutral-500 group-hover:text-neutral-950"
                  : "text-white/70 group-hover:text-white",
              )}
            />
          </Link>
          {"headerSubtitle" in data && data.headerSubtitle ? (
            <p
              className={cn(
                "mt-2.5 max-w-2xl text-sm leading-relaxed",
                light ? "text-neutral-500" : "text-white/42",
              )}
            >
              {data.headerSubtitle}
            </p>
          ) : null}
        </div>

        <div className={`mt-11 grid gap-10 ${gridClass} lg:gap-12`}>
          {data.columns.map((col) => (
            <div key={col.title}>
              <p
                className={cn(
                  "text-[11px] font-semibold uppercase tracking-[0.2em]",
                  light ? "text-neutral-500" : "text-white/45",
                )}
              >
                {col.title}
              </p>
              <ul className="mt-5 space-y-1">
                {col.links.map((link) => {
                  const featured = "featured" in link && link.featured;
                  return (
                    <li key={link.label}>
                      <Link
                        href={link.href}
                        className={cn(
                          "block rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                          featured
                            ? "edge-mega-featured relative overflow-hidden text-white"
                            : light
                              ? "text-neutral-800 hover:bg-black/[0.04] hover:text-neutral-950"
                              : "text-white hover:bg-white/[0.08] hover:text-white",
                        )}
                        role="menuitem"
                        onClick={onClose}
                      >
                        <span className="relative z-[1]">{link.label}</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

type TriggerProps = {
  label: string;
  open: boolean;
  onOpen: () => void;
  light?: boolean;
};

export function EdgePremiumMegaTrigger({ label, open, onOpen, light = false }: TriggerProps) {
  return (
    <button
      type="button"
      className={cn(
        "px-2.5 py-2 text-sm font-medium transition-colors xl:px-3",
        light
          ? open
            ? "text-neutral-950"
            : "text-neutral-700 hover:text-neutral-950"
          : open
            ? "text-white"
            : "text-white/60 hover:text-white",
      )}
      aria-expanded={open}
      aria-haspopup="true"
      onMouseEnter={onOpen}
      onClick={onOpen}
    >
      {label}
    </button>
  );
}
