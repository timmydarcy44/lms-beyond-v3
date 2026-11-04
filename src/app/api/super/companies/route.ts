import { NextResponse } from "next/server";
import { isSuperAdmin } from "@/lib/auth/super-admin";
import { getServiceRoleClient } from "@/lib/supabase/server";

function slugify(value: string) {
  const base = value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 48);
  return base || "entreprise";
}

export async function POST(request: Request) {
  if (!(await isSuperAdmin())) return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  const db = getServiceRoleClient();
  if (!db) return NextResponse.json({ error: "Service indisponible" }, { status: 503 });

  const body = (await request.json().catch(() => null)) as {
    name?: string;
    city?: string;
    siret?: string;
    sector?: string;
    roleBusiness?: boolean;
    roleCfa?: boolean;
  } | null;
  const name = String(body?.name ?? "").trim();
  if (name.length < 2) return NextResponse.json({ error: "Indique le nom de l'entreprise." }, { status: 400 });
  const siret = String(body?.siret ?? "").replace(/\s/g, "");
  if (siret && !/^\d{14}$/.test(siret)) return NextResponse.json({ error: "Le SIRET doit contenir 14 chiffres." }, { status: 400 });
  const roleBusiness = body?.roleBusiness === true;
  const roleCfa = body?.roleCfa === true;
  if (!roleBusiness && !roleCfa) return NextResponse.json({ error: "Choisis au moins un rôle." }, { status: 400 });

  const table = await db.from("companies").select("id").limit(1);
  if (table.error) {
    return NextResponse.json(
      { error: "Colle d'abord le script SQL des fiches entreprise (20261104150000_companies.sql)." },
      { status: 400 },
    );
  }

  if (siret) {
    const existing = await db.from("companies").select("id, name").eq("siret", siret).is("merged_into", null).limit(1).maybeSingle();
    if (existing.data?.id) {
      return NextResponse.json(
        { error: `Une fiche existe déjà pour ce SIRET : ${existing.data.name}.`, id: existing.data.id },
        { status: 409 },
      );
    }
  }

  let organizationId: string | null = null;
  if (roleBusiness) {
    let slug = slugify(name);
    const taken = await db.from("organizations").select("id").eq("slug", slug).maybeSingle();
    if (taken.data?.id) slug = `${slug}-${Math.random().toString(36).slice(2, 6)}`;
    const created = await db.from("organizations").insert({ name, slug }).select("id").single();
    if (created.error || !created.data?.id) {
      return NextResponse.json({ error: created.error?.message || "Création du compte impossible" }, { status: 400 });
    }
    organizationId = created.data.id;
    if (siret) await db.from("organizations").update({ siret }).eq("id", organizationId);
  }

  let cfaCompanyId: string | null = null;
  if (roleCfa) {
    let created = await db
      .from("cfa_companies")
      .insert({
        company_name: name,
        city: body?.city?.trim() || null,
        siret: siret || null,
        organization_id: organizationId,
        status: "to_contact",
      })
      .select("id")
      .single();
    if (created.error) {
      created = await db.from("cfa_companies").insert({ company_name: name }).select("id").single();
    }
    if (created.error || !created.data?.id) {
      return NextResponse.json({ error: created.error?.message || "Création de l'entreprise d'accueil impossible" }, { status: 400 });
    }
    cfaCompanyId = created.data.id;
  }

  const company = await db
    .from("companies")
    .insert({
      name,
      city: body?.city?.trim() || null,
      sector: body?.sector?.trim() || null,
      siret: siret || null,
      role_business: roleBusiness,
      role_cfa: roleCfa,
      organization_id: organizationId,
      cfa_company_id: cfaCompanyId,
    })
    .select("id")
    .single();
  if (company.error || !company.data?.id) {
    return NextResponse.json({ error: company.error?.message || "Création impossible" }, { status: 400 });
  }

  const sources = [
    organizationId ? { company_id: company.data.id, source_type: "organization", source_id: organizationId } : null,
    cfaCompanyId ? { company_id: company.data.id, source_type: "cfa_company", source_id: cfaCompanyId } : null,
  ].filter(Boolean);
  if (sources.length) await db.from("company_sources").insert(sources);

  return NextResponse.json({ id: company.data.id });
}
