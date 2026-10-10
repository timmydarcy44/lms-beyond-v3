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
  const apprenticesWanted = Number(body.apprenticesWanted);
  const track1 = clean(body.apprenticeTrack1);
  const track2 = clean(body.apprenticeTrack2);

  if (!companyName) {
    return NextResponse.json({ error: "Le nom de l’entreprise est requis." }, { status: 400 });
  }
  if (!/^\d{14}$/.test(siret)) {
    return NextResponse.json({ error: "Le SIRET doit contenir 14 chiffres." }, { status: 400 });
  }
  if (apprenticesWanted !== 1 && apprenticesWanted !== 2) {
    return NextResponse.json({ error: "Indique 1 ou 2 alternants souhaités." }, { status: 400 });
  }
  if (!isTrack(track1)) {
    return NextResponse.json({ error: "Choisis le cursus de l’alternant 1." }, { status: 400 });
  }
  if (apprenticesWanted === 2 && !isTrack(track2)) {
    return NextResponse.json({ error: "Choisis le cursus de l’alternant 2." }, { status: 400 });
  }

  const { data, error } = await db
    .from("cfa_companies")
    .insert({
      company_name: companyName,
      siret,
      contact_name: clean(body.contactName) || null,
      email: clean(body.email) || null,
      phone: clean(body.phone) || null,
      apprentices_wanted: apprenticesWanted,
      apprentice_track_1: track1,
      apprentice_track_2: apprenticesWanted === 2 ? track2 : null,
      status: "to_contact",
    })
    .select("*")
    .single();

  if (error) {
    if (error.code === "42P01" || error.code === "42703") {
      return NextResponse.json(
        { error: "Applique les migrations CFA entreprises pour activer ce pipeline." },
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
