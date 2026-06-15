"use client";

import Link from "next/link";
import { ArrowRight, ArrowUp, Check, QrCode, Shield, Share2, Sparkles, Smartphone } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import {
  MockupBeyondIndex,
  MockupIARecommendations,
  MockupRadarCompetences,
} from "@/components/marketing/beyond-product-mockups";
import { beyondBtnPrimaryOnDark } from "@/components/marketing/beyond-design-system";

const familyStyles = {
  ia: {
    bg: "from-[#1e3a8a] via-[#2563eb] to-[#1d4ed8]",
    glow: "shadow-blue-500/30",
    accent: "text-blue-200",
  },
  product: {
    bg: "from-[#4c1d95] via-[#7c3aed] to-[#6d28d9]",
    glow: "shadow-violet-500/30",
    accent: "text-violet-200",
  },
  leadership: {
    bg: "from-[#14532d] via-[#16a34a] to-[#15803d]",
    glow: "shadow-emerald-500/30",
    accent: "text-emerald-200",
  },
  sales: {
    bg: "from-[#9a3412] via-[#ea580c] to-[#c2410c]",
    glow: "shadow-orange-500/30",
    accent: "text-orange-200",
  },
} as const;

function PremiumSkillCard({
  title,
  level,
  family,
  familyLabel,
  className,
}: {
  title: string;
  level: string;
  family: keyof typeof familyStyles;
  familyLabel?: string;
  className?: string;
}) {
  const style = familyStyles[family];
  return (
    <div
      className={cn(
        "relative mx-auto w-full max-w-[300px] overflow-hidden rounded-[24px] bg-gradient-to-br p-6 shadow-2xl ring-1 ring-white/10",
        style.bg,
        style.glow,
        className
      )}
    >
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-tr from-white/25 via-transparent to-transparent opacity-50" />
      <div className="relative">
        <p className={cn("text-[11px] font-medium uppercase tracking-[0.12em]", style.accent)}>
          {familyLabel ?? family}
        </p>
        <p className="mt-3 text-2xl font-semibold tracking-tight text-white">{title}</p>
        <p className="mt-1 text-sm text-white/70">{level}</p>
        <div className="mt-10 flex items-end justify-between border-t border-white/10 pt-4">
          <span className="text-[10px] text-white/40">beyondcenter.fr</span>
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/10">
            <QrCode className="h-5 w-5 text-white/50" />
          </div>
        </div>
      </div>
    </div>
  );
}

function renderLeverVisual(key: string) {
  switch (key) {
    case "radar":
      return <MockupRadarCompetences className="border-0 shadow-none" />;
    case "ia":
      return <MockupIARecommendations className="border-0 shadow-none" />;
    case "skill-card":
      return <PremiumSkillCard title="Leadership" family="leadership" level="Foundation" />;
    case "index":
      return <MockupBeyondIndex className="border-0 shadow-none" />;
    default:
      return null;
  }
}

const leverTabs = [
  {
    key: "cartographier",
    tab: "Cartographier",
    title: "Voir les compétences réelles.",
    description:
      "Identifiez les soft skills, hard skills, écarts et profils clés de votre organisation.",
    benefits: ["Radar de compétences", "Profils individuels", "Écarts critiques"],
    cta: "Explorer la cartographie",
    gradient: "from-[#0d2847] via-[#102A43] to-[#071A2F]",
    visualKey: "radar",
  },
  {
    key: "developper",
    tab: "Développer",
    title: "Recommander les bons parcours.",
    description:
      "Associez chaque profil aux parcours les plus pertinents selon ses besoins et les objectifs de l'organisation.",
    benefits: ["Parcours personnalisés", "Recommandations IA", "Priorités de progression"],
    cta: "Voir les recommandations",
    gradient: "from-[#1a1040] via-[#102A43] to-[#071A2F]",
    visualKey: "ia",
  },
  {
    key: "reconnaitre",
    tab: "Reconnaître",
    title: "Transformer les acquis en preuves.",
    description:
      "Valorisez les compétences validées avec des cartes vérifiables et partageables.",
    benefits: ["Open Badges", "Cartes de compétences", "Wallet personnel"],
    cta: "Découvrir les cartes",
    gradient: "from-[#0a2e1a] via-[#102A43] to-[#071A2F]",
    visualKey: "skill-card",
  },
  {
    key: "decider",
    tab: "Décider",
    title: "Prioriser avec la donnée.",
    description:
      "Aidez les directions, RH et responsables pédagogiques à décider où agir en priorité.",
    benefits: ["Score de maturité", "Analytics", "Actions recommandées"],
    cta: "Faire le Beyond Index",
    gradient: "from-[#0a2040] via-[#102A43] to-[#071A2F]",
    visualKey: "index",
  },
] as const;

