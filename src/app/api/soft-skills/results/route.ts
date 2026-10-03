import { NextResponse } from "next/server";

import {
  collectLearnerProfileCandidates,
  fetchCrossProfileSoftScoresForCandidates,
  fetchLatestSoftSkillsResultForCandidates,
  hasCompleteSoftSkillsTest,
} from "@/lib/learner/resolve-learner-profile-candidates";
import { getServerClient, getServiceRoleClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = await getServerClient();
    if (!supabase) {
      return NextResponse.json({ error: "Supabase non configuré" }, { status: 500 });
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const db = getServiceRoleClient() ?? supabase;
    const profileIds = await collectLearnerProfileCandidates(db, user.id, user.email);
    let data = await fetchLatestSoftSkillsResultForCandidates(db, profileIds);

    if (!hasCompleteSoftSkillsTest(data?.scores)) {
      const fallback = await fetchCrossProfileSoftScoresForCandidates(db, profileIds);
      if (fallback) {
        data = {
          learner_id: user.id,
          scores: fallback,
          taken_at: null,
          total_score: null,
          ai_analysis: null,
        };
      } else {
        data = null;
      }
    }

    return NextResponse.json({
      exists: hasCompleteSoftSkillsTest(data?.scores),
      result: data,
      source: hasCompleteSoftSkillsTest(data?.scores)
        ? data?.taken_at
          ? "test"
          : "cross_profile"
        : null,
    });
  } catch (error) {
    console.error("[soft-skills/results]", error);
    return NextResponse.json({ error: "Erreur inattendue" }, { status: 500 });
  }
}
