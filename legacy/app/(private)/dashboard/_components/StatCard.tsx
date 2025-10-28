"use client";
import { motion } from "framer-motion";

export default function StatCard({
  label,
  value,
  icon,
}: {
  label: string;
  value: number | string;
  icon?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-sky-500/12 via-zinc-900/40 to-rose-500/12 ring-1 ring-white/10 shadow-sm"
    >
      {/* Liseré/halo subtil */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_80%_at_20%_10%,rgba(56,189,248,0.12),transparent_60%),radial-gradient(60%_80%_at_80%_90%,rgba(244,63,94,0.12),transparent_60%)]" />
      
      <div className="relative p-5">
        <div className="flex items-center justify-between">
          <div className="text-zinc-300/80 text-sm">{label}</div>
          <div className="h-9 w-9 rounded-xl bg-white/10 ring-1 ring-white/20 flex items-center justify-center text-zinc-200 shrink-0">
            {icon ?? "•"}
          </div>
        </div>
        <div className="mt-3 text-4xl font-semibold text-white">{value}</div>
      </div>
    </motion.div>
  );
}
