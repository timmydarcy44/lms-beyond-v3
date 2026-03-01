"use client";

import Link from "next/link";
import { ChevronRight, ShieldCheck } from "lucide-react";

import { BnsPrivateHeader } from "@/components/beyond-no-school/bns-private-header";

const ACQUIRED_BADGES = [
  {
    title: "IA & Automation",
    status: "Acquis",
    image: "https://images.unsplash.com/photo-1487058792275-0ad4aaf24ca7?auto=format&fit=crop&w=800&q=80",
  },
  {
    title: "Neuro-Négociation",
    status: "Acquis",
    image: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=800&q=80",
  },
];

export default function BeyondNoSchoolWalletPage() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-[#0b0b10] pb-24 text-white">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_12%,rgba(255,88,61,0.18),transparent_50%),radial-gradient(circle_at_82%_20%,rgba(80,130,255,0.12),transparent_45%)]" />
      <div className="pointer-events-none absolute inset-0 opacity-[0.08] [background-image:linear-gradient(180deg,rgba(255,255,255,0.12)_1px,transparent_1px)] [background-size:2px_2px]" />

      <BnsPrivateHeader />

      <section className="mx-auto max-w-6xl space-y-10 px-6 pb-20 pt-12 sm:px-12 lg:px-24">
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div className="space-y-3">
            <p className="text-xs uppercase tracking-[0.4em] text-white/50">Wallet</p>
            <h1 className="text-pretty text-4xl font-semibold sm:text-5xl">Tes Open Badges, en mode streaming.</h1>
            <p className="text-lg text-white/70">
              Suis tes badges actifs, relance ceux en cours et découvre les prochains à collectionner.
            </p>
          </div>
          <Link
            href="/beyond-no-school/open-badges"
            className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.35em] text-white/60 hover:text-white"
          >
            Voir tous les badges
            <ChevronRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="space-y-5">
          <div className="flex items-center gap-3">
            <ShieldCheck className="h-4 w-4 text-[#FF3B30]" />
            <h2 className="text-lg font-semibold text-white">Open badges acquis</h2>
          </div>
          <div className="grid gap-6 md:grid-cols-2">
            {ACQUIRED_BADGES.map((badge) => (
              <div
                key={badge.title}
                className="group relative overflow-hidden rounded-3xl border border-white/10 bg-white/[0.05] p-6 transition-transform duration-300 hover:-translate-y-1"
              >
                <div
                  className="absolute inset-0 bg-cover bg-center opacity-70 transition-transform duration-500 group-hover:scale-105"
                  style={{ backgroundImage: `url(${badge.image})` }}
                />
                <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/30 to-transparent" />
                <div className="relative space-y-3">
                  <span className="text-xs uppercase tracking-[0.35em] text-white/60">{badge.status}</span>
                  <p className="text-2xl font-semibold text-white">{badge.title}</p>
                  <Link
                    href="/beyond-no-school/open-badges/my"
                    className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-xs uppercase tracking-[0.3em] text-white/80"
                  >
                    Voir le badge
                    <ChevronRight className="h-3 w-3" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
