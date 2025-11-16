import { NextRequest, NextResponse } from "next/server";
import { isSuperAdmin } from "@/lib/auth/super-admin";
import { getServerClient } from "@/lib/supabase/server";

/**
 * Route pour gérer les prompts IA (GET pour récupérer tous les prompts, PUT pour sauvegarder)
 */
export async function GET(request: NextRequest) {
  try {
    const hasAccess = await isSuperAdmin();
    if (!hasAccess) {
      return NextResponse.json({ error: "Accès non autorisé" }, { status: 403 });
    }

    const supabase = await getServerClient();
    if (!supabase) {
      return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
    }

    const { searchParams } = new URL(request.url);
    const featureId = searchParams.get("featureId");

    if (featureId) {
      // Récupérer un prompt spécifique
      const { data, error } = await supabase
        .from("ai_prompts")
        .select("*")
        .eq("feature_id", featureId)
        .single();

      if (error) {
        console.error("[super-admin/ai/prompts] Error fetching prompt:", error);
        return NextResponse.json({ error: "Erreur lors de la récupération" }, { status: 500 });
      }

      return NextResponse.json({ success: true, prompt: data });
    } else {
      // Récupérer tous les prompts
      const { data, error } = await supabase
        .from("ai_prompts")
        .select("*")
        .order("feature_name");

      if (error) {
        console.error("[super-admin/ai/prompts] Error fetching prompts:", error);
        return NextResponse.json({ error: "Erreur lors de la récupération" }, { status: 500 });
      }

      return NextResponse.json({ success: true, prompts: data || [] });
    }
  } catch (error) {
    console.error("[super-admin/ai/prompts] Error:", error);
    return NextResponse.json({ error: "Une erreur est survenue" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const hasAccess = await isSuperAdmin();
    if (!hasAccess) {
      return NextResponse.json({ error: "Accès non autorisé" }, { status: 403 });
    }

    const supabase = await getServerClient();
    if (!supabase) {
      return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
    }

    const { data: authData } = await supabase.auth.getUser();
    if (!authData?.user?.id) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const body = await request.json();
    const { featureId, prompt, promptLocation, featureName, endpoint, description } = body;

    if (!featureId || !prompt) {
      return NextResponse.json(
        { error: "featureId et prompt requis" },
        { status: 400 }
      );
    }

    // Vérifier si le prompt existe déjà
    const { data: existing } = await supabase
      .from("ai_prompts")
      .select("id")
      .eq("feature_id", featureId)
      .single();

    if (existing) {
      // Mettre à jour le prompt existant
      const { error: updateError } = await supabase
        .from("ai_prompts")
        .update({
          prompt_template: prompt,
          prompt_location: promptLocation || existing.prompt_location,
          feature_name: featureName || existing.feature_name,
          endpoint: endpoint || existing.endpoint,
          description: description || existing.description,
          updated_by: authData.user.id,
          updated_at: new Date().toISOString(),
        })
        .eq("feature_id", featureId);

      if (updateError) {
        console.error("[super-admin/ai/prompts] Error updating prompt:", updateError);
        return NextResponse.json({ error: "Erreur lors de la mise à jour" }, { status: 500 });
      }

      return NextResponse.json({
        success: true,
        message: "Prompt mis à jour avec succès",
        featureId,
      });
    } else {
      // Créer un nouveau prompt
      const { error: insertError } = await supabase
        .from("ai_prompts")
        .insert({
          feature_id: featureId,
          feature_name: featureName || featureId,
          prompt_template: prompt,
          prompt_location: promptLocation || "",
          endpoint: endpoint || "",
          description: description || "",
          updated_by: authData.user.id,
        });

      if (insertError) {
        console.error("[super-admin/ai/prompts] Error inserting prompt:", insertError);
        return NextResponse.json({ error: "Erreur lors de la création" }, { status: 500 });
      }

      return NextResponse.json({
        success: true,
        message: "Prompt créé avec succès",
        featureId,
      });
    }
  } catch (error) {
    console.error("[super-admin/ai/prompts] Error:", error);
    return NextResponse.json({ error: "Une erreur est survenue" }, { status: 500 });
  }
}

