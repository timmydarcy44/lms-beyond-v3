"use client";

import Link from "next/link";
import { Lock } from "lucide-react";

export default function SoftSkillsCheckoutPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="mx-auto flex max-w-3xl flex-col gap-6 px-6 py-12">
        <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/60">
          <Lock className="h-4 w-4" />
          Accès Soft Skills verrouillé
        </div>
        <h1 className="text-3xl font-semibold">Débloquez votre analyse Soft Skills</h1>
        <p className="text-sm text-white/70">
          Accédez au radar complet, aux bulles et au détail de vos forces comportementales pour
          renforcer votre employabilité.
        </p>
        <div className="rounded-2xl border border-white/10 bg-white/5 p-5 text-sm text-white/70">
          <ul className="space-y-2">
            <li>✔ Radar complet des Soft Skills</li>
            <li>✔ Visualisation en bulles et comparatifs</li>
            <li>✔ Recommandations actionnables</li>
          </ul>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Link
            href="/dashboard/apprenant/soft-skills-test"
            className="inline-flex rounded-full bg-[#F59E0B] px-6 py-3 text-sm font-semibold text-black"
          >
            Débloquer mon analyse complète - 29,90€
          </Link>
          <Link
            href="/dashboard/apprenant/creating"
            className="inline-flex rounded-full border border-white/20 px-5 py-3 text-sm font-semibold text-white"
          >
            Aller au dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
