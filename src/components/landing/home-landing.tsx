"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  ResponsiveContainer,
} from "recharts";
import { BadgeCheck, Radar as RadarIcon, Sparkles } from "lucide-react";

const revealProps = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] as const },
  viewport: { once: true, amount: 0.25 },
};

const radarProfiles = [
  [
    { trait: "Dominant", value: 88 },
    { trait: "Influent", value: 76 },
    { trait: "Stable", value: 42 },
    { trait: "Conforme", value: 36 },
  ],
  [
    { trait: "Dominant", value: 92 },
    { trait: "Influent", value: 70 },
    { trait: "Stable", value: 50 },
    { trait: "Conforme", value: 28 },
  ],
];

const faqs = [
  {
    question: "Le test est-il vraiment gratuit ?",
    answer:
      "Oui. Vous pouvez passer le test DISC et obtenir votre première synthèse sans frais.",
  },
  {
    question: "Combien de temps faut-il pour obtenir le résultat ?",
    answer:
      "Moins de 5 minutes pour le test, votre radar et vos badges sont disponibles immédiatement.",
  },
  {
    question: "À quoi sert la certification ?",
    answer:
      "Elle rend vos soft skills vérifiables et visibles par les recruteurs partenaires.",
  },
];

const logos = ["Alésia", "Entreprises", "Talentia", "Nova HR", "CFA+", "Skillup"];

