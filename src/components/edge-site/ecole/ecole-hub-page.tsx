import Link from "next/link";
import { ArrowRight, GraduationCap, Handshake, MapPin, Sparkles } from "lucide-react";

import { EdgePremiumButton } from "@/components/edge-site/premium/edge-premium-button";
import type { EdgeMarketingRoutes } from "@/lib/edge-site/marketing-routes";

const CURSUS = [
  {
    slug: "ai-business",
    title: "AI Business",
    eyebrow: "Bachelor · NTC",
    body: "Négociation technico-commerciale avec une spécialisation intelligence artificielle appliquée au business.",
    hrefKey: "ecoleNtcAiBusiness" as const,
  },
  {
    slug: "business-sport",
    title: "Business Sport",
    eyebrow: "Bachelor · NTC",
    body: "Commerce et développement business dans l’univers du sport et des marques.",
    hrefKey: "ecoleNtcBusinessSport" as const,
  },
  {
    slug: "real-estate",
    title: "Real Estate",
    eyebrow: "Bachelor · NTC",
    body: "Négociation et relation client appliquées à l’immobilier et aux projets immobiliers.",
    hrefKey: "ecoleNtcRealEstate" as const,
  },
  {
    slug: "retail-experience",
    title: "Retail Experience",
    eyebrow: "Bachelor · MEM",
    body: "Manager d’établissement marchand avec une spécialisation expérience client en magasin et en ligne.",
    hrefKey: "ecoleMemRetailExperience" as const,
  },
  {
    slug: "merchandising",
    title: "Merchandising",
    eyebrow: "Bachelor · MEM",
    body: "Manager d’établissement marchand avec une spécialisation mise en scène de l’offre et performance de l’espace.",
    hrefKey: "ecoleMemMerchandising" as const,
  },
  {
    slug: "luxury-premium",
    title: "Luxury & Premium",
    eyebrow: "Bachelor · MEM",
    body: "Manager d’établissement marchand avec une spécialisation codes du luxe et relation client d’exception.",
    hrefKey: "ecoleMemLuxuryPremium" as const,
  },
  {
    slug: "sport-retail",
    title: "Sport Retail",
    eyebrow: "Bachelor · MEM",
    body: "Manager d’établissement marchand avec une spécialisation magasin de sport et boutique de club.",
    hrefKey: "ecoleMemSportRetail" as const,
  },
  {
    slug: "growth-acquisition",
    title: "Growth & Acquisition",
    eyebrow: "Bac+3 · RDC",
    body: "Responsable de développement commercial avec une spécialisation acquisition, expérimentation et croissance.",
    hrefKey: "ecoleRdcGrowthAcquisition" as const,
  },
  {
    slug: "entrepreneurship",
    title: "Entrepreneurship",
    eyebrow: "Bac+3 · RDC",
    body: "Responsable de développement commercial avec une spécialisation création, financement et lancement de projet.",
    hrefKey: "ecoleRdcEntrepreneurship" as const,
  },
] as const;

const STEPS = [
  {
    title: "Vous candidatez",
    body: "Dossier en ligne, échange avec l’équipe, validation du projet scolaire et pro.",
  },
  {
    title: "Vous êtes accompagné",
    body: "Préparation aux entretiens, matching entreprises, suivi jusqu’à la signature.",
  },
  {
    title: "Vous apprenez en alternance",
    body: "Cours + entreprise : compétences concrètes, rémunération, immersion métier.",
  },
] as const;

const FAQ = [
  {
    q: "Pour qui est Byound School ?",
    a: "Jeunes après le bac (ou équivalent) qui veulent un bachelor en alternance, orienté business, vente et spécialités concrètes.",
  },
  {
    q: "Faut-il déjà avoir une entreprise ?",
    a: "Non. Vous pouvez candidater sans contrat : nous vous accompagnons dans la recherche d’entreprise d’accueil.",
  },
  {
    q: "Comment candidater ?",
    a: "Via le bouton Candidater : vous déposez votre dossier en ligne. Comptez quelques minutes pour démarrer.",
  },
] as const;

type Props = {
  routes: EdgeMarketingRoutes;
};

