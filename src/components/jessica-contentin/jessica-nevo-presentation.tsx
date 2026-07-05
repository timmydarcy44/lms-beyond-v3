"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  BookOpen,
  Brain,
  Check,
  Eye,
  FileText,
  Headphones,
  HelpCircle,
  ImageIcon,
  Languages,
  Sparkles,
  Timer,
  Wand2,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { JessicaRemoteImage } from "@/components/jessica-contentin/jessica-remote-image";
import { IphoneMockup } from "@/components/jessica-contentin/iphone-mockup";
import { cn } from "@/lib/utils";

const NEVO_URL = "https://www.nevo-app.fr/app-landing";

const NEVO_BASE =
  "https://zmcefidiiqqppowymoqb.supabase.co/storage/v1/object/public/jessica%20contentin";

const NEVO_HERO_SCREEN = `${NEVO_BASE}/nevo7.png`;
const NEVO_CARD_IMAGE = `${NEVO_BASE}/nevo6.png`;

const SF_PRO =
  '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif';

const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  show: { opacity: 1, y: 0, transition: { duration: 0.65, ease: [0.22, 1, 0.36, 1] } },
};

const WHY_NEVO = [
  {
    emoji: "🧠",
    title: "Comprendre plus vite",
    description: "Des contenus structurés et reformulés pour saisir l'essentiel sans surcharge cognitive.",
  },
  {
    emoji: "📚",
    title: "Mémoriser durablement",
    description: "Fiches, flashcards et quiz pour ancrer les connaissances dans la durée.",
  },
  {
    emoji: "🎧",
    title: "Réviser partout",
    description: "Audio, schémas et supports mobiles pour apprendre au rythme qui vous convient.",
  },
  {
    emoji: "⏱️",
    title: "Gagner un temps précieux",
    description: "Transformez vos notes et documents en outils prêts à l'emploi en quelques instants.",
  },
] as const;

type FeatureItem = {
  title: string;
  description: string;
  icon: LucideIcon;
  gradient: string;
};

const FEATURES: FeatureItem[] = [
  {
    title: "Fiches intelligentes",
    description: "Synthèses claires à partir de vos cours et documents.",
    icon: FileText,
    gradient: "from-[#FF6B6B] to-[#FF9A56]",
  },
  {
    title: "Schémas",
    description: "Visualisez les concepts pour mieux les retenir.",
    icon: ImageIcon,
    gradient: "from-[#F97316] to-[#EF4444]",
  },
  {
    title: "Audio",
    description: "Écoutez vos contenus pour réviser en déplacement.",
    icon: Headphones,
    gradient: "from-[#F59E0B] to-[#FBBF24]",
  },
  {
    title: "Quiz",
    description: "Testez vos acquis avec des questions ciblées.",
    icon: HelpCircle,
    gradient: "from-[#9333EA] to-[#C026D3]",
  },
  {
    title: "Flashcards",
    description: "Mémorisez par répétition espacée, à votre rythme.",
    icon: BookOpen,
    gradient: "from-[#2563EB] to-[#38BDF8]",
  },
  {
    title: "Reformulation",
    description: "Clarifiez un texte sans en trahir le fond.",
    icon: Wand2,
    gradient: "from-[#A855F7] to-[#EC4899]",
  },
  {
    title: "Traduction",
    description: "Accédez à vos contenus dans d'autres langues.",
    icon: Languages,
    gradient: "from-[#3B82F6] to-[#06B6D4]",
  },
  {
    title: "Analyse",
    description: "Identifiez les idées clés d'un document complexe.",
    icon: Sparkles,
    gradient: "from-[#8B5CF6] to-[#D946EF]",
  },
  {
    title: "Focus",
    description: "Concentrez-vous sur l'essentiel, sans distraction.",
    icon: Eye,
    gradient: "from-[#0EA5E9] to-[#6366F1]",
  },
  {
    title: "Pomodoro",
    description: "Structurez vos sessions de travail efficacement.",
    icon: Timer,
    gradient: "from-[#EA580C] to-[#DC2626]",
  },
  {
    title: "Mode neuro-adapté",
    description: "Affichage pensé pour les profils DYS et atypiques.",
    icon: Brain,
    gradient: "from-[#7C3AED] to-[#DB2777]",
  },
];

