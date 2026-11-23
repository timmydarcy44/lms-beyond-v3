import { CFA_SPECIALIZATIONS, type CfaSpecialization } from "@/lib/cfa-applications";
import { getServiceRoleClient } from "@/lib/supabase/server";
import {
  allDefaultByoundProgramFacts,
  defaultByoundProgramFacts,
  mergeByoundProgramFacts,
  type ByoundProgramFacts,
} from "@/lib/byound-school/program-facts";

export type ByoundLmsCourseOption = { id: string; title: string };

function courseTitleFromRow(row: {
  id?: string;
  title?: string | null;
  builder_snapshot?: unknown;
}): string {
  const general = (row.builder_snapshot as { general?: { title?: string } } | null)?.general;
  return general?.title?.trim() || String(row.title ?? "").trim() || "Sans titre";
}

async function resolveCourseTitles(
  programs: ByoundProgramFacts[],
): Promise<ByoundProgramFacts[]> {
  const ids = [...new Set(programs.map((p) => p.lmsCourseId).filter(Boolean))];
  if (!ids.length) return programs;
  const db = getServiceRoleClient();
  if (!db) return programs;
  const { data } = await db
    .from("courses")
    .select("id, title, builder_snapshot")
    .in("id", ids);
  const titles = new Map(
    (data ?? []).map((row) => [String(row.id), courseTitleFromRow(row)]),
  );
  return programs.map((program) =>
    program.lmsCourseId
      ? { ...program, lmsCourseTitle: titles.get(program.lmsCourseId) || program.lmsCourseTitle }
      : program,
  );
}

export async function getByoundProgramFacts(
  specialization: CfaSpecialization,
): Promise<ByoundProgramFacts> {
  const defaults = defaultByoundProgramFacts(specialization);
  const db = getServiceRoleClient();
  if (!db) return defaults;
  const { data, error } = await db
    .from("byound_school_programs")
    .select("*")
    .eq("specialization", specialization)
    .maybeSingle();
  if (error || !data) return defaults;
  const [merged] = await resolveCourseTitles([mergeByoundProgramFacts(specialization, data)]);
  return merged ?? defaults;
}

export async function listByoundProgramFacts(): Promise<ByoundProgramFacts[]> {
  const defaults = allDefaultByoundProgramFacts();
  const db = getServiceRoleClient();
  if (!db) return defaults;
  const { data, error } = await db.from("byound_school_programs").select("*");
  if (error || !data?.length) return defaults;
  const byId = new Map(data.map((row) => [String(row.specialization), row]));
  const programs = CFA_SPECIALIZATIONS.map((item) =>
    mergeByoundProgramFacts(item.value, byId.get(item.value)),
  );
  return resolveCourseTitles(programs);
}

/** Formations LMS Byound proposables pour une page cursus. */
export async function listByoundLmsCourseOptions(): Promise<ByoundLmsCourseOption[]> {
  const db = getServiceRoleClient();
  if (!db) return [];
  const { data, error } = await db
    .from("courses")
    .select("id, title, status, builder_snapshot")
    .order("updated_at", { ascending: false })
    .limit(400);
  if (error || !data?.length) return [];
  return data
    .filter((course) => {
      const snap = course.builder_snapshot as { general?: { publisher?: string } } | null;
      const publisher = snap?.general?.publisher;
      // Priorité Byound ; on garde aussi les cours sans publisher pour ne pas bloquer.
      return !publisher || publisher === "byound";
    })
    .map((course) => ({
      id: String(course.id),
      title: courseTitleFromRow(course),
    }));
}
