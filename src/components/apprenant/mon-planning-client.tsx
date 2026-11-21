"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Copy, X } from "lucide-react";

import {
  WEEK_TYPE_COLORS,
  WEEK_TYPE_LABELS,
  addDays,
  formatFrDayLong,
  formatFrDayShort,
  formatFrMonth,
  formatTimeFr,
  parseIsoDate,
  sessionBadge,
  startOfIsoWeek,
  toIsoDate,
  type AlternanceWeekType,
} from "@/lib/apprenant/alternance-planning";
import type { LearnerPlanningOverview, PlanningSession } from "@/lib/apprenant/planning-overview";
import { cn } from "@/lib/utils";

const CARD = "rounded-[24px] border border-[#1C2443] bg-[#0F1428]";
const MUTED = "text-[#9AA3BD]";
const TERTIARY = "text-[#6C7593]";

function weekTypeAt(
  weeks: LearnerPlanningOverview["weeks"],
  mondayIso: string,
): AlternanceWeekType | null {
  return weeks.find((w) => w.week_starts_on === mondayIso)?.week_type ?? null;
}

function nextChange(
  weeks: LearnerPlanningOverview["weeks"],
  fromMonday: string,
  current: AlternanceWeekType | null,
) {
  const sorted = [...weeks].sort((a, b) => a.week_starts_on.localeCompare(b.week_starts_on));
  for (const w of sorted) {
    if (w.week_starts_on <= fromMonday) continue;
    if (current && w.week_type === current) continue;
    return w;
  }
  return null;
}

function sessionsForWeek(sessions: PlanningSession[], monday: Date) {
  const from = monday.getTime();
  const to = addDays(monday, 5).getTime() + 86_400_000;
  return sessions.filter((s) => {
    const t = new Date(s.starts_at).getTime();
    return t >= from && t < to;
  });
}

function groupByDay(sessions: PlanningSession[]) {
  const map = new Map<string, PlanningSession[]>();
  for (const s of sessions) {
    const key = toIsoDate(new Date(s.starts_at));
    const list = map.get(key) ?? [];
    list.push(s);
    map.set(key, list);
  }
  return map;
}

