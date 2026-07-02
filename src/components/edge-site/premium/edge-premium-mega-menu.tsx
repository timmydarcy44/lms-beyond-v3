"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { EdgeMegaColumnsData } from "@/lib/edge-site/premium-constants";

type PanelProps = {
  data: EdgeMegaColumnsData;
  onClose: () => void;
};

export function EdgePremiumMegaColumnsPanel({ data, onClose }: PanelProps) {
  return (
    <div
      className="border-b border-white/[0.06] bg-edge-black-deep"
      role="menu"
    >
      <div className="mx-auto max-w-7xl px-6 py-10 sm:px-8 lg:px-10 lg:py-12">
        <Link
          href={data.headerHref}
          className="group inline-flex items-center gap-2 text-lg font-semibold text-white transition-colors hover:text-edge-accent"
          onClick={onClose}
        >
          {data.headerTitle}
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
        </Link>

        <div className="mt-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-4 lg:gap-12">
          {data.columns.map((col) => (
            <div key={col.title}>
              <p className="text-xs font-medium text-white/35">{col.title}</p>
              <ul className="mt-4 space-y-0.5">
                {col.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="block rounded-lg px-2 py-2 text-sm text-white/80 transition-colors hover:bg-white/[0.05] hover:text-white"
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
