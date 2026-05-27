"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import Link from "next/link";

import { cn } from "@/lib/utils";

export function BeyondStudioNav() {
  const { scrollY } = useScroll();
  const backgroundColor = useTransform(scrollY, [0, 200], [
    "rgba(5, 5, 8, 0)",
    "rgba(5, 5, 8, 0.85)",
  ]);

  return (
    <motion.header
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 1.2, delay: 0.2 }}
      style={{ backgroundColor }}
      className="fixed inset-x-0 top-0 z-50 backdrop-blur-xl"
    >
      <div className="mx-auto flex h-16 max-w-[1600px] items-center justify-between px-6 sm:px-12 lg:px-20">
        <Link href="/beyond-studio" className="text-[13px] font-medium tracking-tight text-white">
          Beyond Studio
        </Link>
        <a
          href="#contact"
          className={cn(
            "rounded-full border border-white/10 px-4 py-2 text-[12px] text-zinc-300",
            "transition duration-500 hover:border-white/25 hover:text-white",
          )}
        >
          Démarrer un projet
        </a>
      </div>
    </motion.header>
  );
}
