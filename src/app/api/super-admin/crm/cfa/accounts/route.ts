import { NextRequest, NextResponse } from "next/server";
import { isSuperAdmin } from "@/lib/auth/super-admin";
import { sendAccessCode } from "@/lib/cfa/access-code";
import { recordCfaAudit } from "@/lib/cfa/admit-application";
import { accountMutationSchema, accountSearchSchema, parseInput } from "@/lib/cfa/fiche-input";
import { syncTutorAssignment } from "@/lib/cfa/sync-tutor-assignment";
import { getServerClient, getServiceRoleClient } from "@/lib/supabase/server";

function clean(value: unknown, max = 80) {
  return String(value ?? "").trim().slice(0, max);
}

function digits(value: string) {
  return value.replace(/\D/g, "");
}

function sameText(left: string, right: string) {
  const a = left.trim().toLowerCase();
  const b = right.trim().toLowerCase();
  return Boolean(a && a === b);
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
  const parsed = parseInput(accountSearchSchema, {
    applicationId: request.nextUrl.searchParams.get("applicationId") ?? "",
    q: request.nextUrl.searchParams.get("q") ?? "",
  }, "Recherche de compte invalide.");
  if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 400 });
  const applicationId = parsed.data.applicationId;
  const query = parsed.data.q.replace(/[%(),]/g, "");
  if (query.length < 2) return NextResponse.json({ error: "Saisissez au moins 2 caractères." }, { status: 400 });

  const application = await db.from("cfa_applications").select("id, last_name, phone").eq("id", applicationId).maybeSingle();
  if (!application.data) return NextResponse.json({ error: "Dossier introuvable" }, { status: 404 });
  const app = application.data as { last_name?: string; phone?: string | null };

  const found = await db
    .from("profiles")
    .select("id, first_name, last_name, email, phone")
    .or(`email.ilike.%${query}%,first_name.ilike.%${query}%,last_name.ilike.%${query}%`)
    .limit(12);
  if (found.error) return NextResponse.json({ error: found.error.message }, { status: 400 });
  const rows = (found.data ?? []) as Array<{ id: string; first_name?: string | null; last_name?: string | null; email?: string | null; phone?: string | null }>;
  const ids = rows.map((row) => row.id);
  const linked = ids.length
    ? await db.from("cfa_applications").select("id, profile_id, status").in("profile_id", ids).neq("status", "rejected")
    : { data: [] };
  const taken = new Set(
    ((linked.data ?? []) as Array<{ id: string; profile_id: string }>).filter((row) => row.id !== applicationId).map((row) => row.profile_id),
  );
  const appPhone = digits(String(app.phone ?? ""));

  return NextResponse.json({
    accounts: rows.map((row) => ({
      id: row.id,
      firstName: row.first_name ?? "",
      lastName: row.last_name ?? "",
      email: row.email ?? "",
      phone: row.phone ?? "",
      sameName: sameText(String(app.last_name ?? ""), String(row.last_name ?? "")),
      samePhone: Boolean(appPhone && appPhone === digits(String(row.phone ?? ""))),
      linkedElsewhere: taken.has(row.id),
    })),
  });
}

export async function POST(request: NextRequest) {
  if (!(await isSuperAdmin())) return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  const db = getServiceRoleClient();
  if (!db) return NextResponse.json({ error: "Service indisponible" }, { status: 503 });
  const parsed = parseInput(accountMutationSchema, await request.json().catch(() => null), "Liaison de compte invalide.");
  if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 400 });
  const body = parsed.data;
  const applicationId = body.applicationId;
  const action = body.action;

  const application = await db.from("cfa_applications").select("id, status, profile_id, first_name, last_name, email, phone").eq("id", applicationId).maybeSingle();
  const app = application.data as { status: string; profile_id: string | null; first_name: string; last_name: string; email: string; phone: string | null } | null;
  if (!app) return NextResponse.json({ error: "Dossier introuvable" }, { status: 404 });

  if (action === "unlink") {
    if (app.status === "admitted" || app.status === "contract") {
      return NextResponse.json({ error: "Le compte ne peut plus être délié après l'admission." }, { status: 409 });
    }
    const { error } = await db.from("cfa_applications").update({ profile_id: null, origin: "direct" }).eq("id", applicationId);
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    await syncTutorAssignment(db, applicationId, { previousLearnerId: app.profile_id });
    await recordCfaAudit(db, { actorId: await actorId(), applicationId, action: "account_unlink", oldValue: app.profile_id, newValue: null });
    return NextResponse.json({ ok: true });
  }

  if (action !== "link") return NextResponse.json({ error: "Action inconnue" }, { status: 400 });
  if (body.action !== "link") return NextResponse.json({ error: "Action inconnue." }, { status: 400 });
  const profileId = body.profileId;

  const profile = await db.from("profiles").select("id, first_name, last_name, email, phone").eq("id", profileId).maybeSingle();
  const person = profile.data as { first_name?: string | null; last_name?: string | null; email?: string | null; phone?: string | null } | null;
  if (!person?.email) return NextResponse.json({ error: "Compte introuvable" }, { status: 404 });

  const others = await db.from("cfa_applications").select("id").eq("profile_id", profileId).neq("id", applicationId).neq("status", "rejected");
  if ((others.data ?? []).length) {
    return NextResponse.json({ error: "Ce compte est déjà lié à une autre candidature active." }, { status: 409 });
  }

  const sameName = sameText(app.last_name, String(person.last_name ?? ""));
  const samePhone = Boolean(digits(app.phone ?? "") && digits(app.phone ?? "") === digits(String(person.phone ?? "")));
  if (!sameName && !samePhone && body.confirmNoMatch !== true) {
    return NextResponse.json({ error: "Aucun point commun. Confirmez le lien.", needsConfirm: true }, { status: 409 });
  }

  const { error } = await db.from("cfa_applications").update({ profile_id: profileId, origin: "existing_account" }).eq("id", applicationId);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  await syncTutorAssignment(db, applicationId);
  await recordCfaAudit(db, { actorId: await actorId(), applicationId, action: "account_link", oldValue: app.profile_id, newValue: profileId });
  const sent = await sendAccessCode(db, {
    email: person.email,
    role: "apprenant",
    context: "application_linked",
    firstName: String(person.first_name ?? app.first_name),
    lastName: String(person.last_name ?? app.last_name),
  });
  if (!sent.ok) return NextResponse.json({ error: sent.error }, { status: 502 });
  return NextResponse.json({ ok: true });
}
