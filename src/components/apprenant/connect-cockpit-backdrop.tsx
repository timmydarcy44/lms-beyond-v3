"use client";

import { cn } from "@/lib/utils";

/** Fond global dashboard (base #0D0D12) — très léger, pas d'accent secondaire */
export function ConnectCockpitBackdrop({ className }: { className?: string }) {
  return (
    <div className={cn("pointer-events-none fixed inset-0 z-0 overflow-hidden", className)} aria-hidden>
      <div className="absolute inset-0 bg-[#0D0D12]" />
      <div
        className="absolute inset-0 opacity-60"
        style={{
          background:
            "radial-gradient(ellipse at 80% 20%, rgba(37,99,235,0.12) 0%, transparent 60%), radial-gradient(ellipse at 10% 60%, rgba(37,99,235,0.06) 0%, transparent 55%)",
        }}
      />
    </div>
  );
}
