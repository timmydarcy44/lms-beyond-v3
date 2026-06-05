import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET() {
  let supabase;
  try {
    supabase = await createSupabaseServerClient();
  } catch {
    return NextResponse.json({ error: "Configuration Supabase manquante" }, { status: 503 });
  }

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user?.id) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("employee_missions")
    .select("id, title, description, due_date, status, created_at, updated_at")
    .eq("profile_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ missions: data ?? [] });
}

export async function PATCH(request: NextRequest) {
  let supabase;
  try {
    supabase = await createSupabaseServerClient();
  } catch {
    return NextResponse.json({ error: "Configuration Supabase manquante" }, { status: 503 });
  }

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
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

  const { data, error } = await supabase
    .from("employee_missions")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", missionId)
    .eq("profile_id", user.id)
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
