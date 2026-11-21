"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import {
  WEEK_TYPE_COLORS,
  WEEK_TYPE_LABELS,
  isAlternanceWeekType,
  listWeekStarts,
  startOfIsoWeek,
  toIsoDate,
  type AlternanceWeekType,
} from "@/lib/apprenant/alternance-planning";
import { cn } from "@/lib/utils";

const CYCLE: AlternanceWeekType[] = ["school", "company", "holiday", "exam"];

type Props = {
  classId: string;
};

type WeekRow = { week_starts_on: string; week_type: AlternanceWeekType };

export function AlternanceCalendarEditor({ classId }: Props) {
  const [loading, setLoading] = useState(true);
  const [startsOn, setStartsOn] = useState("");
  const [endsOn, setEndsOn] = useState("");
  const [titleLabel, setTitleLabel] = useState("");
  const [specialtyLabel, setSpecialtyLabel] = useState("");
  const [weeks, setWeeks] = useState<WeekRow[]>([]);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/dashboard/ecole/classes/${classId}/alternance-calendar`, {
        credentials: "include",
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Chargement impossible");
      setStartsOn(json.class?.formation_starts_on ?? "");
      setEndsOn(json.class?.formation_ends_on ?? "");
      setTitleLabel(json.class?.title_label ?? "");
      setSpecialtyLabel(json.class?.specialty_label ?? "");
      setWeeks(
        (json.weeks ?? [])
          .map((w: { week_starts_on: string; week_type: string }) => ({
            week_starts_on: String(w.week_starts_on),
            week_type: w.week_type,
          }))
          .filter((w: WeekRow) => isAlternanceWeekType(w.week_type)),
      );
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erreur");
    } finally {
      setLoading(false);
    }
  }, [classId]);

  useEffect(() => {
    void load();
  }, [load]);

  const byWeek = useMemo(() => {
    const map = new Map<string, AlternanceWeekType>();
    for (const w of weeks) map.set(w.week_starts_on, w.week_type);
    return map;
  }, [weeks]);

  const gridWeeks = useMemo(() => {
    if (!startsOn || !endsOn) return [] as string[];
    return listWeekStarts(startsOn, endsOn);
  }, [startsOn, endsOn]);

  const saveMeta = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/dashboard/ecole/classes/${classId}/alternance-calendar`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "update_meta",
          formation_starts_on: startsOn || null,
          formation_ends_on: endsOn || null,
          title_label: titleLabel || null,
          specialty_label: specialtyLabel || null,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Enregistrement impossible");
      toast.success("Dates et libellés enregistrés");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erreur");
    } finally {
      setSaving(false);
    }
  };

  const cycleWeek = async (weekStartsOn: string) => {
    const current = byWeek.get(weekStartsOn) ?? "company";
    const idx = CYCLE.indexOf(current);
    const next = CYCLE[(idx + 1) % CYCLE.length]!;
    setWeeks((prev) => {
      const others = prev.filter((w) => w.week_starts_on !== weekStartsOn);
      return [...others, { week_starts_on: weekStartsOn, week_type: next }].sort((a, b) =>
        a.week_starts_on.localeCompare(b.week_starts_on),
      );
    });
    const res = await fetch(`/api/dashboard/ecole/classes/${classId}/alternance-calendar`, {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "set_week",
        week_starts_on: weekStartsOn,
        week_type: next,
      }),
    });
    if (!res.ok) {
      const json = await res.json().catch(() => ({}));
      toast.error(json.error || "Mise à jour impossible");
      void load();
    }
  };

  const fillPattern = async () => {
    if (!startsOn || !endsOn) {
      toast.error("Renseigne le début et la fin de l'année");
      return;
    }
    setSaving(true);
    try {
      const from = toIsoDate(startOfIsoWeek(new Date(startsOn + "T12:00:00")));
      const res = await fetch(`/api/dashboard/ecole/classes/${classId}/alternance-calendar`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "fill_pattern",
          from_week_starts_on: from,
          until_ends_on: endsOn,
          school_weeks: 1,
          company_weeks: 3,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Remplissage impossible");
      toast.success(`Motif appliqué (${json.count} semaines)`);
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erreur");
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="rounded-3xl border border-[#E5E5EA] bg-white p-6 shadow-sm md:p-8">
      <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#86868B]">
            Calendrier d'alternance
          </p>
          <h2 className="mt-1 text-xl font-semibold text-[#1D1D1F]">Année de formation</h2>
          <p className="mt-1 text-sm text-[#86868B]">
            Une case = une semaine. Clique pour changer le type (école → entreprise → vacances → examens).
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {(Object.keys(WEEK_TYPE_LABELS) as AlternanceWeekType[]).map((t) => (
            <span key={t} className="inline-flex items-center gap-1.5 text-xs text-[#6C7593]">
              <span className="h-2.5 w-2.5 rounded-[3px]" style={{ background: WEEK_TYPE_COLORS[t] }} />
              {WEEK_TYPE_LABELS[t]}
            </span>
          ))}
        </div>
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <label className="space-y-1 text-sm">
          <span className="text-[#86868B]">Début</span>
          <input
            type="date"
            value={startsOn}
            onChange={(e) => setStartsOn(e.target.value)}
            className="w-full rounded-xl border border-[#E5E5EA] px-3 py-2"
          />
        </label>
        <label className="space-y-1 text-sm">
          <span className="text-[#86868B]">Fin</span>
          <input
            type="date"
            value={endsOn}
            onChange={(e) => setEndsOn(e.target.value)}
            className="w-full rounded-xl border border-[#E5E5EA] px-3 py-2"
          />
        </label>
        <label className="space-y-1 text-sm">
          <span className="text-[#86868B]">Titre (ex. Titre pro NTC)</span>
          <input
            value={titleLabel}
            onChange={(e) => setTitleLabel(e.target.value)}
            className="w-full rounded-xl border border-[#E5E5EA] px-3 py-2"
          />
        </label>
        <label className="space-y-1 text-sm">
          <span className="text-[#86868B]">Spécialité</span>
          <input
            value={specialtyLabel}
            onChange={(e) => setSpecialtyLabel(e.target.value)}
            className="w-full rounded-xl border border-[#E5E5EA] px-3 py-2"
          />
        </label>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          disabled={saving || loading}
          onClick={() => void saveMeta()}
          className="rounded-full bg-[#1D1D1F] px-4 py-2 text-xs font-semibold text-white disabled:opacity-50"
        >
          Enregistrer les dates
        </button>
        <button
          type="button"
          disabled={saving || loading || !startsOn || !endsOn}
          onClick={() => void fillPattern()}
          className="rounded-full border border-[#E5E5EA] px-4 py-2 text-xs font-semibold text-[#1D1D1F] disabled:opacity-50"
        >
          Motif 1 école / 3 entreprise
        </button>
      </div>

      {loading ? (
        <p className="mt-6 text-sm text-[#86868B]">Chargement…</p>
      ) : gridWeeks.length === 0 ? (
        <p className="mt-6 text-sm text-[#86868B]">
          Définis le début et la fin de l'année, puis applique un motif ou clique semaine par semaine.
        </p>
      ) : (
        <div className="mt-6 flex flex-wrap gap-1.5">
          {gridWeeks.map((w) => {
            const type = byWeek.get(w) ?? "company";
            return (
              <button
                key={w}
                type="button"
                title={`Semaine du ${w} · ${WEEK_TYPE_LABELS[type]}`}
                onClick={() => void cycleWeek(w)}
                className={cn(
                  "h-[22px] min-w-[18px] flex-1 rounded-[5px] transition hover:opacity-90",
                )}
                style={{ background: WEEK_TYPE_COLORS[type] }}
              />
            );
          })}
        </div>
      )}
    </section>
  );
}
