import { NextResponse } from "next/server";
import {
  getLearnerEarnedOpenBadges,
  getLearnerVisibleOpenBadges,
} from "@/lib/openbadges/learner-visible-badges";
import { createSupabaseServerClient, getServiceRoleClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

/** Wallet badges uniquement — évite getApprenantDashboardData() complet. */
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
  const { data: profile } = await db
    .from("profiles")
    .select("company_id, school_id")
    .eq("id", user.id)
    .maybeSingle();

  const orgId =
    (profile?.company_id as string | null) ?? (profile?.school_id as string | null) ?? null;
  const orgIds = orgId ? [orgId] : [];

  const [earnedOpenBadges, visibleOpenBadges] = await Promise.all([
    getLearnerEarnedOpenBadges(user.id),
    getLearnerVisibleOpenBadges(user.id, orgId, orgIds),
  ]);

  return NextResponse.json({ earnedOpenBadges, visibleOpenBadges });
}
