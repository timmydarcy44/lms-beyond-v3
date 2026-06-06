import Image from "next/image";
import Link from "next/link";
import {
  Award,
  BarChart3,
  Brain,
  Building2,
  GraduationCap,
  Layers,
  LineChart,
  Network,
  Route,
  Shield,
  Sparkles,
  Target,
} from "lucide-react";
import { BeyondCenterHeaderNav } from "@/components/marketing/beyond-center-header-nav";

const demoMail = "mailto:contact@beyondcenter.fr?subject=D%C3%A9mo%20Beyond";
const advisoryMail = "mailto:contact@beyondcenter.fr?subject=Beyond%20Advisory%20%E2%80%94%20Parler%20%C3%A0%20un%20expert";

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
    <section
      id={id}
      className={`mx-auto w-full max-w-6xl scroll-mt-24 px-5 py-16 md:px-8 md:py-24 ${className ?? ""}`}
    >
      {children}
    </section>
  );
}

function Kicker({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs font-semibold uppercase tracking-[0.32em] text-cyan-400/90">{children}</p>
  );
}

function Card({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-2xl border border-white/10 bg-white/[0.03] p-5 md:p-6 ${className ?? ""}`}
    >
      {children}
    </div>
  );
}

export function BeyondSaasLanding() {
  return (
    <div className="min-h-screen bg-[#030712] text-slate-100 antialiased selection:bg-violet-500/30 selection:text-white">
      <BeyondCenterHeaderNav />

      {/* 1. Hero */}
      <Section className="relative overflow-hidden pt-12 md:pt-20">
        <div className="pointer-events-none absolute -left-32 top-0 h-72 w-72 rounded-full bg-violet-600/20 blur-[100px]" />
        <div className="pointer-events-none absolute -right-24 bottom-0 h-64 w-64 rounded-full bg-cyan-400/10 blur-[90px]" />
        <div className="relative grid items-center gap-12 lg:grid-cols-2">
          <div>
            <Kicker>Beyond · Intelligence des compétences</Kicker>
            <h1 className="mt-4 text-[clamp(2.25rem,5vw,3.5rem)] font-semibold leading-[1.05] tracking-tight text-white">
              Pilotez les compétences.
              <span className="mt-1 block bg-gradient-to-r from-white via-cyan-100 to-violet-200 bg-clip-text text-transparent">
                Pas les intuitions.
              </span>
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-slate-400">
              Beyond aide les entreprises, CFA et écoles à cartographier les compétences, identifier les
              écarts et construire les bons parcours de progression grâce à la donnée, l&apos;IA et les
              Open Badges.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <a
                href={demoMail}
                className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-violet-500 to-cyan-400 px-7 py-3.5 text-sm font-semibold text-slate-950 shadow-[0_0_32px_-8px_rgba(139,92,246,0.55)] transition hover:shadow-[0_0_40px_-6px_rgba(34,211,238,0.45)]"
              >
                Demander une démo
              </a>
              <Link
                href="/beyond-index"
                className="inline-flex items-center justify-center rounded-full border border-white/15 bg-white/5 px-7 py-3.5 text-sm font-semibold text-white transition hover:bg-white/10"
              >
                Faire le Beyond Index
              </Link>
            </div>
          </div>
          <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-slate-900 to-slate-950 shadow-[0_40px_120px_-40px_rgba(34,211,238,0.35)]">
            <div className="absolute inset-0 bg-gradient-to-t from-[#030712]/80 to-transparent" />
            <Image
              src="/marketing/apprenant-cockpit.png"
              alt="Cartographie des compétences — cockpit Beyond"
              width={1200}
              height={900}
              className="h-auto w-full object-cover object-top"
              priority
            />
            <p className="absolute bottom-4 left-4 right-4 text-center text-xs text-slate-400">
              Compétences, profils et parcours — une vision claire pour décider.
            </p>
          </div>
        </div>
      </Section>

      {/* 2. Promesse */}
      <Section className="border-y border-white/5 bg-white/[0.02]">
        <Kicker>Promesse</Kicker>
        <h2 className="mt-3 max-w-3xl text-3xl font-semibold text-white md:text-4xl">
          Les compétences au service des décisions humaines.
        </h2>
        <p className="mt-6 max-w-2xl text-lg leading-relaxed text-slate-400">
          Beyond transforme les données de vos apprenants, collaborateurs et équipes en décisions concrètes
          pour accompagner, former, prioriser et faire progresser.
        </p>
      </Section>

      {/* 3. Problème */}
      <Section id="probleme">
        <Kicker>Constat</Kicker>
        <h2 className="mt-3 text-3xl font-semibold text-white md:text-4xl">
          Aujourd&apos;hui, piloter les compétences reste flou.
        </h2>
        <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[
            "Compétences dispersées",
            "Parcours peu reliés aux besoins réels",
            "Difficulté à mesurer les soft skills",
            "Décisions basées sur l'intuition",
            "Peu de visibilité sur les écarts de compétences",
            "Reconnaissance insuffisante des acquis",
          ].map((t) => (
            <li key={t}>
              <Card className="text-sm leading-relaxed text-slate-200">{t}</Card>
            </li>
          ))}
        </ul>
      </Section>

      {/* 4. Solution */}
      <Section className="border-y border-white/5 bg-gradient-to-b from-violet-500/5 to-transparent">
        <Kicker>Solution</Kicker>
        <h2 className="mt-3 max-w-3xl text-3xl font-semibold text-white md:text-4xl">
          Une plateforme pour mesurer, développer et reconnaître les compétences.
        </h2>
        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {[
            {
              icon: Target,
              t: "Mesurer",
              d: "Cartographiez les soft skills, hard skills, profils cognitifs et niveaux de maîtrise.",
            },
            {
              icon: Route,
              t: "Développer",
              d: "Construisez des parcours personnalisés selon les besoins réels de vos publics.",
            },
            {
              icon: Award,
              t: "Reconnaître",
              d: "Valorisez les compétences acquises grâce aux Open Badges et portfolios de compétences.",
            },
          ].map((b) => (
            <Card key={b.t} className="border-cyan-500/15 bg-[#050b18]">
              <b.icon className="h-5 w-5 text-cyan-300" strokeWidth={1.6} />
              <h3 className="mt-4 text-lg font-semibold text-cyan-100">{b.t}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-400">{b.d}</p>
            </Card>
          ))}
        </div>
      </Section>

      {/* 5. Modules */}
      <Section id="modules">
        <Kicker>Plateforme</Kicker>
        <h2 className="mt-3 text-3xl font-semibold text-white md:text-4xl">
          Une plateforme. Plusieurs usages.
        </h2>
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[
            {
              icon: Layers,
              name: "Beyond Skills",
              d: "Cartographie des compétences",
            },
            {
              icon: Shield,
              name: "Beyond Care",
              d: "Suivi des situations sensibles, décrochage, handicap, accompagnement",
            },
            {
              icon: Award,
              name: "Beyond Badges",
              d: "Création et attribution d'Open Badges",
            },
            {
              icon: GraduationCap,
              name: "Beyond Academy",
              d: "Construction de parcours internes",
            },
            {
              icon: BarChart3,
              name: "Beyond Analytics",
              d: "Pilotage et tableaux de bord",
            },
            {
              icon: Sparkles,
              name: "Beyond AI",
              d: "Recommandations et aide à la décision",
            },
          ].map((m) => (
            <Card key={m.name} className="transition hover:border-white/20 hover:bg-white/[0.05]">
              <m.icon className="h-5 w-5 text-violet-300" strokeWidth={1.6} />
              <h3 className="mt-3 text-base font-semibold text-white">{m.name}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-400">{m.d}</p>
            </Card>
          ))}
        </div>
      </Section>

      {/* 6. Cas d'usage */}
      <Section id="cas-usage" className="border-y border-white/5 bg-white/[0.02]">
        <Kicker>Cas d&apos;usage</Kicker>
        <h2 className="mt-3 max-w-3xl text-3xl font-semibold text-white md:text-4xl">
          Conçu pour les organisations qui veulent mieux piloter les compétences.
        </h2>
        <div className="mt-10 grid gap-6 md:grid-cols-2">
          {[
            {
              icon: GraduationCap,
              t: "Éducation",
              d: "Suivre les apprenants, détecter les risques, valoriser les acquis.",
            },
            {
              icon: Building2,
              t: "Entreprise",
              d: "Identifier les compétences disponibles, les écarts et les priorités de développement.",
            },
            {
              icon: Brain,
              t: "Organismes de formation",
              d: "Structurer des parcours, prouver l'impact et différencier l'offre.",
            },
            {
              icon: Network,
              t: "Réseaux / franchises",
              d: "Harmoniser les pratiques et faire monter les équipes en compétence.",
            },
          ].map((c) => (
            <Card key={c.t}>
              <c.icon className="h-5 w-5 text-cyan-300" strokeWidth={1.6} />
              <h3 className="mt-3 text-lg font-semibold text-white">{c.t}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-400">{c.d}</p>
            </Card>
          ))}
        </div>
      </Section>

      {/* 7. Beyond Index */}
      <Section id="beyond-index">
        <div className="grid items-center gap-10 rounded-3xl border border-violet-500/25 bg-gradient-to-br from-violet-500/10 via-transparent to-cyan-500/10 p-8 md:grid-cols-2 md:p-12">
          <div>
            <Kicker>Beyond Index</Kicker>
            <h2 className="mt-3 text-3xl font-semibold text-white md:text-4xl">
              Évaluez gratuitement votre maturité compétences.
            </h2>
            <p className="mt-4 text-slate-400 leading-relaxed">
              En quelques minutes, obtenez un premier score sur la capacité de votre organisation à
              identifier, développer et reconnaître les compétences.
            </p>
          </div>
          <div className="flex flex-col items-start gap-4 md:items-end">
            <LineChart className="h-12 w-12 text-violet-300" strokeWidth={1.4} />
            <Link
              href="/beyond-index"
              className="inline-flex rounded-full bg-white px-8 py-3.5 text-sm font-semibold text-slate-950 transition hover:bg-cyan-100"
            >
              Faire le test
            </Link>
          </div>
        </div>
      </Section>

      {/* 8. Advisory */}
      <Section id="advisory" className="border-y border-white/5">
        <div className="grid gap-8 md:grid-cols-[1.2fr_0.8fr] md:items-center">
          <div>
            <Kicker>Beyond Advisory</Kicker>
            <h2 className="mt-3 text-3xl font-semibold text-white md:text-4xl">
              Besoin d&apos;aller plus loin ? Beyond Advisory vous accompagne.
            </h2>
            <p className="mt-4 max-w-2xl text-slate-400 leading-relaxed">
              Nos experts vous accompagnent dans la stratégie compétences, la création de référentiels
              métiers, l&apos;intégration des Open Badges, la structuration d&apos;académies internes et
              l&apos;usage de l&apos;IA dans vos parcours.
            </p>
          </div>
          <a
            href={advisoryMail}
            className="inline-flex w-full items-center justify-center rounded-full border border-white/20 bg-white/5 px-8 py-4 text-sm font-semibold text-white backdrop-blur-sm transition hover:bg-white/10 md:w-auto"
          >
            Parler à un expert
          </a>
        </div>
      </Section>

      {/* 9. Impact */}
      <Section id="impact">
        <Kicker>Impact</Kicker>
        <h2 className="mt-3 text-3xl font-semibold text-white md:text-4xl">
          Ce que Beyond change concrètement.
        </h2>
        <ul className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {[
            "Plus de visibilité sur les compétences réelles",
            "Des décisions moins intuitives",
            "Des parcours plus pertinents",
            "Une meilleure reconnaissance des acquis",
            "Un pilotage plus clair pour les équipes pédagogiques, RH et managers",
            "Une différenciation forte auprès des apprenants, collaborateurs et partenaires",
          ].map((x) => (
            <li key={x}>
              <Card className="text-sm leading-relaxed text-slate-200">{x}</Card>
            </li>
          ))}
        </ul>
        <p className="mt-10 text-sm text-slate-500">
          Contenus pédagogiques complémentaires disponibles via{" "}
          <a href="https://edgebs.fr" className="text-slate-400 underline underline-offset-2 hover:text-slate-300">
            EDGE
          </a>
          , marque sœur dédiée au B2C — sans confondre l&apos;offre Beyond B2B.
        </p>
      </Section>

      {/* 10. CTA final */}
      <Section className="pb-24">
        <div className="rounded-3xl border border-cyan-500/30 bg-gradient-to-r from-cyan-500/10 to-violet-600/10 p-10 text-center md:p-14">
          <h2 className="text-2xl font-semibold text-white md:text-3xl">
            Prêt à piloter vos compétences autrement ?
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-slate-400">
            Découvrez comment Beyond peut transformer votre organisation en système de progression piloté
            par les compétences.
          </p>
          <a
            href={demoMail}
            className="mt-8 inline-flex rounded-full bg-gradient-to-r from-violet-500 to-cyan-400 px-8 py-3.5 text-sm font-semibold text-slate-950 shadow-[0_0_32px_-8px_rgba(139,92,246,0.5)]"
          >
            Demander une démo
          </a>
        </div>
      </Section>

      <footer className="border-t border-white/10 py-12 text-center text-sm text-slate-500">
        <p className="font-semibold text-slate-300">Beyond</p>
        <p className="mt-2 text-xs text-slate-500">Intelligence des compétences pour les organisations.</p>
        <div className="mt-6 flex flex-wrap justify-center gap-6">
          <Link href="/beyond-index" className="hover:text-slate-300">
            Beyond Index
          </Link>
          <a href="#advisory" className="hover:text-slate-300">
            Advisory
          </a>
          <Link href="/prix" className="hover:text-slate-300">
            Prix
          </Link>
          <Link href="/login" className="hover:text-slate-300">
            Connexion
          </Link>
          <a href={demoMail} className="hover:text-slate-300">
            Démo
          </a>
        </div>
        <p className="mt-8 text-xs text-slate-600">© {new Date().getFullYear()} Beyond · contact@beyondcenter.fr</p>
      </footer>
    </div>
  );
}
