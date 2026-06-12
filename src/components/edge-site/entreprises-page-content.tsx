"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { Check, Puzzle, TrendingUp, User, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import { EdgeButton } from "@/components/edge-site/edge-button";
import { EntrepriseContactForm } from "@/components/edge-site/entreprise-contact-form";
import { SectionLabel } from "@/components/edge-site/section-label";

const EDGE_RED = "#E63329";
const EDGE_BLACK = "#0A0A0A";

const fadeUp = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-60px" },
  transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] },
};

const STATS = [
  {
    value: "70%",
    text: "des formations n'ont aucun impact mesurable après 6 mois",
    source: "McKinsey",
  },
  {
    value: "32%",
    text: "des dirigeants doutent du ROI de leurs actions de formation",
    source: "Rise Up 2025",
  },
  {
    value: "1 sur 2",
    text: "collaborateurs estiment que leur dernière formation ne les a pas rendus plus performants",
    source: null,
  },
] as const;

const STEPS = [
  {
    step: "ÉTAPE 1",
    image: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=900&q=80",
    title: "On audite vos compétences",
    text: "Chaque collaborateur reçoit un accès Beyond. En 12 minutes, il passe le diagnostic comportemental et compétences. Les résultats arrivent directement sur votre dashboard RH.",
  },
  {
    step: "ÉTAPE 2",
    image: "https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=900&q=80",
    title: "L'IA construit votre plan d'action",
    text: "En fonction des résultats et de vos objectifs, Beyond propose un plan de développement personnalisé par collaborateur. Formation en ligne, coaching individuel ou intervention collective.",
  },
  {
    step: "ÉTAPE 3",
    image: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=900&q=80",
    title: "Vous pilotez. Vous prouvez.",
    text: "Dashboard RH en temps réel. Évolution des scores. Certification Open Badge. Vous avez enfin les données pour justifier vos investissements formation.",
  },
] as const;

const BASE_INCLUDES = [
  "Diagnostic comportemental DISC + compétences",
  "Dashboard RH temps réel",
  "Plan d'action IA personnalisé",
  "Accès EDGE Online (80+ micro-formations)",
] as const;

const ADDONS = [
  {
    icon: Zap,
    name: "Intervention Flash",
    text: "1 journée en présentiel avec votre équipe commerciale. Diagnostic live + atelier + restitution.",
    price: "À partir de 1 500€ HT",
    cta: "Demander un devis",
    popular: false,
  },
  {
    icon: TrendingUp,
    name: "Parcours Performance",
    text: "3 mois d'accompagnement. 4 sessions collectives + suivi individuel + reporting Beyond mensuel.",
    price: "À partir de 4 500€ HT",
    cta: "Demander un devis",
    popular: true,
  },
  {
    icon: User,
    name: "Coaching Individuel",
    text: "Sessions de coaching individuel pour vos talents et managers clés. Suivi Beyond intégré.",
    price: "150€ / session",
    cta: "Réserver une session",
    popular: false,
  },
  {
    icon: Puzzle,
    name: "Programme Sur-Mesure",
    text: "Multi-équipes, déploiement national, objectifs spécifiques. On construit ensemble.",
    price: "Sur devis",
    cta: "Nous contacter",
    popular: false,
  },
] as const;

const PIPELINE = [
  {
    num: "01",
    title: "Diagnostic",
    text: "Chaque collaborateur passe le test Beyond en 12 minutes. Profil comportemental DISC, compétences, axes de progression.",
  },
  {
    num: "02",
    title: "Plan d'action",
    text: "L'IA génère un plan de développement personnalisé par collaborateur, aligné sur les objectifs de l'entreprise.",
  },
  {
    num: "03",
    title: "Formation",
    text: "Micro-formations en ligne, ateliers collectifs en présentiel, coaching individuel. Le bon format, au bon moment.",
  },
  {
    num: "04",
    title: "Certification",
    text: "Chaque compétence acquise est certifiée par un Open Badge IMS Global. Reconnu. Vérifiable. Portable.",
  },
] as const;

