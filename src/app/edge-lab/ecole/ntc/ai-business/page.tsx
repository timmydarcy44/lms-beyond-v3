import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  BrainCircuit,
  BriefcaseBusiness,
  Check,
  CheckCircle2,
  GraduationCap,
} from "lucide-react";

import { NtcEvaluationSection } from "@/components/edge-site/cfa/ntc-evaluation-section";
import { ProgramFactsCard } from "@/components/edge-site/cfa/program-facts-card";
import { EdgePremiumShell } from "@/components/edge-site/premium/edge-premium-shell";
import { getByoundProgramFacts } from "@/lib/byound-school/program-facts-server";
import { EDGE_PREMIUM_IMAGES } from "@/lib/edge-site/premium-constants";

export const metadata: Metadata = {
  title: "NTC · AI Business — Byound School",
  description:
    "Préparez le titre professionnel Négociateur technico-commercial et développez une spécialisation en intelligence artificielle appliquée au business.",
};

const fundamentals = [
  {
    number: "01",
    title: "Stratégie & marché",
    items: [
      "Veille commerciale",
      "Marché et concurrence",
      "Segmentation et ciblage",
      "Personas",
      "Opportunités commerciales",
      "Plan d’actions commerciales",
    ],
  },
  {
    number: "02",
    title: "Prospection & acquisition",
    items: [
      "Prospection multicanale",
      "Social selling",
      "Qualification des prospects",
      "Construction d’un portefeuille",
      "Inbound / outbound",
      "Suivi et actions correctives",
    ],
  },
  {
    number: "03",
    title: "Vente & négociation",
    items: [
      "Analyse du besoin",
      "Proposition technique et commerciale",
      "Argumentation",
      "Négociation B2B",
      "Objections et closing",
      "Communication commerciale",
    ],
  },
  {
    number: "04",
    title: "Expérience client",
    items: [
      "CRM et suivi client",
      "Fidélisation",
      "Expérience client",
      "Développement du portefeuille",
      "Pilotage de l’activité",
      "Reporting et KPI",
    ],
  },
] as const;

const badges = [
  {
    code: "AP",
    title: "AI Prospecting",
    description: "Prospecter, segmenter et qualifier avec l’IA.",
    image:
      "https://zmcefidiiqqppowymoqb.supabase.co/storage/v1/object/public/App/Badges/AI%20Business/Byound%20AI%20Prospecting.png",
  },
  {
    code: "AS",
    title: "AI Sales",
    description: "Préparer, personnaliser et optimiser la vente avec l’IA.",
    image:
      "https://zmcefidiiqqppowymoqb.supabase.co/storage/v1/object/public/App/Badges/AI%20Business/Byound%20AI%20Sales.png",
  },
  {
    code: "SA",
    title: "Sales Automation",
    description: "Concevoir et automatiser des workflows commerciaux.",
    image:
      "https://zmcefidiiqqppowymoqb.supabase.co/storage/v1/object/public/App/Badges/AI%20Business/Byound%20Sales%20Automation.png",
  },
  {
    code: "BP",
    title: "AI Business Performance",
    description: "Exploiter data et IA pour améliorer la performance.",
    image:
      "https://zmcefidiiqqppowymoqb.supabase.co/storage/v1/object/public/App/Badges/AI%20Business/Byound%20AI%20Business%20Performance.png",
  },
] as const;

const AI_BUSINESS_BADGE =
  "https://zmcefidiiqqppowymoqb.supabase.co/storage/v1/object/public/App/Badges/AI%20Business/Byound%20AI%20Business.png";

const jobs = [
  "Business Developer",
  "Commercial B2B",
  "Chargé de développement commercial",
  "Technico-commercial",
  "Chargé d’affaires",
  "Sales Account Executive",
  "Key Account Manager",
  "Responsable grands comptes",
] as const;

