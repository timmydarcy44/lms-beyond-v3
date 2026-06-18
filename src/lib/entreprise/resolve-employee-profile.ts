import type { SupabaseClient } from "@supabase/supabase-js";
import { resolveAuthUserIdByEmail } from "@/lib/entreprise/sync-collaborator-profile";

type EmployeeRow = {
  id: string;
  email?: string | null;
  profile_id?: string | null;
  company_id?: string | null;
  first_name?: string | null;
  last_name?: string | null;
};

async function profileIdsFromEmployeeMetadata(
  service: SupabaseClient,
  employeeId: string,
): Promise<string[]> {
  const ids: string[] = [];
  for (let page = 1; page <= 5; page += 1) {
    const { data, error } = await service.auth.admin.listUsers({ page, perPage: 1000 });
    if (error || !data.users.length) break;
    for (const user of data.users) {
      const meta = (user.user_metadata ?? {}) as Record<string, unknown>;
      if (String(meta.employee_id ?? "") === employeeId && user.id) {
        ids.push(user.id);
      }
    }
    if (data.users.length < 1000) break;
  }
  return ids;
}

/** Collecte les ids profil candidats pour retrouver les tests du collaborateur. */
export async function collectEmployeeProfileCandidates(
  service: SupabaseClient,
  employee: EmployeeRow,
): Promise<string[]> {
  const ids = new Set<string>();
  if (employee.profile_id?.trim()) ids.add(employee.profile_id.trim());

  if (employee.email) {
    const normalized = String(employee.email).trim().toLowerCase();
    const { data: byEmail } = await service
      .from("profiles")
      .select("id")
      .eq("email", normalized)
      .maybeSingle();
    if (byEmail?.id) ids.add(String(byEmail.id));

    const authId = await resolveAuthUserIdByEmail(service, normalized);
    if (authId) ids.add(authId);
  }

  for (const id of await profileIdsFromEmployeeMetadata(service, employee.id)) {
    ids.add(id);
  }

  if (employee.first_name?.trim() && employee.last_name?.trim()) {
    const { data: byName } = await service
      .from("profiles")
      .select("id")
      .ilike("first_name", employee.first_name.trim())
      .ilike("last_name", employee.last_name.trim())
      .limit(5);
    for (const row of byName ?? []) {
      if (row.id) ids.add(String(row.id));
    }
  }

  return Array.from(ids);
}

/** Résout le profil apprenant lié à un collaborateur et synchronise les liaisons manquantes. */
export async function resolveAndLinkEmployeeProfile(
  service: SupabaseClient,
  employee: EmployeeRow,
  authUserId?: string | null,
): Promise<string | null> {
  const candidates = await collectEmployeeProfileCandidates(service, employee);
  if (authUserId?.trim()) candidates.unshift(authUserId.trim());

  const profileId = candidates[0] ?? null;
  if (!profileId) return null;

  const orgId = employee.company_id?.trim() || null;
  const profilePatch: Record<string, unknown> = { id: profileId };
  if (orgId) profilePatch.company_id = orgId;
  if (employee.first_name) profilePatch.first_name = employee.first_name;
  if (employee.last_name) profilePatch.last_name = employee.last_name;
  if (employee.first_name || employee.last_name) {
    profilePatch.full_name = [employee.first_name, employee.last_name].filter(Boolean).join(" ").trim();
  }

  await service.from("profiles").upsert(profilePatch, { onConflict: "id" });

  if (employee.id && employee.profile_id !== profileId) {
    await service.from("employees").update({ profile_id: profileId }).eq("id", employee.id);
  }

  return profileId;
}

/** Trouve le profil qui possède réellement des résultats de tests. */
export async function resolveEmployeeProfileWithTests(
  service: SupabaseClient,
  employee: EmployeeRow,
  loadTests: (profileId: string) => Promise<{ hasTests: boolean }>,
): Promise<string | null> {
  const candidates = await collectEmployeeProfileCandidates(service, employee);

  for (const profileId of candidates) {
    const result = await loadTests(profileId);
    if (result.hasTests) {
      await resolveAndLinkEmployeeProfile(service, { ...employee, profile_id: profileId }, profileId);
      return profileId;
    }
  }

  if (candidates[0]) {
    await resolveAndLinkEmployeeProfile(service, employee, candidates[0]);
    return candidates[0];
  }

  return null;
}
