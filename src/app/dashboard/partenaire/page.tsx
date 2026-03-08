"use client";

import Link from "next/link";
import { Heart, MessageCircle, Share2 } from "lucide-react";
import { PartenaireLayout } from "@/components/partenaire/partenaire-layout";
import { ClassementWidget } from "@/components/club/classement-widget";
import {
  partenaireClub,
  partenaireProfile,
} from "@/lib/mocks/partenaire-data";
import { cn } from "@/lib/utils";

const packStyles: Record<string, string> = {
  Bronze: "bg-amber-500/20 text-amber-200",
  Argent: "bg-slate-500/20 text-slate-200",
  Or: "bg-yellow-500/20 text-yellow-200",
};

const posts = [
  {
    id: "post-1",
    category: "Résultat",
    title: "Victoire 2-1 face à Caen !",
    text:
      "Belle performance de l'équipe première samedi soir au stade de Dives. Merci à tous nos partenaires présents en tribune !",
    image: "https://images.unsplash.com/photo-1431324155629-1a6deb1dec8d?w=800",
    mentioned: true,
    likes: 47,
    comments: 8,
    time: "il y a 2 jours",
  },
  {
    id: "post-2",
    category: "Partenariat",
    title: "Bienvenue à notre nouveau partenaire !",
    text:
      "Nous sommes fiers d'accueillir Normandie Énergie dans la famille SUDC. Un partenariat fort pour la saison 2025/2026.",
    image: "https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=800",
    mentioned: false,
    likes: 23,
    comments: 4,
    time: "il y a 5 jours",
  },
  {
    id: "post-3",
    category: "Événement",
    title: "Soirée partenaires — 28 mars",
    text:
      "Rejoignez-nous pour notre soirée partenaires annuelle. Au programme : présentation de la fin de saison, cocktail et remise des trophées.",
    cta: "Confirmer ma présence →",
    image: "https://images.unsplash.com/photo-1517466787929-bc90951d0974?w=800",
    mentioned: false,
    likes: 31,
    comments: 6,
    time: "il y a 1 semaine",
  },
  {
    id: "post-4",
    category: "Résultat",
    title: "Match nul 1-1 à Lisieux",
    text:
      "Un point pris à l'extérieur qui nous maintient dans le top 5. Prochain match le 15 mars à domicile.",
    mentioned: false,
    likes: 18,
    comments: 2,
    time: "il y a 10 jours",
  },
  {
    id: "post-5",
    category: "Club",
    title: "Stage de cohésion équipe première",
    text:
      "3 jours de préparation intense pour aborder la fin de saison dans les meilleures conditions.",
    image: "https://images.unsplash.com/photo-1517466787929-bc90951d0974?w=800",
    mentioned: false,
    likes: 29,
    comments: 5,
    time: "il y a 2 semaines",
  },
];

const categoryStyles: Record<string, string> = {
  Résultat: "bg-green-500/20 text-green-300",
  Événement: "bg-blue-500/20 text-blue-300",
  Partenariat: "bg-[#C8102E]/20 text-[#C8102E]",
  Club: "bg-white/10 text-white/70",
};

