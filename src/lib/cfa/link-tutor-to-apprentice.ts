import type { SupabaseClient } from "@supabase/supabase-js";
import { activateAlternanceContract } from "@/lib/cfa/alternance-contract-lifecycle";
import { syncTutorAssignment } from "@/lib/cfa/sync-tutor-assignment";

/**
 * Rattache un maître d'apprentissage (company_tutors) à une candidature CFA :
 * placement actif + contrat + tutor_assignments (si le compte tuteur existe déjà).
 */
export async function linkTutorToApprentice(
  db: SupabaseClient,
  input: {
    applicationId: string;
    companyId: string;
    companyTutorId: string;
    createdBy?: string | null;
  },
): Promise<{ placementId: string; error?: string }> {
  const { applicationId, companyId, companyTutorId, createdBy } = input;

  await db
    .from("apprentice_placements")
    .update({ status: "ended", ended_at: new Date().toISOString() })
    .eq("apprentice_id", applicationId)
    .in("status", ["active", "pending"]);

  const placed = await db
    .from("apprentice_placements")
    .insert({
      apprentice_id: applicationId,
      company_id: companyId,
      tutor_id: companyTutorId,
      status: "active",
      started_at: new Date().toISOString(),
      created_by: createdBy ?? null,
    })
    .select("id")
    .single();

  if (placed.error || !placed.data) {
    return { placementId: "", error: placed.error?.message ?? "Placement impossible" };
  }

  const placementId = String((placed.data as { id: string }).id);

  await activateAlternanceContract(db, {
    applicationId,
    companyId,
    companyTutorId,
    placementId,
    createdBy: createdBy ?? null,
    status: "active",
  });

  // activateAlternanceContract appelle déjà syncTutorAssignment ; on rappelle pour
  // couvrir le cas où le tuteur vient d'être activé entre-temps.
  await syncTutorAssignment(db, applicationId);

  return { placementId };
}
