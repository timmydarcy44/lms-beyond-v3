import { EDGE_ONLINE_APP_SURFACE_PATH } from "@/lib/galaxy-branding";
import { collectLearnerProfileCandidates } from "@/lib/learner/resolve-learner-profile-candidates";
import { getServiceRoleClientOrFallback } from "@/lib/supabase/server";

export type SalarieAssignedFormation = {
  id: string;
  title: string;
  slug: string | null;
  href: string;
  presentation: string | null;
  meta: string | null;
  progress: number;
};

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function formationHref(slug: string | null, id: string) {
  const key = (slug || id).trim();
  return `${EDGE_ONLINE_APP_SURFACE_PATH}/formations/${encodeURIComponent(key)}`;
}

/** Formations assignées au salarié (enrollments + course_enrollments), sans filtre org_id cours. */
export async function listSalarieAssignedFormations(
  userId: string,
  email?: string | null,
): Promise<SalarieAssignedFormation[]> {
  if (!UUID_RE.test(userId)) return [];
  const client = await getServiceRoleClientOrFallback();
  if (!client) return [];

  const courseIds = new Set<string>();
  const profileIds = await collectLearnerProfileCandidates(client, userId, email);
  const userIds = profileIds.length ? profileIds : [userId];

  const pull = async (table: "enrollments" | "course_enrollments", column: "user_id" | "learner_id") => {
    const withRole = await client.from(table).select("course_id, role").in(column, userIds).limit(200);
    const rows = withRole.error
      ? (await client.from(table).select("course_id").in(column, userIds).limit(200)).data
      : withRole.data;
    for (const row of rows ?? []) {
      const role = String((row as { role?: string }).role ?? "student").trim().toLowerCase();
      if (role && !["student", "learner", "apprenant", "salarie", "collaborateur"].includes(role)) continue;
      const id = String((row as { course_id?: string }).course_id ?? "").trim();
      if (id) courseIds.add(id);
    }
  };

  await pull("enrollments", "user_id");
  await pull("enrollments", "learner_id");
  await pull("course_enrollments", "user_id");
  await pull("course_enrollments", "learner_id");

  if (courseIds.size === 0) return [];

  const ids = Array.from(courseIds);
  const { data: courses, error } = await client
    .from("courses")
    .select("id, title, description, presentation, slug, status")
    .in("id", ids)
    .limit(200);

  if (error) {
    console.warn("[salarie] assigned courses:", error.message);
    return [];
  }

  const progressByCourse = new Map<string, number>();
  const { data: progressRows } = await client
    .from("course_progress")
    .select("course_id, progress_percent")
    .eq("user_id", userId)
    .in("course_id", ids)
    .limit(200);
  for (const row of progressRows ?? []) {
    const cid = String((row as { course_id?: string }).course_id ?? "");
    if (!cid) continue;
    progressByCourse.set(cid, Number((row as { progress_percent?: number }).progress_percent) || 0);
  }

  const out: SalarieAssignedFormation[] = [];
  for (const course of courses ?? []) {
    const row = course as {
      id: string;
      title?: string | null;
      description?: string | null;
      presentation?: string | null;
      slug?: string | null;
      status?: string | null;
    };
    const status = String(row.status ?? "").toLowerCase();
    if (status === "draft" || status === "archived" || status === "deleted") continue;
    out.push({
      id: row.id,
      title: String(row.title ?? "Formation").trim() || "Formation",
      slug: row.slug ?? null,
      href: formationHref(row.slug, row.id),
      presentation: row.presentation ?? null,
      meta: row.description ?? null,
      progress: progressByCourse.get(row.id) ?? 0,
    });
  }

  return out.sort((a, b) => a.title.localeCompare(b.title, "fr"));
}
