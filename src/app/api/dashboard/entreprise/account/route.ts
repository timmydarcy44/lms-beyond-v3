import { NextRequest, NextResponse } from "next/server";
import { resolveEntrepriseOverviewAccess } from "@/lib/entreprise/overview-route";
import { resolveEnterpriseViewerDisplay } from "@/lib/entreprise/resolve-viewer-display";
import { createSupabaseServerClient, getServiceRoleClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const authClient = await createSupabaseServerClient();
  if (!authClient) {
    return NextResponse.json({ error: "Configuration manquante" }, { status: 500 });
  }

  const {
    data: { user },
  } = await authClient.auth.getUser();
  if (!user?.id) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const db = getServiceRoleClient() ?? authClient;
  const { data: profileFull } = await db
    .from("profiles")
    .select("first_name, last_name, full_name, email, company_id, role, role_type")
    .eq("id", user.id)
    .maybeSingle();

  let phone: string | null = null;
  const { data: phoneRow } = await db
    .from("profiles")
    .select("phone")
    .eq("id", user.id)
    .maybeSingle();
  if (phoneRow && "phone" in (phoneRow as object)) {
    phone = String((phoneRow as { phone?: string | null }).phone ?? "").trim() || null;
  }

  const profile = profileFull;

  const viewer = resolveEnterpriseViewerDisplay(
    profile,
    user.email,
    user.user_metadata as Record<string, unknown>,
  );

  let organisationName: string | null = null;
  const companyId = (profile as { company_id?: string | null } | null)?.company_id ?? null;
  const service = getServiceRoleClient();
  if (companyId && service) {
    const { data: org } = await service
      .from("organizations")
      .select("name")
      .eq("id", companyId)
      .maybeSingle();
    organisationName = org?.name ? String(org.name) : null;
  }

  return NextResponse.json({
    ...viewer,
    phone,
    userId: user.id,
    company_id: companyId,
    role: (profile as { role?: string | null } | null)?.role ?? null,
    role_type: (profile as { role_type?: string | null } | null)?.role_type ?? null,
    organisationName,
  });
}

export async function PATCH(request: NextRequest) {
  const access = await resolveEntrepriseOverviewAccess();
  if (!access.ok) {
    return NextResponse.json({ error: access.error }, { status: access.status });
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Corps invalide" }, { status: 400 });
  }

  if ("email" in body) {
    return NextResponse.json(
      { error: "L’adresse email ne peut pas être modifiée depuis cet espace." },
      { status: 400 },
    );
  }

  const firstName = String(body.first_name ?? body.prenom ?? "").trim();
  const lastName = String(body.last_name ?? body.nom ?? "").trim();
  const phone = String(body.phone ?? "").trim();

  if (!firstName || !lastName) {
    return NextResponse.json({ error: "Prénom et nom sont requis." }, { status: 400 });
  }

  const service = getServiceRoleClient();
  if (!service) {
    return NextResponse.json({ error: "Service indisponible" }, { status: 503 });
  }

  const fullName = `${firstName} ${lastName}`.trim();
  const patch: Record<string, unknown> = {
    first_name: firstName,
    last_name: lastName,
    full_name: fullName,
  };
  if (phone) patch.phone = phone;
  else patch.phone = null;

  const { data, error } = await service
    .from("profiles")
    .update(patch)
    .eq("id", access.userId)
    .select("first_name, last_name, full_name, email, phone, company_id, role, role_type")
    .single();

  if (error) {
    // phone column may not exist — retry without phone
    if (/phone/i.test(error.message)) {
      delete patch.phone;
      const retry = await service
        .from("profiles")
        .update(patch)
        .eq("id", access.userId)
        .select("first_name, last_name, full_name, email, company_id, role, role_type")
        .single();
      if (retry.error) {
        return NextResponse.json({ error: retry.error.message }, { status: 500 });
      }
      return NextResponse.json({
        success: true,
        prenom: retry.data?.first_name ?? firstName,
        nom: retry.data?.last_name ?? lastName,
        email: retry.data?.email ?? access.viewer.email,
        phone: null,
      });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    success: true,
    prenom: data?.first_name ?? firstName,
    nom: data?.last_name ?? lastName,
    email: data?.email ?? access.viewer.email,
    phone: ((data as { phone?: string | null } | null)?.phone ?? phone) || null,
  });
}
