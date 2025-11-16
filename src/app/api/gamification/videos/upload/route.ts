import { NextRequest, NextResponse } from "next/server";
import { getServerClient } from "@/lib/supabase/server";
import { getServiceRoleClientOrFallback } from "@/lib/supabase/server";

/**
 * POST - Upload une vidéo de gamification vers Supabase Storage
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

    const formData = await request.formData();
    const file = formData.get("file") as File;
    const videoType = formData.get("video_type") as string || "other";
    const title = formData.get("title") as string || file?.name || "Vidéo sans titre";
    const description = formData.get("description") as string || null;
    const scenarioContext = formData.get("scenario_context") as string || "media-training-psg";

    if (!file) {
      return NextResponse.json({ error: "Aucun fichier fourni" }, { status: 400 });
    }

    // Vérifier que c'est une vidéo
    if (!file.type.startsWith("video/")) {
      return NextResponse.json({ error: "Le fichier doit être une vidéo" }, { status: 400 });
    }

    // Vérifier la taille (max 100MB par défaut)
    const maxSize = 100 * 1024 * 1024; // 100MB
    if (file.size > maxSize) {
      return NextResponse.json({ error: "La vidéo est trop volumineuse (max 100MB)" }, { status: 400 });
    }

    // Générer un nom de fichier unique
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 15);
    const fileExtension = file.name.split('.').pop() || 'mp4';
    const fileName = `${videoType}/${timestamp}-${randomString}.${fileExtension}`;

    // Upload vers Supabase Storage
    const bucketName = "gamification-videos";
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(bucketName)
      .upload(fileName, file, {
        cacheControl: "3600",
        upsert: false,
        contentType: file.type,
      });

    if (uploadError) {
      console.error("[gamification/videos/upload] Erreur upload:", uploadError);
      
      // Si le bucket n'existe pas, retourner une erreur explicite
      if (uploadError.message?.includes("Bucket not found") || uploadError.message?.includes("not found")) {
        return NextResponse.json({ 
          error: "Le bucket 'gamification-videos' n'existe pas. Veuillez le créer dans Supabase Dashboard > Storage.",
          details: uploadError.message
        }, { status: 404 });
      }
      
      return NextResponse.json({ 
        error: "Erreur lors de l'upload",
        details: uploadError.message
      }, { status: 500 });
    }

    // Récupérer l'URL publique
    const { data: urlData } = supabase.storage
      .from(bucketName)
      .getPublicUrl(fileName);

    // Enregistrer les métadonnées dans la table
    console.log("[gamification/videos/upload] Inserting video record:", {
      title,
      video_type: videoType,
      storage_path: fileName,
      public_url: urlData.publicUrl,
      scenario_context: scenarioContext,
    });
    
    const { data: videoRecord, error: dbError } = await supabase
      .from("gamification_videos")
      .insert({
        title,
        description,
        video_type: videoType,
        storage_path: fileName,
        storage_bucket: bucketName,
        public_url: urlData.publicUrl,
        file_size_bytes: file.size,
        mime_type: file.type,
        scenario_context: scenarioContext,
        created_by: user.id,
      })
      .select()
      .single();

    if (dbError) {
      console.error("[gamification/videos/upload] Erreur DB:", dbError);
      console.error("[gamification/videos/upload] DB Error details:", JSON.stringify(dbError, null, 2));
      
      // Si la table n'existe pas, donner des instructions
      if (dbError.message?.includes("does not exist") || dbError.code === "42P01") {
        return NextResponse.json({ 
          error: "La table 'gamification_videos' n'existe pas. Veuillez exécuter CREATE_GAMIFICATION_VIDEOS_TABLE.sql",
          url: urlData.publicUrl,
          path: fileName,
          dbError: dbError.message
        }, { status: 500 });
      }
      
      // L'upload a réussi mais l'enregistrement DB a échoué
      // On retourne quand même l'URL de la vidéo
      return NextResponse.json({ 
        url: urlData.publicUrl,
        path: fileName,
        warning: "Vidéo uploadée mais métadonnées non enregistrées",
        dbError: dbError.message
      });
    }
    
    console.log("[gamification/videos/upload] Video record created:", videoRecord);

    return NextResponse.json({ 
      id: videoRecord.id,
      url: urlData.publicUrl,
      path: fileName,
      video: videoRecord
    });
  } catch (error) {
    console.error("[gamification/videos/upload] Erreur:", error);
    return NextResponse.json({ 
      error: "Erreur serveur",
      details: error instanceof Error ? error.message : "Erreur inconnue"
    }, { status: 500 });
  }
}

