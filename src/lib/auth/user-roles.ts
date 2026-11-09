import type { SupabaseClient } from "@supabase/supabase-js";

export type AccountRole = "entreprise" | "tuteur" | "apprenant";

const PRIMARY: Record<AccountRole, { role: string; roleType: string }> = {
  entreprise: { role: "entreprise", roleType: "entreprise" },
  tuteur: { role: "tuteur", roleType: "tuteur" },
  apprenant: { role: "apprenant", roleType: "apprenant" },
};

/** Ajoute un rôle. Ne retire rien et ne remplace pas le rôle principal déjà posé sur profiles. */
export async function grantUserRole(db: SupabaseClient, userId: string, role: AccountRole): Promise<void> {
  const added = await db.from("user_roles").upsert({ user_id: userId, role }, { onConflict: "user_id,role" });
  if (added.error && !/user_roles|schema cache/i.test(added.error.message)) {
    console.error("[user-roles] insert", added.error.message);
  }

  const profile = await db.from("profiles").select("role, role_type").eq("id", userId).maybeSingle();
  const current = profile.data as { role?: string | null; role_type?: string | null } | null;
  const primary = String(current?.role ?? current?.role_type ?? "").trim();
  if (primary) return;

  const next = PRIMARY[role];
  await db.from("profiles").update({ role: next.role, role_type: next.roleType }).eq("id", userId);
}

/** Retire un rôle cumulatif (ex. tuteur) sans toucher au rôle principal profiles. */
export async function revokeUserRole(
  db: SupabaseClient,
  userId: string,
  role: AccountRole,
): Promise<void> {
  const removed = await db.from("user_roles").delete().eq("user_id", userId).eq("role", role);
  if (removed.error && !/user_roles|schema cache/i.test(removed.error.message)) {
    console.error("[user-roles] delete", removed.error.message);
  }
}

export async function listUserRoles(
  db: SupabaseClient,
  userIds: string[],
): Promise<Map<string, Set<string>>> {
  const map = new Map<string, Set<string>>();
  if (!userIds.length) return map;
  const { data, error } = await db
    .from("user_roles")
    .select("user_id, role")
    .in("user_id", userIds);
  if (error) {
    if (!/user_roles|schema cache/i.test(error.message)) {
      console.error("[user-roles] list", error.message);
    }
    return map;
  }
  for (const row of data ?? []) {
    const uid = String((row as { user_id: string }).user_id);
    const role = String((row as { role: string }).role || "").toLowerCase();
    if (!uid || !role) continue;
    const set = map.get(uid) ?? new Set<string>();
    set.add(role);
    map.set(uid, set);
  }
  return map;
}

export function hasTutorRole(
  roles: Set<string> | undefined,
  membershipRole?: string | null,
  profileRole?: string | null,
): boolean {
  if (roles?.has("tuteur") || roles?.has("tutor")) return true;
  const m = String(membershipRole || "").toLowerCase();
  if (m === "tutor" || m === "tuteur") return true;
  const p = String(profileRole || "").toLowerCase();
  return p === "tutor" || p === "tuteur";
}
