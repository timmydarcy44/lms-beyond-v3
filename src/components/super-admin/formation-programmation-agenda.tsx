"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { CalendarDays, Download, MapPin, UserRound } from "lucide-react";
import { toast } from "sonner";
import type { FormationAgendaEvent } from "@/lib/formation-dossier/agenda";

function dayPartLabel(value: string | null): string | null {
  if (!value) return null;
  if (value === "matin") return "Matin";
  if (value === "apres_midi" || value === "après-midi") return "Après-midi";
  return value;
}

export function FormationProgrammationAgenda() {
  const [events, setEvents] = useState<FormationAgendaEvent[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/super-admin/crm/programmation/agenda");
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || "Agenda indisponible");
      setEvents(json.events ?? []);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Agenda indisponible");
      setEvents([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const byDate = useMemo(() => {
    const map = new Map<string, FormationAgendaEvent[]>();
    for (const event of events) {
      const list = map.get(event.slot_date) ?? [];
      list.push(event);
      map.set(event.slot_date, list);
    }
    return [...map.entries()].sort(([a], [b]) => a.localeCompare(b));
  }, [events]);

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-[#F3F4FA]">Agenda des sessions</h2>
          <p className="mt-1 text-sm text-[#A3A8C7]">
            Formations planifiées — date, horaire, formateur, adresse. Export iCal pour Outlook /
            Google Calendar.
          </p>
        </div>
        <a
          href="/api/super-admin/crm/programmation/calendar.ics"
          className="inline-flex items-center gap-2 rounded-full border border-[#262A4A] bg-[#141731] px-4 py-2 text-sm font-semibold text-[#E8ECF8] hover:border-[#6C5CF5]/50"
        >
          <Download className="h-4 w-4" />
          Télécharger .ics
        </a>
      </div>

      {loading ? (
        <p className="text-sm text-[#A3A8C7]">Chargement de l&apos;agenda…</p>
      ) : byDate.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[#262A4A] bg-[#141731] px-5 py-10 text-center text-sm text-[#A3A8C7]">
          Aucun créneau dans la fenêtre affichée. Les sessions apparaissent dès qu&apos;un créneau
          est posé sur un dossier.
        </div>
      ) : (
        <ul className="space-y-5">
          {byDate.map(([date, dayEvents]) => (
            <li key={date}>
              <p className="mb-2 flex items-center gap-2 text-sm font-semibold capitalize text-[#B7AEFF]">
                <CalendarDays className="h-4 w-4" />
                {dayEvents[0]?.day_label || date}
              </p>
              <ul className="space-y-2">
                {dayEvents.map((event) => (
                  <li
                    key={event.id}
                    className="rounded-2xl border border-[#262A4A] bg-[#141731] px-4 py-3"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-extrabold text-[#F3F4FA]">{event.title}</p>
                        <p className="mt-1 text-xs text-[#A3A8C7]">
                          {event.time_label}
                          {dayPartLabel(event.day_part) ? ` · ${dayPartLabel(event.day_part)}` : ""}
                          {event.modality ? ` · ${event.modality}` : ""}
                        </p>
                        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-[#C9D2E8]">
                          <span className="inline-flex items-center gap-1.5">
                            <UserRound className="h-3.5 w-3.5 text-[#8DB8FF]" />
                            {event.trainer_name || "Formateur non assigné"}
                          </span>
                          <span className="inline-flex items-center gap-1.5">
                            <MapPin className="h-3.5 w-3.5 text-[#6BE39B]" />
                            {event.address || "Adresse non renseignée"}
                          </span>
                        </div>
                      </div>
                      {event.dossier_id ? (
                        <a
                          href={`/super/crm/programmation?view=pipeline&dossier=${event.dossier_id}`}
                          className="shrink-0 rounded-full border border-[#26304F] px-3 py-1 text-[11px] font-semibold text-[#C9D2E8] hover:text-white"
                        >
                          Ouvrir le dossier
                        </a>
                      ) : null}
                    </div>
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
