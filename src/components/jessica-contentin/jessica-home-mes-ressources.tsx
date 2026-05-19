"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { BookOpen, FileText, Video } from "lucide-react";
import { Button } from "@/components/ui/button";

const items = [
  {
    icon: BookOpen,
    title: "Guides et documents",
    description: "Fiches pratiques à télécharger pour avancer entre deux séances.",
  },
  {
    icon: Video,
    title: "Contenus vidéo",
    description: "Explications courtes et exercices à visionner à votre rythme.",
  },
  {
    icon: FileText,
    title: "Tests et bilans",
    description: "Outils pour mieux se connaître et cadrer les prochaines étapes.",
  },
];

export function JessicaHomeMesRessources() {
  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.55 }}
      className="bg-[#FAF7F2] py-16 md:py-24"
    >
      <div className="mx-auto grid max-w-7xl items-center gap-12 px-4 md:grid-cols-2 md:gap-16 md:px-8">
        <div className="space-y-8 text-[#2F2A25]">
          <div>
            <h2 className="text-3xl font-bold tracking-tight md:text-4xl">Mes ressources</h2>
            <p className="mt-3 max-w-xl text-base leading-relaxed text-[#5C5348] md:text-lg">
              Découvrez des ressources, des tests ou encore des accompagnements digitalisés pour continuer à avancer.
            </p>
          </div>

          <ul className="space-y-6">
            {items.map((row) => {
              const Icon = row.icon;
              return (
                <li key={row.title} className="flex gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#F0E4D0] text-[#8B6914]">
                    <Icon className="h-5 w-5" strokeWidth={1.75} aria-hidden />
                  </div>
                  <div>
                    <p className="font-semibold text-[#2F2A25]">{row.title}</p>
                    <p className="mt-1 text-sm leading-relaxed text-[#5C5348] md:text-base">{row.description}</p>
                  </div>
                </li>
              );
            })}
          </ul>

          <Button
            asChild
            className="rounded-full bg-[#C6A664] px-8 py-6 text-base font-semibold text-white hover:bg-[#B88A44]"
          >
            <Link href="/jessica-contentin/ressources">
              Accéder aux ressources <span aria-hidden>→</span>
            </Link>
          </Button>
        </div>

        <div className="relative mx-auto w-full max-w-xl md:max-w-none">
          <div className="flex aspect-[4/3] min-h-[260px] w-full flex-col items-center justify-center rounded-[2rem] bg-gradient-to-br from-[#E8D4B0] via-[#D4B87A] to-[#B8925A] p-8 text-center shadow-[0_28px_70px_-24px_rgba(120,90,50,0.45)] md:min-h-[320px]">
            <div className="rounded-full bg-white/25 p-5 text-white backdrop-blur-sm">
              <FileText className="h-12 w-12" strokeWidth={1.25} aria-hidden />
            </div>
            <p className="mt-6 max-w-[16rem] text-base font-medium leading-relaxed text-white drop-shadow-sm md:text-lg">
              Aucune ressource disponible pour le moment
            </p>
            <p className="mt-3 text-sm text-white/85">Le catalogue se remplit progressivement — revenez bientôt.</p>
          </div>
        </div>
      </div>
    </motion.section>
  );
}
