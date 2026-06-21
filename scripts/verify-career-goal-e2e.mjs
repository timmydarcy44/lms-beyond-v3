/**
 * Vérifie migration + logique needsCareerGoal sur un particulier test.
 * Usage: node scripts/verify-career-goal-e2e.mjs [email]
 */
import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";

dotenv.config({ path: ".env.local" });

const emailArg = (process.argv[2] ?? "timmydarcy44+test3@gmail.com").trim().toLowerCase();

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("Missing Supabase env");
  process.exit(1);
}

const service = createClient(url, key, { auth: { persistSession: false } });

function resolveNeedsCareerGoal(profile, userRole = null) {
  const role = String(profile?.role_type ?? profile?.role ?? userRole ?? "")
    .trim()
    .toLowerCase();
  const isParticulier = role === "particulier" || role === "learner";
  if (!profile?.id || !isParticulier) return { show: false, reason: "not_particulier" };
  if (profile.school_id || profile.entreprise_id) return { show: false, reason: "linked_org" };
  if (profile.onboarding_completed === false) return { show: false, reason: "onboarding_pending" };
  if (String(profile.career_goal ?? "").trim()) return { show: false, reason: "career_goal_set" };
  return { show: true, reason: "career_goal_empty" };
}

async function main() {
  const { data: profile, error } = await service
    .from("profiles")
    .select("id, email, role, role_type, school_id, entreprise_id, career_goal, career_goal_other")
    .ilike("email", emailArg)
    .maybeSingle();

  if (error) {
    if (/career_goal/.test(error.message)) {
      console.error("FAIL: colonnes career_goal absentes");
      process.exit(1);
    }
    throw error;
  }

  if (!profile) {
    console.error(`FAIL: profil introuvable pour ${emailArg}`);
    process.exit(1);
  }

  console.log("Profile:", {
    id: profile.id,
    email: profile.email,
    role_type: profile.role_type,
    role: profile.role,
    school_id: profile.school_id,
    entreprise_id: profile.entreprise_id,
    career_goal: profile.career_goal,
  });

  const previousGoal = profile.career_goal;
  const previousOther = profile.career_goal_other;

  const { error: clearError } = await service
    .from("profiles")
    .update({ career_goal: null, career_goal_other: null })
    .eq("id", profile.id);
  if (clearError) throw clearError;

  const { data: cleared } = await service
    .from("profiles")
    .select("id, email, role, role_type, school_id, entreprise_id, career_goal, career_goal_other")
    .eq("id", profile.id)
    .maybeSingle();

  const afterClear = resolveNeedsCareerGoal(cleared);
  console.log("\nAfter clearing career_goal:", afterClear);

  const { error: patchTestError } = await service
    .from("profiles")
    .update({ career_goal: "needs_help", career_goal_other: null })
    .eq("id", profile.id);
  if (patchTestError) throw patchTestError;

  const { data: patched } = await service
    .from("profiles")
    .select("career_goal")
    .eq("id", profile.id)
    .maybeSingle();
  console.log("\nPATCH career_goal test:", patched?.career_goal === "needs_help" ? "OK" : "FAIL");

  await service
    .from("profiles")
    .update({ career_goal: previousGoal, career_goal_other: previousOther })
    .eq("id", profile.id);

  if (!afterClear.show) {
    console.error("\nFAIL: modale ne s'afficherait PAS —", afterClear.reason);
    process.exit(1);
  }

  console.log("\nPASS: needsCareerGoal=true → modale « Savez-vous déjà quel métier… » au dashboard.");
  console.log("Compte test:", emailArg, "— career_goal remis à l'état initial.");
  console.log("Test UI: vider career_goal puis ouvrir /dashboard/apprenant (code local requis).");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
