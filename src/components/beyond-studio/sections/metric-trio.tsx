"use client";

import { motion } from "framer-motion";

import { cinematicEase } from "@/components/beyond-studio/motion/cinematic";
import { studioLightMuted, studioLightSubtle } from "@/components/beyond-studio/theme";
import { cn } from "@/lib/utils";

const METRICS = [
  { label: "Conversion", value: "+24%", hint: "parcours simplifiés" },
  { label: "Adoption", value: "89%", hint: "équipes & clients" },
  { label: "Temps gagné", value: "−38%", hint: "friction opérationnelle" },
] as const;

export function MetricTrio({ className }: { className?: string }) {
  return (
    <div className={cn("grid gap-8 sm:grid-cols-3 sm:gap-6", className)}>
      {METRICS.map((m, i) => (
        <motion.div
          key={m.label}
          initial={{ opacity: 0, y: 28 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-8%" }}
          transition={{ duration: 1.1, delay: i * 0.1, ease: cinematicEase }}
          className="border-t border-[#1a1a1e]/10 pt-8 sm:pt-10"
        >
          <p className={cn("text-[11px] font-medium uppercase tracking-[0.28em]", studioLightMuted)}>
            {m.label}
          </p>
          <p className={cn("mt-3 text-[clamp(2rem,4vw,3rem)] font-semibold tracking-tight", studioLightSubtle)}>
            {m.value}
          </p>
          <p className={cn("mt-2 text-sm", studioLightMuted)}>{m.hint}</p>
        </motion.div>
      ))}
    </div>
  );
}