function SectionEyebrow({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-[#5146e5]">
      {children}
    </p>
  );
}

export default async function NtcAiBusinessPage() {
  const facts = await getByoundProgramFacts("ai_business");
  return (
    <EdgePremiumShell overlayNav showTopBar={false}>
      <section className="relative isolate min-h-[92svh] overflow-hidden bg-[#070b1f] text-white">
        <div
          className="absolute inset-y-0 right-0 w-full bg-cover bg-center opacity-30 lg:w-[58%]"
          style={{ backgroundImage: `url("${EDGE_PREMIUM_IMAGES.business}")` }}
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
              Byound School · Bac+2 · Alternance
            </p>
            <h1 className="mt-7 text-[clamp(3.7rem,8vw,7.5rem)] font-semibold leading-[0.84] tracking-[-0.065em]">
              NTC
              <span className="text-[#7770ff]">·</span>
              <br />
              AI Business
            </h1>
            <p className="mt-8 text-[clamp(1.25rem,2.4vw,2rem)] font-medium tracking-[-0.03em]">
              Le commerce entre dans une nouvelle ère.
            </p>
            <p className="mt-4 max-w-xl text-base leading-relaxed text-white/60 sm:text-lg">
              Préparez le titre professionnel Négociateur technico-commercial et développez une
              expertise en intelligence artificielle appliquée au business.
            </p>

            <div className="mt-8 flex flex-wrap gap-2">
              {["Bac+2", "Alternance", "Caen", "Rentrée 2027", "AI Business"].map((item) => (
                <span
                  key={item}
                  className="rounded-full border border-white/15 bg-white/[0.06] px-4 py-2 text-xs font-medium backdrop-blur"
                >
                  {item}
                </span>
              ))}
            </div>

            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/ecole/candidater?track=ntc&specialization=ai_business"
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
              Un diplôme reconnu, une expertise métier actuelle et des compétences vérifiables
              auprès des employeurs.
            </p>
          </div>

          <div className="mt-14 grid gap-4 md:grid-cols-3">
            {[
              {
                number: "01",
                icon: GraduationCap,
                title: "Une certification de niveau 5",
                text: "Titre professionnel Négociateur technico-commercial, organisé en deux CCP.",
              },
              {
                number: "02",
                icon: BrainCircuit,
                title: "Une spécialisation métier",
                text: "AI Business, conçue avec des experts métiers et pensée pour les nouveaux usages.",
              },
              {
                number: "03",
                icon: BadgeCheck,
                title: "Des preuves vérifiables",
                text: "Des Open Badges numériques, partageables et associés à des critères précis.",
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
                <div className="relative h-24 w-24 shrink-0 sm:h-28 sm:w-28">
                  <Image
                    src={AI_BUSINESS_BADGE}
                    alt="Badge de spécialisation Byound AI Business"
                    fill
                    sizes="112px"
                    className="object-contain drop-shadow-[0_14px_28px_rgba(0,0,0,0.35)]"
                  />
                </div>
                <div>
                  <h2 className="text-[clamp(2.5rem,5vw,5rem)] font-semibold leading-[0.92] tracking-[-0.055em]">
                    AI Business.
                  </h2>
                  <p className="mt-3 max-w-md text-base leading-relaxed text-white/55">
                    Des compétences conçues avec le terrain. Validées par la preuve.
                  </p>
                </div>
              </div>
            </div>
            <div className="text-base leading-relaxed text-white/60">
              <p>
                La spécialisation AI Business développe des compétences complémentaires au titre
                NTC, pensées et conçues avec des experts métiers pour répondre aux nouveaux usages
                de l’intelligence artificielle dans le développement commercial.
              </p>
              <p className="mt-4">
                Chaque compétence fait l’objet d’une validation et peut donner lieu à l’obtention
                d’un Open Badge Byound, pour matérialiser et valoriser les acquis.
              </p>
            </div>
          </div>

          <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {badges.map((badge) => (
              <article
                key={badge.code}
                className="rounded-[24px] border border-white/10 bg-white/[0.05] p-5 backdrop-blur transition hover:-translate-y-1 hover:bg-white/[0.08]"
              >
                <div className="relative mx-auto aspect-square w-full max-w-[120px]">
                  <Image
                    src={badge.image}
                    alt={`Open Badge Byound ${badge.title}`}
                    fill
                    sizes="120px"
                    className="object-contain drop-shadow-[0_18px_35px_rgba(0,0,0,0.35)]"
                  />
                </div>
                <p className="mt-5 text-[10px] font-semibold uppercase tracking-[0.2em] text-[#8c86ff]">
                  Open Badge · {badge.code}
                </p>
                <h3 className="mt-2 text-base font-semibold">{badge.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-white/50">{badge.description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="programme" className="scroll-mt-28 bg-white py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
          <SectionEyebrow>Le programme</SectionEyebrow>
          <h2 className="mt-4 text-[clamp(2.4rem,4vw,4rem)] font-semibold tracking-[-0.05em] text-[#070b1f]">
            Les fondamentaux du métier.
          </h2>

          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
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
          <SectionEyebrow>Référentiel NTC</SectionEyebrow>
          <h2 className="mt-4 text-[clamp(2.4rem,4vw,4rem)] font-semibold tracking-[-0.05em] text-[#070b1f]">
            Compétences certifiées.
          </h2>

          <div className="mt-12 grid gap-5 lg:grid-cols-2">
            {[
              {
                code: "CCP 01",
                title: "Élaborer une stratégie de prospection et la mettre en œuvre",
                items: [
                  "Assurer une veille commerciale",
                  "Concevoir et organiser un plan d’actions commerciales",
                  "Prospecter un secteur défini",
                  "Analyser ses performances et élaborer des actions correctives",
                ],
              },
              {
                code: "CCP 02",
                title: "Négocier une solution technique et commerciale et consolider l’expérience client",
                items: [
                  "Représenter l’entreprise et valoriser son image",
                  "Concevoir une proposition technique et commerciale",
                  "Négocier une solution technique et commerciale",
                  "Réaliser le bilan, ajuster son activité et optimiser la relation client",
                ],
              },
            ].map((ccp) => (
              <article
                key={ccp.code}
                className="rounded-[28px] border border-black/[0.07] bg-white p-7 sm:p-9"
              >
                <span className="rounded-full bg-[#5146e5] px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-white">
                  {ccp.code}
                </span>
                <h3 className="mt-6 max-w-xl text-xl font-semibold tracking-[-0.025em] text-[#070b1f]">
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
          <NtcEvaluationSection />
        </div>
      </section>

      <section className="bg-white py-20 sm:py-28">
        <div className="mx-auto grid max-w-7xl gap-12 px-5 sm:px-8 lg:grid-cols-2 lg:px-10">
          <div>
            <SectionEyebrow>Apprendre en faisant</SectionEyebrow>
            <h2 className="mt-4 text-[clamp(2.3rem,4vw,3.8rem)] font-semibold leading-[1] tracking-[-0.05em] text-[#070b1f]">
              Learn. Build. Prove.
            </h2>
            <p className="mt-5 max-w-xl text-base leading-relaxed text-black/55">
              Une entreprise vous confie un nouveau marché. L’apprenant construit le projet
              commercial, augmenté par l’IA : analyser, cibler, stratégiser, utiliser l’IA,
              automatiser, proposer et mesurer.
            </p>
            <div className="mt-8 grid grid-cols-2 gap-3">
              {["Ateliers", "Cas réels", "AI Lab", "Challenges"].map((item) => (
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
              Les métiers de demain.
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
              Et après ? Poursuite d’études possible vers un Bac+3, notamment en développement
              commercial.
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
              <h2 className="mt-5 text-[clamp(2.8rem,5vw,5.5rem)] font-semibold leading-[0.92] tracking-[-0.055em]">
                Prêt à entrer dans la nouvelle ère du business ?
              </h2>
              <div className="mt-10 grid gap-4 sm:grid-cols-3">
                {[
                  ["Niveau d’entrée", "Niveau 4 — Bac ou équivalent"],
                  ["Prérequis", "Diplôme ou titre de niveau 4"],
                  ["Admission", "Dossier · Entretien · Positionnement"],
                ].map(([label, value]) => (
                  <div key={label} className="border-t border-white/15 pt-4">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/35">
                      {label}
                    </p>
                    <p className="mt-2 text-sm leading-relaxed text-white/75">{value}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[28px] border border-white/10 bg-white/[0.06] p-7 backdrop-blur sm:p-9">
              <BriefcaseBusiness className="h-7 w-7 text-[#8c86ff]" strokeWidth={1.5} />
              <h3 className="mt-8 text-2xl font-semibold tracking-[-0.03em]">
                Candidater à AI Business
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-white/50">
                Échangez avec l’équipe Byound School et soyez informé en priorité de l’ouverture
                des admissions.
              </p>
              <a
                href="/ecole/candidater?track=ntc&specialization=ai_business"
                className="mt-8 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-white px-6 text-sm font-semibold text-[#070b1f] transition hover:bg-white/90"
              >
                Démarrer ma candidature
                <ArrowRight className="h-4 w-4" />
              </a>
              <p className="mt-5 flex items-start gap-2 text-xs leading-relaxed text-white/35">
                <Check className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                Formation accessible aux personnes en situation de handicap selon les besoins et
                adaptations nécessaires.
              </p>
            </div>
          </div>
        </div>
      </section>
    </EdgePremiumShell>
  );
}
