import { NextRequest, NextResponse } from "next/server";
import { resolveEmployeeIdForUser } from "@/lib/learner/resolve-employee-id";
import { createSupabaseServerClient, getServiceRoleClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const MISSION_COLUMNS =
  "id, title, description, due_date, status, created_at, updated_at, employee_id, profile_id";

async function fetchMissionsForUser(userId: string, email: string | null | undefined) {
  const db = getServiceRoleClient();
  if (!db) return { missions: [], error: "Service indisponible" as const };

  const employeeId = await resolveEmployeeIdForUser(db, userId, email);

  let query = db
    .from("employee_missions")
    .select(MISSION_COLUMNS)
    .neq("status", "cancelled")
    .order("created_at", { ascending: false });

  if (employeeId) {
    query = query.or(`profile_id.eq.${userId},employee_id.eq.${employeeId}`);
  } else {
    query = query.eq("profile_id", userId);
  }

  const { data, error } = await query;
  if (error) return { missions: [], error: error.message };

  const missions = (data ?? []).map(({ employee_id: _e, profile_id: _p, ...rest }) => rest);
  return { missions, error: null };
}

export async function GET() {
  let authClient;
  try {
    authClient = await createSupabaseServerClient();
  } catch {
    return NextResponse.json({ error: "Configuration Supabase manquante" }, { status: 503 });
  }

  const {
    data: { user },
    error: authError,
  } = await authClient.auth.getUser();
  if (authError || !user?.id) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const result = await fetchMissionsForUser(user.id, user.email);
  if (result.error) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json({ missions: result.missions });
}

export async function PATCH(request: NextRequest) {
  let authClient;
  try {
    authClient = await createSupabaseServerClient();
  } catch {
    return NextResponse.json({ error: "Configuration Supabase manquante" }, { status: 503 });
  }

  const {
    data: { user },
    error: authError,
  } = await authClient.auth.getUser();
  if (authError || !user?.id) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  let body: { id?: string; status?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Corps invalide" }, { status: 400 });
  }

  const missionId = String(body.id ?? "").trim();
  const status = String(body.status ?? "").trim();
  const allowed = new Set(["pending", "in_progress", "completed"]);
  if (!missionId || !allowed.has(status)) {
    return NextResponse.json({ error: "Identifiant ou statut invalide" }, { status: 400 });
  }

  const db = getServiceRoleClient();
  if (!db) {
    return NextResponse.json({ error: "Service indisponible" }, { status: 503 });
  }

  const employeeId = await resolveEmployeeIdForUser(db, user.id, user.email);

  let ownQuery = db.from("employee_missions").select("id").eq("id", missionId);
  if (employeeId) {
    ownQuery = ownQuery.or(`profile_id.eq.${user.id},employee_id.eq.${employeeId}`);
  } else {
    ownQuery = ownQuery.eq("profile_id", user.id);
  }

  const { data: owned } = await ownQuery.maybeSingle();
  if (!owned) {
    return NextResponse.json({ error: "Mission introuvable" }, { status: 404 });
  }

  const { data, error } = await db
    .from("employee_missions")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", missionId)
    .select("id, title, description, due_date, status, created_at, updated_at")
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
  if (!data) {
    return NextResponse.json({ error: "Mission introuvable" }, { status: 404 });
  }

  return NextResponse.json({ mission: data });
}
