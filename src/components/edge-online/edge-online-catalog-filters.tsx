"use client";

import { Search } from "lucide-react";
import { EDGE_ONLINE_FILTER_CHIPS } from "@/lib/edge-online/catalog-filters";
import { cn } from "@/lib/utils";

type Props = {
  activeChip: string;
  searchQuery: string;
  onChipChange: (id: string) => void;
  onSearchChange: (q: string) => void;
  className?: string;
};

export function EdgeOnlineCatalogFilters({
  activeChip,
  searchQuery,
  onChipChange,
  onSearchChange,
  className,
}: Props) {
  return (
    <div className={cn("space-y-4", className)}>
      <div className="relative max-w-xl">
        <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-black/35" />
        <input
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Rechercher une formation…"
          className="w-full rounded-full border border-black/[0.08] bg-white py-3 pl-11 pr-4 text-sm text-[#0a0a0a] shadow-sm outline-none transition focus:border-black/20 focus:ring-2 focus:ring-black/[0.04]"
        />
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {EDGE_ONLINE_FILTER_CHIPS.map((chip) => {
          const active = activeChip === chip.id;
          return (
            <button
              key={chip.id}
              type="button"
              onClick={() => onChipChange(chip.id)}
              className={cn(
                "shrink-0 rounded-full px-4 py-2 text-sm font-medium transition duration-200",
                active
                  ? "bg-[#0a0a0a] text-white shadow-md"
                  : "border border-black/[0.08] bg-white text-black/55 hover:border-black/15 hover:text-black/80",
              )}
            >
              {chip.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
