"use client";

import Link from "next/link";
import { CheckCircle2, Circle } from "lucide-react";
import type { ProfilEdgeMaturity } from "@/lib/particulier/profil-edge-maturity";
import { CONNECT_PROGRESS_FILL, CONNECT_PROGRESS_TRACK } from "@/lib/apprenant/connect-nav";

type Props = {
  maturity: ProfilEdgeMaturity;
};

export function ProfilEdgeMaturityGauge({ maturity }: Props) {
  return (
    <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-white/40">Profil EDGE</p>
          <p className="mt-1 text-3xl font-bold text-white">{maturity.totalPercent} %</p>
        </div>
        <p className="text-xs text-white/45">Maturité globale de votre profil EDGE</p>
      </div>

      <div className={`mt-4 ${CONNECT_PROGRESS_TRACK}`}>
        <div className={CONNECT_PROGRESS_FILL} style={{ width: `${maturity.totalPercent}%` }} />
      </div>

      <ul className="mt-5 space-y-2">
        {maturity.blocks.map((block) => (
          <li key={block.id}>
            <Link
              href={block.href}
              className="flex items-center justify-between gap-3 rounded-xl border border-white/8 bg-white/[0.02] px-3 py-2.5 text-sm transition hover:border-[#3D7BFF]/30 hover:bg-white/[0.05]"
            >
              <span className="flex items-center gap-2 text-white/80">
                {block.complete ? (
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
                ) : (
                  <Circle className="h-4 w-4 shrink-0 text-white/30" />
                )}
                {block.complete ? "✔" : "○"} {block.label}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
