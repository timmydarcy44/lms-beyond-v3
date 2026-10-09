import { CFA_SPECIALIZATIONS, type CfaSpecialization } from "@/lib/cfa-applications";
import { getServiceRoleClient } from "@/lib/supabase/server";
import {
  allDefaultByoundProgramFacts,
  defaultByoundProgramFacts,
  mergeByoundProgramFacts,
  type ByoundProgramFacts,
} from "@/lib/byound-school/program-facts";

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
  return mergeByoundProgramFacts(specialization, data);
}

export async function listByoundProgramFacts(): Promise<ByoundProgramFacts[]> {
  const defaults = allDefaultByoundProgramFacts();
  const db = getServiceRoleClient();
  if (!db) return defaults;
  const { data, error } = await db.from("byound_school_programs").select("*");
  if (error || !data?.length) return defaults;
  const byId = new Map(data.map((row) => [String(row.specialization), row]));
  return CFA_SPECIALIZATIONS.map((item) =>
    mergeByoundProgramFacts(item.value, byId.get(item.value)),
  );
}
