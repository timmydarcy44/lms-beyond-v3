"use client";

import { HeroPhone3D } from "@/components/beyond-studio/three/hero-phone-loader";
import { HeroDeviceScrollContext } from "@/components/beyond-studio/three/hero-device-scroll";
import { useMotionValueEvent, useScroll } from "framer-motion";
import { useRef, useState } from "react";

/** Device hero object — section 3 */
export function DeviceMoment({ className }: { className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [scroll, setScroll] = useState(0);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });

  useMotionValueEvent(scrollYProgress, "change", (v) => setScroll(v));

  return (
    <HeroDeviceScrollContext.Provider value={scroll}>
      <div
        ref={ref}
        className={`relative flex min-h-[min(75vh,720px)] w-full items-center justify-center ${className ?? ""}`}
      >
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_50%_45%_at_50%_50%,rgba(72,110,220,0.15),transparent_70%)]" />
        <div className="relative h-full w-full max-w-[min(800px,100vw)] min-h-[520px]">
          <HeroPhone3D className="h-full w-full" />
        </div>
      </div>
    </HeroDeviceScrollContext.Provider>
  );
}
