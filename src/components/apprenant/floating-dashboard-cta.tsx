"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";

type FloatingDashboardCTAProps = {
  /**
   * Optionnel : masquer le bouton pour certains préfixes de routes.
   * Si non fourni, le CTA reste visible dès qu'on est sur un contenu apprenant.
   */
  hideOnPathStartsWith?: string[];
  className?: string;
};

export function FloatingDashboardCTA({
  hideOnPathStartsWith = [],
  className,
}: FloatingDashboardCTAProps) {
  const pathname = usePathname();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Ne rien afficher côté SSR ou si on se trouve sur une route interdite
  if (!isMounted) {
    return null;
  }

  if (hideOnPathStartsWith.some((prefix) => pathname?.startsWith(prefix))) {
    return null;
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 32 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 32 }}
        transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] as const }}
        className={cn("fixed bottom-6 left-6 z-50 flex", className)}
      >
        <Link
          href="/dashboard/apprenant"
          aria-label="Retour au dashboard"
          className="group flex h-14 w-14 items-center justify-center rounded-full border border-black bg-black text-white shadow-[0_20px_55px_-35px_rgba(0,0,0,0.65)] transition hover:bg-black/85 hover:text-white hover:shadow-[0_30px_75px_-40px_rgba(0,0,0,0.45)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/80"
        >
          <ArrowLeft className="h-6 w-6 text-white transition group-hover:text-white" />
        </Link>
      </motion.div>
    </AnimatePresence>
  );
}



