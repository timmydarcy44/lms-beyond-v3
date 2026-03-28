"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { BeyondCenterHeader } from "@/components/beyond-center/beyond-center-header";
import {
  BeyondCenterMarketingFooter,
  DarkAmbientBackground,
  DashboardShowcase,
  fadeUp,
  GlassDark,
  GlassLight,
  heroStagger,
  Section,
} from "@/components/beyond-center/beyond-center-shared";

export function BeyondCenterSolutionPage() {
  return (
    <div
      className="min-h-screen scroll-smooth bg-[#030712] font-sans text-slate-100 antialiased selection:bg-violet-500/30 selection:text-white"
      style={{
        fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      }}
    >
      <BeyondCenterHeader />

      {/* 1. Hero */}
      <section id="sol-hero" className="relative scroll-mt-24 overflow-hidden pb-28 pt-8 md:pb-36 md:pt-12">
        <DarkAmbientBackground />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_90%_60%_at_50%_-20%,rgba(139,92,246,0.2),transparent)]" />
        <div className="relative z-10 mx-auto max-w-6xl px-6 md:px-8">
          <motion.div variants={heroStagger} initial="hidden" animate="visible" className="max-w-3xl">
            <motion.p
              variants={fadeUp}
              className="text-[11px] font-semibold uppercase tracking-[0.28em] text-cyan-300/70"
            >
              Solution
            </motion.p>
            <motion.h1
              variants={fadeUp}
              className="mt-5 text-[clamp(2.1rem,5.2vw,3.4rem)] font-semibold leading-[1.04] tracking-[-0.045em] text-white"
            >
              Arrêtez d&apos;investir à l&apos;aveugle.
            </motion.h1>
            <motion.p variants={fadeUp} className="mt-8 text-[17px] leading-[1.75] text-slate-400 md:text-[18px]">
              Sans compréhension du fonctionnement humain, les actions de développement restent inefficaces.
            </motion.p>
            <motion.div variants={fadeUp} className="mt-12 flex flex-wrap items-center gap-4">
              <Link
                href="/pilote"
                className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-violet-500 to-cyan-400 px-10 py-4 text-[15px] font-semibold text-slate-950 shadow-[0_0_40px_-8px_rgba(139,92,246,0.55)] transition-shadow duration-300 hover:shadow-[0_0_56px_-6px_rgba(34,211,238,0.45)]"
              >
                Lancer un pilote
              </Link>
              <Link
                href="/"
                className="text-[14px] font-medium text-slate-400 underline-offset-4 transition-colors hover:text-white hover:underline"
              >
                Retour accueil
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* 2. Problème */}
      <section id="sol-probleme" className="relative scroll-mt-24 overflow-hidden border-t border-white/[0.06] py-24 md:py-32">
        <DarkAmbientBackground />
        <div className="relative z-10 mx-auto max-w-6xl px-6 md:px-8">
          <h2 className="max-w-3xl text-[clamp(1.85rem,4vw,2.85rem)] font-semibold leading-[1.1] tracking-[-0.035em] text-white">
            Les entreprises développent des compétences.
            <br />
            <span className="text-slate-500">Mais pas ce qui les produit.</span>
          </h2>
          <p className="mt-6 text-[15px] font-medium uppercase tracking-[0.2em] text-slate-500">Former sans comprendre :</p>
          <GlassDark className="mt-8 max-w-xl p-8" hoverLift={false}>
            <ul className="space-y-4 text-[16px] leading-relaxed text-slate-300">
              <li className="flex gap-3">
                <span className="text-cyan-400/80" aria-hidden>
                  ·
                </span>
                ne cible pas les vrais leviers
              </li>
              <li className="flex gap-3">
                <span className="text-cyan-400/80" aria-hidden>
                  ·
                </span>
                génère peu de transformation
              </li>
              <li className="flex gap-3">
                <span className="text-cyan-400/80" aria-hidden>
                  ·
                </span>
                rend les résultats difficiles à mesurer
              </li>
            </ul>
          </GlassDark>
        </div>
      </section>

      {/* 3. Pivot solution */}
      <section id="sol-pivot" className="relative scroll-mt-24 overflow-hidden border-t border-white/[0.06] py-24 md:py-32">
        <DarkAmbientBackground />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_70%_50%_at_80%_50%,rgba(34,211,238,0.08),transparent)]" />
        <div className="relative z-10 mx-auto max-w-3xl px-6 text-center md:px-8">
          <h2 className="text-[clamp(1.75rem,3.5vw,2.5rem)] font-semibold leading-tight tracking-[-0.035em] text-white">
            Beyond change l&apos;approche.
          </h2>
          <p className="mt-8 text-[17px] leading-[1.75] text-slate-400">
            Nous identifions ce qui influence réellement la performance, et nous construisons un système pour
            l&apos;améliorer durablement.
          </p>
        </div>
      </section>

      {/* 4. Méthode */}
      <Section
        id="sol-methode"
        className="scroll-mt-24 border-t border-slate-200/80 bg-gradient-to-b from-slate-50 to-white py-24 text-slate-900 md:py-32"
      >
        <div className="mx-auto max-w-6xl px-6 md:px-8">
          <h2 className="text-[clamp(1.85rem,3.2vw,2.55rem)] font-semibold tracking-[-0.035em]">
            Une méthode en 3 étapes
          </h2>
          <div className="mt-14 grid gap-8 lg:grid-cols-3">
            {[
              {
                title: "Comprendre",
                lines: ["Analyse cognitive", "Soft skills", "Stress"],
              },
              {
                title: "Structurer",
                lines: ["Stratégie de développement adaptée"],
              },
              {
                title: "Déployer",
                lines: ["Plateforme + accompagnement"],
              },
            ].map((col, i) => (
              <motion.div
                key={col.title}
                initial={{ opacity: 0, y: 22 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.5 }}
              >
                <GlassLight className="h-full border-slate-200/90 p-8" hoverLift={false}>
                  <h3 className="text-[20px] font-semibold tracking-[-0.02em] text-slate-900">{col.title}</h3>
                  <ul className="mt-6 space-y-2.5 text-[15px] leading-relaxed text-slate-600">
                    {col.lines.map((line) => (
                      <li key={line}>{line}</li>
                    ))}
                  </ul>
                </GlassLight>
              </motion.div>
            ))}
          </div>
        </div>
      </Section>

      {/* 5. Produit */}
      <Section id="sol-produit" className="scroll-mt-24 border-t border-slate-100 bg-white py-24 md:py-32">
        <div className="mx-auto max-w-6xl px-6 md:px-8">
          <div className="grid items-center gap-14 lg:grid-cols-2 lg:gap-16">
            <div>
              <h2 className="text-[clamp(1.85rem,3vw,2.55rem)] font-semibold tracking-[-0.035em] text-slate-900">
                Un système, pas une formation.
              </h2>
              <p className="mt-6 text-[17px] leading-[1.75] text-slate-600">
                Chaque insight devient une action, intégrée dans un environnement conçu pour faire progresser dans le
                temps.
              </p>
            </div>
            <div className="lg:pl-4">
              <DashboardShowcase variant="light" imageMotion="static" />
            </div>
          </div>
        </div>
      </Section>

      {/* 6. Humain */}
      <Section id="sol-humain" className="scroll-mt-24 border-t border-slate-100 bg-slate-50 py-24 md:py-32">
        <div className="mx-auto max-w-6xl px-6 md:px-8">
          <GlassLight className="border-slate-200/90 bg-white/90 p-10 md:p-14" hoverLift={false}>
            <h2 className="text-[clamp(1.85rem,3vw,2.45rem)] font-semibold tracking-[-0.035em] text-slate-900">
              La différence Beyond
            </h2>
            <p className="mt-4 text-[15px] font-medium text-slate-500">Une approche qui combine :</p>
            <ul className="mt-8 space-y-4 text-[17px] leading-relaxed text-slate-700">
              {["données", "compréhension humaine", "accompagnement"].map((item) => (
                <li key={item} className="flex gap-3">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-gradient-to-br from-violet-500 to-cyan-400" />
                  {item}
                </li>
              ))}
            </ul>
            <p className="mt-10 text-[16px] leading-relaxed text-slate-600">
              Pour transformer réellement les comportements.
            </p>
          </GlassLight>
        </div>
      </Section>

      {/* 7. Résultats */}
      <Section id="sol-resultats" className="scroll-mt-24 border-t border-slate-100 bg-white py-20 md:py-28">
        <div className="mx-auto max-w-6xl px-6 md:px-8">
          <h2 className="text-[clamp(1.35rem,2.6vw,1.85rem)] font-semibold tracking-[-0.03em] text-slate-900">
            Ce que ça change concrètement
          </h2>
          <div className="mt-12 flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:gap-6">
            {[
              "Plus de clarté",
              "Décisions plus rapides",
              "Meilleure communication",
              "Progression mesurable",
              "Performance durable",
            ].map((b, i) => (
              <motion.span
                key={b}
                initial={{ opacity: 0, y: 8 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.06, duration: 0.45 }}
                className="text-[clamp(1.05rem,2.2vw,1.22rem)] font-semibold tracking-[-0.02em] text-slate-800"
              >
                {b}
              </motion.span>
            ))}
          </div>
        </div>
      </Section>

      {/* 8. CTA */}
      <section id="sol-cta" className="relative scroll-mt-24 overflow-hidden py-24 md:py-32">
        <DarkAmbientBackground />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_70%_50%_at_50%_0%,rgba(139,92,246,0.2),transparent)]" />
        <div className="relative z-10 mx-auto max-w-3xl px-6 text-center md:px-8">
          <h2 className="text-[clamp(1.75rem,3.5vw,2.55rem)] font-semibold leading-tight tracking-[-0.035em] text-white">
            Passez à une approche qui fonctionne réellement.
          </h2>
          <motion.div className="mt-12" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <Link
              href="/pilote"
              className="inline-flex items-center justify-center rounded-full border border-white/20 bg-white/10 px-11 py-4 text-[15px] font-semibold text-white shadow-[0_0_48px_-12px_rgba(34,211,238,0.35)] backdrop-blur-[20px] transition-all duration-300 hover:border-cyan-300/40 hover:bg-white/15"
              style={{ WebkitBackdropFilter: "blur(20px)" }}
            >
              Lancer un pilote
            </Link>
          </motion.div>
        </div>
      </section>

      <BeyondCenterMarketingFooter />
    </div>
  );
}
