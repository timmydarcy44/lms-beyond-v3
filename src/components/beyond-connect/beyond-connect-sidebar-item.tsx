"use client";

import { Briefcase } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { useTheme } from "next-themes";
import { AnimatePresence, motion } from "framer-motion";
import { useState, type MouseEvent } from "react";

type BeyondConnectSidebarItemProps = {
  href: string;
  isOpen: boolean;
  role: "admin" | "formateur" | "apprenant";
};

export function BeyondConnectSidebarItem({ href, isOpen, role }: BeyondConnectSidebarItemProps) {
  const pathname = usePathname();
  const isActive = pathname?.startsWith(href);
  const { resolvedTheme } = useTheme();
  const isLight = resolvedTheme === "light";
  const router = useRouter();
  const [isAnimating, setIsAnimating] = useState(false);

  const handleClick = (event: MouseEvent<HTMLAnchorElement>) => {
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
      return;
    }

    if (isAnimating) {
      return;
    }

    event.preventDefault();
    setIsAnimating(true);

    // Lancer la navigation une fois l'animation enclenchée
    setTimeout(() => {
      router.push(href);
    }, 260);
  };

  const brand = {
    base: "#003087", // Bleu PSG Beyond Connect
    lightBgFrom: "#e6edf7",
    lightBgTo: "#d4e1f0",
    lightText: "#002a6b",
    darkGlow: "rgba(0,48,135,0.35)",
  };

  return (
    <>
      <AnimatePresence>
        {isAnimating && (
          <motion.div
            className="pointer-events-none fixed inset-0 z-[90]"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.45, ease: "easeOut" }}
          >
            <motion.div
              className="absolute inset-0"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.45, ease: "easeOut" }}
              style={{
                background: "radial-gradient(circle at top, rgba(0,48,135,0.92), rgba(17,24,39,0.92))",
              }}
            />
            <motion.div
              className="absolute inset-0 flex items-center justify-center"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4, ease: "easeOut", delay: 0.05 }}
            >
              <div className="flex flex-col items-center gap-4 text-white">
                <motion.div
                  className="relative h-14 w-14"
                  initial={{ opacity: 0, scale: 0.6 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.38, delay: 0.08, ease: "easeOut" }}
                >
                  <span className="absolute inset-0 rounded-full border-2 border-white/30" />
                  <motion.span
                    className="absolute inset-0 rounded-full border-2 border-transparent border-t-white"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1.1, repeat: Infinity, ease: "linear" }}
                  />
                </motion.div>
                <motion.span
                  className="rounded-full border border-white/40 px-5 py-1 text-xs uppercase tracking-[0.45em] text-white/80"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.28, delay: 0.1 }}
                >
                  beyond connect
                </motion.span>
                <motion.h3
                  className="text-3xl font-semibold"
                  initial={{ opacity: 0, y: 18 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.35, delay: 0.16 }}
                >
                  Bienvenue sur Beyond Connect
                </motion.h3>
                <motion.p
                  className="text-sm text-white/70"
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.35, delay: 0.24 }}
                >
                  Nous préparons votre espace personnalisé
                </motion.p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <Link href={href} title="Beyond Connect" className="relative" onClick={handleClick}>
        <div
          className={cn(
            "group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
            // Style premium avec bordure et couleur bleue
            "border-2",
            isLight
              ? isActive
                ? "bg-gradient-to-r from-[#e6edf7] to-[#d4e1f0] text-[#002a6b] border-[#003087] shadow-sm"
                : "border-[#00308755] text-slate-600 hover:bg-[#e6edf7]/60 hover:text-[#002a6b] hover:border-[#003087]"
              : isActive
                ? "bg-gradient-to-r from-[#003087]/25 to-[#003087]/10 text-[#4a7bc8] border-[#003087]/70 backdrop-blur-sm shadow-lg shadow-[#003087]/30"
                : "border-[#003087]/35 text-white/70 hover:bg-[#003087]/10 hover:text-[#4a7bc8] hover:border-[#003087]/60",
            isOpen ? "gap-3" : "gap-0 justify-center px-2",
            isAnimating && "ring-2 ring-[#003087]/50",
          )}
        >
          <Briefcase
            className={cn(
              "h-5 w-5 shrink-0 transition-colors",
              isLight
                ? isActive
                  ? "text-[#003087]"
                  : "text-[#003087] group-hover:text-[#002a6b]"
                : isActive
                  ? "text-[#4a7bc8]"
                  : "text-[#6b8fd4]/80 group-hover:text-[#4a7bc8]",
            )}
          />
          {isOpen && (
            <span className="transition-opacity duration-300">
              Beyond Connect
            </span>
          )}
          {/* Badge premium */}
          {isOpen && (
            <span className="ml-auto rounded bg-[#003087]/10 px-1.5 py-0.5 text-[10px] font-semibold text-[#003087]/80">
              PREMIUM
            </span>
          )}
        </div>
      </Link>
    </>
  );
}

