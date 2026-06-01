"use client";

import { cn } from "@/lib/utils";

type FluidEnergyOrbProps = {
  active?: boolean;
  className?: string;
};

/** Orbe énergétique fluide (bleu électrique / cyan / violet). */
export function FluidEnergyOrb({ active = true, className }: FluidEnergyOrbProps) {
  return (
    <div
      className={cn(
        "fluid-orb relative flex h-[min(42vw,220px)] w-[min(42vw,220px)] items-center justify-center sm:h-56 sm:w-56",
        className,
      )}
      aria-hidden
    >
      <div
        className={cn(
          "fluid-orb-aura absolute inset-[-35%] rounded-full opacity-70 transition-opacity duration-700",
          active ? "opacity-90" : "opacity-45",
        )}
      />
      <div className="fluid-orb-shell absolute inset-[8%] overflow-hidden rounded-full">
        <div className="fluid-orb-layer fluid-orb-layer-a" />
        <div className="fluid-orb-layer fluid-orb-layer-b" />
        <div className="fluid-orb-layer fluid-orb-layer-c" />
        <div className="fluid-orb-core" />
      </div>
      <div className="fluid-orb-rim absolute inset-[4%] rounded-full" />
    </div>
  );
}
