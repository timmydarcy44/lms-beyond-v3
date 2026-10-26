import { NextRequest, NextResponse } from "next/server";
import { isSuperAdmin } from "@/lib/auth/super-admin";
import { sendAccessCode } from "@/lib/cfa/access-code";
import { recordCfaAudit } from "@/lib/cfa/admit-application";
import { parseInput, placementSchema } from "@/lib/cfa/fiche-input";
import { syncTutorAssignment } from "@/lib/cfa/sync-tutor-assignment";
import { getServerClient, getServiceRoleClient } from "@/lib/supabase/server";

function clean(value: unknown, max = 200) {
  return String(value ?? "").trim().slice(0, max);
}

async function actorId() {
  const client = await getServerClient();
  const user = client ? await client.auth.getUser() : null;
  return user?.data.user?.id ?? null;
}

export async function GET(request: NextRequest) {
  if (!(await isSuperAdmin())) return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  const db = getServiceRoleClient();
  if (!db) return NextResponse.json({ error: "Service indisponible" }, { status: 503 });
  const applicationId = clean(request.nextUrl.searchParams.get("applicationId"));
  if (!applicationId) return NextResponse.json({ error: "Dossier requis" }, { status: 400 });

  const [companies, tutors, placements, active] = await Promise.all([
    db.from("cfa_companies").select("id, company_name, siret, city, company_address").order("company_name"),
    db.from("company_tutors").select("id, company_id, user_id, first_name, last_name, email, job_title, invited_at, last_code_sent_at, activated_at").order("last_name"),
    db.from("apprentice_placements").select("id, company_id, tutor_id, status, started_at, ended_at, created_at").eq("apprentice_id", applicationId).order("created_at", { ascending: false }),
    db.from("apprentice_placements").select("company_id, tutor_id").eq("status", "active"),
  ]);
  const failed = [companies.error, tutors.error, placements.error, active.error].find(Boolean);
  if (failed) return NextResponse.json({ error: failed.message }, { status: 400 });

  const companyCount = new Map<string, number>();
  const tutorCount = new Map<string, number>();
  for (const row of active.data ?? []) {
    const companyId = String((row as { company_id?: string }).company_id ?? "");
    const tutor = String((row as { tutor_id?: string | null }).tutor_id ?? "");
    if (companyId) companyCount.set(companyId, (companyCount.get(companyId) ?? 0) + 1);
    if (tutor) tutorCount.set(tutor, (tutorCount.get(tutor) ?? 0) + 1);
  }

  return NextResponse.json({
    companies: (companies.data ?? []).map((row) => ({
      ...(row as object),
      apprenticeCount: companyCount.get(String((row as { id: string }).id)) ?? 0,
    })),
    tutors: (tutors.data ?? []).map((row) => ({
      ...(row as object),
      apprenticeCount: tutorCount.get(String((row as { id: string }).id)) ?? 0,
    })),
    placements: placements.data ?? [],
  });
}

