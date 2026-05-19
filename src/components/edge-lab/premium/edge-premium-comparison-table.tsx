"use client";



import { motion } from "framer-motion";
import { CheckCircle2, XCircle } from "lucide-react";



const rows = [

  { classic: "Cours théoriques", edge: "Mise en pratique directe" },

  { classic: "Validation du temps", edge: "Validation des compétences" },

  { classic: "Peu applicable", edge: "100% terrain" },

  { classic: "Diplôme sans preuve", edge: "Badges + livrables" },

] as const;



export function EdgePremiumComparisonTable() {

  return (

    <motion.div

      initial={{ opacity: 0, y: 22 }}

      whileInView={{ opacity: 1, y: 0 }}

      viewport={{ once: true, margin: "-50px" }}

      transition={{ duration: 0.55 }}

      className="mt-14 overflow-hidden rounded-3xl border border-zinc-200 bg-white shadow-[0_28px_90px_-55px_rgba(0,0,0,0.22)]"

    >
      <div className="grid gap-px bg-zinc-200 lg:grid-cols-2">
        <div className="bg-white p-6 sm:p-8">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-[10px] font-semibold uppercase tracking-[0.28em] text-zinc-400">
                Formation classique
              </div>
              <div className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-zinc-950">Beaucoup de théorie.</div>
            </div>
            <span className="grid h-12 w-12 place-items-center rounded-2xl border border-zinc-200 bg-zinc-50 text-zinc-500">
              <XCircle className="h-6 w-6" strokeWidth={1.8} aria-hidden />
            </span>
          </div>

          <ul className="mt-6 space-y-3">
            {rows.map((row) => (
              <li
                key={row.classic}
                className="flex items-start gap-3 rounded-2xl border border-zinc-200 bg-zinc-50/70 px-4 py-3"
              >
                <XCircle className="mt-0.5 h-5 w-5 text-zinc-400" strokeWidth={1.8} aria-hidden />
                <span className="text-sm font-medium text-zinc-700">{row.classic}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="bg-white p-6 sm:p-8">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-[10px] font-semibold uppercase tracking-[0.28em] text-emerald-700/80">EDGE</div>
              <div className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-zinc-950">De la preuve, tout de suite.</div>
            </div>
            <span className="grid h-12 w-12 place-items-center rounded-2xl border border-emerald-200 bg-emerald-50 text-emerald-700">
              <CheckCircle2 className="h-6 w-6" strokeWidth={1.8} aria-hidden />
            </span>
          </div>

          <ul className="mt-6 space-y-3">
            {rows.map((row) => (
              <li
                key={row.edge}
                className="flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50/60 px-4 py-3"
              >
                <CheckCircle2 className="mt-0.5 h-5 w-5 text-emerald-700" strokeWidth={1.8} aria-hidden />
                <span className="text-sm font-semibold text-zinc-900">{row.edge}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

    </motion.div>

  );

}

