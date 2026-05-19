"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

type StudentRow = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  phone?: string | null;
  school_class?: string | null;
  contract_type?: string | null;
};

type SchoolClassesPageClientProps = {
  students: StudentRow[];
  classRows: Array<{
    id?: string;
    name?: string | null;
    student_count?: number | null;
    cover_image_url?: string | null;
  }>;
  /** Inscriptions `class_enrollments` pour cette école (filtre apprenants par cursus). */
  classEnrollments?: Array<{ class_id: string; student_id: string }>;
};

type ClassCard =
  | {
      kind: "db";
      id: string;
      classId: string;
      title: string;
      count: number;
      completion: number;
      cover: string;
    }
  | {
      kind: "label";
      id: string;
      classId: "";
      title: string;
      count: number;
      completion: number;
      cover: string;
    };

export function SchoolClassesPageClient({
  students,
  classRows,
  classEnrollments = [],
}: SchoolClassesPageClientProps) {
  const [localClassRows, setLocalClassRows] = useState(classRows);

  useEffect(() => {
    setLocalClassRows(classRows);
  }, [classRows]);

  const studentIdsByClassId = useMemo(() => {
    const m = new Map<string, Set<string>>();
    for (const row of classEnrollments) {
      if (!row.class_id || !row.student_id) continue;
      if (!m.has(row.class_id)) m.set(row.class_id, new Set());
      m.get(row.class_id)!.add(row.student_id);
    }
    return m;
  }, [classEnrollments]);

  const classCards = useMemo((): ClassCard[] => {
    if (localClassRows.length) {
      return localClassRows.map((row) => {
        const classId = row.id ? String(row.id) : "";
        const enrolled = classId ? studentIdsByClassId.get(classId)?.size ?? 0 : 0;
        const declared = typeof row.student_count === "number" ? row.student_count : 0;
        return {
          kind: "db",
          id: classId || row.name || "missing",
          classId,
          title: row.name || "Nom manquant",
          count: declared > 0 ? declared : enrolled,
          completion: 0,
          cover: String(row.cover_image_url ?? "").trim(),
        };
      });
    }
    const map = new Map<string, number>();
    students.forEach((row) => {
      const key = row.school_class || "Non renseigne";
      map.set(key, (map.get(key) || 0) + 1);
    });
    return Array.from(map.entries()).map(([title, count]) => ({
      kind: "label" as const,
      id: title,
      classId: "" as const,
      title,
      count,
      completion: 0,
      cover: "",
    }));
  }, [localClassRows, students, studentIdsByClassId]);

  const totalStudents = students.length;
  const alternants = students.filter((s) => (s.contract_type || "").toLowerCase().includes("altern")).length;
  const initialContracts = students.filter((s) => (s.contract_type || "").toLowerCase().includes("initial")).length;
  const alternancePct = totalStudents ? Math.round((alternants / totalStudents) * 100) : 0;
  const initialPct = totalStudents ? Math.round((initialContracts / totalStudents) * 100) : 0;

  return (
    <div className="space-y-6">
      <header className="rounded-2xl border border-[#E5E5EA] bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-semibold text-[#1D1D1F]">Mes Classes</h1>
        <p className="mt-2 text-sm text-[#86868B]">Structure des classes et promotions. Cliquez sur une carte pour la page dédiée.</p>
      </header>

      <section className="grid gap-4 md:grid-cols-4">
        {[
          { label: "Total Etudiants", value: totalStudents },
          { label: "% Alternants", value: `${alternancePct}%` },
          { label: "% Initiaux", value: `${initialPct}%` },
          { label: "% Placement Global", value: "86%" },
        ].map((kpi) => (
          <div
            key={kpi.label}
            className="rounded-2xl border border-[#E5E5EA] bg-white p-4 shadow-sm"
          >
            <p className="text-xs uppercase tracking-[0.2em] text-[#86868B]">{kpi.label}</p>
            <p className="mt-3 text-2xl font-semibold text-[#1D1D1F]">{kpi.value}</p>
          </div>
        ))}
      </section>

      <section className="flex flex-wrap items-center justify-between gap-4">
        <div className="text-sm font-semibold text-[#1D1D1F]">Formations</div>
      </section>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {classCards.map((card) => {
          const href =
            card.kind === "db" && card.classId
              ? `/dashboard/ecole/classes/${card.classId}`
              : `/dashboard/ecole/classes/view?promotion=${encodeURIComponent(card.title)}`;
          const addLearnerHref =
            card.kind === "db" && card.classId
              ? `/dashboard/ecole/apprenants?add=1&classId=${encodeURIComponent(card.classId)}`
              : null;
          return (
            <div
              key={card.id}
              className="overflow-hidden rounded-2xl border border-[#E5E5EA] bg-white shadow-sm transition hover:border-[#007AFF]/40 hover:shadow-md"
            >
              <Link
                href={href}
                className="block focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#007AFF]"
              >
                <div className="aspect-video w-full overflow-hidden">
                  {card.cover ? (
                    <img src={card.cover} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <div className="h-full w-full bg-gradient-to-br from-[#E8E8ED] to-[#F5F5F7]" />
                  )}
                </div>
                <div className="p-5">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-[#1D1D1F]">{card.title}</p>
                    <span className="shrink-0 rounded-full bg-[#F5F5F7] px-2 py-1 text-xs font-semibold text-[#1D1D1F]">
                      {card.count} apprenants
                    </span>
                  </div>
                  <div className="mt-3">
                    <div className="flex items-center justify-between text-xs text-[#86868B]">
                      <span>Taux de complétion tests</span>
                      <span className="font-semibold text-[#1D1D1F]">
                        {card.completion ? `${card.completion}%` : "—"}
                      </span>
                    </div>
                    <div className="mt-2 h-2 w-full rounded-full bg-[#F5F5F7]">
                      <div
                        className="h-2 rounded-full bg-[#1D1D1F]"
                        style={{ width: `${card.completion || 0}%` }}
                      />
                    </div>
                  </div>
                </div>
              </Link>
              <div className="flex flex-wrap gap-2 border-t border-[#E5E5EA] bg-white px-5 py-4">
                <Link
                  href={href}
                  className="inline-flex min-h-[40px] flex-1 items-center justify-center rounded-full border border-[#E5E5EA] bg-[#1D1D1F] px-4 py-2 text-xs font-semibold text-white hover:opacity-90"
                >
                  Ouvrir la formation
                </Link>
                {addLearnerHref ? (
                  <Link
                    href={addLearnerHref}
                    className="inline-flex min-h-[40px] flex-1 items-center justify-center rounded-full border border-[#007AFF]/40 bg-white px-4 py-2 text-xs font-semibold text-[#007AFF] hover:bg-[#F5F9FF]"
                  >
                    + Apprenant
                  </Link>
                ) : null}
              </div>
            </div>
          );
        })}
      </section>
    </div>
  );
}
