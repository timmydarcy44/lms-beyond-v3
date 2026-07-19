"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";

const BOOKING_URL = "https://perfactive.fr/psychopedagogue/rocquancourt/jessica-contentin";

const REASONS = [
  "manque de confiance",
  "ne comprend plus comment apprendre",
  "présente un TDAH, un TSA ou un trouble DYS",
  "se décourage rapidement",
  "souffre de stress ou d’anxiété scolaire",
  "rencontre des difficultés d’organisation",
  "ne trouve plus de sens à sa scolarité",
] as const;

/** Bloc conversion — reconnaissance parentale, juste avant les témoignages. */
export function JessicaPourquoiConsulterSection() {
  return (
    <motion.section
      id="pourquoi-consulter"
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6 }}
      className="scroll-mt-24 bg-[#F8F2EA]/70"
    >
      <div className="mx-auto max-w-5xl px-4 py-16 md:px-8 md:py-20">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#9A7B52]">
            Se reconnaître
          </p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight text-[#2F2A25] md:text-4xl">
            Pourquoi consulter&nbsp;?
          </h2>
          <p className="mt-4 text-base leading-relaxed text-[#5C5348] md:text-lg">
            Votre enfant… a besoin d&apos;être accompagné pour{" "}
            <span className="font-semibold text-[#2F2A25]">mieux comprendre son fonctionnement</span>.
          </p>
        </div>

        <ul className="mx-auto mt-10 grid max-w-3xl gap-3 sm:grid-cols-2">
          {REASONS.map((reason) => (
            <li
              key={reason}
              className="flex items-start gap-3 rounded-2xl border border-[#E6D9C6]/90 bg-white/80 px-4 py-3.5 text-left shadow-[0_10px_30px_-24px_rgba(60,48,36,0.35)]"
            >
              <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#C6A664]/20 text-[#8B6914]">
                <Check className="h-3.5 w-3.5" strokeWidth={2.5} aria-hidden />
              </span>
              <span className="text-[15px] leading-snug text-[#2F2A25] md:text-base">{reason}</span>
            </li>
          ))}
        </ul>

        <p className="mx-auto mt-10 max-w-2xl text-center text-base leading-relaxed text-[#5C5348] md:text-lg">
          Chaque accompagnement commence par une compréhension individualisée du fonctionnement cognitif,
          attentionnel et émotionnel — pour construire des stratégies vraiment adaptées.
        </p>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Button asChild className="rounded-full bg-[#C4704B] px-8 text-white hover:bg-[#A85A38]">
            <a href={BOOKING_URL} target="_blank" rel="noopener noreferrer">
              Prendre rendez-vous
            </a>
          </Button>
          <Button
            asChild
            variant="outline"
            className="rounded-full border-[#C6A664]/50 bg-white text-[#2F2A25] hover:bg-[#FDF9F3]"
          >
            <Link href="/jessica-contentin/specialites">Découvrir les accompagnements</Link>
          </Button>
        </div>
      </div>
    </motion.section>
  );
}
