"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";

import { formatWeekRangeLabel, hoursBetween } from "@/lib/ecole/planning-utils";
import { cn } from "@/lib/utils";

type Year = { id: string; label: string; is_current?: boolean };
type SchoolClass = { id: string; name: string; promotion?: string | null; curriculum_id?: string | null };
type Module = {
  id: string;
  name: string;
  code?: string | null;
  class_id?: string | null;
  planned_hours_total: number;
  hours_planned?: number;
  hours_remaining?: number;
  curriculum_module_id?: string | null;
};
type CurriculumPanel = {
  id: string;
  name: string;
  code?: string | null;
  modules: Array<{
    curriculum_module_id: string;
    planning_module_id: string | null;
    name: string;
    planned_hours_total: number;
    hours_planned: number;
    hours_remaining: number;
  }>;
};
type Instructor = {
  id: string;
  first_name?: string | null;
  last_name?: string | null;
  full_name?: string | null;
  email?: string | null;
  expertise?: string[] | null;
  hours_assigned?: number;
  availability?: Record<string, unknown> | null;
};
type Slot = {
  id: string;
  class_id: string;
  module_id?: string | null;
  instructor_id?: string | null;
  starts_at: string;
  ends_at: string;
  duration_hours: number;
  status?: string;
  event_type?: string;
  title?: string | null;
};

const EVENT_TYPES = [
  { id: "course", label: "Cours", icon: "📘" },
  { id: "outing", label: "Sortie", icon: "🚌" },
  { id: "masterclass", label: "Masterclass", icon: "🎤" },
  { id: "elearning", label: "Elearning", icon: "💻" },
  { id: "exam", label: "Examen", icon: "📝" },
] as const;

const EVENT_ACCENT: Record<string, string> = {
  course: "border-[#3D7BFF]/25 bg-[#3D7BFF]/10",
  outing: "border-emerald-500/25 bg-emerald-500/10",
  masterclass: "border-violet-500/25 bg-violet-500/10",
  elearning: "border-sky-500/25 bg-sky-500/10",
  exam: "border-amber-500/25 bg-amber-500/10",
};

function personName(p?: Instructor | null) {
  if (!p) return "—";
  return (
    String(p.full_name ?? "").trim() ||
    `${String(p.first_name ?? "").trim()} ${String(p.last_name ?? "").trim()}`.trim() ||
    String(p.email ?? "").trim() ||
    "—"
  );
}

function startOfWeek(d: Date) {
  const x = new Date(d);
  const day = (x.getDay() + 6) % 7;
  x.setDate(x.getDate() - day);
  x.setHours(0, 0, 0, 0);
  return x;
}

const HOURS = Array.from({ length: 12 }, (_, i) => i + 8); // 8 → 19

