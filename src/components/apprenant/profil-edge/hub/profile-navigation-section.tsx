"use client";

import {
  Briefcase,
  CheckCircle2,
  ChevronRight,
  GraduationCap,
  Sparkles,
  Target,
  UserRound,
  Wrench,
  Award,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { ProfilEdgeMaturity, ProfilEdgeMaturityBlockId } from "@/lib/particulier/profil-edge-maturity";
import { type AppleCardTone, HubSectionHeader, HubSurface } from "./hub-ui";
import { cn } from "@/lib/utils";

type Props = {
  maturity: ProfilEdgeMaturity;
  testsDone: number;
  experiencesCount: number;
  diplomasCount: number;
  hardSkillsCount: number;
  projectLabel: string | null;
  badgeAwarded?: boolean;
  badgeName?: string;
};

const META: Record<
  ProfilEdgeMaturityBlockId,
  {
    icon: LucideIcon;
    tone: AppleCardTone;
    eyebrow: string;
    detail: (p: Props) => string;
  }
> = {
  identite: {
    icon: UserRound,
    tone: "ice",
    eyebrow: "Qui vous êtes",
    detail: (p) =>
      p.maturity.blocks.find((b) => b.id === "identite")?.complete
        ? "Identité complétée"
        : "À compléter",
  },
  projet: {
    icon: Target,
    tone: "ocean",
    eyebrow: "Votre cap",
    detail: (p) => p.projectLabel || "Définir votre objectif",
  },
  tests: {
    icon: Sparkles,
    tone: "violet",
    eyebrow: "Diagnostics",
    detail: (p) => `${p.testsDone}/3 explorations`,
  },
  experiences: {
    icon: Briefcase,
    tone: "ember",
    eyebrow: "Parcours",
    detail: (p) =>
      p.experiencesCount > 0
        ? `${p.experiencesCount} expérience${p.experiencesCount > 1 ? "s" : ""}`
        : "Ajouter une expérience",
  },
  diplomes: {
    icon: GraduationCap,
    tone: "gold",
    eyebrow: "Formation",
    detail: (p) =>
      p.diplomasCount > 0
        ? `${p.diplomasCount} diplôme${p.diplomasCount > 1 ? "s" : ""}`
        : "Ajouter un diplôme",
  },
  hard_skills: {
    icon: Wrench,
    tone: "forest",
    eyebrow: "Portefeuille",
    detail: (p) =>
      p.hardSkillsCount > 0
        ? `${p.hardSkillsCount} compétence${p.hardSkillsCount > 1 ? "s" : ""}`
        : "Déclarer vos skills",
  },
};

/** Vitrine colorée — une personnalité par bloc. */
export function ProfileNavigationSection(props: Props) {
  const order: ProfilEdgeMaturityBlockId[] = [
    "projet",
    "tests",
    "hard_skills",
    "experiences",
    "diplomes",
    "identite",
  ];

  const byId = Object.fromEntries(props.maturity.blocks.map((b) => [b.id, b])) as Record<
    ProfilEdgeMaturityBlockId,
    (typeof props.maturity.blocks)[number]
  >;

  return (
    <section>
      <HubSectionHeader
        title="Votre espace"
        subtitle="De grandes cartes pour construire un profil qui vous représente."
      />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {order.map((id) => {
          const block = byId[id];
          if (!block) return null;
          const meta = META[id];
          const Icon = meta.icon;
          return (
            <HubSurface
              key={id}
              href={block.href}
              tone={meta.tone}
              flush
              className="flex min-h-[210px] flex-col"
            >
              <div className="flex flex-1 flex-col justify-between gap-6 px-6 py-7 sm:px-7">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15 backdrop-blur-sm">
                    <Icon className="h-6 w-6" strokeWidth={1.75} />
                  </div>
                  {block.complete ? (
                    <CheckCircle2 className="h-5 w-5 text-white/90" />
                  ) : (
                    <ChevronRight className="h-5 w-5 text-white/50" />
                  )}
                </div>
                <div>
                  <p className="text-[12px] font-semibold uppercase tracking-[0.14em] text-white/65">
                    {meta.eyebrow}
                  </p>
                  <p className="mt-2 text-[1.35rem] font-bold tracking-[-0.03em] text-white">
                    {block.label}
                  </p>
                  <p className="mt-1.5 text-[14px] text-white/75">{meta.detail(props)}</p>
                </div>
              </div>
            </HubSurface>
          );
        })}

        <HubSurface
          href="/dashboard/apprenant/badges"
          tone="rose"
          flush
          className={cn("flex min-h-[210px] flex-col sm:col-span-2")}
        >
          <div className="flex flex-1 flex-col justify-between gap-6 px-6 py-7 sm:flex-row sm:items-end sm:px-8">
            <div>
              <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15">
                <Award className="h-6 w-6" strokeWidth={1.75} />
              </div>
              <p className="text-[12px] font-semibold uppercase tracking-[0.14em] text-white/65">
                Validations
              </p>
              <p className="mt-2 text-[1.5rem] font-bold tracking-[-0.03em] text-white">Mes réussites</p>
              <p className="mt-1.5 text-[15px] text-white/75">
                {props.badgeAwarded
                  ? props.badgeName || "Badge EDGE débloqué"
                  : "Badges, Open Badges et Wallet"}
              </p>
            </div>
            <span className="inline-flex items-center gap-1 text-[14px] font-semibold text-white">
              Ouvrir
              <ChevronRight className="h-4 w-4" />
            </span>
          </div>
        </HubSurface>
      </div>
    </section>
  );
}

/** @deprecated kept for type export if needed */
export type { Props as ProfileNavigationSectionProps };
