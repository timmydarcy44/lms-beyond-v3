import type { SupabaseClient } from "@supabase/supabase-js";
import { loadEmployeeTestResults } from "@/lib/entreprise/employee-profile-diagnostics";

/** Destinataire unique « CFA » pour le partage des tests. */
export const CFA_ASSESSMENT_RECIPIENT = "b7c0a1e2-4f3d-4a6b-9c8d-1e2f3a4b5c6d";

export type CfaTestKind = "disc" | "idmc" | "soft";

export async function availableCfaTests(db: SupabaseClient, userId: string): Promise<CfaTestKind[]> {
  const results = await loadEmployeeTestResults(db, userId);
  const tests: CfaTestKind[] = [];
  if (results.disc) tests.push("disc");
  if (results.idmc_score != null || results.idmc_axes) tests.push("idmc");
  if (results.soft_skills.length > 0) tests.push("soft");
  return tests;
}

export async function grantCfaAssessmentShares(
  db: SupabaseClient,
  userId: string,
  requested: Partial<Record<CfaTestKind, boolean>>,
) {
  const available = new Set(await availableCfaTests(db, userId));
  const now = new Date().toISOString();
  for (const type of ["disc", "idmc", "soft"] as const) {
    if (!available.has(type) || !requested[type]) continue;
    const write = await db.from("assessment_shares").upsert(
      {
        user_id: userId,
        assessment_type: type,
        recipient_type: "cfa",
        recipient_id: CFA_ASSESSMENT_RECIPIENT,
        shared: true,
        shared_at: now,
        revoked_at: null,
      },
      { onConflict: "user_id,assessment_type,recipient_type,recipient_id" },
    );
    if (write.error && !/assessment_shares|schema cache/i.test(write.error.message)) {
      console.error("[cfa-share]", write.error.message);
    }
  }
}
