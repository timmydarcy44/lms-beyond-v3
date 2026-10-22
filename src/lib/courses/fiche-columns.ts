import type { SupabaseClient } from "@supabase/supabase-js";

import {
  insertRowWithColumnFallback,
  updateRowWithColumnFallback,
} from "@/lib/resources/resource-db-write";
import type { CourseBuilderSnapshot } from "@/types/course-builder";

const VERSION_GAP_MS = 10 * 60 * 1000;

export function ficheColumnsFromSnapshot(snapshot: CourseBuilderSnapshot): Record<string, unknown> {
  const general = snapshot.general;
  return {
    delivery_format: general.delivery_format?.trim() || null,
    competencies: (general.competencies ?? []).map((item) => item.trim()).filter(Boolean),
    audiences: (general.audiences ?? []).map((item) => item.trim()).filter(Boolean),
    evaluation_modalities: general.evaluation_modalities?.trim() || null,
    accessibility: general.accessibility?.trim() || null,
    access_delay: general.access_delay?.trim() || null,
    cover_alt: general.cover_alt?.trim() || null,
  };
}

export async function writeCourseRow(
  client: SupabaseClient,
  courseId: string | null,
  row: Record<string, unknown>,
) {
  if (courseId) return updateRowWithColumnFallback(client, "courses", courseId, row);
  return insertRowWithColumnFallback(client, "courses", row);
}

export async function recordFormationVersion(
  client: SupabaseClient,
  formationId: string,
  snapshot: CourseBuilderSnapshot,
  userId: string,
  status: string,
) {
  const { data: latest, error: readError } = await client
    .from("formation_versions")
    .select("created_at")
    .eq("formation_id", formationId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (readError) return;

  const createdAt = latest && typeof latest.created_at === "string" ? Date.parse(latest.created_at) : 0;
  const fresh = createdAt > 0 && Date.now() - createdAt < VERSION_GAP_MS;
  if (fresh && status !== "published") return;

  await client.from("formation_versions").insert({
    formation_id: formationId,
    snapshot,
    created_by: userId,
  });
}
