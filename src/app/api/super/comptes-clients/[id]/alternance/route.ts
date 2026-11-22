import { NextRequest, NextResponse } from "next/server";
import { isSuperAdmin } from "@/lib/auth/super-admin";
import { sendAccessCode } from "@/lib/cfa/access-code";
import { linkTutorToApprentice } from "@/lib/cfa/link-tutor-to-apprentice";
import { getServerClient, getServiceRoleClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

async function actorId() {
  const client = await getServerClient();
  const user = client ? await client.auth.getUser() : null;
  return user?.data.user?.id ?? null;
}

async function resolveCfaCompany(
  db: NonNullable<ReturnType<typeof getServiceRoleClient>>,
  organizationId: string,
) {
  const byOrg = await db
    .from("cfa_companies")
    .select("id, company_name, organization_id, city, company_address, siret")
    .eq("organization_id", organizationId)
    .maybeSingle();
  if (byOrg.data) return byOrg.data as Record<string, unknown>;

  const org = await db.from("organizations").select("id, name, siret").eq("id", organizationId).maybeSingle();
  if (!org.data) return null;
  const name = String((org.data as { name?: string }).name ?? "").trim();
  if (!name) return null;

  const byName = await db
    .from("cfa_companies")
    .select("id, company_name, organization_id, city, company_address, siret")
    .ilike("company_name", name)
    .is("organization_id", null)
    .limit(1)
    .maybeSingle();
  if (byName.data) {
    await db
      .from("cfa_companies")
      .update({ organization_id: organizationId })
      .eq("id", (byName.data as { id: string }).id);
    return { ...(byName.data as object), organization_id: organizationId };
  }
  return null;
}

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  if (!(await isSuperAdmin())) return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  const db = getServiceRoleClient();
  if (!db) return NextResponse.json({ error: "NO_DB" }, { status: 503 });
  const { id: organizationId } = await context.params;

  const company = await resolveCfaCompany(db, organizationId);
  if (!company) {
    const org = await db.from("organizations").select("id, name").eq("id", organizationId).maybeSingle();
    return NextResponse.json({
      linked: false,
      organizationName: (org.data as { name?: string } | null)?.name ?? "",
      company: null,
      tutors: [],
      apprentices: [],
      cfaHref: null,
    });
  }

  const companyId = String(company.id);
  const [tutors, placements] = await Promise.all([
    db
      .from("company_tutors")
      .select("id, first_name, last_name, email, job_title, user_id, invited_at, activated_at")
      .eq("company_id", companyId)
      .order("last_name"),
    db
      .from("apprentice_placements")
      .select("id, apprentice_id, tutor_id, status, started_at, created_at")
      .eq("company_id", companyId)
      .in("status", ["pending", "active"]),
  ]);

  const placementRows = (placements.data ?? []) as Array<{
    id: string;
    apprentice_id: string;
    tutor_id: string | null;
    status: string;
    started_at?: string | null;
    created_at?: string | null;
  }>;
  const appIds = placementRows.map((r) => r.apprentice_id);
  const apps = appIds.length
    ? await db
        .from("cfa_applications")
        .select("id, first_name, last_name, specialization, status, email")
        .in("id", appIds)
    : { data: [] };
  const byApp = new Map(
    ((apps.data ?? []) as Array<Record<string, unknown>>).map((row) => [String(row.id), row]),
  );

  return NextResponse.json({
    linked: true,
    company: {
      id: companyId,
      name: String(company.company_name ?? ""),
      city: company.city ? String(company.city) : null,
      address: company.company_address ? String(company.company_address) : null,
      siret: company.siret ? String(company.siret) : null,
    },
    tutors: tutors.data ?? [],
    apprentices: placementRows.map((row) => {
      const app = byApp.get(row.apprentice_id);
      return {
        placementId: row.id,
        applicationId: row.apprentice_id,
        tutorId: row.tutor_id,
        placementStatus: row.status,
        firstName: String(app?.first_name ?? ""),
        lastName: String(app?.last_name ?? ""),
        email: String(app?.email ?? ""),
        specialization: String(app?.specialization ?? ""),
        applicationStatus: String(app?.status ?? ""),
        startedAt: row.started_at ?? null,
      };
    }),
    cfaHref: `/super/crm/cfa/entreprises/${companyId}`,
  });
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  if (!(await isSuperAdmin())) return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  const db = getServiceRoleClient();
  if (!db) return NextResponse.json({ error: "NO_DB" }, { status: 503 });
  const { id: organizationId } = await context.params;
  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  const action = String(body?.action ?? "");
  const actor = await actorId();

  if (action === "ensure_cfa_company") {
    let company = await resolveCfaCompany(db, organizationId);
    if (company) return NextResponse.json({ ok: true, companyId: company.id });
    const org = await db.from("organizations").select("id, name, siret").eq("id", organizationId).maybeSingle();
    if (!org.data) return NextResponse.json({ error: "Compte introuvable" }, { status: 404 });
    const name = String((org.data as { name?: string }).name ?? "").trim() || "Entreprise";
    const siret = String((org.data as { siret?: string | null }).siret ?? "").replace(/\s/g, "") || null;
    const created = await db
      .from("cfa_companies")
      .insert({
        company_name: name,
        organization_id: organizationId,
        siret,
        status: "to_contact",
      })
      .select("id")
      .single();
    if (created.error || !created.data) {
      return NextResponse.json({ error: created.error?.message ?? "Création impossible" }, { status: 400 });
    }
    return NextResponse.json({ ok: true, companyId: created.data.id });
  }

  const company = await resolveCfaCompany(db, organizationId);
  if (!company) {
    return NextResponse.json(
      { error: "Aucune entreprise d'accueil liée. Clique « Activer l'accueil CFA » d'abord." },
      { status: 400 },
    );
  }
  const companyId = String(company.id);
  const companyName = String(company.company_name ?? "");

  if (action === "set_company") {
    const applicationId = String(body?.applicationId ?? "");
    if (!applicationId) return NextResponse.json({ error: "Alternant requis" }, { status: 400 });
    await db
      .from("apprentice_placements")
      .update({ status: "ended", ended_at: new Date().toISOString() })
      .eq("apprentice_id", applicationId)
      .in("status", ["active", "pending"]);
    const placed = await db.from("apprentice_placements").insert({
      apprentice_id: applicationId,
      company_id: companyId,
      status: "pending",
      created_by: actor,
    });
    if (placed.error) return NextResponse.json({ error: placed.error.message }, { status: 400 });
    return NextResponse.json({ ok: true });
  }

  if (action === "set_tutor") {
    const applicationId = String(body?.applicationId ?? "");
    const tutorId = String(body?.tutorId ?? "");
    if (!applicationId || !tutorId) {
      return NextResponse.json({ error: "Alternant et tuteur requis" }, { status: 400 });
    }
    const link = await linkTutorToApprentice(db, {
      applicationId,
      companyId,
      companyTutorId: tutorId,
      createdBy: actor,
    });
    if (link.error) return NextResponse.json({ error: link.error }, { status: 400 });

    const tutor = await db
      .from("company_tutors")
      .select("first_name, last_name, email, user_id, activated_at")
      .eq("id", tutorId)
      .maybeSingle();
    const row = tutor.data as {
      first_name?: string;
      last_name?: string;
      email?: string;
      user_id?: string | null;
      activated_at?: string | null;
    } | null;
    if (row?.email) {
      const app = await db
        .from("cfa_applications")
        .select("first_name, last_name")
        .eq("id", applicationId)
        .maybeSingle();
      const learnerName = app.data
        ? `${(app.data as { first_name?: string }).first_name ?? ""} ${(app.data as { last_name?: string }).last_name ?? ""}`.trim()
        : "";
      const sent = await sendAccessCode(db, {
        email: row.email,
        role: "tuteur",
        context: "tuteur_notice",
        firstName: String(row.first_name ?? ""),
        lastName: String(row.last_name ?? ""),
        learnerName,
        companyName,
      });
      if (sent.ok) {
        await db
          .from("company_tutors")
          .update({ last_code_sent_at: new Date().toISOString() })
          .eq("id", tutorId);
      }
    }
    return NextResponse.json({ ok: true });
  }

  if (action === "create_tutor") {
    const firstName = String(body?.firstName ?? "").trim();
    const lastName = String(body?.lastName ?? "").trim();
    const email = String(body?.email ?? "").trim().toLowerCase();
    const jobTitle = String(body?.jobTitle ?? "").trim();
    const applicationId = body?.applicationId ? String(body.applicationId) : "";
    if (!firstName || !lastName || !email) {
      return NextResponse.json({ error: "Prénom, nom et e-mail requis" }, { status: 400 });
    }
    const created = await db
      .from("company_tutors")
      .insert({
        company_id: companyId,
        first_name: firstName,
        last_name: lastName,
        email,
        job_title: jobTitle || null,
      })
      .select("id")
      .single();
    if (created.error || !created.data) {
      const duplicate = created.error?.code === "23505";
      return NextResponse.json(
        { error: duplicate ? "Ce tuteur existe déjà." : created.error?.message ?? "Création impossible" },
        { status: 400 },
      );
    }
    const tutorId = String(created.data.id);
    let linked = false;
    let learnerName = "";
    if (applicationId) {
      const app = await db
        .from("cfa_applications")
        .select("first_name, last_name")
        .eq("id", applicationId)
        .maybeSingle();
      learnerName = app.data
        ? `${(app.data as { first_name?: string }).first_name ?? ""} ${(app.data as { last_name?: string }).last_name ?? ""}`.trim()
        : "";
      const link = await linkTutorToApprentice(db, {
        applicationId,
        companyId,
        companyTutorId: tutorId,
        createdBy: actor,
      });
      if (link.error) {
        return NextResponse.json({ error: `Tuteur créé, rattachement impossible : ${link.error}`, tutorId }, { status: 400 });
      }
      linked = true;
    }
    const sent = await sendAccessCode(db, {
      email,
      role: "tuteur",
      context: "tuteur_notice",
      firstName,
      lastName,
      learnerName,
      companyName,
    });
    await db.from("company_tutors").update({
      invited_at: new Date().toISOString(),
      ...(sent.ok ? { last_code_sent_at: new Date().toISOString() } : {}),
    }).eq("id", tutorId);
    return NextResponse.json({
      ok: true,
      tutorId,
      linked,
      emailSent: sent.ok,
      needsAssignment: !linked,
      warning: sent.ok
        ? linked
          ? undefined
          : "Tuteur créé. Assigne-le à un alternant."
        : `Tuteur créé${linked ? " et lié" : ""}. E-mail non envoyé : ${sent.error}`,
    });
  }

  return NextResponse.json({ error: "Action inconnue" }, { status: 400 });
}
