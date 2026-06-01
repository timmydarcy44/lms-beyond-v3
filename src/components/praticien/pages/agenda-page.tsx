"use client";

import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Plus, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { usePraticien } from "@/components/praticien/praticien-context";
import { Card, PageWrap } from "@/components/praticien/praticien-ui";
import { formatDateFr, formatTime } from "@/lib/marketplace/praticien-utils";
import { cn } from "@/lib/utils";

export function PraticienAgendaPage() {
  const { creneaux, prochainesSessions, calendarMonth, setCalendarMonth, refresh } = usePraticien();
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [panelOpen, setPanelOpen] = useState(false);
  const [slotStart, setSlotStart] = useState("09:00");
  const [slotEnd, setSlotEnd] = useState("10:00");
  const [adding, setAdding] = useState(false);
  const [recurOpen, setRecurOpen] = useState(false);
  const [recurWeekday, setRecurWeekday] = useState(1);
  const [recurStart, setRecurStart] = useState("09:00");
  const [recurEnd, setRecurEnd] = useState("12:00");
  const [recurWeeks, setRecurWeeks] = useState(4);

  const y = calendarMonth.getFullYear();
  const m = calendarMonth.getMonth();

  const calendarDays = useMemo(() => {
    const first = new Date(y, m, 1);
    const last = new Date(y, m + 1, 0);
    const startPad = (first.getDay() + 6) % 7;
    const days: Array<{ date: string | null; label: number }> = [];
    for (let i = 0; i < startPad; i++) days.push({ date: null, label: 0 });
    for (let d = 1; d <= last.getDate(); d++) {
      days.push({
        date: `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`,
        label: d,
      });
    }
    return days;
  }, [y, m]);

  const creneauxByDate = useMemo(() => {
    const map = new Map<string, typeof creneaux>();
    for (const c of creneaux) {
      const list = map.get(c.date) ?? [];
      list.push(c);
      map.set(c.date, list);
    }
    return map;
  }, [creneaux]);

  const rdvByDate = useMemo(() => {
    const map = new Map<string, typeof prochainesSessions>();
    for (const s of prochainesSessions) {
      const list = map.get(s.date_session) ?? [];
      list.push(s);
      map.set(s.date_session, list);
    }
    return map;
  }, [prochainesSessions]);

  const openDay = (date: string) => {
    setSelectedDay(date);
    setPanelOpen(true);
  };

  const addCreneau = async () => {
    if (!selectedDay) return;
    setAdding(true);
    try {
      const res = await fetch("/api/marketplace/praticien/creneaux", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date: selectedDay, heure_debut: slotStart, heure_fin: slotEnd }),
      });
      const json = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(json.error ?? "Ajout impossible");
      toast.success("Créneau ajouté");
      await refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erreur");
    } finally {
      setAdding(false);
    }
  };

  const removeCreneau = async (id: string) => {
    try {
      const res = await fetch(`/api/marketplace/praticien/creneaux?id=${id}`, { method: "DELETE" });
      const json = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(json.error ?? "Suppression impossible");
      toast.success("Créneau supprimé");
      await refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erreur");
    }
  };

  const addRecurring = async () => {
    setAdding(true);
    try {
      const d = new Date();
      while (d.getDay() !== recurWeekday) {
        d.setDate(d.getDate() + 1);
      }
      let created = 0;
      for (let w = 0; w < recurWeeks; w++) {
        const date = d.toISOString().slice(0, 10);
        const res = await fetch("/api/marketplace/praticien/creneaux", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ date, heure_debut: recurStart, heure_fin: recurEnd }),
        });
        if (!res.ok) {
          const json = (await res.json()) as { error?: string };
          throw new Error(json.error ?? "Créneau récurrent impossible");
        }
        created++;
        d.setDate(d.getDate() + 7);
      }
      toast.success(`${created} créneaux ajoutés`);
      setRecurOpen(false);
      await refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erreur");
    } finally {
      setAdding(false);
    }
  };

  const dayCreneaux = selectedDay ? creneauxByDate.get(selectedDay) ?? [] : [];
  const dayRdv = selectedDay ? rdvByDate.get(selectedDay) ?? [] : [];

  return (
    <PageWrap title="Agenda" subtitle="Gérez vos créneaux et rendez-vous">
      <div className="flex flex-col gap-6 lg:flex-row">
        <Card className="flex-1">
          <div className="mb-4 flex items-center justify-between">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => {
                const d = new Date(calendarMonth);
                d.setMonth(d.getMonth() - 1);
                setCalendarMonth(d);
              }}
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <span className="font-medium capitalize">
              {calendarMonth.toLocaleDateString("fr-FR", { month: "long", year: "numeric" })}
            </span>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => {
                const d = new Date(calendarMonth);
                d.setMonth(d.getMonth() + 1);
                setCalendarMonth(d);
              }}
            >
              <ChevronRight className="h-5 w-5" />
            </Button>
          </div>
          <div className="grid grid-cols-7 gap-1 text-center text-xs text-slate-500">
            {["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"].map((d) => (
              <div key={d}>{d}</div>
            ))}
          </div>
          <div className="mt-2 grid grid-cols-7 gap-1">
            {calendarDays.map((cell, i) => {
              if (!cell.date) return <div key={`pad-${i}`} />;
              const slots = creneauxByDate.get(cell.date) ?? [];
              const rdvs = rdvByDate.get(cell.date) ?? [];
              const avail = slots.filter((s) => s.disponible).length;
              return (
                <button
                  key={cell.date}
                  type="button"
                  onClick={() => openDay(cell.date!)}
                  className={cn(
                    "relative aspect-square rounded-lg text-sm transition",
                    selectedDay === cell.date ? "bg-violet-600 text-white" : "bg-white/5 hover:bg-white/10",
                  )}
                >
                  {cell.label}
                  {avail > 0 && (
                    <span
                      className="absolute bottom-0.5 left-1/2 flex -translate-x-1/2 items-center gap-0.5"
                      title={`${avail} créneau${avail > 1 ? "x" : ""}`}
                    >
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                      <span className="text-[9px] font-semibold text-emerald-300">{avail}</span>
                    </span>
                  )}
                  {rdvs.length > 0 && (
                    <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-violet-500 px-1 text-[9px] font-bold">
                      {rdvs.length}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
          <Button type="button" variant="outline" className="mt-4 w-full border-white/15" onClick={() => setRecurOpen(true)}>
            Ajouter des créneaux récurrents
          </Button>
        </Card>

        {panelOpen && selectedDay && (
          <Card className="w-full lg:w-80 lg:shrink-0">
            <div className="flex items-center justify-between">
              <p className="font-semibold">{formatDateFr(selectedDay)}</p>
              <button type="button" onClick={() => setPanelOpen(false)} className="text-slate-400">
                <X className="h-4 w-4" />
              </button>
            </div>
            <ul className="mt-4 space-y-2">
              {dayCreneaux.map((c) => {
                const booked = !c.disponible;
                const rdv = dayRdv.find((r) => formatTime(r.heure_debut) === formatTime(c.heure_debut));
                return (
                  <li
                    key={c.id}
                    className={cn(
                      "rounded-lg border px-3 py-2 text-sm",
                      booked ? "border-violet-500/40 bg-violet-500/10" : "border-white/10",
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <span>
                        {formatTime(c.heure_debut)} – {formatTime(c.heure_fin)}
                      </span>
                      {c.disponible && (
                        <button type="button" className="text-red-400" onClick={() => void removeCreneau(c.id)}>
                          Supprimer
                        </button>
                      )}
                    </div>
                    {rdv && (
                      <p className="mt-1 text-xs text-violet-200">RDV confirmé — non supprimable</p>
                    )}
                    {booked && !rdv && (
                      <p className="mt-1 text-xs text-slate-400">Créneau réservé</p>
                    )}
                  </li>
                );
              })}
              {dayCreneaux.length === 0 && <p className="text-sm text-slate-500">Aucun créneau ce jour.</p>}
            </ul>
            <div className="mt-4 flex flex-wrap items-end gap-2 border-t border-white/10 pt-4">
              <div>
                <Label className="text-xs">Début</Label>
                <Input type="time" value={slotStart} onChange={(e) => setSlotStart(e.target.value)} className="mt-1 w-28 border-white/15 bg-slate-900" />
              </div>
              <div>
                <Label className="text-xs">Fin</Label>
                <Input type="time" value={slotEnd} onChange={(e) => setSlotEnd(e.target.value)} className="mt-1 w-28 border-white/15 bg-slate-900" />
              </div>
              <Button type="button" size="sm" disabled={adding} onClick={() => void addCreneau()} className="bg-violet-600">
                <Plus className="mr-1 h-4 w-4" />
                Ajouter
              </Button>
            </div>
          </Card>
        )}
      </div>

      {recurOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4">
          <Card className="w-full max-w-md">
            <h3 className="font-semibold">Créneaux récurrents</h3>
            <p className="mt-1 text-xs text-slate-400">Même jour chaque semaine pendant N semaines (mois affiché).</p>
            <div className="mt-4 space-y-3">
              <div>
                <Label>Jour</Label>
                <select
                  value={recurWeekday}
                  onChange={(e) => setRecurWeekday(Number(e.target.value))}
                  className="mt-1 w-full rounded-lg border border-white/15 bg-slate-900 px-3 py-2 text-sm"
                >
                  {["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"].map((d, i) => (
                    <option key={d} value={i}>
                      {d}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label>Début</Label>
                  <Input type="time" value={recurStart} onChange={(e) => setRecurStart(e.target.value)} className="mt-1 bg-slate-900" />
                </div>
                <div>
                  <Label>Fin</Label>
                  <Input type="time" value={recurEnd} onChange={(e) => setRecurEnd(e.target.value)} className="mt-1 bg-slate-900" />
                </div>
              </div>
              <div>
                <Label>Nombre de semaines</Label>
                <Input type="number" min={1} max={12} value={recurWeeks} onChange={(e) => setRecurWeeks(Number(e.target.value))} className="mt-1 bg-slate-900" />
              </div>
            </div>
            <div className="mt-4 flex gap-2">
              <Button type="button" variant="outline" className="flex-1" onClick={() => setRecurOpen(false)}>
                Annuler
              </Button>
              <Button type="button" className="flex-1 bg-violet-600" disabled={adding} onClick={() => void addRecurring()}>
                Créer
              </Button>
            </div>
          </Card>
        </div>
      )}
    </PageWrap>
  );
}
