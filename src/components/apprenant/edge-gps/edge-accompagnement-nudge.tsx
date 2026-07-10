"use client";

import Link from "next/link";
import { MessageCircle } from "lucide-react";
import { EDGE_EXPERT_PARCOURS_CTA, getExpertParcoursHref } from "@/lib/particulier/coaching-config";

type Props = {
  highlighted?: boolean;
};

export function EdgeAccompagnementNudge({ highlighted }: Props) {
  return (
    <aside
      id="edge-accompagnement-nudge"
      className={`rounded-2xl border bg-white/[0.02] p-5 transition sm:p-6 ${
        highlighted
          ? "border-[#3D7BFF]/40 ring-2 ring-[#3D7BFF]/30 shadow-[0_0_0_1px_rgba(61,123,255,0.15)]"
          : "border-white/[0.06]"
      }`}
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/[0.05] text-white/50">
            <MessageCircle className="h-5 w-5" strokeWidth={1.5} />
          </span>
          <div>
            <p className="text-sm font-medium text-white">Besoin d&apos;être accompagné ?</p>
            <p className="mt-1 max-w-lg text-sm leading-relaxed text-white/50">
              Un expert EDGE peut vous aider à valider votre objectif, comprendre vos écarts et construire un
              plan d&apos;action personnalisé.
            </p>
          </div>
        </div>
        <Link
          href={getExpertParcoursHref()}
          className="shrink-0 rounded-lg border border-white/15 bg-white px-4 py-2.5 text-center text-sm font-medium text-[#0a0a0a] transition hover:bg-white/90"
        >
          {EDGE_EXPERT_PARCOURS_CTA}
        </Link>
      </div>
    </aside>
  );
}
