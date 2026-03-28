"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { BeyondCenterHeader } from "@/components/beyond-center/beyond-center-header";
import {
  BeyondCenterMarketingFooter,
  DashboardShowcase,
  DashboardShowcaseStatic,
  DarkAmbientBackground,
  fadeUp,
  GlassLight,
  heroStagger,
  PILOTE_MAIL,
  Section,
} from "@/components/beyond-center/beyond-center-shared";

function GoldenLabel({ children }: { children: string }) {
  return (
    <p className="text-[10px] font-semibold uppercase tracking-[0.38em] text-violet-600/85">{children}</p>
  );
}

const shellClass =
  "min-h-screen scroll-smooth bg-[#030712] font-sans text-slate-100 antialiased selection:bg-violet-500/30 selection:text-white";

const fontStyle = {
  fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
} as const;

function CtaBand({
  id,
  title,
  href,
  label,
}: {
  id: string;
  title: string;
  href: string;
  label: string;
}) {
  const btnClass =
    "inline-flex items-center justify-center rounded-full border border-white/20 bg-white/10 px-10 py-3.5 text-[15px] font-semibold text-white backdrop-blur-[20px] transition-all hover:border-cyan-300/40 hover:bg-white/15";
  const style = { WebkitBackdropFilter: "blur(20px)" } as const;
  return (
    <section id={id} className="relative scroll-mt-24 overflow-hidden py-24 md:py-28">
      <DarkAmbientBackground />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_70%_50%_at_50%_0%,rgba(139,92,246,0.18),transparent)]" />
      <div className="relative z-10 mx-auto max-w-3xl px-6 text-center md:px-8">
        <h2 className="text-[clamp(1.5rem,3vw,2.1rem)] font-semibold leading-tight tracking-[-0.03em] text-white">{title}</h2>
        <motion.div className="mt-10" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
          {href.startsWith("mailto:") ? (
            <a href={href} className={btnClass} style={style}>
              {label}
            </a>
          ) : (
            <Link href={href} className={btnClass} style={style}>
              {label}
            </Link>
          )}
        </motion.div>
      </div>
    </section>
  );
}

