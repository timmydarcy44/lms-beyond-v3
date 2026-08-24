import { NextRequest, NextResponse } from "next/server";

import { resolveEntrepriseOverviewAccess } from "@/lib/entreprise/overview-route";
import { getServiceRoleClient } from "@/lib/supabase/server";

type Params = {
  params: Promise<{ roleId: string }>;
};

function normalizeSkills(input: unknown) {
  if (!Array.isArray(input)) return [];
  return Array.from(
    new Set(
      input
        .map((item) => String(item ?? "").trim())
        .filter(Boolean)
        .slice(0, 30),
    ),
  );
}

export async function PUT(request: NextRequest, context: Params) {
  const access = await resolveEntrepriseOverviewAccess();
  if (!access.ok) {
    return NextResponse.json({ error: access.error }, { status: access.status });
  }

  const service = getServiceRoleClient();
  if (!service) {
    return NextResponse.json({ error: "Service indisponible" }, { status: 503 });
  }

  const { roleId } = await context.params;

  let body: {
    title?: unknown;
    description?: unknown;
    hard_skills?: unknown;
    soft_skills?: unknown;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Corps invalide" }, { status: 400 });
  }

  const title = String(body.title ?? "").trim();
  if (!title) {
    return NextResponse.json({ error: "Le nom du metier est requis" }, { status: 400 });
  }

  const { data, error } = await service
    .from("enterprise_job_roles")
    .update({
      title,
      description: String(body.description ?? "").trim() || null,
      hard_skills: normalizeSkills(body.hard_skills),
      soft_skills: normalizeSkills(body.soft_skills),
      updated_at: new Date().toISOString(),
    })
    .eq("id", roleId)
    .eq("organization_id", access.organizationId)
    .select("id, title, description, hard_skills, soft_skills, created_at, updated_at")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ role: data });
}

export async function DELETE(_request: NextRequest, context: Params) {
  const access = await resolveEntrepriseOverviewAccess();
  if (!access.ok) {
    return NextResponse.json({ error: access.error }, { status: access.status });
  }

  const service = getServiceRoleClient();
  if (!service) {
    return NextResponse.json({ error: "Service indisponible" }, { status: 503 });
  }

  const { roleId } = await context.params;
  const { error } = await service
    .from("enterprise_job_roles")
    .delete()
    .eq("id", roleId)
    .eq("organization_id", access.organizationId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ success: true });
}
