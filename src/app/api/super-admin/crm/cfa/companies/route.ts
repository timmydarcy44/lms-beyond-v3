import { NextRequest, NextResponse } from "next/server";

import { CFA_APPLICATION_STATUSES, type CfaApplicationStatus } from "@/lib/cfa-applications";
import { isSuperAdmin } from "@/lib/auth/super-admin";
import { getServiceRoleClient } from "@/lib/supabase/server";

function clean(value: unknown): string {
  return String(value ?? "").trim();
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
    if (error.code === "42P01") return NextResponse.json({ companies: [], migrationRequired: true });
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
  if (!companyName) {
    return NextResponse.json({ error: "Le nom de l’entreprise est requis." }, { status: 400 });
  }

  const { data, error } = await db
    .from("cfa_companies")
    .insert({
      company_name: companyName,
      contact_name: clean(body.contactName) || null,
      email: clean(body.email) || null,
      phone: clean(body.phone) || null,
      status: "profile",
    })
    .select("*")
    .single();

  if (error) {
    if (error.code === "42P01") {
      return NextResponse.json(
        { error: "Applique la migration CFA entreprises pour activer ce pipeline." },
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
  const status = clean(body.status) as CfaApplicationStatus;
  if (!id || !CFA_APPLICATION_STATUSES.includes(status)) {
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
