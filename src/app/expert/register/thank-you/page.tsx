"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { CheckCircle2 } from "lucide-react";

export default function ExpertRegisterThankYouPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-[#05060a] text-white">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute inset-0 bg-[#05060a]" />
        <div className="absolute -bottom-64 -left-64 h-[760px] w-[760px] rounded-full bg-[radial-gradient(circle_at_center,rgba(168,85,247,0.28),rgba(99,102,241,0.12),rgba(2,6,23,0)_60%)] blur-3xl" />
        <div className="absolute -top-64 -right-64 h-[680px] w-[680px] rounded-full bg-[radial-gradient(circle_at_center,rgba(34,211,238,0.12),rgba(2,6,23,0)_62%)] blur-3xl" />
        <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(255,255,255,0.04),rgba(255,255,255,0))]" />
      </div>

      <header className="relative mx-auto flex max-w-5xl items-center justify-between px-6 py-8">
        <Link href="/" className="text-sm font-black uppercase tracking-[0.22em] text-white/80 hover:text-white">
          Beyond
        </Link>
        <div className="text-xs font-semibold text-white/60">Join the Network</div>
      </header>

      <main className="relative mx-auto flex min-h-[70vh] max-w-3xl items-center px-6 pb-20">
        <div className="w-full rounded-3xl border border-white/10 bg-white/5 p-10 text-center shadow-[0_18px_70px_rgba(0,0,0,0.40)] backdrop-blur-2xl">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl border border-emerald-400/20 bg-emerald-400/10">
            <CheckCircle2 className="h-9 w-9 text-emerald-300" aria-hidden />
          </div>
          <h1 className="mt-6 text-3xl font-extrabold tracking-tight text-white">Merci, votre profil est envoyé</h1>
          <p className="mt-4 text-sm text-white/70">
            Votre profil est en cours de validation par nos équipes.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <button
              type="button"
              onClick={() => router.push("/")}
              className="rounded-2xl border border-white/10 bg-white/5 px-6 py-3 text-xs font-black uppercase tracking-[0.18em] text-white/80 hover:bg-white/10"
            >
              Retour à l'accueil
            </button>
            <button
              type="button"
              onClick={() => router.push("/dashboard/entreprise")}
              className="rounded-2xl bg-white px-6 py-3 text-xs font-black uppercase tracking-[0.18em] text-black hover:bg-white/90"
            >
              Aller au Dashboard
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}