export function HomeLanding() {
  const [profileIndex, setProfileIndex] = useState(0);
  const radarData = useMemo(() => radarProfiles[profileIndex], [profileIndex]);

  useEffect(() => {
    const interval = setInterval(() => {
      setProfileIndex((prev) => (prev + 1) % radarProfiles.length);
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  return (
    <main className="bg-[#0B0B0B] text-white">
      <section className="relative overflow-hidden px-6 pb-24 pt-16 sm:px-10 lg:px-20">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,107,0,0.22),transparent_55%)]" />
        <div className="relative mx-auto flex max-w-6xl flex-col gap-12">
          <motion.header
            {...revealProps}
            className="flex items-center justify-between text-[12px] uppercase tracking-[0.35em] text-white/70"
          >
            <span>Beyond</span>
            <Link href="/login" className="text-white/60 hover:text-white">
              Se connecter
            </Link>
          </motion.header>

          <motion.div {...revealProps} className="max-w-3xl space-y-6">
            <h1 className="text-balance text-4xl font-semibold leading-tight sm:text-5xl lg:text-6xl">
              Découvrez votre potentiel. Gérez votre carrière.
            </h1>
            <p className="text-pretty text-base text-white/70 sm:text-lg">
              Passez le test DISC gratuitement, certifiez vos soft skills et devenez visible
              auprès des recruteurs.
            </p>
            <div className="flex flex-wrap items-center gap-4">
              <Link
                href="/register"
                className="rounded-full bg-[#FF6B00] px-6 py-3 text-sm font-semibold text-[#111827] shadow-[0_0_30px_rgba(255,107,0,0.35)] transition hover:shadow-[0_0_45px_rgba(255,107,0,0.6)]"
              >
                Commencer le test gratuit
              </Link>
              <span className="text-xs text-white/60">Aucune carte requise</span>
            </div>
          </motion.div>
        </div>
      </section>

      <section className="bg-[#111111] px-6 py-10 sm:px-10">
        <motion.div
          {...revealProps}
          className="mx-auto flex max-w-6xl flex-col gap-6 text-center"
        >
          <p className="text-xs uppercase tracking-[0.3em] text-white/50">
            Ils nous font confiance
          </p>
          <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-white/50">
            {logos.map((logo) => (
              <span key={logo} className="font-semibold tracking-wide">
                {logo}
              </span>
            ))}
          </div>
        </motion.div>
      </section>

      <section className="px-6 py-20 sm:px-10 lg:px-20">
        <motion.div {...revealProps} className="mx-auto max-w-6xl space-y-12">
          <div className="space-y-3 text-center">
            <p className="text-xs uppercase tracking-[0.3em] text-white/50">
              Comment ça marche
            </p>
            <h2 className="text-2xl font-semibold sm:text-3xl">Un parcours simple en 3 étapes</h2>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {[
              {
                title: "Auto-diagnostic",
                desc: "Test DISC & IDMC en 5 minutes.",
                icon: <Sparkles className="h-6 w-6 text-[#FF6B00]" />,
              },
              {
                title: "Certification",
                desc: "Obtenez vos badges et votre radar de compétences.",
                icon: <BadgeCheck className="h-6 w-6 text-[#FF6B00]" />,
              },
              {
                title: "Opportunités",
                desc: "Soyez chassé par des entreprises selon vos forces réelles.",
                icon: <RadarIcon className="h-6 w-6 text-[#FF6B00]" />,
              },
            ].map((step) => (
              <div
                key={step.title}
                className="rounded-3xl border border-white/10 bg-white/[0.04] p-6"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/[0.06]">
                  {step.icon}
                </div>
                <h3 className="mt-5 text-lg font-semibold">{step.title}</h3>
                <p className="mt-2 text-sm text-white/60">{step.desc}</p>
              </div>
            ))}
          </div>
        </motion.div>
      </section>

      <section className="px-6 pb-24 sm:px-10 lg:px-20">
        <motion.div
          {...revealProps}
          className="mx-auto grid max-w-6xl gap-10 rounded-3xl border border-white/10 bg-white/[0.03] p-8 lg:grid-cols-[1.1fr_1fr]"
        >
          <div className="space-y-5">
            <p className="text-xs uppercase tracking-[0.3em] text-white/50">Le Radar Beyond</p>
            <h2 className="text-2xl font-semibold sm:text-3xl">
              Visualisez l&apos;ADN comportemental qui fait la différence.
            </h2>
            <p className="text-sm text-white/70 sm:text-base">
              Notre radar vous aide à comprendre vos forces naturelles et à les projeter sur des
              postes où vous aurez le plus d&apos;impact. Les recruteurs consultent ce profil pour
              matcher rapidement avec vos compétences réelles.
            </p>
            <Link href="/register" className="inline-flex text-sm font-semibold text-[#FF6B00]">
              Explorer mon profil →
            </Link>
          </div>
          <div className="h-[260px] w-full sm:h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarData}>
                <PolarGrid stroke="rgba(255,255,255,0.15)" />
                <PolarAngleAxis dataKey="trait" tick={{ fill: "rgba(255,255,255,0.7)", fontSize: 12 }} />
                <Radar
                  dataKey="value"
                  stroke="#FF6B00"
                  fill="rgba(255,107,0,0.35)"
                  isAnimationActive
                  animationDuration={900}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </section>

      <section className="px-6 pb-20 sm:px-10 lg:px-20">
        <motion.div {...revealProps} className="mx-auto max-w-5xl space-y-10">
          <div className="text-center">
            <h2 className="text-2xl font-semibold sm:text-3xl">FAQ</h2>
            <p className="mt-2 text-sm text-white/60">
              Tout ce qu&apos;il faut savoir pour démarrer sereinement.
            </p>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {faqs.map((faq) => (
              <div key={faq.question} className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                <h3 className="text-sm font-semibold">{faq.question}</h3>
                <p className="mt-2 text-xs text-white/60">{faq.answer}</p>
              </div>
            ))}
          </div>
          <div className="flex flex-col items-center gap-4 rounded-3xl border border-white/10 bg-white/[0.04] p-6 text-center">
            <p className="text-sm text-white/70">
              Prêt à révéler votre potentiel et recevoir vos premières opportunités ?
            </p>
            <Link
              href="/register"
              className="rounded-full bg-[#FF6B00] px-6 py-3 text-sm font-semibold text-[#111827] shadow-[0_0_25px_rgba(255,107,0,0.35)] transition hover:shadow-[0_0_40px_rgba(255,107,0,0.6)]"
            >
              Commencer le test gratuit
            </Link>
          </div>
        </motion.div>
      </section>

      <footer className="border-t border-white/10 px-6 py-8 text-center text-xs text-white/50 sm:px-10">
        Beyond © 2026 · Tous droits réservés
      </footer>
    </main>
  );
}
