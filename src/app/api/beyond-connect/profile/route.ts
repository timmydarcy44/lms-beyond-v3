import { NextRequest, NextResponse } from "next/server";
import { getServerClient } from "@/lib/supabase/server";

/**
 * Récupère ou met à jour le profil candidat
 * GET /api/beyond-connect/profile
 * PATCH /api/beyond-connect/profile
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

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    if (profileError) {
      return NextResponse.json({ error: "Profil non trouvé" }, { status: 404 });
    }

    return NextResponse.json({ profile });
  } catch (error) {
    console.error("[api/beyond-connect/profile] Error:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération du profil" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
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
    const {
      first_name,
      last_name,
      phone,
      email,
      school_class,
      soft_skills_scores,
      birth_date,
      bio,
      passions,
      current_studies,
      education_level,
      city,
      cv_url,
      cv_file_name,
      employment_type,
      avatar_url,
      type_profil,
      career_goal,
      career_goal_other,
    } = body;

    // Mettre à jour le profil
    const updateData: Record<string, unknown> = {};
    if (first_name !== undefined) updateData.first_name = first_name;
    if (last_name !== undefined) updateData.last_name = last_name;
    if (phone !== undefined) {
      updateData.phone = phone;
      updateData.telephone = phone;
    }
    if (email !== undefined && email !== null && String(email).trim() !== "") {
      updateData.email = String(email).trim();
    }
    if (school_class !== undefined) {
      updateData.school_class = school_class === null || school_class === "" ? null : String(school_class).trim();
    }
    if (soft_skills_scores !== undefined && soft_skills_scores !== null && typeof soft_skills_scores === "object") {
      updateData.soft_skills_scores = soft_skills_scores;
    }
    // Ne pas envoyer birth_date si c'est une chaîne vide
    if (birth_date !== undefined && birth_date !== null && birth_date !== "") {
      updateData.birth_date = birth_date;
    }
    if (bio !== undefined) updateData.bio = bio;
    if (passions !== undefined) updateData.passions = passions;
    if (current_studies !== undefined) updateData.current_studies = current_studies;
    if (education_level !== undefined) updateData.education_level = education_level;
    if (city !== undefined) updateData.city = city;
    if (cv_url !== undefined) updateData.cv_url = cv_url;
    if (cv_file_name !== undefined) updateData.cv_file_name = cv_file_name;
    if (employment_type !== undefined) updateData.employment_type = employment_type;
    if (avatar_url !== undefined) updateData.avatar_url = avatar_url;
    if (type_profil !== undefined) {
      const normalized = String(type_profil ?? "").trim().toLowerCase();
      updateData.type_profil = normalized || null;
    }
    if (career_goal !== undefined) {
      updateData.career_goal =
        career_goal === null || career_goal === "" ? null : String(career_goal).trim();
    }
    if (career_goal_other !== undefined) {
      updateData.career_goal_other =
        career_goal_other === null || career_goal_other === ""
          ? null
          : String(career_goal_other).trim();
    }

    // Mettre à jour full_name si first_name ou last_name changent
    if (first_name || last_name) {
      const { data: currentProfile } = await supabase
        .from("profiles")
        .select("first_name, last_name")
        .eq("id", user.id)
        .single();

      const newFirstName = first_name || currentProfile?.first_name || "";
      const newLastName = last_name || currentProfile?.last_name || "";
      updateData.full_name = `${newFirstName} ${newLastName}`.trim();
    }

    const { data: updatedProfile, error: updateError } = await supabase
      .from("profiles")
      .update(updateData)
      .eq("id", user.id)
      .select()
      .single();

    if (updateError) {
      console.error("[api/beyond-connect/profile] Update error:", updateError);
      return NextResponse.json({ error: "Erreur lors de la mise à jour" }, { status: 500 });
    }

    return NextResponse.json({ profile: updatedProfile });
  } catch (error) {
    console.error("[api/beyond-connect/profile] Error:", error);
    return NextResponse.json(
      { error: "Erreur lors de la mise à jour du profil" },
      { status: 500 }
    );
  }
}

