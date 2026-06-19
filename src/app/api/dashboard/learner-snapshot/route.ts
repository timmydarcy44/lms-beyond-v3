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

  if (!profileIds.length) {
    console.warn("[learner-snapshot] no profile candidates", { userId, email });
  }

  const [profilesResult, employeeResult, discScores, idmcAxes, softSkillsRadar] = await Promise.all([
    profileIds.length
      ? db
          .from("profiles")
          .select("id, first_name, last_name, email, poste_actuel")
          .in("id", profileIds)
      : Promise.resolve({ data: [] }),
    email
      ? db
          .from("employees")
          .select("first_name, last_name, job_title")
          .or(`profile_id.eq.${userId},email.eq.${email}`)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle()
      : Promise.resolve({ data: null }),
    fetchDiscScoresForCandidates(db, profileIds),
    fetchIdmcAxesForCandidates(db, profileIds),
    fetchSoftSkillsRadarForCandidates(db, profileIds),
  ]);

  const profileRows = (profilesResult.data ?? []) as Array<{
    id: string;
    first_name?: string | null;
    last_name?: string | null;
    email?: string | null;
    poste_actuel?: string | null;
  }>;
  const profileRow =
    profileRows.find((p) => p.id === userId) ??
    profileRows.find((p) => String(p.first_name ?? "").trim()) ??
    profileRows[0] ??
    null;
  const employee = employeeResult.data;

  const firstName = resolveLearnerDisplayFirstName({
    profileFirstName: profileRow?.first_name ?? employee?.first_name,
    metadataFirstName:
      typeof meta.first_name === "string"
        ? meta.first_name
        : typeof meta.prenom === "string"
          ? meta.prenom
          : null,
    metadataPrenom: typeof meta.prenom === "string" ? meta.prenom : null,
    metadataGivenName: typeof meta.given_name === "string" ? meta.given_name : null,
    email: profileRow?.email ?? user.email,
  });

  if (!discScores && !idmcAxes && profileIds.length > 0) {
    console.warn("[learner-snapshot] no test scores for candidates", {
      userId,
      email,
      profileIds,
    });
  }

  return NextResponse.json({
    userId,
    firstName,
    jobTitle: employee?.job_title ?? profileRow?.poste_actuel ?? null,
    discScores,
    idmcAxes,
    softSkillsRadar,
  });
}
