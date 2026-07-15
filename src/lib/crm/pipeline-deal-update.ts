import type { SupabaseClient } from "@supabase/supabase-js";

const CONTACT_CIVILITY_COLUMN_ERROR = /contact_civility/i;

/** Met à jour un deal ; retire contact_civility si la colonne n'existe pas encore en base. */
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

  return { data, error };
}
