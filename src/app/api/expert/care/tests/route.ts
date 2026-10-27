import { NextResponse } from "next/server";
import { CARE_SQL_HINT, missingRelation, requireCareExpert } from "@/lib/expert/care-auth";
import { BYOUND_CARE_TESTS } from "@/lib/expert/care-tests";

export async function GET() {
  const gate = await requireCareExpert();
  if (!gate.ok) return gate.response;
  const { data, error } = await gate.db
    .from("expert_care_invites")
    .select("id,client_id,test_slug,sent_at,opened_at,completed_at,created_at")
    .eq("expert_id", gate.expertId)
    .order("created_at", { ascending: false })
    .limit(80);
  if (error) {
    return NextResponse.json(
      { error: missingRelation(error) ? CARE_SQL_HINT : error.message, tests: BYOUND_CARE_TESTS, invites: [] },
      { status: missingRelation(error) ? 200 : 500 },
    );
  }
  return NextResponse.json({ tests: BYOUND_CARE_TESTS, invites: data ?? [] });
}
