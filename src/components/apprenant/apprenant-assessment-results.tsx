"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import {
  IdmcRadarChart,
  type AxisKey,
} from "@/components/idmc/IdmcRadarChart";
import {
  buildDiscObservation,
  buildIdmcObservation,
  buildSoftSkillsObservation,
} from "@/lib/apprenant/assessment-observations";
import { resolveDiscProfile } from "@/lib/disc/disc-scoring";
import { ProfileAnalysisOverlay } from "@/components/apprenant/profile-analysis-overlay";
import {
  APPRENANT_CARD_BODY,
  APPRENANT_CARD_KICKER,
  CONNECT_BTN_PRIMARY,
  CONNECT_BTN_SECONDARY,
} from "@/lib/apprenant/connect-nav";

export type DiscScores = { D: number; I: number; S: number; C: number };

const DISC_PROFILE: Record<keyof DiscScores, string> = {
  D: "Dominant",
  I: "Influent",
  S: "Stable",
  C: "Consciencieux",
};

const DISC_COLORS: Record<keyof DiscScores, string> = {
  D: "#EF4444",
  I: "#F59E0B",
  S: "#10B981",
  C: "#3B82F6",
};

const COCKPIT_ACCENT = "#3D7BFF";
const COCKPIT_ACCENT_BG = "rgba(61,123,255,0.1)";
const COCKPIT_ACCENT_BORDER = "rgba(61,123,255,0.3)";

const RESULT_CARD_LIGHT =
  "rounded-2xl border border-black/[0.08] bg-[#f5f5f3] p-5 text-[#0a0a0a] shadow-sm sm:p-6";

const RESULTS_SECTION_LIGHT = "rounded-2xl border border-black/[0.06] bg-white p-5 sm:p-6";

function discDominant(scores: DiscScores): keyof DiscScores {
  return resolveDiscProfile(scores).dominant;
}

function discPercent(score: number): number {
  return Math.max(0, Math.min(100, Math.round(score)));
}

function DiscHistogram({
  scores,
  compact = false,
  cockpit = false,
}: {
  scores: DiscScores;
  compact?: boolean;
  cockpit?: boolean;
}) {
  const chartHeight = compact ? 72 : 100;
  const labelClass = cockpit ? "text-[10px] font-medium text-white/45" : "text-[10px] font-medium text-black/45";
  const valueClass = cockpit ? "text-xs font-semibold text-white" : "text-xs font-semibold text-[#0a0a0a]";
  return (
    <div className="flex items-end gap-3" style={{ height: chartHeight + 36 }}>
      {(Object.keys(scores) as Array<keyof DiscScores>).map((key) => {
        const pct = discPercent(scores[key]);
        const height = Math.round((pct / 100) * chartHeight);
        return (
          <div key={key} className="flex flex-1 flex-col items-center gap-1.5">
            <div
              className="w-full max-w-[52px] rounded-md"
              style={{ height: `${height}px`, background: DISC_COLORS[key] }}
            />
            <div className={labelClass}>{key}</div>
            <div className={valueClass}>{pct}%</div>
          </div>
        );
      })}
    </div>
  );
}

function Observation({ children, cockpit = false }: { children: ReactNode; cockpit?: boolean }) {
  return (
    <p
      className={
        cockpit
          ? "mt-4 rounded-xl border border-white/10 bg-white/[0.03] px-3.5 py-3 text-sm leading-relaxed text-white/70"
          : "mt-4 rounded-xl border border-black/[0.06] bg-white px-3.5 py-3 text-sm leading-relaxed text-black/70"
      }
    >
      {children}
    </p>
  );
}

