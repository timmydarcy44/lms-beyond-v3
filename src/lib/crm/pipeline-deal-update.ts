import type { SupabaseClient } from "@supabase/supabase-js";
import {
  isOpportunitySchemaError,
  stripOpportunityColumns,
} from "@/lib/crm/pipeline-opportunity-sync";

const CONTACT_CIVILITY_COLUMN_ERROR = /contact_civility/i;

/** Met à jour un deal ; retire colonnes absentes si migration pas encore appliquée. */
export async function updatePipelineDeal(
  supabase: SupabaseClient,
  id: string,
  patch: Record<string, unknown>,
) {
  const attempt = async (row: Record<string, unknown>) =>
    supabase.from("crm_pipeline_deals").update(row).eq("id", id).select("*").single();

  let { data, error } = await attempt(patch);

  if (error && CONTACT_CIVILITY_COLUMN_ERROR.test(error.message) && "contact_civility" in patch) {
    const { contact_civility: _removed, ...withoutCivility } = patch;
    ({ data, error } = await attempt(withoutCivility));
  }

  if (error && isOpportunitySchemaError(error.message)) {
    ({ data, error } = await attempt(stripOpportunityColumns(patch)));
  }

  return { data, error };
}
