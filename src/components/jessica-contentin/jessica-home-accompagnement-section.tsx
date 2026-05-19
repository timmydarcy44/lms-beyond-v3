"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";

const VIDEO_CABINET =
  "https://zmcefidiiqqppowymoqb.supabase.co/storage/v1/object/public/jessica%20contentin/Copie%20de%20Copie%20de%20Copie%20de%20Sans%20titre.mp4";

const BOOKING_URL = "https://perfactive.fr/psychopedagogue/rocquancourt/jessica-contentin";

export function JessicaHomeAccompagnementSection() {
  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.55 }}
      className="mx-auto max-w-7xl px-4 py-16 md:px-8 md:py-24"
    >
      <div className="grid gap-12 lg:grid-cols-2 lg:items-stretch lg:gap-16">
        <div className="space-y-6 text-[#2F2A25]">
          <p className="text-[11px] font-semibold uppercase tracking-[0.32em] text-[#9A7B52]">Accompagnement</p>
          <h2 className="text-3xl font-semibold tracking-tight md:text-4xl">Un suivi personnalisé au cabinet</h2>
          <p className="text-lg leading-relaxed text-[#4A4339]">
            Chaque rendez-vous est pensé autour de votre situation : rythme, objectifs, contraintes familiales ou
            scolaires. En cabinet, vous bénéficiez d&apos;un cadre confidentiel pour poser les faits, nommer les
            difficultés et construire des stratégies réalistes.
          </p>
          <ul className="space-y-4 text-base leading-relaxed text-[#2F2A25]/90">
            <li>
              <strong className="text-[#2F2A25]">Écoute et analyse</strong> — temps suffisant pour comprendre le
              fonctionnement cognitif et émotionnel, sans jugement.
            </li>
            <li>
              <strong className="text-[#2F2A25]">Plan sur mesure</strong> — outils et pistes adaptés à l&apos;âge, au
              profil et aux enjeux (scolarité, TND, stress, orientation…).
            </li>
            <li>
              <strong className="text-[#2F2A25]">Suivi dans la durée</strong> — ajustements au fil des progrès, lien
              coordonné avec l&apos;école ou la famille lorsque c&apos;est pertinent.
            </li>
          </ul>
          <p className="text-base italic text-[#5C5348]">
            L&apos;objectif : retrouver du sens, des leviers concrets et une dynamique positive — pour l&apos;élève,
            l&apos;adolescent ou la famille.
          </p>
          <Button
            asChild
            className="w-fit rounded-full bg-[#C6A664] px-8 py-6 text-base font-semibold text-white hover:bg-[#B88A44]"
          >
            <Link href={BOOKING_URL} target="_blank" rel="noopener noreferrer">
              Commencer
            </Link>
          </Button>
        </div>

        {/* Colonne vidéo : hauteur alignée sur le bloc texte (desktop), cover + autoplay muet (requis pour la lecture auto) */}
        <div className="flex min-h-[280px] w-full flex-col self-stretch lg:min-h-0 lg:h-full">
          <div className="relative min-h-[280px] flex-1 overflow-hidden rounded-3xl bg-[#2a2210] shadow-[0_28px_70px_-28px_rgba(45,36,28,0.4)] lg:min-h-0">
            <video
              className="absolute inset-0 h-full w-full object-cover"
              src={VIDEO_CABINET}
              autoPlay
              muted
              loop
              playsInline
              controls
              preload="auto"
            />
          </div>
        </div>
      </div>
    </motion.section>
  );
}
