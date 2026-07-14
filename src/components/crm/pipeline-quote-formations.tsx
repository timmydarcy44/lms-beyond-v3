"use client";

import { useEffect, useMemo, useState } from "react";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { formatDealAmount } from "@/lib/crm/pipeline-shared";

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

export function PipelineQuoteFormations({
  selectedIds,
  onChange,
  onTotalChange,
}: {
  selectedIds: string[];
  onChange: (ids: string[]) => void;
  onTotalChange?: (totalCents: number) => void;
}) {
  const [courses, setCourses] = useState<TrainingCourseOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");

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

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return courses;
    return courses.filter(
      (c) =>
        c.title.toLowerCase().includes(q)
        || (c.domain ?? "").toLowerCase().includes(q),
    );
  }, [courses, query]);

  const selectedCourses = useMemo(
    () => courses.filter((c) => selectedIds.includes(c.id)),
    [courses, selectedIds],
  );

  const totalCents = useMemo(
    () => computeTotalCents(courses, selectedIds),
    [courses, selectedIds],
  );

  const toggle = (id: string) => {
    const nextIds = selectedIds.includes(id)
      ? selectedIds.filter((x) => x !== id)
      : [...selectedIds, id];
    onChange(nextIds);
    onTotalChange?.(computeTotalCents(courses, nextIds));
  };

  return (
    <div className="space-y-3 border-t border-gray-200 pt-4">
      <div>
        <p className="text-sm font-semibold text-gray-900">Devis — formations catalogue</p>
        <p className="text-xs text-gray-500">
          Sélectionnez une ou plusieurs formations (Gestion des formations).
        </p>
      </div>

      <div className="space-y-2">
        <Label>Rechercher une formation</Label>
        <input
          type="search"
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
          placeholder="Titre, domaine…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      {loading ? (
        <p className="text-sm text-gray-500">Chargement du catalogue…</p>
      ) : (
        <div className="max-h-48 space-y-1 overflow-y-auto rounded-lg border border-gray-200 p-2">
          {filtered.length === 0 ? (
            <p className="px-2 py-3 text-sm text-gray-500">Aucune formation trouvée.</p>
          ) : (
            filtered.map((course) => {
              const checked = selectedIds.includes(course.id);
              const price = parsePrice(course.intra_price) || parsePrice(course.inter_price);
              return (
                <button
                  key={course.id}
                  type="button"
                  className={`flex w-full cursor-pointer items-start gap-2 rounded-md px-2 py-2 text-left text-sm transition ${
                    checked ? "bg-indigo-50" : "hover:bg-gray-50"
                  }`}
                  onClick={() => toggle(course.id)}
                >
                  <span
                    className={`mt-0.5 inline-flex h-4 w-4 shrink-0 items-center justify-center rounded border ${
                      checked ? "border-indigo-600 bg-indigo-600 text-white" : "border-gray-300 bg-white"
                    }`}
                    aria-hidden
                  >
                    {checked ? "✓" : ""}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="font-medium text-gray-900">{course.title}</span>
                    {course.domain ? (
                      <span className="ml-2 text-xs text-gray-500">{course.domain}</span>
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
      )}

      {selectedCourses.length > 0 ? (
        <div className="space-y-2">
          <div className="flex flex-wrap gap-1">
            {selectedCourses.map((c) => (
              <Badge key={c.id} variant="secondary" className="gap-1">
                {c.title}
                <button
                  type="button"
                  className="ml-1 text-gray-500 hover:text-gray-900"
                  onClick={() => toggle(c.id)}
                >
                  ×
                </button>
              </Badge>
            ))}
          </div>
          {totalCents > 0 ? (
            <p className="text-sm font-semibold text-gray-900">
              Total devis indicatif : {formatDealAmount(totalCents)}
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
