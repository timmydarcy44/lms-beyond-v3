import { NextRequest, NextResponse } from "next/server";

import { isSuperAdmin } from "@/lib/auth/super-admin";
import { getServiceRoleClientOrFallback, getServerClient } from "@/lib/supabase/server";

type RouteParams = { params: Promise<{ pathId: string }> };

export async function POST(_: NextRequest, { params }: RouteParams) {
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

  const { data: path, error: pathError } = await supabase
    .from("bns_proof_paths")
    .select(
      "id, title, slug, description, trigger_label, final_validation_type, final_validation_prompt, final_validation_rules",
    )
    .eq("id", pathId)
    .maybeSingle();

  if (pathError || !path) {
    return NextResponse.json({ ok: false, errorId: "PATH_NOT_FOUND" }, { status: 404 });
  }

  const { data: steps } = await supabase
    .from("bns_proof_path_steps")
    .select("proof_id, step_order, bns_proofs(id, title, slug, sector, level)")
    .eq("path_id", path.id)
    .order("step_order", { ascending: true });

  const snapshot = {
    pathId: path.id,
    title: path.title,
    slug: path.slug,
    description: path.description,
    trigger_label: path.trigger_label,
    steps: (steps ?? []).map((step) => {
      const proof = Array.isArray(step.bns_proofs) ? step.bns_proofs[0] : step.bns_proofs;
      return {
        proof_id: step.proof_id,
        title: proof?.title,
        slug: proof?.slug,
        sector: proof?.sector,
        level: proof?.level,
        step_order: step.step_order,
      };
    }),
    final_validation_type: path.final_validation_type,
    final_validation_prompt: path.final_validation_prompt,
    final_validation_rules: path.final_validation_rules,
    generatedAt: new Date().toISOString(),
  };

  const { data: latestVersion } = await supabase
    .from("bns_proof_path_versions")
    .select("version_number")
    .eq("path_id", path.id)
    .order("version_number", { ascending: false })
    .limit(1)
    .maybeSingle();

  const nextVersion = (latestVersion?.version_number ?? 0) + 1;

  const { data: created, error: createError } = await supabase
    .from("bns_proof_path_versions")
    .insert({
      path_id: path.id,
      version_number: nextVersion,
      snapshot,
      published_by: actorId,
    })
    .select("id, version_number")
    .maybeSingle();

  if (createError || !created) {
    return NextResponse.json({ ok: false, errorId: "PATH_VERSION_CREATE_FAILED" }, { status: 500 });
  }

  const { error: updateError } = await supabase
    .from("bns_proof_paths")
    .update({ is_published: true, updated_by: actorId })
    .eq("id", path.id);

  if (updateError) {
    return NextResponse.json({ ok: false, errorId: "PATH_PUBLISH_FAILED" }, { status: 500 });
  }

  return NextResponse.json({ ok: true, version: created });
}