/** Page Approche — Golden Circle (Why → How → What) */
export function BeyondCenterApprochePage() {
  return (
    <div className={shellClass} style={fontStyle}>
      <BeyondCenterHeader />

      {/* 1. Hero — Vision (Why) */}
      <section id="app-hero" className="relative scroll-mt-24 overflow-hidden pb-28 pt-10 md:pb-36 md:pt-14">
        <DarkAmbientBackground />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_20%_-10%,rgba(139,92,246,0.15),transparent)]" />
        <div className="relative z-10 mx-auto max-w-6xl px-6 md:px-8">
          <motion.div variants={heroStagger} initial="hidden" animate="visible" className="max-w-3xl">
            <motion.p variants={fadeUp} className="text-[11px] font-semibold uppercase tracking-[0.28em] text-cyan-300/70">
              Approche · Why
            </motion.p>
            <motion.h1
              variants={fadeUp}
              className="mt-4 text-[clamp(2rem,4.8vw,3.15rem)] font-semibold leading-[1.05] tracking-[-0.04em] text-white"
            >
              Comprendre avant d&apos;optimiser.
            </motion.h1>
            <motion.p variants={fadeUp} className="mt-8 text-[17px] leading-[1.75] text-slate-300 md:text-[18px]">
              La performance durable ne vient pas d&apos;un empilement de formations.
              <br />
              <span className="text-slate-400">
                Elle vient de la compréhension du fonctionnement réel des équipes.
              </span>
            </motion.p>
            <motion.p
              variants={fadeUp}
              className="mt-8 max-w-2xl border-l-2 border-cyan-400/40 pl-6 text-[15px] leading-relaxed text-slate-400"
            >
              Beyond Center est né d&apos;une conviction simple : on ne peut pas améliorer ce qu&apos;on ne comprend
              pas.
            </motion.p>
          </motion.div>
        </div>
      </section>

      {/* 2. Why */}
      <Section
        id="app-why"
        className="scroll-mt-24 border-t border-slate-200/80 bg-white py-24 text-slate-900 md:py-32"
      >
        <div className="mx-auto max-w-3xl px-6 md:px-8">
          <GoldenLabel>Why</GoldenLabel>
          <h2 className="mt-2 text-[clamp(1.75rem,3vw,2.45rem)] font-semibold leading-[1.12] tracking-[-0.035em]">
            Pourquoi comprendre avant de former ?
          </h2>
          <div className="mt-10 space-y-6 text-[17px] leading-[1.75] text-slate-600">
            <p className="font-medium text-slate-800">Former sans diagnostic, c&apos;est agir à l&apos;aveugle.</p>
            <p>
              Les entreprises investissent dans des compétences, sans toujours comprendre ce qui conditionne
              réellement la performance :
            </p>
            <ul className="space-y-3 border-y border-slate-200/90 py-8">
              {[
                "la manière dont l'information est traitée",
                "la charge cognitive",
                "les dynamiques comportementales",
                "les mécanismes d'apprentissage",
              ].map((item) => (
                <li key={item} className="flex gap-3 text-[16px]">
                  <span className="mt-2.5 h-1 w-1 shrink-0 rounded-full bg-violet-500/70" aria-hidden />
                  {item}
                </li>
              ))}
            </ul>
            <p className="text-slate-700">
              Résultat : des actions souvent peu efficaces, difficilement mesurables.
            </p>
          </div>
        </div>
      </Section>

      {/* 3. How — sciences */}
      <Section
        id="app-how-thinking"
        className="scroll-mt-24 border-t border-slate-100 bg-gradient-to-b from-slate-50 to-white py-24 md:py-32"
      >
        <div className="mx-auto max-w-6xl px-6 md:px-8">
          <GoldenLabel>How</GoldenLabel>
          <h2 className="mt-2 max-w-2xl text-[clamp(1.75rem,3vw,2.45rem)] font-semibold tracking-[-0.035em] text-slate-900">
            Des sciences, pas du storytelling.
          </h2>
          <div className="mt-14 grid gap-8 md:grid-cols-3">
            {[
              {
                t: "Cognition",
                d: "Comment l'information est traitée, mémorisée et mobilisée.",
              },
              {
                t: "Psychologie",
                d: "Motivation, stress, comportements et interactions.",
              },
              {
                t: "Apprentissage",
                d: "Ce qui permet une progression réelle et durable.",
              },
            ].map((c, i) => (
              <motion.div
                key={c.t}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.5 }}
              >
                <GlassLight className="h-full border-slate-200/90 p-8" hoverLift={false}>
                  <h3 className="text-[17px] font-semibold tracking-[-0.02em] text-slate-900">{c.t}</h3>
                  <p className="mt-4 text-[15px] leading-relaxed text-slate-600">{c.d}</p>
                </GlassLight>
              </motion.div>
            ))}
          </div>
          <p className="mx-auto mt-14 max-w-2xl text-center text-[15px] leading-relaxed text-slate-500">
            Notre approche s&apos;appuie sur des disciplines éprouvées, appliquées au réel des organisations.
          </p>
        </div>
      </Section>

      {/* 4. How — méthode */}
      <Section id="app-how-methode" className="scroll-mt-24 border-t border-slate-100 bg-white py-24 md:py-32">
        <div className="mx-auto max-w-6xl px-6 md:px-8">
          <GoldenLabel>How</GoldenLabel>
          <h2 className="mt-2 text-[clamp(1.75rem,3vw,2.45rem)] font-semibold tracking-[-0.035em] text-slate-900">
            Une approche structurée
          </h2>
          <div className="mt-14 grid gap-8 md:grid-cols-3">
            {[
              { t: "Comprendre", d: "Analyser le fonctionnement réel" },
              { t: "Structurer", d: "Construire une stratégie adaptée" },
              { t: "Déployer", d: "Activer une progression mesurable" },
            ].map((step, i) => (
              <motion.div
                key={step.t}
                initial={{ opacity: 0, y: 18 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.12, duration: 0.5 }}
                className="relative rounded-2xl border border-slate-200/80 bg-slate-50/50 p-8 md:p-9"
              >
                <span className="text-[11px] font-semibold uppercase tracking-[0.22em] text-violet-600/75">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <h3 className="mt-3 text-[19px] font-semibold text-slate-900">{step.t}</h3>
                <p className="mt-3 text-[15px] leading-relaxed text-slate-600">{step.d}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </Section>

      {/* 5. What */}
      <Section
        id="app-what"
        className="scroll-mt-24 border-t border-slate-100 bg-slate-50 py-24 md:py-32"
      >
        <div className="mx-auto max-w-3xl px-6 md:px-8">
          <GoldenLabel>What</GoldenLabel>
          <h2 className="mt-2 text-[clamp(1.75rem,3vw,2.45rem)] font-semibold tracking-[-0.035em] text-slate-900">
            Une solution complète
          </h2>
          <p className="mt-8 text-[17px] leading-[1.75] text-slate-600">
            Beyond combine analyse, stratégie et déploiement dans un système cohérent, conçu pour transformer
            durablement la performance.
          </p>
        </div>
      </Section>

      {/* 6. Philosophie */}
      <Section id="app-philo" className="scroll-mt-24 border-t border-slate-200/80 bg-white py-24 md:py-32">
        <div className="mx-auto max-w-2xl px-6 md:px-8">
          <h2 className="text-center text-[clamp(1.45rem,2.6vw,1.95rem)] font-semibold tracking-[-0.03em] text-slate-900">
            Notre philosophie
          </h2>
          <div className="mt-10 space-y-5 text-[17px] leading-[1.8] text-slate-600">
            <p>La donnée sert la compréhension.</p>
            <p>La compréhension sert l&apos;action.</p>
            <p>L&apos;action s&apos;ancre dans le réel.</p>
            <p className="pt-4 text-[15px] font-medium text-slate-800">
              Rien n&apos;est standardisé.
              <br />
              Tout est contextualisé.
            </p>
          </div>
        </div>
      </Section>

      <CtaBand id="app-cta" title="Passez de la compréhension à l'action." href="/pilote" label="Lancer un pilote" />
      <BeyondCenterMarketingFooter />
    </div>
  );
}

/** Page Plateforme — produit (orienté résultat) */
export function BeyondCenterPlateformePage() {
  return (
    <div className={shellClass} style={fontStyle}>
      <BeyondCenterHeader />
      <section id="plt-hero" className="relative scroll-mt-24 overflow-hidden pb-20 pt-10 md:pb-28 md:pt-14">
        <DarkAmbientBackground />
        <div className="relative z-10 mx-auto grid max-w-6xl items-center gap-14 px-6 md:px-8 lg:grid-cols-2 lg:gap-16">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-cyan-300/70">Plateforme</p>
            <h1 className="mt-4 text-[clamp(2rem,4.5vw,2.85rem)] font-semibold leading-[1.06] tracking-[-0.04em] text-white">
              Un système qui accompagne la progression, pas une simple interface.
            </h1>
            <p className="mt-8 text-[17px] leading-relaxed text-slate-400">
              Beyond relie analyse, parcours et suivi dans une expérience fluide — pour que les équipes sachent où
              elles vont et comment elles progressent.
            </p>
          </div>
          <DashboardShowcaseStatic variant="dark" priority />
        </div>
      </section>

      <Section id="plt-corps" className="scroll-mt-24 border-t border-slate-200/80 bg-white py-24 text-slate-900 md:py-32">
        <div className="mx-auto max-w-6xl space-y-20 px-6 md:px-8">
          <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
            <div>
              <h2 className="text-[clamp(1.65rem,2.8vw,2.1rem)] font-semibold tracking-[-0.03em]">
                Une lecture claire de l&apos;avancement
              </h2>
              <p className="mt-5 text-[16px] leading-relaxed text-slate-600">
                Le tableau de bord donne du contexte : où en sont les collaborateurs, sur quoi s&apos;appuyer pour
                ajuster le rythme, sans noyer les managers sous des métriques inutiles.
              </p>
            </div>
            <DashboardShowcase variant="light" imageMotion="static" />
          </div>
          <div className="grid gap-10 md:grid-cols-2">
            <GlassLight className="p-8">
              <h3 className="text-[17px] font-semibold text-slate-900">Expérience utilisateur</h3>
              <p className="mt-4 text-[15px] leading-relaxed text-slate-600">
                Des parcours qui respectent le rythme de chacun, avec des formats courts et une mise en pratique
                intégrée au quotidien.
              </p>
            </GlassLight>
            <GlassLight className="p-8">
              <h3 className="text-[17px] font-semibold text-slate-900">Nevo</h3>
              <p className="mt-4 text-[15px] leading-relaxed text-slate-600">
                Un compagnon pour ancrer les réflexes et transformer les acquis en habitudes — au service de la
                rétention et du transfert.
              </p>
            </GlassLight>
          </div>
          <div className="rounded-2xl border border-slate-200/80 bg-slate-50/80 p-10 md:p-12">
            <h3 className="text-[17px] font-semibold text-slate-900">Progression dans la durée</h3>
            <p className="mt-4 max-w-2xl text-[15px] leading-relaxed text-slate-600">
              L&apos;objectif n&apos;est pas de « consommer » des modules : c&apos;est de maintenir une trajectoire
              lisible, avec des jalons et des ajustements continus.
            </p>
          </div>
        </div>
      </Section>

      <CtaBand
        id="plt-cta"
        title="Découvrez le système en conditions réelles."
        href="/pilote"
        label="Lancer un pilote"
      />
      <BeyondCenterMarketingFooter />
    </div>
  );
}

/** Page Ressources — SEO & crédibilité */
export function BeyondCenterRessourcesPage() {
  const blocks = [
    {
      t: "Articles",
      d: "Réflexions sur la cognition au travail, la performance des équipes et les nouvelles approches RH.",
    },
    {
      t: "Études",
      d: "Synthèses et références pour appuyer vos arbitrages — sans jargon inutile.",
    },
    {
      t: "Insights",
      d: "Regards courts sur les tendances qui impactent l'apprentissage et l'engagement.",
    },
    {
      t: "Cas clients",
      d: "Retours de déploiement : contexte, méthode, enseignements (publication progressive).",
    },
  ];
  return (
    <div className={shellClass} style={fontStyle}>
      <BeyondCenterHeader />
      <section id="res-hero" className="relative scroll-mt-24 overflow-hidden pb-20 pt-10 md:pb-28 md:pt-14">
        <DarkAmbientBackground />
        <div className="relative z-10 mx-auto max-w-6xl px-6 md:px-8">
          <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-cyan-300/70">Ressources</p>
          <h1 className="mt-4 max-w-3xl text-[clamp(2rem,4.5vw,2.85rem)] font-semibold leading-[1.06] tracking-[-0.04em] text-white">
            Contenus pour décider et convaincre.
          </h1>
          <p className="mt-8 max-w-2xl text-[17px] leading-relaxed text-slate-400">
            Nous nourrissons cet espace pour le leadership intellectuel de Beyond — et pour vous donner des repères
            solides avant d&apos;engager vos équipes.
          </p>
        </div>
      </section>

      <Section id="res-corps" className="scroll-mt-24 border-t border-slate-200/80 bg-white py-24 md:py-32">
        <div className="mx-auto max-w-6xl px-6 md:px-8">
          <div className="grid gap-6 sm:grid-cols-2">
            {blocks.map((b, i) => (
              <motion.article
                key={b.t}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.06, duration: 0.45 }}
                className="rounded-2xl border border-slate-200/80 bg-slate-50/50 p-8 transition-shadow hover:shadow-md"
              >
                <h2 className="text-[17px] font-semibold text-slate-900">{b.t}</h2>
                <p className="mt-3 text-[15px] leading-relaxed text-slate-600">{b.d}</p>
                <span className="mt-5 inline-block text-[12px] font-semibold uppercase tracking-wider text-violet-600/80">
                  Bientôt
                </span>
              </motion.article>
            ))}
          </div>
        </div>
      </Section>

      <CtaBand
        id="res-cta"
        title="Vous souhaitez être informé des prochaines publications ?"
        href={PILOTE_MAIL}
        label="Nous contacter"
      />
      <BeyondCenterMarketingFooter />
    </div>
  );
}

