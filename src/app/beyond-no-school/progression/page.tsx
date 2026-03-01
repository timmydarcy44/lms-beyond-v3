"use client";

import Link from "next/link";
import { ChevronRight, Clock, Gauge, TrendingUp } from "lucide-react";

import { BnsPrivateHeader } from "@/components/beyond-no-school/bns-private-header";

const PROGRESS_ITEMS = [
  {
    title: "IA & Automation",
    status: "En cours",
    progress: 90,
  },
  {
    title: "Immobilier : Le Closing",
    status: "En cours",
    progress: 58,
  },
  {
    title: "Storytelling d'Impact",
    status: "En cours",
    progress: 34,
  },
];

export default function BeyondNoSchoolProgressionPage() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-[#0b0b10] pb-24 text-white">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_12%,rgba(255,88,61,0.18),transparent_50%),radial-gradient(circle_at_82%_20%,rgba(80,130,255,0.12),transparent_45%)]" />
      <div className="pointer-events-none absolute inset-0 opacity-[0.08] [background-image:linear-gradient(180deg,rgba(255,255,255,0.12)_1px,transparent_1px)] [background-size:2px_2px]" />

      <BnsPrivateHeader />

      <section className="mx-auto max-w-6xl space-y-10 px-6 pb-20 pt-12 sm:px-12 lg:px-24">
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div className="space-y-3">
            <p className="text-xs uppercase tracking-[0.4em] text-white/50">Progression</p>
            <h1 className="text-pretty text-4xl font-semibold sm:text-5xl">Ta cadence, tes preuves.</h1>
            <p className="text-lg text-white/70">
              Visualise l’avancement de tes certifications et garde le cap.
            </p>
          </div>
          <Link
            href="/beyond-no-school/reprendre"
            className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.35em] text-white/60 hover:text-white"
          >
            Reprendre la session
            <ChevronRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          <div className="rounded-3xl border border-white/10 bg-white/[0.02] p-6">
            <div className="flex items-center gap-3 text-xs uppercase tracking-[0.35em] text-white/50">
              <Gauge className="h-4 w-4" />
              Cadence
            </div>
            <p className="mt-4 text-2xl font-semibold text-white">2 badges / mois</p>
            <p className="mt-2 text-sm text-white/60">Objectif atteint 3 semaines de suite.</p>
          </div>
          <div className="rounded-3xl border border-white/10 bg-white/[0.02] p-6">
            <div className="flex items-center gap-3 text-xs uppercase tracking-[0.35em] text-white/50">
              <Clock className="h-4 w-4" />
              Temps investi
            </div>
            <p className="mt-4 text-2xl font-semibold text-white">6h 40</p>
            <p className="mt-2 text-sm text-white/60">Cette semaine, +18% vs précédent.</p>
          </div>
          <div className="rounded-3xl border border-white/10 bg-white/[0.02] p-6">
            <div className="flex items-center gap-3 text-xs uppercase tracking-[0.35em] text-white/50">
              <TrendingUp className="h-4 w-4" />
              Momentum
            </div>
            <p className="mt-4 text-2xl font-semibold text-white">Très élevé</p>
            <p className="mt-2 text-sm text-white/60">Bonus d’accès premium ce week-end.</p>
          </div>
        </div>

        <div className="space-y-5">
          <h2 className="text-lg font-semibold text-white">Badges en cours</h2>
          <div className="grid gap-4 md:grid-cols-2">
            {PROGRESS_ITEMS.map((item) => (
              <div
                key={item.title}
                className="rounded-3xl border border-white/10 bg-white/[0.04] p-6"
              >
                <div className="flex items-center justify-between text-xs uppercase tracking-[0.3em] text-white/60">
                  <span>{item.status}</span>
                  <span>{item.progress}%</span>
                </div>
                <p className="mt-3 text-xl font-semibold text-white">{item.title}</p>
                <div className="mt-4 h-[3px] w-full rounded-full bg-white/20">
                  <div
                    className="h-[3px] rounded-full bg-[#FF3B30]"
                    style={{ width: `${item.progress}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
