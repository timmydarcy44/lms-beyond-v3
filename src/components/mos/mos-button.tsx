"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { MOS } from "@/components/mos/constants";

type Variant = "primary" | "outline-white" | "outline-red" | "white";

const styles: Record<Variant, string> = {
  primary: "bg-[#C8102E] text-white hover:bg-[#8B0000]",
  "outline-white": "border border-white/40 text-white hover:bg-white/10",
  "outline-red": "border border-[#C8102E] text-[#C8102E] hover:bg-[#C8102E]/5",
  white: "bg-white text-[#111111] hover:bg-[#F5F5F5]",
};

type Props = {
  href: string;
  children: React.ReactNode;
  variant?: Variant;
  className?: string;
};

export function MosButton({ href, children, variant = "primary", className }: Props) {
  return (
    <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
      <Link
        href={href}
        className={cn(
          "inline-flex items-center justify-center rounded-full px-8 py-3.5 text-xs font-semibold uppercase tracking-[0.18em] transition-colors duration-300",
          styles[variant],
          className,
        )}
        style={variant === "primary" ? { backgroundColor: MOS.red } : undefined}
      >
        {children}
      </Link>
    </motion.div>
  );
}
