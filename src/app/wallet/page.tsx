"use client";

import Link from "next/link";
import { Share2 } from "lucide-react";

const BADGES = [
  {
    title: "IA & Automation",
    image: "https://images.unsplash.com/photo-1487058792275-0ad4aaf24ca7?auto=format&fit=crop&w=900&q=80",
  },
  {
    title: "Neuro-Négociation",
    image: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=900&q=80",
  },
  {
    title: "Marketing Sportif",
    image: "https://images.unsplash.com/photo-1517649763962-0c623066013b?auto=format&fit=crop&w=900&q=80",
  },
  {
    title: "Stratégie RSE",
    image: "https://images.unsplash.com/photo-1482192596544-9eb780fc7f66?auto=format&fit=crop&w=900&q=80",
  },
];

export default function WalletPage() {
  return (
    <main className="min-h-screen bg-black text-white">
      <section className="relative overflow-hidden px-6 pb-10 pt-20">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,59,48,0.22),transparent_50%)]" />
        <div className="relative mx-auto max-w-6xl space-y-4">
          <p className="text-xs uppercase tracking-[0.4em] text-white/50">Wallet</p>
          <h1 className="text-4xl font-semibold sm:text-5xl">Badges acquis</h1>
          <p className="max-w-2xl text-lg text-white/70">
            Chaque badge est vérifiable et partageable en un clic.
          </p>
        </div>
      </section>

      <section className="px-6 pb-24">
        <div className="mx-auto max-w-6xl">
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
            {BADGES.map((badge) => (
              <div
                key={badge.title}
                className="group relative overflow-hidden rounded-xl border border-white/10 bg-white/[0.04] p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_0_40px_rgba(255,59,48,0.35)]"
              >
                <div
                  className="absolute inset-0 bg-cover bg-center"
                  style={{ backgroundImage: `url(${badge.image})` }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent" />
                <div className="relative flex h-44 flex-col justify-end gap-3">
                  <p className="text-sm font-semibold text-white">{badge.title}</p>
                  <Link
                    href="https://www.linkedin.com/"
                    className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-2 text-[10px] uppercase tracking-[0.3em] text-white/80"
                  >
                    <Share2 className="h-3 w-3" />
                    Partager sur LinkedIn
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
