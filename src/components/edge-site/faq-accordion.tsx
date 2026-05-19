"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

type Item = { q: string; a: string };

type Props = {
  items: readonly Item[];
  icon?: "plus" | "chevron";
  defaultOpen?: number | null;
};

export function FaqAccordion({ items, icon = "plus", defaultOpen = 0 }: Props) {
  const [open, setOpen] = useState<number | null>(defaultOpen);

  return (
    <dl className="divide-y divide-black/[0.06] border-y border-black/[0.06]">
      {items.map((item, i) => {
        const expanded = open === i;
        return (
          <div key={item.q}>
            <dt>
              <button
                type="button"
                className="flex w-full items-center justify-between gap-4 py-6 text-left text-[15px] font-medium text-edge-black"
                aria-expanded={expanded}
                onClick={() => setOpen(expanded ? null : i)}
              >
                <span>{item.q}</span>
                {icon === "chevron" ? (
                  <svg
                    className={cn(
                      "h-5 w-5 shrink-0 text-edge-red transition-transform duration-200",
                      expanded && "rotate-180",
                    )}
                    viewBox="0 0 20 20"
                    fill="none"
                    aria-hidden
                  >
                    <path
                      d="M5 7.5L10 12.5L15 7.5"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                ) : (
                  <span className="text-edge-red" aria-hidden>
                    {expanded ? "−" : "+"}
                  </span>
                )}
              </button>
            </dt>
            {expanded ? (
              <dd className="pb-6 text-[14px] leading-relaxed text-black/40">{item.a}</dd>
            ) : null}
          </div>
        );
      })}
    </dl>
  );
}
