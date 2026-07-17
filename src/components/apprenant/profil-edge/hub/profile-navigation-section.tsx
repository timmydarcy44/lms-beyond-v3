"use client";

import {
  Briefcase,
  CheckCircle2,
  GraduationCap,
  Sparkles,
  Target,
  UserRound,
  Wrench,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { ProfilEdgeMaturity, ProfilEdgeMaturityBlockId } from "@/lib/particulier/profil-edge-maturity";
import { type AppleCardTone, HubCardFooter, HubSectionHeader, HubSurface } from "./hub-ui";
import { cn } from "@/lib/utils";

type Props = {
  maturity: ProfilEdgeMaturity;
  testsDone: number;
  experiencesCount: number;
  diplomasCount: number;
  hardSkillsCount: number;
  projectLabel: string | null;
};

const META: Record<
  ProfilEdgeMaturityBlockId,
  {
    icon: LucideIcon;
    tone: AppleCardTone;
    detail: (p: Props) => string;
    cta?: string;
  }
> = {
  identite: {
    icon: UserRound,
    tone: "ice",
    detail: (p) =>
      p.maturity.blocks.find((b) => b.id === "identite")?.complete
        ? "Identité complétée"
        : "Profil à compléter",
  },
  projet: {
    icon: Target,
    tone: "ocean",
    detail: (p) => p.projectLabel || "Définir votre cap",
  },
  tests: {
    icon: Sparkles,
    tone: "violet",
    detail: (p) => `${p.testsDone}/3 explorations terminées`,
  },
  experiences: {
    icon: Briefcase,
    tone: "ember",
    detail: (p) =>
      p.experiencesCount > 0
        ? `${p.experiencesCount} expérience${p.experiencesCount > 1 ? "s" : ""}`
        : "Aucune expérience ajoutée",
    cta: "Ajouter",
  },
  diplomes: {
    icon: GraduationCap,
    tone: "gold",
    detail: (p) =>
      p.diplomasCount > 0
        ? `${p.diplomasCount} diplôme${p.diplomasCount > 1 ? "s" : ""}`
        : "Aucun diplôme ajouté",
    cta: "Ajouter",
  },
  hard_skills: {
    icon: Wrench,
    tone: "forest",
    detail: (p) =>
      p.hardSkillsCount > 0
        ? `${p.hardSkillsCount} compétence${p.hardSkillsCount > 1 ? "s" : ""}`
        : "Aucune compétence",
    cta: "Voir",
  },
};

export function ProfileNavigationSection(props: Props) {
  return (
    <section>
      <HubSectionHeader
        title="Mon profil"
        subtitle="Chaque bloc a sa propre carte — comme une station Apple Music."
      />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {props.maturity.blocks.map((block) => {
          const meta = META[block.id];
          const Icon = meta.icon;
          const incomplete = !block.complete;
          return (
            <HubSurface
              key={block.id}
              href={block.href}
              tone={meta.tone}
              flush
              className={cn(
                "flex min-h-[200px] flex-col",
                incomplete && "ring-1 ring-dashed ring-white/30",
              )}
            >
              <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 py-8">
                <div className="flex h-16 w-16 items-center justify-center rounded-[22px] bg-white/15 text-white backdrop-blur-sm">
                  <Icon className="h-8 w-8" strokeWidth={1.75} />
                </div>
                {block.complete ? (
                  <CheckCircle2 className="h-5 w-5 text-white/90" />
                ) : meta.cta ? (
                  <span className="rounded-full bg-white/20 px-3 py-1 text-[12px] font-semibold text-white">
                    {meta.cta}
                  </span>
                ) : (
                  <span className="text-[12px] font-medium text-white/70">À compléter</span>
                )}
              </div>
              <HubCardFooter tone={meta.tone}>
                <p className="text-[17px] font-bold tracking-[-0.02em] text-white">{block.label}</p>
                <p className="mt-1 truncate text-[13px] text-white/70">{meta.detail(props)}</p>
              </HubCardFooter>
            </HubSurface>
          );
        })}
      </div>
    </section>
  );
}
