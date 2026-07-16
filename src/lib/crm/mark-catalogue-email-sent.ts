import type { SupabaseClient } from "@supabase/supabase-js";

/** Marque l'email catalogue comme envoyé et réinitialise le statut d'ouverture. */
export async function markCatalogueEmailSent(
  supabase: SupabaseClient,
  dealId: string,
  messageId?: string | null,
) {
  const now = new Date().toISOString();
  return supabase
    .from("crm_pipeline_deals")
    .update({
      catalog_email_sent_at: now,
      catalog_email_resend_id: messageId?.trim() || null,
      catalog_email_opened_at: null,
      updated_at: now,
    })
    .eq("id", dealId);
}
