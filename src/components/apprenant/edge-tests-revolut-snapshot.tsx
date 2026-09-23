"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

import type { DiscScores } from "@/components/apprenant/apprenant-assessment-results";
import {
  buildDiscObservation,
  buildIdmcObservation,
  buildSoftSkillsObservation,
} from "@/lib/apprenant/assessment-observations";
import { DISC_PROFILE_LABELS } from "@/lib/disc/disc-constants";
import { resolveDiscProfile } from "@/lib/disc/disc-scoring";
import {
  AXES_LABELS,
  IDMC_AXIS_KEYS,
  hasMeaningfulIdmcAxes,
  type AxisKey,
} from "@/lib/idmc/idmc-display";
import { sanitizeProfileAnalysisTone } from "@/lib/learner/profile-analysis-tone";
import {
  buildProfileAnalysisTestsSignature,
  parseProfileAnalysisSections,
  type ParsedProfileAnalysisSections,
  type ProfileAnalysisCareerMatching,
} from "@/lib/learner/profile-analysis";
import type { CareerMatchingResult } from "@/lib/career-profiles/career-profile-matching";
import { CONNECT_BTN_PRIMARY } from "@/lib/apprenant/connect-nav";
import { cn } from "@/lib/utils";

const EDGE_LOGO_WHITE =
  "https://zmcefidiiqqppowymoqb.supabase.co/storage/v1/object/public/EDGE%20Lab/EDGE_noir_sans_fond.png";

const DISC_COLORS: Record<keyof DiscScores, string> = {
  D: "#EF4444",
  I: "#F59E0B",
  S: "#10B981",
  C: "#3B82F6",
};

const DISC_LABELS: Record<keyof DiscScores, string> = {
  D: "Dominant",
  I: "Influent",
  S: "Stable",
  C: "Consciencieux",
};

const TEST_EXPLAINERS = {
  disc: {
    title: "Qu’est-ce que le DISC ?",
    body: "Le DISC mesure votre style comportemental dominant (Dominant, Influent, Stable, Consciencieux). Il explique comment vous agissez, décidez et interagissez en situation professionnelle.",
    duration: "Environ 8 minutes",
    href: "/dashboard/apprenant/test-comportemental-intro",
  },
  idmc: {
    title: "Qu’est-ce que l’IDMC ?",
    body: "L’IDMC (Indice de Maîtrise Cognitive) évalue 8 axes : connaissance de soi, méthodes, adaptation, organisation, traitement de l’information, résolution de difficultés, suivi et auto-évaluation. Il oriente vos priorités d’apprentissage.",
    duration: "Environ 10 minutes",
    href: "/dashboard/apprenant/idmc-intro",
  },
  soft: {
    title: "Qu’est-ce que le test Soft skills ?",
    body: "Ce test classe vos compétences comportementales (communication, collaboration, leadership, etc.). Le classement alimente votre matching métier et vos recommandations de formation.",
    duration: "Environ 12 minutes",
    href: "/dashboard/apprenant/soft-skills-intro",
  },
} as const;

type Props = {
  firstName?: string;
  objectiveLabel?: string | null;
  matching?: CareerMatchingResult | null;
  discScores: DiscScores | null;
  idmcAxes: Record<AxisKey, number> | null;
  softSkillsRadar: Array<{ skill: string; score: number }>;
};

function toCareerMatchingPayload(
  matching: CareerMatchingResult | null | undefined,
): ProfileAnalysisCareerMatching | null {
  if (!matching) return null;
  return {
    compatibilityScore: matching.compatibilityScore,
    strengths: matching.strengths.slice(0, 6),
    consolidate: matching.consolidate.slice(0, 6),
    develop: matching.develop.slice(0, 6),
    unevaluated: matching.unevaluated.slice(0, 6),
    nextPrioritySkill: matching.nextPriority?.skill ?? null,
  };
}

