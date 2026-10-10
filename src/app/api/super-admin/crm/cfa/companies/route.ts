import { NextRequest, NextResponse } from "next/server";

import { CFA_SPECIALIZATIONS, type CfaSpecialization } from "@/lib/cfa-applications";
import { isCfaCompanyStatus } from "@/lib/cfa-companies";
import { isSuperAdmin } from "@/lib/auth/super-admin";
import { getServiceRoleClient } from "@/lib/supabase/server";

const TRACKS = new Set<string>(CFA_SPECIALIZATIONS.map((item) => item.value));

function clean(value: unknown): string {
  return String(value ?? "").trim();
}

function isTrack(value: string): value is CfaSpecialization {
  return TRACKS.has(value);
}

export async function GET() {
  if (!(await isSuperAdmin())) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }
  const db = getServiceRoleClient();
  if (!db) return NextResponse.json({ error: "Service indisponible" }, { status: 503 });

  const { data, error } = await db
    .from("cfa_companies")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    if (error.code === "42P01" || error.code === "42703") {
      return NextResponse.json({ companies: [], migrationRequired: true });
    }
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
  return NextResponse.json({ companies: data ?? [] });
}

export async function POST(request: NextRequest) {
  if (!(await isSuperAdmin())) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }
  const db = getServiceRoleClient();
  if (!db) return NextResponse.json({ error: "Service indisponible" }, { status: 503 });

  const body = await request.json().catch(() => ({}));
  const companyName = clean(body.companyName);
  const siret = clean(body.siret).replace(/\s/g, "");
  const firstName = clean(body.firstName);
  const lastName = clean(body.lastName);
  const apprenticesWanted = Number(body.apprenticesWanted);
  const track1 = clean(body.apprenticeTrack1);

  if (!companyName) {
    return NextResponse.json({ error: "Le nom de l’entreprise est requis." }, { status: 400 });
  }
  if (!/^\d{14}$/.test(siret)) {
    return NextResponse.json({ error: "Le SIRET doit contenir 14 chiffres." }, { status: 400 });
  }
  if (!firstName || !lastName) {
    return NextResponse.json({ error: "Le prénom et le nom du contact sont requis." }, { status: 400 });
  }
  if (!Number.isInteger(apprenticesWanted) || apprenticesWanted < 1 || apprenticesWanted > 30) {
    return NextResponse.json({ error: "Indique une quantité entre 1 et 30." }, { status: 400 });
  }
  if (!isTrack(track1)) {
    return NextResponse.json({ error: "Choisis le cursus demandé." }, { status: 400 });
  }

  const { data, error } = await db
    .from("cfa_companies")
    .insert({
      company_name: companyName,
      siret,
      contact_first_name: firstName,
      contact_last_name: lastName,
      contact_name: `${firstName} ${lastName}`,
      contact_role: clean(body.contactRole) || null,
      email: clean(body.email) || null,
      phone: clean(body.phone) || null,
      company_address: clean(body.companyAddress) || null,
      soft_skills: clean(body.softSkills) || null,
      apprentices_wanted: apprenticesWanted,
      apprentice_track_1: track1,
      apprentice_track_2: null,
      status: "to_contact",
    })
    .select("*")
    .single();

  if (error) {
    if (error.code === "42P01" || error.code === "42703") {
      return NextResponse.json(
        { error: "Applique la migration 20261010120000_cfa_companies_contact.sql pour activer ce formulaire." },
        { status: 400 },
      );
    }
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
  return NextResponse.json({ company: data });
}

export async function PATCH(request: NextRequest) {
  if (!(await isSuperAdmin())) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }
  const db = getServiceRoleClient();
  if (!db) return NextResponse.json({ error: "Service indisponible" }, { status: 503 });

  const body = await request.json().catch(() => ({}));
  const id = clean(body.id);
  const status = clean(body.status);
  if (!id || !isCfaCompanyStatus(status)) {
    return NextResponse.json({ error: "Dossier ou statut invalide." }, { status: 400 });
  }

  const { data, error } = await db
    .from("cfa_companies")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select("*")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ company: data });
}
