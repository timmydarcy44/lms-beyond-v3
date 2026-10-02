"use client";

import Link from "next/link";
import { ArrowLeft, FileCheck2, GraduationCap, MessageCircle, Play } from "lucide-react";

import type { CoachingSkill } from "@/components/apprenant/profil-edge/coaching-skills";
import {
  getSkillGapTips,
  getSkillGapWhyImportant,
  getSkillWhatToDevelop,
  getSkillProgressionPlan,
} from "@/lib/particulier/edge-skill-gap-tips";
import { getSkillEvidence } from "@/lib/apprenant/edge-skill-evidence";
import { missionHref } from "@/lib/apprenant/edge-mission-types";
import { getCoachingBookingHref } from "@/lib/particulier/coaching-config";
import { encodeSkillParam } from "@/lib/apprenant/edge-skills-center";
import { CONNECT_BTN_PRIMARY, CONNECT_BTN_SECONDARY } from "@/lib/apprenant/connect-nav";

const RESERVATION_HREF = getCoachingBookingHref("progression");

type Props = {
  skill: CoachingSkill;
  objectiveLabel: string;
  onBack: () => void;
};

export function SkillUniverseView({ skill, objectiveLabel, onBack }: Props) {
  const tips = getSkillGapTips(skill.name);
  const whatToDevelop = getSkillWhatToDevelop(skill.name);
  const plan = getSkillProgressionPlan(skill.name);
  const evidence = getSkillEvidence(skill.name, skill.status);

  return (
    <div className="space-y-6">
      <button
        type="button"
        onClick={onBack}
        className="inline-flex items-center gap-2 text-[13px] font-medium text-white/50 transition hover:text-white"
      >
        <ArrowLeft className="h-4 w-4" />
        Training center
      </button>

      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-white/40">Compétence</p>
        <h2 className="mt-1 text-[1.75rem] font-bold tracking-[-0.03em] text-white">{skill.name}</h2>
        <p className="mt-2 text-[14px] text-white/55">{skill.whyUseful}</p>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {[
          { label: "Niveau", value: skill.level },
          { label: "Attendu", value: skill.expectedLevel },
          { label: "Statut", value: skill.situation },
        ].map((cell) => (
          <div
            key={cell.label}
            className="rounded-2xl border border-white/[0.08] bg-white/[0.03] px-3 py-3"
          >
            <p className="text-[10px] uppercase tracking-wider text-white/40">{cell.label}</p>
            <p className="mt-1 text-[13px] font-semibold text-white">{cell.value}</p>
          </div>
        ))}
      </div>

      {evidence ? (
        <div className="rounded-2xl border border-[#3D7BFF]/25 bg-[#3D7BFF]/[0.07] p-4">
          <p className="text-[14px] font-semibold text-white">{evidence.title}</p>
          <p className="mt-2 text-[13px] leading-relaxed text-white/65">{evidence.intro}</p>
          <div className="mt-3 flex items-center gap-3">
            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full bg-[#3D7BFF]"
                style={{ width: `${evidence.confidence}%` }}
              />
            </div>
            <span className="text-[12px] font-semibold text-[#9EC0FF]">{evidence.confidence}&nbsp;%</span>
          </div>
        </div>
      ) : null}

      {whatToDevelop.length ? (
        <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-white/40">
            Ce qu&apos;il faut développer
          </p>
          <ul className="mt-3 space-y-2 text-[14px] text-white/75">
            {whatToDevelop.map((item) => (
              <li key={item} className="flex gap-2">
                <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-[#8BB4FF]" />
                {item}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="rounded-2xl border border-[#3D7BFF]/30 bg-[#3D7BFF]/[0.08] p-5">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#9EC0FF]">
          Mission Byound
        </p>
        <p className="mt-3 text-[14px] leading-relaxed text-white/75">
          Le coach Byound prépare une mission contextualisée pour développer « {skill.name} » : mise en
          situation, personnages, objectif pédagogique. Chaque mission est unique.
        </p>
        <Link
          href={missionHref(skill.name, {
            objective: objectiveLabel,
            target: skill.expectedLevel,
            level: skill.level,
          })}
          className={`${CONNECT_BTN_PRIMARY} mt-4 inline-flex w-full items-center justify-center gap-2 py-3.5`}
        >
          <Play className="h-4 w-4" />
          Lancer une mission
        </Link>
      </div>

      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-white/40">
          Comment progresser
        </p>
        <ol className="mt-3 space-y-2">
          {plan.map((step, index) => (
            <li
              key={step.label}
              className="flex items-center gap-3 rounded-2xl border border-white/[0.07] bg-[#0a0c12]/60 px-4 py-3"
            >
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#3D7BFF]/20 text-[12px] font-bold text-[#9EC0FF]">
                {index + 1}
              </span>
              <span className="flex-1 text-[14px] text-white/80">{step.label}</span>
              {step.meta ? <span className="text-[11px] text-white/40">{step.meta}</span> : null}
            </li>
          ))}
        </ol>
        {tips[0] ? (
          <p className="mt-3 text-[12px] leading-relaxed text-white/45">Conseil : {tips[0]}</p>
        ) : null}
      </div>

      <div className="grid grid-cols-2 gap-2">
        <Link
          href={`/dashboard/apprenant/skills/develop?skill=${encodeSkillParam(skill.name)}`}
          className={`${CONNECT_BTN_SECONDARY} flex items-center justify-center gap-1.5 py-3 text-[13px]`}
        >
          Exercice ciblé
        </Link>
        <Link
          href="/dashboard/apprenant/skills/prove"
          className={`${CONNECT_BTN_SECONDARY} flex items-center justify-center gap-1.5 py-3 text-[13px]`}
        >
          <FileCheck2 className="h-3.5 w-3.5" />
          Preuve
        </Link>
        <Link
          href="/dashboard/apprenant/skills/badges"
          className={`${CONNECT_BTN_SECONDARY} flex items-center justify-center gap-1.5 py-3 text-[13px]`}
        >
          Open badges
        </Link>
        <Link
          href="/dashboard/apprenant/coaching"
          className={`${CONNECT_BTN_SECONDARY} flex items-center justify-center gap-1.5 py-3 text-[13px]`}
        >
          <GraduationCap className="h-3.5 w-3.5" />
          Formations
        </Link>
        <Link
          href={RESERVATION_HREF}
          className={`${CONNECT_BTN_SECONDARY} col-span-2 flex items-center justify-center gap-1.5 py-3 text-[13px]`}
        >
          <MessageCircle className="h-3.5 w-3.5" />
          Coaching expert
        </Link>
      </div>

      <p className="text-[12px] leading-relaxed text-white/40">
        {getSkillGapWhyImportant(skill.name, objectiveLabel)}
      </p>
    </div>
  );
}
