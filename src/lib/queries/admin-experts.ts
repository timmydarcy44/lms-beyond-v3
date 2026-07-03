import { getServiceRoleClient } from "@/lib/supabase/server";
import type { AdminExpertRow } from "@/lib/expert/admin-expert-types";

export type { AdminExpertRow } from "@/lib/expert/admin-expert-types";
export { parseExpertRegistrationMeta } from "@/lib/expert/admin-expert-types";

export async function getAdminExperts(status?: string | null): Promise<AdminExpertRow[]> {
  const supabase = getServiceRoleClient();
  if (!supabase) return [];

  let query = supabase
    .from("experts")
    .select(
      "id,email,first_name,last_name,headline,review_status,is_active,specialties,formats_supported,regions,references,wants_certification,created_at",
    )
    .order("created_at", { ascending: false })
    .limit(200);

  if (status && status !== "all") {
    query = query.eq("review_status", status);
  }

  const { data, error } = await query;
  if (error) {
    console.error("[getAdminExperts]", error);
    return [];
  }
  return (data ?? []) as AdminExpertRow[];
}

export async function getAdminExpertById(id: string): Promise<AdminExpertRow | null> {
  const supabase = getServiceRoleClient();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("experts")
    .select(
      "id,email,first_name,last_name,headline,review_status,is_active,specialties,formats_supported,regions,references,wants_certification,created_at",
    )
    .eq("id", id)
    .maybeSingle();

  if (error) {
    console.error("[getAdminExpertById]", error);
    return null;
  }
  return (data as AdminExpertRow | null) ?? null;
}
