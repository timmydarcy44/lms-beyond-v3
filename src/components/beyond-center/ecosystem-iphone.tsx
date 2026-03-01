"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, GraduationCap, Heart, BookOpen, Network, Play, Music } from "lucide-react";

type EcosystemItem = {
  id: string;
  icon: typeof GraduationCap;
  title: string;
  tagline: string;
  description: string;
  bullets: string[];
  image: string;
  href: string;
};

const ITEMS: EcosystemItem[] = [
  {
    id: "beyond-center",
    icon: GraduationCap,
    title: "Beyond Center",
    tagline: "Formations & certifications",
    description: "Le cœur du CFA : parcours certifiants, ateliers immersifs et coaching métier.",
    bullets: ["Titres RNCP", "Workshops live", "Accompagnement expert"],
    image: "https://images.unsplash.com/photo-1552664730-d307ca884978?q=80&w=2400&auto=format&fit=crop",
    href: "/beyond-center",
  },
  {
    id: "beyond-care",
    icon: Heart,
    title: "Santé mentale",
    tagline: "Bien‑être & psychopédagogie",
    description: "Un suivi émotionnel intelligent pour soutenir la montée en compétences des apprenants.",
    bullets: ["Coaching 24/7", "Analyses prédictives", "Programmes personnalisés"],
    image: "https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?q=80&w=2400&auto=format&fit=crop",
    href: "/beyond-care",
  },
  {
    id: "beyond-no-school",
    icon: BookOpen,
    title: "Formation continue",
    tagline: "Plateforme à la demande",
    description: "Des contenus interactifs façon streaming pour apprendre à son rythme et mesurer sa progression.",
    bullets: ["Contenus on-demand", "Suivi de progression", "Certifications digitales"],
    image: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?q=80&w=2400&auto=format&fit=crop",
    href: "/beyond-no-school",
  },
  {
    id: "beyond-connect",
    icon: Network,
    title: "Recrutement",
    tagline: "Recrutement augmenté",
    description: "Matching intelligent entre apprenants et entreprises pour accélérer l’embauche.",
    bullets: ["Matching IA", "Offres personnalisées", "Coaching carrière"],
    image: "https://images.unsplash.com/photo-1521737604893-d14cc237f11d?q=80&w=2400&auto=format&fit=crop",
    href: "/beyond-connect",
  },
  {
    id: "beyond-play",
    icon: Play,
    title: "Gamification",
    tagline: "Gamification & challenges",
    description: "Défis, badges et progression gamifiée pour transformer l’apprentissage en expérience ludique.",
    bullets: ["Défis personnalisés", "Badges & récompenses", "Animations live"],
    image: "https://images.unsplash.com/photo-1511512578047-dfb367046420?q=80&w=2400&auto=format&fit=crop",
    href: "/beyond-play",
  },
  {
    id: "beyond-note",
    icon: Music,
    title: "IA éducative",
    tagline: "Notes & knowledge hub",
    description: "Un espace unique pour centraliser briefs, ressources et feedbacks pédagogiques.",
    bullets: ["Recherche intelligente", "Partage sécurisé", "Synchronisation cloud"],
    image: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=2400&auto=format&fit=crop",
    href: "/beyond-note",
  },
];

export function EcosystemIPhone() {
  const [active, setActive] = useState(0);
  const activeItem = ITEMS[active];

  return (
    <section className="relative overflow-hidden rounded-[48px] border border-black/5 bg-white shadow-[0_65px_160px_-80px_rgba(15,23,42,0.35)]">
      <div className="grid gap-8 lg:grid-cols-2">
        <div className="flex flex-col gap-4 px-6 py-9 md:px-12">
          <div className="flex items-start justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-[0.34em] text-black/70">
              • Piliers Beyond pour aller plus loin
            </span>
            <Link
              href={activeItem.href}
              className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-black px-4 py-2 text-[11px] font-medium text-white transition hover:translate-x-1 hover:bg-black/90 md:px-5 md:py-2.5 md:text-sm"
            >
              Explorer
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="space-y-2 pt-3">
            {ITEMS.map((item, index) => {
              const isActive = active === index;
              return (
                <div
                  key={item.id}
                  onMouseEnter={() => setActive(index)}
                  onFocus={() => setActive(index)}
                  className="flex items-center justify-between gap-4"
                >
                  <button
                    type="button"
                    onFocus={() => setActive(index)}
                    className={`text-left font-semibold tracking-tight transition whitespace-nowrap leading-[1.12] ${
                      isActive
                        ? "text-black text-[clamp(26px,4.2vw,56px)]"
                        : "text-neutral-300 text-[clamp(22px,3.8vw,48px)] hover:text-neutral-400"
                    }`}
                  >
                    {item.title}
                  </button>
                  {isActive ? (
                    <Link
                      href={item.href}
                      className="inline-flex min-w-[110px] items-center justify-center gap-2 rounded-full border border-black bg-black px-4 py-1.5 text-xs font-medium text-white transition hover:bg-black/90"
                    >
                      Explorer
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  ) : (
                    <span className="min-w-[110px]" />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="relative min-h-[420px]">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeItem.id}
              initial={{ opacity: 0.25, scale: 1.02 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.02 }}
              transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] as const }}
              className="relative h-full min-h-[480px]"
            >
              <Image
                src={activeItem.image}
                alt={activeItem.title}
                fill
                className="object-cover"
                sizes="(min-width: 1024px) 50vw, 100vw"
                priority
              />
              <div className="absolute inset-0 bg-gradient-to-b from-black/18 via-transparent to-black/45" />
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}