function AnalysisBlocks({ content }: { content: ReactNode }) {
  if (typeof content === "string") {
    return (
      <div className="space-y-3">
        {content
          .split(/\n+/)
          .map((line) => line.trim())
          .filter(Boolean)
          .map((line) => {
            const isTitle = /^#{1,3}\s/.test(line) || line.endsWith(":");
            const text = line.replace(/^#{1,6}\s+/, "").replace(/\*\*/g, "");
            return isTitle ? (
              <h3 key={line} className="text-sm font-semibold text-[#0a0a0a]">
                {text}
              </h3>
            ) : (
              <p key={line} className="text-black/75">
                {text}
              </p>
            );
          })}
      </div>
    );
  }
  return <div className="space-y-3">{content}</div>;
}

type Props = {
  variant?: "compact" | "full";
  publicMode?: boolean;
  firstName?: string;
  discScores: DiscScores | null;
  idmcAxes: Record<AxisKey, number> | null;
  softSkillsRadar: Array<{ skill: string; score: number }>;
  correlatedAnalysis?: string | ReactNode | null;
  idmcLevel?: string | null;
};

export function ApprenantAssessmentResults({
  variant = "full",
  publicMode = false,
  firstName,
  discScores,
  idmcAxes,
  softSkillsRadar,
  correlatedAnalysis,
  idmcLevel,
}: Props) {
  const compact = variant === "compact";
  const cockpit = !publicMode;
  const resultCard = cockpit ? APPRENANT_CARD_BODY : RESULT_CARD_LIGHT;
  const resultsSection = cockpit ? APPRENANT_CARD_BODY : RESULTS_SECTION_LIGHT;
  const [analysisOpen, setAnalysisOpen] = useState(false);
  const topSoft = [...softSkillsRadar].sort((a, b) => b.score - a.score).slice(0, compact ? 5 : 10);
  const softMax = topSoft.length ? Math.max(...topSoft.map((i) => i.score)) : 0;
  const hasCorrelatedAnalysis = Boolean(
    correlatedAnalysis &&
      (typeof correlatedAnalysis === "string"
        ? correlatedAnalysis.trim().length > 0
        : true),
  );

  const inner = (
    <div className={`grid gap-4 ${compact ? "md:grid-cols-3" : "lg:grid-cols-3"}`}>
      <article className={resultCard}>
        <p className={cockpit ? APPRENANT_CARD_KICKER : "text-[10px] font-medium uppercase tracking-[0.25em] text-[#FF3B30]"}>
          Test comportemental
        </p>
        <h3 className={`mt-1 text-base font-semibold ${cockpit ? "text-white" : "text-[#0a0a0a]"}`}>DISC</h3>
        {discScores ? (
          <div className="mt-4 space-y-3">
            <p className={`text-sm ${cockpit ? "text-white/70" : "text-black/70"}`}>
              Profil{" "}
              <span className={`font-semibold ${cockpit ? "text-white" : "text-[#0a0a0a]"}`}>
                {DISC_PROFILE[discDominant(discScores)]}
              </span>
            </p>
            <DiscHistogram scores={discScores} compact={compact} cockpit={cockpit} />
            <Observation cockpit={cockpit}>{buildDiscObservation(discScores)}</Observation>
          </div>
        ) : (
          <div className="mt-4 space-y-3">
            <p className={`text-sm ${cockpit ? "text-white/55" : "text-black/55"}`}>
              {publicMode ? "Test DISC non renseigné." : "Aucun résultat enregistré."}
            </p>
            {!publicMode ? (
              <Link href="/dashboard/apprenant/test-comportemental-intro" className={CONNECT_BTN_SECONDARY}>
                Passer le test DISC
              </Link>
            ) : null}
          </div>
        )}
      </article>

      <article className={resultCard}>
        <p className={cockpit ? APPRENANT_CARD_KICKER : "text-[10px] font-medium uppercase tracking-[0.25em] text-[#FF3B30]"}>
          Motivation
        </p>
        <h3 className={`mt-1 text-base font-semibold ${cockpit ? "text-white" : "text-[#0a0a0a]"}`}>IDMC</h3>
        {idmcAxes ? (
          <div className="mt-4 space-y-3">
            {idmcLevel ? (
              <span
                className="inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold"
                style={{
                  backgroundColor: cockpit ? COCKPIT_ACCENT_BG : "rgba(255,59,48,0.1)",
                  color: cockpit ? COCKPIT_ACCENT : "#FF3B30",
                }}
              >
                {idmcLevel}
              </span>
            ) : null}
            <IdmcRadarChart scores={idmcAxes} responsive variant={cockpit ? "light" : "light"} title="" />
            <Observation cockpit={cockpit}>{buildIdmcObservation(idmcAxes)}</Observation>
            {hasCorrelatedAnalysis ? (
              <button
                type="button"
                onClick={() => setAnalysisOpen(true)}
                className={
                  cockpit
                    ? `${CONNECT_BTN_SECONDARY} w-full`
                    : "inline-flex w-full items-center justify-center rounded-full border border-[#FF3B30]/30 bg-[#FF3B30]/[0.06] px-4 py-2.5 text-sm font-semibold text-[#FF3B30] transition hover:bg-[#FF3B30]/10"
                }
              >
                Lire l&apos;analyse
              </button>
            ) : null}
          </div>
        ) : (
          <div className="mt-4 space-y-3">
            <p className={`text-sm ${cockpit ? "text-white/55" : "text-black/55"}`}>
              {publicMode ? "Test IDMC non renseigné." : "Aucun score IDMC disponible."}
            </p>
            {!publicMode ? (
              <Link href="/dashboard/apprenant/idmc-intro" className={CONNECT_BTN_SECONDARY}>
                Passer le test IDMC
              </Link>
            ) : null}
          </div>
        )}
      </article>

      <article className={resultCard}>
        <p className={cockpit ? APPRENANT_CARD_KICKER : "text-[10px] font-medium uppercase tracking-[0.25em] text-[#FF3B30]"}>
          Compétences
        </p>
        <h3 className={`mt-1 text-base font-semibold ${cockpit ? "text-white" : "text-[#0a0a0a]"}`}>
          {firstName ? `Soft skills — ${firstName}` : "Soft skills"}
        </h3>
        {topSoft.length ? (
          <div className="mt-4">
            <ul className="space-y-2.5">
              {topSoft.map((item, index) => (
                <li key={item.skill} className="flex items-center gap-3 text-sm">
                  <span
                    className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold"
                    style={{
                      backgroundColor: cockpit ? COCKPIT_ACCENT_BG : "rgba(255,59,48,0.1)",
                      color: cockpit ? COCKPIT_ACCENT : "#FF3B30",
                    }}
                  >
                    {index + 1}
                  </span>
                  <span className={`min-w-0 flex-1 truncate ${cockpit ? "text-white/80" : "text-black/80"}`}>
                    {item.skill}
                  </span>
                  <div
                    className={`hidden h-1.5 w-16 overflow-hidden rounded-full sm:block ${cockpit ? "bg-white/10" : "bg-black/10"}`}
                  >
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${softMax ? (item.score / softMax) * 100 : 0}%`,
                        backgroundColor: cockpit ? COCKPIT_ACCENT : "#FF3B30",
                      }}
                    />
                  </div>
                </li>
              ))}
            </ul>
            <Observation>{buildSoftSkillsObservation(topSoft, firstName)}</Observation>
          </div>
        ) : (
          <div className="mt-4 space-y-3">
            <p className="text-sm text-black/55">
              {publicMode ? "Soft skills non renseignés." : "Aucun score soft skills disponible."}
            </p>
            {!publicMode ? (
              <Link
                href="/dashboard/apprenant/soft-skills-intro"
                className={cockpit ? CONNECT_BTN_PRIMARY : "inline-flex rounded-full border border-black/15 bg-white px-3 py-1.5 text-xs font-medium text-[#0a0a0a] hover:border-[#FF3B30]/40"}
              >
                Passer le test soft skills
              </Link>
            ) : null}
          </div>
        )}
      </article>
    </div>
  );

  return (
    <>
      {compact && !publicMode ? (
        <section className={`${resultsSection} space-y-4`}>
          <div className="flex flex-wrap items-end justify-between gap-2">
            <h3 className="text-sm font-medium text-white">Mes résultats</h3>
            <Link
              href="/dashboard/apprenant/profil"
              className="text-xs font-medium text-[#3D7BFF]/90 hover:underline"
            >
              Voir tout sur mon profil →
            </Link>
          </div>
          {inner}
        </section>
      ) : compact && publicMode ? (
        <section className="space-y-4">{inner}</section>
      ) : (
        <section className="space-y-6">
          <div>
            <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-[#FF3B30]">
              Bilans
            </p>
            <h2 className="mt-1 text-lg font-medium text-[#0a0a0a]">Mes résultats de tests</h2>
            <p className="mt-1 text-sm text-black/55">
              DISC, IDMC et soft skills — croisés pour votre profil EDGE.
            </p>
          </div>
          {inner}
        </section>
      )}

      <ProfileAnalysisOverlay
        open={analysisOpen}
        onClose={() => setAnalysisOpen(false)}
        title={firstName ? `Profil de ${firstName}` : "Votre profil EDGE"}
        subtitle="Synthèse croisée DISC, IDMC et soft skills"
      >
        <AnalysisBlocks content={correlatedAnalysis ?? ""} />
      </ProfileAnalysisOverlay>
    </>
  );
}

export { DiscHistogram, discDominant, discPercent };