function buildLocalOrientation(
  objectiveLabel?: string | null,
  matching?: CareerMatchingResult | null,
): string | null {
  const objective = objectiveLabel?.trim();
  if (!objective && !matching) return null;

  const priorities = [
    ...(matching?.develop ?? []),
    ...(matching?.consolidate ?? []),
  ].filter(Boolean);
  const next = matching?.nextPriority?.skill;
  const suggestionSkills = [...new Set([next, ...priorities].filter(Boolean) as string[])].slice(
    0,
    3,
  );

  const head = objective
    ? `Votre objectif est de devenir ${objective}.`
    : "Pour avancer sur votre projet professionnel,";

  if (!suggestionSkills.length) {
    return `${head} À la lecture des compétences métiers, nous vous suggérons de compléter votre matching pour affiner les priorités de progression.`;
  }

  const list =
    suggestionSkills.length === 1
      ? suggestionSkills[0]
      : `${suggestionSkills.slice(0, -1).join(", ")} et ${suggestionSkills[suggestionSkills.length - 1]}`;

  return `${head} À la lecture des compétences métiers, nous vous suggérons de travailler en priorité ${list}, car ce sont les écarts les plus directs par rapport au référentiel du métier cible.`;
}

function softScoreMax(scores: number[]): number {
  const max = Math.max(0, ...scores);
  return max > 15 ? 100 : 15;
}

function buildLocalSections(params: {
  discScores: DiscScores | null;
  idmcAxes: Record<AxisKey, number> | null;
  softSkillsRadar: Array<{ skill: string; score: number }>;
  objectiveLabel?: string | null;
  matching?: CareerMatchingResult | null;
}): ParsedProfileAnalysisSections | null {
  const strengths: string[] = [];
  const improvements: string[] = [];
  const objective = params.objectiveLabel?.trim();
  const matching = params.matching;

  if (matching?.strengths?.length) {
    for (const skill of matching.strengths.slice(0, 3)) {
      strengths.push(
        objective
          ? `Sur « ${skill} », vous disposez déjà d'un appui crédible pour viser « ${objective} ».`
          : `Sur « ${skill} », vous disposez déjà d'un appui crédible pour votre projet.`,
      );
    }
  }

  if (matching?.develop?.length) {
    for (const skill of matching.develop.slice(0, 3)) {
      improvements.push(
        objective
          ? `Sans progresser sur « ${skill} », l'écart avec « ${objective} » restera visible en situation réelle.`
          : `Sans progresser sur « ${skill} », l'écart avec le métier cible restera visible en situation réelle.`,
      );
    }
  }

  if (matching?.consolidate?.length && improvements.length < 3) {
    for (const skill of matching.consolidate.slice(0, 3 - improvements.length)) {
      improvements.push(
        `Consolider « ${skill} » évitera que cette compétence reste un point faible sous pression.`,
      );
    }
  }

  const orientation = buildLocalOrientation(params.objectiveLabel, matching);
  if (!strengths.length && !improvements.length && !orientation) return null;

  // Pas de synthèse locale bateau : la phrase « Vous êtes… » attend OpenAI.
  return {
    strengths,
    improvements,
    summary: null,
    orientation,
  };
}

