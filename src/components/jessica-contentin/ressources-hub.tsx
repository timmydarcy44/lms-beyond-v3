"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Download, Moon, Smartphone } from "lucide-react";

const SECTIONS = [
  {
    title: "Application",
    description: "Performance cognitive et stratégies d'apprentissage au quotidien.",
    href: "/jessica-contentin/ressources/application-neuro-adaptee",
    icon: Smartphone,
  },
  {
    title: "Cartes — Rituel du sommeil",
    description: "Un jeu de cartes pour créer un moment privilégié avant le coucher.",
    href: "/jessica-contentin/ressources/cartes-rituel-sommeil",
    icon: Moon,
  },
  {
    title: "Ressources à télécharger",
    description: "Fiches, guides et outils psychopédagogiques — gratuits ou premium.",
    href: "/jessica-contentin/ressources/telecharger",
    icon: Download,
  },
] as const;

export function RessourcesHub() {
  return (
    <div className="min-h-screen bg-[#F8F5F0] pb-20 pt-8">
      <section className="mx-auto max-w-5xl px-6 py-12">
        <p className="text-[11px] font-semibold uppercase tracking-[0.32em] text-[#9A7B52]">Outils et ressources</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-[#2F2A25] md:text-4xl">
          Tout pour prolonger l&apos;accompagnement
        </h1>
        <p className="mt-4 max-w-2xl text-base leading-relaxed text-[#5C5348] md:text-lg">
          Applications, jeux et ressources à télécharger pour soutenir les apprentissages, les émotions et le
          quotidien des familles.
        </p>
      </section>

      <section className="mx-auto grid max-w-5xl gap-6 px-6 md:grid-cols-3">
        {SECTIONS.map((section, index) => (
          <motion.div
            key={section.href}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.08 }}
          >
            <Link
              href={section.href}
              className="group flex h-full flex-col rounded-2xl border border-[#E6D9C6] bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:border-[#C6A664]/50 hover:shadow-md"
            >
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#F8F2EA] text-[#8B6F47]">
                <section.icon className="h-5 w-5" aria-hidden />
              </span>
              <h2 className="mt-5 text-lg font-semibold text-[#2F2A25]">{section.title}</h2>
              <p className="mt-2 flex-1 text-sm leading-relaxed text-[#5C5348]">{section.description}</p>
              <span className="mt-5 inline-flex items-center gap-1.5 text-sm font-medium text-[#8B6914]">
                Découvrir
                <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
              </span>
            </Link>
          </motion.div>
        ))}
      </section>
    </div>
  );
}
