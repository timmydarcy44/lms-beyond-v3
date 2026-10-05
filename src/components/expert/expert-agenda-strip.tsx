"use client";

import { useMemo, useState } from "react";
import { addDays, addWeeks, format, isSameDay, startOfWeek, subWeeks } from "date-fns";
import { fr } from "date-fns/locale";
import { CalendarDays, ChevronLeft, ChevronRight, Link2, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";
import type { CalendarEvent } from "@/components/expert/expert-week-calendar";

type Props = {
  events: CalendarEvent[];
  onConnectGoogle?: () => void;
};

export function ExpertAgendaStrip({ events, onConnectGoogle }: Props) {
  const today = new Date();
  const [weekStart, setWeekStart] = useState(() => startOfWeek(today, { weekStartsOn: 1 }));
  const [selected, setSelected] = useState(today);

  const days = useMemo(() => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)), [weekStart]);
  const dayEvents = events
    .filter((e) => isSameDay(e.start, selected))
    .sort((a, b) => a.start.getTime() - b.start.getTime());

  const shiftWeek = (dir: -1 | 1) => {
    const next = dir === 1 ? addWeeks(weekStart, 1) : subWeeks(weekStart, 1);
    setWeekStart(next);
    setSelected(next);
  };

  const goToday = () => {
    setWeekStart(startOfWeek(today, { weekStartsOn: 1 }));
    setSelected(today);
  };

  const selectedLabel = isSameDay(selected, today) ? "aujourd'hui" : format(selected, "EEEE d MMMM", { locale: fr });

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-lg font-semibold text-white">Agenda</p>
          <p className="mt-0.5 text-xs text-white/45">
            {format(weekStart, "d", { locale: fr })} – {format(addDays(weekStart, 6), "d MMMM yyyy", { locale: fr })}
          </p>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => shiftWeek(-1)}
            aria-label="Semaine précédente"
            className="flex h-8 w-8 items-center justify-center rounded-full bg-white/[0.06] text-white/80 transition hover:bg-white/[0.12]"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={goToday}
            className="h-8 rounded-full bg-white/[0.06] px-3 text-xs font-medium text-white/85 transition hover:bg-white/[0.12]"
          >
            Aujourd&apos;hui
          </button>
          <button
            type="button"
            onClick={() => shiftWeek(1)}
            aria-label="Semaine suivante"
            className="flex h-8 w-8 items-center justify-center rounded-full bg-white/[0.06] text-white/80 transition hover:bg-white/[0.12]"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-7 gap-2">
        {days.map((day) => {
          const isSelected = isSameDay(day, selected);
          const hasEvents = events.some((e) => isSameDay(e.start, day));
          return (
            <button
              key={day.toISOString()}
              type="button"
              onClick={() => setSelected(day)}
              className={cn(
                "relative flex flex-col items-center rounded-2xl py-2.5 transition",
                isSelected
                  ? "bg-white text-[#070b1f] shadow-[0_10px_30px_rgba(255,255,255,0.15)]"
                  : "bg-white/[0.05] text-white hover:bg-white/[0.09]",
              )}
            >
              <span className={cn("text-[10px] font-medium uppercase", isSelected ? "text-[#070b1f]/55" : "text-white/45")}>
                {format(day, "EEE", { locale: fr }).replace(".", "")}
              </span>
              <span className="mt-0.5 text-lg font-semibold tabular-nums">{format(day, "d")}</span>
              {hasEvents ? (
                <span
                  className={cn(
                    "absolute bottom-1.5 h-1 w-1 rounded-full",
                    isSelected ? "bg-[#7C83FF]" : "bg-[#A9AEFF]",
                  )}
                />
              ) : null}
            </button>
          );
        })}
      </div>

      <div className="mt-4 flex-1 rounded-2xl border border-white/[0.06] bg-white/[0.03] p-4">
        {dayEvents.length === 0 ? (
          <div className="flex h-full min-h-[180px] flex-col items-center justify-center text-center">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/[0.06]">
              <CalendarDays className="h-[18px] w-[18px] text-white/70" />
            </span>
            <p className="mt-3 text-sm font-semibold text-white">Aucune intervention {selectedLabel}</p>
            <p className="mt-1 max-w-xs text-xs leading-relaxed text-white/45">
              Synchronisez votre agenda pour que Byound vous propose des missions sur vos créneaux libres.
            </p>
            {onConnectGoogle ? (
              <button
                type="button"
                onClick={onConnectGoogle}
                className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-white px-4 py-2 text-xs font-semibold text-[#070b1f] transition hover:bg-white/90"
              >
                <Link2 className="h-3.5 w-3.5" />
                Connecter Google Agenda
              </button>
            ) : null}
          </div>
        ) : (
          <ul className="space-y-2">
            {dayEvents.map((event) => (
              <li key={event.id} className="flex items-center gap-4 rounded-xl bg-white/[0.04] px-4 py-3">
                <div className="w-14 shrink-0 text-sm font-semibold tabular-nums text-white">
                  {format(event.start, "HH:mm")}
                </div>
                <div className="h-8 w-px bg-[#7C83FF]/50" />
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-white">{event.title}</p>
                  <p className="mt-0.5 flex items-center gap-1 text-xs text-white/45">
                    <MapPin className="h-3 w-3" />
                    {event.location ?? "À distance"} · jusqu&apos;à {format(event.end, "HH:mm")}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
