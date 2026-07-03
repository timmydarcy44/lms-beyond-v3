"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

type Props = {
  label: string;
  value: string;
  delta?: string;
  deltaPositive?: boolean;
  icon: LucideIcon;
  accent?: "violet" | "neutral";
};

export function EdgeStatCard({ label, value, delta, deltaPositive, icon: Icon, accent = "violet" }: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className="rounded-[24px] border border-[#050505]/8 bg-white p-5 shadow-[0_1px_2px_rgba(5,5,5,0.04),0_8px_24px_rgba(5,5,5,0.05)]"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#050505]/40">{label}</p>
          <p className="mt-2 text-2xl font-semibold tracking-tight text-[#050505]">{value}</p>
          {delta ? (
            <p
              className={cn(
                "mt-1 text-xs font-medium",
                deltaPositive === false ? "text-[#E25555]" : "text-[#635BFF]",
              )}
            >
              {delta}
            </p>
          ) : null}
        </div>
        <div
          className={cn(
            "flex h-11 w-11 items-center justify-center rounded-2xl",
            accent === "violet" ? "bg-[#635BFF]/10 text-[#635BFF]" : "bg-[#050505]/5 text-[#050505]/45",
          )}
        >
          <Icon className="h-5 w-5" strokeWidth={1.5} />
        </div>
      </div>
    </motion.div>
  );
}
