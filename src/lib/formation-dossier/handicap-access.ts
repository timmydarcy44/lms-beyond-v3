import type { SupabaseClient } from "@supabase/supabase-js";
import { canAccessHandicapSpace } from "@/lib/handicap/access";

/** Détail besoins spécifiques : owner du dossier ou référent handicap OF. */
export async function canViewHandicapDetails(
  service: SupabaseClient,
  params: { userId: string; dossierOwnerUserId?: string | null },
): Promise<boolean> {
  void service;
  if (params.dossierOwnerUserId && params.dossierOwnerUserId === params.userId) {
    return true;
  }
  return canAccessHandicapSpace(params.userId);
}
