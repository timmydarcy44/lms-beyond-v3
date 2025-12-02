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
    const { first_name, last_name, phone, birth_date, bio, passions, current_studies, education_level, city, cv_url, cv_file_name, employment_type } = body;

    // Mettre à jour le profil
    const updateData: any = {};
    if (first_name !== undefined) updateData.first_name = first_name;
    if (last_name !== undefined) updateData.last_name = last_name;
    if (phone !== undefined) updateData.phone = phone;
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