export function MonPlanningClient() {
  const [data, setData] = useState<LearnerPlanningOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMonday, setViewMonday] = useState<Date | null>(null);
  const [icalOpen, setIcalOpen] = useState(false);
  const [icalUrl, setIcalUrl] = useState<string | null>(null);
  const [icalBusy, setIcalBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/dashboard/apprenant/planning/overview", { credentials: "include" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Chargement impossible");
      setData(json as LearnerPlanningOverview);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur");
      setData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const todayMonday = useMemo(() => startOfIsoWeek(new Date()), []);
  const todayMondayIso = toIsoDate(todayMonday);

  // Default view: current school week, else next school week
  useEffect(() => {
    if (!data || viewMonday) return;
    const currentType = weekTypeAt(data.weeks, todayMondayIso);
    if (currentType === "school") {
      setViewMonday(todayMonday);
      return;
    }
    const nextSchool = data.weeks.find(
      (w) => w.week_starts_on >= todayMondayIso && w.week_type === "school",
    );
    if (nextSchool) {
      setViewMonday(parseIsoDate(nextSchool.week_starts_on));
      return;
    }
    setViewMonday(todayMonday);
  }, [data, todayMonday, todayMondayIso, viewMonday]);

  const activeMonday = viewMonday ?? todayMonday;
  const activeMondayIso = toIsoDate(activeMonday);
  const activeType = data ? weekTypeAt(data.weeks, activeMondayIso) : null;
  const currentType = data ? weekTypeAt(data.weeks, todayMondayIso) : null;

  const subtitle = useMemo(() => {
    if (!data) return null;
    const parts = [
      data.titleLabel,
      data.specialtyLabel,
      data.yearLabel ? `année ${data.yearLabel}` : null,
      data.rhythm,
    ].filter(Boolean);
    return parts.length ? parts.join(" · ") : null;
  }, [data]);

  const banner = useMemo(() => {
    if (!data) return null;
    const starts = data.formationStartsOn;
    const ends = data.formationEndsOn;
    const today = toIsoDate(new Date());
    if (starts && today < starts) {
      return {
        kind: "before" as const,
        gradient: "radial-gradient(120% 160% at 0% 0%, #2A2270 0%, #10233A 50%, #0F1428 100%)",
        leftTitle: `Ton année commence le ${formatFrDayLong(parseIsoDate(starts))}`,
        leftSub: null as string | null,
        right: null as null | { title: string; line1: string; line2: string | null },
      };
    }
    if (ends && today > ends) {
      return {
        kind: "after" as const,
        gradient: "radial-gradient(120% 160% at 0% 0%, #2A3150 0%, #10233A 50%, #0F1428 100%)",
        leftTitle: "Ton année est terminée",
        leftSub: null,
        right: null,
      };
    }

    const fri = addDays(todayMonday, 4);
    const rangeLabel = `${todayMonday.getDate()} au ${fri.getDate()} ${formatFrMonth(fri)}.`;
    const change = nextChange(data.weeks, todayMondayIso, currentType);
    const weekSessions = sessionsForWeek(data.sessions, todayMonday);
    const firstSession = weekSessions[0] ?? null;

    if (currentType === "company") {
      const companyLine = [data.companyName, data.companyCity].filter(Boolean).join(", ");
      const tutorBit = data.tutorName ? `tutrice : ${data.tutorName}` : null;
      const leftSub = [companyLine, tutorBit].filter(Boolean).join(" · ") || null;
      let right = null as null | { title: string; line1: string; line2: string | null };
      if (change?.week_type === "school") {
        const schoolSessions = sessionsForWeek(data.sessions, parseIsoDate(change.week_starts_on));
        const first = schoolSessions[0];
        const days = Math.max(
          0,
          Math.round(
            (parseIsoDate(change.week_starts_on).getTime() - todayMonday.getTime()) / 86_400_000,
          ),
        );
        right = {
          title: "Retour à l'école",
          line1: first
            ? `${formatFrDayLong(new Date(first.starts_at))} · ${formatTimeFr(first.starts_at)}`
            : formatFrDayLong(parseIsoDate(change.week_starts_on)),
          line2: [
            first?.location_text || data.campusLabel || first?.room_name || null,
            days > 0 ? `dans ${days} jours` : null,
          ]
            .filter(Boolean)
            .join(" · ") || null,
        };
      }
      return {
        kind: "company" as const,
        gradient: "radial-gradient(120% 160% at 0% 0%, #0F4A44 0%, #10233A 50%, #0F1428 100%)",
        leftTitle: "Tu es en entreprise",
        leftEyebrow: `Cette semaine · ${rangeLabel}`,
        leftSub,
        right,
      };
    }

    if (currentType === "school") {
      const firstDay = firstSession ? formatFrDayLong(new Date(firstSession.starts_at)) : null;
      const firstHour = firstSession ? formatTimeFr(firstSession.starts_at) : null;
      const place = firstSession?.location_text || data.campusLabel || firstSession?.room_name || null;
      const leftSub =
        place && firstDay && firstHour
          ? `${place} · premier cours ${firstDay} à ${firstHour}`
          : place || (firstDay && firstHour ? `premier cours ${firstDay} à ${firstHour}` : null);
      let right = null as null | { title: string; line1: string; line2: string | null };
      if (change?.week_type === "company") {
        right = {
          title: "Retour en entreprise",
          line1: formatFrDayLong(parseIsoDate(change.week_starts_on)),
          line2: null,
        };
      }
      return {
        kind: "school" as const,
        gradient: "radial-gradient(120% 160% at 0% 0%, #2A2270 0%, #10233A 50%, #0F1428 100%)",
        leftTitle: "Tu es à l'école",
        leftEyebrow: `Cette semaine · ${rangeLabel}`,
        leftSub,
        right,
      };
    }

    if (currentType === "holiday") {
      const resume = change
        ? `Reprise ${change.week_type === "company" ? "en entreprise" : "à l'école"} le ${formatFrDayLong(parseIsoDate(change.week_starts_on))}`
        : null;
      return {
        kind: "holiday" as const,
        gradient: "radial-gradient(120% 160% at 0% 0%, #2A3150 0%, #10233A 50%, #0F1428 100%)",
        leftTitle: "Tu es en vacances",
        leftEyebrow: `Cette semaine · ${rangeLabel}`,
        leftSub: resume,
        right: null,
      };
    }

    if (currentType === "exam") {
      const exam = weekSessions.find((s) => s.event_type === "exam" || s.event_type === "evaluation");
      return {
        kind: "exam" as const,
        gradient: "radial-gradient(120% 160% at 0% 0%, #4A3A10 0%, #10233A 50%, #0F1428 100%)",
        leftTitle: "Semaine d'examens",
        leftEyebrow: `Cette semaine · ${rangeLabel}`,
        leftSub: exam
          ? `${exam.title || exam.module_name || "Épreuve"}${exam.starts_at ? ` · ${formatTimeFr(exam.starts_at)}` : ""}`
          : null,
        right: null,
      };
    }

    return {
      kind: "unknown" as const,
      gradient: "radial-gradient(120% 160% at 0% 0%, #10233A 0%, #0F1428 100%)",
      leftTitle: "Ton planning",
      leftEyebrow: `Cette semaine · ${rangeLabel}`,
      leftSub: "Le calendrier d'alternance n'est pas encore renseigné.",
      right: null,
    };
  }, [data, currentType, todayMonday, todayMondayIso]);

  const openIcal = async () => {
    setIcalOpen(true);
    setIcalBusy(true);
    try {
      const res = await fetch("/api/dashboard/apprenant/planning/ical", { credentials: "include" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Lien indisponible");
      setIcalUrl(json.url);
    } catch {
      setIcalUrl(null);
    } finally {
      setIcalBusy(false);
    }
  };

  const regenerateIcal = async () => {
    setIcalBusy(true);
    try {
      const res = await fetch("/api/dashboard/apprenant/planning/ical", {
        method: "POST",
        credentials: "include",
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Régénération impossible");
      setIcalUrl(json.url);
    } finally {
      setIcalBusy(false);
    }
  };

  const weekSessions = data ? sessionsForWeek(data.sessions, activeMonday) : [];
  const byDay = groupByDay(weekSessions);
  const upcoming = data?.upcoming.slice(0, 3) ?? [];
  const todayIso = toIsoDate(new Date());

  const highlightDayIso = useMemo(() => {
    if (activeType !== "school") return null;
    if (byDay.has(todayIso) && activeMondayIso === todayMondayIso) return todayIso;
    for (let i = 0; i < 5; i++) {
      const d = toIsoDate(addDays(activeMonday, i));
      if (byDay.has(d) && d >= todayIso) return d;
    }
    const first = [...byDay.keys()].sort()[0];
    return first ?? null;
  }, [activeType, byDay, todayIso, activeMondayIso, todayMondayIso, activeMonday]);

  return (
    <div className="space-y-6 text-[#F2F4FA]" style={{ fontFamily: "Manrope, system-ui, sans-serif" }}>
      <header className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="space-y-2">
          <h1 className="text-[38px] font-extrabold leading-none tracking-[-0.03em]">Mon planning</h1>
          {subtitle ? <p className={cn("max-w-2xl text-[14px]", MUTED)}>{subtitle}</p> : null}
        </div>
        <button
          type="button"
          onClick={() => void openIcal()}
          className="inline-flex h-11 items-center justify-center rounded-full border border-[#222B4D] bg-transparent px-5 text-[13px] font-semibold text-[#F2F4FA] transition hover:bg-white/[0.04]"
        >
          ⤓ Ajouter à mon agenda
        </button>
      </header>

      {loading ? <p className={MUTED}>Chargement…</p> : null}
      {error ? <p className="text-rose-300">{error}</p> : null}

      {banner ? (
        <section
          className="grid overflow-hidden rounded-[28px] md:grid-cols-2"
          style={{ background: banner.gradient }}
        >
          <div className="space-y-2 border-b border-white/10 p-6 md:border-b-0 md:border-r md:p-8">
            {"leftEyebrow" in banner && banner.leftEyebrow ? (
              <p className={cn("text-[13px]", MUTED)}>{banner.leftEyebrow}</p>
            ) : null}
            <h2 className="text-[30px] font-extrabold leading-tight tracking-[-0.02em]">{banner.leftTitle}</h2>
            {banner.leftSub ? <p className={cn("text-[14px]", MUTED)}>{banner.leftSub}</p> : null}
          </div>
          {banner.right ? (
            <div className="space-y-2 p-6 md:p-8">
              <p className={cn("text-[13px]", MUTED)}>{banner.right.title}</p>
              <p className="text-[22px] font-bold tracking-[-0.02em]">{banner.right.line1}</p>
              {banner.right.line2 ? <p className={cn("text-[14px]", MUTED)}>{banner.right.line2}</p> : null}
            </div>
          ) : (
            <div className="hidden md:block" />
          )}
        </section>
      ) : null}

      {data && data.weeks.length > 0 ? (
        <section className={cn(CARD, "p-5 md:p-6")}>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-[16px] font-extrabold">Mon année en un coup d'œil</h2>
            <div className="flex flex-wrap gap-3">
              {(Object.keys(WEEK_TYPE_LABELS) as AlternanceWeekType[]).map((t) => (
                <span key={t} className={cn("inline-flex items-center gap-1.5 text-[11.5px]", TERTIARY)}>
                  <span className="h-2.5 w-2.5 rounded-[2px]" style={{ background: WEEK_TYPE_COLORS[t] }} />
                  {WEEK_TYPE_LABELS[t]}
                </span>
              ))}
            </div>
          </div>
          <div className="overflow-x-auto">
            <div className="flex min-w-[640px] items-end gap-1">
              {data.weeks.map((w) => {
                const isCurrent = w.week_starts_on === todayMondayIso;
                return (
                  <button
                    key={w.week_starts_on}
                    type="button"
                    title={`Semaine du ${w.week_starts_on} · ${WEEK_TYPE_LABELS[w.week_type]}`}
                    onClick={() => setViewMonday(parseIsoDate(w.week_starts_on))}
                    className={cn(
                      "flex-1 rounded-[5px] transition",
                      isCurrent ? "h-[30px] ring-2 ring-white" : "h-[22px]",
                    )}
                    style={{ background: WEEK_TYPE_COLORS[w.week_type] }}
                  />
                );
              })}
            </div>
            <div className="mt-2 flex min-w-[640px]">
              {(() => {
                const labels: Array<{ key: string; label: string; span: number }> = [];
                for (const w of data.weeks) {
                  const label = formatFrMonth(parseIsoDate(w.week_starts_on));
                  const last = labels[labels.length - 1];
                  if (last && last.label === label) last.span += 1;
                  else labels.push({ key: w.week_starts_on, label, span: 1 });
                }
                return labels.map((l) => (
                  <div
                    key={l.key}
                    className={cn("text-center text-[11.5px]", TERTIARY)}
                    style={{ flex: l.span }}
                  >
                    {l.label}.
                  </div>
                ));
              })()}
            </div>
          </div>
        </section>
      ) : null}

      <div className="grid gap-5 min-[900px]:grid-cols-[minmax(0,1fr)_360px]">
        <section className={cn(CARD, "p-5 md:p-6")}>
          <div className="flex items-center justify-between gap-3">
            <button
              type="button"
              aria-label="Semaine précédente"
              onClick={() => setViewMonday(addDays(activeMonday, -7))}
              className="inline-flex h-[38px] w-[38px] items-center justify-center rounded-full border border-[#222B4D] text-[#F2F4FA]"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <div className="text-center">
              <p className="text-[16px] font-extrabold">
                Semaine du {activeMonday.getDate()} au {addDays(activeMonday, 4).getDate()}{" "}
                {formatFrMonth(addDays(activeMonday, 4))}.
              </p>
              <p className="mt-1 text-[13px] font-semibold text-[#C9C2FF]">
                {activeType ? (
                  <>
                    Semaine {activeType === "school" ? "à l'école" : WEEK_TYPE_LABELS[activeType].toLowerCase()}
                    {activeMondayIso !== todayMondayIso ? (
                      <>
                        {" · "}
                        <button
                          type="button"
                          className="underline-offset-2 hover:underline"
                          onClick={() => setViewMonday(todayMonday)}
                        >
                          revenir à aujourd'hui
                        </button>
                      </>
                    ) : null}
                  </>
                ) : (
                  "Semaine"
                )}
              </p>
            </div>
            <button
              type="button"
              aria-label="Semaine suivante"
              onClick={() => setViewMonday(addDays(activeMonday, 7))}
              className="inline-flex h-[38px] w-[38px] items-center justify-center rounded-full border border-[#222B4D] text-[#F2F4FA]"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          <div className="mt-5 space-y-2">
            {activeType === "company" ? (
              <div className="flex gap-3 rounded-[18px] border border-[#1C2443] px-4 py-4">
                <div className="w-1 shrink-0 rounded-full bg-[#5EDCC3]" />
                <div>
                  <p className="text-[15.5px] font-extrabold">En entreprise du lundi au vendredi</p>
                  {(data?.companyName || data?.tutorName) && (
                    <p className={cn("mt-1 text-[13px]", MUTED)}>
                      {[data?.companyName, data?.tutorName ? `tuteur : ${data.tutorName}` : null]
                        .filter(Boolean)
                        .join(" · ")}
                    </p>
                  )}
                  {weekSessions.length > 0 ? (
                    <div className="mt-3 space-y-2">
                      {weekSessions.map((s) => (
                        <p key={s.id} className={cn("text-[13px]", MUTED)}>
                          {formatFrDayShort(new Date(s.starts_at))} · {s.title || s.module_name || "Cours à distance"} ·{" "}
                          {formatTimeFr(s.starts_at)}
                        </p>
                      ))}
                    </div>
                  ) : null}
                </div>
              </div>
            ) : null}

            {activeType === "holiday" ? (
              <div className="flex gap-3 rounded-[18px] border border-[#1C2443] px-4 py-4">
                <div className="w-1 shrink-0 rounded-full bg-[#2A3150]" />
                <div>
                  <p className="text-[15.5px] font-extrabold">Vacances</p>
                  {(() => {
                    const change = nextChange(data?.weeks ?? [], activeMondayIso, "holiday");
                    return change ? (
                      <p className={cn("mt-1 text-[13px]", MUTED)}>
                        Reprise le {formatFrDayLong(parseIsoDate(change.week_starts_on))}
                      </p>
                    ) : null;
                  })()}
                </div>
              </div>
            ) : null}

            {activeType === "school" || activeType === "exam" || (!activeType && weekSessions.length > 0)
              ? Array.from({ length: 5 }, (_, i) => {
                  const day = addDays(activeMonday, i);
                  const dayIso = toIsoDate(day);
                  const daySessions = byDay.get(dayIso) ?? [];
                  const isHighlight = dayIso === highlightDayIso;
                  if (daySessions.length === 0) {
                    return (
                      <div
                        key={dayIso}
                        className="flex gap-3 rounded-[18px] border border-transparent px-4 py-3 opacity-70"
                      >
                        <p className="w-[72px] shrink-0 text-[24px] font-extrabold leading-none">
                          {formatFrDayShort(day)}
                        </p>
                        <p className={cn("text-[13px]", TERTIARY)}>
                          Pas de cours · travail en autonomie sur le LMS
                        </p>
                      </div>
                    );
                  }
                  const primary = daySessions[0]!;
                  const badge = sessionBadge(primary.event_type);
                  const title = primary.title || primary.module_name || "Cours";
                  const meta = [
                    `${formatTimeFr(primary.starts_at)} – ${formatTimeFr(primary.ends_at)}`,
                    primary.room_name,
                    primary.instructor_name,
                  ]
                    .filter(Boolean)
                    .join(" · ");
                  return (
                    <div
                      key={dayIso}
                      className={cn(
                        "flex gap-3 rounded-[18px] border px-4 py-3",
                        isHighlight ? "border-[#2E3570] bg-[#141B36]" : "border-transparent",
                      )}
                    >
                      <p className="w-[72px] shrink-0 text-[24px] font-extrabold leading-none">
                        {formatFrDayShort(day)}
                      </p>
                      <div className="w-1 shrink-0 rounded-full" style={{ background: badge.bar }} />
                      <div className="min-w-0 flex-1">
                        <p className="text-[15.5px] font-extrabold">{title}</p>
                        <p className={cn("mt-1 text-[13px]", MUTED)}>{meta}</p>
                        {daySessions.slice(1).map((s) => (
                          <p key={s.id} className={cn("mt-1 text-[13px]", MUTED)}>
                            {formatTimeFr(s.starts_at)} – {formatTimeFr(s.ends_at)}
                            {s.title || s.module_name ? ` · ${s.title || s.module_name}` : ""}
                          </p>
                        ))}
                        {primary.learner_instruction ? (
                          <p className={cn("mt-1 text-[12.5px] italic", TERTIARY)}>
                            {primary.learner_instruction}
                          </p>
                        ) : null}
                      </div>
                      <span
                        className="h-fit shrink-0 rounded-full px-3 py-1 text-[11px] font-semibold"
                        style={{ background: `${badge.color}22`, color: badge.color }}
                      >
                        {badge.label}
                      </span>
                    </div>
                  );
                })
              : null}

            {!activeType && weekSessions.length === 0 ? (
              <p className={cn("px-2 py-6 text-sm", MUTED)}>
                Aucune séance ni type de semaine pour cette période.
              </p>
            ) : null}
          </div>
        </section>

        <aside className="space-y-5">
          <section className={cn(CARD, "p-5")}>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-[16px] font-extrabold">À venir</h2>
              {(data?.upcoming.length ?? 0) > 3 ? (
                <span className={cn("text-[12px]", MUTED)}>Tout voir</span>
              ) : null}
            </div>
            <div className="space-y-3">
              {upcoming.map((u) => {
                const d = parseIsoDate(u.date);
                const dot =
                  u.kind === "evaluation" || u.kind === "exam"
                    ? "#F2CF6B"
                    : u.kind === "holiday"
                      ? "#6C7593"
                      : "#5EDCC3";
                return (
                  <div key={`${u.date}-${u.title}`} className="flex gap-3">
                    <div className="flex h-[50px] w-[46px] flex-col items-center justify-center rounded-[12px] border border-[#222B4D] bg-[#141B36]">
                      <span className="text-[11px] font-semibold uppercase text-[#6C7593]">
                        {formatFrMonth(d)}
                      </span>
                      <span className="text-[18px] font-extrabold leading-none">{d.getDate()}</span>
                    </div>
                    <div className="min-w-0 pt-1">
                      <p className="flex items-center gap-2 text-[14px] font-bold">
                        <span className="h-1.5 w-1.5 rounded-full" style={{ background: dot }} />
                        {u.title}
                      </p>
                      {u.subtitle ? <p className={cn("mt-0.5 text-[12px]", MUTED)}>{u.subtitle}</p> : null}
                    </div>
                  </div>
                );
              })}
              {!loading && upcoming.length === 0 ? (
                <p className={cn("text-sm", MUTED)}>Aucune échéance à venir.</p>
              ) : null}
            </div>
          </section>

          <section className={cn(CARD, "p-5")}>
            <h2 className="text-[16px] font-extrabold">Absent ou en retard ?</h2>
            <p className={cn("mt-2 text-[13px] leading-relaxed", MUTED)}>
              Préviens l'école et ton entreprise en une fois. Tu pourras ajouter ton justificatif ensuite.
            </p>
            <Link
              href={`/dashboard/apprenant/planning/absences?signaler=1&date=${todayIso}`}
              className="mt-4 inline-flex h-11 w-full items-center justify-center rounded-full bg-white text-[13px] font-extrabold text-[#070B18]"
            >
              Signaler une absence
            </Link>
          </section>
        </aside>
      </div>

      {icalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className={cn(CARD, "w-full max-w-md p-6")}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-[18px] font-extrabold">Ajouter à mon agenda</h2>
                <p className={cn("mt-2 text-[13px] leading-relaxed", MUTED)}>
                  Copie le lien secret ci-dessous, puis ajoute un agenda par URL dans Google Agenda, Apple
                  Calendrier ou Outlook. Le lien contient tes cours, tes semaines en entreprise et tes
                  échéances.
                </p>
              </div>
              <button type="button" onClick={() => setIcalOpen(false)} className={MUTED}>
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="mt-4 rounded-[14px] border border-[#222B4D] bg-[#141B36] px-3 py-3 text-[12px] break-all">
              {icalBusy ? "…" : icalUrl || "Lien indisponible"}
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                disabled={!icalUrl}
                onClick={() => icalUrl && void navigator.clipboard.writeText(icalUrl)}
                className="inline-flex h-10 items-center gap-2 rounded-full bg-white px-4 text-[13px] font-bold text-[#070B18] disabled:opacity-40"
              >
                <Copy className="h-3.5 w-3.5" />
                Copier le lien
              </button>
              <button
                type="button"
                disabled={icalBusy}
                onClick={() => void regenerateIcal()}
                className="inline-flex h-10 items-center rounded-full border border-[#222B4D] px-4 text-[13px] font-semibold"
              >
                Régénérer le lien
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
