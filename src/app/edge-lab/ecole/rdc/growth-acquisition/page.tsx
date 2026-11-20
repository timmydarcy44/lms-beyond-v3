import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  BriefcaseBusiness,
  Check,
  CheckCircle2,
  GraduationCap,
  TrendingUp,
} from "lucide-react";

import { ProgramContributorsSection } from "@/components/edge-site/cfa/program-contributors-section";
import { ProgramFactsCard } from "@/components/edge-site/cfa/program-facts-card";
import { RdcEvaluationSection } from "@/components/edge-site/cfa/rdc-evaluation-section";
import { AlternantsRecruitingSection } from "@/components/offres/public-offer";
import { EdgePremiumShell } from "@/components/edge-site/premium/edge-premium-shell";
import { getByoundProgramFacts } from "@/lib/byound-school/program-facts-server";
import { EDGE_PREMIUM_IMAGES } from "@/lib/edge-site/premium-constants";
import { getProgramContributors } from "@/lib/expert/program-contributors";

export const metadata: Metadata = {
  title: "Growth & Acquisition — Byound School",
  description:
    "Préparez le titre Responsable de développement commercial et apprenez à faire grandir une entreprise : acquisition, expérimentation et accélération avec l’IA.",
};

const fundamentals = [
  {
    number: "01",
    title: "Pilotage du plan d’actions commerciales",
    items: [
      "Étude de marché et veille",
      "Diagnostic stratégique",
      "Objectifs commerciaux",
      "Plan d’actions omnicanal et budget",
      "Indicateurs et tableaux de bord",
    ],
  },
  {
    number: "02",
    title: "Stratégie de croissance",
    items: [
      "Stratégie commerciale et typologie des clients",
      "Politique de prix et rentabilité",
      "Prospection omnicanale",
      "Négociation et proposition sur mesure",
      "Fidélisation et partenariats",
    ],
  },
  {
    number: "03",
    title: "Management d’équipe commerciale",
    items: [
      "Recrutement et composition de l’équipe",
      "Pilotage du processus commercial",
      "Animation et motivation",
      "Développement des compétences",
      "Évaluation des performances",
    ],
  },
] as const;

const badges = [
  {
    code: "GM",
    title: "Growth Model",
    description: "Comprendre la mécanique de la croissance et la piloter par les indicateurs.",
    skills:
      "Tunnel de conversion · Boucles de croissance · Indicateur clé de croissance · Coût d’acquisition client · Valeur vie client · Rentabilité de l’acquisition",
  },
  {
    code: "DA",
    title: "Digital Acquisition",
    description: "Attirer des prospects qualifiés grâce aux canaux numériques.",
    skills:
      "Référencement naturel et payant · Publicité sur les réseaux sociaux · Campagnes LinkedIn · Séquences d’e-mails automatisées · Contenu · Pages d’atterrissage",
  },
  {
    code: "GE",
    title: "Growth Experimentation",
    description: "Tester vite, mesurer juste et garder ce qui fonctionne.",
    skills: "Hypothèses · Tests comparatifs · Taux de conversion · Priorisation des tests · Itérations rapides",
  },
  {
    code: "AI",
    title: "AI & Growth Analytics",
    description: "Utiliser l’IA et les données pour décider et accélérer.",
    skills:
      "Attribution des ventes · Segmentation par l’IA · Prévisions · Contenus générés par l’IA · Agents et automatisations · Usage responsable",
  },
] as const;

const projectSteps = [
  "Diagnostiquer",
  "Cibler",
  "Choisir les canaux",
  "Tester",
  "Automatiser",
  "Mesurer",
  "Accélérer",
] as const;

const jobs = [
  "Responsable du développement commercial",
  "Chargé(e) d’affaires",
  "Responsable commercial(e)",
  "Chargé(e) d’acquisition",
  "Responsable de la croissance",
] as const;

