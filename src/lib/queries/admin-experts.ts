import { getServiceRoleClient } from "@/lib/supabase/server";
import { ADMIN_EXPERT_SELECT, type AdminExpertRow } from "@/lib/expert/admin-expert-types";

export type { AdminExpertRow } from "@/lib/expert/admin-expert-types";
export {
  parseExpertRegistrationMeta,
  parseExpertDocuments,
  parseExpertInternalNotes,
} from "@/lib/expert/admin-expert-types";

const ADMIN_EXPERT_SELECT_LEGACY = ADMIN_EXPERT_SELECT.replace(",is_care_expert", "");

function isMissingCareColumn(message: string | undefined) {
  return Boolean(message && /is_care_expert/i.test(message));
}

export async function getAdminExperts(status?: string | null): Promise<AdminExpertRow[]> {
  const supabase = getServiceRoleClient();
  if (!supabase) return [];

  const run = (select: string) => {
    let query = supabase
      .from("experts")
      .select(select)
      .order("created_at", { ascending: false })
      .limit(500);
    if (status && status !== "all") {
      query = query.eq("review_status", status);
    }
    return query;
  };

  let { data, error } = await run(ADMIN_EXPERT_SELECT);
  if (error && isMissingCareColumn(error.message)) {
    ({ data, error } = await run(ADMIN_EXPERT_SELECT_LEGACY));
  }
  if (error) {
    console.error("[getAdminExperts]", error);
    return [];
  }
  return (data ?? []) as AdminExpertRow[];
}

export async function getAdminExpertById(id: string): Promise<AdminExpertRow | null> {
  const supabase = getServiceRoleClient();
  if (!supabase) return null;

  let { data, error } = await supabase
    .from("experts")
    .select(ADMIN_EXPERT_SELECT)
    .eq("id", id)
    .maybeSingle();

  if (error && isMissingCareColumn(error.message)) {
    ({ data, error } = await supabase
      .from("experts")
      .select(ADMIN_EXPERT_SELECT_LEGACY)
      .eq("id", id)
      .maybeSingle());
  }

  if (error) {
    console.error("[getAdminExpertById]", error);
    return null;
  }
  return (data as AdminExpertRow | null) ?? null;
}
