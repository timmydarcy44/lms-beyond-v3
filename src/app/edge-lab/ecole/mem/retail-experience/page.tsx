import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  BriefcaseBusiness,
  Check,
  CheckCircle2,
  GraduationCap,
  Store,
} from "lucide-react";

import { MemEvaluationSection } from "@/components/edge-site/cfa/mem-evaluation-section";
import { ProgramContributorsSection } from "@/components/edge-site/cfa/program-contributors-section";
import { ProgramFactsCard } from "@/components/edge-site/cfa/program-facts-card";
import { AlternantsRecruitingSection } from "@/components/offres/public-offer";
import { EdgePremiumShell } from "@/components/edge-site/premium/edge-premium-shell";
import { getByoundProgramFacts } from "@/lib/byound-school/program-facts-server";
import { EDGE_PREMIUM_IMAGES } from "@/lib/edge-site/premium-constants";
import { getProgramContributors } from "@/lib/expert/program-contributors";

export const metadata: Metadata = {
  title: "MEM · Retail Experience — Byound School",
  description:
    "Préparez le titre professionnel Manager d’établissement marchand et apprenez à concevoir des expériences client qui font revenir, en magasin comme en ligne.",
};

const fundamentals = [
  {
    number: "01",
    title: "Management d’équipe",
    items: [
      "Animation et cohésion d’équipe",
      "Plannings et coordination",
      "Entretiens et accompagnement",
      "Recrutement et intégration",
      "Prévention des risques",
    ],
  },
  {
    number: "02",
    title: "Dynamique commerciale",
    items: [
      "Approvisionnement et stocks",
      "Merchandising et mise en valeur de l’offre",
      "Accueil et expérience client",
      "Accessibilité et RSE",
      "Lutte contre le gaspillage",
    ],
  },
  {
    number: "03",
    title: "Performance & rentabilité",
    items: [
      "Tableaux de bord et indicateurs",
      "Analyse des ventes",
      "Marge et compte d’exploitation",
      "Démarque et pertes",
      "Suivi du plan d’actions",
    ],
  },
] as const;

const badges = [
  {
    code: "CJ",
    title: "Customer Journey Design",
    description: "Concevoir et améliorer le parcours client, du premier contact à l’après-achat.",
    skills:
      "Parcours client · Profils clients · Moments clés · Points de friction · Observation terrain · Plan d’amélioration",
  },
  {
    code: "PR",
    title: "Phygital Retail",
    description: "Relier le magasin et le digital pour une expérience sans couture.",
    skills:
      "Click & collect · Réservation en ligne · Paiement mobile · Réseaux sociaux du magasin · Vente en direct · Cohérence entre canaux",
  },
  {
    code: "CC",
    title: "Clienteling & Community",
    description: "Connaître ses clients, les fidéliser et faire du magasin un lieu de vie.",
    skills:
      "Fichier client · Relation personnalisée · Relance · Événements · Ateliers · Communauté locale · RGPD",
  },
  {
    code: "AI",
    title: "AI & Customer Insights",
    description: "Utiliser l’IA et les données pour comprendre et améliorer l’expérience client.",
    skills:
      "Avis clients · Satisfaction · Questionnaires · Analyse par l’IA · Réponses personnalisées · Contenus · Usage responsable",
  },
] as const;

const projectSteps = [
  "Observer",
  "Cartographier",
  "Imaginer",
  "Connecter",
  "Animer",
  "Mesurer",
  "Améliorer",
] as const;

const jobs = [
  "Manager de rayon",
  "Manager de surface de vente",
  "Manager d’univers commercial",
  "Chef de rayon",
  "Responsable de boutique",
  "Responsable de point de vente",
  "Responsable de magasin",
] as const;

