import { NextResponse } from "next/server";

import { getServerClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await getServerClient();
  if (!supabase) {
    return NextResponse.json({ ok: false, errorId: "SUPABASE_UNAVAILABLE" }, { status: 500 });
  }

  const { data, error } = await supabase
    .from("bns_proofs")
    .select(
      "id, slug, title, description, latest_plan_version_id, is_published, bns_proof_plan_versions(id, version_number, created_at)",
    )
    .eq("is_published", true)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ ok: false, errorId: "PROOFS_FETCH_FAILED" }, { status: 500 });
  }

  return NextResponse.json({ ok: true, proofs: data ?? [] });
}

