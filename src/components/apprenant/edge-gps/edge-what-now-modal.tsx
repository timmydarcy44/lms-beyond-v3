"use client";

import Link from "next/link";
import { Clock, Target, X } from "lucide-react";
import type { EdgeProgressionGps } from "@/lib/apprenant/edge-progression-gps";
import { EDGE_EXPERT_PARCOURS_CTA, getExpertParcoursHref } from "@/lib/particulier/coaching-config";

type Props = {
  open: boolean;
  onClose: () => void;
  gps: Pick<
    EdgeProgressionGps,
    "objectiveTitle" | "prioritySkill" | "gapsCount" | "hasObjective"
  >;
  onViewSkills?: () => void;
};

export function EdgeWhatNowModal({ open, onClose, gps, onViewSkills }: Props) {
  if (!open) return null;

  const handleViewSkills = () => {
    onClose();
    onViewSkills?.();
  };

  return (
    <div className="fixed inset-0 z-[170] flex items-end justify-center p-4 sm:items-center">
      <button type="button" className="absolute inset-0 bg-black/60" onClick={onClose} aria-label="Fermer" />
      <div
        role="dialog"
        className="relative w-full max-w-md rounded-2xl border border-white/10 bg-[#12141C] p-6 shadow-2xl"
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 rounded-full border border-white/10 p-1.5 text-white/50 hover:bg-white/5"
        >
          <X className="h-4 w-4" />
        </button>

        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#8BB4FF]">
          Que faire maintenant ?
        </p>
        <p className="mt-3 text-sm leading-relaxed text-white/65">
          Votre profil est analysé. La prochaine étape consiste à construire un plan d&apos;action avec un
          expert EDGE.
        </p>

        <div className="mt-5 space-y-3 rounded-xl border border-white/[0.08] bg-white/[0.03] p-4">
          <div className="flex items-start gap-2 text-sm text-white/70">
            <Target className="mt-0.5 h-4 w-4 shrink-0 text-white/40" />
            <span>
              <span className="text-white/45">Objectif : </span>
              {gps.objectiveTitle}
            </span>
          </div>
          {gps.hasObjective && gps.prioritySkill ? (
            <div className="flex items-start gap-2 text-sm text-white/70">
              <Target className="mt-0.5 h-4 w-4 shrink-0 text-white/40" />
              <span>
                <span className="text-white/45">Compétence prioritaire : </span>
                {gps.prioritySkill}
              </span>
            </div>
          ) : null}
          <div className="flex items-center gap-2 text-sm text-white/70">
            <Target className="h-4 w-4 text-white/40" />
            <span>
              <span className="text-white/45">Écarts identifiés : </span>
              {gps.gapsCount}
            </span>
          </div>
          <div className="flex items-center gap-2 text-sm text-white/70">
            <Clock className="h-4 w-4 text-white/40" />
            <span>
              <span className="text-white/45">Temps estimé pour la recommandation : </span>2 minutes
            </span>
          </div>
        </div>

        <div className="mt-6 space-y-2">
          <Link
            href={getExpertParcoursHref()}
            onClick={onClose}
            className="flex w-full items-center justify-center rounded-lg bg-[#3D7BFF] py-3 text-sm font-semibold text-white hover:bg-[#2F6AE8]"
          >
            {EDGE_EXPERT_PARCOURS_CTA}
          </Link>
          {onViewSkills ? (
            <button
              type="button"
              onClick={handleViewSkills}
              className="flex w-full items-center justify-center rounded-lg border border-white/15 py-3 text-sm font-medium text-white/80 hover:bg-white/[0.05]"
            >
              Voir mes compétences
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
