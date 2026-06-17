"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  BookOpen,
  Brain,
  Eye,
  FileText,
  Headphones,
  HelpCircle,
  ImageIcon,
  Languages,
  Sparkles,
  Timer,
  Wand2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { JessicaRemoteImage } from "@/components/jessica-contentin/jessica-remote-image";
import { NevoWordmark } from "@/components/jessica-contentin/nevo-wordmark";

const NEVO_URL = "https://www.nevo-app.fr/app-landing";

const NEVO_BASE =
  "https://zmcefidiiqqppowymoqb.supabase.co/storage/v1/object/public/jessica%20contentin";

const NEVO_FEATURES_IMAGE = `${NEVO_BASE}/nevo7.png`;
const NEVO_NEURO_IMAGE = `${NEVO_BASE}/nevo6.png`;

const NEVO_APP_FEATURES = [
  { name: "Fiche", icon: FileText, gradient: "from-[#FF6B6B] to-[#FF9A56]" },
  { name: "Reformuler", icon: Wand2, gradient: "from-[#A855F7] to-[#EC4899]" },
  { name: "Traduire", icon: Languages, gradient: "from-[#3B82F6] to-[#06B6D4]" },
  { name: "Schéma", icon: ImageIcon, gradient: "from-[#F97316] to-[#EF4444]" },
  { name: "Analyser", icon: Sparkles, gradient: "from-[#8B5CF6] to-[#D946EF]" },
  { name: "Audio", icon: Headphones, gradient: "from-[#F59E0B] to-[#FBBF24]" },
  { name: "Flashcards", icon: BookOpen, gradient: "from-[#2563EB] to-[#38BDF8]" },
  { name: "Quiz", icon: HelpCircle, gradient: "from-[#9333EA] to-[#C026D3]" },
  { name: "Focus", icon: Eye, gradient: "from-[#0EA5E9] to-[#6366F1]" },
  { name: "Pomodoro", icon: Timer, gradient: "from-[#EA580C] to-[#DC2626]" },
  { name: "Neuro", icon: Brain, gradient: "from-[#7C3AED] to-[#DB2777]" },
] as const;

const NEURO_BENEFITS = [
  "Espacement des lettres et des mots pour faciliter la lecture",
  "Syllabes et terminaisons mises en couleur",
  "Soulignements ciblés sur les segments difficiles",
  "Aperçu intelligent du cours, adapté aux profils DYS",
  "Transformation du contenu sans le simplifier à l'excès",
] as const;

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

function ProductShowcase({
  kicker,
  title,
  description,
  imageSrc,
  imageAlt,
  imageFirst = false,
  children,
  priority = false,
}: {
  kicker: string;
  title: string;
  description: string;
  imageSrc: string;
  imageAlt: string;
  imageFirst?: boolean;
  children?: ReactNode;
  priority?: boolean;
}) {
  const textBlock = (
    <div className="flex flex-col justify-center gap-5">
      <p className="text-[11px] font-semibold uppercase tracking-[0.32em] text-[#9A7B52]">{kicker}</p>
      <h3 className="text-2xl font-semibold tracking-tight text-[#2F2A25] md:text-3xl">{title}</h3>
      <p className="text-base leading-relaxed text-[#5C5348] md:text-lg">{description}</p>
      {children}
    </div>
  );

  const imageBlock = (
    <div className="relative flex items-center justify-center">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_40%,rgba(198,166,100,0.2),transparent_65%)]" />
      <JessicaRemoteImage
        src={imageSrc}
        alt={imageAlt}
        priority={priority}
        className="relative z-10 mx-auto h-auto w-full max-w-[300px] drop-shadow-[0_32px_48px_-16px_rgba(47,42,37,0.35)] md:max-w-[320px]"
      />
    </div>
  );

  return (
    <motion.div
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: "-60px" }}
      variants={fadeUp}
      className="grid items-center gap-10 lg:grid-cols-2 lg:gap-14"
    >
      {imageFirst ? (
        <>
          {imageBlock}
          {textBlock}
        </>
      ) : (
        <>
          {textBlock}
          {imageBlock}
        </>
      )}
    </motion.div>
  );
}

