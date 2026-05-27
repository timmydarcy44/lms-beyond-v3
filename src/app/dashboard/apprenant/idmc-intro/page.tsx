"use client";

import Link from "next/link";
import { IDMC_QUESTIONS } from "@/lib/idmc/idmc-questions";

export default function IdmcIntroPage() {
  return (
    <div className="min-h-screen bg-white text-[#0a0a0a]">
      <div className="mx-auto flex min-h-screen w-full max-w-3xl flex-col justify-center px-6 py-16">
        <div className="flex flex-wrap items-center gap-2 text-[10px] font-medium uppercase tracking-[0.2em] text-[#FF3B30]">
          <span className="rounded-full border border-black/10 px-3 py-1">10 min</span>
          <span className="rounded-full border border-black/10 px-3 py-1">
            {IDMC_QUESTIONS.length} questions
          </span>
        </div>

        <h1 className="mt-6 text-3xl font-semibold tracking-tight sm:text-4xl">
          Votre cartographie IDMC
        </h1>
        <p className="mt-4 max-w-xl text-sm leading-relaxed text-black/60">
          Identifiez vos moteurs de motivation profonds et vos stratégies d&apos;apprentissage pour
          aligner votre parcours EDGE.
        </p>

        <div className="mt-10 flex flex-wrap items-center gap-4">
          <Link
            href="/dashboard/apprenant/idmc/test"
            className="rounded-full bg-[#FF3B30] px-8 py-3 text-sm font-semibold text-white transition hover:opacity-90"
          >
            Démarrer l&apos;analyse IDMC
          </Link>
          <Link
            href="/dashboard/apprenant/profil"
            className="rounded-full border border-black/15 px-6 py-3 text-sm font-medium text-black/70 hover:text-[#0a0a0a]"
          >
            Voir mon profil
          </Link>
        </div>

        <div className="mt-12">
          <Link
            href="/dashboard/apprenant"
            className="text-xs font-medium text-black/45 hover:text-[#0a0a0a]"
          >
            Retour à l&apos;accueil
          </Link>
        </div>
      </div>
    </div>
  );
}
