"use client";

import { useEffect, useMemo, useState } from "react";
import { Plus, Pencil, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { formatDealAmount } from "@/lib/crm/pipeline-shared";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export type TrainingCourseOption = {
  id: string;
  title: string;
  domain: string | null;
  intra_price: number | null;
  inter_price: number | null;
  duration: string | null;
  is_active: boolean | null;
};

function parsePrice(raw: unknown): number {
  if (typeof raw === "number" && Number.isFinite(raw)) return raw;
  if (typeof raw === "string" && raw.trim()) {
    const n = Number.parseFloat(raw.replace(",", "."));
    return Number.isFinite(n) ? n : 0;
  }
  return 0;
}

function computeTotalCents(courses: TrainingCourseOption[], ids: string[]): number {
  return courses
    .filter((c) => ids.includes(c.id))
    .reduce((sum, c) => {
      const price = parsePrice(c.intra_price) || parsePrice(c.inter_price);
      return sum + Math.round(price * 100);
    }, 0);
}

function useTrainingCourses() {
  const [courses, setCourses] = useState<TrainingCourseOption[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const res = await fetch("/api/super/training-courses");
        const json = await res.json();
        if (!res.ok) throw new Error(json.error ?? "Chargement impossible");
        if (!cancelled) {
          setCourses(
            (json.courses ?? [])
              .filter((c: TrainingCourseOption) => c.is_active !== false)
              .map((c: TrainingCourseOption) => ({
                id: c.id,
                title: c.title,
                domain: c.domain,
                intra_price: c.intra_price,
                inter_price: c.inter_price,
                duration: c.duration,
                is_active: c.is_active,
              })),
          );
        }
      } catch {
        if (!cancelled) setCourses([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return { courses, loading };
}

function FormationPickerModal({
  open,
  onOpenChange,
  courses,
  loading,
  selectedIds,
  onChange,
  onTotalChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  courses: TrainingCourseOption[];
  loading: boolean;
  selectedIds: string[];
  onChange: (ids: string[]) => void;
  onTotalChange?: (totalCents: number) => void;
}) {
  const [query, setQuery] = useState("");
  const [domainFilter, setDomainFilter] = useState<string>("all");

  const domains = useMemo(() => {
    const set = new Set<string>();
    for (const c of courses) {
      if (c.domain?.trim()) set.add(c.domain.trim());
    }
    return Array.from(set).sort();
  }, [courses]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return courses.filter((c) => {
      if (domainFilter !== "all" && (c.domain ?? "") !== domainFilter) return false;
      if (!q) return true;
      return c.title.toLowerCase().includes(q) || (c.domain ?? "").toLowerCase().includes(q);
    });
  }, [courses, query, domainFilter]);

  const toggle = (id: string) => {
    const nextIds = selectedIds.includes(id)
      ? selectedIds.filter((x) => x !== id)
      : [...selectedIds, id];
    onChange(nextIds);
    onTotalChange?.(computeTotalCents(courses, nextIds));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[85vh] max-w-lg flex-col gap-4">
        <DialogHeader>
          <DialogTitle>Ajouter une formation</DialogTitle>
        </DialogHeader>

        <div className="space-y-2">
          <input
            type="search"
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
            placeholder="Rechercher par titre ou domaine…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          {domains.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              <button
                type="button"
                className={`rounded-full px-2.5 py-1 text-xs ${domainFilter === "all" ? "bg-indigo-600 text-white" : "bg-gray-100 text-gray-700"}`}
                onClick={() => setDomainFilter("all")}
              >
                Tous
              </button>
              {domains.map((d) => (
                <button
                  key={d}
                  type="button"
                  className={`rounded-full px-2.5 py-1 text-xs ${domainFilter === d ? "bg-indigo-600 text-white" : "bg-gray-100 text-gray-700"}`}
                  onClick={() => setDomainFilter(d)}
                >
                  {d}
                </button>
              ))}
            </div>
          ) : null}
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto rounded-lg border border-gray-200">
          {loading ? (
            <p className="p-4 text-sm text-gray-500">Chargement…</p>
          ) : filtered.length === 0 ? (
            <p className="p-4 text-sm text-gray-500">Aucune formation trouvée.</p>
          ) : (
            filtered.map((course) => {
              const checked = selectedIds.includes(course.id);
              const price = parsePrice(course.intra_price) || parsePrice(course.inter_price);
              return (
                <button
                  key={course.id}
                  type="button"
                  className={`flex w-full items-start gap-3 border-b border-gray-100 px-3 py-3 text-left last:border-0 hover:bg-gray-50 ${checked ? "bg-indigo-50/60" : ""}`}
                  onClick={() => toggle(course.id)}
                >
                  <span
                    className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border text-[10px] ${checked ? "border-indigo-600 bg-indigo-600 text-white" : "border-gray-300"}`}
                  >
                    {checked ? "✓" : ""}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-medium text-gray-900">{course.title}</span>
                    {course.domain ? (
                      <span className="text-xs text-gray-500">{course.domain}</span>
                    ) : null}
                    {price > 0 ? (
                      <span className="mt-0.5 block text-xs text-emerald-700">
                        {formatDealAmount(Math.round(price * 100))}
                        {course.duration ? ` · ${course.duration}` : ""}
                      </span>
                    ) : null}
                  </span>
                </button>
              );
            })
          )}
        </div>

        <div className="flex justify-end">
          <Button type="button" onClick={() => onOpenChange(false)}>
            Valider la sélection
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/** Vue compacte : sélection uniquement + modale catalogue. */
export function PipelineQuoteFormationsCompact({
  selectedIds,
  onChange,
  onTotalChange,
}: {
  selectedIds: string[];
  onChange: (ids: string[]) => void;
  onTotalChange?: (totalCents: number) => void;
}) {
  const { courses, loading } = useTrainingCourses();
  const [pickerOpen, setPickerOpen] = useState(false);

  const selectedCourses = useMemo(
    () => courses.filter((c) => selectedIds.includes(c.id)),
    [courses, selectedIds],
  );

  const totalCents = useMemo(
    () => computeTotalCents(courses, selectedIds),
    [courses, selectedIds],
  );

  return (
    <div className="space-y-3">
      {selectedCourses.length === 0 ? (
        <p className="text-sm text-gray-500">Aucune formation sélectionnée</p>
      ) : (
        <ul className="space-y-2">
          {selectedCourses.map((c) => {
            const price = parsePrice(c.intra_price) || parsePrice(c.inter_price);
            return (
              <li key={c.id} className="rounded-lg border border-gray-200 bg-gray-50/80 px-3 py-2.5 text-sm">
                <p className="font-medium text-gray-900">{c.title}</p>
                <p className="text-xs text-gray-600">
                  {c.duration ?? "Durée à confirmer"}
                  {price > 0 ? ` — ${formatDealAmount(Math.round(price * 100))}` : ""}
                </p>
              </li>
            );
          })}
        </ul>
      )}

      {totalCents > 0 ? (
        <p className="text-sm font-semibold text-gray-900">
          Montant estimé : {formatDealAmount(totalCents)}
        </p>
      ) : null}

      <div className="flex flex-wrap gap-2">
        <Button type="button" size="sm" variant="outline" onClick={() => setPickerOpen(true)}>
          <Plus className="mr-1.5 h-4 w-4" />
          {selectedCourses.length === 0 ? "Ajouter une formation" : "Modifier"}
        </Button>
        {selectedCourses.length > 0 ? (
          <Button type="button" size="sm" variant="secondary" disabled>
            <FileText className="mr-1.5 h-4 w-4" />
            Générer le devis
          </Button>
        ) : null}
      </div>

      <FormationPickerModal
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        courses={courses}
        loading={loading}
        selectedIds={selectedIds}
        onChange={onChange}
        onTotalChange={onTotalChange}
      />
    </div>
  );
}

/** Legacy inline picker — conservé pour compatibilité. */
export function PipelineQuoteFormations({
  selectedIds,
  onChange,
  onTotalChange,
}: {
  selectedIds: string[];
  onChange: (ids: string[]) => void;
  onTotalChange?: (totalCents: number) => void;
}) {
  return (
    <PipelineQuoteFormationsCompact
      selectedIds={selectedIds}
      onChange={onChange}
      onTotalChange={onTotalChange}
    />
  );
}
