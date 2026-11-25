import { getServiceRoleClientOrFallback } from "@/lib/supabase/server";

export type SalarieAssignedFormation = {
  id: string;
  title: string;
  slug: string | null;
  href: string;
  presentation: string | null;
  meta: string | null;
  progress: number;
  coverImage: string | null;
};

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function formationHref(slug: string | null, id: string) {
  const key = (slug || id).trim();
  return `/dashboard/salarie/formations/${encodeURIComponent(key)}`;
}

function courseCover(row: { cover_image?: string | null; builder_snapshot?: unknown }) {
  const direct = String(row.cover_image ?? "").trim();
  if (direct) return direct;
  let snapshot = row.builder_snapshot;
  if (typeof snapshot === "string") {
    try {
      snapshot = JSON.parse(snapshot) as unknown;
    } catch {
      snapshot = null;
    }
  }
  const general =
    snapshot && typeof snapshot === "object"
      ? (snapshot as { general?: { cover_image?: unknown; heroImage?: unknown } }).general
      : null;
  const fromSnapshot = String(general?.cover_image || general?.heroImage || "").trim();
  return fromSnapshot || null;
}

async function resolveSalarieOrganizationId(
  client: NonNullable<Awaited<ReturnType<typeof getServiceRoleClientOrFallback>>>,
  userId: string,
): Promise<string | null> {
  const [{ data: profile }, { data: employee }, { data: membership }] = await Promise.all([
    client.from("profiles").select("company_id, entreprise_id").eq("id", userId).maybeSingle(),
    client
      .from("employees")
      .select("company_id")
      .eq("profile_id", userId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    client
      .from("org_memberships")
      .select("org_id")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  const profileRow = profile as { company_id?: string | null; entreprise_id?: string | null } | null;
  const fromProfile = String(profileRow?.company_id ?? profileRow?.entreprise_id ?? "").trim() || null;
  const fromEmployee = String((employee as { company_id?: string | null } | null)?.company_id ?? "").trim() || null;
  const fromMembership = String((membership as { org_id?: string | null } | null)?.org_id ?? "").trim() || null;

  return fromProfile || fromEmployee || fromMembership;
}

/** Course ids the org may expose to collaborateurs (owned + LMS grants). */
async function listOrgAllowedCourseIds(
  client: NonNullable<Awaited<ReturnType<typeof getServiceRoleClientOrFallback>>>,
  orgId: string,
): Promise<Set<string>> {
  const allowed = new Set<string>();
  const [{ data: owned }, { data: grants }] = await Promise.all([
    client.from("courses").select("id").eq("org_id", orgId).limit(500),
    client.from("organization_lms_courses").select("course_id").eq("organization_id", orgId).limit(500),
  ]);
  for (const row of owned ?? []) {
    const id = String((row as { id?: string }).id ?? "").trim();
    if (id) allowed.add(id);
  }
  for (const row of grants ?? []) {
    const id = String((row as { course_id?: string }).course_id ?? "").trim();
    if (id) allowed.add(id);
  }
  return allowed;
}

/**
 * Formations assignées au salarié.
 * - enrollments du profil courant uniquement (pas de fusion email / profils frères)
 * - limité aux formations de l'organisation (courses.org_id ou organization_lms_courses)
 */
export async function listSalarieAssignedFormations(
  userId: string,
  _email?: string | null,
): Promise<SalarieAssignedFormation[]> {
  if (!UUID_RE.test(userId)) return [];
  const client = await getServiceRoleClientOrFallback();
  if (!client) return [];

  const orgId = await resolveSalarieOrganizationId(client, userId);
  if (!orgId || !UUID_RE.test(orgId)) return [];

  const allowedCourseIds = await listOrgAllowedCourseIds(client, orgId);
  if (allowedCourseIds.size === 0) return [];

  const courseIds = new Set<string>();

  const pull = async (table: "enrollments" | "course_enrollments", column: "user_id" | "learner_id") => {
    const withRole = await client.from(table).select("course_id, role").eq(column, userId).limit(200);
    const rows = withRole.error
      ? (await client.from(table).select("course_id").eq(column, userId).limit(200)).data
      : withRole.data;
    for (const row of rows ?? []) {
      const role = String((row as { role?: string }).role ?? "student").trim().toLowerCase();
      if (role && !["student", "learner", "apprenant", "salarie", "collaborateur"].includes(role)) continue;
      const id = String((row as { course_id?: string }).course_id ?? "").trim();
      if (id && allowedCourseIds.has(id)) courseIds.add(id);
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
    .select("id, title, description, presentation, slug, status, cover_image, builder_snapshot")
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
      cover_image?: string | null;
      builder_snapshot?: unknown;
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
      coverImage: courseCover(row),
    });
  }

  return out.sort((a, b) => a.title.localeCompare(b.title, "fr"));
}
