import { NextRequest, NextResponse } from "next/server";
import { getCareerProfileBySlug } from "@/lib/career-profiles/career-profiles-repo";
import { getServerClient } from "@/lib/supabase/server";

export async function PATCH(request: NextRequest) {
  try {
    const supabase = await getServerClient();
    if (!supabase) {
      return NextResponse.json({ error: "Supabase non configuré" }, { status: 500 });
    }

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const body = await request.json();
    const slug = String(body.target_career_slug ?? "").trim();
    if (!slug) {
      return NextResponse.json({ error: "Métier requis" }, { status: 400 });
    }

    const career = await getCareerProfileBySlug(slug);
    if (!career) {
      return NextResponse.json({ error: "Métier inconnu" }, { status: 404 });
    }

    const { error } = await supabase
      .from("profiles")
      .update({ target_career_slug: slug })
      .eq("id", user.id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, career });
  } catch (error) {
    console.error("[api/learner/target-career] error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
