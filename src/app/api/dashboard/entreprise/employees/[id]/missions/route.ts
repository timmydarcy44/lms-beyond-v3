import { NextRequest, NextResponse } from "next/server";
import { resolveEntrepriseOverviewAccess } from "@/lib/entreprise/overview-route";
import { getServiceRoleClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const { id: employeeId } = await context.params;
  const access = await resolveEntrepriseOverviewAccess();
  if (!access.ok) {
    return NextResponse.json({ error: access.error }, { status: access.status });
  }
  if ("superAdminPreview" in access && access.superAdminPreview) {
    return NextResponse.json({ error: "Mode aperçu super admin" }, { status: 400 });
  }
  if ("configurationRequired" in access && access.configurationRequired) {
    return NextResponse.json({ error: "Organisation non configurée" }, { status: 400 });
  }

  const service = getServiceRoleClient();
  if (!service) {
    return NextResponse.json({ error: "Service indisponible" }, { status: 503 });
  }

  const { data, error } = await service
    .from("employee_missions")
    .select("id, title, description, due_date, status, created_at, updated_at")
    .eq("employee_id", employeeId)
    .eq("organization_id", access.organizationId)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
  return NextResponse.json({ missions: data ?? [] });
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const { id: employeeId } = await context.params;
  const access = await resolveEntrepriseOverviewAccess();
  if (!access.ok) {
    return NextResponse.json({ error: access.error }, { status: access.status });
  }
  if ("superAdminPreview" in access && access.superAdminPreview) {
    return NextResponse.json({ error: "Mode aperçu super admin" }, { status: 400 });
  }
  if ("configurationRequired" in access && access.configurationRequired) {
    return NextResponse.json({ error: "Organisation non configurée" }, { status: 400 });
  }

  let body: { title?: string; description?: string; due_date?: string | null };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Corps invalide" }, { status: 400 });
  }

  const title = String(body.title ?? "").trim();
  if (!title) {
    return NextResponse.json({ error: "Titre requis" }, { status: 400 });
  }

  const service = getServiceRoleClient();
  if (!service) {
    return NextResponse.json({ error: "Service indisponible" }, { status: 503 });
  }

  const { data: employee } = await service
    .from("employees")
    .select("id, profile_id, company_id, email")
    .eq("id", employeeId)
    .eq("company_id", access.organizationId)
    .maybeSingle();

  if (!employee) {
    return NextResponse.json({ error: "Collaborateur introuvable" }, { status: 404 });
  }

  let profileId = (employee.profile_id as string | null) ?? null;
  if (!profileId && employee.email) {
    const { data: profileRow } = await service
      .from("profiles")
      .select("id")
      .eq("email", String(employee.email).trim().toLowerCase())
      .maybeSingle();
    profileId = (profileRow?.id as string | null) ?? null;
    if (profileId) {
      await service.from("employees").update({ profile_id: profileId }).eq("id", employeeId);
    }
  }

  const description = String(body.description ?? "").trim() || null;
  const due_date = body.due_date ? String(body.due_date).slice(0, 10) : null;

  const { data: mission, error } = await service
    .from("employee_missions")
    .insert({
      organization_id: access.organizationId,
      employee_id: employeeId,
      profile_id: profileId,
      title,
      description,
      due_date,
      status: "pending",
      created_by: access.userId,
    })
    .select("id, title, description, due_date, status, created_at, updated_at")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ mission });
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const { id: employeeId } = await context.params;
  const missionId = new URL(request.url).searchParams.get("mission_id");
  if (!missionId) {
    return NextResponse.json({ error: "mission_id requis" }, { status: 400 });
  }

  const access = await resolveEntrepriseOverviewAccess();
  if (!access.ok) {
    return NextResponse.json({ error: access.error }, { status: access.status });
  }
  if ("superAdminPreview" in access && access.superAdminPreview) {
    return NextResponse.json({ error: "Mode aperçu super admin" }, { status: 400 });
  }

  const service = getServiceRoleClient();
  if (!service) {
    return NextResponse.json({ error: "Service indisponible" }, { status: 503 });
  }

  const { error } = await service
    .from("employee_missions")
    .delete()
    .eq("id", missionId)
    .eq("employee_id", employeeId)
    .eq("organization_id", access.organizationId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
  return NextResponse.json({ ok: true });
}
