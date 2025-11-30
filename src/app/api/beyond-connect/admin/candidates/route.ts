import { NextRequest, NextResponse } from "next/server";
import { getServiceRoleClient } from "@/lib/supabase/server";
import { getSession } from "@/lib/auth/session";
import { isSuperAdmin } from "@/lib/auth/super-admin";

export async function GET(request: NextRequest) {
  try {
    // Vérifier que l'utilisateur est super admin
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const hasAccess = await isSuperAdmin();
    if (!hasAccess) {
      return NextResponse.json({ error: "Accès non autorisé" }, { status: 403 });
    }

    const supabase = getServiceRoleClient();
    if (!supabase) {
      return NextResponse.json({ error: "Erreur de connexion" }, { status: 500 });
    }

    // Récupérer tous les profils qui ont des données Beyond Connect
    // On récupère d'abord tous les user_id qui ont des données Beyond Connect
    const { data: experiences } = await supabase
      .from("beyond_connect_experiences")
      .select("user_id");
    
    const { data: skills } = await supabase
      .from("beyond_connect_skills")
      .select("user_id");
    
    const { data: education } = await supabase
      .from("beyond_connect_education")
      .select("user_id");
    
    // Combiner tous les user_id uniques
    const userIds = new Set<string>();
    experiences?.forEach(e => userIds.add(e.user_id));
    skills?.forEach(s => userIds.add(s.user_id));
    education?.forEach(e => userIds.add(e.user_id));
    
    const userIdsArray = Array.from(userIds);
    
    // Récupérer les profils correspondants
    const { data: profiles, error: profilesError } = await supabase
      .from("profiles")
      .select("id, email, first_name, last_name, full_name, avatar_url, phone, birth_date, created_at")
      .in("id", userIdsArray.length > 0 ? userIdsArray : ['00000000-0000-0000-0000-000000000000'])
      .order("created_at", { ascending: false });

    if (profilesError) {
      console.error("[beyond-connect/admin/candidates] Error fetching profiles:", profilesError);
      return NextResponse.json({ error: "Erreur lors de la récupération des profils" }, { status: 500 });
    }

    // Pour chaque profil, récupérer les données Beyond Connect
    const candidates = await Promise.all(
      (profiles || []).map(async (profile) => {
        // Récupérer les compétences
        const { data: skills } = await supabase
          .from("beyond_connect_skills")
          .select("id, name, category, level")
          .eq("user_id", profile.id);

        // Récupérer les expériences pour obtenir la localisation
        const { data: experiences } = await supabase
          .from("beyond_connect_experiences")
          .select("location")
          .eq("user_id", profile.id)
          .order("start_date", { ascending: false })
          .limit(1);

        const location = experiences?.[0]?.location || null;

        // Récupérer les soft skills depuis les résultats de tests
        // Essayer d'abord avec category_results (structure récente)
        const { data: testResults } = await supabase
          .from("test_attempts")
          .select("category_results, answers")
          .eq("user_id", profile.id)
          .not("category_results", "is", null)
          .order("completed_at", { ascending: false })
          .limit(1);

        let softSkills: Array<{ dimension: string; score: number }> = [];
        if (testResults && testResults.length > 0) {
          const attempt = testResults[0];
          
          // Si category_results existe et est un array
          if (attempt.category_results && Array.isArray(attempt.category_results)) {
            softSkills = attempt.category_results.map((cat: any) => ({
              dimension: cat.dimension || cat.name || cat.category || "",
              score: cat.percentage || cat.score || 0,
            })).filter((ss: any) => ss.dimension);
          }
        }

        return {
          user_id: profile.id,
          email: profile.email,
          first_name: profile.first_name,
          last_name: profile.last_name,
          full_name: profile.full_name,
          avatar_url: profile.avatar_url,
          phone: profile.phone,
          birth_date: profile.birth_date,
          location: location,
          skills: skills || [],
          soft_skills: softSkills,
          created_at: profile.created_at || new Date().toISOString(),
        };
      })
    );

    return NextResponse.json({ candidates });
  } catch (error) {
    console.error("[beyond-connect/admin/candidates] Error:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération des candidats" },
      { status: 500 }
    );
  }
}

