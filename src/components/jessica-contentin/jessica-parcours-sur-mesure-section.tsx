"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { JESSICA_CREAM_CTA } from "@/lib/jessica-contentin/cream-cta";

const VIDEO_PARCOURS =
  "https://zmcefidiiqqppowymoqb.supabase.co/storage/v1/object/public/jessica%20contentin/VIDEO%20PARCOURS%20SURMESURE.mp4";

const BOOKING_URL = "https://perfactive.fr/psychopedagogue/rocquancourt/jessica-contentin";

const SERIF = 'var(--font-fraunces), "Fraunces", Georgia, "Times New Roman", serif';

const POINTS = [
  {
    title: "Un objectif clair",
    text: "Examen, diplôme, concours, remise à niveau ou projet scolaire — le parcours part de votre but.",
  },
  {
    title: "LMS neuro-adapté",
    text: "Une plateforme conçue pour s’ajuster au fonctionnement cognitif, attentionnel et émotionnel de chacun.",
  },
  {
    title: "Contenu sur mesure",
    text: "Ressources, exercices et suivi calibrés pour votre profil — pas un programme générique.",
  },
] as const;

/** Parcours sur mesure — objectif, examen, diplôme + LMS neuro-adapté. */
export function JessicaParcoursSurMesureSection() {
  return (
    <motion.section
      id="parcours-sur-mesure"
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.55 }}
      className="scroll-mt-24 border-y border-[#E6D9C6]/60 bg-[#F7F3EC] py-16 md:py-24"
      aria-labelledby="parcours-sur-mesure-title"
    >
      <div className="mx-auto max-w-7xl px-4 md:px-8">
        <div className="grid gap-12 lg:grid-cols-2 lg:items-stretch lg:gap-16">
          <div className="flex min-h-[280px] w-full flex-col self-stretch order-2 lg:order-1 lg:min-h-0 lg:h-full">
            <div className="relative min-h-[280px] flex-1 overflow-hidden rounded-3xl bg-[#EDE6DC] shadow-[0_28px_70px_-28px_rgba(45,36,28,0.35)] lg:min-h-0">
              <video
                className="absolute inset-0 h-full w-full object-cover"
                src={VIDEO_PARCOURS}
                autoPlay
                muted
                loop
                playsInline
                controls
                preload="auto"
              />
            </div>
          </div>

          <div className="order-1 space-y-6 text-[#2F2A25] lg:order-2">
            <p className="text-[11px] font-semibold uppercase tracking-[0.32em] text-[#9A7B52]">
              Sur mesure
            </p>
            <h2
              id="parcours-sur-mesure-title"
              className="text-3xl font-semibold tracking-tight md:text-4xl"
              style={{ fontFamily: SERIF }}
            >
              Création de parcours sur mesure
            </h2>
            <p className="text-lg leading-relaxed text-[#4A4339]">
              En qualité de professeure en santé, je propose aux personnes qui le souhaitent des{" "}
              <strong className="font-semibold text-[#2F2A25]">parcours pédagogiques sur mesure</strong> —
              autour d&apos;un objectif, d&apos;une préparation à un examen ou d&apos;un diplôme.
            </p>
            <p className="text-base leading-relaxed text-[#5C5348]">
              Chaque parcours s&apos;appuie sur un LMS neuro-adapté et des contenus personnalisés, pour avancer
              au bon rythme avec les bons outils.
            </p>

            <ul className="space-y-5">
              {POINTS.map((point) => (
                <li key={point.title} className="border-l-2 border-[#C6A664]/60 pl-4">
                  <p className="font-semibold text-[#2F2A25]">{point.title}</p>
                  <p className="mt-1 text-base leading-relaxed text-[#5C5348]">{point.text}</p>
                </li>
              ))}
            </ul>

            <Button asChild className={`${JESSICA_CREAM_CTA} w-fit px-8 py-6 text-base`}>
              <Link href={BOOKING_URL} target="_blank" rel="noopener noreferrer">
                Concevoir mon parcours
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </motion.section>
  );
}
