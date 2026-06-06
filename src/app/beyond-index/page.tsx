import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Beyond Index | Maturité compétences",
  description:
    "Évaluez en quelques minutes la capacité de votre organisation à identifier, développer et reconnaître les compétences.",
};

const demoMail = "mailto:contact@beyondcenter.fr?subject=Beyond%20Index%20%E2%80%94%20R%C3%A9sultats";

export default function BeyondIndexPage() {
  return (
    <div className="min-h-screen bg-[#030712] text-slate-100">
      <header className="border-b border-white/5 px-6 py-4">
        <div className="mx-auto flex max-w-3xl items-center justify-between">
          <Link href="/" className="text-sm font-semibold text-white">
            ← Beyond
          </Link>
          <span className="text-xs uppercase tracking-[0.25em] text-cyan-400/80">Beyond Index</span>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-6 py-16 md:py-24">
        <p className="text-xs font-semibold uppercase tracking-[0.32em] text-violet-400/90">
          Diagnostic gratuit
        </p>
        <h1 className="mt-4 text-4xl font-semibold tracking-tight text-white md:text-5xl">
          Évaluez votre maturité compétences.
        </h1>
        <p className="mt-6 text-lg leading-relaxed text-slate-400">
          Le Beyond Index mesure la capacité de votre organisation à cartographier les compétences,
          identifier les écarts, prioriser les parcours et reconnaître les acquis — sur les dimensions
          soft skills, hard skills, pilotage RH/pédagogique, Open Badges et usage de l&apos;IA.
        </p>

        <div className="mt-10 space-y-4 rounded-2xl border border-white/10 bg-white/[0.03] p-6">
          <p className="text-sm font-medium text-slate-200">Le test couvre notamment :</p>
          <ul className="list-inside list-disc space-y-2 text-sm text-slate-400">
            <li>Visibilité sur les compétences réelles (soft &amp; hard skills)</li>
            <li>Cartographie et identification des écarts</li>
            <li>Pertinence des parcours de développement</li>
            <li>Reconnaissance des acquis (Open Badges, portfolios)</li>
            <li>Pilotage par la donnée et l&apos;IA</li>
          </ul>
        </div>

        <p className="mt-8 text-sm text-slate-500">
          Version interactive en déploiement. Contactez-nous pour recevoir votre évaluation personnalisée
          dès maintenant.
        </p>

        <div className="mt-8 flex flex-wrap gap-3">
          <a
            href={demoMail}
            className="inline-flex rounded-full bg-gradient-to-r from-violet-500 to-cyan-400 px-7 py-3.5 text-sm font-semibold text-slate-950"
          >
            Lancer mon Beyond Index
          </a>
          <Link
            href="/"
            className="inline-flex rounded-full border border-white/15 px-7 py-3.5 text-sm font-semibold text-white hover:bg-white/5"
          >
            Retour à l&apos;accueil
          </Link>
        </div>
      </main>
    </div>
  );
}
