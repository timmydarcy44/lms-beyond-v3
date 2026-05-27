"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

/**
 * Animation "portefeuille qui s'ouvre" quand l'utilisateur arrive sur la page Wallet.
 * Déclenchée une seule fois au mount.
 */
export function WalletPortfolioCinematicTransition({ children }: { children: React.ReactNode }) {
  const [active, setActive] = useState(false);

  useEffect(() => {
    setActive(true);
    const t = window.setTimeout(() => setActive(false), 1450);
    return () => window.clearTimeout(t);
  }, []);

  return (
    <>
      <AnimatePresence>
        {active ? (
          <motion.div
            key="wallet-portfolio"
            className="fixed inset-0 z-[300] flex min-h-dvh items-center justify-center bg-[#0D0D12]/70 backdrop-blur-[6px]"
            role="presentation"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
          >
            {/* couvercle portefeuille */}
            <motion.div
              className="relative h-[260px] w-[360px] max-w-[92vw]"
              initial={{ scale: 0.98, rotateX: 8, y: 18, opacity: 0 }}
              animate={{ scale: 1, rotateX: 0, y: 0, opacity: 1 }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              style={{ transformStyle: "preserve-3d" }}
            >
              <div
                className="absolute inset-0 rounded-3xl border border-white/10 bg-[#17171F]"
                style={{ boxShadow: "0 30px 90px rgba(0,0,0,0.55)" }}
              />

              {/* reflets */}
              <div
                className="absolute inset-x-0 top-[26px] h-[120px] rounded-3xl bg-gradient-to-b from-white/10 to-transparent"
                aria-hidden
              />

              {/* ouverture */}
              <motion.div
                className="absolute left-0 top-0 h-full w-full origin-left rounded-3xl bg-[#0D0D12]/30"
                initial={{ rotateY: -34, opacity: 0 }}
                animate={{ rotateY: 0, opacity: 1 }}
                transition={{ duration: 0.75, ease: [0.16, 1, 0.3, 1] }}
                style={{ transform: "translateZ(1px)" }}
              />

              {/* icône portefeuille stylisée */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="h-[82px] w-[120px] rounded-2xl border border-[#2563EB]/30 bg-[#2563EB]/10" />
              </div>

              {/* accent flash */}
              <motion.div
                className="absolute inset-0 rounded-3xl"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1.02 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                style={{
                  background:
                    "radial-gradient(ellipse at 50% 50%, rgba(37,99,235,0.35) 0%, transparent 55%)",
                }}
                aria-hidden
              />
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
      {children}
    </>
  );
}