/** Page Pilote — conversion */
export function BeyondCenterPilotePage() {
  return (
    <div className={shellClass} style={fontStyle}>
      <BeyondCenterHeader />
      <section id="pil-hero" className="relative scroll-mt-24 overflow-hidden pb-16 pt-10 md:pb-24 md:pt-14">
        <DarkAmbientBackground />
        <div className="relative z-10 mx-auto max-w-6xl px-6 md:px-8">
          <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-cyan-300/70">Pilote</p>
          <h1 className="mt-4 max-w-3xl text-[clamp(2rem,4.5vw,2.9rem)] font-semibold leading-[1.06] tracking-[-0.04em] text-white">
            Testez Beyond dans votre contexte, sans engagement structurel.
          </h1>
          <p className="mt-8 max-w-2xl text-[17px] leading-relaxed text-slate-400">
            Un pilote pour valider la pertinence de la démarche, mesurer l&apos;adhésion des équipes et cadrer une
            généralisation éventuelle.
          </p>
        </div>
      </section>

      <Section id="pil-corps" className="scroll-mt-24 border-t border-slate-200/80 bg-white py-24 text-slate-900 md:py-32">
        <div className="mx-auto max-w-6xl space-y-16 px-6 md:px-8">
          <div>
            <h2 className="text-[19px] font-semibold tracking-[-0.02em]">Ce que contient le pilote</h2>
            <ul className="mt-5 space-y-3 text-[15px] leading-relaxed text-slate-600">
              <li>• Cadrage des objectifs avec vos équipes RH et métiers</li>
              <li>• Accès à la démarche d&apos;analyse et aux premiers livrables de compréhension</li>
              <li>• Mise en situation sur la plateforme et les parcours</li>
              <li>• Restitution et recommandations pour la suite</li>
            </ul>
          </div>
          <div className="grid gap-10 md:grid-cols-2">
            <GlassLight className="p-8">
              <h3 className="text-[17px] font-semibold text-slate-900">Pour qui ?</h3>
              <p className="mt-4 text-[15px] leading-relaxed text-slate-600">
                Directions RH, directions générales ou leaders de transformation qui veulent tester une approche
                fondée sur la cognition avant d&apos;industrialiser.
              </p>
            </GlassLight>
            <GlassLight className="p-8">
              <h3 className="text-[17px] font-semibold text-slate-900">Déroulé type</h3>
              <p className="mt-4 text-[15px] leading-relaxed text-slate-600">
                Quelques semaines, rythme concerté : lancement, collecte, restitution, décision sur la généralisation.
                Le calendrier s&apos;adapte à votre organisation.
              </p>
            </GlassLight>
          </div>
          <div className="rounded-2xl border border-violet-200/60 bg-gradient-to-br from-violet-50/80 to-cyan-50/40 p-10">
            <h3 className="text-[17px] font-semibold text-slate-900">Résultats attendus</h3>
            <p className="mt-4 text-[15px] leading-relaxed text-slate-700">
              Plus de clarté sur les leviers réels de performance, un retour qualitatif des participants, et des
              éléments tangibles pour décider d&apos;un déploiement plus large.
            </p>
          </div>
        </div>
      </Section>

      <section id="pil-cta" className="relative scroll-mt-24 overflow-hidden py-24 md:py-32">
        <DarkAmbientBackground />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_70%_50%_at_50%_0%,rgba(139,92,246,0.2),transparent)]" />
        <div className="relative z-10 mx-auto max-w-3xl px-6 text-center md:px-8">
          <h2 className="text-[clamp(1.75rem,3.2vw,2.4rem)] font-semibold tracking-[-0.03em] text-white">
            Lancer un pilote avec Beyond Center
          </h2>
          <motion.a
            href={PILOTE_MAIL}
            className="mt-12 inline-flex items-center justify-center rounded-full bg-gradient-to-r from-violet-500 to-cyan-400 px-12 py-4 text-[15px] font-semibold text-slate-950 shadow-[0_0_40px_-8px_rgba(139,92,246,0.55)]"
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
          >
            Écrire pour un pilote
          </motion.a>
          <p className="mt-6 text-[13px] text-slate-500">
            Réponse sous quelques jours ouvrés — échanges confidentiels.
          </p>
        </div>
      </section>
      <BeyondCenterMarketingFooter />
    </div>
  );
}
