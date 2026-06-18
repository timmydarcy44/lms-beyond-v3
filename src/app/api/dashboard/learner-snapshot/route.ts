import { NextResponse } from "next/server";
import { resolveLearnerDisplayFirstName } from "@/lib/apprenant/display-first-name";
import {
  collectLearnerProfileCandidates,
  fetchDiscScoresForCandidates,
  fetchIdmcAxesForCandidates,
  fetchSoftSkillsRadarForCandidates,
} from "@/lib/learner/resolve-learner-profile-candidates";
import { createSupabaseServerClient, getServiceRoleClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

/** Snapshot léger : profil + tests en une seule requête serveur parallélisée. */
export async function GET() {
  const authClient = await createSupabaseServerClient();
  if (!authClient) {
    return NextResponse.json({ error: "Configuration manquante" }, { status: 500 });
  }

  const {
    data: { user },
  } = await authClient.auth.getUser();
  if (!user?.id) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const db = getServiceRoleClient() ?? authClient;
  const userId = user.id;
  const email = (user.email ?? "").trim().toLowerCase();
  const meta = (user.user_metadata ?? {}) as Record<string, unknown>;

  const profileIds = await collectLearnerProfileCandidates(db, userId, email);

  const [profileRow, employeeRow, discScores, idmcAxes, softSkillsRadar] = await Promise.all([
    db
      .from("profiles")
      .select("first_name, last_name, email, poste_actuel")
      .eq("id", userId)
      .maybeSingle(),
    email
      ? db
          .from("employees")
          .select("first_name, job_title")
          .or(`profile_id.eq.${userId},email.eq.${email}`)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle()
      : Promise.resolve({ data: null }),
    fetchDiscScoresForCandidates(db, profileIds),
    fetchIdmcAxesForCandidates(db, profileIds),
    fetchSoftSkillsRadarForCandidates(db, profileIds),
  ]);

  const firstName = resolveLearnerDisplayFirstName({
    profileFirstName: profileRow.data?.first_name ?? employeeRow.data?.first_name,
    metadataFirstName:
      typeof meta.first_name === "string"
        ? meta.first_name
        : typeof meta.prenom === "string"
          ? meta.prenom
          : null,
    metadataPrenom: typeof meta.prenom === "string" ? meta.prenom : null,
    metadataGivenName: typeof meta.given_name === "string" ? meta.given_name : null,
    email: profileRow.data?.email ?? user.email,
  });

  return NextResponse.json({
    userId,
    firstName,
    jobTitle:
      (employeeRow.data?.job_title as string | null) ??
      (profileRow.data?.poste_actuel as string | null) ??
      null,
    discScores,
    idmcAxes,
    softSkillsRadar,
  });
}
