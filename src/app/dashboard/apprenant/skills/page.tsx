"use client";

import Link from "next/link";

import { EdgePageAmbiance } from "@/components/apprenant/edge-page-ambiance";
import {
  SkillsCapitalStrip,
  SkillsQuickActionCards,
  SkillsEmptyHint,
  SkillsSectionKicker,
  SkillsTrainingCard,
} from "@/components/apprenant/skills/skills-ui";
import { useEdgeSkillsCenter } from "@/hooks/use-edge-skills-center";
import { encodeSkillParam } from "@/lib/apprenant/edge-skills-center";
import { SKILLS_TRAINING_ENABLED } from "@/lib/apprenant/skills-training-flag";
import { APPRENANT_PAGE_SHELL, CONNECT_BTN_PRIMARY } from "@/lib/apprenant/connect-nav";

export default function ApprenantSkillsHomePage() {
  const {
    loading,
    error,
    capital,
    training,
    objectiveGaps,
    careerTitle,
    objectiveLabel,
  } = useEdgeSkillsCenter();

  const objectiveName = careerTitle || objectiveLabel;

  return (
    <EdgePageAmbiance ambiance="skills">
      <div className={`${APPRENANT_PAGE_SHELL} max-w-4xl pb-24`}>
        {/* Hero — intégré au background, pas de card */}
        <header className="space-y-6 pt-2 md:pt-6">
          <SkillsSectionKicker>Byound Skills</SkillsSectionKicker>
          <div className="space-y-3">
            <h1 className="max-w-xl text-[34px] font-bold leading-[1.08] tracking-[-0.04em] text-white sm:text-[44px]">
              Déclarez vos compétences.
              <br />
              <span className="text-white/55">Prouvez ce que vous savez faire.</span>
            </h1>
            <p className="max-w-md text-[15px] leading-relaxed text-white/40">
              Vos preuves constituent votre portfolio. Certaines compétences peuvent aussi être
              certifiées par un Open Badge.
            </p>
          </div>
          <SkillsQuickActionCards />
          <Link
            href="/dashboard/apprenant/skills/develop"
            className={`${CONNECT_BTN_PRIMARY} mt-2 inline-flex w-fit`}
          >
            Déclarer une compétence
          </Link>
        </header>

        {/* Capital */}
        <section className="mt-14 space-y-5 border-t border-white/[0.06] pt-10">
          <SkillsSectionKicker>Capital de compétences</SkillsSectionKicker>
          {loading ? (
            <SkillsEmptyHint>Chargement de votre capital…</SkillsEmptyHint>
          ) : error ? (
            <SkillsEmptyHint>{error}</SkillsEmptyHint>
          ) : (
            <SkillsCapitalStrip
              total={capital.total}
              proved={capital.proved}
              inDevelopment={capital.inDevelopment}
              badges={capital.badges}
            />
          )}
        </section>

        {SKILLS_TRAINING_ENABLED ? (
        <section className="mt-16 space-y-6">
          <div className="space-y-2">
            <SkillsSectionKicker>Training Center</SkillsSectionKicker>
            <h2 className="text-[26px] font-bold tracking-[-0.03em] text-white sm:text-[30px]">
              Reprenez votre entraînement.
            </h2>
          </div>

          {loading ? (
            <SkillsEmptyHint>Préparation de vos sessions…</SkillsEmptyHint>
          ) : training.length === 0 ? (
            <div className="space-y-4">
              <SkillsEmptyHint>
                Aucune compétence en cours. Déclarez ou sélectionnez une compétence pour démarrer
                votre entraînement.
              </SkillsEmptyHint>
              <Link href="/dashboard/apprenant/skills/develop" className={CONNECT_BTN_PRIMARY}>
                Développer une compétence
              </Link>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {training.map((focus) => (
                <SkillsTrainingCard key={focus.skill} focus={focus} />
              ))}
            </div>
          )}
        </section>
        ) : null}

        {/* Objectif métier */}
        <section className="mt-16 space-y-6">
          <div className="space-y-2">
            <SkillsSectionKicker>Vers votre objectif</SkillsSectionKicker>
            <h2 className="text-[26px] font-bold tracking-[-0.03em] text-white sm:text-[30px]">
              {objectiveName || "Votre métier cible"}
            </h2>
            {!objectiveName && (
              <p className="max-w-md text-[14px] text-white/40">
                Renseignez votre objectif professionnel dans{" "}
                <Link
                  href="/dashboard/apprenant/profil-comportemental"
                  className="text-[#7BA7FF] hover:underline"
                >
                  Profil
                </Link>{" "}
                pour voir l’écart de compétences.
              </p>
            )}
          </div>

          {objectiveGaps.length > 0 ? (
            <div className="space-y-5">
              {objectiveGaps.map((gap) => (
                <div key={gap.skill} className="flex items-center justify-between gap-3 py-2">
                  <p className="text-[15px] font-medium text-white/90">{gap.skill}</p>
                  <Link
                    href={`/dashboard/apprenant/skills/develop?skill=${encodeSkillParam(gap.skill)}`}
                    className="text-[12px] font-semibold text-[#7BA7FF] transition hover:text-white"
                  >
                    Déclarer
                  </Link>
                </div>
              ))}
            </div>
          ) : objectiveName ? (
            <SkillsEmptyHint>
              Les compétences attendues pour ce métier apparaîtront dès que le matching est
              disponible.
            </SkillsEmptyHint>
          ) : null}
        </section>
      </div>
    </EdgePageAmbiance>
  );
}
