"use client";

import Link from "next/link";
import { useCallback, useEffect, useState, type MouseEvent } from "react";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { EmptyState } from "./chrome";
import {
  type SurMesureCourse,
  surmesureDetailHref,
  surmesureNewHref,
} from "@/lib/training-courses/surmesure-ui";

export function AccountSurMesureTab({
  organizationId,
  organizationName,
}: {
  organizationId: string;
  organizationName: string;
}) {
  const [courses, setCourses] = useState<SurMesureCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/super/comptes-clients/${organizationId}/surmesure`);
      const json = (await res.json()) as { courses?: SurMesureCourse[]; error?: string };
      if (!res.ok) throw new Error(json.error || "Chargement impossible");
      setCourses(json.courses ?? []);
      if (json.error) setError(json.error);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Chargement impossible");
    } finally {
      setLoading(false);
    }
  }, [organizationId]);

  useEffect(() => {
    void reload();
  }, [reload]);

  async function removeCourse(course: SurMesureCourse, event: MouseEvent) {
    event.preventDefault();
    event.stopPropagation();
    if (!confirm(`Supprimer « ${course.title} » ?`)) return;
    try {
      const res = await fetch(
        `/api/super/comptes-clients/${organizationId}/surmesure/${course.id}`,
        { method: "DELETE" },
      );
      const json = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(json.error || "Suppression impossible");
      setCourses((prev) => prev.filter((c) => c.id !== course.id));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Suppression impossible");
    }
  }

  return (
    <div className="mt-5 space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-extrabold">Sur-mesure</h2>
          <p className="mt-1 max-w-2xl text-sm text-[#8A93AE]">
            Co-construisez en direct avec {organizationName} : cadrage Qualiopi, puis structure
            Byound AI — sans contenu de chapitre.
          </p>
        </div>
        <Link
          href={surmesureNewHref(organizationId)}
          className="inline-flex items-center gap-2 rounded-full bg-[#6E5BFF] px-4 py-2 text-sm font-semibold"
        >
          <Plus className="h-4 w-4" /> Nouvelle formation Sur-mesure
        </Link>
      </div>

      {error ? <p className="text-sm text-[#FF8A9B]">{error}</p> : null}

      {loading ? (
        <p className="flex items-center gap-2 text-sm text-[#8A93AE]">
          <Loader2 className="h-4 w-4 animate-spin" /> Chargement…
        </p>
      ) : courses.length === 0 ? (
        <EmptyState
          title="Aucune formation Sur-mesure pour ce compte."
          action={
            <Link
              href={surmesureNewHref(organizationId)}
              className="rounded-full bg-[#6E5BFF] px-4 py-2 text-sm font-semibold"
            >
              Créer la première
            </Link>
          }
        />
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {courses.map((course) => {
            const sections = course.program_structure?.length ?? 0;
            const chapters =
              course.program_structure?.reduce((n, s) => n + s.chapters.length, 0) ?? 0;
            return (
              <Link
                key={course.id}
                href={surmesureDetailHref(organizationId, course.id)}
                className="group rounded-[24px] border border-[#1A2340] bg-[#111831] p-5 transition hover:border-[#6E5BFF]/55 hover:bg-[#17122E]"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="text-base font-extrabold text-white group-hover:text-[#E8ECF8]">
                      {course.title}
                    </h3>
                    <p className="mt-1 text-xs text-[#8A93AE]">
                      {[
                        course.duration,
                        course.level,
                        sections ? `${sections} section(s)` : "Structure à générer",
                        chapters ? `${chapters} chapitre(s)` : null,
                      ]
                        .filter(Boolean)
                        .join(" · ")}
                    </p>
                  </div>
                  <button
                    type="button"
                    className="rounded-full p-2 text-[#FF8A9B] opacity-70 hover:bg-[#2A1520] hover:opacity-100"
                    onClick={(e) => void removeCourse(course, e)}
                    aria-label="Supprimer"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
                {course.short_description ? (
                  <p className="mt-3 line-clamp-2 text-sm text-[#C9D2E8]">
                    {course.short_description}
                  </p>
                ) : null}
                <p className="mt-4 text-xs font-semibold text-[#C4B8FF]">Ouvrir la présentation →</p>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
