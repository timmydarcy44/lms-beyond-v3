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
    columnCount >= 4
      ? "sm:grid-cols-2 lg:grid-cols-4"
      : "sm:grid-cols-2 lg:grid-cols-3";

  return (
    <div
      className={cn(
        "overflow-hidden rounded-[32px] backdrop-blur-3xl",
        light
          ? "border border-black/[0.08] bg-white/80 shadow-[0_28px_90px_rgba(0,0,0,0.12),inset_0_1px_0_rgba(255,255,255,0.8)] supports-[backdrop-filter]:bg-white/65"
          : "border border-white/[0.1] bg-[rgba(18,18,20,0.55)] shadow-[0_28px_90px_rgba(0,0,0,0.35),inset_0_1px_0_rgba(255,255,255,0.08)] supports-[backdrop-filter]:bg-[rgba(18,18,20,0.42)]",
      )}
      role="menu"
    >
      <div className="px-8 py-10 sm:px-10 sm:py-12 lg:px-14 lg:py-14">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
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

          {"actions" in data && data.actions ? (
            <div className="flex flex-col gap-2 sm:flex-row">
              {data.actions.map((action) => (
                <Link
                  key={action.label}
                  href={action.href}
                  onClick={onClose}
                  className={cn(
                    "inline-flex min-h-11 items-center justify-center rounded-full px-5 text-sm font-semibold transition",
                    action.primary
                      ? light
                        ? "bg-[#070b1f] text-white hover:bg-black"
                        : "bg-white text-[#070b1f] hover:bg-white/90"
                      : light
                        ? "border border-black/10 bg-black/[0.03] text-neutral-900 hover:bg-black/[0.07]"
                        : "border border-white/10 bg-white/[0.06] text-white hover:bg-white/[0.11]",
                  )}
                  role="menuitem"
                >
                  {action.label}
                </Link>
              ))}
            </div>
          ) : null}
        </div>

        <div className={`mt-11 grid gap-10 ${gridClass} lg:gap-12`}>
          {data.columns.map((col) => {
            const groups = "groups" in col ? col.groups : [{ title: col.title, links: col.links }];
            return (
              <div key={col.title || groups.map((group) => group.title).join("-")}>
                {col.title ? (
                  <p
                    className={cn(
                      "text-[11px] font-semibold uppercase tracking-[0.2em]",
                      light ? "text-neutral-500" : "text-white/45",
                    )}
                  >
                    {col.title}
                  </p>
                ) : null}
                <div className={cn("space-y-7", col.title && "mt-5")}>
                  {groups.map((group) => (
                    <div key={group.title}>
                      {"groups" in col ? (
                        <p className={cn("text-sm font-semibold", light ? "text-neutral-950" : "text-white")}>
                          {group.title}
                        </p>
                      ) : null}
                      <ul className={cn("space-y-1", "groups" in col && "mt-2")}>
                        {group.links.map((link) => {
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
                                      : "text-white/80 hover:bg-white/[0.08] hover:text-white",
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
            );
          })}
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
