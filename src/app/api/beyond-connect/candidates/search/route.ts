import { NextRequest, NextResponse } from "next/server";
import { getServerClient } from "@/lib/supabase/server";

/**
 * Recherche de candidats avec filtres
 * GET /api/beyond-connect/candidates/search
 */
export async function GET(request: NextRequest) {
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

    const { searchParams } = new URL(request.url);
    const jobOfferId = searchParams.get("job_offer_id");
    const matchRange = searchParams.get("match_range");
    const location = searchParams.get("location");
    const ageMin = searchParams.get("age_min");
    const ageMax = searchParams.get("age_max");
    const skills = searchParams.get("skills");
    const searchTerm = searchParams.get("search");

    // Récupérer les utilisateurs BtoC uniquement (sans organisation)
    // Beyond Connect ne doit afficher que les clients BtoC (Beyond No School)
    const { data: b2cProfiles } = await supabase
      .from("profiles")
      .select("id")
      .in("role", ["learner", "student"])
      .limit(1000); // Limite de sécurité

    if (!b2cProfiles || b2cProfiles.length === 0) {
      return NextResponse.json({ candidates: [] });
    }

    // Filtrer pour ne garder que ceux qui n'ont PAS d'organisation (BtoC)
    const b2cUserIds = b2cProfiles.map(p => p.id);
    const { data: orgMemberships } = await supabase
      .from("org_memberships")
      .select("user_id")
      .in("user_id", b2cUserIds);

    const usersWithOrg = new Set(orgMemberships?.map(m => m.user_id) || []);
    const b2cOnlyUserIds = b2cUserIds.filter(id => !usersWithOrg.has(id));

    // Récupérer les profils avec leurs paramètres de visibilité (uniquement BtoC)
    const { data: profileSettings } = await supabase
      .from("beyond_connect_profile_settings")
      .select("user_id")
      .eq("is_searchable", true)
      .in("user_id", b2cOnlyUserIds);

    let searchableUserIds: string[] = [];
    if (profileSettings && profileSettings.length > 0) {
      searchableUserIds = profileSettings.map(ps => ps.user_id);
    } else {
      // Si aucun paramètre, utiliser tous les utilisateurs BtoC
      searchableUserIds = b2cOnlyUserIds;
    }

    if (searchableUserIds.length === 0) {
      return NextResponse.json({ candidates: [] });
    }

    // Récupérer les profils de base
    let query = supabase
      .from("profiles")
      .select("id, email, first_name, last_name, full_name, avatar_url")
      .in("id", searchableUserIds);

    // Si une offre d'emploi est sélectionnée, récupérer les matchings
    if (jobOfferId) {
      const { data: matches } = await supabase
        .from("beyond_connect_matches")
        .select("user_id, match_score, skills_match, experience_match, education_match")
        .eq("job_offer_id", jobOfferId);

      if (matches && matches.length > 0) {
        const userIds = matches.map(m => m.user_id);
        
        // Filtrer par score de matching si spécifié
        let finalUserIds = userIds;
        if (matchRange && matchRange !== "all") {
          const [min, max] = matchRange.split("-").map(Number);
          finalUserIds = matches
            .filter(m => m.match_score >= min && m.match_score <= max)
            .map(m => m.user_id);
        }
        
        // Filtrer les profils par les IDs des matchings
        query = query.in("id", finalUserIds);
      } else {
        // Pas de matchings, retourner vide
        return NextResponse.json({ candidates: [] });
      }
    }

    const { data: profiles, error: profilesError } = await query;

    if (profilesError) {
      console.error("[beyond-connect/candidates/search] Error:", profilesError);
      return NextResponse.json({ error: profilesError.message }, { status: 500 });
    }

    if (!profiles || profiles.length === 0) {
      return NextResponse.json({ candidates: [] });
    }

    // Récupérer les matchings si une offre est sélectionnée
    let matchesMap = new Map();
    if (jobOfferId) {
      const { data: matches } = await supabase
        .from("beyond_connect_matches")
        .select("user_id, match_score, skills_match, experience_match, education_match")
        .eq("job_offer_id", jobOfferId);

      if (matches) {
        matches.forEach(m => {
          matchesMap.set(m.user_id, {
            match_score: m.match_score,
            skills_match: m.skills_match,
            experience_match: m.experience_match,
            education_match: m.education_match,
          });
        });
      }
    }

    // Filtrer par recherche textuelle
    let filteredProfiles = profiles;
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filteredProfiles = profiles.filter(p =>
        (p.full_name || `${p.first_name || ""} ${p.last_name || ""}`).toLowerCase().includes(searchLower) ||
        p.email.toLowerCase().includes(searchLower)
      );
    }

    // Filtrer par compétences (nécessite de charger les compétences)
    if (skills) {
      const skillsArray = skills.split(",").map(s => s.trim().toLowerCase());
      const { data: userSkills } = await supabase
        .from("beyond_connect_skills")
        .select("user_id, name")
        .in("user_id", filteredProfiles.map(p => p.id));

      if (userSkills) {
        const usersWithSkills = new Set(
          userSkills
            .filter(us => skillsArray.some(skill => us.name.toLowerCase().includes(skill)))
            .map(us => us.user_id)
        );
        filteredProfiles = filteredProfiles.filter(p => usersWithSkills.has(p.id));
      }
    }

    // Filtrer par localisation (nécessite de charger les expériences)
    if (location) {
      const locationLower = location.toLowerCase();
      const { data: experiences } = await supabase
        .from("beyond_connect_experiences")
        .select("user_id, location")
        .in("user_id", filteredProfiles.map(p => p.id))
        .ilike("location", `%${locationLower}%`);

      if (experiences) {
        const usersWithLocation = new Set(experiences.map(e => e.user_id));
        filteredProfiles = filteredProfiles.filter(p => usersWithLocation.has(p.id));
      }
    }

    // Récupérer les statistiques pour chaque profil
    const userIds = filteredProfiles.map(p => p.id);
    const [expCounts, eduCounts, skillsCounts, badgesCounts] = await Promise.all([
      supabase.from("beyond_connect_experiences").select("user_id").in("user_id", userIds),
      supabase.from("beyond_connect_education").select("user_id").in("user_id", userIds),
      supabase.from("beyond_connect_skills").select("user_id").in("user_id", userIds),
      supabase.from("beyond_connect_user_badges").select("user_id").in("user_id", userIds),
    ]);

    const countsMap = new Map();
    userIds.forEach(userId => {
      countsMap.set(userId, {
        experiences_count: expCounts.data?.filter(e => e.user_id === userId).length || 0,
        education_count: eduCounts.data?.filter(e => e.user_id === userId).length || 0,
        skills_count: skillsCounts.data?.filter(s => s.user_id === userId).length || 0,
        badges_count: badgesCounts.data?.filter(b => b.user_id === userId).length || 0,
      });
    });

    // Construire la réponse avec les données de matching
    const candidates = filteredProfiles.map(profile => {
      const counts = countsMap.get(profile.id) || { experiences_count: 0, education_count: 0, skills_count: 0, badges_count: 0 };
      const match = matchesMap.get(profile.id);
      return {
        user_id: profile.id,
        email: profile.email,
        first_name: profile.first_name,
        last_name: profile.last_name,
        full_name: profile.full_name,
        avatar_url: profile.avatar_url,
        ...counts,
        match_score: match?.match_score,
        skills_match: match?.skills_match,
        experience_match: match?.experience_match,
        education_match: match?.education_match,
      };
    });

    // Trier par score de matching si disponible
    candidates.sort((a, b) => {
      if (a.match_score && b.match_score) {
        return b.match_score - a.match_score;
      }
      if (a.match_score) return -1;
      if (b.match_score) return 1;
      return 0;
    });

    return NextResponse.json({ candidates });
  } catch (error) {
    console.error("[beyond-connect/candidates/search] Error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

