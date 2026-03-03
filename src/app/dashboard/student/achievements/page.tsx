"use client";

import Link from "next/link";
import { TalentDashboardShell } from "@/components/beyond-connect/talent-dashboard-shell";

export default function TalentCertificationPage() {
  return (
    <TalentDashboardShell>
      <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-semibold text-black">Certification Soft Skills Beyond AI</h1>
        <p className="mt-3 text-sm text-black/70">
          Cette certification est un module premium a 50€. Elle renforce votre credibilite et augmente votre matching.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <button className="rounded-full bg-black px-6 py-3 text-xs font-semibold uppercase tracking-[0.2em] text-white">
            Demarrer la certification
          </button>
          <Link
            href="/dashboard/talent"
            className="rounded-full border border-slate-200 px-6 py-3 text-xs font-semibold uppercase tracking-[0.2em] text-black"
          >
            Retour
          </Link>
        </div>
      </div>
    </TalentDashboardShell>
  );
}
