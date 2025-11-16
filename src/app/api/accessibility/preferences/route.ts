import { NextRequest, NextResponse } from "next/server";
import { getServerClient } from "@/lib/supabase/server";

const DEFAULT_CONFUSING_LETTERS = ["b", "d", "p", "q", "m", "n", "u"];

/**
 * GET - Récupère les préférences d'accessibilité de l'utilisateur
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await getServerClient();
    if (!supabase) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const { data: authData } = await supabase.auth.getUser();
    if (!authData?.user?.id) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const userId = authData.user.id;

    // Récupérer les préférences existantes
    const { data, error } = await supabase
      .from("user_accessibility_preferences")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();

    if (error) {
      console.error("[accessibility] Error fetching preferences:", error);
      return NextResponse.json({ error: "Erreur lors de la récupération" }, { status: 500 });
    }

    // Si aucune préférence n'existe, retourner des valeurs par défaut
    if (!data) {
      return NextResponse.json({
        dyslexia_mode_enabled: false,
        letter_spacing: 0.15,
        line_height: 2.0,
        word_spacing: 0.3,
        font_family: "OpenDyslexic",
        contrast_level: "normal",
        highlight_confusing_letters: true,
        underline_complex_sounds: true,
        confusing_letters: DEFAULT_CONFUSING_LETTERS,
      });
    }

    return NextResponse.json({
      ...data,
      confusing_letters: Array.isArray((data as any).confusing_letters) && (data as any).confusing_letters.length
        ? (data as any).confusing_letters
        : DEFAULT_CONFUSING_LETTERS,
    });
  } catch (error) {
    console.error("[accessibility] Unexpected error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

/**
 * PUT - Met à jour les préférences d'accessibilité de l'utilisateur
 */
export async function PUT(request: NextRequest) {
  try {
    const supabase = await getServerClient();
    if (!supabase) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const { data: authData } = await supabase.auth.getUser();
    if (!authData?.user?.id) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const userId = authData.user.id;
    const body = await request.json();

    // Vérifier si des préférences existent déjà
    const { data: existing } = await supabase
      .from("user_accessibility_preferences")
      .select("id")
      .eq("user_id", userId)
      .maybeSingle();

    const preferences = {
      user_id: userId,
      dyslexia_mode_enabled: body.dyslexia_mode_enabled ?? false,
      letter_spacing: body.letter_spacing ?? 0.15,
      line_height: body.line_height ?? 2.0,
      word_spacing: body.word_spacing ?? 0.3,
      font_family: body.font_family ?? "OpenDyslexic",
      contrast_level: body.contrast_level ?? "normal",
      highlight_confusing_letters: body.highlight_confusing_letters ?? true,
      underline_complex_sounds: body.underline_complex_sounds ?? true,
    };

    let result;
    if (existing) {
      // Mise à jour
      const { data, error } = await supabase
        .from("user_accessibility_preferences")
        .update(preferences)
        .eq("user_id", userId)
        .select()
        .single();

      if (error) throw error;
      result = data;
    } else {
      // Insertion
      const { data, error } = await supabase
        .from("user_accessibility_preferences")
        .insert(preferences)
        .select()
        .single();

      if (error) throw error;
      result = data;
    }

    return NextResponse.json({
      ...result,
      confusing_letters:
        Array.isArray((result as any).confusing_letters) && (result as any).confusing_letters.length
          ? (result as any).confusing_letters
          : DEFAULT_CONFUSING_LETTERS,
    });
  } catch (error) {
    console.error("[accessibility] Error updating preferences:", error);
    return NextResponse.json({ error: "Erreur lors de la sauvegarde" }, { status: 500 });
  }
}


