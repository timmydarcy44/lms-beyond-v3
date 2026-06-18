import type { SupabaseClient } from "@supabase/supabase-js";

/** Résout l'employé lié au compte connecté (profile_id puis email). */
export async function resolveEmployeeIdForUser(
  db: SupabaseClient,
  userId: string,
  email: string | null | undefined,
): Promise<string | null> {
  const { data: byProfile } = await db
    .from("employees")
    .select("id")
    .eq("profile_id", userId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (byProfile?.id) return String(byProfile.id);

  const normalized = (email ?? "").trim().toLowerCase();
  if (!normalized) return null;

  const { data: byEmail } = await db
    .from("employees")
    .select("id")
    .eq("email", normalized)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  return byEmail?.id ? String(byEmail.id) : null;
}
