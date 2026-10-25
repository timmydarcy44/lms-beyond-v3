"use client";

import { useState } from "react";
import { toast } from "sonner";
import { EmptyState, GapBar } from "@/components/salarie/employee-fiche-blocks";
import { ficheGapBand, summarizeFicheGaps, type SoftSkillGap } from "@/lib/entreprise/metier-skill-gaps";

type FilterId = "all" | "work" | "close" | "reached";
type SkillStatus = "declared" | "proof" | "badge";

const FILTERS: Array<{ id: FilterId; label: string }> = [
  { id: "all", label: "Toutes" },
  { id: "work", label: "À travailler" },
  { id: "close", label: "Proches" },
  { id: "reached", label: "Atteintes" },
];

const BANDS: Array<{ id: Exclude<FilterId, "all">; title: string; hint: string; color: string }> = [
  { id: "work", title: "À travailler", hint: "Écart de 2 points ou plus", color: "#E7782C" },
  { id: "close", title: "Proches de la cible", hint: "Écart de 1 point", color: "#9A9DA6" },
  { id: "reached", title: "Cible atteinte", hint: "Au niveau ou au-dessus", color: "#1F9D57" },
];

export function EmployeeSkills({
  employeeId,
  firstName,
  metierTitle,
  shareConsent,
  gaps,
  softSkills,
  byoundSkills,
  onAssignFormation,
  onEdit,
}: {
  employeeId: string;
  firstName: string;
  metierTitle: string | null;
  shareConsent: boolean;
  gaps: SoftSkillGap[];
  softSkills: Array<{ skill: string; score: number }>;
  byoundSkills: Array<{ name: string; status: SkillStatus }>;
  onAssignFormation: () => void;
  onEdit: () => void;
}) {
  const [filter, setFilter] = useState<FilterId>("all");
  const [expanded, setExpanded] = useState(false);
  const [reminding, setReminding] = useState(false);
  const summary = summarizeFicheGaps(gaps);
  const counts = {
    all: summary.measured.length,
    work: summary.work.length,
    close: summary.close.length,
    reached: summary.reached.length,
  };
  const groups = BANDS.filter((band) => filter === "all" || filter === band.id).map((band) => ({
    ...band,
    rows: summary[band.id],
  }));
  const showScores = shareConsent && softSkills.length > 0;

  const remind = async () => {
    setReminding(true);
    try {
      const res = await fetch("/api/dashboard/entreprise/diagnostics/remind", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ employee_ids: [employeeId] }),
      });
      const json = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) throw new Error(json.error ?? "Relance impossible");
      toast.success("Relance de diagnostic envoyée");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Relance impossible");
    } finally {
      setReminding(false);
    }
  };

  return (
    <div className="mt-6 space-y-4">
      {!shareConsent ? (
        <EmptyState
          title={`Les écarts ne sont visibles qu'avec l'accord de ${firstName}`}
          detail="Les notes de soft skills restent privées tant que le partage n'est pas actif."
        />
      ) : gaps.length > 0 && summary.measured.length === 0 && softSkills.length === 0 ? (
        <EmptyState
          title="Aucun soft skill partagé"
          detail="Les écarts avec la fiche métier apparaîtront quand le classement sera partagé."
          action={{ label: "Relancer le diagnostic", onClick: () => void remind() }}
        />
      ) : gaps.length === 0 ? (
        <EmptyState
          title="Aucun écart à afficher"
          detail="Reliez une fiche métier pour comparer les compétences mesurées à la cible."
          action={{ label: "Modifier la fiche", onClick: onEdit }}
        />
      ) : (
        <section className="rounded-[26px] bg-white p-6">
          <div className="flex flex-col gap-4 min-[1100px]:flex-row min-[1100px]:items-start min-[1100px]:justify-between">
            <div>
              <h2 className="text-lg font-extrabold">
                Écarts avec la fiche métier{metierTitle ? ` · ${metierTitle}` : ""}
              </h2>
              <p className="mt-3 text-[40px] font-extrabold leading-none tracking-[-0.04em]">
                {summary.work.length}{" "}
                <span className="text-lg font-semibold text-[#6B6F7A]">
                  à travailler sur {summary.measured.length} mesurées
                </span>
              </p>
              <p className="mt-3 flex flex-wrap items-center gap-4 text-sm text-[#6B6F7A]">
                <span className="inline-flex items-center gap-2">
                  <span className="inline-block h-2.5 w-8 rounded-full bg-[#E7782C]" aria-hidden />
                  {firstName}
                </span>
                <span className="inline-flex items-center gap-2">
                  <span className="inline-block h-4 w-[3px] bg-[#07080B]" aria-hidden />
                  Cible du métier
                </span>
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <div className="inline-flex flex-wrap gap-1 rounded-full bg-[#F4F4F1] p-1" role="group" aria-label="Filtrer les écarts">
                {FILTERS.map((item) => {
                  const active = filter === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      aria-pressed={active}
                      onClick={() => setFilter(item.id)}
                      className={
                        active
                          ? "h-10 rounded-full bg-[#07080B] px-3 text-sm font-semibold text-white"
                          : "h-10 rounded-full px-3 text-sm font-semibold text-[#3A3D45]"
                      }
                    >
                      {item.label} {counts[item.id]}
                    </button>
                  );
                })}
              </div>
              {summary.work.length > 0 ? (
                <button
                  type="button"
                  onClick={onAssignFormation}
                  className="h-10 rounded-full bg-[#6E5BFF] px-4 text-sm font-semibold text-white"
                >
                  Assigner les {summary.work.length} formation{summary.work.length > 1 ? "s" : ""}
                </button>
              ) : null}
            </div>
          </div>

          <div className="mt-6">
            {groups.every((group) => group.rows.length === 0) ? (
              <p className="text-sm text-[#6B6F7A]">Aucune compétence dans ce filtre.</p>
            ) : (
              groups.map((group) =>
                group.rows.length === 0 ? null : (
                  <div key={group.id} className="border-t border-[#F1EFE9] py-3 first:border-t-0">
                    <div className="mb-2 flex items-baseline justify-between gap-3">
                      <p className="text-sm font-extrabold">{group.title}</p>
                      <p className="text-sm text-[#6B6F7A]">{group.hint}</p>
                    </div>
                    {group.rows.map((gap) => (
                      <GapRow key={gap.skill} gap={gap} color={group.color} onAssign={group.id === "work" ? onAssignFormation : undefined} />
                    ))}
                  </div>
                ),
              )
            )}
          </div>

          {filter === "all" && summary.missing.length > 0 ? (
            <div className="mt-4 flex flex-col gap-3 rounded-2xl border border-dashed border-[#D6D2C8] p-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-extrabold">Non mesurées</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {summary.missing.map((gap) => (
                    <span key={gap.skill} className="rounded-full bg-[#F4F4F1] px-3 py-1 text-sm text-[#3A3D45]">
                      {gap.skill}
                    </span>
                  ))}
                </div>
              </div>
              <button
                type="button"
                onClick={() => void remind()}
                disabled={reminding}
                className="h-10 shrink-0 rounded-full border border-dashed border-[#D6D2C8] px-4 text-sm font-semibold disabled:opacity-50"
              >
                {reminding ? "Envoi…" : "Ajouter au prochain diagnostic"}
              </button>
            </div>
          ) : null}
        </section>
      )}

      <div className="grid gap-4 min-[1100px]:grid-cols-2">
        {!showScores ? (
          <EmptyState
            title={shareConsent ? "Aucun classement de soft skills" : `Les résultats ne sont visibles qu'avec l'accord de ${firstName}`}
            detail={
              shareConsent
                ? "Le classement apparaîtra quand les soft skills seront partagés."
                : "Aucun score n'est affiché sans partage actif."
            }
            action={shareConsent ? { label: "Relancer le diagnostic", onClick: () => void remind() } : undefined}
          />
        ) : (
          <SoftSkillRanking skills={softSkills} expanded={expanded} onToggle={() => setExpanded((value) => !value)} />
        )}

        {byoundSkills.length === 0 ? (
          <EmptyState
            title="Aucune compétence déclarée"
            detail="Les compétences ajoutées par le salarié dans Byound Skills apparaîtront ici."
          />
        ) : (
          <section className="rounded-[26px] bg-white p-6">
            <h2 className="text-lg font-extrabold">Byound Skills</h2>
            <p className="mt-1 text-sm text-[#6B6F7A]">Déclarées par {firstName}</p>
            <ul className="mt-4 divide-y divide-[#F1EFE9]">
              {byoundSkills.map((skill) => (
                <li key={skill.name} className="flex items-center justify-between gap-3 py-3">
                  <span className="font-semibold">{skill.name}</span>
                  <StatusPill status={skill.status} />
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </div>
  );
}

function GapRow({ gap, color, onAssign }: { gap: SoftSkillGap; color: string; onAssign?: () => void }) {
  const band = ficheGapBand(gap);
  const score = Math.round(gap.actual ?? 0);
  const target = Math.round(gap.target);
  const delta = formatDelta(gap.gap);
  const pill =
    band === "work"
      ? "bg-[#FFF1E2] text-[#8A4B0F]"
      : band === "reached"
        ? "bg-[#E3F6EC] text-[#126B3B]"
        : "bg-[#F4F4F1] text-[#3A3D45]";
  return (
    <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-2 py-2 min-[1100px]:h-[54px] min-[1100px]:grid-cols-[190px_minmax(0,1fr)_64px_52px_190px] min-[1100px]:py-0">
      <p className="truncate font-semibold">
        {gap.skill}
        <span className="sr-only">{` : ${score} sur 15, cible ${target}, écart ${delta}`}</span>
      </p>
      {onAssign ? <RowMenu onAssign={onAssign} /> : null}
      <div className="col-span-2 min-[1100px]:col-span-1">
        <GapBar score={score} target={target} color={color} />
      </div>
      <p className="text-sm font-semibold tabular-nums">{score} / 15</p>
      <p className={`inline-flex h-7 w-fit items-center justify-center rounded-full px-2 text-sm font-semibold ${pill}`}>{delta}</p>
      {onAssign ? (
        <button
          type="button"
          onClick={onAssign}
          className="hidden h-9 items-center justify-center rounded-full bg-[#07080B] px-3 text-sm font-semibold text-white min-[1100px]:inline-flex"
        >
          Assigner une formation
        </button>
      ) : (
        <span className="hidden min-[1100px]:block" />
      )}
    </div>
  );
}

function RowMenu({ onAssign }: { onAssign: () => void }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative justify-self-end min-[1100px]:hidden">
      <button
        type="button"
        aria-label="Actions"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
        className="h-9 w-9 rounded-full text-lg leading-none"
      >
        ⋯
      </button>
      {open ? (
        <button
          type="button"
          onClick={() => {
            setOpen(false);
            onAssign();
          }}
          className="absolute right-0 z-10 mt-1 whitespace-nowrap rounded-xl border border-[#E3E0D8] bg-white px-3 py-2 text-sm font-semibold"
        >
          Assigner une formation
        </button>
      ) : null}
    </div>
  );
}

export function SoftSkillRanking({
  skills,
  expanded,
  onToggle,
}: {
  skills: Array<{ skill: string; score: number }>;
  expanded: boolean;
  onToggle: () => void;
}) {
  const ranked = [...skills].sort((a, b) => b.score - a.score);
  const top = ranked.slice(0, 5);
  const topNames = new Set(top.map((item) => item.skill));
  const bottom = ranked.slice(-5).filter((item) => !topNames.has(item.skill));
  return (
    <section className="rounded-[26px] bg-white p-6">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-extrabold">Soft skills · classement</h2>
        {ranked.length > 10 ? (
          <button type="button" onClick={onToggle} className="text-sm font-semibold">
            {expanded ? "Réduire" : `Voir les ${ranked.length} ›`}
          </button>
        ) : null}
      </div>
      <ol className="mt-4">
        {(expanded ? ranked : top).map((item) => (
          <RankRow key={item.skill} rank={ranked.findIndex((row) => row.skill === item.skill) + 1} skill={item.skill} score={item.score} />
        ))}
        {!expanded && bottom.length > 0 ? (
          <>
            <li className="my-2 border-t border-[#F1EFE9]" aria-hidden />
            {bottom.map((item) => (
              <RankRow key={item.skill} rank={ranked.findIndex((row) => row.skill === item.skill) + 1} skill={item.skill} score={item.score} />
            ))}
          </>
        ) : null}
      </ol>
    </section>
  );
}

function RankRow({ rank, skill, score }: { rank: number; skill: string; score: number }) {
  const rounded = Math.round(score);
  const color = rounded >= 12 ? "#1F9D57" : rounded <= 8 ? "#E7782C" : "#9A9DA6";
  return (
    <li className="flex items-center gap-3 py-2">
      <span className="w-6 text-sm font-semibold text-[#6B6F7A]">{rank}</span>
      <span className="min-w-0 flex-1 truncate font-semibold">{skill}</span>
      <span className="h-1.5 w-[90px] overflow-hidden rounded-full bg-[#ECE9E1]" aria-hidden>
        <span className="block h-full rounded-full" style={{ width: `${Math.max(0, Math.min(100, (rounded / 15) * 100))}%`, background: color }} />
      </span>
      <span className="w-10 text-right text-sm font-semibold tabular-nums">{rounded}/15</span>
    </li>
  );
}

function StatusPill({ status }: { status: SkillStatus }) {
  const style =
    status === "badge"
      ? "bg-[#36301A] text-[#F2CF6B]"
      : status === "proof"
        ? "bg-[#EEEBFF] text-[#4B3BD1]"
        : "bg-[#F4F4F1] text-[#3A3D45]";
  const label = status === "badge" ? "Badge obtenu" : status === "proof" ? "Preuve déposée" : "Déclarée";
  return <span className={`rounded-full px-3 py-1 text-xs font-semibold ${style}`}>{label}</span>;
}

function formatDelta(value: number | null) {
  if (value == null || !Number.isFinite(value)) return "—";
  const rounded = Math.round(value);
  if (rounded > 0) return `+${rounded}`;
  if (rounded < 0) return `−${Math.abs(rounded)}`;
  return "0";
}
