"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { CompetenceData } from "@/components/beyond-no-school/competences-data";

type CompetenceCardProps = {
  competence: CompetenceData;
  selected: boolean;
  onAdd: (slug: string) => void;
  onRemove: (slug: string) => void;
  onWaitlist: (slug: string) => void;
};

export function CompetenceCard({
  competence,
  selected,
  onAdd,
  onRemove,
  onWaitlist,
}: CompetenceCardProps) {
  const isAvailable = competence.available;
  const accent = competence.coverGradient;

  return (
    <motion.div
      whileHover={{ y: -6 }}
      transition={{ type: "spring", stiffness: 280, damping: 22 }}
      className="group relative overflow-hidden rounded-3xl border border-white/10 bg-white/[0.02] p-6 shadow-[0_20px_60px_rgba(0,0,0,0.35)]"
    >
      <div className="absolute inset-0 opacity-60" style={{ background: accent }} />
      <div className="absolute inset-0 bg-gradient-to-br from-black/40 via-black/70 to-black/90" />
      <div className="relative flex h-full flex-col gap-5">
        <div className="flex items-center justify-between">
          <span className="text-xs uppercase tracking-[0.32em] text-white/60">
            {competence.category}
          </span>
          <Badge className="border border-white/10 bg-white/10 text-[10px] uppercase tracking-[0.28em] text-white/70">
            Open Badge
          </Badge>
        </div>

        <div className="space-y-3">
          <h3 className="text-2xl font-semibold text-white">{competence.name}</h3>
          <p className="text-sm text-white/70">{competence.identityLine}</p>
          <p className="text-sm text-white/60">
            Preuve attendue : <span className="text-white/80">{competence.proof.type}</span>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 text-xs text-white/55">
          {competence.difficulty ? (
            <span className="rounded-full border border-white/10 px-3 py-1 uppercase tracking-[0.24em]">
              {competence.difficulty}
            </span>
          ) : null}
          {!isAvailable ? (
            <span className="rounded-full border border-white/15 px-3 py-1 uppercase tracking-[0.24em] text-white/70">
              Bientôt
            </span>
          ) : null}
        </div>

        <div className="mt-auto flex flex-wrap items-center gap-3">
          {isAvailable ? (
            <>
              <Button
                type="button"
                onClick={() => (selected ? onRemove(competence.slug) : onAdd(competence.slug))}
                className={`rounded-full px-5 text-xs uppercase tracking-[0.28em] ${
                  selected
                    ? "bg-white/20 text-white hover:bg-white/30"
                    : "bg-white text-black hover:bg-white/90"
                }`}
              >
                {selected ? "Ajouté ✓" : "Ajouter à ma trajectoire"}
              </Button>
              {selected ? (
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
                className="text-xs uppercase tracking-[0.3em] text-white/55 transition-colors hover:text-white"
              >
                Voir le détail
              </Link>
            </>
          ) : (
            <>
              <Button
                type="button"
                onClick={() => onWaitlist(competence.slug)}
                className="rounded-full border border-white/25 bg-transparent px-5 text-xs uppercase tracking-[0.28em] text-white hover:bg-white/10"
              >
                Être prévenu
              </Button>
              <span className="text-xs uppercase tracking-[0.28em] text-white/45">
                Bientôt disponible
              </span>
            </>
          )}
        </div>
      </div>
    </motion.div>
  );
}

