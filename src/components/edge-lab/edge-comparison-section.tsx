"use client";

import { motion } from "framer-motion";
import { EdgePremiumComparisonTable } from "@/components/edge-lab/premium/edge-premium-comparison-table";

export function EdgeComparisonSection() {
  return (
    <section id="comparaison" className="scroll-mt-20 border-t border-zinc-200 bg-white py-20 sm:py-28">
      <div className="mx-auto max-w-5xl px-5 sm:px-8">
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.45 }}
          className="text-center"
        >
          <p className="text-[11px] font-semibold uppercase tracking-[0.38em] text-zinc-400">Comparaison</p>
          <h2 className="mt-4 text-3xl font-semibold tracking-[-0.03em] text-zinc-950 sm:text-4xl">
            Formation classique vs EDGE
          </h2>
        </motion.div>
        <EdgePremiumComparisonTable />
      </div>
    </section>
  );
}
