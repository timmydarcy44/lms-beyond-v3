import { NextRequest, NextResponse } from "next/server";
import { cleanSiret, isValidSiret } from "@/lib/cfa/siret";
import { resolveEntrepriseOverviewAccess } from "@/lib/entreprise/overview-route";
import { resolveEnterpriseViewerDisplay } from "@/lib/entreprise/resolve-viewer-display";
import { createSupabaseServerClient, getServiceRoleClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type OrgAccountFields = {
  name: string | null;
  siret: string | null;
  address_line: string | null;
  address_zip: string | null;
  address_city: string | null;
  address_country: string | null;
};

async function loadOrganization(service: NonNullable<ReturnType<typeof getServiceRoleClient>>, companyId: string) {
  let query = await service
    .from("organizations")
    .select("name, siret, address_line, address_zip, address_city, address_country")
    .eq("id", companyId)
    .maybeSingle();
  if (
    query.error &&
    (query.error.code === "42703" || /address_|siret/i.test(query.error.message))
  ) {
    query = await service
      .from("organizations")
      .select("name, siret")
      .eq("id", companyId)
      .maybeSingle();
  }
  const row = (query.data ?? null) as Partial<OrgAccountFields> | null;
  return {
    organisationName: row?.name ? String(row.name) : null,
    siret: row?.siret ? String(row.siret).replace(/\D/g, "") : null,
    address_line: row?.address_line ? String(row.address_line) : null,
    address_zip: row?.address_zip ? String(row.address_zip) : null,
    address_city: row?.address_city ? String(row.address_city) : null,
    address_country: row?.address_country ? String(row.address_country) : "FR",
  };
}

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

  const companyId = (profile as { company_id?: string | null } | null)?.company_id ?? null;
  const service = getServiceRoleClient();
  const org =
    companyId && service
      ? await loadOrganization(service, companyId)
      : {
          organisationName: null,
          siret: null,
          address_line: null,
          address_zip: null,
          address_city: null,
          address_country: "FR",
        };

  return NextResponse.json({
    ...viewer,
    phone,
    userId: user.id,
    company_id: companyId,
    role: (profile as { role?: string | null } | null)?.role ?? null,
    role_type: (profile as { role_type?: string | null } | null)?.role_type ?? null,
    organisationName: org.organisationName,
    siret: org.siret,
    address_line: org.address_line,
    address_zip: org.address_zip,
    address_city: org.address_city,
    address_country: org.address_country,
    hasPassword: user.user_metadata?.needs_password_setup !== true,
  });
}

