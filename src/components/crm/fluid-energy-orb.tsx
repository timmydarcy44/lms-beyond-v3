"use client";

import { cn } from "@/lib/utils";

type FluidEnergyOrbProps = {
  active?: boolean;
  className?: string;
};

/** Orbe violette organique (mouvement type cellule / plasma). */
export function FluidEnergyOrb({ active = true, className }: FluidEnergyOrbProps) {
  return (
    <div
      className={cn(
        "fluid-orb relative flex h-[min(44vw,240px)] w-[min(44vw,240px)] items-center justify-center sm:h-60 sm:w-60",
        className,
      )}
      aria-hidden
    >
      <div
        className={cn(
          "fluid-orb-aura absolute inset-[-40%] rounded-full transition-opacity duration-700",
          active ? "opacity-100" : "opacity-50",
        )}
      />
      <div className="fluid-orb-shell absolute inset-[6%] overflow-hidden rounded-full">
        <div className="fluid-orb-layer fluid-orb-layer-a" />
        <div className="fluid-orb-layer fluid-orb-layer-b" />
        <div className="fluid-orb-blob fluid-orb-blob-1" />
        <div className="fluid-orb-blob fluid-orb-blob-2" />
        <div className="fluid-orb-layer fluid-orb-layer-c" />
        <div className="fluid-orb-core" />
        <span className="fluid-orb-spark right-[18%] top-[22%]" />
        <span className="fluid-orb-spark bottom-[20%] left-[20%]" style={{ animationDelay: "1.2s" }} />
      </div>
      <div className="fluid-orb-rim absolute inset-[2%] rounded-full" />
    </div>
  );
}
