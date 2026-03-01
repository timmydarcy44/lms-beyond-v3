import { NextRequest, NextResponse } from "next/server";

import { getServerClient } from "@/lib/supabase/server";

type RouteParams = { params: Promise<{ proofId: string }> };

const looksLikeUuid = (value: string) => value.includes("-") && value.length >= 32;

export async function POST(_: NextRequest, { params }: RouteParams) {
  const { proofId } = await params;
  const supabase = await getServerClient();
  if (!supabase) {
    return NextResponse.json({ ok: false, errorId: "SUPABASE_UNAVAILABLE" }, { status: 500 });
  }

  const { data: authData, error: authError } = await supabase.auth.getUser();
  if (authError || !authData?.user?.id) {
    return NextResponse.json({ ok: false, errorId: "UNAUTHORIZED" }, { status: 401 });
  }

  const { data: proof, error: proofError } = await supabase
    .from("bns_proofs")
    .select("id, latest_plan_version_id, is_published")
    .eq(looksLikeUuid(proofId) ? "id" : "slug", proofId)
    .maybeSingle();

  if (proofError || !proof || !proof.is_published || !proof.latest_plan_version_id) {
    return NextResponse.json({ ok: false, errorId: "PROOF_NOT_AVAILABLE" }, { status: 404 });
  }

  const { data: existing } = await supabase
    .from("bns_user_proof_enrollments")
    .select("id, status, current_step_index")
    .eq("user_id", authData.user.id)
    .eq("proof_id", proof.id)
    .eq("plan_version_id", proof.latest_plan_version_id)
    .maybeSingle();

  if (existing) {
    return NextResponse.json({ ok: true, enrollment: existing });
  }

  const { data: created, error: createError } = await supabase
    .from("bns_user_proof_enrollments")
    .insert({
      user_id: authData.user.id,
      proof_id: proof.id,
      plan_version_id: proof.latest_plan_version_id,
      status: "active",
      current_step_index: 0,
    })
    .select("id, status, current_step_index")
    .maybeSingle();

  if (createError || !created) {
    return NextResponse.json({ ok: false, errorId: "ENROLL_FAILED" }, { status: 500 });
  }

  return NextResponse.json({ ok: true, enrollment: created });
}