const badgeCards = [
  { title: "AI Prompting", family: "Intelligence artificielle", level: "Advanced", familyKey: "ia" as const },
  { title: "Product Builder", family: "Product", level: "Practitioner", familyKey: "product" as const },
  { title: "Leadership", family: "Management", level: "Foundation", familyKey: "leadership" as const },
  { title: "Modern Prospecting", family: "Vente", level: "Advanced", familyKey: "sales" as const },
];

function StackedSkillCards() {
  return (
    <div className="grid gap-5 sm:grid-cols-2">
      {badgeCards.map((card) => (
        <PremiumSkillCard
          key={card.title}
          title={card.title}
          level={card.level}
          family={card.familyKey}
          familyLabel={card.family}
          className="max-w-none transition duration-300 hover:-translate-y-1"
        />
      ))}
    </div>
  );
}

export function BeyondLeversSection() {
  const [active, setActive] = useState(0);
  const lever = leverTabs[active];

  return (
    <section id="solutions" className="overflow-hidden bg-[#F8FAFC] py-28 md:py-40">
      <div className="mx-auto max-w-6xl px-5 md:px-8">
        <h2 className="text-center text-[clamp(1.75rem,3.5vw,2.75rem)] font-semibold tracking-tight text-[#0F172A]">
          Une plateforme. Quatre leviers.
        </h2>

        {/* Tabs desktop horizontal / mobile scroll */}
        <div className="mt-10 flex gap-2 overflow-x-auto pb-2 [scrollbar-width:none] md:justify-center [&::-webkit-scrollbar]:hidden">
          {leverTabs.map((tab, i) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActive(i)}
              className={cn(
                "shrink-0 rounded-full px-5 py-2.5 text-sm font-medium transition duration-300",
                active === i
                  ? "bg-[#071A2F] text-white shadow-lg shadow-[#071A2F]/20"
                  : "bg-white text-[#64748B] ring-1 ring-[#E2E8F0] hover:text-[#0F172A]"
              )}
            >
              {tab.tab}
            </button>
          ))}
        </div>

        <div className="mt-12 grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
          {/* Colonne gauche — contenu */}
          <div className="order-2 lg:order-1">
            <div key={lever.key} className="animate-in fade-in duration-500">
              <h3 className="text-[clamp(1.5rem,2.8vw,2.25rem)] font-semibold tracking-tight text-[#0F172A]">
                {lever.title}
              </h3>
              <p className="mt-4 max-w-md text-base leading-relaxed text-[#64748B]">{lever.description}</p>
              <ul className="mt-8 space-y-3">
                {lever.benefits.map((b) => (
                  <li key={b} className="flex items-center gap-3 text-sm text-[#0F172A]">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#071A2F]/5">
                      <Check className="h-3.5 w-3.5 text-[#071A2F]" />
                    </span>
                    {b}
                  </li>
                ))}
              </ul>
              <p className="mt-8 inline-flex items-center gap-2 text-sm font-medium text-[#071A2F]">
                {lever.cta}
                <ArrowRight className="h-4 w-4" />
              </p>
            </div>
          </div>

          {/* Colonne droite — visuel */}
          <div className="order-1 lg:order-2">
            <div
              key={`visual-${lever.key}`}
              className={cn(
                "relative overflow-hidden rounded-[28px] bg-gradient-to-br p-8 shadow-2xl transition duration-500 md:p-10",
                lever.gradient,
                "animate-in fade-in slide-in-from-right-4 duration-500"
              )}
            >
              <div className="relative z-10 flex min-h-[360px] items-center justify-center md:min-h-[420px]">
                {renderLeverVisual(lever.visualKey)}
              </div>
              <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-white/[0.06] blur-3xl" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export function BeyondIndexPromoSection() {
  return (
    <section id="beyond-index" className="relative overflow-hidden bg-[#071A2F] py-28 md:py-40">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(6,182,212,0.12),_transparent_50%)]" />
      <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-5 md:grid-cols-2 md:gap-16 md:px-8">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.25em] text-cyan-400/80">Beyond Index</p>
          <h2 className="mt-4 text-[clamp(1.75rem,3.5vw,2.75rem)] font-semibold tracking-tight text-white">
            Évaluez votre maturité compétences.
          </h2>
          <p className="mt-4 max-w-md text-slate-400">
            Score, radar et recommandations — en quelques minutes.
          </p>
          <Link href="/beyond-index" className={`mt-10 inline-flex ${beyondBtnPrimaryOnDark} gap-2`}>
            Faire le test
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        <div className="mx-auto w-full max-w-sm transition hover:scale-[1.02] md:max-w-md">
          <MockupBeyondIndex />
        </div>
      </div>
    </section>
  );
}

