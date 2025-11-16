import { NextRequest, NextResponse } from "next/server";
import { getServiceRoleClientOrFallback } from "@/lib/supabase/server";

/**
 * POST - Synchronise une vidéo existante dans Storage avec la table gamification_videos
 * Utile si une vidéo a été uploadée directement dans Storage sans passer par l'API
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await getServiceRoleClientOrFallback();
    if (!supabase) {
      return NextResponse.json({ error: "Supabase non configuré" }, { status: 500 });
    }

    // Vérifier l'authentification
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const body = await request.json();
    const { storage_path, video_type, title, description, scenario_context } = body;

    if (!storage_path || !video_type) {
      return NextResponse.json({ 
        error: "storage_path et video_type sont requis" 
      }, { status: 400 });
    }

    const bucketName = "gamification-videos";
    
    // Récupérer l'URL publique
    const { data: urlData } = supabase.storage
      .from(bucketName)
      .getPublicUrl(storage_path);
    
    console.log("[gamification/videos/sync] Generated public URL:", urlData.publicUrl);
    
    // S'assurer que l'URL est correcte (vérifier qu'elle ne contient pas de placeholder)
    if (urlData.publicUrl.includes('your_supabase_project_id') || urlData.publicUrl.includes('YOUR_SUPABASE_PROJECT_ID')) {
      console.error("[gamification/videos/sync] Invalid Supabase URL in environment variables");
      return NextResponse.json({ 
        error: "Configuration Supabase incorrecte. Vérifiez NEXT_PUBLIC_SUPABASE_URL dans vos variables d'environnement.",
        details: "L'URL générée contient un placeholder au lieu du vrai project ID"
      }, { status: 500 });
    }

    // Vérifier si la vidéo existe déjà dans la table
    const { data: existing } = await supabase
      .from("gamification_videos")
      .select("id")
      .eq("storage_path", storage_path)
      .single();

    if (existing) {
      return NextResponse.json({ 
        message: "La vidéo existe déjà dans la table",
        video: existing
      });
    }

    // Insérer dans la table
    const { data: videoRecord, error: dbError } = await supabase
      .from("gamification_videos")
      .insert({
        title: title || storage_path,
        description: description || null,
        video_type: video_type,
        storage_path: storage_path,
        storage_bucket: bucketName,
        public_url: urlData.publicUrl,
        scenario_context: scenario_context || "media-training-psg",
        created_by: user.id,
        is_active: true,
      })
      .select()
      .single();

    if (dbError) {
      console.error("[gamification/videos/sync] Erreur DB:", dbError);
      return NextResponse.json({ 
        error: "Erreur lors de l'enregistrement",
        details: dbError.message
      }, { status: 500 });
    }

    return NextResponse.json({ 
      message: "Vidéo synchronisée avec succès",
      video: videoRecord
    });
  } catch (error) {
    console.error("[gamification/videos/sync] Erreur:", error);
    return NextResponse.json({ 
      error: "Erreur serveur",
      details: error instanceof Error ? error.message : "Erreur inconnue"
    }, { status: 500 });
  }
}

