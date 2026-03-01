"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { classesData } from "@/lib/mocks/classesData";

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
  classRows: Array<{ id?: string; name?: string | null; student_count?: number | null }>;
};

const slugify = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");

export function SchoolClassesPageClient({ students, classRows }: SchoolClassesPageClientProps) {
  const [selectedClass, setSelectedClass] = useState<string | null>(null);
  const [localClassRows, setLocalClassRows] = useState(classRows);
  const useMocks = classesData.length > 0;

  const classCards = useMemo(() => {
    if (useMocks) {
      return classesData.map((row) => ({
        id: row.id,
        title: row.name,
        count: row.student_count,
        completion: row.completion_rate,
        cover: row.cover_url,
      }));
    }
    if (localClassRows.length) {
      return localClassRows.map((row) => ({
        id: row.id || row.name || "missing",
        title: row.name || "Nom manquant",
        count: row.student_count || 0,
        completion: 0,
        cover: "",
      }));
    }
    const map = new Map<string, number>();
    students.forEach((row) => {
      const key = row.school_class || "Non renseigne";
      map.set(key, (map.get(key) || 0) + 1);
    });
    return Array.from(map.entries()).map(([title, count]) => ({
      id: title,
      title,
      count,
      completion: 0,
      cover: "",
    }));
  }, [localClassRows, students, useMocks]);

  const totalStudents = students.length;
  const alternants = students.filter((s) => (s.contract_type || "").toLowerCase().includes("altern")).length;
  const initials = students.filter((s) => (s.contract_type || "").toLowerCase().includes("initial")).length;
  const alternancePct = totalStudents ? Math.round((alternants / totalStudents) * 100) : 0;
  const initialPct = totalStudents ? Math.round((initials / totalStudents) * 100) : 0;

  const filtered = selectedClass
    ? students.filter((row) => (row.school_class || "Non renseigne") === selectedClass)
    : [];
  const selectedMockClass = useMocks
    ? classesData.find((item) => item.name === selectedClass || item.id === selectedClass)
    : null;

  return (
    <div className="space-y-6">
      <header className="rounded-2xl border border-[#E5E5EA] bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-semibold text-[#1D1D1F]">Mes Classes</h1>
        <p className="mt-2 text-sm text-[#86868B]">Structure des classes et promotions.</p>
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
        <div className="text-sm font-semibold text-[#1D1D1F]">Classes</div>
      </section>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {classCards.map((card) => (
          <div
            key={card.id}
            className="overflow-hidden rounded-2xl border border-[#E5E5EA] bg-white shadow-sm"
          >
            <div className="w-full overflow-hidden aspect-video">
              {card.cover ? (
                <img src={card.cover} alt={card.title} className="h-full w-full object-cover" />
              ) : (
                <div className="h-full w-full bg-[#F5F5F7]" />
              )}
            </div>
            <div className="p-5">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-[#1D1D1F]">{card.title}</p>
                <span className="rounded-full bg-[#F5F5F7] px-2 py-1 text-xs font-semibold text-[#1D1D1F]">
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
              <button
                type="button"
                onClick={() => setSelectedClass(card.title)}
                className="mt-4 w-full rounded-full border border-[#E5E5EA] bg-[#1D1D1F] px-4 py-2 text-xs font-semibold text-white"
              >
                Ouvrir la classe
              </button>
            </div>
          </div>
        ))}
      </section>

      {selectedClass ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/30 p-4 backdrop-blur-sm md:items-center md:p-6">
          <div className="relative w-full max-w-6xl rounded-t-2xl border border-[#E5E5EA] bg-white p-6 shadow-sm md:rounded-2xl max-h-[90vh] overflow-y-auto">
            <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-[#E5E5EA] md:hidden" />
            <button
              type="button"
              onClick={() => setSelectedClass(null)}
              className="absolute right-4 top-4 flex h-11 w-11 items-center justify-center rounded-full border border-[#E5E5EA] text-sm font-semibold text-[#1D1D1F]"
              aria-label="Fermer"
            >
              ✕
            </button>
            <div className="space-y-6">
              <div>
                <p className="text-sm font-semibold text-[#1D1D1F]">{selectedClass}</p>
                <p className="text-xs text-[#86868B]">Apprenants de la classe sélectionnée</p>
              </div>

              {selectedMockClass?.name === "BTS MCO 1" ? (
                <div className="grid gap-4 rounded-2xl border border-[#E5E5EA] bg-[#F5F5F7] p-5 md:grid-cols-3">
                  <div className="space-y-3">
                    <p className="text-xs uppercase tracking-[0.2em] text-[#86868B]">Profil Global</p>
                    <div className="flex items-center gap-3">
                      <img
                        src="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=300&h=300&fit=crop"
                        alt="Valentin Lamaille"
                        className="h-14 w-14 rounded-full object-cover"
                      />
                      <div>
                        <p className="text-sm font-semibold text-[#1D1D1F]">Valentin Lamaille</p>
                        <p className="text-xs text-[#86868B]">BTS MCO 1</p>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <p className="text-xs uppercase tracking-[0.2em] text-[#86868B]">Cognition (MAI)</p>
                    {[
                      { label: "Connaissances", value: 86 },
                      { label: "Planification / sous-tâches", value: 38 },
                    ].map((item) => (
                      <div key={item.label}>
                        <div className="flex items-center justify-between text-xs text-[#86868B]">
                          <span>{item.label}</span>
                          <span className="font-semibold text-[#1D1D1F]">{item.value}/100</span>
                        </div>
                        <div className="mt-2 h-1 w-full rounded-full bg-white">
                          <div
                            className="h-1 rounded-full bg-[#1D1D1F]"
                            style={{ width: `${item.value}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="space-y-3">
                    <p className="text-xs uppercase tracking-[0.2em] text-[#86868B]">Beyond AI Synthèse</p>
                    <p className="text-sm text-[#1D1D1F]">
                      Profil autonome mais nécessite un cadre pour la planification.
                    </p>
                    <div className="relative rounded-2xl border border-[#E5E5EA] bg-white p-3">
                      <p className="text-xs text-[#86868B]">Zone Care (Stress & DYS)</p>
                      <div className="mt-2 text-xs text-[#86868B]">
                        Stress 16 · Concentration: Souvent
                      </div>
                      <div className="absolute inset-0 rounded-2xl bg-white/60 backdrop-blur-[2px]" />
                      <span className="absolute right-3 top-3 rounded-full border border-[#E5E5EA] bg-white px-2 py-1 text-[10px] font-semibold text-[#1D1D1F]">
                        Accès réservé Référent Handicap
                      </span>
                    </div>
                  </div>
                </div>
              ) : null}

              <div className="space-y-3">
                {(selectedMockClass ? selectedMockClass.students : filtered).map((row: any) => (
                  <div
                    key={row.id}
                    className="flex flex-wrap items-center gap-3 rounded-2xl border border-[#E5E5EA] bg-white px-4 py-3"
                  >
                    {row.avatar_url ? (
                      <img
                        src={row.avatar_url}
                        alt={row.name || ""}
                        className="h-10 w-10 rounded-full object-cover"
                      />
                    ) : null}
                    <div className="min-w-[160px] text-sm font-semibold text-[#1D1D1F]">
                      {row.name || `${row.first_name || ""} ${row.last_name || ""}`}
                    </div>
                    <div className="text-xs text-[#86868B]">{row.tests_status || "Tests en cours"}</div>
                    <div className="ml-auto flex items-center gap-3 text-xs">
                      {typeof row.matching_avg === "number" ? (
                        <span className="rounded-full bg-[#F5F5F7] px-2 py-1 font-semibold text-[#1D1D1F]">
                          Matching moyen {row.matching_avg}%
                        </span>
                      ) : null}
                      <Link
                        href={`/dashboard/ecole/apprenants/${slugify(
                          row.name || `${row.first_name || "profil"}-${row.last_name || ""}`
                        )}?id=${row.id}`}
                        className="rounded-full bg-[#1D1D1F] px-3 py-2 text-xs font-semibold text-white"
                      >
                        Voir profil
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : null}

    </div>
  );
}