const aiSuggestions = [
  "Quels collaborateurs sont à risque ?",
  "Quels parcours recommander ?",
  "Quelles compétences renforcer ?",
  "Quels badges attribuer ?",
];

export function BeyondAISection() {
  return (
    <section id="beyond-ai" className="bg-white py-28 md:py-40">
      <div className="mx-auto max-w-6xl px-5 md:px-8">
        <div className="grid items-center gap-16 lg:grid-cols-2 lg:gap-24">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.25em] text-[#7C3AED]">Beyond AI</p>
            <h2 className="mt-4 text-[clamp(1.75rem,3.5vw,2.75rem)] font-semibold tracking-tight text-[#0F172A]">
              Transformez les données en décisions.
            </h2>
            <p className="mt-4 text-slate-500">
              Priorisez les bonnes actions grâce à vos données compétences.
            </p>
          </div>
          <div className="overflow-hidden rounded-2xl border border-[#E2E8F0] bg-[#071A2F] shadow-2xl">
            <div className="flex items-center gap-2 border-b border-white/[0.06] px-5 py-3.5">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-violet-500/20">
                <Sparkles className="h-3.5 w-3.5 text-violet-300" />
              </div>
              <span className="text-sm font-medium text-white">Beyond AI</span>
            </div>
            <div className="space-y-3 p-5">
              <div className="rounded-xl bg-white/[0.04] px-4 py-3 text-sm text-slate-300">
                Quels parcours recommander pour mon équipe ?
              </div>
              <div className="rounded-xl border border-violet-500/20 bg-violet-500/[0.08] px-4 py-3 text-sm text-slate-200">
                3 écarts identifiés · 2 parcours recommandés
              </div>
              <div className="flex flex-wrap gap-2">
                {aiSuggestions.map((q) => (
                  <span
                    key={q}
                    className="rounded-full border border-white/10 px-3 py-1 text-[11px] text-slate-500"
                  >
                    {q}
                  </span>
                ))}
              </div>
            </div>
            <div className="border-t border-white/[0.06] p-4">
              <div className="flex items-center gap-2 rounded-xl border border-white/10 px-4 py-3">
                <span className="flex-1 text-sm text-slate-500">Posez votre question…</span>
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-500 text-white">
                  <ArrowUp className="h-4 w-4" />
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

const badgeFeatures = [
  { label: "Vérifiable", icon: Check },
  { label: "Partageable", icon: Share2 },
  { label: "Portable", icon: Smartphone },
  { label: "Sécurisé", icon: Shield },
];

export function BeyondOpenBadgesSection() {
  return (
    <section id="open-badges" className="overflow-hidden bg-[#0a0a0a] py-28 md:py-40">
      <div className="mx-auto max-w-6xl px-5 md:px-8">
        <div className="max-w-2xl">
          <h2 className="text-[clamp(1.75rem,3.5vw,2.75rem)] font-semibold tracking-tight text-white">
            Les compétences méritent mieux qu&apos;un certificat PDF.
          </h2>
          <p className="mt-4 text-base leading-relaxed text-slate-400">
            Beyond transforme chaque compétence validée en carte vérifiable, portable et partageable.
          </p>
        </div>

        <div className="mt-14">
          <StackedSkillCards />
        </div>

        <div className="mt-12 grid grid-cols-2 gap-4 md:grid-cols-4 md:gap-6">
          {badgeFeatures.map(({ label, icon: Icon }) => (
            <div
              key={label}
              className="rounded-2xl border border-white/[0.08] bg-white/[0.03] px-5 py-4 backdrop-blur-sm"
            >
              <Icon className="h-5 w-5 text-white/60" />
              <p className="mt-3 text-sm font-medium text-white">{label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

const walletSkills = [
  { name: "AI Prompting", level: "Advanced", color: "from-blue-500/20 to-blue-600/10 border-blue-500/20" },
  { name: "Product Builder", level: "Practitioner", color: "from-violet-500/20 to-violet-600/10 border-violet-500/20" },
  { name: "Leadership", level: "Foundation", color: "from-emerald-500/20 to-emerald-600/10 border-emerald-500/20" },
  { name: "Communication", level: "Advanced", color: "from-cyan-500/20 to-cyan-600/10 border-cyan-500/20" },
];

export function BeyondWalletSection() {
  return (
    <section id="wallet" className="bg-[#F8FAFC] py-28 md:py-40">
      <div className="mx-auto max-w-6xl px-5 md:px-8">
        <div className="grid items-center gap-16 lg:grid-cols-2 lg:gap-24">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.25em] text-[#64748B]">Wallet compétences</p>
            <h2 className="mt-4 text-[clamp(1.75rem,3.5vw,2.75rem)] font-semibold tracking-tight text-[#0F172A]">
              Chaque personne construit son portefeuille de compétences.
            </h2>
            <p className="mt-4 max-w-md text-base leading-relaxed text-[#64748B]">
              Les collaborateurs, apprenants ou salariés retrouvent leurs compétences validées, leurs cartes,
              leurs niveaux et leur progression dans un espace personnel.
            </p>
          </div>

          <div className="mx-auto w-full max-w-sm">
            <div className="overflow-hidden rounded-[24px] border border-[#E2E8F0] bg-white shadow-2xl shadow-slate-200/60">
              <div className="border-b border-[#E2E8F0] bg-gradient-to-r from-[#071A2F] to-[#0B2442] px-6 py-5">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-cyan-400/30 to-violet-500/30 text-sm font-semibold text-white">
                    MD
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">Marie Dupont</p>
                    <p className="text-[11px] text-slate-400">4 compétences validées</p>
                  </div>
                </div>
              </div>
              <div className="space-y-2.5 p-5">
                {walletSkills.map((skill) => (
                  <div
                    key={skill.name}
                    className={cn(
                      "flex items-center justify-between rounded-xl border bg-gradient-to-r px-4 py-3",
                      skill.color
                    )}
                  >
                    <div>
                      <p className="text-sm font-medium text-[#0F172A]">{skill.name}</p>
                      <p className="text-[11px] text-[#64748B]">{skill.level}</p>
                    </div>
                    <div className="h-8 w-12 rounded-md bg-white/80 shadow-sm ring-1 ring-black/[0.04]" />
                  </div>
                ))}
              </div>
              <div className="border-t border-[#E2E8F0] p-5">
                <button
                  type="button"
                  className="w-full rounded-full border border-[#E2E8F0] bg-[#F8FAFC] py-2.5 text-sm font-medium text-[#0F172A] transition hover:bg-white"
                >
                  Voir le profil public
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export function BeyondAccompagnementSection() {
  const mail =
    "mailto:contact@beyondcenter.fr?subject=Beyond%20Studio%20%E2%80%94%20Accompagnement%20strat%C3%A9gique";
  return (
    <section id="studio" className="border-t border-[#E2E8F0] bg-white py-20 md:py-28">
      <div className="mx-auto max-w-3xl px-5 text-center md:px-8">
        <h2 className="text-2xl font-semibold tracking-tight text-[#0F172A] md:text-3xl">
          Besoin d&apos;aller plus loin ?
        </h2>
        <p className="mt-4 text-base leading-relaxed text-[#64748B] md:text-lg">
          Nos experts vous accompagnent dans la structuration de vos référentiels, parcours, badges et
          stratégies compétences.
        </p>
        <a
          href={mail}
          className="mt-8 inline-flex rounded-full border border-[#E2E8F0] bg-[#F8FAFC] px-7 py-3 text-sm font-medium text-[#0F172A] transition hover:border-[#CBD5E1] hover:bg-white"
        >
          Parler à un expert
        </a>
        <p className="mt-6 text-xs text-[#94A3B8]">Powered by Beyond Studio</p>
      </div>
    </section>
  );
}

export function BeyondPremiumFooter() {
  const demoMail = "mailto:contact@beyondcenter.fr?subject=D%C3%A9mo%20Beyond";
  const contactMail = "mailto:contact@beyondcenter.fr";

  return (
    <footer className="border-t border-[#E2E8F0] bg-white py-16 md:py-20">
      <div className="mx-auto max-w-6xl px-5 md:px-8">
        <div className="grid gap-12 sm:grid-cols-2 lg:grid-cols-5">
          <div className="lg:col-span-1">
            <p className="text-[15px] font-semibold text-[#0F172A]">Beyond</p>
            <p className="mt-2 text-sm text-[#64748B]">Intelligence des compétences</p>
            <a
              href={demoMail}
              className="mt-6 inline-flex rounded-full border border-[#E2E8F0] px-4 py-2 text-xs font-medium text-[#0F172A] transition hover:bg-[#F8FAFC]"
            >
              Demander une démo
            </a>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-[#94A3B8]">Produit</p>
            <ul className="mt-4 space-y-3 text-sm text-[#64748B]">
              <li><Link href="/beyond-index" className="hover:text-[#0F172A]">Beyond Index</Link></li>
              <li><Link href="/#beyond-ai" className="hover:text-[#0F172A]">Beyond AI</Link></li>
              <li><Link href="/#open-badges" className="hover:text-[#0F172A]">Cartes de compétences</Link></li>
              <li><Link href="/#beyond-index" className="hover:text-[#0F172A]">Analytics</Link></li>
            </ul>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-[#94A3B8]">Solutions</p>
            <ul className="mt-4 space-y-3 text-sm text-[#64748B]">
              <li><Link href="/#solutions" className="hover:text-[#0F172A]">Recruter</Link></li>
              <li><Link href="/#solutions" className="hover:text-[#0F172A]">Développer</Link></li>
              <li><Link href="/#open-badges" className="hover:text-[#0F172A]">Reconnaître</Link></li>
              <li><Link href="/#beyond-ai" className="hover:text-[#0F172A]">Décider</Link></li>
            </ul>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-[#94A3B8]">Ressources</p>
            <ul className="mt-4 space-y-3 text-sm text-[#64748B]">
              <li><Link href="/login" className="hover:text-[#0F172A]">Documentation</Link></li>
              <li><a href="https://beyondcenter.fr" className="hover:text-[#0F172A]">Blog</a></li>
              <li><a href={contactMail} className="hover:text-[#0F172A]">Contact</a></li>
            </ul>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-[#94A3B8]">Compte</p>
            <ul className="mt-4 space-y-3 text-sm text-[#64748B]">
              <li><Link href="/login" className="hover:text-[#0F172A]">Connexion</Link></li>
              <li><Link href="/prix" className="hover:text-[#0F172A]">Tarifs</Link></li>
            </ul>
          </div>
        </div>
        <p className="mt-14 border-t border-[#E2E8F0] pt-8 text-xs text-[#94A3B8]">
          © {new Date().getFullYear()} Beyond · contact@beyondcenter.fr
        </p>
      </div>
    </footer>
  );
}
