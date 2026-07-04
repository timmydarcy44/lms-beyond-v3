import { NextRequest, NextResponse } from "next/server";
import { isSuperAdmin } from "@/lib/auth/super-admin";
import { getServiceRoleClientOrFallback } from "@/lib/supabase/server";

type RouteContext = { params: Promise<{ id: string }> };

function parseStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.map(String).map((s) => s.trim()).filter(Boolean);
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  const isAdmin = await isSuperAdmin();
  if (!isAdmin) {
    return NextResponse.json({ error: "Accès non autorisé" }, { status: 403 });
  }

  const supabase = await getServiceRoleClientOrFallback();
  if (!supabase) {
    return NextResponse.json({ error: "Service indisponible" }, { status: 503 });
  }

  const { id } = await context.params;

  try {
    const body = await request.json();
    const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };

    if (body.title != null) patch.title = String(body.title).trim();
    if (body.sector != null) patch.sector = String(body.sector).trim();
    if (body.description != null) patch.description = String(body.description).trim();
    if (body.key_skills != null) patch.key_skills = parseStringArray(body.key_skills);
    if (body.soft_skills != null) patch.soft_skills = parseStringArray(body.soft_skills);
    if (body.behavioral_expectations != null) {
      patch.behavioral_expectations = parseStringArray(body.behavioral_expectations);
    }
    if (body.typical_challenges != null) patch.typical_challenges = parseStringArray(body.typical_challenges);
    if (body.success_factors != null) patch.success_factors = parseStringArray(body.success_factors);
    if (body.main_missions != null) patch.main_missions = parseStringArray(body.main_missions);
    if (body.useful_qualities != null) patch.useful_qualities = parseStringArray(body.useful_qualities);
    if (body.recommended_badges != null) patch.recommended_badges = parseStringArray(body.recommended_badges);
    if (body.is_active != null) patch.is_active = Boolean(body.is_active);

    const { data, error } = await supabase
      .from("career_profiles")
      .update(patch)
      .eq("id", id)
      .select("*")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ profile: data });
  } catch (error) {
    console.error("[api/super/career-profiles/[id]] PATCH error:", error);
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
  const isAdmin = await isSuperAdmin();
  if (!isAdmin) {
    return NextResponse.json({ error: "Accès non autorisé" }, { status: 403 });
  }

  const supabase = await getServiceRoleClientOrFallback();
  if (!supabase) {
    return NextResponse.json({ error: "Service indisponible" }, { status: 503 });
  }

  const { id } = await context.params;

  const { error } = await supabase.from("career_profiles").delete().eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
