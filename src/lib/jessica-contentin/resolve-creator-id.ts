import { JESSICA_CONTENTIN_EMAIL } from "@/lib/jessica-contentin/studio-config";
import { getServerClient, getServiceRoleClient } from "@/lib/supabase/server";

/** ID Jessica Contentin en production (fallback si lookup impossible). */
export const JESSICA_CREATOR_ID_FALLBACK = "fcdc770d-4474-43ae-97d6-e70ef7e58779";

/** Résout l'UUID créateur Jessica — contourne RLS profiles pour les apprenants. */
export async function resolveJessicaCreatorId(): Promise<string> {
  const service = getServiceRoleClient();
  const client = service ?? (await getServerClient());
  if (!client) return JESSICA_CREATOR_ID_FALLBACK;

  const { data } = await client
    .from("profiles")
    .select("id")
    .eq("email", JESSICA_CONTENTIN_EMAIL)
    .maybeSingle();

  return data?.id ? String(data.id) : JESSICA_CREATOR_ID_FALLBACK;
}
