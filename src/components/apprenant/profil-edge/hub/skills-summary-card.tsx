"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import {
  computeHardSkillStats,
  parseHardSkillPortfolio,
  type StoredHardSkillMeta,
} from "@/lib/hard-skills/hard-skills-portfolio";
import { PROFIL_EDGE_SECTION_HREFS } from "@/lib/particulier/profil-edge-maturity";
import { CONNECT_BTN_SECONDARY } from "@/lib/apprenant/connect-nav";
import { HubSectionHeader, HubSurface } from "./hub-ui";

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
      <HubSurface tone="secondary" className="space-y-5">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-[2.5rem] font-semibold tabular-nums tracking-[-0.04em] text-white">
              {stats.total}
            </p>
            <p className="text-[13px] text-white/45">
              compétence{stats.total > 1 ? "s" : ""} enregistrée{stats.total > 1 ? "s" : ""}
            </p>
          </div>
          {stats.total > 0 ? (
            <div className="text-right text-[12px] leading-relaxed text-white/40">
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
                className="flex items-center justify-between gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] px-3.5 py-3"
              >
                <span className="truncate text-[14px] font-medium text-white">{r.name}</span>
                <span className="shrink-0 text-[12px] text-white/45">{r.level}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-[14px] leading-relaxed text-white/50">
            Ajoutez vos hard skills pour enrichir votre matching et vos preuves.
          </p>
        )}

        <Link
          href={PROFIL_EDGE_SECTION_HREFS.hard_skills}
          className={`${CONNECT_BTN_SECONDARY} w-full justify-center sm:w-auto`}
        >
          {stats.total > 0 ? "Gérer mes compétences" : "Ajouter des compétences"}
          <ArrowRight className="ml-2 h-4 w-4" />
        </Link>
      </HubSurface>
    </section>
  );
}
