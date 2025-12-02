import { NextRequest, NextResponse } from "next/server";
import { getServerClient } from "@/lib/supabase/server";
import { calculateMatchScore } from "@/lib/beyond-connect/matching-algorithm";

/**
 * Récupère les offres d'emploi correspondantes au profil du candidat
 * GET /api/beyond-connect/job-offers/matched
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

    // Récupérer toutes les offres actives
    const { data: jobOffers, error: jobOffersError } = await supabase
      .from("beyond_connect_job_offers")
      .select(`
        *,
        beyond_connect_companies(
          id,
          name,
          logo_url
        )
      `)
      .eq("is_active", true)
      .order("created_at", { ascending: false })
      .limit(50);

    if (jobOffersError) {
      console.error("[beyond-connect/job-offers/matched] Error fetching job offers:", jobOffersError);
      return NextResponse.json({ error: jobOffersError.message }, { status: 500 });
    }

    if (!jobOffers || jobOffers.length === 0) {
      return NextResponse.json({ jobOffers: [] });
    }

    // Récupérer le profil du candidat avec toutes ses données
    const [skillsRes, experiencesRes, educationRes, certificationsRes, badgesRes, testResultsRes] = await Promise.all([
      supabase.from("beyond_connect_skills").select("*").eq("user_id", user.id),
      supabase.from("beyond_connect_experiences").select("*").eq("user_id", user.id),
      supabase.from("beyond_connect_education").select("*").eq("user_id", user.id),
      supabase.from("beyond_connect_certifications").select("*").eq("user_id", user.id),
      supabase.from("beyond_connect_badges").select("*").eq("user_id", user.id),
      supabase.from("beyond_connect_test_results").select("*").eq("user_id", user.id),
    ]);

    const userProfile = {
      skills: skillsRes.data || [],
      experiences: experiencesRes.data || [],
      education: educationRes.data || [],
      certifications: certificationsRes.data || [],
      badges: badgesRes.data || [],
      testResults: testResultsRes.data || [],
    };

    // Calculer le score de matching pour chaque offre
    const matchedOffers = await Promise.all(
      jobOffers.map(async (jobOffer: any) => {
        try {
          // Normaliser company : convertir beyond_connect_companies (tableau) en company (objet)
          let company = jobOffer.company;
          if (!company && jobOffer.beyond_connect_companies && Array.isArray(jobOffer.beyond_connect_companies) && jobOffer.beyond_connect_companies.length > 0) {
            company = jobOffer.beyond_connect_companies[0];
          }

          const matchResult = await calculateMatchScore(
            {
              userId: user.id,
              skills: userProfile.skills,
              experiences: userProfile.experiences,
              education: userProfile.education,
              certifications: userProfile.certifications,
              badges: userProfile.badges,
              testResults: userProfile.testResults,
            },
            {
              id: jobOffer.id,
              required_skills: jobOffer.required_skills || [],
              required_experience: jobOffer.required_experience,
              required_education: jobOffer.required_education,
              contract_type: jobOffer.contract_type || "",
              location: jobOffer.location,
              remote_allowed: jobOffer.remote_allowed,
            }
          );

          return {
            ...jobOffer,
            company: company || { id: "", name: "Entreprise non spécifiée", logo_url: undefined },
            match_score: matchResult.match_score,
            match_details: matchResult,
          };
        } catch (error) {
          console.error(`[beyond-connect/job-offers/matched] Error calculating match for job ${jobOffer.id}:`, error);
          // Normaliser company même en cas d'erreur
          let company = jobOffer.company;
          if (!company && jobOffer.beyond_connect_companies && Array.isArray(jobOffer.beyond_connect_companies) && jobOffer.beyond_connect_companies.length > 0) {
            company = jobOffer.beyond_connect_companies[0];
          }
          return {
            ...jobOffer,
            company: company || { id: "", name: "Entreprise non spécifiée", logo_url: undefined },
            match_score: 0,
          };
        }
      })
    );

    // Trier par score de matching décroissant et ne garder que celles avec un score > 0
    const sortedMatchedOffers = matchedOffers
      .filter((offer: any) => offer.match_score > 0)
      .sort((a: any, b: any) => b.match_score - a.match_score)
      .slice(0, 20); // Limiter à 20 offres

    return NextResponse.json({ jobOffers: sortedMatchedOffers });
  } catch (error) {
    console.error("[beyond-connect/job-offers/matched] Error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