function PremiumBackground() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      <div className="absolute inset-0 bg-gradient-to-b from-white via-[#FFFCF9] to-[#F3E8D8]/80" />
      <div className="absolute -left-[20%] top-[8%] h-[520px] w-[520px] rounded-full bg-[#E6D9C6]/25 blur-[100px]" />
      <div className="absolute -right-[12%] top-[32%] h-[480px] w-[480px] rounded-full bg-[#C6A664]/12 blur-[110px]" />
      <div className="absolute bottom-[10%] left-[30%] h-[360px] w-[360px] rounded-full bg-[#F3E8D8]/60 blur-[90px]" />
    </div>
  );
}

function HeroPhone() {
  return (
    <div className="relative mx-auto w-full max-w-[min(100%,440px)] lg:max-w-none lg:translate-y-6">
      <div className="pointer-events-none absolute left-1/2 top-1/2 h-[min(90vw,420px)] w-[min(90vw,420px)] -translate-x-1/2 -translate-y-[45%] rounded-full bg-[radial-gradient(circle,rgba(198,166,100,0.38)_0%,rgba(230,217,198,0.18)_42%,transparent_72%)] blur-2xl" />
      <div className="pointer-events-none absolute inset-x-[8%] bottom-[6%] top-[18%] rounded-[3.5rem] bg-gradient-to-b from-white/50 to-[#E6D9C6]/20 opacity-80 backdrop-blur-sm" />

      <motion.div
        initial={{ opacity: 0, y: 40, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1], delay: 0.15 }}
        className="relative z-10 mb-[-3rem] lg:mb-[-4.5rem]"
      >
        <div className="pointer-events-none absolute -inset-x-4 top-[12%] h-[55%] rounded-[3rem] bg-gradient-to-b from-white/30 to-transparent opacity-70" />
        <IphoneMockup
          src={NEVO_HERO_SCREEN}
          alt="Application NEVO — menu des fonctionnalités sur smartphone"
          priority
          className="relative z-10 w-[min(100%,340px)] sm:w-[min(100%,380px)] lg:w-[min(100%,420px)]"
          premium
        />
      </motion.div>
    </div>
  );
}

function FeatureCard({ feature }: { feature: FeatureItem }) {
  const Icon = feature.icon;
  return (
    <motion.div
      variants={fadeUp}
      whileHover={{ y: -4, transition: { duration: 0.25 } }}
      className="group rounded-2xl border border-[#E6D9C6]/60 bg-white/90 p-4 shadow-[0_8px_32px_-20px_rgba(47,42,37,0.14)] backdrop-blur-sm transition-shadow duration-300 hover:border-[#C6A664]/35 hover:shadow-[0_16px_40px_-18px_rgba(47,42,37,0.18)] sm:p-5"
    >
      <span
        className={cn(
          "mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br text-white shadow-sm transition-transform duration-300 group-hover:scale-105",
          feature.gradient,
        )}
      >
        <Icon className="h-4 w-4" strokeWidth={2} />
      </span>
      <h4 className="text-sm font-semibold tracking-tight text-[#2F2A25]">{feature.title}</h4>
      <p className="mt-1.5 text-xs leading-relaxed text-[#5C5348]/90">{feature.description}</p>
    </motion.div>
  );
}

