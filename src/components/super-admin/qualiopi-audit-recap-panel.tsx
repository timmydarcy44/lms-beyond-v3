"use client";

import Link from "next/link";
import { QUALIOPI_AUDIT_PROOF_RECAP } from "@/lib/qualiopi/audit-proof-recap";
import {
  QUALIOPI_CARD,
  QUALIOPI_CARD_INNER,
  QUALIOPI_MUTED,
} from "@/components/super-admin/qualiopi/qualiopi-audit-styles";
import { cn } from "@/lib/utils";

/** Livrable final Lots 1–7 — preuves clés à montrer à l’auditeur. */
export function QualiopiAuditRecapPanel({ className }: { className?: string }) {
  return (
    <section className={cn(QUALIOPI_CARD, "p-5 sm:p-6", className)}>
      <h2 className="text-lg font-semibold text-white">Récap auditeur — preuves clés</h2>
      <p className={cn("mt-1 max-w-2xl text-sm", QUALIOPI_MUTED)}>
        Indicateurs 1, 2, 12, 19, 27 et 32 — où trouver la preuve et comment la montrer en moins
        d&apos;une minute.
      </p>
      <ul className="mt-5 space-y-3">
        {QUALIOPI_AUDIT_PROOF_RECAP.map((item) => (
          <li key={item.indicatorId} className={cn(QUALIOPI_CARD_INNER, "p-4")}>
            <div className="flex flex-wrap items-start justify-between gap-2">
              <p className="font-medium text-white">
                Ind. {item.indicatorId} — {item.title}
              </p>
              <Link
                href={item.href}
                className="inline-flex h-7 items-center rounded-md border border-[#3D7BFF]/30 bg-[#3D7BFF]/10 px-2 text-[11px] text-[#9EC0FF] hover:bg-[#3D7BFF]/20"
              >
                Ouvrir
              </Link>
            </div>
            <p className={cn("mt-2 text-xs", QUALIOPI_MUTED)}>
              <span className="font-semibold text-white/70">Où — </span>
              {item.where}
            </p>
            <p className={cn("mt-1 text-xs", QUALIOPI_MUTED)}>
              <span className="font-semibold text-white/70">Comment — </span>
              {item.how}
            </p>
          </li>
        ))}
      </ul>
    </section>
  );
}