export function JessicaNevoPresentation() {
  return (
    <div id="nevo" className="scroll-mt-24 space-y-16 px-4 pb-16 md:space-y-20">
      {/* Intro */}
      <motion.section
        initial="hidden"
        whileInView="show"
        viewport={{ once: true }}
        variants={fadeUp}
        className="mx-auto max-w-7xl overflow-hidden rounded-3xl border border-[#E6D9C6] bg-gradient-to-br from-white via-[#FFFCF9] to-[#F3E8D8] p-8 shadow-[0_24px_70px_-32px_rgba(47,42,37,0.22)] md:p-12"
      >
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-[11px] font-semibold uppercase tracking-[0.32em] text-[#9A7B52]">
            Application partenaire
          </p>
          <div className="mt-5 flex flex-col items-center justify-center gap-3 sm:flex-row sm:gap-4">
            <NevoWordmark />
            <span className="text-sm font-medium text-[#5C5348]">Performance cognitive</span>
          </div>
          <h2 className="mt-6 text-2xl font-semibold tracking-tight text-[#2F2A25] md:text-4xl">
            Une application pensée pour apprendre autrement
          </h2>
          <p className="mt-4 text-base leading-relaxed text-[#5C5348] md:text-lg">
            Nevo transforme vos contenus en fiches, schémas, audio, quiz et bien plus — avec un mode neuro
            adapté pour les apprenants ayant des troubles DYS.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Button
              asChild
              size="lg"
              className="rounded-full bg-[#C6A664] px-8 text-white hover:bg-[#B88A44]"
            >
              <Link href={NEVO_URL} target="_blank" rel="noopener noreferrer">
                Découvrir Nevo
              </Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="rounded-full border-[#C6A664]/50 bg-white px-8 text-[#2F2A25] hover:bg-[#FDF9F3]"
            >
              <a href="#ressources-a-telecharger">Ressources à télécharger</a>
            </Button>
          </div>
        </div>
      </motion.section>

      {/* Show product 1 — 11 fonctionnalités (nevo7) */}
      <section className="mx-auto max-w-7xl">
        <div className="overflow-hidden rounded-3xl border border-[#E6D9C6] bg-white p-8 shadow-[0_20px_60px_-28px_rgba(47,42,37,0.18)] md:p-12">
          <ProductShowcase
            kicker="Fonctionnalités"
            title="11 outils pour transformer et réviser"
            description="Depuis une photo, une prise de note ou un document de cours, Nevo propose un menu complet : fiche, reformulation, traduction, schéma, analyse, audio, flashcards, quiz, focus, pomodoro et mode neuro."
            imageSrc={NEVO_FEATURES_IMAGE}
            imageAlt="Écran Nevo — menu des 11 fonctionnalités : fiche, reformuler, traduire, schéma, analyser, audio, flashcards, quiz, focus, pomodoro et neuro"
            priority
          >
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
              {NEVO_APP_FEATURES.map(({ name, icon: Icon, gradient }) => (
                <div
                  key={name}
                  className="flex items-center gap-2.5 rounded-xl border border-[#E6D9C6]/70 bg-[#FFFCF9] px-3 py-2.5"
                >
                  <span
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br ${gradient} text-white shadow-sm`}
                  >
                    <Icon className="h-3.5 w-3.5" strokeWidth={2} />
                  </span>
                  <span className="text-xs font-semibold text-[#2F2A25] md:text-sm">{name}</span>
                </div>
              ))}
            </div>
          </ProductShowcase>
        </div>
      </section>

      {/* Show product 2 — mode neuro adapté (nevo6) */}
      <section className="mx-auto max-w-7xl">
        <div className="overflow-hidden rounded-3xl border border-[#E6D9C6] bg-gradient-to-br from-[#FFFCF9] via-white to-[#F3E8D8] p-8 shadow-[0_20px_60px_-28px_rgba(47,42,37,0.18)] md:p-12">
          <ProductShowcase
            kicker="Mode neuro adapté"
            title="Un contenu transformé pour les profils DYS"
            description="Le mode neuro réorganise l'affichage du texte pour les apprenants dyslexiques et les profils atypiques : espacement, couleurs syllabiques et repères visuels qui facilitent la compréhension sans trahir le fond du cours."
            imageSrc={NEVO_NEURO_IMAGE}
            imageAlt="Écran Nevo — mode neuro adapté avec espacement des lettres, syllabes colorées et soulignements pour apprenants DYS"
            imageFirst
          >
            <ul className="space-y-3">
              {NEURO_BENEFITS.map((item) => (
                <li key={item} className="flex gap-3 text-sm leading-relaxed text-[#5C5348] md:text-base">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#C6A664]" aria-hidden />
                  {item}
                </li>
              ))}
            </ul>
          </ProductShowcase>
        </div>
      </section>

      {/* CTA final */}
      <motion.section
        initial="hidden"
        whileInView="show"
        viewport={{ once: true }}
        variants={fadeUp}
        className="mx-auto max-w-3xl rounded-3xl border border-[#C6A664]/35 bg-[#C6A664]/10 px-8 py-10 text-center md:px-12"
      >
        <h3 className="text-xl font-semibold text-[#2F2A25] md:text-2xl">
          Prolongez l&apos;accompagnement psychopédagogique au quotidien
        </h3>
        <p className="mt-3 text-sm leading-relaxed text-[#5C5348] md:text-base">
          Pensée pour les enfants, adolescents, étudiants et familles, Nevo complète le suivi en cabinet avec
          des outils concrets, accessibles depuis n&apos;importe où.
        </p>
        <Button
          asChild
          size="lg"
          className="mt-6 rounded-full bg-[#C6A664] px-10 text-white hover:bg-[#B88A44]"
        >
          <Link href={NEVO_URL} target="_blank" rel="noopener noreferrer">
            Essayer Nevo
          </Link>
        </Button>
      </motion.section>
    </div>
  );
}
