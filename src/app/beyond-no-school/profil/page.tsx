"use client";

import Link from "next/link";
import { Crown, Shield, Wallet } from "lucide-react";

import { BnsPrivateHeader } from "@/components/beyond-no-school/bns-private-header";

export default function BeyondNoSchoolProfilPage() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-[#0b0b10] pb-24 text-white">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_12%,rgba(255,88,61,0.18),transparent_50%),radial-gradient(circle_at_82%_20%,rgba(80,130,255,0.12),transparent_45%)]" />
      <div className="pointer-events-none absolute inset-0 opacity-[0.08] [background-image:linear-gradient(180deg,rgba(255,255,255,0.12)_1px,transparent_1px)] [background-size:2px_2px]" />

      <BnsPrivateHeader />

      <section className="mx-auto max-w-6xl space-y-8 px-6 pb-20 pt-12 sm:px-12 lg:px-24">
        <div className="space-y-4">
          <p className="text-xs uppercase tracking-[0.4em] text-white/50">Profil</p>
          <h1 className="text-pretty text-4xl font-semibold sm:text-5xl">Ton espace identité Beyond</h1>
          <p className="text-lg text-white/70">
            Centralise tes badges, ton historique de progression et tes prochains challenges.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          <div className="rounded-3xl border border-white/10 bg-white/[0.02] p-6">
            <div className="flex items-center gap-3 text-xs uppercase tracking-[0.35em] text-white/50">
              <Crown className="h-4 w-4" />
              Rang actuel
            </div>
            <p className="mt-4 text-2xl font-semibold text-white">Élite</p>
            <p className="mt-2 text-sm text-white/60">Accès prioritaire aux contenus premium.</p>
          </div>
          <div className="rounded-3xl border border-white/10 bg-white/[0.02] p-6">
            <div className="flex items-center gap-3 text-xs uppercase tracking-[0.35em] text-white/50">
              <Wallet className="h-4 w-4" />
              Wallet badges
            </div>
            <p className="mt-4 text-2xl font-semibold text-white">12 badges</p>
            <p className="mt-2 text-sm text-white/60">Synchronisés et vérifiables.</p>
            <Link
              href="/beyond-no-school/open-badges/my"
              className="mt-4 inline-flex text-xs uppercase tracking-[0.3em] text-white/70 hover:text-white"
            >
              Voir mon wallet
            </Link>
          </div>
          <div className="rounded-3xl border border-white/10 bg-white/[0.02] p-6">
            <div className="flex items-center gap-3 text-xs uppercase tracking-[0.35em] text-white/50">
              <Shield className="h-4 w-4" />
              Certification active
            </div>
            <p className="mt-4 text-2xl font-semibold text-white">IA & Automation</p>
            <p className="mt-2 text-sm text-white/60">Progression 90% · Dernière activité hier.</p>
            <Link
              href="/beyond-no-school/reprendre"
              className="mt-4 inline-flex text-xs uppercase tracking-[0.3em] text-white/70 hover:text-white"
            >
              Reprendre la session
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
