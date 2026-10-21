"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";

import { TuteurShell } from "@/components/tuteur/tuteur-shell";

type Cell = { date: string; label: string; place: string; notes: string[] };
type Student = { id: string; name: string; initials: string; rhythmMissing: boolean; cells: Cell[] };
type Upcoming = { id: string; day: string; month: string; title: string; detail: string; href: string; action: string };
type Board = { anchor: string; weekLabel: string; apprentices: Array<{ id: string; name: string }>; students: Student[]; upcoming: Upcoming[] };

const placeClass: Record<string, string> = {
  ecole: "bg-[rgba(47,124,246,0.18)] text-[#8DB8FF]",
  entreprise: "bg-[rgba(255,122,47,0.18)] text-[#FFB085]",
  absent: "bg-[#3A1418] text-[#FF7A85]",
  unknown: "bg-[#1E2130] text-[#9096A3]",
};

export function TutorCalendarPage() {
  const [board, setBoard] = useState<Board | null>(null);
  const [anchor, setAnchor] = useState("");
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");

  async function load(date?: string) {
    const query = date ? `?date=${date}` : "";
    const res = await fetch(`/api/tuteur/calendrier${query}`, { cache: "no-store" });
    if (!res.ok) return;
    const json = await res.json();
    setBoard(json);
    setAnchor(json.anchor);
  }

  useEffect(() => { void load(); }, []);

  function shift(days: number) {
    const date = new Date(`${(anchor || new Date().toISOString().slice(0, 10))}T12:00:00`);
    date.setDate(date.getDate() + days);
    void load(date.toISOString().slice(0, 10));
  }

  async function plan(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const res = await fetch("/api/tuteur/calendrier", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        apprenticeId: form.get("apprenticeId"),
        type: form.get("type"),
        date: form.get("date"),
        time: form.get("time"),
        durationMinutes: Number(form.get("duration")),
        remote: form.get("remote") === "visio",
        location: form.get("location"),
        notes: form.get("notes"),
      }),
    });
    const json = await res.json().catch(() => null);
    if (!res.ok) {
      setMessage(json?.error || "Le rendez-vous n'a pas pu être enregistré.");
      return;
    }
    setOpen(false);
    setMessage("");
    void load(anchor);
  }

  return (
    <TuteurShell tutorName="">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight">Calendrier</h1>
          <p className="mt-2 text-sm text-[var(--tutor-text-3)]">Où sont vos alternants, et vos rendez-vous à venir</p>
        </div>
        <button type="button" className="rounded-full bg-[var(--tutor-accent)] px-4 py-2 text-sm font-bold text-[var(--tutor-on-accent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF9A5C]" onClick={() => setOpen(true)}>+ Planifier un rendez-vous</button>
      </div>
      <div className="mt-5 flex flex-wrap items-center gap-3">
        <button type="button" className="rounded-full bg-[#1E2130] px-3 py-2" aria-label="Semaine précédente" onClick={() => shift(-7)}>‹</button>
        <p className="font-bold">{board?.weekLabel ?? "Semaine"}</p>
        <button type="button" className="rounded-full bg-[#1E2130] px-3 py-2" aria-label="Semaine suivante" onClick={() => shift(7)}>›</button>
        <button type="button" className="rounded-full bg-[#F4F5F7] px-3 py-1 text-sm font-semibold text-[#07080B]" onClick={() => void load(new Date().toISOString().slice(0, 10))}>Aujourd&apos;hui</button>
        <p className="ml-auto flex flex-wrap gap-3 text-xs text-[var(--tutor-text-4)]">
          <span className="text-[#FFB085]">Entreprise</span>
          <span className="text-[#8DB8FF]">École</span>
          <span className="text-[#FF7A85]">Absent</span>
          <span className="text-[#F2CF6B]">Rendez-vous</span>
        </p>
      </div>
      {!board ? <div className="mt-6 h-48 animate-pulse rounded-[28px] bg-[#12141A]" /> : null}
      {board && board.students.length === 0 ? <p className="mt-8 text-sm text-[var(--tutor-text-3)]">Aucun alternant à afficher.</p> : null}
      {board && board.students.length > 0 ? (
        <div className="mt-4 overflow-x-auto">
          <div className="min-w-[720px] rounded-[28px] bg-[#12141A] p-3">
            {board.students.map((student) => (
              <div key={student.id} className="grid grid-cols-[140px_repeat(5,1fr)] items-center gap-2 border-t border-[#262A36] py-2 first:border-0">
                <p className="flex items-center gap-2 text-sm font-bold">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--tutor-accent)] text-[10px] font-extrabold text-[var(--tutor-on-accent)]">{student.initials}</span>
                  {student.name}
                </p>
                {student.rhythmMissing ? <p className="col-span-5 text-sm text-[#9096A3]">Rythme non renseigné</p> : student.cells.map((cell) => (
                  <div key={cell.date} className={`min-h-14 rounded-2xl px-2 py-2 text-center text-sm font-semibold ${placeClass[cell.place] ?? placeClass.unknown}`}>
                    {cell.place === "ecole" ? "École" : cell.place === "absent" ? "Absent" : cell.place === "entreprise" ? "Entreprise" : "—"}
                    {cell.notes.map((note) => <span key={note} className="mt-1 block rounded-full bg-[#36301A] px-2 py-0.5 text-[11px] text-[#F2CF6B]">{note}</span>)}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      ) : null}
      <section className="mt-4 rounded-[28px] bg-[#12141A] p-5">
        <h2 className="font-extrabold">Rendez-vous et échéances</h2>
        {(board?.upcoming ?? []).length === 0 ? <p className="mt-3 text-sm text-[var(--tutor-text-3)]">Aucun rendez-vous à venir.</p> : null}
        {(board?.upcoming ?? []).map((item) => (
          <div key={item.id} className="mt-3 flex items-center gap-3">
            <span className="flex h-12 w-12 flex-col items-center justify-center rounded-2xl bg-[#1E2130] text-xs font-bold"><span>{item.day}</span><span className="text-[10px] text-[#9096A3]">{item.month}</span></span>
            <span className="min-w-0 flex-1"><span className="block font-bold">{item.title}</span><span className="text-sm text-[#9096A3]">{item.detail}</span></span>
            <Link href={item.href} className="text-sm font-bold text-[#FFB085]">{item.action}</Link>
          </div>
        ))}
      </section>
      {open ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-4 sm:items-center">
          <form onSubmit={plan} className="w-full max-w-md space-y-3 rounded-[28px] bg-[#12141A] p-5">
            <h2 className="text-lg font-extrabold">Planifier un rendez-vous</h2>
            <select name="apprenticeId" required className="w-full rounded-xl bg-[#07080B] p-2" aria-label="Alternant">
              {(board?.apprentices ?? []).map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
            </select>
            <select name="type" className="w-full rounded-xl bg-[#07080B] p-2" aria-label="Type">
              <option value="monthly">Point mensuel</option>
              <option value="onboarding">Entretien d&apos;intégration</option>
              <option value="tripartite">Visite tripartite</option>
              <option value="other">Autre</option>
            </select>
            <div className="grid grid-cols-2 gap-2">
              <input name="date" type="date" required className="rounded-xl bg-[#07080B] p-2" aria-label="Date" />
              <input name="time" type="time" required className="rounded-xl bg-[#07080B] p-2" aria-label="Heure" />
            </div>
            <input name="duration" type="number" min={15} defaultValue={30} className="w-full rounded-xl bg-[#07080B] p-2" aria-label="Durée en minutes" />
            <select name="remote" className="w-full rounded-xl bg-[#07080B] p-2" aria-label="Sur place ou visio">
              <option value="lieu">Sur place</option>
              <option value="visio">Visio</option>
            </select>
            <input name="location" required placeholder="Lieu ou lien" className="w-full rounded-xl bg-[#07080B] p-2" />
            <textarea name="notes" placeholder="Note" className="w-full rounded-xl bg-[#07080B] p-2" />
            {message ? <p className="text-sm text-[#FF7A85]">{message}</p> : null}
            <div className="flex gap-2">
              <button type="submit" className="rounded-full bg-[var(--tutor-accent)] px-4 py-2 text-sm font-bold text-[var(--tutor-on-accent)]">Enregistrer</button>
              <button type="button" className="rounded-full bg-[#1E2130] px-4 py-2 text-sm" onClick={() => setOpen(false)}>Fermer</button>
            </div>
          </form>
        </div>
      ) : null}
    </TuteurShell>
  );
}
