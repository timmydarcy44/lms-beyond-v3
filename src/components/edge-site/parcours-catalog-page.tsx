"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  FAMILLE_LABELS,
  NIVEAU_LABELS,
  PARCOURS,
  type Parcours,
  type ParcoursFamille,
} from "@/lib/parcours";
import { EDGE_HREFS } from "@/lib/edge-site/constants";
import { cn } from "@/lib/utils";

const FILTERS: { id: "all" | ParcoursFamille; label: string }[] = [
  { id: "all", label: "Tous" },
  { id: "performance", label: "Performance" },
  { id: "leadership", label: "Leadership" },
  { id: "humain", label: "Humain" },
  { id: "innovation", label: "Innovation" },
];

function ParcoursCatalogCard({ parcours }: { parcours: Parcours }) {
  const niveauLabel = parcours.niveau ? NIVEAU_LABELS[parcours.niveau] : null;

  return (
    <Link
      href={EDGE_HREFS.parcoursSlug(parcours.slug)}
      className="group flex flex-col rounded-2xl border border-black/[0.06] bg-[#f5f5f7] p-8 transition-colors hover:border-black/[0.12] hover:bg-white"
    >
      <p className="text-[10px] font-normal uppercase tracking-[0.2em] text-edge-red">
        {parcours.familleLabel}
      </p>
      <h3 className="mt-3 text-xl font-medium tracking-[-0.02em] text-edge-black group-hover:text-edge-red">
        {parcours.titre}
      </h3>
      <p className="mt-4 flex-1 text-[14px] leading-relaxed text-black/45">
        {parcours.promesse ?? parcours.description}
      </p>
      <div className="mt-8 flex flex-wrap items-end justify-between gap-3 border-t border-black/[0.06] pt-6">
        <div>
          <p className="text-[22px] font-medium text-edge-black">{parcours.prix}€</p>
          <p className="mt-1 text-[12px] text-black/40">
            {parcours.duree}
            {niveauLabel ? ` · ${niveauLabel}` : ""}
          </p>
        </div>
        <span className="text-[13px] font-medium text-edge-red">Voir le parcours →</span>
      </div>
    </Link>
  );
}

export function ParcoursCatalogPage() {
  const [filter, setFilter] = useState<"all" | ParcoursFamille>("all");

  const filtered = useMemo(
    () => (filter === "all" ? PARCOURS : PARCOURS.filter((p) => p.famille === filter)),
    [filter],
  );

  return (
    <div className="bg-white px-5 py-16 sm:px-10 sm:py-24">
      <div className="mx-auto max-w-6xl">
        <nav className="text-[11px] text-black/30">
          <Link href={EDGE_HREFS.home} className="hover:text-black/60">
            Accueil
          </Link>
          <span className="mx-2">›</span>
          <span className="text-black/60">Parcours</span>
        </nav>

        <h1 className="mt-10 text-[clamp(2.25rem,5vw,3.25rem)] font-medium tracking-[-0.02em] text-edge-black">
          Tous les parcours EDGE
        </h1>
        <p className="mt-4 max-w-xl text-[17px] leading-relaxed text-black/45">
          {PARCOURS.length} parcours certifiants · livrables terrain · badges Open Badge IMS Global vérifiables.
        </p>

        <div className="mt-10 flex flex-wrap gap-2">
          {FILTERS.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setFilter(f.id)}
              className={cn(
                "rounded-full px-5 py-2 text-[13px] font-medium transition-colors",
                filter === f.id
                  ? "bg-edge-black text-white"
                  : "bg-[#f5f5f7] text-black/50 hover:text-edge-black",
              )}
            >
              {f.label}
            </button>
          ))}
        </div>

        {filter !== "all" ? (
          <p className="mt-6 text-[12px] uppercase tracking-[0.15em] text-edge-red">
            {FAMILLE_LABELS[filter]}
          </p>
        ) : null}

        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((p) => (
            <ParcoursCatalogCard key={p.slug} parcours={p} />
          ))}
        </div>
      </div>
    </div>
  );
}
