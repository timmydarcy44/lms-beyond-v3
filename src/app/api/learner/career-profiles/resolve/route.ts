import { NextRequest, NextResponse } from "next/server";
import { resolveCareerProfile } from "@/lib/career-profiles/resolve-career-profile";
import { getServerClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const supabase = await getServerClient();
    if (!supabase) {
      return NextResponse.json({ error: "Service indisponible" }, { status: 503 });
    }

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const body = await request.json();
    const title = String(body.title ?? "").trim();
    const slug = String(body.slug ?? "").trim();

    if (!title && !slug) {
      return NextResponse.json({ error: "Indiquez un métier." }, { status: 400 });
    }

    if (title.length > 120) {
      return NextResponse.json({ error: "Intitulé de métier trop long." }, { status: 400 });
    }

    const resolved = await resolveCareerProfile({ title: title || undefined, slug: slug || undefined });

    if (!resolved) {
      return NextResponse.json(
        { error: "Impossible d'analyser ce métier pour le moment. Réessayez dans quelques instants." },
        { status: 503 },
      );
    }

    const { error: profileError } = await supabase
      .from("profiles")
      .update({ target_career_slug: resolved.profile.slug })
      .eq("id", user.id);

    if (profileError) {
      return NextResponse.json({ error: profileError.message }, { status: 500 });
    }

    return NextResponse.json({
      profile: resolved.profile,
      cached: resolved.cached,
      target_career_slug: resolved.profile.slug,
    });
  } catch (error) {
    console.error("[api/learner/career-profiles/resolve] error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
