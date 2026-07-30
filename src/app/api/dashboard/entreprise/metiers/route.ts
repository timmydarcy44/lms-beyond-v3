import { NextRequest, NextResponse } from "next/server";
import { resolveEntrepriseOverviewAccess } from "@/lib/entreprise/overview-route";
import { getServiceRoleClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type JobRoleRow = {
  id: string;
  title: string | null;
  description: string | null;
  hard_skills: string[] | null;
  soft_skills: string[] | null;
  created_at: string | null;
  updated_at: string | null;
};

function normalizeSkills(input: unknown) {
  if (!Array.isArray(input)) return [];
  const cleaned = input
    .map((item) => String(item ?? "").trim())
    .filter(Boolean)
    .slice(0, 30);
  return Array.from(new Set(cleaned));
}

export async function GET() {
  const access = await resolveEntrepriseOverviewAccess();
  if (!access.ok) {
    return NextResponse.json({ error: access.error }, { status: access.status });
  }
  if ("superAdminPreview" in access && access.superAdminPreview) {
    return NextResponse.json({ roles: [] });
  }
  if ("configurationRequired" in access && access.configurationRequired) {
    return NextResponse.json({ error: "Organisation non configurée", needsOnboarding: true }, { status: 400 });
  }

  const service = getServiceRoleClient();
  if (!service) {
    return NextResponse.json({ error: "Service indisponible" }, { status: 503 });
  }

  const { data, error } = await service
    .from("enterprise_job_roles")
    .select("id, title, description, hard_skills, soft_skills, created_at, updated_at")
    .eq("organization_id", access.organizationId)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const roles = ((data ?? []) as JobRoleRow[]).map((role) => ({
    id: role.id,
    title: role.title ?? "",
    description: role.description ?? "",
    hard_skills: Array.isArray(role.hard_skills) ? role.hard_skills : [],
    soft_skills: Array.isArray(role.soft_skills) ? role.soft_skills : [],
    created_at: role.created_at,
    updated_at: role.updated_at,
  }));

  return NextResponse.json({ roles });
}

export async function POST(request: NextRequest) {
  const access = await resolveEntrepriseOverviewAccess();
  if (!access.ok) {
    return NextResponse.json({ error: access.error }, { status: access.status });
  }
  if ("superAdminPreview" in access && access.superAdminPreview) {
    return NextResponse.json({ error: "Mode aperçu super admin" }, { status: 400 });
  }
  if ("configurationRequired" in access && access.configurationRequired) {
    return NextResponse.json({ error: "Organisation non configurée", needsOnboarding: true }, { status: 400 });
  }

  const service = getServiceRoleClient();
  if (!service) {
    return NextResponse.json({ error: "Service indisponible" }, { status: 503 });
  }

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
  const description = String(body.description ?? "").trim();
  const hardSkills = normalizeSkills(body.hard_skills);
  const softSkills = normalizeSkills(body.soft_skills);

  if (!title) {
    return NextResponse.json({ error: "Le nom du métier est requis" }, { status: 400 });
  }

  const { data, error } = await service
    .from("enterprise_job_roles")
    .insert({
      organization_id: access.organizationId,
      created_by: access.userId,
      title,
      description: description || null,
      hard_skills: hardSkills,
      soft_skills: softSkills,
    })
    .select("id, title, description, hard_skills, soft_skills, created_at, updated_at")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ role: data }, { status: 201 });
}
