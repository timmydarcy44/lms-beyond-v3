import { NextResponse } from "next/server";

import { getServerClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await getServerClient();
  if (!supabase) {
    return NextResponse.json({ ok: false, errorId: "SUPABASE_UNAVAILABLE" }, { status: 500 });
  }

  const { data: authData, error: authError } = await supabase.auth.getUser();
  if (authError || !authData?.user?.id) {
    return NextResponse.json({ ok: false, errorId: "UNAUTHORIZED" }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("bns_user_proof_enrollments")
    .select(
      "id, status, current_step_index, proof_id, plan_version_id, bns_proofs(id, slug, title, description)",
    )
    .eq("user_id", authData.user.id)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ ok: false, errorId: "ENROLLMENTS_FETCH_FAILED" }, { status: 500 });
  }

  return NextResponse.json({ ok: true, enrollments: data ?? [] });
}

