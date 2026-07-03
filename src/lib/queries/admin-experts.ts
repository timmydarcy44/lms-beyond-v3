import { getServiceRoleClient } from "@/lib/supabase/server";
import { ADMIN_EXPERT_SELECT, type AdminExpertRow } from "@/lib/expert/admin-expert-types";

export type { AdminExpertRow } from "@/lib/expert/admin-expert-types";
export {
  parseExpertRegistrationMeta,
  parseExpertDocuments,
  parseExpertInternalNotes,
} from "@/lib/expert/admin-expert-types";

export async function getAdminExperts(status?: string | null): Promise<AdminExpertRow[]> {
  const supabase = getServiceRoleClient();
  if (!supabase) return [];

  let query = supabase
    .from("experts")
    .select(ADMIN_EXPERT_SELECT)
    .order("created_at", { ascending: false })
    .limit(500);

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
    .select(ADMIN_EXPERT_SELECT)
    .eq("id", id)
    .maybeSingle();

  if (error) {
    console.error("[getAdminExpertById]", error);
    return null;
  }
  return (data as AdminExpertRow | null) ?? null;
}
