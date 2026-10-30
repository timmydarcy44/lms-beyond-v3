import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/require-role";
import { getServiceRoleClientOrFallback } from "@/lib/supabase/server";
import { UserRole } from "@prisma/client";

type CourseRow = {
  id: string;
  title: string | null;
  description?: string | null;
  presentation?: unknown;
  objectives?: unknown;
  builder_snapshot?: { publisher?: string; general?: { publisher?: string; title?: string } } | null;
};

function isByoundLmsCourse(row: CourseRow) {
  const snap = row.builder_snapshot;
  const publisher = String(snap?.general?.publisher ?? snap?.publisher ?? "").toLowerCase();
  return publisher === "byound";
}

function asCourse(row: CourseRow, source: "org" | "lms") {
  const lmsTitle = row.builder_snapshot?.general?.title?.trim();
  return {
    id: row.id,
    title: source === "lms" ? `LMS · ${lmsTitle || row.title || "Sans titre"}` : row.title || "Sans titre",
    description: row.description ?? null,
    presentation: row.presentation ?? null,
    objectives: row.objectives ?? null,
    source,
  };
}

export async function GET(request: Request) {
  const auth = requireRole(request, [UserRole.SUPER_ADMIN]);
  if (!auth.ok) return auth.response;

  const url = new URL(request.url);
  const queryOrgId = url.searchParams.get("organizationId");
  const orgId = queryOrgId || auth.user.orgId || "";

  const supabase = await getServiceRoleClientOrFallback();
  if (!supabase) {
    return NextResponse.json({ error: "SUPABASE_UNAVAILABLE" }, { status: 503 });
  }

  let orgRows: CourseRow[] = [];
  if (orgId) {
    const rich = await supabase
      .from("courses")
      .select("id, title, description, presentation, objectives, builder_snapshot")
      .eq("org_id", orgId)
      .order("title", { ascending: true });
    const orgQuery = rich.error
      ? await supabase.from("courses").select("id, title, builder_snapshot").eq("org_id", orgId).order("title", { ascending: true })
      : rich;
    if (orgQuery.error) {
      return NextResponse.json({ error: "COURSES_FETCH_FAILED" }, { status: 500 });
    }
    orgRows = (orgQuery.data ?? []) as CourseRow[];
  }

  const catalog = await supabase
    .from("courses")
    .select("id, title, description, presentation, objectives, builder_snapshot")
    .order("updated_at", { ascending: false })
    .limit(400);
  const catalogRows = catalog.error
    ? await supabase.from("courses").select("id, title, builder_snapshot").order("updated_at", { ascending: false }).limit(400)
    : catalog;
  const lmsRows = ((catalogRows.data ?? []) as CourseRow[]).filter(isByoundLmsCourse);

  const seen = new Set<string>();
  const courses = [];
  for (const row of lmsRows) {
    seen.add(row.id);
    courses.push(asCourse(row, "lms"));
  }
  for (const row of orgRows) {
    if (seen.has(row.id)) continue;
    courses.push(asCourse(row, "org"));
  }
  courses.sort((a, b) => a.title.localeCompare(b.title, "fr"));

  return NextResponse.json({ ok: true, courses });
}
