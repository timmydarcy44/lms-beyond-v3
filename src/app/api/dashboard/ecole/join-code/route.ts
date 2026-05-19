import { NextResponse } from "next/server";

import { fetchSchoolGateProfile, schoolDashboardAllowed } from "@/lib/auth/school-access";
import { getSession } from "@/lib/auth/session";
import { generateStudentJoinCode, normalizeStudentJoinCode } from "@/lib/school/student-join-code";
import { getServerClient } from "@/lib/supabase/server";
import { getServiceSupabase } from "@/lib/supabase/service";

export const dynamic = "force-dynamic";

async function pickUniqueCode(
  svc: Awaited<ReturnType<typeof getServiceSupabase>>,
  schoolId: string,
): Promise<string> {
  for (let attempt = 0; attempt < 12; attempt += 1) {
    const candidate = generateStudentJoinCode(10);
    const { error } = await svc
      .from("organizations")
      .update({ student_join_code: candidate, updated_at: new Date().toISOString() })
      .eq("id", schoolId);
    if (!error) return candidate;
    if (error.code !== "23505") {
      throw new Error(error.message || "UPDATE_ORG_FAILED");
    }
  }
  throw new Error("CODE_GENERATION_FAILED");
}

export async function GET() {
  const session = await getSession();
  if (!session?.id) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const userClient = await getServerClient();
  if (!userClient) {
    return NextResponse.json({ error: "Supabase indisponible" }, { status: 500 });
  }

  const isDemo = session.role === "demo";
  const gate = await fetchSchoolGateProfile(session.id, session.email, userClient);
  const allowed = schoolDashboardAllowed({
    isDemoSession: isDemo,
    sessionFrontendRole: session.role,
    role: gate?.role ?? "",
    roleType: gate?.roleType ?? "",
    schoolIdPresent: Boolean(gate?.school_id),
    profileRowPresent: Boolean(gate),
    requestPath: "/dashboard/ecole/apprenants",
  });

  if (!allowed) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }

  const schoolId = gate?.school_id ?? null;
  if (!schoolId) {
    return NextResponse.json({ error: "École non identifiée" }, { status: 400 });
  }

  let svc: Awaited<ReturnType<typeof getServiceSupabase>>;
  try {
    svc = await getServiceSupabase();
  } catch (e) {
    if (e instanceof Error && e.message === "SERVICE_NOT_CONFIGURED") {
      return NextResponse.json({ error: "SERVICE_NOT_CONFIGURED" }, { status: 503 });
    }
    throw e;
  }

  const { data: row, error: selErr } = await svc
    .from("organizations")
    .select("id, student_join_code")
    .eq("id", schoolId)
    .maybeSingle();

  if (selErr?.code === "42703") {
    return NextResponse.json({ error: "MIGRATION_REQUIRED", details: "student_join_code" }, { status: 503 });
  }
  if (selErr || !row?.id) {
    return NextResponse.json({ error: selErr?.message || "Organisation introuvable" }, { status: 404 });
  }

  const existing = normalizeStudentJoinCode(String(row.student_join_code ?? ""));
  if (existing.length >= 4) {
    return NextResponse.json({ code: existing });
  }

  try {
    const code = await pickUniqueCode(svc, schoolId);
    return NextResponse.json({ code });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Erreur";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session?.id) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const userClient = await getServerClient();
  if (!userClient) {
    return NextResponse.json({ error: "Supabase indisponible" }, { status: 500 });
  }

  const isDemo = session.role === "demo";
  const gate = await fetchSchoolGateProfile(session.id, session.email, userClient);
  const allowed = schoolDashboardAllowed({
    isDemoSession: isDemo,
    sessionFrontendRole: session.role,
    role: gate?.role ?? "",
    roleType: gate?.roleType ?? "",
    schoolIdPresent: Boolean(gate?.school_id),
    profileRowPresent: Boolean(gate),
    requestPath: "/dashboard/ecole/apprenants",
  });

  if (!allowed) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }

  const schoolId = gate?.school_id ?? null;
  if (!schoolId) {
    return NextResponse.json({ error: "École non identifiée" }, { status: 400 });
  }

  let body: { action?: string; code?: string | null };
  try {
    body = (await request.json()) as { action?: string; code?: string | null };
  } catch {
    body = {};
  }

  const action = String(body.action ?? "regenerate").trim().toLowerCase();

  let svc: Awaited<ReturnType<typeof getServiceSupabase>>;
  try {
    svc = await getServiceSupabase();
  } catch (e) {
    if (e instanceof Error && e.message === "SERVICE_NOT_CONFIGURED") {
      return NextResponse.json({ error: "SERVICE_NOT_CONFIGURED" }, { status: 503 });
    }
    throw e;
  }

  if (action === "set" && body.code != null) {
    const next = normalizeStudentJoinCode(String(body.code));
    if (next.length < 4 || next.length > 32) {
      return NextResponse.json({ error: "Code : 4 à 32 caractères (lettres et chiffres)." }, { status: 400 });
    }
    if (!/^[a-z0-9]+$/.test(next)) {
      return NextResponse.json({ error: "Utilisez uniquement lettres minuscules et chiffres." }, { status: 400 });
    }
    const { error } = await svc
      .from("organizations")
      .update({ student_join_code: next, updated_at: new Date().toISOString() })
      .eq("id", schoolId);
    if (error?.code === "23505") {
      return NextResponse.json({ error: "Ce code est déjà utilisé par une autre organisation." }, { status: 409 });
    }
    if (error?.code === "42703") {
      return NextResponse.json({ error: "MIGRATION_REQUIRED" }, { status: 503 });
    }
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ code: next });
  }

  try {
    const code = await pickUniqueCode(svc, schoolId);
    return NextResponse.json({ code });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Erreur";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