const blocs = [
  {
    code: "BLOC 01",
    title: "Piloter le développement opérationnel du plan d’actions commerciales",
    items: [
      "Réaliser le diagnostic stratégique de l’entreprise",
      "Définir les objectifs commerciaux (méthode SMART)",
      "Élaborer le plan d’actions commerciales",
      "Mettre en œuvre le plan d’actions commerciales",
      "Évaluer la performance commerciale de l’entreprise",
      "Contrôler le plan d’actions commerciales",
    ],
  },
  {
    code: "BLOC 02",
    title: "Développer la stratégie de croissance de l’entreprise",
    items: [
      "Définir la stratégie commerciale",
      "Intégrer les typologies des clients",
      "Établir une politique de prix attrayante",
      "Mettre en œuvre la stratégie commerciale omnicanale",
      "Construire une proposition commerciale sur mesure",
      "Développer la stratégie de prospection omnicanale",
      "Construire une stratégie de négociation commerciale",
      "Développer le portefeuille clients",
      "Implémenter une stratégie de fidélisation des clients",
      "Développer une stratégie de relation client",
      "Mettre en place des partenariats commerciaux gagnant-gagnant",
    ],
  },
  {
    code: "BLOC 03",
    title: "Manager une équipe commerciale",
    items: [
      "Déterminer le profil de l’équipe commerciale",
      "Composer l’équipe commerciale",
      "Piloter le processus commercial",
      "Développer des stratégies d’animation et de motivation",
      "Mettre en place des stratégies pour développer les compétences",
      "Coordonner les opérations commerciales de son équipe",
      "Évaluer les performances commerciales des collaborateurs",
      "Contrôler l’activité de l’équipe commerciale",
    ],
  },
] as const;

