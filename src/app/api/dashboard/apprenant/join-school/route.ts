import { NextResponse } from "next/server";

import { getSession } from "@/lib/auth/session";
import { fetchSchoolGateProfile, profileRolesIndicateSchoolDashboard } from "@/lib/auth/school-access";
import { normalizeStudentJoinCode } from "@/lib/school/student-join-code";
import { getServerClient } from "@/lib/supabase/server";
import { getServiceSupabase } from "@/lib/supabase/service";

export const dynamic = "force-dynamic";

async function upsertLearnerMembership(
  svc: Awaited<ReturnType<typeof getServiceSupabase>>,
  orgId: string,
  userId: string,
): Promise<{ error: string | null }> {
  const payload = { org_id: orgId, user_id: userId, role: "learner" as const };
  let err = (await svc.from("org_memberships").upsert(payload, { onConflict: "org_id,user_id" })).error;
  if (err?.code === "42703") {
    err = (
      await svc.from("org_memberships").upsert(
        { organisation_id: orgId, user_id: userId, role: "learner" } as Record<string, unknown>,
        { onConflict: "organisation_id,user_id" },
      )
    ).error as typeof err;
  }
  return { error: err ? String(err.message || "MEMBERSHIP_UPSERT_FAILED") : null };
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session?.id) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const userClient = await getServerClient();
  if (userClient) {
    const gate = await fetchSchoolGateProfile(session.id, session.email, userClient);
    if (gate && profileRolesIndicateSchoolDashboard(gate.role, gate.roleType)) {
      return NextResponse.json(
        { error: "Compte établissement : ce code est réservé aux apprenants." },
        { status: 403 },
      );
    }
  }

  let body: { code?: string };
  try {
    body = (await request.json()) as { code?: string };
  } catch {
    return NextResponse.json({ error: "JSON invalide" }, { status: 400 });
  }

  const normalized = normalizeStudentJoinCode(String(body.code ?? ""));
  if (normalized.length < 4) {
    return NextResponse.json({ error: "Code trop court (4 caractères minimum)." }, { status: 400 });
  }

  let svc: Awaited<ReturnType<typeof getServiceSupabase>>;
  try {
    svc = await getServiceSupabase();
  } catch (e) {
    if (e instanceof Error && e.message === "SERVICE_NOT_CONFIGURED") {
      return NextResponse.json(
        { error: "Serveur incomplet : SUPABASE_SERVICE_ROLE_KEY requis pour ce flux." },
        { status: 503 },
      );
    }
    throw e;
  }

  const { data: orgRow, error: orgErr } = await svc
    .from("organizations")
    .select("id, name, student_join_code")
    .ilike("student_join_code", normalized)
    .maybeSingle();

  if (orgErr?.code === "42703") {
    return NextResponse.json(
      { error: "Colonne student_join_code absente : appliquez la migration 20260512120000_organizations_student_join_code.sql." },
      { status: 503 },
    );
  }
  if (orgErr) {
    return NextResponse.json({ error: orgErr.message || "Lecture organisation impossible" }, { status: 500 });
  }
  if (!orgRow?.id) {
    return NextResponse.json({ error: "Code inconnu ou expiré. Vérifiez avec votre CFA." }, { status: 404 });
  }

  const orgId = String(orgRow.id);
  const orgName = orgRow.name != null ? String(orgRow.name) : null;

  const { data: prof, error: profErr } = await svc
    .from("profiles")
    .select("id, school_id")
    .eq("id", session.id)
    .maybeSingle();

  if (profErr || !prof?.id) {
    return NextResponse.json({ error: "Profil introuvable." }, { status: 404 });
  }

  const currentSchool = prof.school_id != null && String(prof.school_id).trim() ? String(prof.school_id).trim() : null;
  if (currentSchool && currentSchool !== orgId) {
    return NextResponse.json(
      { error: "Votre compte est déjà rattaché à un autre établissement. Contactez le support pour un transfert." },
      { status: 409 },
    );
  }

  if (currentSchool === orgId) {
    const { error: ssErr } = await svc.from("school_students").insert({ school_id: orgId, student_id: session.id });
    if (ssErr && ssErr.code !== "23505" && ssErr.code !== "42P01") {
      return NextResponse.json({ error: ssErr.message || "Liaison school_students impossible" }, { status: 500 });
    }
    const mem = await upsertLearnerMembership(svc, orgId, session.id);
    if (mem.error) {
      return NextResponse.json({ error: mem.error }, { status: 500 });
    }
    return NextResponse.json({ ok: true, alreadyMember: true, schoolId: orgId, schoolName: orgName });
  }

  const now = new Date().toISOString();
  const { error: upErr } = await svc
    .from("profiles")
    .update({
      school_id: orgId,
      role: "student",
      role_type: "apprenant",
      updated_at: now,
    })
    .eq("id", session.id);

  if (upErr) {
    return NextResponse.json({ error: upErr.message || "Mise à jour profil impossible" }, { status: 500 });
  }

  const { error: ssErr } = await svc.from("school_students").insert({ school_id: orgId, student_id: session.id });
  if (ssErr && ssErr.code !== "23505" && ssErr.code !== "42P01") {
    return NextResponse.json({ error: ssErr.message || "Liaison school_students impossible" }, { status: 500 });
  }

  const mem = await upsertLearnerMembership(svc, orgId, session.id);
  if (mem.error) {
    return NextResponse.json({ error: mem.error }, { status: 500 });
  }

  return NextResponse.json({ ok: true, schoolId: orgId, schoolName: orgName });
}