const ccps = [
  {
    code: "CCP 01",
    title: "Manager l’équipe de son périmètre au sein de l’établissement marchand",
    items: [
      "Animer l’équipe de son périmètre",
      "Planifier et coordonner l’activité de l’équipe de son périmètre",
      "Accompagner la performance individuelle des collaborateurs de son périmètre",
      "Contribuer aux processus de recrutement et d’intégration des collaborateurs de son périmètre",
    ],
  },
  {
    code: "CCP 02",
    title:
      "Développer la dynamique commerciale de son périmètre au sein de l’établissement marchand",
    items: [
      "Gérer l’approvisionnement de son périmètre",
      "Organiser et mettre en œuvre le merchandising de l’offre de produits et de services de son périmètre",
      "Participer à l’amélioration de l’expérience client de son périmètre",
    ],
  },
  {
    code: "CCP 03",
    title:
      "Contribuer à la performance commerciale et à la rentabilité de son périmètre au sein de l’établissement marchand",
    items: [
      "Analyser la performance commerciale de son périmètre",
      "Analyser la rentabilité de son périmètre",
      "Proposer des actions correctives à sa hiérarchie et assurer le suivi du plan d’actions de son périmètre",
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

export default async function MemRetailExperiencePage() {
  const [facts, contributors] = await Promise.all([
    getByoundProgramFacts("retail_experience"),
    getProgramContributors("Retail Experience"),
  ]);

  return (
    <EdgePremiumShell overlayNav showTopBar={false}>
      <section className="relative isolate min-h-[92svh] overflow-hidden bg-[#070b1f] text-white">
        <div
          className="absolute inset-y-0 right-0 w-full bg-cover bg-center opacity-30 lg:w-[58%]"
          style={{
            backgroundImage: `url("${facts.heroImageUrl || EDGE_PREMIUM_IMAGES.business}")`,
          }}
          aria-hidden
        />
        <div
          className="absolute inset-0 bg-[linear-gradient(90deg,#070b1f_0%,rgba(7,11,31,.96)_40%,rgba(7,11,31,.38)_78%,rgba(7,11,31,.7)_100%)]"
          aria-hidden
        />
        <div
          className="absolute inset-0 bg-[radial-gradient(ellipse_at_28%_34%,rgba(83,72,255,.42),transparent_42%),radial-gradient(ellipse_at_78%_74%,rgba(30,104,255,.22),transparent_46%)]"
          aria-hidden
        />

        <div className="relative mx-auto flex min-h-[92svh] max-w-7xl items-end px-5 pb-16 pt-32 sm:px-8 sm:pb-20 lg:px-10 lg:pb-24">
          <div className="max-w-3xl">
            <p className="text-[11px] font-semibold uppercase tracking-[0.26em] text-white/55">
              Byound School · Bac+2 · Alternance · Caen
            </p>
            <h1 className="mt-7 text-[clamp(3.4rem,7.5vw,7rem)] font-semibold leading-[0.86] tracking-[-0.065em]">
              MEM
              <span className="text-[#7770ff]">·</span>
              <br />
              Retail Experience
            </h1>
            <p className="mt-8 text-[clamp(1.25rem,2.4vw,2rem)] font-medium tracking-[-0.03em]">
              Le magasin n’est plus un lieu de vente.
              <br />
              C’est une expérience.
            </p>
            <p className="mt-4 max-w-xl text-base leading-relaxed text-white/60 sm:text-lg">
              Préparez le titre professionnel Manager d’établissement marchand et apprenez à
              concevoir des expériences client qui font revenir, en magasin comme en ligne.
            </p>

            <div className="mt-8 flex flex-wrap gap-2">
              {["Bac+2", "Alternance", "Caen", "Rentrée sept. 2027", "Retail Experience"].map(
                (item) => (
                  <span
                    key={item}
                    className="rounded-full border border-white/15 bg-white/[0.06] px-4 py-2 text-xs font-medium backdrop-blur"
                  >
                    {item}
                  </span>
                ),
              )}
            </div>

            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/ecole/candidater?track=mem&specialization=retail_experience"
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
              1 titre professionnel + une spécialisation validée par des Open Badges.
            </p>
          </div>

          <div className="mt-14 grid gap-4 md:grid-cols-3">
            {[
              {
                number: "01",
                icon: GraduationCap,
                title: "Une certification de niveau 5",
                text: "Manager d’établissement marchand, organisé en 3 CCP. RNCP 41853 · Ministère du Travail.",
              },
              {
                number: "02",
                icon: Store,
                title: "Une spécialisation métier",
                text: "Retail Experience, conçue avec des professionnels du commerce et de l’expérience client.",
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
                  RE
                </div>
                <div>
                  <h2 className="text-[clamp(2.3rem,4.5vw,4.4rem)] font-semibold leading-[0.94] tracking-[-0.055em]">
                    Retail Experience.
                  </h2>
                  <p className="mt-3 max-w-md text-base leading-relaxed text-white/55">
                    Concevoir l’expérience. Faire revenir le client.
                  </p>
                </div>
              </div>
            </div>
            <div className="text-base leading-relaxed text-white/60">
              <p>
                La spécialisation Retail Experience développe des compétences complémentaires au
                titre MEM pour concevoir, animer et mesurer l’expérience client d’un point de
                vente, du premier clic au retour en magasin.
              </p>
              <p className="mt-4">
                Parcours client, magasin connecté, fidélisation, communauté, données et
                intelligence artificielle : faire du point de vente un lieu où l’on vient, revient
                et recommande. Chaque compétence est validée par un Open Badge Byound.
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
          <SectionEyebrow>Référentiel MEM</SectionEyebrow>
          <h2 className="mt-4 text-[clamp(2.4rem,4vw,4rem)] font-semibold tracking-[-0.05em] text-[#070b1f]">
            Compétences certifiées.
          </h2>
          <p className="mt-4 max-w-2xl text-sm text-black/50">
            CCP validables séparément · 3 activités types · 10 compétences professionnelles
          </p>

          <div className="mt-12 grid gap-5 lg:grid-cols-3">
            {ccps.map((ccp) => (
              <article
                key={ccp.code}
                className="rounded-[28px] border border-black/[0.07] bg-white p-7 sm:p-8"
              >
                <span className="rounded-full bg-[#5146e5] px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-white">
                  {ccp.code}
                </span>
                <h3 className="mt-6 text-lg font-semibold tracking-[-0.025em] text-[#070b1f]">
                  {ccp.title}
                </h3>
                <ul className="mt-6 space-y-3">
                  {ccp.items.map((item) => (
                    <li key={item} className="flex gap-3 text-sm leading-relaxed text-black/55">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#5146e5]" />
                      {item}
                    </li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
          <MemEvaluationSection specialization="Retail Experience" />
        </div>
      </section>

      <section className="bg-white py-20 sm:py-28">
        <div className="mx-auto grid max-w-7xl gap-12 px-5 sm:px-8 lg:grid-cols-2 lg:px-10">
          <div>
            <SectionEyebrow>Le projet Retail Experience</SectionEyebrow>
            <h2 className="mt-4 text-[clamp(2.3rem,4vw,3.8rem)] font-semibold leading-[1] tracking-[-0.05em] text-[#070b1f]">
              Observer. Imaginer. Faire revenir.
            </h2>
            <p className="mt-5 max-w-xl text-base leading-relaxed text-black/55">
              Une enseigne veut redonner envie à ses clients de venir en magasin. L’apprenant
              observe son point de vente et réinvente l’expérience.
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
              {["Ateliers", "Cas réels", "Labo retail", "Challenges"].map((item) => (
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
              Dans l’univers du retail.
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
              Grande distribution · Enseignes spécialisées · Prêt-à-porter · Beauté · Maison et
              décoration · Commerce connecté.
            </p>
            <p className="mt-3 text-sm leading-relaxed text-black/50">
              Et après ? Bac+3 Responsable d’établissement marchand (REM).
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
                Prêt à faire revenir le client ?
              </h2>
              <div className="mt-10 grid gap-4 sm:grid-cols-3">
                {[
                  ["Niveau d’entrée", "Niveau 4 — Bac ou équivalent"],
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
                12 mois · 1 jour par semaine ou 1 semaine par mois en centre · Caen · Présentiel
                et/ou distanciel. Coût : 7 900 € TTC — gratuit pour l’alternant (prise en charge
                OPCO). Délai d’accès : jusqu’à 3 mois après la rentrée.
              </p>
            </div>

            <div className="rounded-[28px] border border-white/10 bg-white/[0.06] p-7 backdrop-blur sm:p-9">
              <BriefcaseBusiness className="h-7 w-7 text-[#8c86ff]" strokeWidth={1.5} />
              <h3 className="mt-8 text-2xl font-semibold tracking-[-0.03em]">
                Candidater à Retail Experience
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-white/50">
                Déposez votre dossier en ligne. L’équipe Byound School vous recontacte pour la
                suite.
              </p>
              <a
                href="/ecole/candidater?track=mem&specialization=retail_experience"
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
      <AlternantsRecruitingSection cursus="Retail Experience" />
    </EdgePremiumShell>
  );
}
