"use client";

import { useMemo, useState } from "react";
import {
  addDays,
  addWeeks,
  format,
  isSameDay,
  startOfWeek,
  subWeeks,
} from "date-fns";
import { fr } from "date-fns/locale";
import { ChevronLeft, ChevronRight, Link2 } from "lucide-react";
import { cn } from "@/lib/utils";

export type CalendarEvent = {
  id: string;
  title: string;
  start: Date;
  end: Date;
  location?: string;
  color?: string;
};

const HOURS = Array.from({ length: 11 }, (_, i) => i + 8);

type Props = {
  events: CalendarEvent[];
  onConnectGoogle?: () => void;
};

export function ExpertWeekCalendar({ events, onConnectGoogle }: Props) {
  const [weekStart, setWeekStart] = useState(() =>
    startOfWeek(new Date(), { weekStartsOn: 1 }),
  );

  const days = useMemo(
    () => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)),
    [weekStart],
  );

  const eventsForDay = (day: Date) =>
    events.filter((e) => isSameDay(e.start, day));

  const eventStyle = (event: CalendarEvent) => {
    const startH = event.start.getHours() + event.start.getMinutes() / 60;
    const endH = event.end.getHours() + event.end.getMinutes() / 60;
    const top = ((startH - 8) / 11) * 100;
    const height = Math.max(((endH - startH) / 11) * 100, 8);
    return { top: `${top}%`, height: `${height}%` };
  };

  return (
    <div className="flex h-full flex-col">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#050505]/8 pb-4">
        <div>
          <p className="text-sm font-semibold">Agenda</p>
          <p className="text-xs text-[#050505]/45">
            {format(weekStart, "d MMM", { locale: fr })} — {format(addDays(weekStart, 6), "d MMM yyyy", { locale: fr })}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setWeekStart((w) => subWeeks(w, 1))}
            className="rounded-lg border border-[#050505]/10 p-1.5 hover:bg-[#F7F7F5]"
            aria-label="Semaine précédente"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => setWeekStart(startOfWeek(new Date(), { weekStartsOn: 1 }))}
            className="rounded-lg border border-[#050505]/10 px-3 py-1.5 text-xs font-medium hover:bg-[#F7F7F5]"
          >
            Aujourd&apos;hui
          </button>
          <button
            type="button"
            onClick={() => setWeekStart((w) => addWeeks(w, 1))}
            className="rounded-lg border border-[#050505]/10 p-1.5 hover:bg-[#F7F7F5]"
            aria-label="Semaine suivante"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={onConnectGoogle}
            className="inline-flex items-center gap-1.5 rounded-lg border border-[#635BFF]/20 bg-[#635BFF]/8 px-3 py-1.5 text-xs font-medium text-[#635BFF]"
          >
            <Link2 className="h-3.5 w-3.5" />
            Google Agenda
          </button>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-[48px_repeat(7,1fr)] gap-px overflow-hidden rounded-xl border border-[#050505]/8 bg-[#050505]/8">
        <div className="bg-white" />
        {days.map((day) => (
          <div
            key={day.toISOString()}
            className={cn(
              "bg-white px-2 py-2 text-center",
              isSameDay(day, new Date()) && "bg-[#635BFF]/[0.06]",
            )}
          >
            <p className="text-[10px] font-medium uppercase text-[#050505]/40">
              {format(day, "EEE", { locale: fr })}
            </p>
            <p
              className={cn(
                "mt-0.5 text-sm font-semibold",
                isSameDay(day, new Date()) && "text-[#635BFF]",
              )}
            >
              {format(day, "d")}
            </p>
          </div>
        ))}

        {HOURS.map((hour) => (
          <div key={hour} className="contents">
            <div className="border-t border-[#050505]/6 bg-white px-1 py-2 text-right text-[10px] text-[#050505]/35">
              {hour}h
            </div>
            {days.map((day) => {
              const dayEvents = eventsForDay(day).filter(
                (e) => e.start.getHours() === hour || (e.start.getHours() < hour && e.end.getHours() > hour),
              );
              return (
                <div
                  key={`${day.toISOString()}-${hour}`}
                  className="relative min-h-[44px] border-t border-[#050505]/6 bg-white"
                >
                  {hour === 8
                    ? eventsForDay(day).map((event) => (
                        <div
                          key={event.id}
                          className="absolute left-0.5 right-0.5 z-10 overflow-hidden rounded-md border border-[#635BFF]/20 bg-[#635BFF]/12 px-1.5 py-1"
                          style={eventStyle(event)}
                          title={event.title}
                        >
                          <p className="truncate text-[10px] font-semibold text-[#635BFF]">{event.title}</p>
                          <p className="truncate text-[9px] text-[#050505]/50">
                            {format(event.start, "HH:mm")} — {event.location ?? "À distance"}
                          </p>
                        </div>
                      ))
                    : null}
                  {dayEvents.length > 0 && hour !== 8
                    ? dayEvents.map((event) => (
                        <div
                          key={event.id}
                          className="absolute inset-x-0.5 top-1 z-10 rounded-md bg-[#635BFF]/15 px-1 py-0.5 text-[9px] font-medium text-[#635BFF]"
                        >
                          {event.title}
                        </div>
                      ))
                    : null}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
