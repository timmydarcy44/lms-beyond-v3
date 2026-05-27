"use client";

import { motion } from "framer-motion";
import {
  useMotionValueEvent,
  useScroll,
  useSpring,
  useTransform,
} from "framer-motion";
import { useRef, useState } from "react";

import { PremiumCssPhone } from "@/components/beyond-studio/sections/premium-css-phone";
import { HeroPhone3D } from "@/components/beyond-studio/three/hero-phone-loader";
import { HeroDeviceScrollContext } from "@/components/beyond-studio/three/hero-device-scroll";
import { cinematicEase } from "@/components/beyond-studio/motion/cinematic";

/** Device hero : CSS premium + couche 3D par-dessus */
export function HeroVisual() {
  const ref = useRef<HTMLDivElement>(null);
  const [scroll, setScroll] = useState(0);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });

  useMotionValueEvent(scrollYProgress, "change", setScroll);

  const scale = useSpring(useTransform(scrollYProgress, [0, 1], [1, 0.92]), {
    stiffness: 60,
    damping: 24,
  });

  return (
    <HeroDeviceScrollContext.Provider value={scroll}>
      <div ref={ref} className="relative h-[min(520px,68vh)] w-full sm:h-[min(620px,72vh)] lg:h-[min(700px,78vh)]">
        <div className="absolute inset-0 flex items-center justify-center">
          <PremiumCssPhone scrollProgress={scroll} className="h-full w-full scale-[1.05] sm:scale-110 lg:scale-[1.15]" />
        </div>

        <motion.div
          style={{ scale }}
          className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center opacity-0 sm:opacity-100"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 2, delay: 0.3, ease: cinematicEase }}
        >
          <div className="h-full w-full max-w-[900px] mix-blend-normal">
            <HeroPhone3D className="h-full w-full min-h-[480px] opacity-95" />
          </div>
        </motion.div>
      </div>
    </HeroDeviceScrollContext.Provider>
  );
}
