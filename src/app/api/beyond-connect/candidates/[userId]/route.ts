import { NextRequest, NextResponse } from "next/server";
import { getServerClient } from "@/lib/supabase/server";

/**
 * Récupère le profil complet d'un candidat
 * GET /api/beyond-connect/candidates/[userId]
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const supabase = await getServerClient();
    if (!supabase) {
      return NextResponse.json({ error: "Supabase non configuré" }, { status: 500 });
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    // Vérifier que l'utilisateur est membre d'une organisation
    const { data: memberships } = await supabase
      .from("org_memberships")
      .select("org_id")
      .eq("user_id", user.id)
      .in("role", ["admin", "instructor"]);

    if (!memberships || memberships.length === 0) {
      return NextResponse.json({ error: "Accès réservé aux entreprises" }, { status: 403 });
    }

    const { userId } = await params;
    const candidateUserId = userId;
    const { searchParams } = new URL(request.url);
    const jobOfferId = searchParams.get("job_offer_id");

    // Vérifier que le candidat est un utilisateur BtoC (sans organisation)
    // Beyond Connect ne doit afficher que les clients BtoC (Beyond No School)
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", candidateUserId)
      .in("role", ["learner", "student"])
      .single();

    if (profileError || !profile) {
      return NextResponse.json({ error: "Profil non trouvé" }, { status: 404 });
    }

    // Vérifier que l'utilisateur n'a pas d'organisation (BtoC uniquement)
    const { data: membership } = await supabase
      .from("org_memberships")
      .select("id")
      .eq("user_id", candidateUserId)
      .maybeSingle();

    if (membership) {
      return NextResponse.json({ error: "Ce profil n'est pas accessible (utilisateur BtoB)" }, { status: 403 });
    }

    // Récupérer toutes les données du candidat
    const [experiences, education, skills, certifications, languages, badges, testResults, matchData] = await Promise.all([
      supabase.from("beyond_connect_experiences").select("*").eq("user_id", candidateUserId).order("start_date", { ascending: false }),
      supabase.from("beyond_connect_education").select("*").eq("user_id", candidateUserId).order("end_date", { ascending: false }),
      supabase.from("beyond_connect_skills").select("*").eq("user_id", candidateUserId),
      supabase.from("beyond_connect_certifications").select("*").eq("user_id", candidateUserId),
      supabase.from("beyond_connect_languages").select("*").eq("user_id", candidateUserId),
      supabase.from("beyond_connect_user_badges").select("*").eq("user_id", candidateUserId),
      supabase.from("beyond_connect_test_results").select("*").eq("user_id", candidateUserId).order("completed_at", { ascending: false }),
      jobOfferId
        ? supabase
            .from("beyond_connect_matches")
            .select("match_score, skills_match, experience_match, education_match, details")
            .eq("user_id", candidateUserId)
            .eq("job_offer_id", jobOfferId)
            .maybeSingle()
        : Promise.resolve({ data: null, error: null }),
    ]);

    return NextResponse.json({
      profile: {
        user_id: profile.id,
        email: profile.email,
        first_name: profile.first_name,
        last_name: profile.last_name,
        full_name: profile.full_name,
        avatar_url: profile.avatar_url,
        phone: profile.phone,
        birth_date: profile.birth_date,
      },
      experiences: experiences.data || [],
      education: education.data || [],
      skills: skills.data || [],
      certifications: certifications.data || [],
      languages: languages.data || [],
      badges: badges.data || [],
      testResults: testResults.data || [],
      matchData: matchData.data
        ? {
            match_score: matchData.data.match_score,
            skills_match: matchData.data.skills_match,
            experience_match: matchData.data.experience_match,
            education_match: matchData.data.education_match,
            details: matchData.data.details || {},
          }
        : undefined,
    });
  } catch (error) {
    console.error("[beyond-connect/candidates/[userId]] Error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

