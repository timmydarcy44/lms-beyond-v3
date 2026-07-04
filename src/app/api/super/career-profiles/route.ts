import { NextRequest, NextResponse } from "next/server";
import { isSuperAdmin } from "@/lib/auth/super-admin";
import {
  listAllCareerProfilesAdmin,
  slugifyCareerTitle,
} from "@/lib/career-profiles/career-profiles-repo";
import { getServiceRoleClientOrFallback } from "@/lib/supabase/server";

const SELECT_COLS =
  "id,slug,title,sector,description,key_skills,soft_skills,behavioral_expectations,recommended_badges,typical_challenges,success_factors,main_missions,useful_qualities,recommended_formations,is_active,created_at,updated_at";

function parseStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.map(String).map((s) => s.trim()).filter(Boolean);
}

export async function GET() {
  const isAdmin = await isSuperAdmin();
  if (!isAdmin) {
    return NextResponse.json({ error: "Accès non autorisé" }, { status: 403 });
  }

  const profiles = await listAllCareerProfilesAdmin();
  return NextResponse.json({ profiles });
}

export async function POST(request: NextRequest) {
  const isAdmin = await isSuperAdmin();
  if (!isAdmin) {
    return NextResponse.json({ error: "Accès non autorisé" }, { status: 403 });
  }

  const supabase = await getServiceRoleClientOrFallback();
  if (!supabase) {
    return NextResponse.json({ error: "Service indisponible" }, { status: 503 });
  }

  try {
    const body = await request.json();
    const title = String(body.title ?? "").trim();
    if (!title) {
      return NextResponse.json({ error: "Le titre est requis." }, { status: 400 });
    }

    const slug = slugifyCareerTitle(String(body.slug ?? title));
    const now = new Date().toISOString();

    const row = {
      id: slug,
      slug,
      title,
      sector: String(body.sector ?? "").trim() || "Autre",
      description: String(body.description ?? "").trim(),
      key_skills: parseStringArray(body.key_skills),
      soft_skills: parseStringArray(body.soft_skills),
      behavioral_expectations: parseStringArray(body.behavioral_expectations),
      recommended_badges: parseStringArray(body.recommended_badges),
      typical_challenges: parseStringArray(body.typical_challenges),
      success_factors: parseStringArray(body.success_factors),
      main_missions: parseStringArray(body.main_missions),
      useful_qualities: parseStringArray(body.useful_qualities),
      recommended_formations: parseStringArray(body.recommended_formations),
      is_active: body.is_active !== false,
      updated_at: now,
    };

    const { data, error } = await supabase
      .from("career_profiles")
      .upsert(row, { onConflict: "slug" })
      .select(SELECT_COLS)
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ profile: data });
  } catch (error) {
    console.error("[api/super/career-profiles] POST error:", error);
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 });
  }
}