export default function PartenaireDashboardPage() {
  return (
    <PartenaireLayout
      activeItem="Tableau de bord"
      club={{ name: partenaireClub.name, initials: partenaireClub.initials, logoUrl: partenaireClub.logoUrl }}
      partner={{ name: partenaireProfile.name, initials: partenaireProfile.initials }}
    >
      <section
        className="rounded-2xl p-6"
        style={{
          background: `linear-gradient(135deg, ${partenaireClub.gradientFrom}, ${partenaireClub.gradientTo})`,
        }}
      >
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="text-lg font-black text-white lg:text-2xl">
              Bienvenue, {partenaireProfile.name}
            </div>
            <div className="mt-1 text-sm text-white/80">
              Partenaire {partenaireProfile.pack} de {partenaireClub.name} — Saison 2025/2026
            </div>
          </div>
          <span className={cn("rounded-full px-3 py-1 text-xs font-semibold", packStyles[partenaireProfile.pack])}>
            {partenaireProfile.pack}
          </span>
        </div>
      </section>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[1fr_320px]">
        <div>
          {posts.map((post) => (
            <div
              key={post.id}
              className="mb-4 overflow-hidden rounded-2xl border border-white/10 bg-[#111827]"
            >
              <div className="flex items-center gap-3 p-4">
                <img
                  src={partenaireClub.logoUrl}
                  alt={partenaireClub.name}
                  className="h-10 w-10 rounded-full object-cover"
                />
                <div className="text-sm font-bold text-white">{partenaireClub.name}</div>
                <div className="text-xs text-white/40">· {post.time}</div>
                <span className={cn("rounded-full px-2 py-0.5 text-xs", categoryStyles[post.category])}>
                  {post.category}
                </span>
              </div>
              {post.image && (
                <img src={post.image} alt="" className="aspect-video w-full object-cover" />
              )}
              <div className="p-4">
                <div className="mb-1 text-base font-bold text-white">{post.title}</div>
                <p className="text-sm leading-relaxed text-white/70">{post.text}</p>
                {post.cta && (
                  <button className="mt-3 rounded-full bg-[#C8102E] px-4 py-1.5 text-xs text-white">
                    {post.cta}
                  </button>
                )}
              </div>
              <div className="flex items-center justify-between border-t border-white/5 p-4">
                <div className="flex items-center gap-4">
                  <button className="flex items-center gap-1.5 text-xs text-white/40 transition-colors hover:text-white">
                    <Heart className="h-4 w-4" /> {post.likes}
                  </button>
                  <button className="flex items-center gap-1.5 text-xs text-white/40 transition-colors hover:text-white">
                    <MessageCircle className="h-4 w-4" /> {post.comments}
                  </button>
                  <button className="flex items-center gap-1.5 text-xs text-white/40 transition-colors hover:text-white">
                    <Share2 className="h-4 w-4" /> Partager
                  </button>
                </div>
                {post.mentioned && (
                  <span className="rounded-full bg-[#C8102E]/20 px-2 py-0.5 text-xs text-[#C8102E]">
                    Vous êtes mentionné
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="w-full lg:w-80 lg:flex-shrink-0">
          <div className="sticky top-6 space-y-4">
            <ClassementWidget />
            <div className="rounded-2xl border border-white/10 bg-[#111827] p-4">
              <div className="flex items-center justify-between">
                <div className="text-sm text-white/60">Votre partenariat</div>
                <span className={cn("rounded-full px-2 py-0.5 text-xs", packStyles[partenaireProfile.pack])}>
                  {partenaireProfile.pack}
                </span>
              </div>
              <div className="mt-3 text-lg font-black text-white lg:text-2xl">
                {partenaireProfile.contractAmountHt.toLocaleString("fr-FR")}€ HT/an
              </div>
              <div className="mt-4 text-xs text-white/60">Saison 2025/2026</div>
              <div className="mt-2 h-1.5 rounded-full bg-white/10">
                <div className="h-1.5 w-[65%] rounded-full bg-[#C8102E]" />
              </div>
              <div className="mt-2 text-xs text-white/50">65% de la saison écoulée</div>
              <div className="mt-4 rounded-xl bg-[#C8102E]/10 p-3 text-xs text-white/70">
                <div className="font-semibold text-white">Soirée partenaires</div>
                <div>28 mars — dans 21 jours</div>
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-[#111827] p-4">
              <div className="text-sm text-white/60">Votre visibilité ce mois</div>
              <div className="mt-2 text-lg font-black text-blue-300 lg:text-2xl">47 200 impressions</div>
              <div className="mt-2 space-y-1 text-xs text-white/60">
                <div>3 mentions réseaux sociaux</div>
                <div>1 article dédié</div>
                <div className="text-green-400">ROI estimé ×3.2</div>
              </div>
              <Link href="/dashboard/partenaire/roi" className="mt-3 inline-block text-xs text-white/60 hover:text-white">
                Voir le rapport complet →
              </Link>
            </div>

            <div className="rounded-2xl border border-white/10 bg-[#111827] p-4">
              <div className="text-sm font-semibold text-white">Réseau partenaires</div>
              <div className="text-xs text-white/50">Les autres partenaires du club</div>
              <div className="mt-3 flex items-center gap-2">
                {["NE", "CD", "AG"].map((initials) => (
                  <div
                    key={initials}
                    className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-xs text-white"
                  >
                    {initials}
                  </div>
                ))}
                <span className="text-xs text-white/50">+ 5 autres partenaires</span>
              </div>
              <Link
                href="/dashboard/partenaire/annuaire"
                className="mt-4 inline-flex rounded-full bg-white/10 px-4 py-2 text-xs text-white"
              >
                Voir l'annuaire →
              </Link>
            </div>
          </div>
        </div>
      </div>
    </PartenaireLayout>
  );
}
