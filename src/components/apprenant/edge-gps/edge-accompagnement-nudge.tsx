"use client";

import Link from "next/link";
import { MessageCircle } from "lucide-react";

export function EdgeAccompagnementNudge() {
  return (
    <aside className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5 sm:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/[0.05] text-white/50">
            <MessageCircle className="h-5 w-5" strokeWidth={1.5} />
          </span>
          <div>
            <p className="text-sm font-medium text-white">Besoin d&apos;être accompagné ?</p>
            <p className="mt-1 max-w-lg text-sm leading-relaxed text-white/50">
              Un conseiller EDGE peut vous aider à valider votre objectif, comprendre vos écarts et construire un
              parcours personnalisé.
            </p>
          </div>
        </div>
        <Link
          href="/dashboard/apprenant/coaching"
          className="shrink-0 rounded-lg border border-white/15 px-4 py-2.5 text-center text-sm font-medium text-white/80 transition hover:bg-white/[0.05] hover:text-white"
        >
          Demander un échange
        </Link>
      </div>
    </aside>
  );
}
