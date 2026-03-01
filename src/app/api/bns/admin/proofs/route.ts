import { NextResponse } from "next/server";

import { isSuperAdmin } from "@/lib/auth/super-admin";
import { getServiceRoleClientOrFallback } from "@/lib/supabase/server";
import { getServerClient } from "@/lib/supabase/server";

// Requires migration 013_bns_proofs.sql to be applied in Supabase.

export async function GET() {
  const hasAccess = await isSuperAdmin();
  if (!hasAccess) {
    return NextResponse.json({ ok: false, errorId: "FORBIDDEN" }, { status: 403 });
  }

  const supabase = await getServiceRoleClientOrFallback();
  if (!supabase) {
    return NextResponse.json({ ok: false, errorId: "SUPABASE_UNAVAILABLE" }, { status: 500 });
  }

  const { data, error } = await supabase
    .from("bns_proofs")
    .select(
      "id, slug, title, description, sector, level, expected_outcome, expected_proof, is_published, latest_plan_version_id",
    )
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ ok: false, errorId: "ADMIN_PROOFS_FETCH_FAILED" }, { status: 500 });
  }

  return NextResponse.json({ ok: true, proofs: data ?? [] });
}

export async function POST(request: Request) {
  const hasAccess = await isSuperAdmin();
  if (!hasAccess) {
    return NextResponse.json({ ok: false, errorId: "FORBIDDEN" }, { status: 403 });
  }

  const supabase = await getServiceRoleClientOrFallback();
  if (!supabase) {
    return NextResponse.json({ ok: false, errorId: "SUPABASE_UNAVAILABLE" }, { status: 500 });
  }

  const authClient = await getServerClient();
  const { data: authData } = authClient ? await authClient.auth.getUser() : { data: null };
  const actorId = authData?.user?.id ?? null;

  const payload = await request.json();
  const {
    title,
    slug,
    description,
    recognition_goal,
    final_deliverable,
    sector,
    level,
    expected_outcome,
    expected_proof,
  } = payload ?? {};

  if (!title || !slug) {
    return NextResponse.json({ ok: false, errorId: "MISSING_FIELDS" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("bns_proofs")
    .insert({
      title,
      slug,
      description: typeof description === "string" ? description : null,
      recognition_goal: typeof recognition_goal === "string" ? recognition_goal : null,
      final_deliverable: typeof final_deliverable === "string" ? final_deliverable : null,
      sector: typeof sector === "string" ? sector : null,
      level: typeof level === "string" ? level : null,
      expected_outcome: typeof expected_outcome === "string" ? expected_outcome : null,
      expected_proof: typeof expected_proof === "string" ? expected_proof : null,
      created_by: actorId,
    })
    .select("id, slug, title, description, sector, level, expected_outcome, expected_proof, is_published")
    .maybeSingle();

  if (error || !data) {
    return NextResponse.json({ ok: false, errorId: "ADMIN_PROOF_CREATE_FAILED" }, { status: 500 });
  }

  return NextResponse.json({ ok: true, proof: data });
}

