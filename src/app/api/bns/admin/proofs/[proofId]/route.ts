import { NextRequest, NextResponse } from "next/server";

import { isSuperAdmin } from "@/lib/auth/super-admin";
import { getServiceRoleClientOrFallback, getServerClient } from "@/lib/supabase/server";

type RouteParams = { params: Promise<{ proofId: string }> };

export async function GET(_: NextRequest, { params }: RouteParams) {
  const { proofId } = await params;
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

  const { data: proof, error: proofError } = await supabase
    .from("bns_proofs")
    .select(
      "id, slug, title, description, recognition_goal, final_deliverable, sector, level, expected_outcome, expected_proof, is_published, latest_plan_version_id",
    )
    .eq("id", proofId)
    .maybeSingle();

  if (proofError || !proof) {
    return NextResponse.json({ ok: false, errorId: "PROOF_NOT_FOUND" }, { status: 404 });
  }

  const { data: steps, error: stepsError } = await supabase
    .from("bns_proof_steps")
    .select("id, title, description, step_order")
    .eq("proof_id", proof.id)
    .order("step_order", { ascending: true });

  if (stepsError) {
    return NextResponse.json({ ok: false, errorId: "STEPS_FETCH_FAILED" }, { status: 500 });
  }

  const stepIds = steps?.map((step) => step.id) ?? [];
  const { data: nodes, error: nodesError } = stepIds.length
    ? await supabase
        .from("bns_proof_nodes")
        .select(
          "id, proof_step_id, node_type, title, description, content_type, content_id, node_order, rules, config",
        )
        .in("proof_step_id", stepIds)
        .order("node_order", { ascending: true })
    : { data: [], error: null };

  if (nodesError) {
    return NextResponse.json({ ok: false, errorId: "NODES_FETCH_FAILED" }, { status: 500 });
  }

  return NextResponse.json({ ok: true, proof, steps: steps ?? [], nodes: nodes ?? [] });
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  const { proofId } = await params;
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
    steps,
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

  const { error: updateError } = await supabase
    .from("bns_proofs")
    .update({
      title,
      slug,
      description: typeof description === "string" ? description : null,
      recognition_goal: typeof recognition_goal === "string" ? recognition_goal : null,
      final_deliverable: typeof final_deliverable === "string" ? final_deliverable : null,
      sector: typeof sector === "string" ? sector : null,
      level: typeof level === "string" ? level : null,
      expected_outcome: typeof expected_outcome === "string" ? expected_outcome : null,
      expected_proof: typeof expected_proof === "string" ? expected_proof : null,
      updated_by: actorId,
    })
    .eq("id", proofId);

  if (updateError) {
    return NextResponse.json({ ok: false, errorId: "PROOF_UPDATE_FAILED" }, { status: 500 });
  }

  if (Array.isArray(steps)) {
    const { error: deleteError } = await supabase
      .from("bns_proof_steps")
      .delete()
      .eq("proof_id", proofId);

    if (deleteError) {
      return NextResponse.json({ ok: false, errorId: "STEPS_RESET_FAILED" }, { status: 500 });
    }

    for (const step of steps) {
      const { data: insertedStep, error: stepError } = await supabase
        .from("bns_proof_steps")
        .insert({
          proof_id: proofId,
          title: step.title,
          description: step.description ?? null,
          step_order: step.order ?? 0,
        })
        .select("id")
        .maybeSingle();

      if (stepError || !insertedStep) {
        return NextResponse.json({ ok: false, errorId: "STEP_CREATE_FAILED" }, { status: 500 });
      }

      if (Array.isArray(step.nodes) && step.nodes.length) {
        const nodesToInsert = step.nodes.map((node: Record<string, unknown>, index: number) => ({
          proof_step_id: insertedStep.id,
          node_type: typeof node.node_type === "string" ? node.node_type : "content",
          title: typeof node.title === "string" ? node.title : null,
          description: typeof node.description === "string" ? node.description : null,
          content_type: typeof node.content_type === "string" ? node.content_type : null,
          content_id: typeof node.content_id === "string" ? node.content_id : null,
          rules: typeof node.rules === "object" ? node.rules : null,
          config: typeof node.config === "object" ? node.config : null,
          node_order: typeof node.order === "number" ? node.order : index,
        }));

        const { error: nodesInsertError } = await supabase
          .from("bns_proof_nodes")
          .insert(nodesToInsert);

        if (nodesInsertError) {
          return NextResponse.json({ ok: false, errorId: "NODE_CREATE_FAILED" }, { status: 500 });
        }
      }
    }
  }

  return NextResponse.json({ ok: true });
}

