import type { SupabaseClient } from "@supabase/supabase-js";

/** Crée ou clôt tutor_assignments à partir du placement actif et du compte apprenant. */
export async function syncTutorAssignment(db: SupabaseClient, applicationId: string): Promise<void> {
  const application = await db
    .from("cfa_applications")
    .select("profile_id")
    .eq("id", applicationId)
    .maybeSingle();
  if (application.error && /profile_id|schema cache/i.test(application.error.message)) return;
  const learnerId = String((application.data as { profile_id?: string | null } | null)?.profile_id ?? "").trim();

  const placement = await db
    .from("apprentice_placements")
    .select("status, tutor_id")
    .eq("apprentice_id", applicationId)
    .eq("status", "active")
    .maybeSingle();
  if (placement.error && /apprentice_placements|schema cache/i.test(placement.error.message)) return;

  let tutorUserId = "";
  const tutorId = String((placement.data as { tutor_id?: string | null } | null)?.tutor_id ?? "");
  if (tutorId) {
    const tutor = await db.from("company_tutors").select("user_id").eq("id", tutorId).maybeSingle();
    tutorUserId = String((tutor.data as { user_id?: string | null } | null)?.user_id ?? "");
  }

  if (!learnerId) return;

  if (!tutorUserId) {
    await db
      .from("tutor_assignments")
      .update({ status: "ended", ended_at: new Date().toISOString() })
      .eq("learner_id", learnerId)
      .eq("status", "active");
    return;
  }

  await db
    .from("tutor_assignments")
    .update({ status: "ended", ended_at: new Date().toISOString() })
    .eq("learner_id", learnerId)
    .eq("status", "active")
    .neq("tutor_id", tutorUserId);

  const existing = await db
    .from("tutor_assignments")
    .select("id")
    .eq("learner_id", learnerId)
    .eq("tutor_id", tutorUserId)
    .is("organization_id", null)
    .maybeSingle();

  if (existing.data && (existing.data as { id: string }).id) {
    await db
      .from("tutor_assignments")
      .update({ status: "active", ended_at: null })
      .eq("id", (existing.data as { id: string }).id);
    return;
  }

  await db.from("tutor_assignments").insert({
    tutor_id: tutorUserId,
    learner_id: learnerId,
    status: "active",
    started_at: new Date().toISOString(),
  });
}

export async function activateTutorByEmail(db: SupabaseClient, email: string, userId: string): Promise<boolean> {
  const tutors = await db.from("company_tutors").select("id, user_id").ilike("email", email);
  if (tutors.error || !tutors.data?.length) return false;
  const now = new Date().toISOString();
  await db
    .from("company_tutors")
    .update({ user_id: userId, activated_at: now })
    .ilike("email", email)
    .is("user_id", null);
  const { grantUserRole } = await import("@/lib/auth/user-roles");
  await grantUserRole(db, userId, "tuteur");
  const placements = await db
    .from("apprentice_placements")
    .select("apprentice_id")
    .in("tutor_id", (tutors.data as Array<{ id: string }>).map((row) => row.id))
    .eq("status", "active");
  for (const row of placements.data ?? []) {
    await syncTutorAssignment(db, String((row as { apprentice_id: string }).apprentice_id));
  }
  return true;
}
