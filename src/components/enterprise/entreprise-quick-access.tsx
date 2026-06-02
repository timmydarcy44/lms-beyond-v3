"use client";

import Link from "next/link";
import { BookOpen, Brain, GraduationCap } from "lucide-react";

const CARDS = [
  {
    href: "/dashboard/entreprise/marketplace?type=formateur",
    emoji: "🎓",
    title: "Trouver un formateur",
    description: "Sessions et formations sur mesure pour vos équipes.",
    icon: GraduationCap,
    iconBg: "bg-violet-50",
    iconColor: "text-violet-600",
    external: false,
  },
  {
    href: "/dashboard/entreprise/marketplace?type=praticien",
    emoji: "🧠",
    title: "Trouver un praticien",
    description: "Psychologues et praticiens certifiés Beyond BCT.",
    icon: Brain,
    iconBg: "bg-pink-50",
    iconColor: "text-pink-600",
    external: false,
  },
  {
    href: "https://edgebs.fr",
    emoji: "📚",
    title: "eLearning by EDGE",
    description: "Parcours digitaux et certifications en ligne.",
    icon: BookOpen,
    iconBg: "bg-blue-50",
    iconColor: "text-blue-600",
    external: true,
  },
];

export function EntrepriseQuickAccess() {
  return (
    <section className="mb-10">
      <h2 className="mb-4 text-lg font-bold text-gray-900">Accès rapides</h2>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {CARDS.map((card) => {
          const Icon = card.icon;
          const inner = (
            <div className="flex h-full flex-col rounded-2xl border border-gray-100 bg-white p-5 shadow-sm transition hover:border-gray-200 hover:shadow-md">
              <div className={`mb-4 inline-flex w-fit rounded-xl p-3 ${card.iconBg}`}>
                <Icon size={22} className={card.iconColor} />
              </div>
              <p className="text-base font-bold text-gray-900">
                <span className="mr-1.5" aria-hidden>
                  {card.emoji}
                </span>
                {card.title}
              </p>
              <p className="mt-2 flex-1 text-sm text-gray-500">{card.description}</p>
            </div>
          );
          if (card.external) {
            return (
              <a key={card.href} href={card.href} target="_blank" rel="noopener noreferrer">
                {inner}
              </a>
            );
          }
          return (
            <Link key={card.href} href={card.href}>
              {inner}
            </Link>
          );
        })}
      </div>
    </section>
  );
}
