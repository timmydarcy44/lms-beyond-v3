"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

type Props = { className?: string; label?: string };

/** Mockup LMS stylisé (CSS uniquement). */
export function EdgeLmsMockup({ className, label = "EDGE · Espace apprenant" }: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24, scale: 0.98 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className={cn(
        "relative overflow-hidden rounded-2xl border border-white/[0.08] bg-gradient-to-br from-zinc-900/90 to-[#0c0c12] p-1 shadow-[0_32px_80px_-24px_rgba(0,0,0,0.85),inset_0_1px_0_rgba(255,255,255,0.06)]",
        className,
      )}
    >
      <div className="flex items-center gap-2 border-b border-white/[0.06] px-4 py-3">
        <div className="flex gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-white/10" />
          <span className="h-2.5 w-2.5 rounded-full bg-white/10" />
          <span className="h-2.5 w-2.5 rounded-full bg-white/10" />
        </div>
        <div className="mx-auto max-w-[min(100%,280px)] flex-1 truncate rounded-md bg-white/[0.04] px-3 py-1.5 text-center text-[10px] font-medium text-white/35">
          {label}
        </div>
      </div>
      <div className="flex min-h-[220px] gap-0 sm:min-h-[260px]">
        <aside className="hidden w-44 shrink-0 border-r border-white/[0.06] p-3 sm:block">
          <div className="space-y-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className={cn(
                  "h-2 rounded-full bg-white/[0.06]",
                  i === 2 ? "w-full bg-gradient-to-r from-sky-500/30 to-emerald-500/20" : "w-[70%]",
                )}
              />
            ))}
          </div>
        </aside>
        <div className="flex flex-1 flex-col gap-4 p-4 sm:p-6">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <div className="h-2 w-24 rounded-full bg-white/10" />
              <div className="mt-3 h-3 w-40 max-w-full rounded-full bg-white/[0.12]" />
            </div>
            <div className="rounded-full border border-emerald-400/25 bg-emerald-500/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-emerald-200/90">
              Compétence · 72%
            </div>
          </div>
          <div className="grid flex-1 grid-cols-3 gap-2 sm:gap-3">
            <div className="col-span-2 rounded-xl border border-white/[0.06] bg-white/[0.03] p-4">
              <div className="h-2 w-20 rounded-full bg-sky-400/30" />
              <div className="mt-4 space-y-2">
                <div className="h-2 w-full rounded-full bg-white/[0.06]" />
                <div className="h-2 w-[92%] rounded-full bg-white/[0.06]" />
                <div className="h-2 w-[78%] rounded-full bg-white/[0.06]" />
              </div>
            </div>
            <div className="flex flex-col gap-2 rounded-xl border border-white/[0.06] bg-gradient-to-b from-violet-500/10 to-transparent p-3">
              <div className="text-[9px] font-semibold uppercase tracking-wider text-white/35">Badges</div>
              <div className="mt-auto space-y-2">
                <div className="h-8 rounded-lg bg-white/[0.06]" />
                <div className="h-8 rounded-lg bg-white/[0.06]" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
