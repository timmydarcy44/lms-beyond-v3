import Image from "next/image";
import Link from "next/link";
import { BeyondMarketSegments } from "@/components/marketing/beyond-market-segments";

const demoMail = "mailto:contact@beyondcenter.fr?subject=D%C3%A9mo%20Beyond";

function Section({
  id,
  className,
  children,
}: {
  id?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className={`mx-auto w-full max-w-6xl px-5 py-16 md:px-8 md:py-24 ${className ?? ""}`}>
      {children}
    </section>
  );
}

export function BeyondSaasLanding() {
  return (
    <div className="min-h-screen bg-[#030712] text-slate-100 antialiased">
      <header className="sticky top-0 z-50 border-b border-white/5 bg-[#030712]/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-5 py-4 md:px-8">
          <span className="text-lg font-semibold tracking-tight">Beyond</span>
          <nav className="flex flex-wrap items-center justify-end gap-x-5 gap-y-2 text-sm text-slate-300">
            <a href="#education" className="hover:text-white">
              Éducation
            </a>
            <a href="#entreprise" className="hover:text-white">
              Entreprise
            </a>
            <a href="#produit" className="hidden hover:text-white sm:inline">
              Produit
            </a>
            <a href="#impact" className="hidden hover:text-white sm:inline">
              Impact
            </a>
            <Link href="/prix" className="hover:text-white">
              Prix
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

      {/* HERO */}
      <Section className="pt-12 md:pt-20">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-cyan-400/90">Beyond</p>
            <h1 className="mt-4 text-4xl font-semibold leading-tight tracking-tight text-white md:text-5xl">
              Pilotez vos décisions. Pas votre intuition.
            </h1>
            <p className="mt-6 max-w-xl text-lg text-slate-400">
              Une plateforme pour analyser vos profils, prioriser les situations et piloter les parcours grâce à la
              data.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <a
                href={demoMail}
                className="inline-flex items-center justify-center rounded-full bg-cyan-400 px-6 py-3 text-sm font-semibold text-slate-950 shadow-[0_0_24px_rgba(34,211,238,0.35)] transition hover:bg-cyan-300"
              >
                Demander une démo
              </a>
              <Link
                href="/login"
                className="inline-flex items-center justify-center rounded-full border border-white/15 bg-white/5 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
              >
                Voir la plateforme
              </Link>
            </div>
          </div>
          <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-slate-900 to-slate-950 shadow-[0_40px_120px_-40px_rgba(34,211,238,0.35)]">
            <div className="absolute inset-0 bg-gradient-to-t from-[#030712]/80 to-transparent" />
            <Image
              src="/marketing/apprenant-cockpit.png"
              alt="Cockpit apprenant Beyond — tableau de bord"
              width={1200}
              height={900}
              className="h-auto w-full object-cover object-top"
              priority
            />
            <p className="absolute bottom-4 left-4 right-4 text-center text-xs text-slate-400">
              Cockpit apprenant — la donnée utile, tout de suite.
            </p>
          </div>
        </div>
      </Section>

      {/* PROMESSE */}
      <Section className="border-y border-white/5 bg-white/[0.02]">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-cyan-400/80">Promesse</p>
        <h2 className="mt-3 max-w-3xl text-3xl font-semibold text-white md:text-4xl">La data au service des décisions humaines.</h2>
        <p className="mt-6 max-w-2xl text-lg text-slate-400">
          Beyond transforme vos données en décisions concrètes pour accompagner, structurer et faire progresser.
        </p>
      </Section>

      {/* PROBLÈME */}
      <Section>
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-amber-400/90">Aujourd&apos;hui</p>
        <h2 className="mt-3 text-3xl font-semibold text-white md:text-4xl">Piloter reste flou.</h2>
        <ul className="mt-8 grid gap-4 md:grid-cols-2">
          {[
            "Trop d'informations dispersées",
            "Impossible de prioriser efficacement",
            "Suivi des situations complexe",
            "Décisions basées sur l’intuition",
          ].map((t) => (
            <li
              key={t}
              className="rounded-2xl border border-white/10 bg-white/[0.03] px-5 py-4 text-slate-200"
            >
              {t}
            </li>
          ))}
        </ul>
      </Section>

      {/* SOLUTION */}
      <Section className="border-y border-white/5 bg-gradient-to-b from-cyan-500/5 to-transparent">
        <h2 className="text-3xl font-semibold text-white md:text-4xl">Une plateforme pour tout piloter.</h2>
        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {[
            { t: "Centraliser", d: "Toutes les données au même endroit" },
            { t: "Prioriser", d: "Identifier les profils à enjeux" },
            { t: "Décider", d: "Agir avec des indicateurs clairs" },
          ].map((b) => (
            <div key={b.t} className="rounded-2xl border border-cyan-500/20 bg-[#050b18] p-6">
              <h3 className="text-lg font-semibold text-cyan-200">{b.t}</h3>
              <p className="mt-2 text-sm text-slate-400">{b.d}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* PRODUIT */}
      <Section id="produit">
        <h2 className="text-3xl font-semibold text-white md:text-4xl">Une plateforme. Plusieurs modules.</h2>
        <div className="mt-10 grid gap-8 lg:grid-cols-2">
          <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-8">
            <h3 className="text-xl font-semibold text-white">Beyond Connect</h3>
            <p className="mt-2 text-slate-400">
              Pilotage global des individus, des classes et des parcours.
            </p>
            <div className="mt-6 aspect-video rounded-2xl border border-dashed border-white/15 bg-gradient-to-br from-slate-800 to-slate-900 p-6 text-sm text-slate-500">
              Capture produit — classes, apprenants, parcours (à remplacer par votre screenshot).
            </div>
          </div>
          <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-8">
            <h3 className="text-xl font-semibold text-white">Beyond Care</h3>
            <p className="mt-2 text-slate-400">
              Pilotage des situations à enjeux (handicap, décrochage, accompagnement).
            </p>
            <div className="mt-6 aspect-video rounded-2xl border border-dashed border-white/15 bg-gradient-to-br from-indigo-900/60 to-slate-900 p-6 text-sm text-slate-500">
              Capture produit — suivi &amp; alertes (à remplacer par votre screenshot).
            </div>
          </div>
        </div>
      </Section>

      {/* EXPÉRIENCE */}
      <Section>
        <h2 className="text-3xl font-semibold text-white md:text-4xl">Un cockpit clair pour chaque profil</h2>
        <p className="mt-4 max-w-2xl text-slate-400">
          Profil, radar, plan d&apos;action, suivi : une vision simple, structurée et directement exploitable.
        </p>
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {["Profil", "Radar", "Plan d'action", "Suivi"].map((lab) => (
            <div key={lab} className="rounded-2xl border border-white/10 bg-white/[0.02] px-4 py-6 text-center text-sm font-medium text-slate-200">
              {lab}
            </div>
          ))}
        </div>
      </Section>

      <BeyondMarketSegments />

      {/* IMPACT */}
      <Section id="impact">
        <h2 className="text-3xl font-semibold text-white md:text-4xl">Ce que Beyond change concrètement</h2>
        <ul className="mt-8 grid gap-3 sm:grid-cols-2 md:grid-cols-4">
          {["Visibilité", "Temps perdu", "Meilleures décisions", "Accompagnement structuré"].map((x) => (
            <li key={x} className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-center text-sm text-slate-200">
              {x}
            </li>
          ))}
        </ul>
      </Section>

      {/* PREUVE */}
      <Section>
        <p className="text-sm font-medium text-slate-400">Utilisé par des organismes de formation et partenaires comme EDGE.</p>
      </Section>

      {/* CTA */}
      <Section className="pb-24">
        <div className="rounded-3xl border border-cyan-500/30 bg-gradient-to-r from-cyan-500/10 to-blue-600/10 p-10 text-center">
          <h2 className="text-2xl font-semibold text-white md:text-3xl">Prêt à piloter autrement ?</h2>
          <p className="mx-auto mt-4 max-w-xl text-slate-400">
            Découvrez comment Beyond peut transformer votre organisation.
          </p>
          <a
            href={demoMail}
            className="mt-8 inline-flex rounded-full bg-cyan-400 px-8 py-3 text-sm font-semibold text-slate-950"
          >
            Demander une démo
          </a>
        </div>
      </Section>

      <footer className="border-t border-white/10 py-10 text-center text-sm text-slate-500">
        <p className="font-semibold text-slate-400">Beyond</p>
        <div className="mt-4 flex flex-wrap justify-center gap-6">
          <a href="#produit" className="hover:text-slate-300">
            Produits
          </a>
          <Link href="/prix" className="hover:text-slate-300">
            Prix
          </Link>
          <a href={demoMail} className="hover:text-slate-300">
            Contact
          </a>
          <a href={demoMail} className="hover:text-slate-300">
            Démo
          </a>
        </div>
      </footer>
    </div>
  );
}
