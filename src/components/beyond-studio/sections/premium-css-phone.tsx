"use client";

import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { useRef } from "react";

import { PhoneDashboardUI } from "@/components/beyond-studio/ui/phone-dashboard";
import { cinematicEase } from "@/components/beyond-studio/motion/cinematic";

type PremiumCssPhoneProps = {
  className?: string;
  scrollProgress?: number;
};

export function PremiumCssPhone({ className, scrollProgress = 0 }: PremiumCssPhoneProps) {
  const ref = useRef<HTMLDivElement>(null);
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const rotateX = useSpring(useTransform(my, [-0.5, 0.5], [14, -10]), { stiffness: 80, damping: 26 });
  const rotateY = useSpring(useTransform(mx, [-0.5, 0.5], [-18, 18]), { stiffness: 80, damping: 26 });

  const scrollRotateX = scrollProgress * 10;
  const scrollRotateY = scrollProgress * -6;

  return (
    <div
      ref={ref}
      className={`relative flex items-center justify-center ${className ?? ""}`}
      style={{ perspective: "1400px" }}
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
      <div className="pointer-events-none absolute bottom-[8%] left-1/2 h-24 w-[85%] -translate-x-1/2 rounded-[100%] bg-black/90 blur-[80px]" />
      <div className="pointer-events-none absolute left-1/2 top-[45%] h-[min(500px,60vh)] w-[min(600px,90vw)] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(ellipse,rgba(72,120,255,0.35),transparent_68%)] blur-3xl" />

      <motion.div
        initial={{ opacity: 0, scale: 0.85, rotateX: 18 }}
        animate={{ opacity: 1, scale: 1, rotateX: 8 + scrollRotateX }}
        transition={{ duration: 1.6, ease: cinematicEase }}
        style={{
          rotateX,
          rotateY,
          transformStyle: "preserve-3d",
        }}
        className="relative z-10 w-[min(400px,88vw)] sm:w-[min(440px,72vw)] lg:w-[min(480px,42vw)]"
      >
        <motion.div
          style={{ rotateY: scrollRotateY }}
          className="relative rounded-[3rem] p-[11px] shadow-[0_50px_120px_rgba(0,0,0,0.75),0_0_100px_rgba(59,99,220,0.2)] [background:linear-gradient(145deg,#3a3d48_0%,#12131a_35%,#0a0b10_55%,#252830_100%)] [box-shadow:inset_0_1px_0_rgba(255,255,255,0.12),inset_0_-2px_8px_rgba(0,0,0,0.5)]"
        >
          <div
            className="pointer-events-none absolute -inset-px rounded-[3rem] opacity-40"
            style={{
              background:
                "linear-gradient(135deg, rgba(255,255,255,0.25) 0%, transparent 40%, transparent 60%, rgba(100,140,255,0.15) 100%)",
            }}
          />
          <div className="relative overflow-hidden rounded-[2.35rem] ring-1 ring-white/[0.08]">
            <div className="absolute inset-0 bg-gradient-to-br from-sky-500/10 via-transparent to-indigo-900/20" />
            <PhoneDashboardUI />
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-tr from-white/[0.06] via-transparent to-transparent" />
          </div>
          <div className="absolute left-1/2 top-[14px] h-[22px] w-[90px] -translate-x-1/2 rounded-full bg-black/90 ring-1 ring-white/10" />
        </motion.div>

        <div
          className="pointer-events-none absolute -right-2 top-[18%] h-12 w-[3px] rounded-full bg-gradient-to-b from-zinc-600 to-zinc-800 shadow-lg"
          style={{ transform: "translateZ(8px)" }}
        />
        <div
          className="pointer-events-none absolute -left-2 top-[28%] h-16 w-[3px] rounded-full bg-gradient-to-b from-zinc-600 to-zinc-800"
          style={{ transform: "translateZ(8px)" }}
        />
      </motion.div>
    </div>
  );
}
