"use client";

import { Heart } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { useTheme } from "next-themes";
import { AnimatePresence, motion } from "framer-motion";
import { useState, type MouseEvent } from "react";

type BeyondCareSidebarItemProps = {
  href: string;
  isOpen: boolean;
  role: "admin" | "formateur" | "apprenant";
};

export function BeyondCareSidebarItem({ href, isOpen, role }: BeyondCareSidebarItemProps) {
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
    base: "#c91459",
    lightBgFrom: "#fde4ef",
    lightBgTo: "#fcd3e4",
    lightText: "#9f0f4a",
    darkGlow: "rgba(201,20,89,0.35)",
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
                background: "radial-gradient(circle at top, rgba(201,20,89,0.92), rgba(17,24,39,0.92))",
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
                  beyond care
                </motion.span>
                <motion.h3
                  className="text-3xl font-semibold"
                  initial={{ opacity: 0, y: 18 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.35, delay: 0.16 }}
                >
                  Bienvenue sur Beyond Care
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

      <Link href={href} title="Beyond Care" className="relative" onClick={handleClick}>
        <div
          className={cn(
            "group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
            // Style premium avec bordure et couleur orange/verte
            "border-2",
            isLight
              ? isActive
                ? "bg-gradient-to-r from-[#fde4ef] to-[#fcd3e4] text-[#9f0f4a] border-[#c91459] shadow-sm"
                : "border-[#c9145955] text-slate-600 hover:bg-[#fde4ef]/60 hover:text-[#b1104a] hover:border-[#c91459]"
              : isActive
                ? "bg-gradient-to-r from-[#c91459]/25 to-[#c91459]/10 text-[#ff6fa6] border-[#c91459]/70 backdrop-blur-sm shadow-lg shadow-[#c91459]/30"
                : "border-[#c91459]/35 text-white/70 hover:bg-[#c91459]/10 hover:text-[#ff6fa6] hover:border-[#c91459]/60",
            isOpen ? "gap-3" : "gap-0 justify-center px-2",
            isAnimating && "ring-2 ring-[#c91459]/50",
          )}
        >
          <Heart
            className={cn(
              "h-5 w-5 shrink-0 transition-colors",
              isLight
                ? isActive
                  ? "text-[#c91459]"
                  : "text-[#c91459] group-hover:text-[#b1104a]"
                : isActive
                  ? "text-[#ff77b0]"
                  : "text-[#ff9cc7]/80 group-hover:text-[#ff77b0]",
            )}
          />
          {isOpen && (
            <span className="transition-opacity duration-300">
              Beyond Care
            </span>
          )}
          {/* Badge premium */}
          {isOpen && (
            <span className="ml-auto rounded bg-[#c91459]/10 px-1.5 py-0.5 text-[10px] font-semibold text-[#c91459]/80">
              PREMIUM
            </span>
          )}
        </div>
      </Link>
    </>
  );
}

