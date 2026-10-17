"use client";

import { Suspense, useMemo } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

import { EdgePageAmbiance } from "@/components/apprenant/edge-page-ambiance";
import {
  SkillsEmptyHint,
  SkillsSectionKicker,
  SkillsTrainingCard,
} from "@/components/apprenant/skills/skills-ui";
import { useEdgeSkillsCenter } from "@/hooks/use-edge-skills-center";
import {
  TRAINING_MODALITY_TYPES,
  buildTrainingFocusList,
  encodeSkillParam,
  nextHardSkillLevel,
} from "@/lib/apprenant/edge-skills-center";
import {
  APPRENANT_PAGE_SHELL,
  CONNECT_BTN_PRIMARY,
  CONNECT_BTN_SECONDARY,
} from "@/lib/apprenant/connect-nav";

function EntrainementContent() {
  const searchParams = useSearchParams();
  const focusSkill = searchParams.get("skill")?.trim() || "";
  const { loading, error, records, meta, matching, training } = useEdgeSkillsCenter();

  const focused = useMemo(() => {
    if (!focusSkill) return null;
    const list = buildTrainingFocusList(records, meta, matching, 50);
    return list.find((t) => t.skill.toLowerCase() === focusSkill.toLowerCase()) ?? null;
  }, [focusSkill, records, meta, matching]);

  const display = focused ? [focused] : training;

  return (
    <div className={`${APPRENANT_PAGE_SHELL} max-w-3xl pb-24`}>
      <header className="space-y-3">
        <SkillsSectionKicker>Training Center</SkillsSectionKicker>
        <h1 className="text-[30px] font-bold tracking-[-0.03em] text-white sm:text-[36px]">
          {focused ? focused.skill : "Votre entraînement"}
        </h1>
        <p className="max-w-lg text-[14px] text-white/40">
          Sessions actives pour progresser, valider et prouver.
        </p>
      </header>

      {loading && <div className="mt-8"><SkillsEmptyHint>Chargement…</SkillsEmptyHint></div>}
      {error && <div className="mt-8"><SkillsEmptyHint>{error}</SkillsEmptyHint></div>}

      {!loading && display.length === 0 && (
        <div className="mt-8 space-y-4">
          <SkillsEmptyHint>Aucun entraînement en cours.</SkillsEmptyHint>
          <Link href="/dashboard/apprenant/skills/develop" className={CONNECT_BTN_PRIMARY}>
            Développer une compétence
          </Link>
        </div>
      )}

      {display.length > 0 && (
        <div className="mt-8 grid gap-4 md:grid-cols-2">
          {display.map((f) => (
            <SkillsTrainingCard key={f.skill} focus={f} />
          ))}
        </div>
      )}

      {focused && (
        <section className="mt-12 space-y-5">
          <SkillsSectionKicker>Session</SkillsSectionKicker>
          <h2 className="text-[22px] font-semibold text-white">Prochain entraînement</h2>
          <p className="text-[15px] text-white/70">{focused.nextDrill}</p>
          <p className="text-[13px] text-white/35">{focused.durationMin} min · {focused.currentLevel} → {focused.targetLevel}</p>

          <div className="flex flex-wrap gap-2 pt-2">
            {TRAINING_MODALITY_TYPES.slice(0, 6).map((m) => (
              <span
                key={m.id}
                className="rounded-full border border-white/[0.08] px-3 py-1.5 text-[12px] text-white/50"
              >
                {m.label}
              </span>
            ))}
          </div>

          <div className="rounded-2xl border border-[#3D7BFF]/20 bg-[#3D7BFF]/[0.07] p-5">
            <p className="text-[13px] text-[#B8D0FF]">
              Pour progresser en {focused.skill.toLowerCase()}, nous vous recommandons ce module.
            </p>
            <Link
              href="/dashboard/apprenant/formations"
              className="mt-3 inline-flex text-[13px] font-semibold text-[#7BA7FF] hover:text-white"
            >
              Apprendre avec Learn →
            </Link>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href={`/dashboard/apprenant/skills/prove?skill=${encodeSkillParam(focused.skill)}`}
              className={CONNECT_BTN_PRIMARY}
            >
              Ajouter une preuve
            </Link>
            <Link
              href={`/dashboard/apprenant/skills/c/${encodeSkillParam(focused.skill)}`}
              className={CONNECT_BTN_SECONDARY}
            >
              Fiche compétence
            </Link>
          </div>
        </section>
      )}

      {!focused && records.length > 0 && (
        <p className="mt-10 text-[13px] text-white/30">
          Objectif type : {records[0]!.level} → {nextHardSkillLevel(records[0]!.level)}
        </p>
      )}
    </div>
  );
}

export default function SkillsEntrainementPage() {
  return (
    <EdgePageAmbiance ambiance="skills">
      <Suspense fallback={<div className={`${APPRENANT_PAGE_SHELL} text-white/40`}>Chargement…</div>}>
        <EntrainementContent />
      </Suspense>
    </EdgePageAmbiance>
  );
}
