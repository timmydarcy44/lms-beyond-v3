"use client";

import {
  Briefcase,
  CheckCircle2,
  Circle,
  GraduationCap,
  Sparkles,
  Target,
  UserRound,
  Wrench,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { ProfilEdgeMaturity, ProfilEdgeMaturityBlockId } from "@/lib/particulier/profil-edge-maturity";
import { ProfilEdgeHubCard, ProfilEdgeHubKicker, ProfilEdgeHubSection } from "./profil-edge-hub-card";
import { CONNECT_PROGRESS_FILL, CONNECT_PROGRESS_TRACK } from "@/lib/apprenant/connect-nav";

type Props = {
  maturity: ProfilEdgeMaturity;
  testsDone?: number;
  experiencesCount?: number;
  diplomasCount?: number;
  hardSkillsCount?: number;
};

const BLOCK_META: Record<
  ProfilEdgeMaturityBlockId,
  { icon: LucideIcon; subtitle: (counts: Props) => string }
> = {
  identite: {
    icon: UserRound,
    subtitle: () => "Photo, coordonnées et identité",
  },
  projet: {
    icon: Target,
    subtitle: () => "Votre cap professionnel",
  },
  tests: {
    icon: Sparkles,
    subtitle: ({ testsDone = 0 }) => `${testsDone}/3 explorations complétées`,
  },
  experiences: {
    icon: Briefcase,
    subtitle: ({ experiencesCount = 0 }) =>
      experiencesCount > 0
        ? `${experiencesCount} expérience${experiencesCount > 1 ? "s" : ""} renseignée${experiencesCount > 1 ? "s" : ""}`
        : "Ajoutez vos expériences",
  },
  diplomes: {
    icon: GraduationCap,
    subtitle: ({ diplomasCount = 0 }) =>
      diplomasCount > 0
        ? `${diplomasCount} diplôme${diplomasCount > 1 ? "s" : ""}`
        : "Ajoutez vos diplômes",
  },
  hard_skills: {
    icon: Wrench,
    subtitle: ({ hardSkillsCount = 0 }) =>
      hardSkillsCount > 0
        ? `${hardSkillsCount} compétence${hardSkillsCount > 1 ? "s" : ""}`
        : "Déclarez vos compétences",
  },
};

export function ProfilEdgeMaturityGauge({
  maturity,
  testsDone = 0,
  experiencesCount = 0,
  diplomasCount = 0,
  hardSkillsCount = 0,
}: Props) {
  const counts = { testsDone, experiencesCount, diplomasCount, hardSkillsCount };

  return (
    <ProfilEdgeHubSection
      title="Votre parcours se construit"
      subtitle="Chaque étape enrichit votre profil et affine votre chemin vers l'objectif."
    >
      <ProfilEdgeHubCard className="gap-6">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <ProfilEdgeHubKicker>Progression globale</ProfilEdgeHubKicker>
            <p className="mt-2 text-5xl font-semibold tabular-nums tracking-[-0.04em] text-white sm:text-6xl">
              {maturity.totalPercent}
              <span className="text-2xl text-white/35">%</span>
            </p>
          </div>
          <p className="max-w-xs text-sm leading-relaxed text-white/45">
            Plus votre profil est complet, plus EDGE personnalise votre progression.
          </p>
        </div>
        <div className={CONNECT_PROGRESS_TRACK}>
          <div className={CONNECT_PROGRESS_FILL} style={{ width: `${maturity.totalPercent}%` }} />
        </div>
      </ProfilEdgeHubCard>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {maturity.blocks.map((block) => {
          const meta = BLOCK_META[block.id];
          const Icon = meta.icon;
          return (
            <ProfilEdgeHubCard
              key={block.id}
              href={block.href}
              variant={block.complete ? "success" : "default"}
              className="min-h-[148px] justify-between gap-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/[0.06] text-[#8BB4FF]">
                  <Icon className="h-5 w-5" />
                </div>
                {block.complete ? (
                  <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-400" />
                ) : (
                  <Circle className="h-5 w-5 shrink-0 text-white/25" />
                )}
              </div>
              <div>
                <p className="text-[16px] font-semibold leading-snug text-white">{block.label}</p>
                <p className="mt-1.5 text-[13px] text-white/45">{meta.subtitle(counts)}</p>
              </div>
            </ProfilEdgeHubCard>
          );
        })}
      </div>
    </ProfilEdgeHubSection>
  );
}
