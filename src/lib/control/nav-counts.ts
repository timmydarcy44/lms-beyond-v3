import { unstable_cache } from "next/cache";
import { getServiceRoleClient } from "@/lib/supabase/server";
import type { ControlNavCounts } from "@/lib/control/nav";
import { looksLikeTestAccount, looksLikeTestDeal } from "@/lib/control/test-account";

const EMPTY: ControlNavCounts = {
  pipelineLate: 0,
  admissionsReview: 0,
  expertsPending: 0,
  opcoToFile: 0,
};

async function loadControlNavCounts(): Promise<ControlNavCounts> {
  try {
  const db = getServiceRoleClient();
  if (!db) return EMPTY;
  const today = new Date().toISOString().slice(0, 10);

  const [pipeline, admissions, experts] = await Promise.all([
    db
      .from("crm_pipeline_deals")
      .select("company_name, email, is_test")
      .lt("next_action_date", today)
      .or("pipeline_type.is.null,pipeline_type.eq.btob"),
    db.from("cfa_applications").select("email, first_name, last_name").eq("status", "review"),
    db
      .from("experts")
      .select("email")
      .or("review_status.eq.pending_review,review_status.is.null"),
  ]);

  let pipelineRows = pipeline.error ? [] : pipeline.data ?? [];
  if (pipeline.error && /is_test/i.test(pipeline.error.message)) {
    const retry = await db
      .from("crm_pipeline_deals")
      .select("company_name, email")
      .lt("next_action_date", today)
      .or("pipeline_type.is.null,pipeline_type.eq.btob");
    pipelineRows = retry.error ? [] : retry.data ?? [];
  }
  const admissionRows = admissions.error ? [] : admissions.data ?? [];
  const expertRows = experts.error ? [] : experts.data ?? [];

  return {
    pipelineLate: pipelineRows.filter((row) => !looksLikeTestDeal(row)).length,
    admissionsReview: admissions.error
      ? 0
      : admissionRows.filter((row) => !looksLikeTestAccount({ email: row.email, name: `${row.first_name ?? ""} ${row.last_name ?? ""}` })).length,
    expertsPending: experts.error
      ? 0
      : expertRows.filter((row) => !looksLikeTestAccount({ email: row.email })).length,
    opcoToFile: 0,
  };
  } catch {
    return EMPTY;
  }
}

export const getControlNavCounts = unstable_cache(loadControlNavCounts, ["control-nav-counts"], {
  revalidate: 60,
});
