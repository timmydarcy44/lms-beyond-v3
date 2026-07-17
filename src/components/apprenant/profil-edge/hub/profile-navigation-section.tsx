"use client";

import {
  Briefcase,
  CheckCircle2,
  ChevronRight,
  Circle,
  GraduationCap,
  Sparkles,
  Target,
  UserRound,
  Wrench,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { ProfilEdgeMaturity, ProfilEdgeMaturityBlockId } from "@/lib/particulier/profil-edge-maturity";
import { HubSectionHeader, HubSurface } from "./hub-ui";
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
  { icon: LucideIcon; detail: (p: Props) => string; cta?: string }
> = {
  identite: {
    icon: UserRound,
    detail: (p) =>
      p.maturity.blocks.find((b) => b.id === "identite")?.complete
        ? "Identité complétée"
        : "Profil à compléter",
  },
  projet: {
    icon: Target,
    detail: (p) => p.projectLabel || "Définir votre cap",
  },
  tests: {
    icon: Sparkles,
    detail: (p) => `${p.testsDone}/3 explorations terminées`,
  },
  experiences: {
    icon: Briefcase,
    detail: (p) =>
      p.experiencesCount > 0
        ? `${p.experiencesCount} expérience${p.experiencesCount > 1 ? "s" : ""}`
        : "Aucune expérience ajoutée",
    cta: "Ajouter",
  },
  diplomes: {
    icon: GraduationCap,
    detail: (p) =>
      p.diplomasCount > 0
        ? `${p.diplomasCount} diplôme${p.diplomasCount > 1 ? "s" : ""}`
        : "Aucun diplôme ajouté",
    cta: "Ajouter",
  },
  hard_skills: {
    icon: Wrench,
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
        subtitle="Vos informations détaillées — accessibles en un tap."
      />
      <div className="space-y-2.5">
        {props.maturity.blocks.map((block) => {
          const meta = META[block.id];
          const Icon = meta.icon;
          const incomplete = !block.complete;
          return (
            <HubSurface
              key={block.id}
              href={block.href}
              tone="quiet"
              className={cn(
                "flex flex-row items-center gap-4 py-4",
                incomplete && "border-dashed border-white/10",
              )}
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/[0.05] text-white/70">
                <Icon className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[15px] font-medium text-white">{block.label}</p>
                <p className="mt-0.5 truncate text-[13px] text-white/45">{meta.detail(props)}</p>
              </div>
              {incomplete && meta.cta ? (
                <span className="shrink-0 text-[12px] font-medium text-[#8BB4FF]">{meta.cta}</span>
              ) : block.complete ? (
                <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-400/80" />
              ) : (
                <Circle className="h-5 w-5 shrink-0 text-white/20" />
              )}
              <ChevronRight className="h-4 w-4 shrink-0 text-white/25" />
            </HubSurface>
          );
        })}
      </div>
    </section>
  );
}
