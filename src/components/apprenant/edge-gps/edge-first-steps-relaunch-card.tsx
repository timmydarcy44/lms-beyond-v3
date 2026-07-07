"use client";

import Link from "next/link";
import { Sparkles } from "lucide-react";

export function EdgeFirstStepsRelaunchCard() {
  return (
    <Link
      href="/dashboard/apprenant?premiers-pas=1"
      className="mb-8 flex items-start gap-4 rounded-2xl border border-[#3D7BFF]/25 bg-[#3D7BFF]/[0.06] p-5 transition hover:border-[#3D7BFF]/40 hover:bg-[#3D7BFF]/10"
    >
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#3D7BFF]/15 text-[#8BB4FF]">
        <Sparkles className="h-5 w-5" />
      </span>
      <div>
        <p className="text-sm font-semibold text-white">Premiers pas EDGE</p>
        <p className="mt-1 text-sm text-white/55">
          Relancez le parcours guidé pour confirmer votre objectif, comprendre vos écarts et demander un
          parcours personnalisé.
        </p>
      </div>
    </Link>
  );
}
