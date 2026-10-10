import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  BriefcaseBusiness,
  Check,
  CheckCircle2,
  GraduationCap,
  Trophy,
} from "lucide-react";

import { NtcEvaluationSection } from "@/components/edge-site/cfa/ntc-evaluation-section";
import { ProgramContributorsSection } from "@/components/edge-site/cfa/program-contributors-section";
import { ProgramFactsCard } from "@/components/edge-site/cfa/program-facts-card";
import { EdgePremiumShell } from "@/components/edge-site/premium/edge-premium-shell";
import { getByoundProgramFacts } from "@/lib/byound-school/program-facts-server";
import { getContributorByLastName, getProgramContributors, type ProgramContributor } from "@/lib/expert/program-contributors";

export const metadata: Metadata = {
  title: "NTC · Business Sport — Byound School",
  description:
    "Préparez le titre professionnel Négociateur technico-commercial et développez le business de l’écosystème sportif.",
};

const HERO =
  "https://images.unsplash.com/photo-1461896836934-ffe607ba6851?auto=format&fit=crop&w=1800&q=80";

const SPORT_BADGE =
  "https://zmcefidiiqqppowymoqb.supabase.co/storage/v1/object/public/App/Badges/Business%20Sport/business-sport-dore.png";

const badges = [
  {
    code: "SE",
    title: "Sport Ecosystem",
    description: "Comprendre et analyser l’écosystème économique du sport.",
    image:
      "https://zmcefidiiqqppowymoqb.supabase.co/storage/v1/object/public/App/Badges/Business%20Sport/sport-ecosystem.png",
  },
  {
    code: "BD",
    title: "Sport Business Development",
    description: "Identifier et développer les opportunités commerciales dans l’industrie du sport.",
    image:
      "https://zmcefidiiqqppowymoqb.supabase.co/storage/v1/object/public/App/Badges/Business%20Sport/sport-business-development.png",
  },
  {
    code: "SP",
    title: "Sponsorship & Partnerships",
    description: "Concevoir, commercialiser et négocier des partenariats sportifs.",
    image:
      "https://zmcefidiiqqppowymoqb.supabase.co/storage/v1/object/public/App/Badges/Business%20Sport/sponsorship-partnerships.png",
  },
  {
    code: "AP",
    title: "Sport Activation & Performance",
    description: "Activer les partenariats et mesurer leur performance.",
    image:
      "https://zmcefidiiqqppowymoqb.supabase.co/storage/v1/object/public/App/Badges/Business%20Sport/sport-activation-performance.png",
  },
] as const;

const fundamentals = [
  {
    number: "01",
    title: "Stratégie & marché",
    items: ["Veille commerciale", "Marché et concurrence", "Segmentation et ciblage", "Personas", "Opportunités commerciales", "Plan d’actions commerciales"],
  },
  {
    number: "02",
    title: "Prospection & acquisition",
    items: ["Prospection multicanale", "Social selling", "Qualification des prospects", "Construction d’un portefeuille", "Inbound / outbound", "Suivi et actions correctives"],
  },
  {
    number: "03",
    title: "Vente & négociation",
    items: ["Analyse du besoin", "Proposition technique et commerciale", "Argumentation", "Négociation B2B", "Objections et closing", "Communication commerciale"],
  },
  {
    number: "04",
    title: "Expérience client",
    items: ["CRM et suivi client", "Fidélisation", "Expérience client", "Développement du portefeuille", "Pilotage de l’activité", "Reporting et KPI"],
  },
] as const;

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

const ecosystem = [
  "Clubs",
  "Fédérations",
  "Ligues",
  "Équipementiers",
  "Marques",
  "Agences",
  "Événementiel",
  "Infrastructures",
  "SportTech",
] as const;

const projectSteps = ["Analyser", "Cartographier", "Cibler", "Construire l’offre", "Prospecter", "Négocier", "Activer et mesurer"] as const;

const YANNICK_GRELIN: ProgramContributor = {
  id: "yannick-grelin",
  name: "Yannick GRELIN",
  jobTitle: "Responsable commercial hospitalité, Racing 92",
  photoUrl: null,
  companyLogoUrl: null,
  roles: ["expert"],
};

