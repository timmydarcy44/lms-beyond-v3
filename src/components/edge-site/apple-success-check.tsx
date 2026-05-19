"use client";

import { motion } from "framer-motion";

const CIRCLE = 44;
const CHECK = "M28 46 L40 58 L60 34";

type Props = {
  size?: number;
  className?: string;
};

/** Validation animée type Apple Pay — cercle + check (palette EDGE). */
export function AppleSuccessCheck({ size = 88, className }: Props) {
  return (
    <div className={className} style={{ width: size, height: size }} role="img" aria-label="Confirmation">
      <motion.svg width={size} height={size} viewBox="0 0 88 88" fill="none" initial="hidden" animate="visible">
        <motion.circle
          cx={CIRCLE}
          cy={CIRCLE}
          r={40}
          fill="#FF3B30"
          variants={{
            hidden: { scale: 0, opacity: 0 },
            visible: {
              scale: 1,
              opacity: 1,
              transition: { type: "spring", stiffness: 420, damping: 22, mass: 0.8 },
            },
          }}
          style={{ transformOrigin: "44px 44px" }}
        />
        <motion.circle
          cx={CIRCLE}
          cy={CIRCLE}
          r={40}
          fill="none"
          stroke="rgba(255,255,255,0.35)"
          strokeWidth={2}
          variants={{
            hidden: { scale: 0.85, opacity: 0 },
            visible: {
              scale: [0.85, 1.12, 1],
              opacity: [0, 0.6, 0],
              transition: { delay: 0.15, duration: 0.55, ease: "easeOut" },
            },
          }}
          style={{ transformOrigin: "44px 44px" }}
        />
        <motion.path
          d={CHECK}
          stroke="white"
          strokeWidth={4}
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
          variants={{
            hidden: { pathLength: 0, opacity: 0 },
            visible: {
              pathLength: 1,
              opacity: 1,
              transition: { delay: 0.28, duration: 0.38, ease: [0.22, 1, 0.36, 1] },
            },
          }}
        />
      </motion.svg>
    </div>
  );
}
