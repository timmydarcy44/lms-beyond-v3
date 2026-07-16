import type { PrescripteurInterlocutor } from "@/lib/crm/pipeline-prescripteur-shared";
import type { SupabaseClient } from "@supabase/supabase-js";

export function parseInterlocutorsPayload(raw: unknown): PrescripteurInterlocutor[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((item, index) => {
      const row = item as Record<string, unknown>;
      const first_name = String(row.first_name ?? "").trim();
      const last_name = String(row.last_name ?? "").trim();
      if (!first_name && !last_name && index > 0) return null;
      return {
        id: row.id ? String(row.id) : undefined,
        first_name,
        last_name,
        email: String(row.email ?? "").trim(),
        phone: String(row.phone ?? "").trim(),
        linkedin_url: String(row.linkedin_url ?? "").trim(),
      } satisfies PrescripteurInterlocutor;
    })
    .filter(Boolean) as PrescripteurInterlocutor[];
}

export async function replacePrescripteurInterlocutors(
  supabase: SupabaseClient,
  prescripteurId: string,
  interlocutors: PrescripteurInterlocutor[],
): Promise<{ error: { message: string } | null }> {
  const { error: delError } = await supabase
    .from("crm_pipeline_prescripteur_interlocutors")
    .delete()
    .eq("prescripteur_id", prescripteurId);

  if (delError) {
    if (delError.code === "42P01") return { error: null };
    return { error: delError };
  }

  const rows = interlocutors
    .filter((i) => i.first_name.trim() || i.last_name.trim())
    .map((i, index) => ({
      prescripteur_id: prescripteurId,
      sort_order: index,
      first_name: i.first_name.trim(),
      last_name: i.last_name.trim(),
      email: i.email.trim() || null,
      phone: i.phone.trim() || null,
      linkedin_url: i.linkedin_url.trim() || null,
      updated_at: new Date().toISOString(),
    }));

  if (rows.length === 0) return { error: null };

  const { error: insError } = await supabase
    .from("crm_pipeline_prescripteur_interlocutors")
    .insert(rows);

  return { error: insError };
}

export async function fetchPrescripteurInterlocutors(
  supabase: SupabaseClient,
  prescripteurId: string,
): Promise<PrescripteurInterlocutor[]> {
  const { data, error } = await supabase
    .from("crm_pipeline_prescripteur_interlocutors")
    .select("id, first_name, last_name, email, phone, linkedin_url, sort_order")
    .eq("prescripteur_id", prescripteurId)
    .order("sort_order", { ascending: true });

  if (error) {
    if (error.code === "42P01") return [];
    throw error;
  }

  return (data ?? []).map((row) => ({
    id: String(row.id),
    first_name: String(row.first_name ?? ""),
    last_name: String(row.last_name ?? ""),
    email: String(row.email ?? ""),
    phone: String(row.phone ?? ""),
    linkedin_url: String(row.linkedin_url ?? ""),
  }));
}
