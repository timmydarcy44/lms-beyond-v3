import type { Metadata } from "next";
import Link from "next/link";
import { EcolePricingPanel } from "@/components/beyond-connect/ecole-pricing-panel";
import { BeyondMarketSegments } from "@/components/marketing/beyond-market-segments";

const demoMail = "mailto:contact@beyondcenter.fr?subject=D%C3%A9mo%20Beyond";

export const metadata: Metadata = {
  title: "Prix | Beyond",
  description:
    "Tarifs Beyond for Education : plateforme, Beyond Care, paiement annuel. Estimez votre budget et découvrez nos segments Éducation, Entreprise et Club.",
};

export default function PrixPage() {
  return (
    <div className="min-h-screen bg-[#030712] text-slate-100 antialiased">
      <header className="sticky top-0 z-50 border-b border-white/5 bg-[#030712]/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-5 py-4 md:px-8">
          <Link href="/" className="text-lg font-semibold tracking-tight text-white hover:text-cyan-200">
            Beyond
          </Link>
          <nav className="flex flex-wrap items-center justify-end gap-x-5 gap-y-2 text-sm text-slate-300">
            <span className="font-medium text-white">Prix</span>
            <Link href="/#education" className="hover:text-white">
              Éducation
            </Link>
            <Link href="/#entreprise" className="hover:text-white">
              Entreprise
            </Link>
            <Link href="/#club" className="hidden hover:text-white sm:inline">
              Club
            </Link>
            <Link href="/login" className="font-medium hover:text-white">
              Se connecter
            </Link>
            <Link
              href="/register"
              className="rounded-full bg-white px-4 py-2 text-xs font-semibold text-slate-900 hover:bg-cyan-100"
            >
              S&apos;inscrire
            </Link>
          </nav>
        </div>
      </header>

      <section className="border-b border-white/5 bg-[#050a14] px-5 pb-12 pt-10 md:px-8 md:pb-16 md:pt-12">
        <div className="mx-auto max-w-6xl">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-cyan-400/90">Tarifs</p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-white md:text-4xl">
            Estimez votre investissement
          </h1>
          <p className="mt-3 max-w-2xl text-sm text-slate-400 md:text-base">
            Configurez volumes et options ci-dessous. Les segments Beyond (Éducation, Entreprise, Club) sont détaillés
            juste après.
          </p>
          <div className="mt-8">
            <EcolePricingPanel variant="landing" />
          </div>
        </div>
      </section>

      <BeyondMarketSegments />

      <section className="mx-auto max-w-6xl px-5 py-14 md:px-8 md:py-20">
        <div className="rounded-3xl border border-cyan-500/30 bg-gradient-to-r from-cyan-500/10 to-blue-600/10 p-8 text-center md:p-10">
          <h2 className="text-xl font-semibold text-white md:text-2xl">Une question sur les tarifs ?</h2>
          <p className="mx-auto mt-3 max-w-xl text-sm text-slate-400 md:text-base">
            Retour à l&apos;accueil ou demande de démo : nous vous répondons rapidement.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link
              href="/"
              className="inline-flex rounded-full border border-white/15 bg-white/5 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
            >
              Accueil
            </Link>
            <a
              href={demoMail}
              className="inline-flex rounded-full bg-cyan-400 px-6 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300"
            >
              Demander une démo
            </a>
          </div>
        </div>
      </section>

      <footer className="border-t border-white/10 py-10 text-center text-sm text-slate-500">
        <p className="font-semibold text-slate-400">Beyond</p>
        <div className="mt-4 flex flex-wrap justify-center gap-6">
          <Link href="/#produit" className="hover:text-slate-300">
            Produits
          </Link>
          <Link href="/prix" className="text-slate-300 hover:text-white">
            Prix
          </Link>
          <a href={demoMail} className="hover:text-slate-300">
            Contact
          </a>
        </div>
      </footer>
    </div>
  );
}
