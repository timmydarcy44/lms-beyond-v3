"use client";

import Link from "next/link";
import { ArrowRight, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import type { PillarMegaMenuData } from "@/lib/edge-site/pillar-mega-menu-data";

type PanelProps = {
  data: PillarMegaMenuData;
  onClose: () => void;
  light?: boolean;
  panelId: string;
};

export function EdgePremiumPillarMegaPanel({ data, onClose, light = false, panelId }: PanelProps) {
  return (
    <div
      id={panelId}
      className={cn(
        "edge-pillar-mega-panel w-[min(620px,calc(100vw-2.5rem))] overflow-hidden rounded-2xl",
        light
          ? "border border-black/[0.08] bg-white shadow-[0_24px_80px_rgba(0,0,0,0.12)]"
          : "border border-white/[0.08] bg-[#0a0a0a] shadow-[0_24px_80px_rgba(0,0,0,0.55)]",
      )}
      role="menu"
      aria-label={data.label}
    >
      <div className="flex">
        <div className="min-w-0 flex-[0_0_68%] px-6 py-6 sm:px-7 sm:py-7">
          <div>
            <p
              className={cn(
                "text-[11px] font-semibold uppercase tracking-[0.18em]",
                light ? "text-neutral-500" : "text-white/45",
              )}
            >
              {data.title}
            </p>
            <p
              className={cn(
                "mt-1.5 text-sm leading-snug",
                light ? "text-neutral-600" : "text-white/55",
              )}
            >
              {data.subtitle}
            </p>
          </div>

          <ul className="mt-5 space-y-0.5">
            {data.primaryLinks.map((link) => {
              const Icon = link.icon;
              const linkProps = link.external
                ? { target: "_blank" as const, rel: "noopener noreferrer" }
                : {};

              return (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className={cn(
                      "group flex items-start gap-3 rounded-xl px-3 py-3 transition-colors duration-200",
                      light
                        ? "hover:bg-black/[0.04]"
                        : "hover:bg-white/[0.05]",
                    )}
                    role="menuitem"
                    onClick={onClose}
                    {...linkProps}
                  >
                    <span
                      className={cn(
                        "mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border",
                        light
                          ? "border-black/[0.06] bg-black/[0.02] text-neutral-600"
                          : "border-white/[0.08] bg-white/[0.03] text-white/55",
                      )}
                    >
                      <Icon className="h-4 w-4" aria-hidden />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span
                        className={cn(
                          "flex items-center gap-1.5 text-sm font-semibold tracking-[-0.01em]",
                          light ? "text-neutral-950" : "text-white",
                        )}
                      >
                        {link.label}
                        <ArrowRight
                          className={cn(
                            "h-3.5 w-3.5 shrink-0 opacity-0 transition-all duration-200 group-hover:translate-x-0.5 group-hover:opacity-100",
                            light ? "text-neutral-400" : "text-white/40",
                          )}
                          aria-hidden
                        />
                      </span>
                      <span
                        className={cn(
                          "mt-0.5 block text-xs leading-relaxed",
                          light ? "text-neutral-500" : "text-white/42",
                        )}
                      >
                        {link.description}
                      </span>
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>

          {data.secondaryLinks.length > 0 ? (
            <div
              className={cn(
                "mt-4 flex flex-wrap gap-2 border-t border-dashed pt-4",
                light ? "border-black/[0.06]" : "border-white/[0.06]",
              )}
            >
              {data.secondaryLinks.map((link) => (
                <Link
                  key={link.label}
                  href={link.href}
                  className={cn(
                    "rounded-full px-3 py-1.5 text-xs font-medium transition-colors duration-200",
                    light
                      ? "bg-black/[0.04] text-neutral-600 hover:bg-black/[0.07] hover:text-neutral-950"
                      : "bg-white/[0.05] text-white/50 hover:bg-white/[0.09] hover:text-white/80",
                  )}
                  onClick={onClose}
                >
                  {link.label}
                </Link>
              ))}
            </div>
          ) : null}
        </div>

        <aside
          className={cn(
            "flex min-w-0 flex-[0_0_32%] flex-col justify-between border-l px-5 py-6 sm:px-6 sm:py-7",
            light
              ? "border-black/[0.06] bg-neutral-50/80"
              : "border-white/[0.06] bg-white/[0.02]",
          )}
        >
          <div>
            {data.editorial.label ? (
              <p
                className={cn(
                  "text-[10px] font-semibold uppercase tracking-[0.2em]",
                  light ? "text-neutral-400" : "text-white/35",
                )}
              >
                {data.editorial.label}
              </p>
            ) : null}
            <p
              className={cn(
                "mt-2 text-sm font-semibold leading-snug tracking-[-0.02em]",
                light ? "text-neutral-950" : "text-white",
                data.editorial.label ? "" : "mt-0",
              )}
            >
              {data.editorial.title}
            </p>
            <p
              className={cn(
                "mt-2 text-xs leading-relaxed",
                light ? "text-neutral-500" : "text-white/42",
              )}
            >
              {data.editorial.description}
            </p>
          </div>
          <Link
            href={data.editorial.ctaHref}
            className={cn(
              "group mt-6 inline-flex items-center gap-1.5 text-xs font-semibold transition-colors duration-200",
              light
                ? "text-neutral-800 hover:text-neutral-950"
                : "text-white/75 hover:text-white",
            )}
            onClick={onClose}
          >
            {data.editorial.ctaLabel}
            <ArrowRight
              className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-0.5"
              aria-hidden
            />
          </Link>
        </aside>
      </div>
    </div>
  );
}

type TriggerProps = {
  label: string;
  open: boolean;
  onOpen: () => void;
  onToggle: () => void;
  light?: boolean;
  controlsId: string;
};

export function EdgePremiumPillarMegaTrigger({
  label,
  open,
  onOpen,
  onToggle,
  light = false,
  controlsId,
}: TriggerProps) {
  return (
    <button
      type="button"
      className={cn(
        "group relative flex items-center gap-1 px-2.5 py-2 text-sm font-medium transition-colors duration-200 xl:px-3",
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
      aria-controls={controlsId}
      onMouseEnter={onOpen}
      onClick={onToggle}
    >
      {label}
      <ChevronDown
        className={cn(
          "h-3.5 w-3.5 transition-transform duration-200",
          open && "rotate-180",
        )}
        aria-hidden
      />
      <span
        className={cn(
          "absolute bottom-0 left-2.5 right-2.5 h-px origin-left scale-x-0 transition-transform duration-200 group-hover:scale-x-100 xl:left-3 xl:right-3",
          open && "scale-x-100",
          light ? "bg-neutral-950" : "bg-white",
        )}
        aria-hidden
      />
    </button>
  );
}
