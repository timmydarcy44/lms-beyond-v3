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
      className="overflow-hidden rounded-[32px] border border-white/[0.12] bg-[linear-gradient(155deg,rgba(14,22,58,0.72)_0%,rgba(8,14,36,0.76)_42%,rgba(5,8,20,0.8)_100%)] shadow-[0_28px_90px_rgba(0,0,0,0.45),inset_0_1px_0_rgba(255,255,255,0.06)] backdrop-blur-3xl"
      role="menu"
    >
      <div className="px-8 py-10 sm:px-10 sm:py-12 lg:px-14 lg:py-14">
        <div>
          <Link
            href={data.headerHref}
            className="group inline-flex items-center gap-2 text-lg font-semibold tracking-[-0.02em] text-white transition-colors hover:text-white"
            onClick={onClose}
          >
            {data.headerTitle}
            <ArrowRight className="h-4 w-4 text-white/70 transition-transform group-hover:translate-x-0.5 group-hover:text-edge-accent" />
          </Link>
          {"headerSubtitle" in data && data.headerSubtitle ? (
            <p className="mt-2.5 max-w-2xl text-sm leading-relaxed text-white/42">
              {data.headerSubtitle}
            </p>
          ) : null}
        </div>

        <div className={`mt-11 grid gap-10 ${gridClass} lg:gap-12`}>
          {data.columns.map((col) => (
            <div key={col.title}>
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#8b9dc3]/90">
                {col.title}
              </p>
              <ul className="mt-5 space-y-1">
                {col.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="block rounded-xl px-3 py-2.5 text-sm font-medium text-white transition-colors hover:bg-white/[0.08] hover:text-white"
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
