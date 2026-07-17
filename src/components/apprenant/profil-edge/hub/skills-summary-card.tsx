"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import {
  computeHardSkillStats,
  parseHardSkillPortfolio,
  type StoredHardSkillMeta,
} from "@/lib/hard-skills/hard-skills-portfolio";
import { PROFIL_EDGE_SECTION_HREFS } from "@/lib/particulier/profil-edge-maturity";
import { HubPillCta, HubSectionHeader, HubSurface } from "./hub-ui";

type Props = {
  hardSkills: string[];
  skillsMetadata: Record<string, StoredHardSkillMeta>;
};

export function SkillsSummaryCard({ hardSkills, skillsMetadata }: Props) {
  const records = parseHardSkillPortfolio(hardSkills, skillsMetadata);
  const stats = computeHardSkillStats(records);
  const top = records.slice(0, 3);

  return (
    <section>
      <HubSectionHeader title="Mes compétences" subtitle="Synthèse — le détail reste dans votre portfolio." />
      <HubSurface tone="slate" className="min-h-[280px] space-y-6">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-[4.5rem] font-bold tabular-nums tracking-[-0.06em] text-white leading-none">
              {stats.total}
            </p>
            <p className="mt-2 text-[15px] text-white/70">
              compétence{stats.total > 1 ? "s" : ""} enregistrée{stats.total > 1 ? "s" : ""}
            </p>
          </div>
          {stats.total > 0 ? (
            <div className="rounded-2xl bg-black/25 px-4 py-3 text-right text-[13px] leading-relaxed text-white/80 backdrop-blur-sm">
              {stats.byLevel.Expert > 0 ? <p>{stats.byLevel.Expert} Expert</p> : null}
              {stats.byLevel.Confirmé > 0 ? <p>{stats.byLevel.Confirmé} Confirmé</p> : null}
              {stats.byLevel.Intermédiaire > 0 ? <p>{stats.byLevel.Intermédiaire} Intermédiaire</p> : null}
              {stats.byLevel.Débutant > 0 ? <p>{stats.byLevel.Débutant} Débutant</p> : null}
            </div>
          ) : null}
        </div>

        {top.length ? (
          <ul className="space-y-2">
            {top.map((r) => (
              <li
                key={r.name}
                className="flex items-center justify-between gap-3 rounded-2xl bg-black/20 px-4 py-3.5 backdrop-blur-sm"
              >
                <span className="truncate text-[15px] font-semibold text-white">{r.name}</span>
                <span className="shrink-0 text-[13px] text-white/70">{r.level}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-[15px] leading-relaxed text-white/75">
            Ajoutez vos hard skills pour enrichir votre matching et vos preuves.
          </p>
        )}

        <Link href={PROFIL_EDGE_SECTION_HREFS.hard_skills}>
          <HubPillCta>
            {stats.total > 0 ? "Gérer mes compétences" : "Ajouter des compétences"}
            <ArrowRight className="h-4 w-4" />
          </HubPillCta>
        </Link>
      </HubSurface>
    </section>
  );
}
