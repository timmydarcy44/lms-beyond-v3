import { NextRequest, NextResponse } from "next/server";

import { requireTutorClient } from "@/lib/tuteur/require-tutor";

const SCOPES = ["disc", "idmc", "soft_skills"] as const;

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ studentId: string }> },
) {
  const auth = await requireTutorClient();
  if (!auth.ok) return NextResponse.json({ error: auth.message }, { status: auth.status });
  const { studentId } = await params;
  const supabase = auth.ctx.supabase;

  const { data: assignment } = await supabase
    .from("tutor_assignments")
    .select("id")
    .eq("tutor_id", auth.ctx.userId)
    .eq("learner_id", studentId)
    .in("status", ["active", "paused"])
    .maybeSingle();
  if (!assignment) return NextResponse.json({ error: "Alternant introuvable" }, { status: 404 });

  const { data: shares, error } = await supabase
    .from("test_results_sharing")
    .select("scope, granted_at")
    .eq("student_id", studentId)
    .eq("shared_with", "tutor")
    .is("revoked_at", null);

  if (error) {
    const msg = `${error.code ?? ""} ${error.message ?? ""}`.toLowerCase();
    if (error.code === "42P01" || error.code === "PGRST205" || msg.includes("does not exist")) {
      return NextResponse.json({ shares: [], results: {} });
    }
    return NextResponse.json({ error: "Lecture impossible" }, { status: 500 });
  }

  const active = (shares ?? []).filter((row) => SCOPES.includes(row.scope as (typeof SCOPES)[number]));
  const results: Record<string, unknown> = {};

  for (const share of active) {
    const scope = String(share.scope);
    if (scope === "disc") {
      const { data } = await supabase.from("disc_resultats").select("scores").eq("profile_id", studentId).maybeSingle();
      results.disc = data?.scores ?? null;
    } else if (scope === "idmc") {
      const { data } = await supabase.from("idmc_resultats").select("scores").eq("profile_id", studentId).maybeSingle();
      results.idmc = data?.scores ?? null;
    } else if (scope === "soft_skills") {
      const { data } = await supabase.from("soft_skills_resultats").select("scores").eq("learner_id", studentId).maybeSingle();
      results.soft_skills = data?.scores ?? null;
    }
    await supabase.from("test_results_views").insert({
      student_id: studentId,
      viewer_id: auth.ctx.userId,
      scope,
    });
  }

  return NextResponse.json({
    shares: active.map((row) => ({ scope: row.scope, grantedAt: row.granted_at })),
    results,
  });
}
