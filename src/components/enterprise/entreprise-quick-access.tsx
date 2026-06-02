"use client";

import Link from "next/link";
import { BookOpen, Brain, ChevronRight, GraduationCap } from "lucide-react";

const CARDS = [
  {
    href: "/dashboard/entreprise/marketplace?type=formateur",
    title: "Trouver un formateur",
    description: "Sessions sur mesure pour vos équipes",
    icon: GraduationCap,
    iconBg: "bg-violet-100",
    iconColor: "text-violet-600",
    external: false,
  },
  {
    href: "/dashboard/entreprise/marketplace?type=praticien",
    title: "Trouver un praticien",
    description: "Praticiens certifiés Beyond BCT",
    icon: Brain,
    iconBg: "bg-pink-100",
    iconColor: "text-pink-600",
    external: false,
  },
  {
    href: "https://edgebs.fr",
    title: "eLearning by EDGE",
    description: "Parcours digitaux et certifications",
    icon: BookOpen,
    iconBg: "bg-blue-100",
    iconColor: "text-blue-600",
    external: true,
  },
];

export function EntrepriseQuickAccess() {
  return (
    <section className="mb-10">
      <h2 className="mb-4 text-lg font-bold text-gray-900">Accès rapides</h2>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        {CARDS.map((card) => {
          const Icon = card.icon;
          const inner = (
            <div
              className="group flex cursor-pointer items-center gap-4 rounded-[20px] bg-white p-5 shadow-[0_2px_12px_rgba(0,0,0,0.06)] transition-all hover:-translate-y-0.5 hover:shadow-[0_4px_20px_rgba(0,0,0,0.1)]"
            >
              <div
                className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${card.iconBg}`}
              >
                <Icon size={20} className={card.iconColor} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-gray-900">{card.title}</p>
                <p className="mt-0.5 text-xs text-gray-400">{card.description}</p>
              </div>
              <ChevronRight
                size={16}
                className="shrink-0 text-gray-300 transition-colors group-hover:text-gray-500"
              />
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
