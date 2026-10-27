"use client";

import { useMemo, useState, type ReactNode } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { toast } from "sonner";

import { createExpertSlot, saveAgendaSettings } from "@/app/dashboard/expert/space-actions";
import { EmptyState, ExpertPageFrame, ExpertPageHeader, ExpertPrimaryButton, HeroCard, SegmentBar, StatusPill } from "@/components/expert/expert-ui";
import { addDays, isSameDay, longDayLabel, weekdayShort, type ExpertSlot, type SlotFormat, type SlotKind } from "@/lib/expert/space-model";

export function AgendaView({
  slots,
  format,
  noticeHours,
}: {
  slots: ExpertSlot[];
  format: SlotFormat;
  noticeHours: 24 | 48 | 72;
}) {
  const today = useMemo(() => { const date = new Date(); date.setHours(0, 0, 0, 0); return date; }, []);
  const [start, setStart] = useState(today);
  const [selected, setSelected] = useState(today);
  const [open, setOpen] = useState(false);
  const [defaultFormat, setDefaultFormat] = useState(format);
  const [notice, setNotice] = useState(noticeHours);
  const days = Array.from({ length: 7 }, (_, index) => addDays(start, index));
  const horizonEnd = addDays(today, 7);
  const upcoming = slots.filter((slot) => { const date = new Date(slot.startsAt); return date >= today && date < horizonEnd; });
  const free = upcoming.filter((slot) => !slot.missionId && slot.kind !== "indisponible");
  const daySlots = slots.filter((slot) => isSameDay(new Date(slot.startsAt), selected)).sort((a, b) => +new Date(a.startsAt) - +new Date(b.startsAt));

  return (
    <ExpertPageFrame>
      <ExpertPageHeader title="Mon agenda" subtitle="Vos créneaux occupés et vos disponibilités" action={<ExpertPrimaryButton onClick={() => setOpen(true)}>Ajouter un créneau</ExpertPrimaryButton>} />
      <section className="rounded-[28px] bg-[#12141A] p-3">
        <div className="flex items-center gap-2">
          <IconButton label="Jours précédents" onClick={() => setStart(addDays(start, -7))}><ChevronLeft className="h-4 w-4" /></IconButton>
          <div className="flex min-w-0 flex-1 gap-2 overflow-x-auto">
            {days.map((day) => {
              const active = isSameDay(day, selected);
              const occupied = slots.some((slot) => slot.missionId && isSameDay(new Date(slot.startsAt), day));
              const hasFree = slots.some((slot) => !slot.missionId && isSameDay(new Date(slot.startsAt), day));
              return (
                <button key={day.toISOString()} type="button" aria-pressed={active} onClick={() => setSelected(day)} className={`flex min-w-[72px] flex-1 flex-col items-center rounded-[22px] px-2 py-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FFB4B8] ${active ? "bg-[#FF4B4B] text-[#04140C]" : "text-[#F4F5F7]"}`}>
                  <span className="text-xs font-semibold">{weekdayShort(day)}</span>
                  <span className="text-[22px] font-extrabold leading-none">{day.getDate()}</span>
                  <span className={`mt-1 h-1.5 w-1.5 rounded-full ${occupied ? (active ? "bg-[#04140C]" : "bg-[#FF4B4B]") : hasFree ? "bg-[#9096A3]" : "bg-transparent"}`} />
                </button>
              );
            })}
          </div>
          <IconButton label="Jours suivants" onClick={() => setStart(addDays(start, 7))}><ChevronRight className="h-4 w-4" /></IconButton>
        </div>
      </section>
      <div className="mt-4 grid gap-4 lg:grid-cols-[1.6fr_1fr]">
        <section className="rounded-[28px] bg-[#12141A] p-5">
          <h2 className="text-base font-extrabold">{longDayLabel(selected)}</h2>
          <div className="mt-4 space-y-3">
            {daySlots.length === 0 ? (
              <EmptyState title="Aucun créneau ce jour-là" action={<ExpertPrimaryButton onClick={() => setOpen(true)}>Ouvrir un créneau</ExpertPrimaryButton>} />
            ) : daySlots.map((slot) => {
              const occupied = Boolean(slot.missionId);
              const kind = slot.kind ?? "rendez_vous";
              const blocked = kind === "indisponible";
              const startLabel = new Date(slot.startsAt).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
              const endLabel = new Date(slot.endsAt).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
              const label = occupied ? slot.title : blocked ? "Indisponible" : kind === "formation" ? "Formation" : "Rendez-vous";
              const pill = occupied ? "Occupé" : blocked ? "Indisponible" : kind === "formation" ? "Formation" : "Rendez-vous";
              return (
                <article key={slot.id} className={`flex items-center gap-4 rounded-[22px] px-4 py-4 ${occupied || blocked ? "bg-[#1E2130]" : "border border-dashed border-[#262A36]"}`}>
                  {!blocked ? <span className="h-12 w-1 rounded-full bg-[#FF4B4B]" /> : null}
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold text-[#B5BAC6]">{startLabel} – {endLabel}</p>
                    <p className="text-base font-extrabold">{label}</p>
                    <p className="text-sm text-[#9096A3]">{occupied ? `${slot.client} · ${slot.location}` : blocked ? "Aucun rendez-vous possible" : slot.location || "Visio"}</p>
                  </div>
                  <StatusPill tone={blocked ? "alert" : occupied ? "grey" : kind === "formation" ? "blue" : "solid"}>{pill}</StatusPill>
                </article>
              );
            })}
          </div>
        </section>
        <div className="space-y-4">
          <HeroCard>
            <p className="text-sm font-semibold text-[#B5BAC6]">Créneaux libres · 7 prochains jours</p>
            <p className="mt-2 text-[64px] font-extrabold leading-none tracking-[-0.05em]">{free.length} <span className="text-[28px] text-[#9096A3]">/ {upcoming.length}</span></p>
            <div className="mt-4"><SegmentBar total={Math.max(upcoming.length, 1)} filled={free.length} /></div>
            <p className="mt-4 text-sm text-[#B5BAC6]">Un créneau Indisponible bloque les rendez-vous. Rendez-vous et Formation restent ouverts à la réservation.</p>
            <div className="mt-5"><ExpertPrimaryButton onClick={() => setOpen(true)}>Ajouter un créneau</ExpertPrimaryButton></div>
          </HeroCard>
          <section className="space-y-4 rounded-[28px] bg-[#12141A] p-5">
            <Setting label="Synchroniser mon agenda" hint="Google Agenda ou Outlook" control={<span className="rounded-full bg-[#1E2130] px-3 py-1 text-xs font-bold text-[#9096A3]">Bientôt</span>} />
            <Setting label="Format par défaut" hint="Pour les nouveaux créneaux" control={<select aria-label="Format par défaut" value={defaultFormat} onChange={(event) => { const value = event.target.value as SlotFormat; setDefaultFormat(value); void saveAgendaSettings({ format: value }); }} className="rounded-full bg-white px-3 py-1 text-sm font-bold text-[#07080B]"><option value="visio">Visio</option><option value="presentiel">Présentiel</option></select>} />
            <Setting label="Délai de prévenance" hint="Avant qu'on puisse vous réserver" control={<select aria-label="Délai de prévenance" value={notice} onChange={(event) => { const value = Number(event.target.value) as 24 | 48 | 72; setNotice(value); void saveAgendaSettings({ noticeHours: value }); }} className="rounded-full bg-white px-3 py-1 text-sm font-bold text-[#07080B]"><option value={24}>24 h</option><option value={48}>48 h</option><option value={72}>72 h</option></select>} />
          </section>
        </div>
      </div>
      {open ? <SlotModal date={selected} format={defaultFormat} onClose={() => setOpen(false)} /> : null}
    </ExpertPageFrame>
  );
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
  return <button type="button" aria-label={label} onClick={onClick} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#1E2130] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FFB4B8]">{children}</button>;
}

function SlotModal({ date, format, onClose }: { date: Date; format: SlotFormat; onClose: () => void }) {
  const [pending, setPending] = useState(false);
  const iso = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-4 sm:items-center" onClick={onClose}>
      <form
        className="w-full max-w-md rounded-[28px] bg-[#12141A] p-5"
        onClick={(event) => event.stopPropagation()}
        onSubmit={(event) => {
          event.preventDefault();
          const form = new FormData(event.currentTarget);
          setPending(true);
          void createExpertSlot({
            date: String(form.get("date")),
            start: String(form.get("start")),
            end: String(form.get("end")),
            format: String(form.get("format")) as SlotFormat,
            kind: String(form.get("kind")) as SlotKind,
            location: String(form.get("location") ?? ""),
            weekly: form.get("weekly") === "on",
          }).then((result) => {
            setPending(false);
            if (!result.ok) { toast.error(result.error ?? "Créneau impossible"); return; }
            toast.success("Créneau ajouté");
            onClose();
            window.location.reload();
          });
        }}
      >
        <h2 className="text-xl font-extrabold">Ajouter un créneau</h2>
        <div className="mt-4 grid gap-3">
          <label className="text-sm text-[#B5BAC6]">Date<input name="date" type="date" defaultValue={iso} required className="mt-1 w-full rounded-2xl bg-[#1E2130] px-3 py-2" /></label>
          <div className="grid grid-cols-2 gap-3">
            <label className="text-sm text-[#B5BAC6]">Début<input name="start" type="time" defaultValue="09:00" required className="mt-1 w-full rounded-2xl bg-[#1E2130] px-3 py-2" /></label>
            <label className="text-sm text-[#B5BAC6]">Fin<input name="end" type="time" defaultValue="12:00" required className="mt-1 w-full rounded-2xl bg-[#1E2130] px-3 py-2" /></label>
          </div>
          <label className="text-sm text-[#B5BAC6]">Type<select name="kind" defaultValue="rendez_vous" className="mt-1 w-full rounded-2xl bg-[#1E2130] px-3 py-2"><option value="rendez_vous">Rendez-vous</option><option value="formation">Formation</option><option value="indisponible">Indisponible</option></select></label>
          <label className="text-sm text-[#B5BAC6]">Format<select name="format" defaultValue={format} className="mt-1 w-full rounded-2xl bg-[#1E2130] px-3 py-2"><option value="visio">Visio</option><option value="presentiel">Présentiel</option></select></label>
          <label className="text-sm text-[#B5BAC6]">Lieu<input name="location" placeholder="Visio ou ville" className="mt-1 w-full rounded-2xl bg-[#1E2130] px-3 py-2" /></label>
          <label className="flex items-center gap-2 text-sm"><input name="weekly" type="checkbox" /> Récurrence hebdomadaire</label>
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <button type="button" onClick={onClose} className="h-11 rounded-full px-4 text-sm font-bold">Annuler</button>
          <button type="submit" disabled={pending} className="h-11 rounded-full bg-[#FF4B4B] px-5 text-sm font-extrabold text-[#04140C]">Enregistrer</button>
        </div>
      </form>
    </div>
  );
}
