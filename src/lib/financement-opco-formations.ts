import { catalogFallbackCourses } from "@/lib/training-courses/catalog-fallback";
import { getServiceRoleClient } from "@/lib/supabase/server";
import type { FormationOption } from "@/lib/financement-opco";

export async function listPublishedFormations(): Promise<FormationOption[]> {
  const db = getServiceRoleClient();
  if (db) {
    const { data, error } = await db
      .from("training_courses")
      .select("id, title")
      .eq("is_active", true)
      .order("title", { ascending: true });
    if (!error && data?.length) {
      return data
        .map((row) => ({ id: String(row.id ?? ""), title: String(row.title ?? "").trim() }))
        .filter((row) => row.id && row.title);
    }
  }

  return catalogFallbackCourses()
    .map((course) => ({ id: course.id, title: course.title.trim() }))
    .filter((course) => course.id && course.title)
    .sort((a, b) => a.title.localeCompare(b.title, "fr"));
}
