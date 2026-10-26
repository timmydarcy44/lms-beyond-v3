import { NextRequest, NextResponse } from "next/server";

import { CFA_SPECIALIZATIONS, getCfaSpecializationLabel, type CfaSpecialization } from "@/lib/cfa-applications";
import { CFA_COMPANY_STATUS_LABELS, isCfaCompanyStatus } from "@/lib/cfa-companies";
import { logCompanyEvent } from "@/lib/cfa/company-events";
import { linkCompanyByExactSiret } from "@/lib/cfa/link-company-organization";
import { cleanSiret, isValidSiret } from "@/lib/cfa/siret";
import { isSuperAdmin } from "@/lib/auth/super-admin";
import { loadCfaCompanies } from "@/lib/cfa/load-cfa-crm";
import { getServerClient, getServiceRoleClient } from "@/lib/supabase/server";

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

  const board = await loadCfaCompanies(db);
  if ("error" in board && board.error) return NextResponse.json({ error: board.error }, { status: 400 });
  return NextResponse.json(board);
}

export async function POST(request: NextRequest) {
  if (!(await isSuperAdmin())) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }
  const db = getServiceRoleClient();
  if (!db) return NextResponse.json({ error: "Service indisponible" }, { status: 503 });

  const body = await request.json().catch(() => ({}));
  const companyName = clean(body.companyName);
  const siret = cleanSiret(body.siret);
  const contactName = clean(body.contactName);
  const legacyFirst = clean(body.firstName);
  const legacyLast = clean(body.lastName);
  const [splitFirst, ...splitRest] = (contactName || `${legacyFirst} ${legacyLast}`).trim().split(/\s+/);
  const firstName = legacyFirst || splitFirst || "";
  const lastName = legacyLast || splitRest.join(" ") || firstName;
  const apprenticesWanted = Number(body.apprenticesWanted);
  const track1 = clean(body.apprenticeTrack1);

  if (!companyName && !siret) {
    return NextResponse.json({ error: "Indiquez un SIRET ou un nom." }, { status: 400 });
  }
  if (!companyName) {
    return NextResponse.json({ error: "Le nom de l’entreprise est requis." }, { status: 400 });
  }
  if (siret && !isValidSiret(siret)) {
    return NextResponse.json({ error: "Le SIRET doit contenir 14 chiffres valides." }, { status: 400 });
  }
  if (!firstName) {
    return NextResponse.json({ error: "Le nom du contact principal est requis." }, { status: 400 });
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
      siret: siret || null,
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
  await db.from("cfa_company_contacts").insert({
    company_id: data.id,
    first_name: firstName,
    last_name: lastName,
    email: clean(body.email) || null,
    phone: clean(body.phone) || null,
    job_title: clean(body.contactRole) || null,
    roles: ["main"],
  });
  await db.from("cfa_company_needs").insert({
    company_id: data.id,
    title: getCfaSpecializationLabel(track1),
    cursus_id: track1,
    quantity: apprenticesWanted,
    status: "open",
  });
  await linkCompanyByExactSiret(db, { id: data.id, siret: siret || null, organization_id: null }, null);
  return NextResponse.json({ company: data });
}

function companyFields(body: Record<string, unknown>) {
  const companyName = clean(body.companyName);
  const siret = cleanSiret(body.siret);
  const firstName = clean(body.firstName);
  const lastName = clean(body.lastName);
  const apprenticesWanted = Number(body.apprenticesWanted);
  const track1 = clean(body.apprenticeTrack1);
  const status = clean(body.status);

  if (!companyName) return { error: "Le nom de l’entreprise est requis." };
  if (siret && !isValidSiret(siret)) return { error: "Le SIRET doit contenir 14 chiffres valides." };
  if (!firstName || !lastName) return { error: "Le prénom et le nom du contact sont requis." };
  if (!Number.isInteger(apprenticesWanted) || apprenticesWanted < 1 || apprenticesWanted > 30) {
    return { error: "Indique une quantité entre 1 et 30." };
  }
  if (!isTrack(track1)) return { error: "Choisis le cursus demandé." };
  if (status && !isCfaCompanyStatus(status)) return { error: "Statut invalide." };

  return {
    row: {
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
      ...(status ? { status } : {}),
    },
  };
}

export async function PATCH(request: NextRequest) {
  if (!(await isSuperAdmin())) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }
  const db = getServiceRoleClient();
  if (!db) return NextResponse.json({ error: "Service indisponible" }, { status: 503 });

  const body = await request.json().catch(() => ({}));
  const id = clean(body.id);
  if (!id) return NextResponse.json({ error: "Dossier invalide." }, { status: 400 });

  const editing = body.companyName !== undefined;
  let update: Record<string, unknown>;
  let nextStatus = "";
  if (editing) {
    const parsed = companyFields(body);
    if ("error" in parsed) return NextResponse.json({ error: parsed.error }, { status: 400 });
    update = { ...parsed.row, updated_at: new Date().toISOString() };
  } else {
    const status = clean(body.status);
    if (!isCfaCompanyStatus(status)) {
      return NextResponse.json({ error: "Dossier ou statut invalide." }, { status: 400 });
    }
    nextStatus = status;
    if (status === "not_recruited" && !clean(body.reason)) {
      return NextResponse.json({ error: "Le motif est obligatoire pour marquer l'entreprise perdue." }, { status: 400 });
    }
    update = {
      status,
      updated_at: new Date().toISOString(),
      ...(status === "not_recruited" ? { lost_reason: clean(body.reason), lost_at: new Date().toISOString() } : {}),
    };
  }

  const { data, error } = await db.from("cfa_companies").update(update).eq("id", id).select("*").single();

  if (error) {
    if (error.code === "42P01" || error.code === "42703") {
      return NextResponse.json(
        { error: "Applique la migration 20261010120000_cfa_companies_contact.sql pour modifier cette fiche." },
        { status: 400 },
      );
    }
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
  if (nextStatus && data) {
    const client = await getServerClient();
    const user = client ? await client.auth.getUser() : { data: { user: null } };
    const logged = await logCompanyEvent(db, {
      companyId: id,
      actorId: user.data.user?.id ?? null,
      action: "company_status",
      body: nextStatus === "not_recruited"
        ? `Marquée perdue : ${clean(body.reason)}`
        : `Statut : ${CFA_COMPANY_STATUS_LABELS[nextStatus as keyof typeof CFA_COMPANY_STATUS_LABELS]}.`,
      newValue: nextStatus,
    });
    if (logged && !logged.includes("20261026160000")) return NextResponse.json({ error: logged }, { status: 400 });
  }
  return NextResponse.json({ company: data });
}
