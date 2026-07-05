"use client";

import Link from "next/link";
import { Briefcase, ChevronRight, GraduationCap, Wrench } from "lucide-react";
import { APPRENANT_CARD_BODY } from "@/lib/apprenant/connect-nav";
import { PROFIL_EDGE_SECTION_HREFS } from "@/lib/particulier/profil-edge-maturity";
import { computeHardSkillStats, parseHardSkillPortfolio, type StoredHardSkillMeta } from "@/lib/hard-skills/hard-skills-portfolio";

type Props = {
  experiencesCount: number;
  diplomasCount: number;
  hardSkills: string[];
  skillsMetadata: Record<string, StoredHardSkillMeta>;
};

export function ProfilEdgeProfileBlocks({ experiencesCount, diplomasCount, hardSkills, skillsMetadata }: Props) {
  const hardStats = computeHardSkillStats(parseHardSkillPortfolio(hardSkills, skillsMetadata));

  const blocks = [
    {
      title: "Expériences professionnelles",
      count: experiencesCount,
      countLabel: `${experiencesCount} expérience${experiencesCount !== 1 ? "s" : ""}`,
      href: PROFIL_EDGE_SECTION_HREFS.experiences,
      icon: Briefcase,
    },
    {
      title: "Diplômes",
      count: diplomasCount,
      countLabel: `${diplomasCount} diplôme${diplomasCount !== 1 ? "s" : ""}`,
      href: PROFIL_EDGE_SECTION_HREFS.diplomes,
      icon: GraduationCap,
    },
    {
      title: "Hard Skills",
      count: hardStats.total,
      countLabel: `${hardStats.total} compétence${hardStats.total !== 1 ? "s" : ""}`,
      href: PROFIL_EDGE_SECTION_HREFS.hard_skills,
      icon: Wrench,
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-3">
      {blocks.map((block) => (
        <Link
          key={block.href}
          href={block.href}
          className={`${APPRENANT_CARD_BODY} group flex items-center justify-between transition hover:border-[#3D7BFF]/30`}
        >
          <div className="flex items-start gap-3">
            <block.icon className="mt-0.5 h-5 w-5 text-[#3D7BFF]" />
            <div>
              <p className="font-semibold text-white">{block.title}</p>
              <p className="mt-1 text-sm text-white/50">{block.countLabel}</p>
            </div>
          </div>
          <ChevronRight className="h-4 w-4 text-white/30 transition group-hover:text-white/60" />
        </Link>
      ))}
    </div>
  );
}
