"use client";

import { EmptyState, formatActivityDate, KpiCard, SegmentBar, Timeline, TxRow } from "@/components/salarie/employee-fiche-blocks";
import type { HrDocument } from "@/components/enterprise/enterprise-employee-entretiens";
import { summarizeFicheGaps, type SoftSkillGap } from "@/lib/entreprise/metier-skill-gaps";

const DOC_TYPE_LABEL: Record<string, string> = {
  entretien_individuel: "Entretien individuel",
  bilan_annuel: "Bilan annuel",
  autre: "Autre",
};

type Analysis = {
  strengths: string[];
  improvements: string[];
  summary: string | null;
  updatedAt: string | null;
};

export function EmployeeOverview({
  shareConsent,
  hasDiagnostics,
  analysisLoading,
  analysisError,
  analysis,
  diagnosticAt,
  gaps,
  formationsInProgress,
  declaredSkills,
  badgesEarned,
  documents,
  activity,
  onOpenSkills,
  onOpenTests,
  onOpenFollow,
  onAssignFormation,
  onPrepareInterview,
  onEdit,
}: {
  shareConsent: boolean;
  hasDiagnostics: boolean;
  analysisLoading: boolean;
  analysisError: string | null;
  analysis: Analysis | null;
  diagnosticAt: string | null;
  gaps: SoftSkillGap[];
  formationsInProgress: number;
  declaredSkills: number;
  badgesEarned: number;
  documents: HrDocument[];
  activity: Array<{ id: string; label: string; at: string }>;
  onOpenSkills: () => void;
  onOpenTests: () => void;
  onOpenFollow: () => void;
  onAssignFormation: () => void;
  onPrepareInterview: () => void;
  onEdit: () => void;
}) {
  const summary = summarizeFicheGaps(gaps);
  const measuredCount = summary.measured.length;
  const atTarget = summary.reached.length;
  const nextInterview = upcomingInterview(documents);
  const actions = buildActions({
    work: summary.work,
    missing: summary.missing,
    nextInterview,
    onAssignFormation,
    onMeasure: onOpenTests,
    onPrepareInterview,
  });
  const showAnalysis = shareConsent && hasDiagnostics;
  const sentences = showAnalysis ? twoSentences(analysis) : [];
  const forces = (analysis?.strengths ?? []).slice(0, 3).map(shorten);
  const develop = (analysis?.improvements ?? []).slice(0, 3).map(shorten);
  const sourceDate = diagnosticAt || analysis?.updatedAt || null;
  const gapLine = summary.work
    .slice(0, 3)
    .map((gap) => `${gap.skill} ${formatSigned(gap.gap)}`)
    .join(" · ");

  return (
    <div className="mt-6 space-y-4">
      <div className="grid gap-3 min-[1100px]:grid-cols-4">
        <KpiCard
          label="Compétences au niveau"
          value={gaps.length > 0 ? `${atTarget} / ${measuredCount}` : "0"}
          detail="de la fiche métier"
          onClick={onOpenSkills}
        />
        <KpiCard
          label="Formation en cours"
          value={String(formationsInProgress)}
          detail={formationsInProgress > 0 ? "en cours" : "à assigner"}
          onClick={onOpenFollow}
        />
        <KpiCard
          label="Byound Skills"
          value={String(declaredSkills)}
          detail={`dont ${badgesEarned} badge${badgesEarned > 1 ? "s" : ""} obtenu${badgesEarned > 1 ? "s" : ""}`}
          tone="violet"
          onClick={onOpenSkills}
        />
        <KpiCard
          label="Prochain entretien"
          value={nextInterview ? formatActivityDate(nextInterview.date) : "Aucun"}
          detail={nextInterview ? nextInterview.type : "à planifier"}
          onClick={onOpenFollow}
        />
      </div>

      <div className="grid gap-4 min-[1100px]:grid-cols-[1.4fr_1fr]">
        <div className="space-y-4">
          {showAnalysis ? (
            <section className="rounded-[26px] bg-white p-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="flex items-center gap-2 text-lg font-extrabold">
                  <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-[#EEEBFF] text-sm text-[#6E5BFF]">✦</span>
                  Synthèse Byound AI
                </h2>
                {sourceDate ? (
                  <p className="text-sm text-[#6B6F7A]">d&apos;après les tests du {formatActivityDate(sourceDate)}</p>
                ) : null}
              </div>
              {analysisLoading ? (
                <div className="mt-5 h-28 rounded-2xl bg-[#ECE9E1]" aria-hidden />
              ) : analysisError ? (
                <p className="mt-4 text-sm text-[#3A3D45]">{analysisError}</p>
              ) : sentences.length === 0 && forces.length === 0 && develop.length === 0 ? (
                <p className="mt-4 text-sm text-[#6B6F7A]">Les recommandations ne sont pas encore disponibles.</p>
              ) : (
                <>
                  {sentences.length > 0 ? <p className="mt-4 text-sm leading-relaxed text-[#3A3D45]">{sentences.join(" ")}</p> : null}
                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    <PointBox title="Forces" tone="green" points={forces} empty="Aucune force relevée." />
                    <PointBox title="À développer" tone="amber" points={develop} empty="Aucun axe relevé." />
                  </div>
                </>
              )}
            </section>
          ) : null}

          {actions.length === 0 ? (
            <EmptyState
              title="Aucune action à lancer"
              detail="Les écarts, les compétences non mesurées et les entretiens proches apparaîtront ici."
              action={{ label: "Planifier un entretien", onClick: onPrepareInterview }}
            />
          ) : (
            <section className="rounded-[26px] bg-white p-6">
              <h2 className="text-lg font-extrabold">Prochaines actions</h2>
              <div className="mt-2">
                {actions.map((action) => (
                  <TxRow key={action.title} tone={action.tone} title={action.title} detail={action.detail} action={action.action} />
                ))}
              </div>
            </section>
          )}
        </div>

        <div className="space-y-4">
          {gaps.length === 0 ? (
            <EmptyState
              title="Aucun écart à afficher"
              detail="Reliez une fiche métier pour comparer les compétences mesurées à la cible."
              action={{ label: "Modifier la fiche", onClick: onEdit }}
            />
          ) : (
            <section className="rounded-[26px] bg-white p-6">
              <p className="text-sm text-[#6B6F7A]">Écarts avec la fiche métier</p>
              <p className="mt-2 text-[40px] font-extrabold leading-none tracking-[-0.04em]">
                {summary.work.length} <span className="text-lg font-semibold text-[#6B6F7A]">à travailler</span>
              </p>
              <div className="mt-4">
                <SegmentBar
                  segments={[
                    { value: summary.work.length, color: "#E7782C" },
                    { value: summary.close.length, color: "#9A9DA6" },
                    { value: summary.reached.length, color: "#1F9D57" },
                  ]}
                />
              </div>
              {gapLine ? <p className="mt-3 text-sm text-[#3A3D45]">{gapLine}</p> : null}
              <button type="button" onClick={onOpenSkills} className="mt-4 text-sm font-semibold text-[#07080B]">
                Voir les compétences ›
              </button>
            </section>
          )}

          {activity.length === 0 ? (
            <EmptyState
              title="Aucune activité enregistrée"
              detail="Les invitations, diagnostics, partages, formations et entretiens apparaîtront ici."
              action={{ label: "Planifier un entretien", onClick: onPrepareInterview }}
            />
          ) : (
            <section className="rounded-[26px] bg-white p-6">
              <h2 className="text-lg font-extrabold">Activité récente</h2>
              <Timeline items={activity} />
            </section>
          )}
        </div>
      </div>
    </div>
  );
}

function PointBox({
  title,
  tone,
  points,
  empty,
}: {
  title: string;
  tone: "green" | "amber";
  points: string[];
  empty: string;
}) {
  const palette = tone === "green" ? "bg-[#E3F6EC] text-[#126B3B]" : "bg-[#FFF1E2] text-[#8A4B0F]";
  return (
    <div className={`rounded-2xl p-4 ${palette}`}>
      <p className="text-sm font-extrabold">{title}</p>
      {points.length === 0 ? (
        <p className="mt-2 text-sm">{empty}</p>
      ) : (
        <ul className="mt-2 space-y-1 text-sm">
          {points.map((point) => (
            <li key={point}>{point}</li>
          ))}
        </ul>
      )}
    </div>
  );
}

function shorten(value: string) {
  const clean = value.replace(/\s+/g, " ").trim();
  if (clean.length <= 90) return clean;
  return `${clean.slice(0, 89).trim()}…`;
}

function twoSentences(analysis: Analysis | null) {
  const source = analysis?.summary?.replace(/\s+/g, " ").trim() ?? "";
  if (!source) return [];
  return source.split(/(?<=[.!?])\s+/).filter(Boolean).slice(0, 2);
}

function formatSigned(value: number | null) {
  if (value == null) return "";
  const rounded = Math.round(value);
  return rounded > 0 ? `+${rounded}` : String(rounded);
}

function upcomingInterview(documents: HrDocument[]) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const next = documents
    .filter((doc) => doc.document_date && ["entretien_individuel", "bilan_annuel", "autre"].includes(doc.document_type))
    .map((doc) => ({ doc, time: new Date(doc.document_date as string).getTime() }))
    .filter((item) => !Number.isNaN(item.time) && item.time >= today.getTime())
    .sort((a, b) => a.time - b.time)[0];
  if (!next?.doc.document_date) return null;
  return {
    date: next.doc.document_date,
    type: DOC_TYPE_LABEL[next.doc.document_type] ?? next.doc.title ?? "Entretien",
  };
}