export async function POST(request: NextRequest) {
  if (!(await isSuperAdmin())) return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  const db = getServiceRoleClient();
  if (!db) return NextResponse.json({ error: "Service indisponible" }, { status: 503 });
  const parsed = parseInput(placementSchema, await request.json().catch(() => null), "Action de rattachement inconnue.");
  if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 400 });
  const body = parsed.data;
  const applicationId = body.applicationId;
  const action = body.action;

  const application = await db.from("cfa_applications").select("id, first_name, last_name, email").eq("id", applicationId).maybeSingle();
  if (!application.data) return NextResponse.json({ error: "Dossier introuvable" }, { status: 404 });
  const learnerName = `${application.data.first_name} ${application.data.last_name}`.trim();

  async function closeOpen() {
    await db
      .from("apprentice_placements")
      .update({ status: "ended", ended_at: new Date().toISOString() })
      .eq("apprentice_id", applicationId)
      .in("status", ["active", "pending"]);
  }

  if (action === "create_company") {
    if (body.action !== "create_company") return NextResponse.json({ error: "Action inconnue." }, { status: 400 });
    const companyName = body.companyName;
    const siret = String(body.siret ?? "").replace(/\s/g, "");
    const city = body.city ?? "";
    const created = await db.from("cfa_companies").insert({ company_name: companyName, siret: siret || null, city: city || null, status: "to_contact" }).select("id").single();
    if (created.error || !created.data) return NextResponse.json({ error: created.error?.message ?? "Création impossible" }, { status: 400 });
    await closeOpen();
    const placed = await db.from("apprentice_placements").insert({
      apprentice_id: applicationId,
      company_id: created.data.id,
      status: "pending",
      created_by: await actorId(),
    });
    if (placed.error) return NextResponse.json({ error: placed.error.message }, { status: 400 });
    await recordCfaAudit(db, { actorId: await actorId(), applicationId, action: "placement_company", newValue: created.data.id });
    return NextResponse.json({ ok: true, companyId: created.data.id });
  }

  if (action === "set_company") {
    if (body.action !== "set_company") return NextResponse.json({ error: "Action inconnue." }, { status: 400 });
    const companyId = body.companyId;
    await closeOpen();
    const placed = await db.from("apprentice_placements").insert({
      apprentice_id: applicationId,
      company_id: companyId,
      status: "pending",
      created_by: await actorId(),
    });
    if (placed.error) return NextResponse.json({ error: placed.error.message }, { status: 400 });
    await syncTutorAssignment(db, applicationId);
    await recordCfaAudit(db, { actorId: await actorId(), applicationId, action: "placement_company", newValue: companyId });
    return NextResponse.json({ ok: true });
  }

  if (action === "create_tutor" || action === "set_tutor") {
    const current = await db.from("apprentice_placements").select("company_id").eq("apprentice_id", applicationId).in("status", ["pending", "active"]).order("created_at", { ascending: false }).limit(1).maybeSingle();
    const companyId = String((current.data as { company_id?: string } | null)?.company_id ?? "");
    if (!companyId) return NextResponse.json({ error: "Choisissez d'abord l'entreprise." }, { status: 400 });

    let tutorId = body.action === "set_tutor" ? body.tutorId : "";
    if (action === "create_tutor") {
      if (body.action !== "create_tutor") return NextResponse.json({ error: "Action inconnue." }, { status: 400 });
      const firstName = body.firstName;
      const lastName = body.lastName;
      const email = body.email;
      const jobTitle = body.jobTitle ?? "";
      const created = await db.from("company_tutors").insert({
        company_id: companyId,
        first_name: firstName,
        last_name: lastName,
        email,
        job_title: jobTitle || null,
      }).select("id").single();
      if (created.error || !created.data) {
        const duplicate = created.error?.code === "23505";
        return NextResponse.json({ error: duplicate ? "Ce tuteur existe déjà dans cette entreprise." : created.error?.message ?? "Création impossible" }, { status: 400 });
      }
      tutorId = created.data.id;
    }
    if (!tutorId) return NextResponse.json({ error: "Tuteur requis" }, { status: 400 });

    const tutor = await db.from("company_tutors").select("id, company_id, user_id, first_name, last_name, email, activated_at").eq("id", tutorId).maybeSingle();
    const row = tutor.data as { company_id: string; user_id: string | null; first_name: string; last_name: string; email: string; activated_at: string | null } | null;
    if (!row || row.company_id !== companyId) {
      return NextResponse.json({ error: "Ce tuteur n'appartient pas à l'entreprise d'accueil." }, { status: 400 });
    }

    const company = await db.from("cfa_companies").select("company_name").eq("id", companyId).maybeSingle();
    const companyName = String((company.data as { company_name?: string } | null)?.company_name ?? "");
    const alreadyActive = Boolean(row.user_id && row.activated_at);
    const sent = await sendAccessCode(db, {
      email: row.email,
      role: "tuteur",
      context: alreadyActive ? "tuteur_existing" : "tuteur_new",
      firstName: row.first_name,
      lastName: row.last_name,
      learnerName,
      companyName,
    });
    if (!sent.ok) return NextResponse.json({ error: sent.error, retryAfter: sent.retryAfter }, { status: sent.retryAfter ? 429 : 502 });

    await closeOpen();
    const placed = await db.from("apprentice_placements").insert({
      apprentice_id: applicationId,
      company_id: companyId,
      tutor_id: tutorId,
      status: "active",
      started_at: new Date().toISOString(),
      created_by: await actorId(),
    });
    if (placed.error) return NextResponse.json({ error: placed.error.message }, { status: 400 });
    if (!alreadyActive) {
      await db.from("company_tutors").update({ invited_at: new Date().toISOString(), last_code_sent_at: new Date().toISOString() }).eq("id", tutorId);
    }
    await syncTutorAssignment(db, applicationId);
    await recordCfaAudit(db, { actorId: await actorId(), applicationId, action: "placement_tutor", newValue: tutorId });
    return NextResponse.json({ ok: true });
  }

  if (action === "resend_code") {
    if (body.action !== "resend_code") return NextResponse.json({ error: "Action inconnue." }, { status: 400 });
    const tutorId = body.tutorId;
    const tutor = await db.from("company_tutors").select("id, company_id, user_id, first_name, last_name, email, activated_at").eq("id", tutorId).maybeSingle();
    const row = tutor.data as { company_id: string; user_id: string | null; first_name: string; last_name: string; email: string; activated_at: string | null } | null;
    if (!row) return NextResponse.json({ error: "Tuteur introuvable" }, { status: 404 });
    const company = await db.from("cfa_companies").select("company_name").eq("id", row.company_id).maybeSingle();
    const alreadyActive = Boolean(row.user_id && row.activated_at);
    const sent = await sendAccessCode(db, {
      email: row.email,
      role: "tuteur",
      context: alreadyActive ? "tuteur_existing" : "tuteur_new",
      firstName: row.first_name,
      lastName: row.last_name,
      learnerName,
      companyName: String((company.data as { company_name?: string } | null)?.company_name ?? ""),
    });
    if (!sent.ok) return NextResponse.json({ error: sent.error, retryAfter: sent.retryAfter }, { status: sent.retryAfter ? 429 : 502 });
    if (!alreadyActive) {
      await db.from("company_tutors").update({ last_code_sent_at: new Date().toISOString() }).eq("id", tutorId);
    }
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "Action inconnue" }, { status: 400 });
}
