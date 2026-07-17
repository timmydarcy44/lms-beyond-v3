"use client";

import { cn } from "@/lib/utils";

/** Ambiances de fond distinctes — profondeur type Revolut, pas du noir plat. */
export type EdgeAmbiance = "profile" | "evolution" | "mission" | "neutral";

const AMBIANCE: Record<EdgeAmbiance, string> = {
  profile:
    "bg-[radial-gradient(ellipse_120%_80%_at_10%_-10%,rgba(37,99,235,0.35),transparent_55%),radial-gradient(ellipse_90%_70%_at_95%_10%,rgba(99,102,241,0.18),transparent_50%),linear-gradient(180deg,#0a1224_0%,#07090f_45%,#050508_100%)]",
  evolution:
    "bg-[radial-gradient(ellipse_110%_75%_at_85%_-5%,rgba(124,58,237,0.28),transparent_55%),radial-gradient(ellipse_80%_60%_at_0%_30%,rgba(14,165,233,0.14),transparent_50%),linear-gradient(180deg,#0c0a16_0%,#08080e_50%,#050508_100%)]",
  mission:
    "bg-[radial-gradient(ellipse_100%_70%_at_50%_-20%,rgba(30,41,59,0.55),transparent_55%),linear-gradient(180deg,#0a0b10_0%,#050508_100%)]",
  neutral:
    "bg-[radial-gradient(ellipse_100%_80%_at_50%_-15%,rgba(51,65,85,0.25),transparent_50%),linear-gradient(180deg,#0b0d14_0%,#06070b_100%)]",
};

export function EdgePageAmbiance({
  ambiance,
  children,
  className,
}: {
  ambiance: EdgeAmbiance;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("relative min-h-[70vh] rounded-[28px]", className)}>
      <div
        className={cn(
          "pointer-events-none absolute -inset-x-4 -inset-y-6 -z-10 rounded-[32px] sm:-inset-x-8 sm:-inset-y-8",
          AMBIANCE[ambiance],
        )}
        aria-hidden
      />
      {children}
    </div>
  );
}