function RevolutList({
  title,
  items,
  accent,
}: {
  title: string;
  items: string[];
  accent: "strength" | "improve";
}) {
  if (!items.length) return null;
  return (
    <div>
      <p
        className={cn(
          "text-[11px] font-semibold uppercase tracking-[0.16em]",
          accent === "strength" ? "text-emerald-400/80" : "text-amber-400/80",
        )}
      >
        {title}
      </p>
      <ul className="mt-4 divide-y divide-white/[0.06]">
        {items.map((item, index) => (
          <li key={`${index}-${item.slice(0, 24)}`} className="flex gap-4 py-3.5 first:pt-0">
            <span className="w-6 shrink-0 text-[13px] font-semibold tabular-nums text-white/25">
              {String(index + 1).padStart(2, "0")}
            </span>
            <p className="text-[14px] leading-relaxed text-white/70">{item}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}

function TestExplainerCard({
  explainer,
}: {
  explainer: (typeof TEST_EXPLAINERS)[keyof typeof TEST_EXPLAINERS];
}) {
  return (
    <div className="mt-5 space-y-4 rounded-2xl border border-dashed border-white/15 bg-white/[0.02] px-4 py-4">
      <div>
        <p className="text-[14px] font-semibold text-white">{explainer.title}</p>
        <p className="mt-2 text-[13px] leading-relaxed text-white/50">{explainer.body}</p>
        <p className="mt-2 text-[12px] text-white/35">{explainer.duration}</p>
      </div>
      <Link href={explainer.href} className={`${CONNECT_BTN_PRIMARY} inline-flex`}>
        Passer le test
      </Link>
    </div>
  );
}

/**
 * Résultats des 3 tests — DISC / IDMC / Soft skills + synthèse croisée (vouvoiement).
 */
export function EdgeTestsRevolutSnapshot({
  firstName,
  objectiveLabel,
  matching = null,
  discScores,
  idmcAxes,
  softSkillsRadar,
}: Props) {
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [analysisLoading, setAnalysisLoading] = useState(false);

  const hasAny = Boolean(
    discScores ||
      hasMeaningfulIdmcAxes(idmcAxes) ||
      softSkillsRadar.length ||
      objectiveLabel ||
      matching,
  );
  const careerMatchingPayload = useMemo(() => toCareerMatchingPayload(matching), [matching]);
  const testsSignature = useMemo(
    () =>
      buildProfileAnalysisTestsSignature({
        discScores: discScores ?? undefined,
        idmcScores: idmcAxes ?? undefined,
        softSkills: softSkillsRadar,
        hardSkills: [
          ...(matching?.strengths ?? []),
          ...(matching?.develop ?? []),
          objectiveLabel ?? "",
          matching?.nextPriority?.skill ?? "",
        ].filter(Boolean),
      }),
    [discScores, idmcAxes, softSkillsRadar, matching, objectiveLabel],
  );

  useEffect(() => {
    if (!hasAny) return;
    let cancelled = false;
    void (async () => {
      setAnalysisLoading(true);
      try {
        const res = await fetch("/api/profile-analysis", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            firstName: firstName || "l'utilisateur",
            objectiveLabel: objectiveLabel || null,
            discScores: discScores ?? {},
            idmcScores: idmcAxes ?? {},
            softSkillsTop: softSkillsRadar.slice(0, 8),
            careerMatching: careerMatchingPayload,
            testsSignature,
          }),
        });
        if (!res.ok) return;
        const payload = (await res.json()) as { analysis?: string };
        if (!cancelled && payload.analysis) {
          setAnalysis(sanitizeProfileAnalysisTone(payload.analysis));
        }
      } catch {
        /* fallback local */
      } finally {
        if (!cancelled) setAnalysisLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [
    hasAny,
    testsSignature,
    firstName,
    objectiveLabel,
    discScores,
    idmcAxes,
    softSkillsRadar,
    careerMatchingPayload,
  ]);

  const sections = useMemo(() => {
    if (analysis) return parseProfileAnalysisSections(analysis);
    return buildLocalSections({
      discScores,
      idmcAxes,
      softSkillsRadar,
      objectiveLabel,
      matching,
    });
  }, [analysis, discScores, idmcAxes, softSkillsRadar, objectiveLabel, matching]);

  const showAnalysisHero = Boolean(sections?.summary) || analysisLoading;
  const hasCrossContent = Boolean(
    sections?.orientation ||
      sections?.summary ||
      sections?.strengths.length ||
      sections?.improvements.length ||
      analysisLoading,
  );

  const disc = discScores ? resolveDiscProfile(discScores) : null;
  const softSorted = [...softSkillsRadar].sort((a, b) => b.score - a.score);
  const softMax = softScoreMax(softSorted.map((s) => s.score));
  const idmcSorted = hasMeaningfulIdmcAxes(idmcAxes)
    ? IDMC_AXIS_KEYS.map((key) => ({
        key,
        label: AXES_LABELS[key],
        score: Math.round(Number(idmcAxes[key]) || 0),
      })).sort((a, b) => b.score - a.score)
    : [];

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-3">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={EDGE_LOGO_WHITE}
          alt="EDGE"
          className="h-5 w-auto brightness-0 invert opacity-90 sm:h-6"
        />
        <span className="text-[12px] text-white/35">· vos explorations</span>
      </div>

      {/* Lecture croisée — Revolut */}
      <section className="space-y-8">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-white/35">
            Lecture croisée
          </p>
          {objectiveLabel ? (
            <p className="mt-3 text-[1.65rem] font-semibold leading-[1.15] tracking-[-0.03em] text-white sm:text-[2rem]">
              {objectiveLabel}
            </p>
          ) : (
            <p className="mt-3 text-[1.65rem] font-semibold leading-[1.15] tracking-[-0.03em] text-white/50 sm:text-[2rem]">
              Votre objectif professionnel
            </p>
          )}
        </div>

        {!hasCrossContent ? (
          <p className="max-w-xl text-[15px] leading-relaxed text-white/40">
            Passez DISC, IDMC et Soft skills pour obtenir votre lecture de profil croisée.
          </p>
        ) : (
          <div className="space-y-8">
            {showAnalysisHero ? (
              <div className="max-w-3xl">
                {analysisLoading && !sections?.summary ? (
                  <div className="space-y-3" aria-busy="true" aria-label="Analyse en cours">
                    <div className="h-5 w-[92%] animate-pulse rounded bg-white/10" />
                    <div className="h-5 w-[85%] animate-pulse rounded bg-white/10" />
                    <div className="h-5 w-[70%] animate-pulse rounded bg-white/10" />
                    <div className="h-5 w-[78%] animate-pulse rounded bg-white/10" />
                  </div>
                ) : sections?.summary ? (
                  <p className="text-[1.05rem] font-medium leading-[1.55] tracking-[-0.01em] text-white sm:text-[1.2rem]">
                    {sections.summary}
                  </p>
                ) : null}
              </div>
            ) : null}

            {sections?.orientation ? (
              <p className="max-w-2xl border-l border-white/15 pl-4 text-[14px] leading-relaxed text-white/50">
                {sections.orientation}
              </p>
            ) : null}

            {(sections?.strengths.length || sections?.improvements.length) ? (
              <div className="grid gap-10 border-t border-white/[0.08] pt-8 md:grid-cols-2 md:gap-14">
                <RevolutList
                  title="Points forts"
                  items={sections?.strengths ?? []}
                  accent="strength"
                />
                <RevolutList
                  title="Axes d'amélioration"
                  items={sections?.improvements ?? []}
                  accent="improve"
                />
              </div>
            ) : null}
          </div>
        )}
      </section>

      {/* DISC */}
      <section className="rounded-[1.5rem] border border-white/[0.06] bg-white/[0.03] px-5 py-5 sm:px-6">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-white/35">
              Comportement
            </p>
            <h3 className="mt-1 text-[1.15rem] font-semibold text-white">DISC</h3>
          </div>
          {disc ? (
            <p className="text-[1.35rem] font-bold tracking-[-0.03em] text-white">
              {DISC_PROFILE_LABELS[disc.dominant]}
            </p>
          ) : null}
        </div>
        {discScores ? (
          <div className="mt-5 space-y-5">
            <div className="grid grid-cols-4 gap-3">
              {(Object.keys(discScores) as Array<keyof DiscScores>).map((key) => {
                const pct = Math.max(0, Math.min(100, Math.round(discScores[key])));
                return (
                  <div key={key} className="text-center">
                    <div className="mx-auto flex h-24 items-end justify-center">
                      <div
                        className="w-10 rounded-lg sm:w-12"
                        style={{
                          height: `${Math.max(12, Math.round((pct / 100) * 88))}px`,
                          background: DISC_COLORS[key],
                        }}
                      />
                    </div>
                    <p className="mt-2 text-[13px] font-semibold text-white">{key}</p>
                    <p className="text-[11px] text-white/40">{DISC_LABELS[key]}</p>
                    <p className="mt-0.5 text-[12px] font-semibold tabular-nums text-white/70">
                      {pct}%
                    </p>
                  </div>
                );
              })}
            </div>
            <p className="text-[13px] leading-relaxed text-white/50">
              {buildDiscObservation(discScores)}
            </p>
          </div>
        ) : (
          <TestExplainerCard explainer={TEST_EXPLAINERS.disc} />
        )}
      </section>

      {/* IDMC */}
      <section className="rounded-[1.5rem] border border-white/[0.06] bg-white/[0.03] px-5 py-5 sm:px-6">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-white/35">
          Motivation
        </p>
        <h3 className="mt-1 text-[1.15rem] font-semibold text-white">IDMC — tous les axes</h3>
        {idmcSorted.length ? (
          <div className="mt-5 space-y-3">
            <ul className="space-y-2.5">
              {idmcSorted.map((axis, index) => (
                <li key={axis.key} className="flex items-center gap-3">
                  <span className="w-5 shrink-0 text-[11px] font-semibold tabular-nums text-white/30">
                    {index + 1}
                  </span>
                  <span className="min-w-0 flex-1 truncate text-[13px] text-white/80">
                    {axis.label}
                  </span>
                  <span className="shrink-0 text-[12px] font-semibold tabular-nums text-white">
                    {axis.score}%
                  </span>
                  <div className="hidden h-1.5 w-24 overflow-hidden rounded-full bg-white/10 sm:block">
                    <div
                      className="h-full rounded-full bg-[#3D7BFF]"
                      style={{ width: `${Math.min(100, axis.score)}%` }}
                    />
                  </div>
                </li>
              ))}
            </ul>
            {hasMeaningfulIdmcAxes(idmcAxes) ? (
              <p className="text-[13px] leading-relaxed text-white/50">
                {buildIdmcObservation(idmcAxes)}
              </p>
            ) : null}
          </div>
        ) : (
          <TestExplainerCard explainer={TEST_EXPLAINERS.idmc} />
        )}
      </section>

      {/* Soft skills */}
      <section className="rounded-[1.5rem] border border-white/[0.06] bg-white/[0.03] px-5 py-5 sm:px-6">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-white/35">
          Compétences
        </p>
        <h3 className="mt-1 text-[1.15rem] font-semibold text-white">
          Soft skills — classement
        </h3>
        {softSorted.length ? (
          <div className="mt-5 space-y-3">
            <ul className="space-y-2.5">
              {softSorted.map((item, index) => (
                <li key={item.skill} className="flex items-center gap-3">
                  <span
                    className={cn(
                      "flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-bold",
                      index === 0
                        ? "bg-[#3D7BFF] text-white"
                        : "bg-white/10 text-white/60",
                    )}
                  >
                    {index + 1}
                  </span>
                  <span className="min-w-0 flex-1 truncate text-[13px] text-white/85">
                    {item.skill}
                  </span>
                  <span className="shrink-0 text-[12px] font-semibold tabular-nums text-white/70">
                    {Math.round(item.score)}/{softMax}
                  </span>
                  <div className="hidden h-1.5 w-20 overflow-hidden rounded-full bg-white/10 sm:block">
                    <div
                      className="h-full rounded-full bg-[#3D7BFF]"
                      style={{
                        width: `${softMax ? Math.min(100, (item.score / softMax) * 100) : 0}%`,
                      }}
                    />
                  </div>
                </li>
              ))}
            </ul>
            <p className="text-[13px] leading-relaxed text-white/50">
              {buildSoftSkillsObservation(softSorted, firstName)}
            </p>
            <Link
              href="/soft-skills/resultats?from=apprenant"
              className="inline-flex text-[13px] font-semibold text-[#9EC0FF]"
            >
              Voir la synthèse soft skills
            </Link>
          </div>
        ) : (
          <TestExplainerCard explainer={TEST_EXPLAINERS.soft} />
        )}
      </section>
    </div>
  );
}
