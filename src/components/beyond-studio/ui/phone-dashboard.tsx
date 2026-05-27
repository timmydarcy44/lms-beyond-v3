"use client";

import { motion } from "framer-motion";

const METRICS = [
  { label: "Attention", value: 92, delay: 0 },
  { label: "Décision", value: 88, delay: 0.15 },
  { label: "Adoption", value: 96, delay: 0.3 },
] as const;

export function PhoneDashboardUI() {
  return (
    <div className="relative flex h-full min-h-[440px] w-full flex-col justify-between overflow-hidden rounded-[1.4rem] bg-[#06070c] p-5">
      <motion.div
        className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-sky-500/25 blur-3xl"
        animate={{ opacity: [0.35, 0.65, 0.35], scale: [1, 1.15, 1] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="pointer-events-none absolute bottom-0 left-0 h-24 w-full bg-gradient-to-t from-sky-600/10 to-transparent"
        animate={{ opacity: [0.4, 0.8, 0.4] }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
      />

      <div className="relative">
        <p className="text-[8px] font-medium uppercase tracking-[0.4em] text-zinc-500">Beyond</p>
        <motion.p
          className="mt-2 text-[16px] font-semibold leading-[1.15] tracking-tight text-white"
          animate={{ opacity: [0.92, 1, 0.92] }}
          transition={{ duration: 3, repeat: Infinity }}
        >
          Clarté
          <br />
          cognitive
        </motion.p>
      </div>

      <div className="relative space-y-3.5">
        {METRICS.map((row) => (
          <div key={row.label}>
            <div className="mb-1.5 flex justify-between text-[8px] text-zinc-500">
              <span>{row.label}</span>
              <motion.span
                className="text-sky-300/90"
                animate={{ opacity: [0.6, 1, 0.6] }}
                transition={{ duration: 2.5, delay: row.delay, repeat: Infinity }}
              >
                {row.value}%
              </motion.span>
            </div>
            <div className="h-[3px] overflow-hidden rounded-full bg-white/[0.05]">
              <motion.div
                className="h-full rounded-full bg-gradient-to-r from-sky-600/80 to-sky-400/60 shadow-[0_0_12px_rgba(56,120,255,0.5)]"
                initial={{ width: "0%" }}
                animate={{ width: `${row.value}%` }}
                transition={{ duration: 1.8, delay: 0.4 + row.delay, ease: [0.16, 1, 0.3, 1] }}
              />
            </div>
          </div>
        ))}
      </div>

      <motion.div
        className="relative rounded-2xl border border-sky-500/10 bg-sky-950/20 p-3"
        animate={{
          boxShadow: [
            "0 0 0 rgba(56,120,255,0)",
            "0 0 24px rgba(56,120,255,0.15)",
            "0 0 0 rgba(56,120,255,0)",
          ],
        }}
        transition={{ duration: 4, repeat: Infinity }}
      >
        <p className="text-[8px] leading-relaxed text-zinc-400">
          Système augmenté · friction réduite
        </p>
      </motion.div>
    </div>
  );
}