function buildActions({
  work,
  missing,
  nextInterview,
  onAssignFormation,
  onMeasure,
  onPrepareInterview,
}: {
  work: SoftSkillGap[];
  missing: SoftSkillGap[];
  nextInterview: { date: string; type: string } | null;
  onAssignFormation: () => void;
  onMeasure: () => void;
  onPrepareInterview: () => void;
}) {
  const actions: Array<{ title: string; detail: string; tone: string; action: { label: string; onClick: () => void } }> = [];
  const biggest = work[0];
  if (biggest) {
    actions.push({
      title: `Assigner une formation en ${biggest.skill}`,
      detail: `Plus gros écart avec la fiche métier (${formatSigned(biggest.gap)})`,
      tone: "#FFF1E2",
      action: { label: "Choisir", onClick: onAssignFormation },
    });
  }
  if (missing.length > 0) {
    const names = missing.slice(0, 3).map((gap) => gap.skill).join(", ");
    actions.push({
      title: `Mesurer ${missing.length} compétence${missing.length > 1 ? "s" : ""} manquante${missing.length > 1 ? "s" : ""}`,
      detail: names,
      tone: "#EEEBFF",
      action: { label: "Envoyer", onClick: onMeasure },
    });
  }
  if (nextInterview) {
    const when = new Date(nextInterview.date).getTime();
    const inThirtyDays = Date.now() + 30 * 24 * 60 * 60 * 1000;
    if (!Number.isNaN(when) && when <= inThirtyDays) {
      actions.push({
        title: `Préparer l'entretien du ${formatActivityDate(nextInterview.date)}`,
        detail: nextInterview.type,
        tone: "#E3F6EC",
        action: { label: "Préparer", onClick: onPrepareInterview },
      });
    }
  }
  return actions;
}
