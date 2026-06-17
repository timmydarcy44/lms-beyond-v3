"use client";

import { cn } from "@/lib/utils";
import { EDGE_GRADIENTS } from "@/lib/edge/edge-brand";

/** Fond global dashboard EDGE — halo bleu multi-couches (sous sidebar + contenu) */
export function ConnectCockpitBackdrop({ className }: { className?: string }) {
  return (
    <div
      className={cn("pointer-events-none fixed inset-0 z-0", className)}
      style={{ background: EDGE_GRADIENTS.dashboardPageBg }}
      aria-hidden
    />
  );
}
