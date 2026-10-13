import type { FormateurContentLibrary } from "@/lib/queries/formateur";
import { getServiceRoleClientOrFallback } from "@/lib/supabase/server";

/** Ajoute les formations du LMS (pas seulement celles du compte connecté) à la bibliothèque du parcours. */
export async function mergeLmsCoursesIntoLibrary(library: FormateurContentLibrary): Promise<FormateurContentLibrary> {
  const db = await getServiceRoleClientOrFallback();
  if (!db) return library;

  const { data } = await db
    .from("courses")
    .select("id, title, status, cover_image")
    .order("updated_at", { ascending: false })
    .limit(300);

  const known = new Set(library.courses.map((course) => course.id));
  const courses = [...library.courses];
  for (const course of data ?? []) {
    const row = course as { id?: string; title?: string; status?: string; cover_image?: string | null };
    const id = String(row.id ?? "");
    if (!id || known.has(id)) continue;
    courses.push({
      id,
      title: String(row.title ?? "Formation"),
      category: "",
      duration: "",
      coverImage: row.cover_image ?? null,
      status: String(row.status ?? "draft"),
    });
  }

  return { ...library, courses };
}
