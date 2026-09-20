"use client";

import Link from "next/link";
import { Award } from "lucide-react";

import { EdgePageAmbiance } from "@/components/apprenant/edge-page-ambiance";
import { SkillsSectionKicker } from "@/components/apprenant/skills/skills-ui";
import { useEdgeSkillsCenter } from "@/hooks/use-edge-skills-center";
import {
  APPRENANT_PAGE_SHELL,
  CONNECT_BTN_PRIMARY,
  CONNECT_BTN_SECONDARY,
} from "@/lib/apprenant/connect-nav";

export default function SkillsBadgesPage() {
  const { capital, loading } = useEdgeSkillsCenter();

  return (
    <EdgePageAmbiance ambiance="skills">
      <div className={`${APPRENANT_PAGE_SHELL} max-w-2xl pb-24`}>
        <header className="space-y-3">
          <SkillsSectionKicker>Badges & certifications</SkillsSectionKicker>
          <h1 className="text-[30px] font-bold tracking-[-0.03em] text-white sm:text-[36px]">
            Vos réussites
          </h1>
          <p className="max-w-lg text-[14px] text-white/40">
            Les badges obtenus dans l’écosystème EDGE enrichissent votre capital Skills et
            apparaissent en synthèse dans Profil.
          </p>
        </header>

        <div className="mt-10 flex items-end gap-4">
          <Award className="h-10 w-10 text-[#7BA7FF]" />
          <div>
            <p className="text-[48px] font-bold leading-none tracking-[-0.04em] text-white tabular-nums">
              {loading ? "—" : capital.badges}
            </p>
            <p className="mt-2 text-[13px] text-white/40">badge{capital.badges !== 1 ? "s" : ""}</p>
          </div>
        </div>

        <div className="mt-10 flex flex-wrap gap-3">
          <Link href="/dashboard/apprenant/badges" className={CONNECT_BTN_PRIMARY}>
            Ouvrir mes badges
          </Link>
          <Link href="/dashboard/apprenant/skills/prove" className={CONNECT_BTN_SECONDARY}>
            Ajouter une certification
          </Link>
        </div>
      </div>
    </EdgePageAmbiance>
  );
}
