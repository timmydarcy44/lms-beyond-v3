"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import { Award, Clock, Search, Star, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { useEdgePremiumConfig } from "@/components/edge-site/premium/edge-premium-config-context";
import { EdgePremiumButton } from "@/components/edge-site/premium/edge-premium-button";
import { edgeMarketingHref } from "@/lib/edge-site/edge-marketing-path";
import {
  filterFormationCards,
  FORMATION_FILTER_CHIPS,
  FORMATION_SCENE_PHOTOS,
  formationDetailPath,
  getAllFormationCards,
  type FormationCardData,
} from "@/lib/edge-site/training-formation-card";

const SEARCH_SUGGESTIONS = ["Management", "IA", "Soft skills", "Communication", "RH", "Leadership"];

function StarRating({ rating }: { rating: number }) {
  return (
    <span className="inline-flex items-center gap-0.5" aria-label={`Note ${rating} sur 5`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={cn(
            "h-3.5 w-3.5",
            i < Math.floor(rating) ? "fill-amber-400 text-amber-400" : "fill-amber-200 text-amber-200",
          )}
        />
      ))}
    </span>
  );
}

function FormationCard({ card }: { card: FormationCardData }) {
  const href = edgeMarketingHref(formationDetailPath(card.module.id));

  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-[24px] border border-[#050505]/8 bg-white shadow-[0_2px_16px_rgba(5,5,5,0.05)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_16px_48px_rgba(99,91,255,0.12)]">
      <div className="relative aspect-[16/10] overflow-hidden">
        <Image
          src={card.photoUrl}
          alt=""
          fill
          className="object-cover transition duration-500 group-hover:scale-105"
          sizes="(max-width:768px) 100vw, 33vw"
          unoptimized
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#050505]/55 via-transparent to-transparent" />
        <span className="absolute left-4 top-4 rounded-full bg-white/95 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-edge-accent shadow-sm">
          {card.domainLabel}
        </span>
      </div>

      <div className="flex flex-1 flex-col p-5 sm:p-6">
        <h3 className="text-lg font-semibold leading-snug tracking-[-0.02em] text-[#050505] group-hover:text-edge-accent">
          {card.title}
        </h3>
        <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-[#050505]/55">{card.benefit}</p>

        <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-[#050505]/50">
          <span className="inline-flex items-center gap-1">
            <Clock className="h-3.5 w-3.5 text-edge-accent" />
            {card.duration}
          </span>
          <span>{card.levelLabel}</span>
          <span>{card.formatsLabel}</span>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <span className="inline-flex items-center gap-1 rounded-full bg-edge-accent/8 px-2.5 py-1 text-[11px] font-medium text-edge-accent">
            <Award className="h-3 w-3" />
            {card.badgeName}
          </span>
          <StarRating rating={card.rating} />
        </div>

        <p className="mt-3 flex items-center gap-1.5 text-xs text-[#050505]/45">
          <Users className="h-3.5 w-3.5" />
          {card.companiesCount} entreprises formées
        </p>

        <div className="mt-auto flex items-end justify-between gap-3 pt-5">
          <p className="text-sm font-semibold text-[#050505]">{card.priceLabel}</p>
          <Link
            href={href}
            className="inline-flex items-center justify-center rounded-xl bg-edge-accent px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-[#7B74FF]"
          >
            Découvrir la formation
          </Link>
        </div>
      </div>
    </article>
  );
}

function HumanInterlude({ index }: { index: number }) {
  const photos = [
    FORMATION_SCENE_PHOTOS[index % FORMATION_SCENE_PHOTOS.length],
    FORMATION_SCENE_PHOTOS[(index + 3) % FORMATION_SCENE_PHOTOS.length],
    FORMATION_SCENE_PHOTOS[(index + 6) % FORMATION_SCENE_PHOTOS.length],
  ];
  const captions = [
    "Atelier en salle — échanges entre pairs",
    "Coaching et mise en situation",
    "Animation de groupe et brainstorming",
  ];

  return (
    <div className="col-span-full grid gap-3 sm:grid-cols-3">
      {photos.map((url, i) => (
        <div key={url} className="relative aspect-[16/9] overflow-hidden rounded-[20px]">
          <Image src={url} alt={captions[i]} fill className="object-cover" unoptimized />
          <div className="absolute inset-0 bg-gradient-to-t from-[#050505]/50 to-transparent" />
          <p className="absolute bottom-3 left-4 right-4 text-xs font-medium text-white/90">{captions[i]}</p>
        </div>
      ))}
    </div>
  );
}

export function EdgeBusinessFormerEquipesPage() {
  const { links } = useEdgePremiumConfig();
  const allCards = useMemo(() => getAllFormationCards(), []);
  const [searchQuery, setSearchQuery] = useState("");
  const [chipId, setChipId] = useState("all");

  const visibleCards = useMemo(
    () => filterFormationCards(allCards, searchQuery, chipId),
    [allCards, searchQuery, chipId],
  );

  return (
    <div className="min-h-screen bg-[#F7F7F5] text-[#050505]">
      {/* Hero */}
      <section className="relative overflow-hidden bg-[#050505] px-5 pb-12 pt-28 sm:px-8 sm:pt-32 lg:px-10">
        <div
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_20%_0%,rgba(99,91,255,0.22),transparent_55%)]"
          aria-hidden
        />
        <div className="relative mx-auto max-w-4xl text-center">
          <p className="text-[10px] font-medium uppercase tracking-[0.25em] text-edge-accent-light">Former</p>
          <h1 className="mt-4 text-[clamp(2rem,4.5vw,3.25rem)] font-semibold leading-[1.08] tracking-[-0.035em] text-white">
            Formez vos équipes sur les compétences qui font la différence.
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-white/60">
            Parcours concrets, animés par des spécialistes — trouvez la formation adaptée à vos enjeux.
          </p>
        </div>
      </section>

      {/* Recherche + filtres — sticky */}
      <section className="sticky top-0 z-30 border-b border-[#050505]/8 bg-white/95 backdrop-blur-md">
        <div className="mx-auto max-w-7xl px-5 py-5 sm:px-8 lg:px-10">
          <div className="relative max-w-2xl">
            <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#050505]/35" />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Rechercher une formation…"
              className="w-full rounded-2xl border border-[#050505]/10 bg-[#F7F7F5] py-3.5 pl-12 pr-4 text-base outline-none transition focus:border-edge-accent/40 focus:ring-2 focus:ring-edge-accent/10"
            />
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {SEARCH_SUGGESTIONS.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setSearchQuery(s)}
                className="rounded-full border border-[#050505]/8 px-3 py-1 text-xs text-[#050505]/50 hover:border-edge-accent/25 hover:text-edge-accent"
              >
                {s}
              </button>
            ))}
          </div>
          <div className="mt-4 flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {FORMATION_FILTER_CHIPS.map((chip) => (
              <button
                key={chip.id}
                type="button"
                onClick={() => setChipId(chip.id)}
                className={cn(
                  "shrink-0 rounded-full px-4 py-2 text-sm font-medium transition",
                  chipId === chip.id
                    ? "bg-edge-accent text-white shadow-sm"
                    : "border border-[#050505]/10 bg-[#F7F7F5] text-[#050505]/65 hover:border-edge-accent/25",
                )}
              >
                {chip.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Grille formations */}
      <section className="px-5 py-10 sm:px-8 lg:px-10 lg:py-14">
        <div className="mx-auto max-w-7xl">
          {visibleCards.length === 0 ? (
            <div className="rounded-[24px] border border-dashed border-[#050505]/12 bg-white py-20 text-center">
              <p className="text-sm text-[#050505]/50">Aucune formation ne correspond à votre recherche.</p>
              <button
                type="button"
                onClick={() => {
                  setSearchQuery("");
                  setChipId("all");
                }}
                className="mt-4 text-sm font-medium text-edge-accent hover:underline"
              >
                Réinitialiser les filtres
              </button>
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
              {visibleCards.map((card, index) => (
                <div key={card.module.id} className="contents">
                  <FormationCard card={card} />
                  {(index + 1) % 9 === 0 && index < visibleCards.length - 1 ? (
                    <HumanInterlude index={index} />
                  ) : null}
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* CTA discret */}
      <section className="border-t border-[#050505]/8 bg-white px-5 py-14 sm:px-8 lg:px-10">
        <div className="mx-auto flex max-w-3xl flex-col items-center text-center">
          <p className="text-lg font-semibold">Besoin d&apos;aide pour choisir ?</p>
          <p className="mt-2 text-sm text-[#050505]/55">
            Nos conseillers vous orientent vers la formation la plus adaptée à vos équipes.
          </p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <EdgePremiumButton href={links.conseiller} shape="revolut">
              Parler à un conseiller
            </EdgePremiumButton>
            <EdgePremiumButton href={links.demo} variant="secondary-light" shape="revolut">
              Demander une démo
            </EdgePremiumButton>
          </div>
        </div>
      </section>
    </div>
  );
}
