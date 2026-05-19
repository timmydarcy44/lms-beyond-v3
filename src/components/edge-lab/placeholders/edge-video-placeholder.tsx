"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Play } from "lucide-react";

type Props = { className?: string; caption?: string };

export function EdgeVideoPlaceholder({ className, caption = "Aperçu module · placeholder" }: Props) {
  return (
    <motion.button
      type="button"
      aria-label="Lecture vidéo (aperçu démo)"
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.45 }}
      className={cn(
        "group relative flex aspect-video w-full cursor-pointer flex-col items-center justify-center overflow-hidden rounded-2xl border border-white/[0.08] bg-[#0a0a10] text-left shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] transition",
        "hover:border-sky-400/30 hover:shadow-[0_0_48px_-12px_rgba(56,189,248,0.25)]",
        className,
      )}
    >
      <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(56,189,248,0.08)_0%,transparent_45%,rgba(34,197,94,0.06)_100%)]" />
      <div className="absolute inset-0 opacity-30 [background-image:linear-gradient(rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.04)_1px,transparent_1px)] [background-size:24px_24px]" />
      <span className="relative flex h-16 w-16 items-center justify-center rounded-full border border-white/15 bg-white/[0.08] text-white shadow-[0_0_40px_-8px_rgba(56,189,248,0.4)] transition group-hover:scale-105 group-hover:border-sky-400/40 group-hover:bg-white/[0.12]">
        <Play className="ml-0.5 h-7 w-7" fill="currentColor" />
      </span>
      <span className="relative mt-4 text-xs font-medium text-white/45">{caption}</span>
    </motion.button>
  );
}
