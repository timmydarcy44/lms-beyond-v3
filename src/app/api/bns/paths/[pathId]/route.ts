import { NextRequest, NextResponse } from "next/server";

import { getServiceRoleClientOrFallback } from "@/lib/supabase/server";

type RouteParams = { params: Promise<{ pathId: string }> };

export async function GET(_: NextRequest, { params }: RouteParams) {
  const { pathId } = await params;
  const supabase = await getServiceRoleClientOrFallback();
  if (!supabase) {
    return NextResponse.json({ ok: false, errorId: "SUPABASE_UNAVAILABLE" }, { status: 500 });
  }

  const { data: path, error: pathError } = await supabase
    .from("bns_proof_paths")
    .select(
      "id, title, slug, description, trigger_label, final_validation_type, final_validation_prompt, final_validation_rules",
    )
    .eq("id", pathId)
    .eq("is_published", true)
    .maybeSingle();

  if (pathError || !path) {
    return NextResponse.json({ ok: false, errorId: "PATH_NOT_FOUND" }, { status: 404 });
  }

  const { data: steps } = await supabase
    .from("bns_proof_path_steps")
    .select("proof_id, step_order, bns_proofs(id, title, slug, sector, level)")
    .eq("path_id", path.id)
    .order("step_order", { ascending: true });

  return NextResponse.json({ ok: true, path, steps: steps ?? [] });
}

