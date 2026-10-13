import Link from "next/link";

import { getServiceRoleClientOrFallback } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type CourseRow = {
  id: string;
  title: string | null;
  status: string | null;
  updated_at: string | null;
  builder_snapshot?: { general?: { publisher?: string } } | null;
};

export default async function SuperLmsFormationsPage() {
  const db = await getServiceRoleClientOrFallback();
  let courses: CourseRow[] = [];
  if (db) {
    const { data } = await db
      .from("courses")
      .select("id, title, status, updated_at, builder_snapshot")
      .order("updated_at", { ascending: false })
      .limit(400);
    courses = ((data ?? []) as CourseRow[]).filter(
      (course) => course.builder_snapshot?.general?.publisher === "byound",
    );
  }

  return (
    <div className="super-lms-light min-h-[calc(100vh-5rem)] bg-[#F5F5F7] text-slate-900">
      <div className="mx-auto max-w-5xl space-y-8 px-6 py-10">
        <header className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">LMS Byound</p>
            <h1 className="mt-1 text-3xl font-bold tracking-tight">Formations</h1>
            <p className="mt-2 max-w-xl text-sm text-slate-500">
              Ces formations appartiennent à Byound. Elles ne sont rattachées à aucun formateur, et peuvent entrer dans un parcours.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              href="/super/lms/parcours/new"
              className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700"
            >
              Intégrer dans un parcours
            </Link>
            <Link
              href="/super/lms/formations/new"
              className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white"
            >
              Créer une formation
            </Link>
          </div>
        </header>

        {courses.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
            <p className="text-lg font-semibold">Aucune formation Byound</p>
            <p className="mt-2 text-sm text-slate-500">Créez la première avec le même éditeur que l’espace formateur.</p>
          </div>
        ) : (
          <ul className="grid gap-3">
            {courses.map((course) => (
              <li key={course.id}>
                <Link
                  href={`/super/lms/formations/${course.id}`}
                  className="flex items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white px-5 py-4 hover:border-slate-300"
                >
                  <span className="font-semibold">{course.title || "Sans titre"}</span>
                  <span className="text-xs font-medium uppercase tracking-[0.14em] text-slate-400">
                    {course.status === "published" ? "Publiée" : "Brouillon"}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
