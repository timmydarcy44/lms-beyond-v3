import { NextRequest, NextResponse } from "next/server";

import { isSuperAdmin } from "@/lib/auth/super-admin";
import { getServiceRoleClientOrFallback, getServerClient } from "@/lib/supabase/server";

type RouteParams = { params: Promise<{ proofId: string }> };

export async function POST(_: NextRequest, { params }: RouteParams) {
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
    .select("id, title, recognition_goal, final_deliverable")
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
  const { data: nodes } = stepIds.length
    ? await supabase
        .from("bns_proof_nodes")
        .select(
          "id, proof_step_id, title, description, content_type, content_id, node_type, node_order",
        )
        .in("proof_step_id", stepIds)
        .order("node_order", { ascending: true })
    : { data: [] };

  const hasActionNode = (nodes ?? []).some((node) => node.node_type === "action");
  const hasDeliverableNode = (nodes ?? []).some((node) => node.node_type === "deliverable");
  if (!proof.final_deliverable || !hasActionNode || !hasDeliverableNode) {
    return NextResponse.json(
      { ok: false, errorId: "PROOF_NOT_READY" },
      { status: 400 },
    );
  }

  const stepMap = new Map<string, Array<Record<string, any>>>(
    stepIds.map((id) => [id, []]),
  );
  (nodes ?? []).forEach((node) => {
    const list = stepMap.get(node.proof_step_id);
    if (list) list.push(node);
  });

  const resourceIds = (nodes ?? [])
    .filter((node) => node.content_type === "resource" && node.content_id)
    .map((node) => node.content_id);
  const { data: resources } = resourceIds.length
    ? await supabase
        .from("bns_proof_resources")
        .select("id, title, file_url, mime_type")
        .in("id", resourceIds)
    : { data: [] };
  const resourceMap = new Map(
    (resources ?? []).map((resource) => [resource.id, resource]),
  );

  const snapshot = {
    proofId: proof.id,
    proofTitle: proof.title,
    recognitionGoal: proof.recognition_goal ?? null,
    finalDeliverable: proof.final_deliverable ?? null,
    generatedAt: new Date().toISOString(),
    steps: (steps ?? []).map((step) => ({
      id: step.id,
      title: step.title,
      description: step.description,
      order: step.step_order,
      contents: (stepMap.get(step.id) ?? []).map((node) => {
        const resource = node.content_id ? resourceMap.get(node.content_id) : null;
        return {
          id: node.id,
          title: node.title ?? "Contenu",
          description: node.description,
          content_type: node.content_type,
          content_id: node.content_id,
          node_type: node.node_type ?? "content",
          resource_url: resource?.file_url ?? null,
          resource_mime: resource?.mime_type ?? null,
        };
      }),
    })),
  };

  const { data: latestVersion } = await supabase
    .from("bns_proof_plan_versions")
    .select("version_number")
    .eq("proof_id", proof.id)
    .order("version_number", { ascending: false })
    .limit(1)
    .maybeSingle();

  const nextVersion = (latestVersion?.version_number ?? 0) + 1;

  const { data: created, error: createError } = await supabase
    .from("bns_proof_plan_versions")
    .insert({
      proof_id: proof.id,
      version_number: nextVersion,
      snapshot,
      published_by: actorId,
    })
    .select("id, version_number")
    .maybeSingle();

  if (createError || !created) {
    return NextResponse.json({ ok: false, errorId: "PLAN_VERSION_CREATE_FAILED" }, { status: 500 });
  }

  const { error: updateError } = await supabase
    .from("bns_proofs")
    .update({
      is_published: true,
      latest_plan_version_id: created.id,
      updated_by: actorId,
    })
    .eq("id", proof.id);

  if (updateError) {
    return NextResponse.json({ ok: false, errorId: "PROOF_PUBLISH_FAILED" }, { status: 500 });
  }

  return NextResponse.json({ ok: true, version: created });
}

