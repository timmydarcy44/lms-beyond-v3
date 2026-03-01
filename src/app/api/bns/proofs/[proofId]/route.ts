import { NextRequest, NextResponse } from "next/server";

import { getServerClient } from "@/lib/supabase/server";

type RouteParams = { params: Promise<{ proofId: string }> };

const looksLikeUuid = (value: string) => value.includes("-") && value.length >= 32;

export async function GET(_: NextRequest, { params }: RouteParams) {
  const { proofId } = await params;
  const supabase = await getServerClient();
  if (!supabase) {
    return NextResponse.json({ ok: false, errorId: "SUPABASE_UNAVAILABLE" }, { status: 500 });
  }

  const proofQuery = supabase
    .from("bns_proofs")
    .select("id, slug, title, description, latest_plan_version_id, is_published")
    .eq(looksLikeUuid(proofId) ? "id" : "slug", proofId)
    .maybeSingle();

  const { data: proof, error: proofError } = await proofQuery;
  if (proofError || !proof) {
    return NextResponse.json({ ok: false, errorId: "PROOF_NOT_FOUND" }, { status: 404 });
  }

  if (!proof.is_published || !proof.latest_plan_version_id) {
    return NextResponse.json({ ok: false, errorId: "PROOF_NOT_PUBLISHED" }, { status: 404 });
  }

  const { data: version, error: versionError } = await supabase
    .from("bns_proof_plan_versions")
    .select("id, version_number, snapshot, created_at")
    .eq("id", proof.latest_plan_version_id)
    .maybeSingle();

  if (versionError || !version) {
    return NextResponse.json({ ok: false, errorId: "PLAN_VERSION_NOT_FOUND" }, { status: 404 });
  }

  return NextResponse.json({ ok: true, proof, plan: version });
}

