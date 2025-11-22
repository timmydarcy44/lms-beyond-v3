import { NextRequest, NextResponse } from "next/server";
import { getServerClient } from "@/lib/supabase/server";
import { calculateMatchScore } from "@/lib/beyond-connect/matching-algorithm";

/**
 * Calcule les matchings pour une offre d'emploi
 * POST /api/beyond-connect/matches/calculate
 * Body: { job_offer_id: string }
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await getServerClient();
    if (!supabase) {
      return NextResponse.json({ error: "Supabase non configuré" }, { status: 500 });
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const body = await request.json();
    const { job_offer_id } = body;

    if (!job_offer_id) {
      return NextResponse.json({ error: "job_offer_id est requis" }, { status: 400 });
    }

    // Récupérer l'offre d'emploi
    const { data: jobOffer, error: jobError } = await supabase
      .from("beyond_connect_job_offers")
      .select(`
        *,
        beyond_connect_companies(
          id,
          is_premium,
          organization_id
        )
      `)
      .eq("id", job_offer_id)
      .single();

    if (jobError || !jobOffer) {
      return NextResponse.json({ error: "Offre d'emploi non trouvée" }, { status: 404 });
    }

    // Vérifier que l'utilisateur a accès à cette entreprise
    const { data: membership } = await supabase
      .from("org_memberships")
      .select("role")
      .eq("user_id", user.id)
      .eq("org_id", jobOffer.beyond_connect_companies.organization_id)
      .in("role", ["admin", "instructor"])
      .single();

    if (!membership) {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    }

    if (jobError || !jobOffer) {
      return NextResponse.json({ error: "Offre d'emploi non trouvée ou accès refusé" }, { status: 404 });
    }

    // Vérifier que l'entreprise est premium
    const company = jobOffer.beyond_connect_companies as any;
    if (!company || !company.is_premium) {
      return NextResponse.json({ error: "Cette fonctionnalité est réservée aux entreprises premium" }, { status: 403 });
    }

    // Récupérer uniquement les utilisateurs BtoC (sans organisation)
    // Beyond Connect ne doit afficher que les clients BtoC (Beyond No School)
    const { data: b2cProfiles } = await supabase
      .from("profiles")
      .select("id")
      .in("role", ["learner", "student"])
      .limit(1000); // Limite de sécurité

    if (!b2cProfiles || b2cProfiles.length === 0) {
      return NextResponse.json({ matches: [] });
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
    const { data: profiles, error: profilesError } = await supabase
      .from("beyond_connect_profile_settings")
      .select("user_id")
      .eq("is_searchable", true)
      .in("user_id", b2cOnlyUserIds);

    if (profilesError) {
      console.error("[beyond-connect/matches] Error fetching profiles:", profilesError);
      return NextResponse.json({ error: profilesError.message }, { status: 500 });
    }

    // Si aucun paramètre de visibilité, utiliser tous les utilisateurs BtoC
    const userIds = profiles && profiles.length > 0 
      ? profiles.map(p => p.user_id)
      : b2cOnlyUserIds;

    if (userIds.length === 0) {
      return NextResponse.json({ matches: [] });
    }

    // Récupérer toutes les données des profils
    const [skillsData, experiencesData, educationData, certificationsData, badgesData, testResultsData] = await Promise.all([
      supabase.from("beyond_connect_skills").select("*").in("user_id", userIds),
      supabase.from("beyond_connect_experiences").select("*").in("user_id", userIds),
      supabase.from("beyond_connect_education").select("*").in("user_id", userIds),
      supabase.from("beyond_connect_certifications").select("*").in("user_id", userIds),
      supabase.from("beyond_connect_user_badges").select("*").in("user_id", userIds),
      supabase.from("beyond_connect_test_results").select("*").in("user_id", userIds),
    ]);

    // Grouper les données par utilisateur
    const userProfilesMap = new Map<string, any>();

    for (const userId of userIds) {
      userProfilesMap.set(userId, {
        userId,
        skills: [],
        experiences: [],
        education: [],
        certifications: [],
        badges: [],
        testResults: [],
      });
    }

    // Remplir les données
    if (skillsData.data) {
      for (const skill of skillsData.data) {
        const profile = userProfilesMap.get(skill.user_id);
        if (profile) profile.skills.push(skill);
      }
    }

    if (experiencesData.data) {
      for (const exp of experiencesData.data) {
        const profile = userProfilesMap.get(exp.user_id);
        if (profile) profile.experiences.push(exp);
      }
    }

    if (educationData.data) {
      for (const edu of educationData.data) {
        const profile = userProfilesMap.get(edu.user_id);
        if (profile) profile.education.push(edu);
      }
    }

    if (certificationsData.data) {
      for (const cert of certificationsData.data) {
        const profile = userProfilesMap.get(cert.user_id);
        if (profile) profile.certifications.push(cert);
      }
    }

    if (badgesData.data) {
      for (const badge of badgesData.data) {
        const profile = userProfilesMap.get(badge.user_id);
        if (profile) profile.badges.push(badge);
      }
    }

    if (testResultsData.data) {
      for (const test of testResultsData.data) {
        const profile = userProfilesMap.get(test.user_id);
        if (profile) profile.testResults.push(test);
      }
    }

    // Calculer les matchings
    const matches = [];
    const jobOfferForMatching: any = {
      id: jobOffer.id,
      required_skills: jobOffer.required_skills || [],
      required_experience: jobOffer.required_experience,
      required_education: jobOffer.required_education,
      contract_type: jobOffer.contract_type,
      location: jobOffer.location,
      remote_allowed: jobOffer.remote_allowed,
    };

    for (const [userId, userProfile] of userProfilesMap) {
      const matchResult = await calculateMatchScore(userProfile, jobOfferForMatching);

      // Ne garder que les matchings avec un score >= 50
      if (matchResult.match_score >= 50) {
        matches.push({
          user_id: userId,
          job_offer_id: job_offer_id,
          company_id: company.id,
          match_score: matchResult.match_score,
          skills_match: matchResult.skills_match,
          experience_match: matchResult.experience_match,
          education_match: matchResult.education_match,
          details: matchResult.details,
        });
      }
    }

    // Trier par score décroissant
    matches.sort((a, b) => b.match_score - a.match_score);

    // Sauvegarder les matchings dans la base de données
    if (matches.length > 0) {
      // Supprimer les anciens matchings pour cette offre
      await supabase
        .from("beyond_connect_matches")
        .delete()
        .eq("job_offer_id", job_offer_id);

      // Insérer les nouveaux matchings
      const { error: insertError } = await supabase
        .from("beyond_connect_matches")
        .insert(matches.map(m => ({
          user_id: m.user_id,
          job_offer_id: m.job_offer_id,
          company_id: m.company_id,
          match_score: m.match_score,
          skills_match: m.skills_match,
          experience_match: m.experience_match,
          education_match: m.education_match,
          details: m.details as any,
        })));

      if (insertError) {
        console.error("[beyond-connect/matches] Error saving matches:", insertError);
      }
    }

    return NextResponse.json({ matches, count: matches.length });
  } catch (error) {
    console.error("[beyond-connect/matches] Error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

