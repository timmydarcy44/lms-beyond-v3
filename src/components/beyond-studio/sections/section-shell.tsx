"use client";

import type { ReactNode } from "react";

import { AtmosphericGlow, MouseGlow } from "@/components/beyond-studio/motion/cinematic";
import { studioDark, studioLight } from "@/components/beyond-studio/theme";
import { cn } from "@/lib/utils";

export function DarkSection({
  children,
  className,
  glow = false,
  mouseGlow = false,
  id,
}: {
  children: ReactNode;
  className?: string;
  glow?: boolean;
  mouseGlow?: boolean;
  id?: string;
}) {
  return (
    <section id={id} className={cn("relative overflow-hidden", studioDark, className)}>
      {glow && <AtmosphericGlow />}
      {mouseGlow && <MouseGlow />}
      <div className="relative z-10">{children}</div>
    </section>
  );
}

export function LightSection({
  children,
  className,
  id,
}: {
  children: ReactNode;
  className?: string;
  id?: string;
}) {
  return (
    <section id={id} className={cn("relative overflow-hidden", studioLight, className)}>
      <div className="relative z-10">{children}</div>
    </section>
  );
}