function SectionEyebrow({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-[#5146e5]">
      {children}
    </p>
  );
}

export default async function RdcGrowthAcquisitionPage() {
  const [facts, contributors] = await Promise.all([
    getByoundProgramFacts("growth_acquisition"),
    getProgramContributors("Growth & Acquisition"),
  ]);

  return (
    <EdgePremiumShell overlayNav showTopBar={false}>
      <section className="relative isolate min-h-[92svh] overflow-hidden bg-[#070b1f] text-white">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: `url("${facts.heroImageUrl || EDGE_PREMIUM_IMAGES.business}")`,
          }}
          aria-hidden
        />
        <div
          className="absolute inset-0 bg-[linear-gradient(90deg,#070b1f_0%,rgba(7,11,31,.82)_22%,rgba(7,11,31,.55)_42%,rgba(7,11,31,.28)_62%,rgba(7,11,31,.1)_78%,transparent_100%)]"
          aria-hidden
        />

        <div className="relative mx-auto flex min-h-[92svh] max-w-7xl items-end px-5 pb-16 pt-32 sm:px-8 sm:pb-20 lg:px-10 lg:pb-24">
          <div className="max-w-3xl">
            <p className="text-[11px] font-semibold uppercase tracking-[0.26em] text-white/55">
              Byound School · Business Development · Alternance
            </p>
            <h1 className="mt-7 text-[clamp(3.2rem,7vw,6.5rem)] font-semibold leading-[0.88] tracking-[-0.065em]">
              Growth & Acquisition
            </h1>
            <p className="mt-4 text-[clamp(1.15rem,2vw,1.65rem)] font-medium tracking-[-0.03em] text-white/90">
              Responsable de développement commercial
            </p>
            <p className="mt-3 text-[11px] font-semibold uppercase tracking-[0.22em] text-[#8c86ff]">
              Niveau Bac+3 · Titre certifié RNCP
            </p>
            <p className="mt-8 text-[clamp(1.25rem,2.4vw,2rem)] font-medium tracking-[-0.03em]">
              La croissance ne se devine pas.
              <br />
              Elle se construit.
            </p>
            <p className="mt-4 max-w-xl text-base leading-relaxed text-white/60 sm:text-lg">
              Préparez ce titre de niveau Bac+3 et apprenez à faire grandir une entreprise : attirer
              les bons clients, tester de nouveaux canaux, mesurer ce qui fonctionne et accélérer
              avec l’IA.
            </p>

            <div className="mt-8 flex flex-wrap gap-2">
              {["Niveau Bac+3", "Alternance", "Caen", "Growth & Acquisition"].map((item) => (
                <span
                  key={item}
                  className="rounded-full border border-white/15 bg-white/[0.06] px-4 py-2 text-xs font-medium backdrop-blur"
                >
                  {item}
                </span>
              ))}
            </div>
            <p className="mt-5 text-sm text-white/55">
              1 titre RNCP + une spécialisation validée par des Open Badges.
            </p>

            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/ecole/candidater?track=rdc&specialization=growth_acquisition"
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-white px-7 text-sm font-semibold text-[#070b1f] transition hover:bg-white/90"
              >
                Candidater
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="#programme"
                className="inline-flex min-h-12 items-center justify-center rounded-full border border-white/20 bg-white/[0.04] px-7 text-sm font-semibold transition hover:bg-white/[0.1]"
              >
                Découvrir le programme
              </Link>
            </div>
          </div>
        </div>
      </section>

      <ProgramFactsCard facts={facts} />

      <nav className="sticky top-16 z-30 border-b border-black/[0.06] bg-white/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl gap-7 overflow-x-auto px-5 py-4 text-xs font-semibold uppercase tracking-[0.18em] text-black/45 sm:px-8 lg:px-10">
          <a className="whitespace-nowrap transition hover:text-black" href="#programme">
            Programme
          </a>
          <a className="whitespace-nowrap transition hover:text-black" href="#specialisation">
            Spécialisation
          </a>
          <a className="whitespace-nowrap transition hover:text-black" href="#certification">
            Certification
          </a>
          <a className="whitespace-nowrap transition hover:text-black" href="#admission">
            Admission
          </a>
        </div>
      </nav>

      <section className="bg-[#f7f7f5] py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
          <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
            <div>
              <SectionEyebrow>Le modèle Byound</SectionEyebrow>
              <h2 className="mt-4 max-w-4xl text-[clamp(2.5rem,5vw,4.8rem)] font-semibold leading-[0.96] tracking-[-0.055em] text-[#070b1f]">
                Un titre. Une spécialisation.{" "}
                <span className="text-black/30">Des preuves.</span>
              </h2>
            </div>
            <p className="max-w-sm text-sm leading-relaxed text-black/50">
              1 titre RNCP + une spécialisation validée par des Open Badges.
            </p>
          </div>

          <div className="mt-14 grid gap-4 md:grid-cols-3">
            {[
              {
                number: "01",
                icon: GraduationCap,
                title: "Un niveau Bac+3",
                text: "Titre certifié RNCP Responsable de développement commercial, organisé en 3 blocs.",
              },
              {
                number: "02",
                icon: TrendingUp,
                title: "Une spécialisation métier",
                text: "Growth & Acquisition, conçue avec des professionnels de la croissance.",
              },
              {
                number: "03",
                icon: BadgeCheck,
                title: "Des preuves vérifiables",
                text: "Des Open Badges adossés à des critères précis et partageables.",
              },
            ].map((item, index) => (
              <article
                key={item.number}
                className={
                  index === 2
                    ? "rounded-[28px] bg-[#5146e5] p-7 text-white sm:p-8"
                    : "rounded-[28px] border border-black/[0.06] bg-white p-7 text-[#070b1f] sm:p-8"
                }
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold opacity-50">{item.number}</span>
                  <item.icon className="h-5 w-5 opacity-70" strokeWidth={1.6} />
                </div>
                <h3 className="mt-12 text-xl font-semibold tracking-[-0.025em]">{item.title}</h3>
                <p className="mt-3 text-sm leading-relaxed opacity-65">{item.text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="specialisation" className="relative overflow-hidden bg-[#070b1f] py-20 text-white sm:py-28">
        <div
          className="absolute inset-0 bg-[radial-gradient(circle_at_12%_18%,rgba(83,72,255,.32),transparent_32%),radial-gradient(circle_at_88%_75%,rgba(29,96,255,.18),transparent_38%)]"
          aria-hidden
        />
        <div className="relative mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
          <div className="grid gap-8 lg:grid-cols-[.85fr_1.15fr] lg:gap-16">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-[#8c86ff]">
                Spécialisation Byound
              </p>
              <div className="mt-5 flex items-center gap-5">
                <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-[28px] border border-white/15 bg-white/[0.06] text-2xl font-semibold tracking-tight text-[#8c86ff] sm:h-28 sm:w-28">
                  GA
                </div>
                <div>
                  <h2 className="text-[clamp(2.3rem,4.5vw,4.4rem)] font-semibold leading-[0.94] tracking-[-0.055em]">
                    Growth & Acquisition.
                  </h2>
                  <p className="mt-3 max-w-md text-base leading-relaxed text-white/55">
                    Attirer. Tester. Accélérer.
                  </p>
                </div>
              </div>
            </div>
            <div className="text-base leading-relaxed text-white/60">
              <p>
                La spécialisation Growth & Acquisition complète le titre de Responsable de
                développement commercial par ce qu’attendent aujourd’hui les PME et les start-up :
                comprendre la mécanique de la croissance, acquérir des clients sur les canaux
                numériques et piloter par l’expérimentation.
              </p>
              <p className="mt-4">
                Tunnel de conversion, référencement, publicité, tests, automatisation, données et
                intelligence artificielle. Chaque compétence est validée par un Open Badge Byound.
              </p>
            </div>
          </div>

          <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {badges.map((badge) => (
              <article
                key={badge.code}
                className="rounded-[24px] border border-white/10 bg-white/[0.05] p-5 backdrop-blur transition hover:-translate-y-1 hover:bg-white/[0.08]"
              >
                <div className="flex h-[120px] items-center justify-center rounded-2xl bg-white/[0.04]">
                  <span className="text-3xl font-semibold tracking-tight text-[#8c86ff]">
                    {badge.code}
                  </span>
                </div>
                <p className="mt-5 text-[10px] font-semibold uppercase tracking-[0.2em] text-[#8c86ff]">
                  Open Badge · {badge.code}
                </p>
                <h3 className="mt-2 text-base font-semibold">{badge.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-white/50">{badge.description}</p>
                <p className="mt-3 text-[11px] leading-relaxed text-white/35">{badge.skills}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <ProgramContributorsSection people={contributors} />

      <section id="programme" className="scroll-mt-28 bg-white py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
          <SectionEyebrow>Le programme</SectionEyebrow>
          <h2 className="mt-4 text-[clamp(2.4rem,4vw,4rem)] font-semibold tracking-[-0.05em] text-[#070b1f]">
            Les fondamentaux du métier.
          </h2>

          <div className="mt-12 grid gap-4 sm:grid-cols-3">
            {fundamentals.map((block) => (
              <article key={block.number} className="rounded-[24px] bg-[#f2f3fb] p-6">
                <p className="text-xs font-semibold text-[#5146e5]">{block.number}</p>
                <h3 className="mt-3 text-lg font-semibold tracking-[-0.02em] text-[#070b1f]">
                  {block.title}
                </h3>
                <ul className="mt-5 space-y-2">
                  {block.items.map((item) => (
                    <li key={item} className="flex gap-2 text-sm leading-snug text-black/55">
                      <span className="mt-2 h-px w-3 shrink-0 bg-black/30" />
                      {item}
                    </li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="certification" className="scroll-mt-28 bg-[#f7f7f5] py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
          <SectionEyebrow>Référentiel RDC</SectionEyebrow>
          <h2 className="mt-4 text-[clamp(2.4rem,4vw,4rem)] font-semibold tracking-[-0.05em] text-[#070b1f]">
            Compétences certifiées.
          </h2>
          <p className="mt-4 max-w-2xl text-sm text-black/50">
            3 blocs de compétences · 25 compétences · contrôles continus, épreuves nationales et
            grand oral
          </p>

          <div className="mt-12 grid gap-5 lg:grid-cols-3">
            {blocs.map((bloc) => (
              <article
                key={bloc.code}
                className="rounded-[28px] border border-black/[0.07] bg-white p-7 sm:p-8"
              >
                <span className="rounded-full bg-[#5146e5] px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-white">
                  {bloc.code}
                </span>
                <h3 className="mt-6 text-lg font-semibold tracking-[-0.025em] text-[#070b1f]">
                  {bloc.title}
                </h3>
                <ul className="mt-6 space-y-3">
                  {bloc.items.map((item) => (
                    <li key={item} className="flex gap-3 text-sm leading-relaxed text-black/55">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#5146e5]" />
                      {item}
                    </li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
          <RdcEvaluationSection specialization="Growth & Acquisition" />
        </div>
      </section>

      <section className="bg-white py-20 sm:py-28">
        <div className="mx-auto grid max-w-7xl gap-12 px-5 sm:px-8 lg:grid-cols-2 lg:px-10">
          <div>
            <SectionEyebrow>Le projet Growth & Acquisition</SectionEyebrow>
            <h2 className="mt-4 text-[clamp(2.3rem,4vw,3.8rem)] font-semibold leading-[1] tracking-[-0.05em] text-[#070b1f]">
              Tester. Mesurer. Accélérer.
            </h2>
            <p className="mt-5 max-w-xl text-base leading-relaxed text-black/55">
              Une PME veut doubler ses demandes de contact en six mois. L’apprenant construit et
              pilote son plan d’acquisition, du diagnostic à l’accélération.
            </p>
            <div className="mt-8 flex flex-wrap gap-2">
              {projectSteps.map((step, index) => (
                <span
                  key={step}
                  className="rounded-full border border-black/10 bg-[#f7f7f5] px-4 py-2 text-sm font-semibold text-[#070b1f]"
                >
                  {String(index + 1).padStart(2, "0")} · {step}
                </span>
              ))}
            </div>
            <div className="mt-8 grid grid-cols-2 gap-3">
              {["Ateliers", "Cas réels", "Labo growth", "Challenges"].map((item) => (
                <div
                  key={item}
                  className="rounded-2xl border border-black/[0.07] px-5 py-4 text-sm font-semibold text-[#070b1f]"
                >
                  {item}
                </div>
              ))}
            </div>
          </div>

          <div>
            <SectionEyebrow>Débouchés</SectionEyebrow>
            <h2 className="mt-4 text-[clamp(2.3rem,4vw,3.8rem)] font-semibold leading-[1] tracking-[-0.05em] text-[#070b1f]">
              Dans l’univers de la croissance.
            </h2>
            <div className="mt-8 flex flex-wrap gap-2">
              {jobs.map((job) => (
                <span
                  key={job}
                  className="rounded-full border border-black/10 bg-[#f7f7f5] px-4 py-2.5 text-sm text-black/65"
                >
                  {job}
                </span>
              ))}
            </div>
            <p className="mt-7 text-sm leading-relaxed text-black/50">
              Start-up · PME en développement · Éditeurs de logiciels · E-commerce · Agences
              marketing et digitales.
            </p>
            <p className="mt-3 text-sm leading-relaxed text-black/50">
              Et après ? Poursuite possible en Bac+5.
            </p>
          </div>
        </div>
      </section>

      <section id="admission" className="scroll-mt-28 bg-[#070b1f] py-20 text-white sm:py-28">
        <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
          <div className="grid gap-12 lg:grid-cols-[1fr_.8fr] lg:items-end">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-[#8c86ff]">
                Rentrée septembre 2027
              </p>
              <h2 className="mt-5 text-[clamp(2.6rem,4.8vw,5rem)] font-semibold leading-[0.94] tracking-[-0.055em]">
                Prêt à attirer, tester et accélérer ?
              </h2>
              <div className="mt-10 grid gap-4 sm:grid-cols-3">
                {[
                  ["Niveau d’entrée", "Niveau 5 — Bac+2 ou équivalent"],
                  [
                    "Prérequis",
                    "Expression écrite et orale en français · compétences numériques de base",
                  ],
                  ["Admission", "Dossier · Entretien individuel · Positionnement"],
                ].map(([label, value]) => (
                  <div key={label} className="border-t border-white/15 pt-4">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/35">
                      {label}
                    </p>
                    <p className="mt-2 text-sm leading-relaxed text-white/75">{value}</p>
                  </div>
                ))}
              </div>
              <p className="mt-8 max-w-xl text-sm leading-relaxed text-white/45">
                12 mois · env. 490 h · 1 semaine par mois en centre (renforcée à la rentrée et avant
                les épreuves) · Caen · Présentiel et/ou distanciel. Coût : 5 000 € TTC — gratuit
                pour l’alternant (prise en charge OPCO). Délai d’accès : jusqu’à 3 mois après la
                rentrée.
              </p>
            </div>

            <div className="rounded-[28px] border border-white/10 bg-white/[0.06] p-7 backdrop-blur sm:p-9">
              <BriefcaseBusiness className="h-7 w-7 text-[#8c86ff]" strokeWidth={1.5} />
              <h3 className="mt-8 text-2xl font-semibold tracking-[-0.03em]">
                Candidater à Growth & Acquisition
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-white/50">
                Déposez votre dossier en ligne. L’équipe Byound School vous recontacte pour la
                suite.
              </p>
              <a
                href="/ecole/candidater?track=rdc&specialization=growth_acquisition"
                className="mt-8 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-white px-6 text-sm font-semibold text-[#070b1f] transition hover:bg-white/90"
              >
                Démarrer ma candidature
                <ArrowRight className="h-4 w-4" />
              </a>
              <p className="mt-5 flex items-start gap-2 text-xs leading-relaxed text-white/35">
                <Check className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                Formation accessible aux personnes en situation de handicap. Référente : Jessica
                Contentin · jessica.contentin@byound.fr
              </p>
            </div>
          </div>
        </div>
      </section>
      <AlternantsRecruitingSection cursus="Growth & Acquisition" />
    </EdgePremiumShell>
  );
}