function SectionEyebrow({ children }: { children: React.ReactNode }) {
  return <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-[#5146e5]">{children}</p>;
}

export default async function NtcBusinessSportPage() {
  const [facts, contributors, yannick] = await Promise.all([
    getByoundProgramFacts("sport_business"),
    getProgramContributors("Business Sport"),
    getContributorByLastName("grelin"),
  ]);
  const referenced = yannick
    ? {
        ...yannick,
        jobTitle: yannick.jobTitle && yannick.jobTitle !== "Formateur CFA" ? yannick.jobTitle : YANNICK_GRELIN.jobTitle,
        photoUrl: yannick.photoUrl || YANNICK_GRELIN.photoUrl,
      }
    : YANNICK_GRELIN;
  const coBuilders = [referenced, ...contributors.filter((person) => person.id !== referenced.id && !person.name.toLowerCase().includes("grelin"))];

  return (
    <EdgePremiumShell overlayNav showTopBar={false}>
      <section className="relative isolate min-h-[92svh] overflow-hidden bg-[#070b1f] text-white">
        <div className="absolute inset-y-0 right-0 w-full bg-cover bg-center opacity-35 lg:w-[58%]" style={{ backgroundImage: `url("${HERO}")` }} aria-hidden />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,#070b1f_0%,rgba(7,11,31,.96)_40%,rgba(7,11,31,.38)_78%,rgba(7,11,31,.7)_100%)]" aria-hidden />
        <div className="relative mx-auto flex min-h-[92svh] max-w-7xl items-end px-5 pb-16 pt-32 sm:px-8 sm:pb-20 lg:px-10 lg:pb-24">
          <div className="grid w-full items-end gap-10 lg:grid-cols-[1.15fr_.85fr]">
            <div className="max-w-3xl">
              <p className="text-[11px] font-semibold uppercase tracking-[0.26em] text-white/55">Byound School · Bac+2 · Alternance</p>
              <h1 className="mt-7 text-[clamp(3.7rem,8vw,7.5rem)] font-semibold leading-[0.84] tracking-[-0.065em]">
                NTC
                <span className="text-[#7770ff]">·</span>
                <br />
                Business Sport
              </h1>
              <p className="mt-8 text-[clamp(1.25rem,2.4vw,2rem)] font-medium tracking-[-0.03em]">
                Le sport est une passion.
                <br />
                Apprenez-en le business.
              </p>
              <p className="mt-4 max-w-xl text-base leading-relaxed text-white/60 sm:text-lg">
                Préparez le titre professionnel Négociateur technico-commercial et développez une expertise du développement commercial appliqué à l’écosystème du sport.
              </p>
              <div className="mt-8 flex flex-wrap gap-2">
                {["Bac+2", "Alternance", "Caen", "Business Sport"].map((item) => (
                  <span key={item} className="rounded-full border border-white/15 bg-white/[0.06] px-4 py-2 text-xs font-medium backdrop-blur">
                    {item}
                  </span>
                ))}
              </div>
              <p className="mt-5 text-sm text-white/55">1 titre professionnel + une spécialisation validée par des Open Badges.</p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link href="/ecole/candidater?track=ntc&specialization=sport_business" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-white px-7 text-sm font-semibold text-[#070b1f] transition hover:bg-white/90">
                  Candidater
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link href="#programme" className="inline-flex min-h-12 items-center justify-center rounded-full border border-white/20 bg-white/[0.04] px-7 text-sm font-semibold transition hover:bg-white/[0.1]">
                  Découvrir le programme
                </Link>
              </div>
            </div>
            <div className="hidden rounded-[28px] border border-white/10 bg-white/[0.06] p-6 backdrop-blur lg:block">
              <div className="relative mx-auto aspect-square w-full max-w-[220px]">
                <Image src={badges[2].image} alt="Open Badge Sponsorship & Partnerships" fill sizes="220px" className="object-contain" />
              </div>
              <p className="mt-4 text-[10px] font-semibold uppercase tracking-[0.2em] text-[#8c86ff]">Alternance · Caen</p>
              <p className="mt-2 text-xl font-semibold tracking-[-0.03em]">Développer le business du sport.</p>
            </div>
          </div>
        </div>
      </section>

      <ProgramFactsCard facts={facts} />

      <nav className="sticky top-16 z-30 border-b border-black/[0.06] bg-white/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl gap-7 overflow-x-auto px-5 py-4 text-xs font-semibold uppercase tracking-[0.18em] text-black/45 sm:px-8 lg:px-10">
          <a className="whitespace-nowrap transition hover:text-black" href="#programme">Programme</a>
          <a className="whitespace-nowrap transition hover:text-black" href="#specialisation">Spécialisation</a>
          <a className="whitespace-nowrap transition hover:text-black" href="#certification">Certification</a>
          <a className="whitespace-nowrap transition hover:text-black" href="#admission">Admission</a>
        </div>
      </nav>

      <section className="bg-[#f7f7f5] py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
          <SectionEyebrow>Le modèle Byound</SectionEyebrow>
          <h2 className="mt-4 max-w-4xl text-[clamp(2.5rem,5vw,4.8rem)] font-semibold leading-[0.96] tracking-[-0.055em] text-[#070b1f]">
            Un titre. Une spécialisation. <span className="text-black/30">Des preuves.</span>
          </h2>
          <div className="mt-14 grid gap-4 md:grid-cols-3">
            {[
              { number: "01", icon: GraduationCap, title: "Une certification de niveau 5", text: "Titre professionnel Négociateur technico-commercial, organisé en deux CCP." },
              { number: "02", icon: Trophy, title: "Une spécialisation métier", text: "Business Sport, conçue avec des experts et des acteurs du sport." },
              { number: "03", icon: BadgeCheck, title: "Des preuves vérifiables", text: "Des Open Badges associés à des critères précis et partageables tout au long du parcours." },
            ].map((item, index) => (
              <article key={item.number} className={index === 2 ? "rounded-[28px] bg-[#5146e5] p-7 text-white sm:p-8" : "rounded-[28px] border border-black/[0.06] bg-white p-7 text-[#070b1f] sm:p-8"}>
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
        <div className="relative mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
          <div className="grid gap-8 lg:grid-cols-[.85fr_1.15fr] lg:gap-16">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-[#8c86ff]">Spécialisation Byound</p>
              <div className="mt-5 flex items-center gap-5">
                <div className="relative h-24 w-24 shrink-0 sm:h-28 sm:w-28">
                  <Image src={SPORT_BADGE} alt="Badge de spécialisation Byound Business Sport" fill sizes="112px" className="object-contain" />
                </div>
                <div>
                  <h2 className="text-[clamp(2.5rem,5vw,5rem)] font-semibold leading-[0.92] tracking-[-0.055em]">Business Sport.</h2>
                  <p className="mt-3 max-w-md text-base leading-relaxed text-white/55">Comprendre l’écosystème. Développer le business.</p>
                </div>
              </div>
            </div>
            <div className="text-base leading-relaxed text-white/60">
              <p>
                La spécialisation Business Sport développe des compétences complémentaires au titre NTC pour comprendre les modèles économiques du sport et développer des opportunités commerciales au sein de son écosystème.
              </p>
              <p className="mt-4">
                Clubs, fédérations, marques, agences, médias, événements et SportTech : chaque compétence est validée et peut conduire à l’obtention d’un Open Badge Byound.
              </p>
            </div>
          </div>
          <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {badges.map((badge) => (
              <article key={badge.code} className="rounded-[24px] border border-white/10 bg-white/[0.05] p-5">
                <div className="relative mx-auto aspect-square w-full max-w-[140px]">
                  <Image src={badge.image} alt={`Open Badge ${badge.title}`} fill sizes="140px" className="object-contain" />
                </div>
                <p className="mt-5 text-[10px] font-semibold uppercase tracking-[0.2em] text-[#8c86ff]">Open Badge · {badge.code}</p>
                <h3 className="mt-2 text-base font-semibold">{badge.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-white/50">{badge.description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <ProgramContributorsSection people={coBuilders} title="Ils ont co-construit le référentiel." />

      <section id="programme" className="scroll-mt-28 bg-white py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
          <SectionEyebrow>Le programme</SectionEyebrow>
          <h2 className="mt-4 text-[clamp(2.4rem,4vw,4rem)] font-semibold tracking-[-0.05em] text-[#070b1f]">Les fondamentaux du métier.</h2>
          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {fundamentals.map((block) => (
              <article key={block.number} className="rounded-[24px] bg-[#f2f3fb] p-6">
                <p className="text-xs font-semibold text-[#5146e5]">{block.number}</p>
                <h3 className="mt-3 text-lg font-semibold tracking-[-0.02em] text-[#070b1f]">{block.title}</h3>
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
          <h2 className="mt-4 text-[clamp(2.4rem,4vw,4rem)] font-semibold tracking-[-0.05em] text-[#070b1f]">Compétences certifiées.</h2>
          <div className="mt-12 grid gap-5 lg:grid-cols-2">
            {[
              {
                code: "CCP 01",
                title: "Élaborer une stratégie de prospection et la mettre en œuvre",
                items: ["Assurer une veille commerciale", "Concevoir et organiser un plan d’actions commerciales", "Prospecter un secteur défini", "Analyser ses performances et élaborer des actions correctives"],
              },
              {
                code: "CCP 02",
                title: "Négocier une solution technique et commerciale et consolider l’expérience client",
                items: ["Représenter l’entreprise et valoriser son image", "Concevoir une proposition technique et commerciale", "Négocier une solution technique et commerciale", "Réaliser le bilan, ajuster son activité et optimiser la relation client"],
              },
            ].map((ccp) => (
              <article key={ccp.code} className="rounded-[28px] border border-black/[0.07] bg-white p-7 sm:p-9">
                <span className="rounded-full bg-[#5146e5] px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-white">{ccp.code}</span>
                <h3 className="mt-6 text-xl font-semibold tracking-[-0.025em] text-[#070b1f]">{ccp.title}</h3>
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
            <SectionEyebrow>Le projet Business Sport</SectionEyebrow>
            <h2 className="mt-4 text-[clamp(2.3rem,4vw,3.8rem)] font-semibold leading-[1] tracking-[-0.05em] text-[#070b1f]">Understand. Build. Sell.</h2>
            <p className="mt-5 max-w-xl text-base leading-relaxed text-black/55">
              Un acteur du sport veut développer ses revenus et ses partenaires. L’apprenant analyse son écosystème et construit la stratégie.
            </p>
            <div className="mt-8 grid grid-cols-2 gap-3">
              {projectSteps.map((item, index) => (
                <div key={item} className="rounded-2xl border border-black/[0.07] px-5 py-4 text-sm font-semibold text-[#070b1f]">
                  <span className="mr-2 text-[#5146e5]">{String(index + 1).padStart(2, "0")}</span>
                  {item}
                </div>
              ))}
            </div>
          </div>
          <div>
            <SectionEyebrow>Débouchés</SectionEyebrow>
            <h2 className="mt-4 text-[clamp(2.3rem,4vw,3.8rem)] font-semibold leading-[1] tracking-[-0.05em] text-[#070b1f]">Les métiers du sport business.</h2>
            <div className="mt-8 flex flex-wrap gap-2">
              {jobs.map((job) => (
                <span key={job} className="rounded-full border border-black/10 bg-[#f7f7f5] px-4 py-2.5 text-sm text-black/65">{job}</span>
              ))}
            </div>
            <p className="mt-8 text-[10px] font-semibold uppercase tracking-[0.18em] text-black/35">Dans l’écosystème sportif</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {ecosystem.map((item) => (
                <span key={item} className="rounded-full bg-[#070b1f] px-3 py-1.5 text-xs text-white">{item}</span>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="admission" className="scroll-mt-28 bg-[#070b1f] py-20 text-white sm:py-28">
        <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
          <div className="grid gap-12 lg:grid-cols-[1fr_.8fr] lg:items-end">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-[#8c86ff]">Rentrée septembre 2027</p>
              <h2 className="mt-5 text-[clamp(2.8rem,5vw,5.2rem)] font-semibold leading-[0.92] tracking-[-0.055em]">Prêt à développer le business du sport ?</h2>
              <div className="mt-10 grid gap-4 sm:grid-cols-3">
                {[
                  ["Niveau d’entrée", "Niveau 4 — Bac ou équivalent"],
                  ["Prérequis", "Diplôme ou titre de niveau 4, expression écrite et orale en français"],
                  ["Admission", "Dossier · Entretien · Positionnement"],
                  ["Campus", "Caen"],
                  ["Modalité", "Présentiel ou hybride"],
                  ["Après la formation", "Poursuite d’études possible vers un Bac+3"],
                ].map(([label, value]) => (
                  <div key={label} className="border-t border-white/15 pt-4">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/35">{label}</p>
                    <p className="mt-2 text-sm leading-relaxed text-white/75">{value}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-[28px] border border-white/10 bg-white/[0.06] p-7 backdrop-blur sm:p-9">
              <BriefcaseBusiness className="h-7 w-7 text-[#8c86ff]" strokeWidth={1.5} />
              <h3 className="mt-8 text-2xl font-semibold tracking-[-0.03em]">Candidater à Business Sport</h3>
              <p className="mt-3 text-sm leading-relaxed text-white/50">Échangez avec l’équipe Byound School pour préparer votre admission.</p>
              <a href="/ecole/candidater?track=ntc&specialization=sport_business" className="mt-8 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-white px-6 text-sm font-semibold text-[#070b1f]">
                Démarrer ma candidature
                <ArrowRight className="h-4 w-4" />
              </a>
              <p className="mt-5 flex items-start gap-2 text-xs leading-relaxed text-white/35">
                <Check className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                Locaux accessibles aux personnes en situation de handicap. Nos outils (LMS) sont également neuro-adaptatifs.
              </p>
            </div>
          </div>
        </div>
      </section>
    </EdgePremiumShell>
  );
}
