"use client";

import {
  motion,
  useMotionTemplate,
  useMotionValue,
  useScroll,
  useSpring,
  useTransform,
  type MotionValue,
} from "framer-motion";
import { useRef, type ReactNode } from "react";

import { cn } from "@/lib/utils";

export const cinematicEase = [0.16, 1, 0.3, 1] as const;

export function AtmosphericGlow({ className }: { className?: string }) {
  return (
    <div className={cn("pointer-events-none absolute inset-0 overflow-hidden", className)}>
      <div className="absolute -left-[20%] top-[-10%] h-[70vh] w-[70vh] rounded-full bg-[radial-gradient(circle,rgba(56,99,220,0.14),transparent_68%)] blur-3xl" />
      <div className="absolute -right-[15%] bottom-[10%] h-[55vh] w-[55vh] rounded-full bg-[radial-gradient(circle,rgba(30,58,138,0.12),transparent_70%)] blur-3xl" />
      <div className="absolute left-1/2 top-1/2 h-[40vh] w-[min(900px,90vw)] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(ellipse,rgba(99,130,255,0.06),transparent_65%)]" />
    </div>
  );
}

export function ParallaxLayer({
  children,
  className,
  offset = 80,
  progress,
}: {
  children: ReactNode;
  className?: string;
  offset?: number;
  progress?: MotionValue<number>;
}) {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const p = progress ?? scrollYProgress;
  const y = useTransform(p, [0, 1], [offset, -offset]);
  const smoothY = useSpring(y, { stiffness: 90, damping: 28, mass: 0.6 });

  return (
    <motion.div ref={ref} style={{ y: smoothY }} className={className}>
      {children}
    </motion.div>
  );
}

export function TextReveal({
  children,
  className,
  delay = 0,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 48, filter: "blur(8px)" }}
      whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      viewport={{ once: true, margin: "-12%" }}
      transition={{ duration: 1.45, delay, ease: cinematicEase }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function StatementBlock({
  lines,
  className,
  align = "left",
  theme = "dark",
}: {
  lines: { text: string; muted?: boolean; size?: "lg" | "xl" | "hero" }[];
  className?: string;
  align?: "left" | "center";
  theme?: "dark" | "light";
}) {
  const isLight = theme === "light";
  return (
    <div
      className={cn(
        "space-y-2",
        align === "center" && "mx-auto text-center",
        className,
      )}
    >
      {lines.map((line, i) => (
        <motion.p
          key={`${line.text}-${i}`}
          initial={{ opacity: 0, y: 32 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-10%" }}
          transition={{ duration: 1, delay: i * 0.12, ease: cinematicEase }}
          className={cn(
            "font-semibold tracking-[-0.03em]",
            line.size === "hero" && "text-[clamp(2.5rem,6vw,4.5rem)] leading-[1.02]",
            line.size === "xl" && "text-[clamp(1.75rem,4vw,3rem)] leading-[1.08]",
            (line.size === "lg" || !line.size) && "text-[clamp(1.35rem,3vw,2rem)] leading-[1.12]",
            line.muted
              ? isLight
                ? "text-[#5c5c66]"
                : "text-zinc-500"
              : isLight
                ? "text-[#1a1a1e]"
                : "text-white",
          )}
        >
          {line.text}
        </motion.p>
      ))}
    </div>
  );
}

/** Subtle mouse-reactive ambient spotlight */
export function MouseGlow({ className }: { className?: string }) {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const background = useMotionTemplate`radial-gradient(600px circle at ${x}px ${y}px, rgba(72, 110, 220, 0.08), transparent 65%)`;

  return (
    <motion.div
      className={cn("pointer-events-none absolute inset-0 z-0", className)}
      style={{ background }}
      onMouseMove={(e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        x.set(e.clientX - rect.left);
        y.set(e.clientY - rect.top);
      }}
    />
  );
}
