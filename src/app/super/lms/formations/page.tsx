import Link from "next/link";

import { getServiceRoleClientOrFallback } from "@/lib/supabase/server";
import { SuperLmsFormationsBoard } from "./formations-board";

export const dynamic = "force-dynamic";

type CourseRow = {
  id: string;
  title: string | null;
  slug: string | null;
  status: string | null;
  cover_image: string | null;
  updated_at: string | null;
  builder_snapshot?: {
    general?: { publisher?: string; title?: string; subtitle?: string; cover_image?: string; heroImage?: string };
  } | null;
};

export default async function SuperLmsFormationsPage() {
  const db = await getServiceRoleClientOrFallback();
  let courses: CourseRow[] = [];
  if (db) {
    const { data } = await db
      .from("courses")
      .select("id, title, slug, status, cover_image, updated_at, builder_snapshot")
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

        <SuperLmsFormationsBoard
          courses={courses.map((course) => {
            const general = course.builder_snapshot?.general;
            const image = general?.cover_image || general?.heroImage || course.cover_image || null;
            return {
              id: course.id,
              title: general?.title?.trim() || course.title || "Sans titre",
              status: course.status || "draft",
              image,
              href: `/super/lms/formations/${course.id}`,
              catalogHref: course.slug ? `/catalog/formations/${course.slug}` : null,
            };
          })}
        />
      </div>
    </div>
  );
}
