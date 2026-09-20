"use client";

import Link from "next/link";

import { EdgePageAmbiance } from "@/components/apprenant/edge-page-ambiance";
import {
  SkillsEmptyHint,
  SkillsSectionKicker,
} from "@/components/apprenant/skills/skills-ui";
import { useEdgeSkillsCenter } from "@/hooks/use-edge-skills-center";
import { encodeSkillParam } from "@/lib/apprenant/edge-skills-center";
import {
  APPRENANT_PAGE_SHELL,
  CONNECT_BTN_PRIMARY,
} from "@/lib/apprenant/connect-nav";
import { resolveSkillUxStatus } from "@/lib/hard-skills/hard-skills-portfolio";

export default function SkillsPreuvesPage() {
  const { loading, error, records, meta } = useEdgeSkillsCenter();

  const proved = records.filter((r) => {
    const s = resolveSkillUxStatus(meta[r.name]);
    return s === "proved" || s === "evaluated" || s === "validated" || Boolean(meta[r.name]?.proof);
  });

  return (
    <EdgePageAmbiance ambiance="skills">
      <div className={`${APPRENANT_PAGE_SHELL} max-w-3xl pb-24`}>
        <header className="space-y-3">
          <SkillsSectionKicker>Mes preuves</SkillsSectionKicker>
          <h1 className="text-[30px] font-bold tracking-[-0.03em] text-white sm:text-[36px]">
            Preuves rattachées
          </h1>
          <p className="max-w-lg text-[14px] text-white/40">
            Chaque preuve est liée à une compétence. Elles alimentent la synthèse Profil.
          </p>
          <Link href="/dashboard/apprenant/skills/prove" className={CONNECT_BTN_PRIMARY}>
            Prouver une compétence
          </Link>
        </header>

        <div className="mt-10 space-y-3">
          {loading && <SkillsEmptyHint>Chargement…</SkillsEmptyHint>}
          {error && <SkillsEmptyHint>{error}</SkillsEmptyHint>}
          {!loading && proved.length === 0 && (
            <SkillsEmptyHint>Aucune preuve déposée pour le moment.</SkillsEmptyHint>
          )}
          {proved.map((rec) => {
            const proof = meta[rec.name]?.proof;
            return (
              <Link
                key={rec.name}
                href={`/dashboard/apprenant/skills/c/${encodeSkillParam(rec.name)}`}
                className="block rounded-2xl border border-white/[0.06] bg-white/[0.02] px-5 py-4 transition hover:border-[#3D7BFF]/25"
              >
                <p className="text-[15px] font-semibold text-white">{rec.name}</p>
                <p className="mt-1 text-[13px] text-white/40">
                  {proof?.note || proof?.url || "Preuve enregistrée"}
                </p>
                {proof?.type && (
                  <p className="mt-2 text-[11px] uppercase tracking-[0.14em] text-white/25">
                    {proof.type}
                  </p>
                )}
              </Link>
            );
          })}
        </div>
      </div>
    </EdgePageAmbiance>
  );
}
