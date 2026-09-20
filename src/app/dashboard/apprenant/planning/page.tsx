"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

import {
  APPRENANT_PAGE_KICKER,
  APPRENANT_PAGE_LEAD,
  APPRENANT_PAGE_SHELL,
  APPRENANT_PAGE_TITLE,
} from "@/lib/apprenant/connect-nav";
import { formatWeekRangeLabel } from "@/lib/ecole/planning-utils";
import { cn } from "@/lib/utils";

type LearnerSlot = {
  id: string;
  starts_at: string;
  ends_at: string;
  duration_hours?: number;
  module?: { name?: string; code?: string } | null;
  instructor?: { first_name?: string; last_name?: string; full_name?: string } | null;
  room?: { name?: string } | null;
  class?: { name?: string } | null;
  // fallback sans jointures
  module_id?: string;
  instructor_id?: string;
  room_id?: string;
};

function startOfWeek(d: Date) {
  const x = new Date(d);
  const day = (x.getDay() + 6) % 7;
  x.setDate(x.getDate() - day);
  x.setHours(0, 0, 0, 0);
  return x;
}

function sameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function instructorLabel(s: LearnerSlot) {
  const p = s.instructor;
  if (!p) return "Formateur à confirmer";
  return (
    String(p.full_name ?? "").trim() ||
    `${String(p.first_name ?? "").trim()} ${String(p.last_name ?? "").trim()}`.trim() ||
    "Formateur"
  );
}

export default function ApprenantPlanningPage() {
  const [cursor, setCursor] = useState(() => new Date());
  const [slots, setSlots] = useState<LearnerSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [warning, setWarning] = useState<string | null>(null);

  const weekStart = useMemo(() => startOfWeek(cursor), [cursor]);
  const weekDays = useMemo(
    () =>
      Array.from({ length: 5 }, (_, i) => {
        const d = new Date(weekStart);
        d.setDate(weekStart.getDate() + i);
        return d;
      }),
    [weekStart],
  );

  const load = useCallback(async () => {
    setLoading(true);
    const from = new Date(weekStart);
    const to = new Date(weekStart);
    to.setDate(to.getDate() + 7);
    try {
      const res = await fetch(
        `/api/dashboard/apprenant/planning?from=${encodeURIComponent(from.toISOString())}&to=${encodeURIComponent(to.toISOString())}`,
        { credentials: "include" },
      );
      const json = await res.json();
      setSlots(json.slots ?? []);
      setWarning(json.warning ?? null);
    } catch {
      setSlots([]);
    } finally {
      setLoading(false);
    }
  }, [weekStart]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className={APPRENANT_PAGE_SHELL}>
      <section className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="space-y-2">
          <p className={APPRENANT_PAGE_KICKER}>Planning</p>
          <h1 className={APPRENANT_PAGE_TITLE}>Mon planning</h1>
          <p className={APPRENANT_PAGE_LEAD}>
            Année scolaire synchronisée avec votre établissement — lecture seule.
          </p>
          <p className="text-[12px] font-medium text-white/45">2027 — 2028</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setCursor((d) => new Date(d.getTime() - 7 * 86400000))}
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-white/[0.06] bg-white/[0.03] text-white/70"
            aria-label="Semaine précédente"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <div className="min-w-[200px] text-center">
            <p className="text-[13px] font-semibold text-white">{formatWeekRangeLabel(cursor)}</p>
            <button
              type="button"
              onClick={() => setCursor(new Date())}
              className="mt-1 text-[11px] font-semibold text-[#8BB4FF]"
            >
              Aujourd’hui
            </button>
          </div>
          <button
            type="button"
            onClick={() => setCursor((d) => new Date(d.getTime() + 7 * 86400000))}
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-white/[0.06] bg-white/[0.03] text-white/70"
            aria-label="Semaine suivante"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </section>

      {warning ? (
        <p className="rounded-2xl border border-white/[0.06] bg-white/[0.03] px-4 py-3 text-[12px] text-white/45">
          Affichage simplifié (détails formateur/salle limités).
        </p>
      ) : null}

      <section className="grid gap-3 md:grid-cols-5">
        {weekDays.map((day) => {
          const daySlots = slots
            .filter((s) => sameDay(new Date(s.starts_at), day))
            .sort((a, b) => new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime());
          const isToday = sameDay(day, new Date());
          return (
            <div
              key={day.toISOString()}
              className={cn(
                "min-h-[220px] rounded-2xl border border-white/[0.04] bg-[#17171F]/75 p-3 shadow-[0_18px_48px_-28px_rgba(0,0,0,0.55)]",
                isToday && "ring-1 ring-[#3D7BFF]/35",
              )}
            >
              <p className={cn("text-[11px] font-semibold uppercase tracking-[0.08em]", isToday ? "text-[#8BB4FF]" : "text-white/40")}>
                {day.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "short" })}
              </p>
              <div className="mt-3 space-y-2">
                {loading ? (
                  <p className="text-[11px] text-white/25">…</p>
                ) : daySlots.length === 0 ? (
                  <p className="text-[11px] text-white/25">Aucun cours</p>
                ) : (
                  daySlots.map((s) => (
                    <div
                      key={s.id}
                      className="rounded-xl border border-[#3D7BFF]/25 bg-[#3D7BFF]/12 px-2.5 py-2"
                    >
                      <p className="text-[11px] font-semibold text-[#8BB4FF]">
                        {new Date(s.starts_at).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                        {" — "}
                        {new Date(s.ends_at).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                      </p>
                      <p className="mt-1 text-[13px] font-bold text-white">
                        {s.module?.name ?? "Cours"}
                      </p>
                      <p className="mt-1 text-[11px] text-white/55">{instructorLabel(s)}</p>
                      {s.room?.name ? (
                        <p className="text-[11px] text-white/40">{s.room.name}</p>
                      ) : null}
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </section>
    </div>
  );
}
