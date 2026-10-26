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
