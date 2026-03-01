"use client";

import Link from "next/link";
import { BadgeCheck, User } from "lucide-react";

export default function ProfilPage() {
  return (
    <main className="min-h-screen bg-black text-white">
      <section className="relative overflow-hidden px-6 pb-10 pt-20">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_22%_20%,rgba(255,59,48,0.2),transparent_55%)]" />
        <div className="relative mx-auto max-w-6xl space-y-4">
          <p className="text-xs uppercase tracking-[0.4em] text-white/50">Profil</p>
          <h1 className="text-4xl font-semibold sm:text-5xl">Identité Beyond</h1>
          <p className="max-w-2xl text-lg text-white/70">
            Ton profil centralise tes preuves et donne accès à la synchronisation Beyond Connect.
          </p>
        </div>
      </section>

      <section className="px-6 pb-24">
        <div className="mx-auto max-w-6xl grid gap-6 md:grid-cols-3">
          <div className="rounded-xl border border-white/10 bg-white/[0.04] p-6">
            <div className="flex items-center gap-3 text-xs uppercase tracking-[0.35em] text-white/50">
              <User className="h-4 w-4" />
              Profil public
            </div>
            <p className="mt-4 text-2xl font-semibold text-white">Activé</p>
            <p className="mt-2 text-sm text-white/60">Visible sur Beyond Connect.</p>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/[0.04] p-6">
            <div className="flex items-center gap-3 text-xs uppercase tracking-[0.35em] text-white/50">
              <BadgeCheck className="h-4 w-4" />
              Badges obtenus
            </div>
            <p className="mt-4 text-2xl font-semibold text-white">12 badges</p>
            <p className="mt-2 text-sm text-white/60">Tous vérifiables.</p>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/[0.04] p-6">
            <div className="flex items-center gap-3 text-xs uppercase tracking-[0.35em] text-white/50">
              <BadgeCheck className="h-4 w-4" />
              Synchronisation
            </div>
            <p className="mt-4 text-2xl font-semibold text-white">Prête</p>
            <p className="mt-2 text-sm text-white/60">Partage LinkedIn en un clic.</p>
            <Link
              href="/beyond-connect"
              className="mt-4 inline-flex text-xs uppercase tracking-[0.3em] text-white/70 hover:text-white"
            >
              Activer Beyond Connect
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
