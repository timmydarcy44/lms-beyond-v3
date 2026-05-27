"use client";

import {
  motion,
  useMotionValue,
  useMotionValueEvent,
  useScroll,
  useSpring,
  useTransform,
} from "framer-motion";
import { useRef, useState } from "react";

import { HeroPhone3D } from "@/components/beyond-studio/three/hero-phone-loader";
import { HeroDeviceScrollContext } from "@/components/beyond-studio/three/hero-device-scroll";
import { cinematicEase } from "@/components/beyond-studio/motion/cinematic";

export function HeroDeviceStage() {
  const ref = useRef<HTMLDivElement>(null);
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const [deviceScroll, setDeviceScroll] = useState(0);

  const parallaxX = useSpring(useTransform(mx, [-0.5, 0.5], [-12, 12]), { stiffness: 50, damping: 22 });
  const parallaxY = useSpring(useTransform(my, [-0.5, 0.5], [-8, 8]), { stiffness: 50, damping: 22 });

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });

  useMotionValueEvent(scrollYProgress, "change", (v) => {
    setDeviceScroll(v);
  });

  return (
    <HeroDeviceScrollContext.Provider value={deviceScroll}>
      <div
        ref={ref}
        className="relative flex h-[min(95vh,1100px)] w-full items-center justify-center sm:h-[100vh]"
        onMouseMove={(e) => {
          const rect = ref.current?.getBoundingClientRect();
          if (!rect) return;
          mx.set((e.clientX - rect.left) / rect.width - 0.5);
          my.set((e.clientY - rect.top) / rect.height - 0.5);
        }}
        onMouseLeave={() => {
          mx.set(0);
          my.set(0);
        }}
      >
        <motion.div
          animate={{ opacity: [0.35, 0.75, 0.35] }}
          transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }}
          className="pointer-events-none absolute left-1/2 top-[40%] h-[min(760px,78vh)] w-[min(920px,100vw)] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(ellipse,rgba(90,130,255,0.32),rgba(40,70,180,0.05)_45%,transparent_70%)] blur-3xl"
        />

        <motion.div
          style={{ x: parallaxX, y: parallaxY }}
          initial={{ opacity: 0, scale: 0.78 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.8, delay: 0.1, ease: cinematicEase }}
          className="relative z-10 h-full w-full max-w-[min(900px,100vw)]"
        >
          <HeroPhone3D className="h-full w-full min-h-[600px]" />
        </motion.div>
      </div>
    </HeroDeviceScrollContext.Provider>
  );
}