export function JessicaNevoPresentation() {
  return (
    <div id="nevo" className="relative scroll-mt-24 overflow-x-clip">
      <PremiumBackground />

      {/* Hero */}
      <section className="relative px-4 pb-20 pt-10 sm:px-6 md:pb-28 md:pt-14 lg:px-10 lg:pb-32">
        <div className="relative mx-auto max-w-7xl">
          <Link
            href="/jessica-contentin/ressources"
            className="mb-10 inline-flex text-sm font-medium text-[#8B6F47] transition hover:text-[#C6A664]"
            style={{ fontFamily: SF_PRO }}
          >
            ← Tous les outils
          </Link>

          <div className="grid items-center gap-14 lg:grid-cols-2 lg:gap-16 xl:gap-20">
            <motion.div
              initial="hidden"
              animate="show"
              variants={fadeUp}
              className="max-w-xl space-y-8 lg:py-6"
            >
              <p
                className="text-[11px] font-semibold uppercase tracking-[0.38em] text-[#9A7B52]"
                style={{ fontFamily: SF_PRO }}
              >
                Outils &amp; ressources
              </p>

              <h1
                className="text-[2.35rem] font-semibold leading-[1.05] tracking-tight text-[#2F2A25] sm:text-5xl lg:text-[3.35rem]"
                style={{ fontFamily: SF_PRO }}
              >
                Application{" "}
                <span className="bg-gradient-to-r from-[#B88A44] via-[#C6A664] to-[#D4B878] bg-clip-text text-transparent">
                  NEVO
                </span>
              </h1>

              <p
                className="max-w-lg text-lg leading-snug text-[#2F2A25]/85 md:text-xl md:leading-snug"
                style={{ fontFamily: SF_PRO }}
              >
                Un outil numérique conçu pour transformer les contenus pédagogiques en supports
                d&apos;apprentissage adaptés à chaque fonctionnement.
              </p>

              <p
                className="max-w-lg text-base leading-relaxed text-[#5C5348] md:text-[17px]"
                style={{ fontFamily: SF_PRO }}
              >
                NEVO aide les élèves, étudiants et apprenants à apprendre plus efficacement grâce à des
                fiches intelligentes, schémas, quiz, cartes mentales, audio, reformulation et outils
                neuro-adaptés.
              </p>

              <div className="flex flex-wrap items-center gap-4 pt-2">
                <Button
                  asChild
                  size="lg"
                  className="h-12 rounded-2xl bg-[#C6A664] px-8 text-[15px] font-semibold text-white shadow-[0_8px_24px_-8px_rgba(198,166,100,0.55)] transition-all duration-300 hover:-translate-y-0.5 hover:bg-[#B88A44] hover:shadow-[0_12px_32px_-8px_rgba(198,166,100,0.5)]"
                  style={{ fontFamily: SF_PRO }}
                >
                  <Link href={NEVO_URL} target="_blank" rel="noopener noreferrer">
                    Découvrir NEVO
                  </Link>
                </Button>
                <Button
                  asChild
                  size="lg"
                  variant="outline"
                  className="h-12 rounded-2xl border-[#E6D9C6] bg-white/40 px-8 text-[15px] font-medium text-[#2F2A25] backdrop-blur-sm transition-all duration-300 hover:border-[#C6A664]/50 hover:bg-[#FFFCF9]"
                  style={{ fontFamily: SF_PRO }}
                >
                  <a href="#fonctionnalites">Voir les fonctionnalités</a>
                </Button>
              </div>

              <p
                className="inline-flex max-w-md items-start gap-2 rounded-2xl border border-[#E6D9C6]/70 bg-white/60 px-4 py-3 text-xs leading-relaxed text-[#5C5348] backdrop-blur-sm"
                style={{ fontFamily: SF_PRO }}
              >
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#C6A664]" strokeWidth={2.5} />
                <span>Recommandée dans le cadre des accompagnements du cabinet Jessica Contentin.</span>
              </p>
            </motion.div>

            <HeroPhone />
          </div>
        </div>
      </section>

      {/* Pourquoi utiliser NEVO */}
      <section className="relative px-4 py-20 sm:px-6 md:py-28 lg:px-10">
        <div className="mx-auto max-w-7xl">
          <motion.div
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-80px" }}
            variants={fadeUp}
            className="mb-14 max-w-2xl md:mb-16"
          >
            <p className="text-[11px] font-semibold uppercase tracking-[0.38em] text-[#9A7B52]">
              Pourquoi NEVO
            </p>
            <h2
              className="mt-4 text-3xl font-semibold tracking-tight text-[#2F2A25] md:text-4xl"
              style={{ fontFamily: SF_PRO }}
            >
              Pourquoi utiliser NEVO
            </h2>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-60px" }}
            variants={{ show: { transition: { staggerChildren: 0.08 } } }}
            className="grid gap-6 sm:grid-cols-2 lg:gap-8"
          >
            {WHY_NEVO.map((item) => (
              <motion.article
                key={item.title}
                variants={fadeUp}
                whileHover={{ y: -6, transition: { duration: 0.3 } }}
                className="rounded-[24px] border border-[#E6D9C6]/50 bg-white p-8 shadow-[0_20px_60px_-32px_rgba(47,42,37,0.12)] transition-shadow duration-300 hover:shadow-[0_28px_70px_-28px_rgba(47,42,37,0.16)] sm:p-10"
              >
                <span className="text-4xl" role="img" aria-hidden>
                  {item.emoji}
                </span>
                <h3
                  className="mt-6 text-xl font-semibold tracking-tight text-[#2F2A25]"
                  style={{ fontFamily: SF_PRO }}
                >
                  {item.title}
                </h3>
                <p className="mt-4 max-w-sm text-base leading-relaxed text-[#5C5348]">{item.description}</p>
              </motion.article>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Fonctionnalités + carte Jessica */}
      <section
        id="fonctionnalites"
        className="relative scroll-mt-28 px-4 py-20 sm:px-6 md:py-28 lg:px-10"
      >
        <div className="mx-auto max-w-7xl">
          <motion.div
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-80px" }}
            variants={fadeUp}
            className="mb-14 max-w-2xl md:mb-16"
          >
            <p className="text-[11px] font-semibold uppercase tracking-[0.38em] text-[#9A7B52]">
              Fonctionnalités
            </p>
            <h2
              className="mt-4 text-3xl font-semibold tracking-tight text-[#2F2A25] md:text-4xl"
              style={{ fontFamily: SF_PRO }}
            >
              Tout ce dont vous avez besoin pour apprendre autrement
            </h2>
          </motion.div>

          <div className="grid items-start gap-10 lg:grid-cols-[1.15fr_0.85fr] lg:gap-12 xl:gap-16">
            <motion.div
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, margin: "-60px" }}
              variants={{ show: { transition: { staggerChildren: 0.04 } } }}
              className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3"
            >
              {FEATURES.map((feature) => (
                <FeatureCard key={feature.title} feature={feature} />
              ))}
            </motion.div>

            <motion.aside
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, margin: "-60px" }}
              variants={fadeUp}
              className="overflow-hidden rounded-[24px] border border-[#E6D9C6]/60 bg-white shadow-[0_24px_70px_-32px_rgba(47,42,37,0.14)] lg:sticky lg:top-28"
            >
              <div className="relative aspect-[4/3] overflow-hidden bg-gradient-to-br from-[#FFFCF9] via-[#F8F5F0] to-[#EDE5D8]">
                <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_70%_30%,rgba(198,166,100,0.15),transparent_60%)]" />
                <JessicaRemoteImage
                  src={NEVO_CARD_IMAGE}
                  alt="Interface NEVO — application minimaliste"
                  className="relative z-10 mx-auto h-full w-auto max-w-[78%] object-contain py-8 drop-shadow-[0_24px_48px_-16px_rgba(47,42,37,0.2)]"
                />
              </div>

              <div className="space-y-5 px-8 py-10 sm:px-10 sm:py-12">
                <h3
                  className="text-xl font-semibold leading-snug tracking-tight text-[#2F2A25] md:text-2xl"
                  style={{ fontFamily: SF_PRO }}
                >
                  Pourquoi je recommande NEVO au cabinet ?
                </h3>
                <p className="text-base leading-relaxed text-[#5C5348]">
                  Parce que l&apos;application s&apos;inscrit dans une approche globale : mieux comprendre son
                  fonctionnement, structurer ses apprentissages et utiliser des outils adaptés au quotidien.
                  NEVO ne remplace pas l&apos;accompagnement mais devient un véritable prolongement des séances.
                </p>
                <div className="border-t border-[#E6D9C6]/80 pt-6">
                  <p
                    className="font-[family-name:var(--font-fraunces),Georgia,serif] text-2xl italic text-[#2F2A25]"
                    style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
                  >
                    Jessica Contentin
                  </p>
                  <p className="mt-1 text-sm font-medium tracking-wide text-[#8B6F47]">Psychopédagogue</p>
                </div>
              </div>
            </motion.aside>
          </div>
        </div>
      </section>

      {/* CTA final */}
      <section className="relative px-4 pb-24 pt-8 sm:px-6 md:pb-32 lg:px-10">
        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          variants={fadeUp}
          className="mx-auto max-w-3xl rounded-[24px] border border-[#C6A664]/25 bg-white/70 px-10 py-14 text-center shadow-[0_24px_70px_-32px_rgba(47,42,37,0.12)] backdrop-blur-md md:px-14 md:py-16"
        >
          <h3
            className="text-2xl font-semibold tracking-tight text-[#2F2A25] md:text-3xl"
            style={{ fontFamily: SF_PRO }}
          >
            Prolongez l&apos;accompagnement au quotidien
          </h3>
          <p className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-[#5C5348]">
            Pensée pour les enfants, adolescents, étudiants et familles, NEVO complète le suivi en cabinet
            avec des outils concrets, accessibles depuis n&apos;importe où.
          </p>
          <Button
            asChild
            size="lg"
            className="mt-8 h-12 rounded-2xl bg-[#C6A664] px-10 text-[15px] font-semibold text-white shadow-[0_8px_24px_-8px_rgba(198,166,100,0.55)] transition-all duration-300 hover:-translate-y-0.5 hover:bg-[#B88A44]"
            style={{ fontFamily: SF_PRO }}
          >
            <Link href={NEVO_URL} target="_blank" rel="noopener noreferrer">
              Essayer NEVO
            </Link>
          </Button>
        </motion.div>
      </section>
    </div>
  );
}
