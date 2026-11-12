import { NextRequest, NextResponse } from "next/server";
import { isSuperAdmin } from "@/lib/auth/super-admin";
import { formatCompanyName } from "@/lib/cfa/format-org-name";
import { isByoundBusinessSiret } from "@/lib/cfa/host-company-stages";
import { getServiceRoleClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

function mapOrg(row: {
  id: string;
  name?: string | null;
  siret?: string | null;
  city?: string | null;
  address_city?: string | null;
  account_manager_id?: string | null;
}, managerId: string) {
  return {
    id: row.id,
    kind: "organization" as const,
    name: formatCompanyName(row.name) || "Compte client",
    siret: row.siret ? String(row.siret) : null,
    city: formatCompanyName(row.city || row.address_city) || null,
    assignedHere: row.account_manager_id === managerId,
    assignedElsewhere: Boolean(row.account_manager_id && row.account_manager_id !== managerId),
  };
}

function mapCfa(row: {
  id: string;
  company_name?: string | null;
  siret?: string | null;
  city?: string | null;
  account_manager_id?: string | null;
}, managerId: string) {
  return {
    id: row.id,
    kind: "cfa" as const,
    name: formatCompanyName(row.company_name) || "Entreprise d'accueil",
    siret: row.siret ? String(row.siret) : null,
    city: row.city ? formatCompanyName(row.city) : null,
    assignedHere: row.account_manager_id === managerId,
    assignedElsewhere: Boolean(row.account_manager_id && row.account_manager_id !== managerId),
  };
}

export async function GET(request: NextRequest, context: Ctx) {
  const { id } = await context.params;
  if (!(await isSuperAdmin())) {
    return NextResponse.json({ error: "Réservé au staff Byound" }, { status: 403 });
  }
  const db = getServiceRoleClient();
  if (!db) return NextResponse.json({ error: "Service indisponible" }, { status: 503 });

  const manager = await db.from("account_managers").select("id").eq("id", id).maybeSingle();
  if (manager.error && /account_managers|42P01/i.test(manager.error.message)) {
    return NextResponse.json({ error: "Appliquez la migration account_managers." }, { status: 503 });
  }
  if (!manager.data) return NextResponse.json({ error: "Gestionnaire introuvable" }, { status: 404 });

  const q = request.nextUrl.searchParams.get("q")?.trim() ?? "";
  if (q.length >= 2) {
    const like = `%${q.replace(/[%_,]/g, "")}%`;
    const [orgsByName, orgsBySiret, cfaByName, cfaBySiret] = await Promise.all([
      db.from("organizations").select("id, name, siret, address_city, account_manager_id").ilike("name", like).order("name").limit(12),
      db.from("organizations").select("id, name, siret, address_city, account_manager_id").ilike("siret", like).order("name").limit(12),
      db.from("cfa_companies").select("id, company_name, siret, city, account_manager_id").ilike("company_name", like).order("company_name").limit(12),
      db.from("cfa_companies").select("id, company_name, siret, city, account_manager_id").ilike("siret", like).order("company_name").limit(12),
    ]);
    const orgs = {
      data: [...(orgsByName.data ?? []), ...(orgsBySiret.data ?? [])].filter(
        (row, index, all) => all.findIndex((item) => item.id === row.id) === index,
      ),
      error: orgsByName.error ?? orgsBySiret.error,
    };
    const cfa = {
      data: [...(cfaByName.data ?? []), ...(cfaBySiret.data ?? [])].filter(
        (row, index, all) => all.findIndex((item) => item.id === row.id) === index,
      ),
      error: cfaByName.error ?? cfaBySiret.error,
    };
    const cfaMissing = Boolean(cfa.error && /account_manager_id|42703|schema cache/i.test(cfa.error.message));
    return NextResponse.json({
      results: [
        ...((orgs.data ?? []) as Parameters<typeof mapOrg>[0][]).map((row) => mapOrg(row, id)),
        ...(cfaMissing
          ? []
          : ((cfa.data ?? []) as Parameters<typeof mapCfa>[0][])
              .filter((row) => !isByoundBusinessSiret(row.siret))
              .map((row) => mapCfa(row, id))),
      ],
      cfaSchemaMissing: cfaMissing,
    });
  }

  const [orgs, cfa] = await Promise.all([
    db
      .from("organizations")
      .select("id, name, siret, address_city, account_manager_id")
      .eq("account_manager_id", id)
      .order("name")
      .limit(200),
    db
      .from("cfa_companies")
      .select("id, company_name, siret, city, account_manager_id")
      .eq("account_manager_id", id)
      .order("company_name")
      .limit(200),
  ]);

  const cfaMissing = Boolean(cfa.error && /account_manager_id|42703|schema cache/i.test(cfa.error.message));

  return NextResponse.json({
    organizations: ((orgs.data ?? []) as Parameters<typeof mapOrg>[0][]).map((row) => mapOrg(row, id)),
    cfaCompanies: cfaMissing
      ? []
      : ((cfa.data ?? []) as Parameters<typeof mapCfa>[0][]).map((row) => mapCfa(row, id)),
    cfaSchemaMissing: cfaMissing,
  });
}

export async function PATCH(request: NextRequest, context: Ctx) {
  const { id } = await context.params;
  if (!(await isSuperAdmin())) {
    return NextResponse.json({ error: "Réservé au staff Byound" }, { status: 403 });
  }
  const db = getServiceRoleClient();
  if (!db) return NextResponse.json({ error: "Service indisponible" }, { status: 503 });

  const body = (await request.json().catch(() => ({}))) as {
    action?: "assign" | "unassign";
    kind?: "cfa" | "organization";
    targetId?: string;
  };

  const action = body.action;
  const kind = body.kind;
  const targetId = String(body.targetId ?? "").trim();
  if ((action !== "assign" && action !== "unassign") || (kind !== "cfa" && kind !== "organization") || !targetId) {
    return NextResponse.json({ error: "Requête invalide." }, { status: 400 });
  }

  const manager = await db.from("account_managers").select("id, is_active").eq("id", id).maybeSingle();
  if (!manager.data) return NextResponse.json({ error: "Gestionnaire introuvable" }, { status: 404 });
  if (action === "assign" && manager.data.is_active === false) {
    return NextResponse.json({ error: "Ce gestionnaire est inactif." }, { status: 400 });
  }

  const nextId = action === "assign" ? id : null;

  if (kind === "organization") {
    const updated = await db
      .from("organizations")
      .update({ account_manager_id: nextId })
      .eq("id", targetId)
      .select("id, name")
      .maybeSingle();
    if (updated.error) return NextResponse.json({ error: updated.error.message }, { status: 400 });
    if (!updated.data) return NextResponse.json({ error: "Compte introuvable" }, { status: 404 });
    return NextResponse.json({ ok: true, kind, targetId, accountManagerId: nextId });
  }

  const updated = await db
    .from("cfa_companies")
    .update({ account_manager_id: nextId, updated_at: new Date().toISOString() })
    .eq("id", targetId)
    .select("id, company_name")
    .maybeSingle();
  if (updated.error) {
    if (/account_manager_id|42703|schema cache/i.test(updated.error.message)) {
      return NextResponse.json(
        { error: "Collez le script 20261112180000_cfa_company_account_manager.sql pour activer les chargés de compte CFA." },
        { status: 400 },
      );
    }
    return NextResponse.json({ error: updated.error.message }, { status: 400 });
  }
  if (!updated.data) return NextResponse.json({ error: "Entreprise introuvable" }, { status: 404 });
  return NextResponse.json({ ok: true, kind, targetId, accountManagerId: nextId });
}