/** Témoignages fictifs — placeholders */
const TESTIMONIALS = [
  {
    initials: "MD",
    name: "Marc Delannoy",
    role: "Directeur Commercial",
    company: "Groupe Normandie Auto",
    quote:
      "En trois mois, notre taux de transformation a bondi de 18 points. On ne forme plus pour cocher une case.",
    color: EDGE_RED,
  },
  {
    initials: "SL",
    name: "Sophie Lemaire",
    role: "DRH",
    company: "Cabinet Conseil Rouen",
    quote: "Le diagnostic Beyond a révélé des freins que notre audit interne n'avait pas identifiés. Le ROI est visible.",
    color: "#FFFFFF",
  },
  {
    initials: "TG",
    name: "Thomas Girard",
    role: "CEO",
    company: "Startup Tech Caen",
    quote: "EDGE ne vend pas des heures de formation. Ils livrent de la performance mesurable. C'est rare.",
    color: "#888888",
  },
] as const;

function FadeSection({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <motion.div {...fadeUp} className={className}>
      {children}
    </motion.div>
  );
}

function PipelineArrow({ vertical }: { vertical?: boolean }) {
  if (vertical) {
    return (
      <div className="flex items-center justify-center py-3 lg:hidden" aria-hidden>
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <path
            d="M10 4v12M6 12l4 4 4-4"
            stroke={EDGE_RED}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
    );
  }

  return (
    <div className="hidden shrink-0 items-center px-3 lg:flex" aria-hidden>
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <path
          d="M5 12h14M13 6l6 6-6 6"
          stroke={EDGE_RED}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}

export function EntreprisesPageContent() {
  return (
    <>
      {/* 1. HERO */}
      <section className="relative flex min-h-[min(100svh,920px)] items-end overflow-hidden" style={{ backgroundColor: EDGE_BLACK }}>
        <Image
          src="https://images.unsplash.com/photo-1600880292203-757bb62b4baf?w=1920&q=80"
          alt="Équipe en réunion de formation"
          fill
          className="object-cover"
          sizes="100vw"
          priority
        />
        <div className="absolute inset-0 bg-black/65" aria-hidden />

        <div className="relative z-10 mx-auto w-full max-w-6xl px-5 pb-16 pt-32 sm:px-8 sm:pb-24 sm:pt-40">
          <motion.div
            initial={{ opacity: 0, y: 28 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="max-w-4xl"
          >
            <h1 className="text-[clamp(2.25rem,6.5vw,4.75rem)] font-bold leading-[1.02] tracking-[-0.04em] text-white">
              Vos équipes ont le potentiel.
              <br />
              Donnez-leur la méthode.
            </h1>
            <p className="mt-6 max-w-xl text-base leading-relaxed text-white/70 sm:text-lg">
              On diagnostique avant de former. On mesure après.
              <br />
              Pas de formation générique. Un système.
            </p>
            <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:items-center">
              <EdgeButton
                href="#contact"
                className="!border-[#E63329] !bg-[#E63329] px-8 py-3.5 text-sm font-semibold"
                ariaLabel="Demander un devis"
              >
                Demander un devis
              </EdgeButton>
              <EdgeButton
                href="#approche"
                variant="secondary-dark"
                className="px-8 py-3.5 text-sm font-semibold"
                ariaLabel="Voir comment ça marche"
              >
                Voir comment ça marche
              </EdgeButton>
            </div>
          </motion.div>
        </div>
      </section>

      {/* 2. PROBLÈME */}
      <section className="bg-white px-5 py-24 sm:px-8 sm:py-32">
        <div className="mx-auto max-w-6xl">
          <FadeSection>
            <SectionLabel>LE CONSTAT</SectionLabel>
            <h2 className="mt-4 max-w-3xl text-[clamp(1.75rem,4vw,3.25rem)] font-bold leading-[1.08] tracking-[-0.03em]" style={{ color: EDGE_BLACK }}>
              La formation classique ne transforme pas. Elle occupe.
            </h2>
          </FadeSection>

          <div className="mt-20 grid gap-14 md:grid-cols-3 md:gap-10">
            {STATS.map((stat, i) => (
              <motion.div
                key={stat.value}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ duration: 0.5, delay: i * 0.08 }}
              >
                <p className="text-[clamp(2.75rem,5vw,4rem)] font-bold tracking-[-0.04em]" style={{ color: EDGE_RED }}>
                  {stat.value}
                </p>
                <p className="mt-4 text-base leading-relaxed text-black/65">{stat.text}</p>
                {stat.source ? (
                  <p className="mt-3 text-xs uppercase tracking-wider text-black/30">{stat.source}</p>
                ) : null}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* 3. COMMENT ÇA MARCHE */}
      <section id="approche" className="scroll-mt-20 px-5 py-24 sm:px-8 sm:py-32" style={{ backgroundColor: EDGE_BLACK }}>
        <div className="mx-auto max-w-6xl">
          <FadeSection>
            <SectionLabel tone="accent">NOTRE APPROCHE</SectionLabel>
            <h2 className="mt-4 max-w-3xl text-[clamp(1.75rem,4vw,3.25rem)] font-bold leading-[1.08] tracking-[-0.03em] text-white">
              Un système en 3 étapes. Pas une formation de plus.
            </h2>
          </FadeSection>

          <div className="mt-20 grid gap-6 lg:grid-cols-3 lg:gap-5">
            {STEPS.map((card, i) => (
              <motion.article
                key={card.step}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="group overflow-hidden rounded-2xl border border-white/10 bg-[#141414]"
              >
                <div className="relative aspect-[4/3] overflow-hidden">
                  <Image
                    src={card.image}
                    alt=""
                    fill
                    className="object-cover transition duration-700 group-hover:scale-[1.03]"
                    sizes="(max-width: 1024px) 100vw, 33vw"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />
                  <span
                    className="absolute left-5 top-5 text-[10px] font-semibold uppercase tracking-[0.25em] text-white/80"
                    style={{ color: EDGE_RED }}
                  >
                    {card.step}
                  </span>
                </div>
                <div className="p-7 sm:p-8">
                  <h3 className="text-xl font-bold tracking-tight text-white">{card.title}</h3>
                  <p className="mt-3 text-sm leading-relaxed text-white/50">{card.text}</p>
                </div>
              </motion.article>
            ))}
          </div>
        </div>
      </section>

      {/* POURQUOI EDGE */}
      <section className="bg-white px-5 py-[120px] sm:px-8">
        <div className="mx-auto max-w-6xl">
          <FadeSection>
            <SectionLabel>NOTRE DIFFÉRENCE</SectionLabel>
            <h2
              className="mt-4 max-w-[700px] text-[clamp(2rem,5vw,4rem)] font-bold leading-[1.08] tracking-[-0.03em]"
              style={{ color: EDGE_BLACK }}
            >
              Un cabinet de formation vous forme.
              <br />
              EDGE vous transforme.
            </h2>
            <p className="mt-6 max-w-[560px] text-lg leading-[1.7]" style={{ color: "#666666" }}>
              Chaque collaborateur reçoit un parcours unique, construit sur ses données réelles. Pas un programme
              générique.
            </p>
          </FadeSection>

          <div className="mt-16 flex flex-col lg:flex-row lg:items-stretch">
            {PIPELINE.map((block, i) => (
              <div key={block.num} className="contents">
                {i > 0 ? <PipelineArrow vertical /> : null}
                {i > 0 ? <PipelineArrow /> : null}
                <motion.article
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-40px" }}
                  transition={{ duration: 0.5, delay: i * 0.08 }}
                  className="flex-1 rounded-2xl border p-8"
                  style={{ backgroundColor: "#F9F9F9", borderColor: "#EFEFEF" }}
                >
                  <p className="text-[48px] font-bold leading-none" style={{ color: EDGE_RED }}>
                    {block.num}
                  </p>
                  <h3 className="mt-4 text-xl font-bold" style={{ color: EDGE_BLACK }}>
                    {block.title}
                  </h3>
                  <p className="mt-3 text-sm leading-relaxed" style={{ color: "#666666" }}>
                    {block.text}
                  </p>
                </motion.article>
              </div>
            ))}
          </div>

          <FadeSection className="pt-[60px] text-center">
            <p className="mx-auto max-w-2xl text-2xl font-bold leading-snug" style={{ color: EDGE_BLACK }}>
              Résultat : vous pilotez la montée en compétences de vos équipes avec des données. Pas des impressions.
            </p>
            <EdgeButton
              href="#tarifs"
              className="mt-10 !border-[#E63329] !bg-[#E63329] px-8 py-3.5 text-sm font-semibold"
              ariaLabel="Voir comment ça marche"
            >
              Voir comment ça marche
            </EdgeButton>
          </FadeSection>
        </div>
      </section>

      {/* 4. PRICING */}
      <section id="tarifs" className="scroll-mt-20 bg-white px-5 py-24 sm:px-8 sm:py-32">
        <div className="mx-auto max-w-6xl">
          <FadeSection>
            <SectionLabel>TARIFS</SectionLabel>
            <h2 className="mt-4 text-[clamp(1.75rem,4vw,3.25rem)] font-bold leading-[1.08] tracking-[-0.03em]" style={{ color: EDGE_BLACK }}>
              Construisez votre formule.
            </h2>
            <p className="mt-4 max-w-xl text-base text-black/45">
              Une base licences. Des add-ons selon vos besoins réels.
            </p>
          </FadeSection>

          {/* Base */}
          <motion.article
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{ duration: 0.55 }}
            className="mt-16 overflow-hidden rounded-2xl border-2 p-8 sm:p-10 lg:p-12"
            style={{ backgroundColor: EDGE_BLACK, borderColor: EDGE_RED }}
          >
            <span
              className="inline-flex rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-white"
              style={{ backgroundColor: EDGE_RED }}
            >
              SOCLE — BEYOND PLATFORM
            </span>
            <div className="mt-6 flex flex-col gap-2 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="text-[clamp(2rem,4vw,3rem)] font-bold tracking-tight text-white">12€ / collaborateur / mois</p>
                <p className="mt-2 text-sm text-white/50">3 licences RH offertes</p>
              </div>
              <EdgeButton
                href="#contact"
                className="mt-4 !border-[#E63329] !bg-[#E63329] px-8 py-3.5 text-sm font-semibold lg:mt-0"
                ariaLabel="Demander un accès démo"
              >
                Demander un accès démo
              </EdgeButton>
            </div>

            <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {BASE_INCLUDES.map((item) => (
                <li key={item} className="flex gap-3 text-sm leading-snug text-white/75">
                  <Check className="mt-0.5 h-4 w-4 shrink-0" style={{ color: EDGE_RED }} aria-hidden />
                  {item}
                </li>
              ))}
            </ul>
          </motion.article>

          {/* Add-ons */}
          <div className="mt-24">
            <FadeSection>
              <h3 className="text-2xl font-bold tracking-tight" style={{ color: EDGE_BLACK }}>
                Allez plus loin avec EDGE
              </h3>
              <p className="mt-2 text-base text-black/45">
                Activez ce dont vous avez besoin, quand vous en avez besoin.
              </p>
            </FadeSection>

            <div className="mt-12 grid gap-5 sm:grid-cols-2">
              {ADDONS.map((addon, i) => {
                const Icon = addon.icon;
                return (
                  <motion.article
                    key={addon.name}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-40px" }}
                    transition={{ duration: 0.5, delay: i * 0.06 }}
                    className={cn(
                      "flex flex-col rounded-2xl border bg-white p-8 transition-shadow",
                      addon.popular
                        ? "border-[#E63329] shadow-[0_0_0_1px_#E63329,0_20px_50px_-20px_rgba(230,51,41,0.2)]"
                        : "border-black/10 hover:shadow-[0_16px_40px_-20px_rgba(0,0,0,0.1)]",
                    )}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div
                        className="flex h-10 w-10 items-center justify-center rounded-xl"
                        style={{ backgroundColor: `${EDGE_RED}14` }}
                      >
                        <Icon className="h-5 w-5" style={{ color: EDGE_RED }} aria-hidden />
                      </div>
                      {addon.popular ? (
                        <span
                          className="rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-white"
                          style={{ backgroundColor: EDGE_RED }}
                        >
                          Populaire
                        </span>
                      ) : null}
                    </div>
                    <h4 className="mt-5 text-lg font-bold tracking-tight" style={{ color: EDGE_BLACK }}>
                      {addon.name}
                    </h4>
                    <p className="mt-3 flex-1 text-sm leading-relaxed text-black/55">{addon.text}</p>
                    <p className="mt-6 text-xl font-bold tracking-tight" style={{ color: EDGE_BLACK }}>
                      {addon.price}
                    </p>
                    <Link
                      href="#contact"
                      className={cn(
                        "mt-5 inline-flex items-center justify-center rounded-full px-6 py-3 text-sm font-semibold transition-opacity hover:opacity-90",
                        addon.popular ? "text-white" : "border border-black/15 text-black hover:border-black/30",
                      )}
                      style={addon.popular ? { backgroundColor: EDGE_RED } : undefined}
                    >
                      {addon.cta}
                    </Link>
                  </motion.article>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* 5. TÉMOIGNAGES */}
      <section className="px-5 py-24 sm:px-8 sm:py-32" style={{ backgroundColor: EDGE_BLACK }}>
        <div className="mx-auto max-w-6xl">
          <FadeSection>
            <SectionLabel tone="accent">ILS ONT CHOISI EDGE</SectionLabel>
            <p className="sr-only">Témoignages fictifs — placeholders</p>
          </FadeSection>

          <div className="mt-12 flex gap-5 overflow-x-auto pb-2 [-ms-overflow-style:none] [scrollbar-width:none] lg:grid lg:grid-cols-3 lg:overflow-visible [&::-webkit-scrollbar]:hidden">
            {TESTIMONIALS.map((t, i) => (
              <motion.blockquote
                key={t.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ duration: 0.5, delay: i * 0.08 }}
                className="min-w-[280px] flex-shrink-0 rounded-2xl border border-white/10 bg-[#141414] p-8 lg:min-w-0"
              >
                <p className="text-base font-medium leading-relaxed text-white/85">&ldquo;{t.quote}&rdquo;</p>
                <footer className="mt-7 flex items-center gap-4">
                  <span
                    className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-sm font-bold"
                    style={{
                      backgroundColor: t.color === EDGE_RED ? `${EDGE_RED}22` : "rgba(255,255,255,0.08)",
                      color: t.color,
                    }}
                    aria-hidden
                  >
                    {t.initials}
                  </span>
                  <div>
                    <cite className="not-italic text-sm font-bold text-white">{t.name}</cite>
                    <p className="text-xs text-white/40">
                      {t.role}, {t.company}
                    </p>
                  </div>
                </footer>
              </motion.blockquote>
            ))}
          </div>
        </div>
      </section>

      {/* 6. CTA FINAL */}
      <section id="contact" className="scroll-mt-20 px-5 py-24 sm:px-8 sm:py-32" style={{ backgroundColor: EDGE_RED }}>
        <div className="mx-auto max-w-2xl">
          <FadeSection className="text-center">
            <h2 className="text-[clamp(1.75rem,4vw,2.75rem)] font-bold leading-[1.08] tracking-[-0.03em] text-white">
              Prêt à former autrement ?
            </h2>
            <p className="mt-4 text-base leading-relaxed text-white/90 sm:text-lg">
              Prenez 15 minutes pour nous expliquer votre contexte. On vous propose une approche sur-mesure sous 48h.
            </p>
          </FadeSection>

          <EntrepriseContactForm variant="onRed" />
        </div>
      </section>
    </>
  );
}
