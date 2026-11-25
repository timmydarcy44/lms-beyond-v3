import { getServiceRoleClient } from "@/lib/supabase/server";
import { ADMIN_EXPERT_SELECT, type AdminExpertRow } from "@/lib/expert/admin-expert-types";
import { loadExpertDocumentsMerged, toAdminDocumentEntries } from "@/lib/expert/expert-documents-load";

export type { AdminExpertRow } from "@/lib/expert/admin-expert-types";
export {
  parseExpertRegistrationMeta,
  parseExpertDocuments,
  parseExpertInternalNotes,
} from "@/lib/expert/admin-expert-types";

const ADMIN_EXPERT_SELECT_LEGACY = ADMIN_EXPERT_SELECT.replace(",is_care_expert", "").replace(",open_badges", "");

function isMissingOptionalColumn(message: string | undefined) {
  return Boolean(message && /is_care_expert|open_badges/i.test(message));
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
  if (error && isMissingOptionalColumn(error.message)) {
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

  if (error && isMissingOptionalColumn(error.message)) {
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
  if (!data) return null;

  // Enrichit references avec expert_documents (CV déposé côté dashboard/expert).
  try {
    const docs = await loadExpertDocumentsMerged(supabase, id, (data as AdminExpertRow).references);
    if (docs.length) {
      const flat = toAdminDocumentEntries(docs);
      const refs = Array.isArray((data as AdminExpertRow).references)
        ? [...((data as AdminExpertRow).references as unknown[])]
        : [];
      const existingIds = new Set(
        refs
          .filter((item) => item && typeof item === "object")
          .map((item) => String((item as { id?: string }).id ?? "")),
      );
      for (const entry of flat) {
        if (entry.id && existingIds.has(String(entry.id))) continue;
        refs.push(entry);
      }
      (data as AdminExpertRow).references = refs;
    }
  } catch (enrichError) {
    console.warn("[getAdminExpertById] documents enrich:", enrichError);
  }

  return data as AdminExpertRow;
}