export function EcoleHubPage({ routes }: Props) {
  return (
    <div className="bg-[#070b1f] text-white">
      <section className="relative overflow-hidden px-5 pb-20 pt-28 sm:px-8 lg:px-10 lg:pb-28 lg:pt-36">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(88,101,242,0.22),_transparent_55%)]" />
        <div className="relative mx-auto max-w-5xl">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/55">
            Byound School
          </p>
          <h1 className="mt-4 max-w-3xl text-4xl font-semibold tracking-tight sm:text-5xl lg:text-6xl">
            L’école en alternance pour construire un métier qui compte.
          </h1>
          <p className="mt-6 max-w-2xl text-base leading-relaxed text-white/70 sm:text-lg">
            Bachelor après le bac, spécialités business concrètes, accompagnement jusqu’à
            l’entreprise. Normandie · rentrée septembre · inscriptions ouvertes.
          </p>
          <div className="mt-10 flex flex-wrap items-center gap-3">
            <EdgePremiumButton href={routes.ecoleCandidater} variant="white" shape="revolut">
              Candidater
            </EdgePremiumButton>
            <a
              href="#cursus"
              className="inline-flex items-center gap-2 rounded-full border border-white/20 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10"
            >
              Voir les cursus
              <ArrowRight size={16} aria-hidden />
            </a>
          </div>
          <div className="mt-12 flex flex-wrap gap-6 text-sm text-white/55">
            <span className="inline-flex items-center gap-2">
              <MapPin size={16} aria-hidden /> Normandie
            </span>
            <span className="inline-flex items-center gap-2">
              <GraduationCap size={16} aria-hidden /> Alternance rémunérée
            </span>
            <span className="inline-flex items-center gap-2">
              <Handshake size={16} aria-hidden /> Accompagnement entreprise
            </span>
          </div>
        </div>
      </section>

      <section className="border-t border-white/10 px-5 py-16 sm:px-8 lg:px-10">
        <div className="mx-auto grid max-w-5xl gap-10 lg:grid-cols-[1fr_1.2fr]">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">Pour qui ?</h2>
            <p className="mt-4 text-white/65">
              Vous sortez du bac (ou équivalent), vous voulez un diplôme reconnu et une vraie
              immersion en entreprise — pas seulement des cours théoriques.
            </p>
          </div>
          <ul className="space-y-4 text-sm text-white/75">
            <li className="rounded-2xl border border-white/10 bg-white/[0.03] px-5 py-4">
              Après le bac → bachelor en alternance (NTC + spécialité).
            </li>
            <li className="rounded-2xl border border-white/10 bg-white/[0.03] px-5 py-4">
              Envies business, commerce, sport, immobilier ou IA appliquée.
            </li>
            <li className="rounded-2xl border border-white/10 bg-white/[0.03] px-5 py-4">
              Besoin d’un accompagnement concret pour trouver votre entreprise.
            </li>
          </ul>
        </div>
      </section>

      <section
        id="alternance"
        className="scroll-mt-24 border-t border-white/10 px-5 py-16 sm:px-8 lg:px-10"
      >
        <div className="mx-auto max-w-5xl">
          <div className="flex items-center gap-2 text-white/55">
            <Sparkles size={16} aria-hidden />
            <p className="text-xs font-semibold uppercase tracking-[0.18em]">Comprendre l’alternance</p>
          </div>
          <h2 className="mt-3 text-2xl font-semibold tracking-tight sm:text-3xl">
            Comment ça marche chez Byound
          </h2>
          <div className="mt-10 grid gap-4 sm:grid-cols-3">
            {STEPS.map((step, index) => (
              <div
                key={step.title}
                className="rounded-2xl border border-white/10 bg-white/[0.03] px-5 py-6"
              >
                <p className="text-xs font-semibold text-white/40">0{index + 1}</p>
                <h3 className="mt-3 text-lg font-semibold">{step.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-white/65">{step.body}</p>
              </div>
            ))}
          </div>
          <p className="mt-8 text-sm text-white/55">
            Financement et aides :{" "}
            <Link href={routes.financerMaFormation} className="font-medium text-white underline-offset-4 hover:underline">
              financer ma formation
            </Link>
            .
          </p>
        </div>
      </section>

      <section id="cursus" className="scroll-mt-24 border-t border-white/10 px-5 py-16 sm:px-8 lg:px-10">
        <div className="mx-auto max-w-5xl">
          <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">Les cursus ouverts</h2>
          <p className="mt-3 max-w-2xl text-white/65">
            Quatre spécialisations live. D’autres filières arrivent — candidater reste le meilleur
            moyen d’être informé.
          </p>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {CURSUS.map((item) => (
              <Link
                key={item.slug}
                href={routes[item.hrefKey]}
                className="group flex flex-col rounded-2xl border border-white/10 bg-white/[0.03] p-6 transition hover:border-white/25 hover:bg-white/[0.06]"
              >
                <p className="text-xs font-semibold uppercase tracking-wider text-white/45">
                  {item.eyebrow}
                </p>
                <h3 className="mt-3 text-xl font-semibold">{item.title}</h3>
                <p className="mt-3 flex-1 text-sm leading-relaxed text-white/65">{item.body}</p>
                <span className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-white">
                  Voir le cursus
                  <ArrowRight
                    size={16}
                    className="transition group-hover:translate-x-0.5"
                    aria-hidden
                  />
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-white/10 px-5 py-16 sm:px-8 lg:px-10">
        <div className="mx-auto max-w-5xl">
          <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">Questions fréquentes</h2>
          <div className="mt-8 space-y-4">
            {FAQ.map((item) => (
              <div key={item.q} className="rounded-2xl border border-white/10 bg-white/[0.03] px-5 py-5">
                <h3 className="font-semibold">{item.q}</h3>
                <p className="mt-2 text-sm leading-relaxed text-white/65">{item.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-white/10 px-5 py-20 sm:px-8 lg:px-10">
        <div className="mx-auto flex max-w-5xl flex-col items-start gap-6 rounded-3xl border border-white/10 bg-white/[0.04] px-8 py-10 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight">Prêt à candidater ?</h2>
            <p className="mt-2 max-w-md text-sm text-white/65">
              Déposez votre dossier en ligne. On vous recontacte pour la suite.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <EdgePremiumButton href={routes.ecoleCandidater} variant="white" shape="revolut">
              Candidater
            </EdgePremiumButton>
            <EdgePremiumButton href={routes.contact} variant="outline-white" shape="revolut">
              Prendre rendez-vous
            </EdgePremiumButton>
          </div>
        </div>
      </section>
    </div>
  );
}
