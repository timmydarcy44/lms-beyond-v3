"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import type { CompetenceData } from "@/components/beyond-no-school/competences-data";

type FeaturedRailProps = {
  items: CompetenceData[];
  onAdd: (slug: string) => void;
  onRemove: (slug: string) => void;
  selected: string[];
};

export function CompetencesFeaturedRail({ items, onAdd, onRemove, selected }: FeaturedRailProps) {
  if (items.length === 0) return null;

  return (
    <section className="px-6 pb-10 pt-6 sm:px-12 lg:px-24">
      <div className="mx-auto max-w-6xl">
        <div className="flex items-center justify-between">
          <h2 className="text-sm uppercase tracking-[0.4em] text-white/50">Sélections</h2>
          <span className="text-xs uppercase tracking-[0.32em] text-white/40">Recommandées</span>
        </div>
        <div className="mt-6 flex snap-x snap-mandatory gap-6 overflow-x-auto pb-6">
          {items.map((competence) => {
            const isSelected = selected.includes(competence.slug);
            return (
              <motion.div
                key={competence.slug}
                className="min-w-[320px] snap-start md:min-w-[520px]"
                whileHover={{ y: -6 }}
                transition={{ type: "spring", stiffness: 260, damping: 20 }}
              >
                <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/[0.03]">
                  <div
                    className="absolute inset-0 opacity-60"
                    style={{ background: competence.coverGradient }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-br from-black/30 via-black/70 to-black/90" />
                  <div className="relative grid gap-6 p-6 md:grid-cols-[220px_1fr] md:items-center">
                    <div className="h-40 rounded-2xl border border-white/10 bg-white/10" />
                    <div className="space-y-3">
                      <p className="text-xs uppercase tracking-[0.32em] text-white/60">
                        {competence.category}
                      </p>
                      <h3 className="text-2xl font-semibold text-white">{competence.name}</h3>
                      <p className="text-sm text-white/70">{competence.identityLine}</p>
                      <div className="flex flex-wrap items-center gap-3 pt-2">
                        <Button
                          type="button"
                          onClick={() =>
                            isSelected ? onRemove(competence.slug) : onAdd(competence.slug)
                          }
                          className="rounded-full bg-white px-5 text-xs uppercase tracking-[0.28em] text-black hover:bg-white/90"
                        >
                          {isSelected ? "Ajouté ✓" : "Ajouter à ma trajectoire"}
                        </Button>
                        {isSelected ? (
                          <button
                            type="button"
                            onClick={() => onRemove(competence.slug)}
                            className="text-xs uppercase tracking-[0.28em] text-white/40 opacity-0 transition-opacity hover:text-white group-hover:opacity-100"
                          >
                            Retirer
                          </button>
                        ) : null}
                        <Link
                          href={`/beyond-no-school/competences/${competence.slug}`}
                          className="text-xs uppercase tracking-[0.28em] text-white/55 transition-colors hover:text-white"
                        >
                          Voir le détail
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