export async function PATCH(request: NextRequest) {
  const access = await resolveEntrepriseOverviewAccess();
  if (!access.ok) {
    return NextResponse.json({ error: access.error }, { status: access.status });
  }
  if ("impersonationMode" in access && access.impersonationMode === "read") {
    return NextResponse.json({ error: "Lecture seule" }, { status: 403 });
  }
  if ("superAdminPreview" in access && access.superAdminPreview) {
    return NextResponse.json({ error: "Organisation requise" }, { status: 400 });
  }
  if ("configurationRequired" in access && access.configurationRequired) {
    return NextResponse.json({ error: "Organisation non configurée" }, { status: 400 });
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
  const companyName = String(body.company_name ?? body.organisationName ?? "").trim();
  const addressLine = String(body.address_line ?? "").trim();
  const addressZip = String(body.address_zip ?? "").trim();
  const addressCity = String(body.address_city ?? "").trim();
  const addressCountry = String(body.address_country ?? "FR").trim() || "FR";
  const siret = cleanSiret(body.siret).replace(/\D/g, "");

  if (!firstName || !lastName) {
    return NextResponse.json({ error: "Prénom et nom du gestionnaire sont requis." }, { status: 400 });
  }
  if (!companyName) {
    return NextResponse.json({ error: "Raison sociale requise." }, { status: 400 });
  }
  if (!siret || !isValidSiret(siret)) {
    return NextResponse.json(
      { error: "Le SIRET doit contenir 14 chiffres valides." },
      { status: 400 },
    );
  }
  if (!addressLine || !addressZip || !addressCity) {
    return NextResponse.json(
      { error: "Adresse, code postal et ville sont requis (devis / convention)." },
      { status: 400 },
    );
  }

  const service = getServiceRoleClient();
  if (!service) {
    return NextResponse.json({ error: "Service indisponible" }, { status: 503 });
  }

  const fullName = `${firstName} ${lastName}`.trim();
  const profilePatch: Record<string, unknown> = {
    first_name: firstName,
    last_name: lastName,
    full_name: fullName,
  };
  if (phone) profilePatch.phone = phone;
  else profilePatch.phone = null;

  let profileRow: {
    first_name?: string | null;
    last_name?: string | null;
    email?: string | null;
    phone?: string | null;
  } | null = null;

  const { data, error } = await service
    .from("profiles")
    .update(profilePatch)
    .eq("id", access.userId)
    .select("first_name, last_name, full_name, email, phone, company_id, role, role_type")
    .single();

  if (error) {
    if (/phone/i.test(error.message)) {
      delete profilePatch.phone;
      const retry = await service
        .from("profiles")
        .update(profilePatch)
        .eq("id", access.userId)
        .select("first_name, last_name, full_name, email, company_id, role, role_type")
        .single();
      if (retry.error) {
        return NextResponse.json({ error: retry.error.message }, { status: 500 });
      }
      profileRow = retry.data;
    } else {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
  } else {
    profileRow = data;
  }

  const orgUpdate: Record<string, unknown> = {
    name: companyName,
    siret,
    address_line: addressLine,
    address_zip: addressZip,
    address_city: addressCity,
    address_country: addressCountry,
  };

  const { error: orgError } = await service
    .from("organizations")
    .update(orgUpdate)
    .eq("id", access.organizationId);

  if (orgError) {
    if (/siret/i.test(orgError.message ?? "")) {
      return NextResponse.json(
        {
          error: /unique|duplicate|already/i.test(orgError.message ?? "")
            ? "Ce SIRET est déjà associé à un autre compte Byound."
            : `SIRET invalide : ${orgError.message}`,
        },
        { status: 400 },
      );
    }
    if (/address_/i.test(orgError.message ?? "")) {
      return NextResponse.json(
        { error: "Adresse postale non enregistrée — migration organizations.address_* requise." },
        { status: 503 },
      );
    }
    return NextResponse.json({ error: orgError.message }, { status: 500 });
  }

  // Aligne le contact des dossiers ouverts (contact vide ou même email gestionnaire)
  const contactName = fullName;
  const contactEmail =
    String(profileRow?.email ?? access.viewer.email ?? "")
      .trim()
      .toLowerCase() || null;
  const contactPhone = phone || null;
  const contactPatch = {
    contact_name: contactName,
    contact_email: contactEmail,
    contact_phone: contactPhone,
    updated_at: new Date().toISOString(),
  };
  const openStatuses = ["qualification", "devis", "convention"] as const;
  await service
    .from("formation_dossiers")
    .update(contactPatch)
    .eq("organization_id", access.organizationId)
    .in("status", [...openStatuses])
    .is("contact_name", null);
  if (contactEmail) {
    await service
      .from("formation_dossiers")
      .update(contactPatch)
      .eq("organization_id", access.organizationId)
      .in("status", [...openStatuses])
      .eq("contact_email", contactEmail);
  }

  return NextResponse.json({
    success: true,
    prenom: profileRow?.first_name ?? firstName,
    nom: profileRow?.last_name ?? lastName,
    email: profileRow?.email ?? access.viewer.email,
    phone: (profileRow?.phone ?? phone) || null,
    organisationName: companyName,
    siret,
    address_line: addressLine,
    address_zip: addressZip,
    address_city: addressCity,
    address_country: addressCountry,
  });
}