export function EcolePlanningClient() {
  const searchParams = useSearchParams();
  const cursusFromUrl = searchParams.get("cursus") || searchParams.get("curriculumId") || "";
  const [loading, setLoading] = useState(true);
  const [years, setYears] = useState<Year[]>([]);
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [modules, setModules] = useState<Module[]>([]);
  const [curricula, setCurricula] = useState<CurriculumPanel[]>([]);
  const [selectedCurriculumId, setSelectedCurriculumId] = useState(cursusFromUrl);
  const [instructors, setInstructors] = useState<Instructor[]>([]);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [yearId, setYearId] = useState("");
  const [classId, setClassId] = useState("");
  const [instructorId, setInstructorId] = useState("");
  const [moduleFilter, setModuleFilter] = useState("");
  const [cursor, setCursor] = useState(() => new Date());
  const [tab, setTab] = useState<"semaine" | "volumes" | "formateurs">("semaine");
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [eventStep, setEventStep] = useState<"type" | "form">("type");
  const [dragSelect, setDragSelect] = useState<{
    dayIdx: number;
    startHour: number;
    endHour: number;
  } | null>(null);
  const [draggingSlotId, setDraggingSlotId] = useState<string | null>(null);
  const [form, setForm] = useState({
    event_type: "course",
    title: "",
    class_id: "",
    module_id: "",
    instructor_id: "",
    location_text: "",
    description: "",
    thematic: "",
    external_speaker: "",
    exam_kind: "",
    date: "",
    start: "09:00",
    end: "12:00",
  });

  useEffect(() => {
    if (cursusFromUrl) setSelectedCurriculumId(cursusFromUrl);
  }, [cursusFromUrl]);

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
    setError(null);
    const from = new Date(weekStart);
    const to = new Date(weekStart);
    to.setDate(to.getDate() + 7);
    const qs = new URLSearchParams();
    if (yearId) qs.set("yearId", yearId);
    if (classId) qs.set("classId", classId);
    if (instructorId) qs.set("instructorId", instructorId);
    if (moduleFilter) qs.set("moduleId", moduleFilter);
    if (selectedCurriculumId) qs.set("curriculumId", selectedCurriculumId);
    qs.set("from", from.toISOString());
    qs.set("to", to.toISOString());
    try {
      const res = await fetch(`/api/dashboard/ecole/planning?${qs.toString()}`, { credentials: "include" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Erreur chargement");
      setYears(json.years ?? []);
      setClasses(json.classes ?? []);
      setModules(json.modules ?? []);
      setCurricula(json.curricula ?? []);
      setInstructors((json.instructors ?? []).filter(Boolean));
      setSlots(json.slots ?? []);
      if (!yearId && (json.years ?? []).length) {
        const current = (json.years as Year[]).find((y) => y.is_current) ?? json.years[0];
        if (current?.id) setYearId(current.id);
      }
      if (selectedCurriculumId && !classId) {
        const linked = (json.classes as SchoolClass[] | undefined)?.find(
          (c) => String(c.curriculum_id ?? "") === selectedCurriculumId,
        );
        if (linked?.id) setClassId(linked.id);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur");
    } finally {
      setLoading(false);
    }
  }, [yearId, classId, instructorId, moduleFilter, selectedCurriculumId, weekStart]);

  useEffect(() => {
    void load();
  }, [load]);

  const ensureYear = async () => {
    await fetch("/api/dashboard/ecole/planning", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ action: "ensure_year", label: "2027-2028", is_current: true }),
    });
    await load();
  };

  const openCreateFromSelection = (day: Date, startHour: number, endHour: number) => {
    const startH = Math.min(startHour, endHour);
    const endH = Math.max(startHour, endHour) + 1;
    setForm((f) => ({
      ...f,
      event_type: "course",
      class_id: classId || classes[0]?.id || "",
      module_id: modules[0]?.id || "",
      date: day.toISOString().slice(0, 10),
      start: `${String(startH).padStart(2, "0")}:00`,
      end: `${String(Math.min(endH, 20)).padStart(2, "0")}:00`,
      title: "",
    }));
    setEventStep("type");
    setModalOpen(true);
    setDragSelect(null);
  };

  const createSlot = async () => {
    setError(null);
    const starts = new Date(`${form.date}T${form.start}:00`);
    const ends = new Date(`${form.date}T${form.end}:00`);
    const res = await fetch("/api/dashboard/ecole/planning", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        event_type: form.event_type,
        title: form.title || null,
        class_id: form.class_id,
        module_id: form.event_type === "course" || form.event_type === "exam" ? form.module_id : null,
        instructor_id: form.instructor_id || null,
        school_year_id: yearId || null,
        location_text: form.location_text || null,
        description: form.description || null,
        thematic: form.thematic || null,
        external_speaker: form.external_speaker || null,
        exam_kind: form.exam_kind || null,
        starts_at: starts.toISOString(),
        ends_at: ends.toISOString(),
      }),
    });
    const json = await res.json();
    if (!res.ok) {
      const msg =
        json.conflicts?.[0]?.message ||
        json.error ||
        "Impossible de créer le créneau";
      setError(msg);
      return;
    }
    setModalOpen(false);
    await load();
  };

  const deleteSlot = async (id: string) => {
    await fetch(`/api/dashboard/ecole/planning/slots/${id}`, { method: "DELETE", credentials: "include" });
    await load();
  };

  const moduleById = useMemo(() => new Map(modules.map((m) => [m.id, m])), [modules]);
  const classById = useMemo(() => new Map(classes.map((c) => [c.id, c])), [classes]);
  const instructorById = useMemo(() => new Map(instructors.map((i) => [i.id, i])), [instructors]);
  const activeCurriculum = useMemo(
    () => curricula.find((c) => c.id === selectedCurriculumId) ?? null,
    [curricula, selectedCurriculumId],
  );

  return (
    <div className="mx-auto max-w-[1400px] space-y-6 px-4 py-8 sm:px-6">
      <header className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">École</p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-900">Planning</h1>
          <p className="mt-2 max-w-2xl text-sm text-slate-500">
            Construisez les emplois du temps, pilotez les volumes horaires et synchronisez automatiquement le planning des apprenants.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => void ensureYear()}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Année 2027-2028
          </button>
          <button
            type="button"
            onClick={() => {
              setForm((f) => ({
                ...f,
                class_id: classId || classes[0]?.id || "",
                module_id: modules[0]?.id || "",
                date: weekDays[0]?.toISOString().slice(0, 10) || "",
                start: "09:00",
                end: "12:00",
              }));
              setEventStep("type");
              setModalOpen(true);
            }}
            className="inline-flex items-center gap-2 rounded-xl bg-[#3D7BFF] px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-[#2f6ae8]"
          >
            <Plus className="h-4 w-4" />
            Ajouter un cours
          </button>
        </div>
      </header>

      {curricula.length > 0 ? (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">Cursus</span>
          <button
            type="button"
            onClick={() => setSelectedCurriculumId("")}
            className={cn(
              "rounded-full px-3 py-1 text-xs font-semibold",
              !selectedCurriculumId ? "bg-slate-900 text-white" : "bg-white text-slate-600 ring-1 ring-slate-200",
            )}
          >
            Tous
          </button>
          {curricula.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => setSelectedCurriculumId(c.id)}
              className={cn(
                "rounded-full px-3 py-1 text-xs font-semibold",
                selectedCurriculumId === c.id
                  ? "bg-[#3D7BFF] text-white"
                  : "bg-white text-slate-600 ring-1 ring-slate-200",
              )}
            >
              {c.name}
            </button>
          ))}
        </div>
      ) : null}

      {activeCurriculum ? (
        <div className="rounded-2xl bg-white px-4 py-4 shadow-[0_1px_3px_rgba(0,0,0,0.04)] ring-1 ring-black/[0.04]">
          <p className="text-sm font-bold text-slate-900">{activeCurriculum.name}</p>
          <p className="mt-1 text-xs text-slate-400">Modules à placer — sélectionnez puis créez un créneau dans la grille</p>
          <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {activeCurriculum.modules.map((m) => (
              <button
                key={m.curriculum_module_id}
                type="button"
                onClick={() => {
                  if (m.planning_module_id) {
                    setModuleFilter(m.planning_module_id);
                    setForm((f) => ({ ...f, module_id: m.planning_module_id || f.module_id }));
                  }
                }}
                className={cn(
                  "rounded-xl px-3 py-3 text-left transition ring-1",
                  moduleFilter === m.planning_module_id
                    ? "bg-[#3D7BFF]/08 ring-[#3D7BFF]/30"
                    : "bg-slate-50 ring-transparent hover:bg-slate-100",
                )}
              >
                <p className="text-sm font-semibold text-slate-900">{m.name}</p>
                <p className="mt-1 text-xs text-slate-500">
                  {m.hours_planned} / {m.planned_hours_total} h planifiées
                </p>
                <p className="text-xs font-semibold text-[#3D7BFF]">{m.hours_remaining} h restantes</p>
              </button>
            ))}
          </div>
        </div>
      ) : null}

      <div className="flex flex-wrap gap-2">
        {(
          [
            ["semaine", "Semaine"],
            ["volumes", "Volumes"],
            ["formateurs", "Formateurs"],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={cn(
              "rounded-full px-3 py-1.5 text-sm font-medium",
              tab === id ? "bg-slate-900 text-white" : "bg-white text-slate-600 ring-1 ring-slate-200",
            )}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:grid-cols-4">
        <label className="text-sm">
          <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-400">Année</span>
          <select className="w-full rounded-xl border border-slate-200 px-3 py-2" value={yearId} onChange={(e) => setYearId(e.target.value)}>
            <option value="">Toutes</option>
            {years.map((y) => (
              <option key={y.id} value={y.id}>
                {y.label}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm">
          <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-400">Classe</span>
          <select className="w-full rounded-xl border border-slate-200 px-3 py-2" value={classId} onChange={(e) => setClassId(e.target.value)}>
            <option value="">Toutes</option>
            {classes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm">
          <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-400">Formateur</span>
          <select
            className="w-full rounded-xl border border-slate-200 px-3 py-2"
            value={instructorId}
            onChange={(e) => setInstructorId(e.target.value)}
          >
            <option value="">Tous</option>
            {instructors.map((i) => (
              <option key={i.id} value={i.id}>
                {personName(i)}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm">
          <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-400">Cours</span>
          <select
            className="w-full rounded-xl border border-slate-200 px-3 py-2"
            value={moduleFilter}
            onChange={(e) => setModuleFilter(e.target.value)}
          >
            <option value="">Tous</option>
            {modules.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>
        </label>
      </div>

      {error ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">{error}</div>
      ) : null}

      {tab === "semaine" ? (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <button type="button" className="rounded-xl border border-slate-200 bg-white p-2" onClick={() => setCursor((d) => new Date(d.getTime() - 7 * 86400000))}>
              <ChevronLeft className="h-4 w-4" />
            </button>
            <div className="text-center">
              <p className="text-sm font-semibold text-slate-900">{formatWeekRangeLabel(cursor)}</p>
              <button type="button" className="mt-1 text-xs font-medium text-[#3D7BFF]" onClick={() => setCursor(new Date())}>
                Aujourd’hui
              </button>
            </div>
            <button type="button" className="rounded-xl border border-slate-200 bg-white p-2" onClick={() => setCursor((d) => new Date(d.getTime() + 7 * 86400000))}>
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="grid min-w-[900px] grid-cols-[64px_repeat(5,1fr)]">
              <div className="border-b border-slate-100 p-2" />
              {weekDays.map((d) => (
                <div key={d.toISOString()} className="border-b border-l border-slate-100 p-3 text-center text-xs font-semibold uppercase tracking-wide text-slate-500">
                  {d.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "short" })}
                </div>
              ))}
              {HOURS.map((hour) => (
                <div key={`row-${hour}`} className="contents">
                  <div className="border-b border-slate-50 px-2 py-6 text-right text-[11px] text-slate-400">{hour}:00</div>
                  {weekDays.map((day, dayIdx) => {
                    const daySlots = slots.filter((s) => {
                      const st = new Date(s.starts_at);
                      return (
                        st.getFullYear() === day.getFullYear() &&
                        st.getMonth() === day.getMonth() &&
                        st.getDate() === day.getDate() &&
                        st.getHours() === hour
                      );
                    });
                    const selected =
                      dragSelect &&
                      dragSelect.dayIdx === dayIdx &&
                      hour >= Math.min(dragSelect.startHour, dragSelect.endHour) &&
                      hour <= Math.max(dragSelect.startHour, dragSelect.endHour);
                    return (
                      <div
                        key={`${day.toISOString()}-${hour}`}
                        className={cn(
                          "relative min-h-[72px] border-b border-l border-slate-50 p-1",
                          selected && "bg-[#3D7BFF]/10",
                        )}
                        onMouseDown={(e) => {
                          if ((e.target as HTMLElement).closest("button[data-slot]")) return;
                          setDragSelect({ dayIdx, startHour: hour, endHour: hour });
                        }}
                        onMouseEnter={() => {
                          if (!dragSelect || dragSelect.dayIdx !== dayIdx) return;
                          setDragSelect({ ...dragSelect, endHour: hour });
                        }}
                        onMouseUp={() => {
                          if (!dragSelect || dragSelect.dayIdx !== dayIdx) return;
                          openCreateFromSelection(day, dragSelect.startHour, dragSelect.endHour);
                        }}
                        onDragOver={(e) => {
                          if (draggingSlotId) e.preventDefault();
                        }}
                        onDrop={async (e) => {
                          e.preventDefault();
                          if (!draggingSlotId) return;
                          const slot = slots.find((s) => s.id === draggingSlotId);
                          if (!slot) return;
                          const durH = Number(slot.duration_hours ?? 1);
                          const starts = new Date(day);
                          starts.setHours(hour, 0, 0, 0);
                          const ends = new Date(starts.getTime() + durH * 3600000);
                          const res = await fetch(`/api/dashboard/ecole/planning/slots/${draggingSlotId}`, {
                            method: "PATCH",
                            headers: { "Content-Type": "application/json" },
                            credentials: "include",
                            body: JSON.stringify({
                              starts_at: starts.toISOString(),
                              ends_at: ends.toISOString(),
                            }),
                          });
                          setDraggingSlotId(null);
                          if (!res.ok) {
                            const json = await res.json();
                            setError(json.conflicts?.[0]?.message || json.error || "Déplacement impossible");
                            return;
                          }
                          await load();
                        }}
                      >
                        {daySlots.map((s) => {
                          const mod = s.module_id ? moduleById.get(s.module_id) : null;
                          const cls = classById.get(s.class_id);
                          const inst = s.instructor_id ? instructorById.get(s.instructor_id) : null;
                          const et = s.event_type || "course";
                          const label =
                            s.title ||
                            mod?.name ||
                            EVENT_TYPES.find((t) => t.id === et)?.label ||
                            "Événement";
                          return (
                            <button
                              key={s.id}
                              type="button"
                              data-slot
                              draggable
                              onDragStart={() => setDraggingSlotId(s.id)}
                              onDragEnd={() => setDraggingSlotId(null)}
                              title={`${label} · ${cls?.name ?? ""} · ${personName(inst)}`}
                              onClick={() => {
                                if (confirm("Supprimer / annuler ce créneau ?")) {
                                  void deleteSlot(s.id);
                                }
                              }}
                              className={cn(
                                "mb-1 w-full rounded-xl border px-2 py-2 text-left hover:opacity-90",
                                EVENT_ACCENT[et] ?? EVENT_ACCENT.course,
                              )}
                            >
                              <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                                {EVENT_TYPES.find((t) => t.id === et)?.label ?? "Cours"}
                              </p>
                              <p className="text-[11px] font-semibold text-slate-900">
                                {new Date(s.starts_at).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                                {" — "}
                                {new Date(s.ends_at).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                              </p>
                              <p className="mt-0.5 text-[12px] font-bold text-slate-800">{label}</p>
                              <p className="text-[10px] text-slate-500">
                                {cls?.name ?? "Classe"} · {personName(inst)} · {s.duration_hours} h
                              </p>
                            </button>
                          );
                        })}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
          {loading ? <p className="text-sm text-slate-400">Chargement…</p> : null}
        </section>
      ) : null}

      {tab === "volumes" ? (
        <section className="space-y-3">
          {modules.map((m) => {
            const total = Number(m.planned_hours_total ?? 0);
            const planned = Number(m.hours_planned ?? 0);
            const remaining = Number(m.hours_remaining ?? total - planned);
            const pct = total > 0 ? Math.min(100, Math.round((planned / total) * 100)) : 0;
            return (
              <div key={m.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-bold text-slate-900">{m.name}</p>
                    <p className="mt-1 text-xs text-slate-500">
                      {total} h prévues · {planned} h planifiées · {remaining} h restantes
                    </p>
                  </div>
                  <span className="text-xs font-semibold text-slate-500">{pct} %</span>
                </div>
                <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100">
                  <div className="h-full rounded-full bg-[#3D7BFF]" style={{ width: `${pct}%` }} />
                </div>
              </div>
            );
          })}
          {modules.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-8 text-center">
              <p className="text-sm text-slate-500">Aucun module pédagogique pour l’instant.</p>
              <button
                type="button"
                className="mt-4 rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white"
                onClick={async () => {
                  const name = window.prompt("Nom du cours / module ?", "Prospection commerciale");
                  if (!name) return;
                  const hours = Number(window.prompt("Volume horaire total prévu ?", "42") || "42");
                  await fetch("/api/dashboard/ecole/planning", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    credentials: "include",
                    body: JSON.stringify({
                      action: "create_module",
                      name,
                      planned_hours_total: hours,
                      class_id: classId || null,
                      school_year_id: yearId || null,
                    }),
                  });
                  await load();
                }}
              >
                Créer un premier module
              </button>
            </div>
          ) : null}
        </section>
      ) : null}

      {tab === "formateurs" ? (
        <section className="grid gap-3 md:grid-cols-2">
          {instructors.map((inst) => {
            const mine = slots.filter((s) => s.instructor_id === inst.id);
            const hours = mine.reduce((a, s) => a + Number(s.duration_hours ?? 0), 0);
            return (
              <div key={inst.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <p className="text-sm font-bold text-slate-900">{personName(inst)}</p>
                <p className="mt-1 text-xs text-slate-500">
                  {mine.length} créneau(x) · {hours} h sur la fenêtre affichée
                </p>
                <ul className="mt-3 space-y-1">
                  {mine.slice(0, 5).map((s) => (
                    <li key={s.id} className="text-xs text-slate-600">
                      {moduleById.get(s.module_id)?.name} — {classById.get(s.class_id)?.name}
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </section>
      ) : null}

      {modalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-xl">
            {eventStep === "type" ? (
              <>
                <h2 className="text-lg font-bold text-slate-900">Que souhaitez-vous planifier ?</h2>
                <p className="mt-1 text-xs text-slate-500">
                  {form.date} · {form.start} — {form.end} ·{" "}
                  {hoursBetween(`${form.date}T${form.start}:00`, `${form.date}T${form.end}:00`)} h
                </p>
                <div className="mt-4 grid grid-cols-2 gap-2">
                  {EVENT_TYPES.map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => {
                        setForm((f) => ({ ...f, event_type: t.id }));
                        setEventStep("form");
                      }}
                      className="rounded-2xl border border-slate-200 px-3 py-4 text-left hover:border-[#3D7BFF]/40 hover:bg-[#3D7BFF]/5"
                    >
                      <span className="text-lg">{t.icon}</span>
                      <span className="mt-1 block text-sm font-bold text-slate-900">{t.label}</span>
                    </button>
                  ))}
                </div>
                <button type="button" className="mt-4 text-sm text-slate-500" onClick={() => setModalOpen(false)}>
                  Annuler
                </button>
              </>
            ) : (
              <>
                <h2 className="text-lg font-bold text-slate-900">
                  {EVENT_TYPES.find((t) => t.id === form.event_type)?.label ?? "Créneau"}
                </h2>
                <p className="mt-1 text-xs text-slate-500">
                  Durée : {hoursBetween(`${form.date}T${form.start}:00`, `${form.date}T${form.end}:00`)} h
                </p>
                <div className="mt-4 space-y-3">
                  {form.event_type !== "course" ? (
                    <input
                      className="w-full rounded-xl border px-3 py-2 text-sm"
                      placeholder="Titre"
                      value={form.title}
                      onChange={(e) => setForm({ ...form, title: e.target.value })}
                    />
                  ) : null}
                  <select className="w-full rounded-xl border px-3 py-2 text-sm" value={form.class_id} onChange={(e) => setForm({ ...form, class_id: e.target.value })}>
                    <option value="">Classe</option>
                    {classes.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                  {(form.event_type === "course" || form.event_type === "exam") ? (
                    <select className="w-full rounded-xl border px-3 py-2 text-sm" value={form.module_id} onChange={(e) => setForm({ ...form, module_id: e.target.value })}>
                      <option value="">Module / matière</option>
                      {modules.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.name} ({m.hours_planned ?? 0}/{m.planned_hours_total} h)
                        </option>
                      ))}
                    </select>
                  ) : null}
                  <select
                    className="w-full rounded-xl border px-3 py-2 text-sm"
                    value={form.instructor_id}
                    onChange={(e) => setForm({ ...form, instructor_id: e.target.value })}
                  >
                    <option value="">Formateur / Expert</option>
                    {instructors.map((i) => (
                      <option key={i.id} value={i.id}>
                        {personName(i)}
                        {i.expertise?.length ? ` · ${i.expertise.slice(0, 2).join(", ")}` : ""}
                        {typeof i.hours_assigned === "number" ? ` · ${i.hours_assigned} h` : ""}
                      </option>
                    ))}
                  </select>
                  {form.event_type === "masterclass" ? (
                    <>
                      <input className="w-full rounded-xl border px-3 py-2 text-sm" placeholder="Thématique" value={form.thematic} onChange={(e) => setForm({ ...form, thematic: e.target.value })} />
                      <input className="w-full rounded-xl border px-3 py-2 text-sm" placeholder="Intervenant externe (optionnel)" value={form.external_speaker} onChange={(e) => setForm({ ...form, external_speaker: e.target.value })} />
                    </>
                  ) : null}
                  {form.event_type === "outing" || form.event_type === "masterclass" ? (
                    <input className="w-full rounded-xl border px-3 py-2 text-sm" placeholder="Lieu" value={form.location_text} onChange={(e) => setForm({ ...form, location_text: e.target.value })} />
                  ) : null}
                  {form.event_type === "exam" ? (
                    <input className="w-full rounded-xl border px-3 py-2 text-sm" placeholder="Type d’évaluation" value={form.exam_kind} onChange={(e) => setForm({ ...form, exam_kind: e.target.value })} />
                  ) : null}
                  {form.event_type === "outing" || form.event_type === "elearning" ? (
                    <textarea className="w-full rounded-xl border px-3 py-2 text-sm" placeholder="Description" rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
                  ) : null}
                  <input type="date" className="w-full rounded-xl border px-3 py-2 text-sm" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
                  <div className="grid grid-cols-2 gap-2">
                    <input type="time" className="rounded-xl border px-3 py-2 text-sm" value={form.start} onChange={(e) => setForm({ ...form, start: e.target.value })} />
                    <input type="time" className="rounded-xl border px-3 py-2 text-sm" value={form.end} onChange={(e) => setForm({ ...form, end: e.target.value })} />
                  </div>
                </div>
                <div className="mt-5 flex justify-between gap-2">
                  <button type="button" className="rounded-xl px-3 py-2 text-sm text-slate-600" onClick={() => setEventStep("type")}>
                    ← Type
                  </button>
                  <div className="flex gap-2">
                    <button type="button" className="rounded-xl px-3 py-2 text-sm text-slate-600" onClick={() => setModalOpen(false)}>
                      Annuler
                    </button>
                    <button
                      type="button"
                      className="rounded-xl bg-[#3D7BFF] px-4 py-2 text-sm font-semibold text-white"
                      onClick={() => void createSlot()}
                    >
                      Valider
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
