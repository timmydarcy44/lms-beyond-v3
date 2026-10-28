"use client";

import { useEffect, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { toast } from "sonner";

import { createExpertSlot, saveAgendaSettings } from "@/app/dashboard/expert/space-actions";
import { AppleSuccessOverlay } from "@/components/expert/apple-success-overlay";
import { ExpertPageFrame, ExpertPageHeader, ExpertPrimaryButton, HeroCard, SegmentBar } from "@/components/expert/expert-ui";
import { addDays, isSameDay, longDayLabel, NOTICE_HOUR_OPTIONS, weekdayShort, type ExpertSlot, type NoticeHours, type SlotFormat, type SlotKind } from "@/lib/expert/space-model";

export type AgendaPatient = { id: string; first_name: string; last_name: string; email: string };

type Draft = { date: Date; start: string; end: string };

const HOUR_PX = 52;
const SNAP_MINUTES = 15;
const DAY_MINUTES = 24 * 60;
const GRID_HEIGHT = 24 * HOUR_PX;

function pad(value: number) {
  return String(value).padStart(2, "0");
}

function toIsoDate(date: Date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function minutesToTime(minutes: number) {
  const clamped = Math.max(0, Math.min(DAY_MINUTES, minutes));
  const hours = Math.floor(clamped / 60) % 24;
  const mins = clamped % 60;
  if (clamped >= DAY_MINUTES) return "24:00";
  return `${pad(hours)}:${pad(mins)}`;
}

function timeToMinutes(value: string) {
  if (value === "24:00") return DAY_MINUTES;
  const [hours, minutes] = value.split(":").map(Number);
  return hours * 60 + minutes;
}

function patientLabel(patient: AgendaPatient) {
  return [patient.first_name, patient.last_name].filter(Boolean).join(" ").trim() || patient.email;
}

function kindLabel(kind: SlotKind, occupied: boolean) {
  if (occupied) return "Occupé";
  if (kind === "indisponible") return "Indisponible";
  if (kind === "formation") return "Formation";
  if (kind === "disponible") return "Disponible";
  return "Rendez-vous";
}

export function AgendaView({
  slots,
  format,
  noticeHours,
  patients,
  presetClientId,
}: {
  slots: ExpertSlot[];
  format: SlotFormat;
  noticeHours: NoticeHours;
  patients: AgendaPatient[];
  presetClientId?: string | null;
}) {
  const today = useMemo(() => {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    return date;
  }, []);
  const [start, setStart] = useState(today);
  const [selected, setSelected] = useState(today);
  const [view, setView] = useState<"day" | "week">("day");
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<Draft | null>(null);
  const router = useRouter();
  const [defaultFormat, setDefaultFormat] = useState(format);
  const [notice, setNotice] = useState(noticeHours);
  const [success, setSuccess] = useState<{ title: string; subtitle?: string } | null>(null);
  const days = Array.from({ length: 7 }, (_, index) => addDays(start, index));
  const horizonEnd = addDays(today, 7);
  const upcoming = slots.filter((slot) => {
    const date = new Date(slot.startsAt);
    return date >= today && date < horizonEnd;
  });
  const free = upcoming.filter((slot) => !slot.missionId && slot.kind !== "indisponible");
  const gridDays = view === "week" ? days : [selected];

  const openDraft = (next: Draft) => {
    setDraft(next);
    setSelected(next.date);
    setOpen(true);
  };

  return (
    <ExpertPageFrame>
      <AppleSuccessOverlay
        open={Boolean(success)}
        title={success?.title ?? ""}
        subtitle={success?.subtitle}
        onClose={() => setSuccess(null)}
        autoCloseMs={2800}
      />
      <ExpertPageHeader
        title="Mon agenda"
        subtitle="Vos créneaux occupés et vos disponibilités"
        action={
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex rounded-full bg-[#12141A] p-1">
              <button
                type="button"
                onClick={() => setView("day")}
                className={`h-10 rounded-full px-4 text-sm font-extrabold ${view === "day" ? "bg-[#FF4B4B] text-[#04140C]" : "text-[#B5BAC6]"}`}
              >
                Jour
              </button>
              <button
                type="button"
                onClick={() => setView("week")}
                className={`h-10 rounded-full px-4 text-sm font-extrabold ${view === "week" ? "bg-[#FF4B4B] text-[#04140C]" : "text-[#B5BAC6]"}`}
              >
                Semaine
              </button>
            </div>
            <ExpertPrimaryButton
              onClick={() =>
                openDraft({ date: selected, start: "09:00", end: "10:00" })
              }
            >
              Ajouter un créneau
            </ExpertPrimaryButton>
          </div>
        }
      />
      <section className="rounded-[28px] bg-[#12141A] p-3">
        <div className="flex items-center gap-2">
          <IconButton label="Jours précédents" onClick={() => setStart(addDays(start, -7))}>
            <ChevronLeft className="h-4 w-4" />
          </IconButton>
          <div className="flex min-w-0 flex-1 gap-2 overflow-x-auto">
            {days.map((day) => {
              const active = isSameDay(day, selected);
              const occupied = slots.some((slot) => slot.missionId && isSameDay(new Date(slot.startsAt), day));
              const hasFree = slots.some((slot) => !slot.missionId && isSameDay(new Date(slot.startsAt), day));
              return (
                <button
                  key={day.toISOString()}
                  type="button"
                  aria-pressed={active}
                  onClick={() => {
                    setSelected(day);
                    setView("day");
                  }}
                  className={`flex min-w-[72px] flex-1 flex-col items-center rounded-[22px] px-2 py-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FFB4B8] ${active ? "bg-[#FF4B4B] text-[#04140C]" : "text-[#F4F5F7]"}`}
                >
                  <span className="text-xs font-semibold">{weekdayShort(day)}</span>
                  <span className="text-[22px] font-extrabold leading-none">{day.getDate()}</span>
                  <span className={`mt-1 h-1.5 w-1.5 rounded-full ${occupied ? (active ? "bg-[#04140C]" : "bg-[#FF4B4B]") : hasFree ? "bg-[#9096A3]" : "bg-transparent"}`} />
                </button>
              );
            })}
          </div>
          <IconButton label="Jours suivants" onClick={() => setStart(addDays(start, 7))}>
            <ChevronRight className="h-4 w-4" />
          </IconButton>
        </div>
      </section>
      <div className="mt-4 grid gap-4 lg:grid-cols-[1.6fr_1fr]">
        <section className="overflow-hidden rounded-[28px] bg-[#12141A] p-4">
          <h2 className="text-base font-extrabold">{view === "week" ? "Semaine" : longDayLabel(selected)}</h2>
          <p className="mt-1 text-sm text-[#9096A3]">Sélectionnez une plage horaire de 00h à 00h pour poser un rendez-vous.</p>
          <AgendaGrid
            days={gridDays}
            slots={slots}
            onSelect={(range) => openDraft(range)}
          />
        </section>
        <div className="space-y-4">
          <HeroCard>
            <p className="text-sm font-semibold text-[#B5BAC6]">Créneaux libres · 7 prochains jours</p>
            <p className="mt-2 text-[64px] font-extrabold leading-none tracking-[-0.05em]">
              {free.length} <span className="text-[28px] text-[#9096A3]">/ {upcoming.length}</span>
            </p>
            <div className="mt-4">
              <SegmentBar total={Math.max(upcoming.length, 1)} filled={free.length} />
            </div>
            <p className="mt-4 text-sm text-[#B5BAC6]">
              Un créneau Disponible reste ouvert à la réservation. Indisponible bloque les rendez-vous.
            </p>
            <div className="mt-5">
              <ExpertPrimaryButton onClick={() => openDraft({ date: selected, start: "09:00", end: "10:00" })}>
                Ajouter un créneau
              </ExpertPrimaryButton>
            </div>
          </HeroCard>
          <section className="space-y-4 rounded-[28px] bg-[#12141A] p-5">
            <Setting
              label="Synchroniser mon agenda"
              hint="Google Agenda ou Outlook"
              control={<span className="rounded-full bg-[#1E2130] px-3 py-1 text-xs font-bold text-[#9096A3]">Bientôt</span>}
            />
            <Setting
              label="Format par défaut"
              hint="Pour les nouveaux créneaux"
              control={
                <select
                  aria-label="Format par défaut"
                  value={defaultFormat}
                  onChange={(event) => {
                    const value = event.target.value as SlotFormat;
                    setDefaultFormat(value);
                    void saveAgendaSettings({ format: value });
                  }}
                  className="rounded-full bg-white px-3 py-1 text-sm font-bold text-[#07080B]"
                >
                  <option value="visio">Visio</option>
                  <option value="presentiel">Présentiel</option>
                </select>
              }
            />
            <Setting
              label="Délai de prévenance"
              hint="Avant qu'on puisse vous réserver"
              control={
                <select
                  aria-label="Délai de prévenance"
                  value={notice}
                  onChange={(event) => {
                    const value = Number(event.target.value) as NoticeHours;
                    setNotice(value);
                    void saveAgendaSettings({ noticeHours: value });
                  }}
                  className="min-w-[7.5rem] rounded-full bg-white px-3 py-1 text-sm font-bold text-[#07080B]"
                >
                  {NOTICE_HOUR_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              }
            />
          </section>
        </div>
      </div>
      {open && draft ? (
        <SlotModal
          date={draft.date}
          start={draft.start}
          end={draft.end}
          format={defaultFormat}
          patients={patients}
          presetClientId={presetClientId}
          onClose={() => {
            setOpen(false);
            setDraft(null);
          }}
          onBooked={(result) => {
            setOpen(false);
            setDraft(null);
            setSuccess({ title: result.title, subtitle: result.subtitle });
            router.refresh();
          }}
        />
      ) : null}
    </ExpertPageFrame>
  );
}

function AgendaGrid({
  days,
  slots,
  onSelect,
}: {
  days: Date[];
  slots: ExpertSlot[];
  onSelect: (draft: Draft) => void;
}) {
  const scroller = useRef<HTMLDivElement>(null);
  const [drag, setDrag] = useState<{ day: number; from: number; to: number } | null>(null);

  useEffect(() => {
    scroller.current?.scrollTo({ top: 8 * HOUR_PX });
  }, [days.length, days[0]?.toISOString()]);

  const resolvePoint = (event: ReactPointerEvent<HTMLDivElement>) => {
    const grid = event.currentTarget;
    const rect = grid.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    const labelWidth = 56;
    const colWidth = Math.max(1, (grid.clientWidth - labelWidth) / days.length);
    const dayIndex = Math.max(0, Math.min(days.length - 1, Math.floor((x - labelWidth) / colWidth)));
    const raw = (y / HOUR_PX) * 60;
    const minutes = Math.max(0, Math.min(DAY_MINUTES - SNAP_MINUTES, Math.round(raw / SNAP_MINUTES) * SNAP_MINUTES));
    return { dayIndex, minutes };
  };

  return (
    <div
      ref={scroller}
      className="relative mt-4 max-h-[70vh] overflow-auto rounded-[22px] border border-[#1E2130]"
    >
      <div data-agenda-head className="sticky top-0 z-20 grid border-b border-[#1E2130] bg-[#12141A]" style={{ gridTemplateColumns: `56px repeat(${days.length}, minmax(0, 1fr))` }}>
        <div />
        {days.map((day) => (
          <div key={day.toISOString()} className="px-2 py-2 text-center text-xs font-extrabold text-[#B5BAC6]">
            {weekdayShort(day)} {day.getDate()}
          </div>
        ))}
      </div>
      <div
        data-agenda-grid
        className="relative touch-none select-none"
        style={{ height: GRID_HEIGHT, minWidth: days.length > 1 ? 640 : undefined }}
        onPointerDown={(event) => {
          if ((event.target as HTMLElement).closest("[data-slot]")) return;
          event.preventDefault();
          event.currentTarget.setPointerCapture(event.pointerId);
          const point = resolvePoint(event);
          setDrag({ day: point.dayIndex, from: point.minutes, to: point.minutes + SNAP_MINUTES });
        }}
        onPointerMove={(event) => {
          if (!event.currentTarget.hasPointerCapture(event.pointerId)) return;
          const point = resolvePoint(event);
          setDrag((current) => (current ? { ...current, to: point.minutes + SNAP_MINUTES } : current));
        }}
        onPointerUp={(event) => {
          event.currentTarget.releasePointerCapture(event.pointerId);
          setDrag((current) => {
            if (!current) return current;
            const from = Math.min(current.from, current.to - SNAP_MINUTES);
            const to = Math.max(current.from + SNAP_MINUTES, current.to);
            onSelect({ date: days[current.day] ?? days[0], start: minutesToTime(from), end: minutesToTime(to) });
            return null;
          });
        }}
      >
        <div className="absolute inset-0 grid" style={{ gridTemplateColumns: `56px repeat(${days.length}, minmax(0, 1fr))` }}>
          <div className="relative">
            {Array.from({ length: 25 }, (_, hour) => (
              <div key={hour} className="absolute right-2 text-[10px] font-bold text-[#9096A3]" style={{ top: hour * HOUR_PX - 6 }}>
                {hour === 24 ? "00h" : `${pad(hour)}h`}
              </div>
            ))}
          </div>
          {days.map((day, dayIndex) => (
            <div key={day.toISOString()} className="relative border-l border-[#1E2130]">
              {Array.from({ length: 24 }, (_, hour) => (
                <div key={hour} className="absolute inset-x-0 border-t border-[#1E2130]/80" style={{ top: hour * HOUR_PX, height: HOUR_PX }}>
                  <div className="absolute inset-x-0 top-1/2 border-t border-dashed border-[#1E2130]/50" />
                </div>
              ))}
              {slots
                .filter((slot) => isSameDay(new Date(slot.startsAt), day))
                .map((slot) => {
                  const occupied = Boolean(slot.missionId);
                  const startMin = minutesOfDate(new Date(slot.startsAt));
                  const endMin = minutesOfDate(new Date(slot.endsAt));
                  const kind = slot.kind ?? "rendez_vous";
                  return (
                    <article
                      key={slot.id}
                      data-slot
                      className={`absolute inset-x-1 overflow-hidden rounded-xl px-2 py-1 text-[11px] ${
                        kind === "indisponible"
                          ? "bg-[#1E2130] text-[#9096A3]"
                          : kind === "disponible"
                            ? "border border-dashed border-[#FF4B4B]/50 bg-[#FF4B4B]/10"
                            : occupied
                              ? "bg-[#FF4B4B] text-[#04140C]"
                              : "bg-[#262A36]"
                      }`}
                      style={{
                        top: (startMin / 60) * HOUR_PX,
                        height: Math.max(22, ((endMin - startMin) / 60) * HOUR_PX),
                      }}
                    >
                      <p className="font-extrabold truncate">
                        {kind === "rendez_vous" && slot.client ? slot.client : kindLabel(kind, occupied)}
                      </p>
                      <p className="truncate">
                        {kind === "rendez_vous" && slot.client
                          ? kindLabel(kind, occupied)
                          : slot.client || slot.location || slot.title || ""}
                      </p>
                    </article>
                  );
                })}
              {drag && drag.day === dayIndex ? (
                <div
                  className="pointer-events-none absolute inset-x-1 rounded-xl bg-[#FF4B4B]/35 ring-1 ring-[#FF4B4B]"
                  style={{
                    top: (Math.min(drag.from, drag.to) / 60) * HOUR_PX,
                    height: Math.max(16, (Math.abs(drag.to - drag.from) / 60) * HOUR_PX),
                  }}
                />
              ) : null}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function minutesOfDate(date: Date) {
  return date.getHours() * 60 + date.getMinutes();
}

function Setting({ label, hint, control }: { label: string; hint: string; control: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div>
        <p className="text-sm font-extrabold">{label}</p>
        <p className="text-xs text-[#9096A3]">{hint}</p>
      </div>
      {control}
    </div>
  );
}

function IconButton({ label, onClick, children }: { label: string; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#1E2130] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FFB4B8]"
    >
      {children}
    </button>
  );
}

function SlotModal({
  date,
  start,
  end,
  format,
  patients,
  presetClientId,
  onClose,
  onBooked,
}: {
  date: Date;
  start: string;
  end: string;
  format: SlotFormat;
  patients: AgendaPatient[];
  presetClientId?: string | null;
  onClose: () => void;
  onBooked: (result: { title: string; subtitle?: string }) => void;
}) {
  const [pending, setPending] = useState(false);
  const [kind, setKind] = useState<SlotKind>(presetClientId ? "rendez_vous" : "disponible");
  const [clientId, setClientId] = useState(presetClientId ?? "");
  const [creating, setCreating] = useState(false);
  const [list, setList] = useState(patients);
  const iso = toIsoDate(date);
  const defaultLocation = format === "visio" ? "Visio" : "";

  useEffect(() => {
    let ignore = false;
    void fetch("/api/expert/care/clients", { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : null))
      .then((json) => {
        if (ignore || !Array.isArray(json?.clients)) return;
        setList(
          json.clients.map((row: AgendaPatient) => ({
            id: String(row.id),
            first_name: String(row.first_name ?? ""),
            last_name: String(row.last_name ?? ""),
            email: String(row.email ?? ""),
          })),
        );
      })
      .catch(() => undefined);
    return () => {
      ignore = true;
    };
  }, []);

  const save = async (form: HTMLFormElement, notify: boolean) => {
    const data = new FormData(form);
    let chosen = String(data.get("clientId") ?? clientId);
    if (creating) {
      const res = await fetch("/api/expert/care/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          first_name: String(data.get("first_name") ?? ""),
          last_name: String(data.get("last_name") ?? ""),
          email: String(data.get("email") ?? ""),
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Patient impossible à créer");
      chosen = json.client.id;
      setList((current) => [...current, json.client]);
    }
    const slotKind = String(data.get("kind")) as SlotKind;
    const result = await createExpertSlot({
      date: String(data.get("date")),
      start: String(data.get("start")),
      end: String(data.get("end")),
      format: String(data.get("format")) as SlotFormat,
      kind: slotKind,
      location: String(data.get("location") ?? ""),
      weekly: data.get("weekly") === "on",
      clientId: slotKind === "rendez_vous" && chosen ? chosen : null,
      notify,
    });
    if (!result.ok) throw new Error(result.error ?? "Créneau impossible");
    const patient = list.find((row) => row.id === chosen);
    const name = patient ? patientLabel(patient) : creating ? [String(data.get("first_name") ?? ""), String(data.get("last_name") ?? "")].filter(Boolean).join(" ") : "";
    if (slotKind === "rendez_vous") {
      const emailed = "emailed" in result && result.emailed;
      const emailError = "emailError" in result ? result.emailError : null;
      onBooked({
        title: "Rendez-vous confirmé",
        subtitle: emailed
          ? `${name || "Patient"} a reçu le mail de confirmation.`
          : `${name || "Patient"} est bien dans l'agenda.${emailError ? ` ${emailError}` : " Aucun e-mail n'a pu partir."}`,
      });
      return;
    }
    onBooked({ title: "Créneau enregistré", subtitle: kindLabel(slotKind, false) });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-4 sm:items-center" onClick={onClose}>
      <form
        className="w-full max-w-md rounded-[28px] bg-[#12141A] p-5"
        onClick={(event) => event.stopPropagation()}
        onSubmit={(event) => {
          event.preventDefault();
          setPending(true);
          void save(event.currentTarget, false)
            .catch((error) => toast.error(error instanceof Error ? error.message : "Créneau impossible"))
            .finally(() => setPending(false));
        }}
      >
        <h2 className="text-xl font-extrabold">Ajouter un créneau</h2>
        <div className="mt-4 grid gap-3">
          <label className="text-sm text-[#B5BAC6]">
            Date
            <input name="date" type="date" defaultValue={iso} required className="mt-1 w-full rounded-2xl bg-[#1E2130] px-3 py-2" />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="text-sm text-[#B5BAC6]">
              Début
              <input name="start" type="time" defaultValue={start === "24:00" ? "23:30" : start} required className="mt-1 w-full rounded-2xl bg-[#1E2130] px-3 py-2" />
            </label>
            <label className="text-sm text-[#B5BAC6]">
              Fin
              <input name="end" type="time" defaultValue={end === "24:00" ? "23:59" : end} required className="mt-1 w-full rounded-2xl bg-[#1E2130] px-3 py-2" />
            </label>
          </div>
          <label className="text-sm text-[#B5BAC6]">
            Type
            <select name="kind" value={kind} onChange={(event) => setKind(event.target.value as SlotKind)} className="mt-1 w-full rounded-2xl bg-[#1E2130] px-3 py-2">
              <option value="disponible">Disponible</option>
              <option value="rendez_vous">Rendez-vous</option>
              <option value="formation">Formation</option>
              <option value="indisponible">Indisponible</option>
            </select>
          </label>
          {kind === "rendez_vous" ? (
            <>
              <label className="text-sm text-[#B5BAC6]">
                Patient
                <select
                  name="clientId"
                  value={creating ? "__new" : clientId}
                  onChange={(event) => {
                    if (event.target.value === "__new") {
                      setCreating(true);
                      setClientId("");
                      return;
                    }
                    setCreating(false);
                    setClientId(event.target.value);
                  }}
                  className="mt-1 w-full rounded-2xl bg-[#1E2130] px-3 py-2"
                >
                  <option value="">Choisir un patient</option>
                  {list.map((patient) => (
                    <option key={patient.id} value={patient.id}>
                      {patientLabel(patient)}
                    </option>
                  ))}
                  <option value="__new">Créer un nouveau patient</option>
                </select>
              </label>
              {creating ? (
                <div className="grid gap-2 rounded-2xl bg-[#1E2130] p-3">
                  <input name="first_name" placeholder="Prénom" className="rounded-xl bg-[#12141A] px-3 py-2 text-sm" />
                  <input name="last_name" placeholder="Nom" className="rounded-xl bg-[#12141A] px-3 py-2 text-sm" />
                  <input name="email" type="email" required placeholder="E-mail" className="rounded-xl bg-[#12141A] px-3 py-2 text-sm" />
                </div>
              ) : null}
            </>
          ) : null}
          <label className="text-sm text-[#B5BAC6]">
            Format
            <select name="format" defaultValue={format} className="mt-1 w-full rounded-2xl bg-[#1E2130] px-3 py-2">
              <option value="visio">Visio</option>
              <option value="presentiel">Présentiel</option>
            </select>
          </label>
          <label className="text-sm text-[#B5BAC6]">
            Lieu
            <input name="location" defaultValue={defaultLocation} placeholder="Visio ou ville" className="mt-1 w-full rounded-2xl bg-[#1E2130] px-3 py-2" />
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input name="weekly" type="checkbox" /> Récurrence hebdomadaire
          </label>
        </div>
        <div className="mt-5 flex flex-wrap justify-end gap-2">
          <button type="button" onClick={onClose} className="h-11 rounded-full px-4 text-sm font-bold">
            Annuler
          </button>
          {kind === "rendez_vous" ? (
            <button
              type="button"
              disabled={pending}
              className="h-11 rounded-full bg-[#F4F5F7] px-5 text-sm font-extrabold text-[#07080B]"
              onClick={(event) => {
                const form = event.currentTarget.form;
                if (!form) return;
                setPending(true);
                void save(form, true)
                  .catch((error) => toast.error(error instanceof Error ? error.message : "Envoi impossible"))
                  .finally(() => setPending(false));
              }}
            >
              Avertir le patient
            </button>
          ) : null}
          <button type="submit" disabled={pending} className="h-11 rounded-full bg-[#FF4B4B] px-5 text-sm font-extrabold text-[#04140C]">
            Enregistrer
          </button>
        </div>
      </form>
    </div>
  );
}
