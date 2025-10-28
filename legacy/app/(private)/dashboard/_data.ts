import { SupabaseClient } from "@supabase/supabase-js";

export async function getProfile(supabase: SupabaseClient, userId: string) {
  const { data } = await supabase
    .from("profiles")
    .select("first_name,last_name")
    .eq("id", userId)
    .maybeSingle();
  return data ?? null;
}

export async function countCoursesForOwner(supabase: SupabaseClient, userId: string) {
  const { count } = await supabase
    .from("courses")
    .select("id", { count: "exact", head: true })
    .eq("owner_id", userId);
  return count ?? 0;
}

export async function countUnreadMessages(supabase: SupabaseClient, userId: string) {
  // Fallback safe si table absente : 0
  const { data, error, count } = await supabase
    .from("message_recipients")
    .select("id", { head: true, count: "exact" })
    .eq("recipient_id", userId)
    .eq("is_read", false);
  if (error) return 0;
  return typeof count === "number" ? count : (data as any)?.length ?? 0;
}

/** Dernières connexions (nécessite une table d'audit, voir section DB) */
export async function getRecentLogins(supabase: SupabaseClient) {
  try {
    const { data, error } = await supabase
      .from("student_logins")
      .select("occurred_at, ip, profiles:first_name, profiles:last_name, user_id")
      .order("occurred_at", { ascending: false })
      .limit(8);
    if (error || !data) return [];
    return data.map((r: any) => ({
      user_name: (r.profiles?.first_name || r.profiles?.last_name)
        ? `${r.profiles?.first_name ?? ""} ${r.profiles?.last_name ?? ""}`.trim()
        : r.user_id,
      occurred_at: r.occurred_at,
      ip: r.ip,
    }));
  } catch {
    return [];
  }
}

/** Derniers badges (nécessite tables badges + learner_badges, voir section DB) */
export async function getRecentBadges(supabase: SupabaseClient) {
  try {
    const { data, error } = await supabase
      .from("learner_badges")
      .select("awarded_at, users:profiles(first_name,last_name), badge:badges(name,icon_url)")
      .order("awarded_at", { ascending: false })
      .limit(8);
    if (error || !data) return [];
    return data.map((r: any) => ({
      user_name: (r.users?.first_name || r.users?.last_name)
        ? `${r.users?.first_name ?? ""} ${r.users?.last_name ?? ""}`.trim()
        : "Inconnu",
      badge_name: r.badge?.name ?? "Badge",
      icon_url: r.badge?.icon_url ?? null,
      awarded_at: r.awarded_at,
    }));
  } catch {
    return [];
  }
}
