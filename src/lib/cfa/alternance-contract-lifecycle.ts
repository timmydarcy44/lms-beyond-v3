import type { SupabaseClient } from "@supabase/supabase-js";
import { syncTutorAssignment } from "@/lib/cfa/sync-tutor-assignment";

export type AlternanceContractStatus = "draft" | "signed" | "active" | "ended" | "broken";

type ActivateInput = {
  applicationId: string;
  companyId: string;
  companyTutorId?: string | null;
  placementId?: string | null;
  title?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  cerfaDocumentId?: string | null;
  createdBy?: string | null;
  /** Force status (default active). */
  status?: AlternanceContractStatus;
};

/**
 * Crée ou active un contrat d'alternance à partir d'un placement CFA.
 * Les effets (situation apprentice, Mes alternants, recrutement réussi) sont
 * aussi appliqués par le trigger SQL `alternance_contract_status_effects`.
 */
export async function activateAlternanceContract(
  db: SupabaseClient,
  input: ActivateInput,
): Promise<{ contractId: string | null; error?: string }> {
  const application = await db
    .from("cfa_applications")
    .select("id, profile_id, track")
    .eq("id", input.applicationId)
    .maybeSingle();
  if (application.error) {
    if (/schema cache|does not exist/i.test(application.error.message)) {
      return { contractId: null, error: "table_missing" };
    }
    return { contractId: null, error: application.error.message };
  }
  const profileId = String(
    (application.data as { profile_id?: string | null } | null)?.profile_id ?? "",
  ).trim();
  if (!profileId) {
    return { contractId: null, error: "Compte apprenant non lié — créez le compte avant d’activer le contrat." };
  }

  let tutorUserId: string | null = null;
  if (input.companyTutorId) {
    const tutor = await db
      .from("company_tutors")
      .select("user_id")
      .eq("id", input.companyTutorId)
      .maybeSingle();
    tutorUserId =
      String((tutor.data as { user_id?: string | null } | null)?.user_id ?? "").trim() || null;
  }

  const title =
    String(input.title ?? "").trim() ||
    String((application.data as { track?: string | null } | null)?.track ?? "").trim() ||
    null;

  const status: AlternanceContractStatus = input.status ?? "active";

  // Clôturer les autres contrats actifs du même apprenant.
  if (status === "active") {
    await db
      .from("alternance_contracts")
      .update({ status: "ended", ended_at: new Date().toISOString() })
      .eq("apprentice_id", profileId)
      .eq("status", "active");
  }

  const payload = {
    apprentice_id: profileId,
    company_id: input.companyId,
    tutor_id: tutorUserId,
    company_tutor_id: input.companyTutorId ?? null,
    application_id: input.applicationId,
    placement_id: input.placementId ?? null,
    title,
    start_date: input.startDate ?? new Date().toISOString().slice(0, 10),
    end_date: input.endDate ?? null,
    status,
    cerfa_document_id: input.cerfaDocumentId ?? null,
    activated_at: status === "active" ? new Date().toISOString() : null,
    created_by: input.createdBy ?? null,
    updated_at: new Date().toISOString(),
  };

  const inserted = await db
    .from("alternance_contracts")
    .insert(payload)
    .select("id")
    .single();

  if (inserted.error) {
    if (/alternance_contracts|schema cache|does not exist/i.test(inserted.error.message)) {
      // Migration pas encore appliquée : on s’appuie sur le placement + sync tuteur.
      await syncTutorAssignment(db, input.applicationId);
      return { contractId: null, error: "migration_pending" };
    }
    return { contractId: null, error: inserted.error.message };
  }

  await syncTutorAssignment(db, input.applicationId);

  // Passer la candidature en « contract » si elle était admitted.
  await db
    .from("cfa_applications")
    .update({ status: "contract", updated_at: new Date().toISOString() })
    .eq("id", input.applicationId)
    .in("status", ["admitted", "administrative", "contract"]);

  return { contractId: String((inserted.data as { id: string }).id) };
}

export async function endAlternanceContract(
  db: SupabaseClient,
  input: { contractId: string; status?: "ended" | "broken" },
): Promise<{ ok: boolean; error?: string }> {
  const status = input.status ?? "ended";
  const { data, error } = await db
    .from("alternance_contracts")
    .update({
      status,
      ended_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", input.contractId)
    .select("application_id")
    .maybeSingle();

  if (error) return { ok: false, error: error.message };
  const applicationId = String(
    (data as { application_id?: string | null } | null)?.application_id ?? "",
  );
  if (applicationId) await syncTutorAssignment(db, applicationId);
  return { ok: true };
}
