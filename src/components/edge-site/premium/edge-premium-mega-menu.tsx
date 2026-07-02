"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { EdgeMegaColumnsData } from "@/lib/edge-site/premium-constants";

type PanelProps = {
  data: EdgeMegaColumnsData;
  onClose: () => void;
};

export function EdgePremiumMegaColumnsPanel({ data, onClose }: PanelProps) {
  const columnCount = data.columns.length;
  const gridClass =
    columnCount >= 5
      ? "sm:grid-cols-2 lg:grid-cols-5"
      : columnCount === 4
        ? "sm:grid-cols-2 lg:grid-cols-4"
        : "sm:grid-cols-2 lg:grid-cols-3";

  return (
    <div
      className="border-b border-white/[0.06] bg-[#050508]/92 backdrop-blur-2xl"
      role="menu"
    >
      <div className="mx-auto max-w-7xl px-6 py-10 sm:px-8 lg:px-10 lg:py-12">
        <div>
          <Link
            href={data.headerHref}
            className="group inline-flex items-center gap-2 text-lg font-semibold text-white transition-colors hover:text-edge-accent"
            onClick={onClose}
          >
            {data.headerTitle}
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
          {"headerSubtitle" in data && data.headerSubtitle ? (
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-white/45">
              {data.headerSubtitle}
            </p>
          ) : null}
        </div>

        <div className={`mt-10 grid gap-8 ${gridClass} lg:gap-10`}>
          {data.columns.map((col) => (
            <div key={col.title}>
              <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-white/50">
                {col.title}
              </p>
              <ul className="mt-4 space-y-0.5">
                {col.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="block rounded-lg px-2 py-2 text-sm text-white/80 transition-colors hover:bg-white/[0.04] hover:text-edge-accent"
                      role="menuitem"
                      onClick={onClose}
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
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
};

export function EdgePremiumMegaTrigger({ label, open, onOpen }: TriggerProps) {
  return (
    <button
      type="button"
      className={`px-2.5 py-2 text-sm font-medium transition-colors xl:px-3 ${
        open ? "text-white" : "text-white/60 hover:text-white"
      }`}
      aria-expanded={open}
      aria-haspopup="true"
      onMouseEnter={onOpen}
      onClick={onOpen}
    >
      {label}
    </button>
  );
}
