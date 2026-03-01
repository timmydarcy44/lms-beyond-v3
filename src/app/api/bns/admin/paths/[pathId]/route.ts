import { NextRequest, NextResponse } from "next/server";

import { isSuperAdmin } from "@/lib/auth/super-admin";
import { getServiceRoleClientOrFallback, getServerClient } from "@/lib/supabase/server";

type RouteParams = { params: Promise<{ pathId: string }> };

export async function GET(_: NextRequest, { params }: RouteParams) {
  const { pathId } = await params;
  const hasAccess = await isSuperAdmin();
  if (!hasAccess) {
    return NextResponse.json({ ok: false, errorId: "FORBIDDEN" }, { status: 403 });
  }

  const supabase = await getServiceRoleClientOrFallback();
  if (!supabase) {
    return NextResponse.json({ ok: false, errorId: "SUPABASE_UNAVAILABLE" }, { status: 500 });
  }

  const { data: path, error: pathError } = await supabase
    .from("bns_proof_paths")
    .select(
      "id, title, slug, description, trigger_label, final_validation_type, final_validation_prompt, final_validation_rules, is_published",
    )
    .eq("id", pathId)
    .maybeSingle();

  if (pathError || !path) {
    return NextResponse.json({ ok: false, errorId: "PATH_NOT_FOUND" }, { status: 404 });
  }

  const { data: steps } = await supabase
    .from("bns_proof_path_steps")
    .select("id, proof_id, step_order, bns_proofs(id, title, slug, sector, level)")
    .eq("path_id", path.id)
    .order("step_order", { ascending: true });

  return NextResponse.json({ ok: true, path, steps: steps ?? [] });
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  const { pathId } = await params;
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
    trigger_label,
    final_validation_type,
    final_validation_prompt,
    final_validation_rules,
    steps,
  } = payload ?? {};

  const { error: updateError } = await supabase
    .from("bns_proof_paths")
    .update({
      title,
      slug,
      description: typeof description === "string" ? description : null,
      trigger_label: typeof trigger_label === "string" ? trigger_label : null,
      final_validation_type: typeof final_validation_type === "string" ? final_validation_type : null,
      final_validation_prompt:
        typeof final_validation_prompt === "string" ? final_validation_prompt : null,
      final_validation_rules:
        typeof final_validation_rules === "object" ? final_validation_rules : null,
      updated_by: actorId,
    })
    .eq("id", pathId);

  if (updateError) {
    return NextResponse.json({ ok: false, errorId: "PATH_UPDATE_FAILED" }, { status: 500 });
  }

  if (Array.isArray(steps)) {
    await supabase.from("bns_proof_path_steps").delete().eq("path_id", pathId);
    const toInsert = steps.map((step: any, index: number) => ({
      path_id: pathId,
      proof_id: step.proof_id,
      step_order: index,
    }));
    if (toInsert.length) {
      const { error: insertError } = await supabase.from("bns_proof_path_steps").insert(toInsert);
      if (insertError) {
        return NextResponse.json({ ok: false, errorId: "PATH_STEPS_UPDATE_FAILED" }, { status: 500 });
      }
    }
  }

  return NextResponse.json({ ok: true });
}

