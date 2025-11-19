import { NextRequest, NextResponse } from "next/server";
import { getServerClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const supabase = await getServerClient();
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
    const folder = formData.get("folder") as string || "uploads";

    if (!file) {
      return NextResponse.json({ error: "Aucun fichier fourni" }, { status: 400 });
    }

    // Générer un nom de fichier unique
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 15);
    const fileExtension = file.name.split('.').pop();
    const fileName = `${folder}/${timestamp}-${randomString}.${fileExtension}`;

    // Upload vers Supabase Storage - essayer plusieurs buckets
    const bucketsToTry = ["public", "uploads", "files"];
    let uploadResult = null;
    let bucketName = null;
    let uploadError = null;

    for (const bucket of bucketsToTry) {
      uploadResult = await supabase.storage
        .from(bucket)
        .upload(fileName, file, {
          cacheControl: "3600",
          upsert: false,
        });

      if (!uploadResult.error) {
        bucketName = bucket;
        break;
      } else {
        uploadError = uploadResult.error;
        // Si l'erreur n'est pas "Bucket not found", arrêter la boucle
        if (!uploadError.message?.includes("Bucket not found") && !uploadError.message?.includes("not found")) {
          break;
        }
      }
    }

    if (!bucketName || (uploadResult && uploadResult.error)) {
      console.error("[api/upload] Erreur upload:", uploadError || uploadResult?.error);
      
      // Si aucun bucket n'est disponible, convertir l'image en base64 comme fallback
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const base64Image = `data:${file.type};base64,${buffer.toString('base64')}`;
      
      return NextResponse.json({ 
        url: base64Image,
        path: fileName,
        warning: "Image sauvegardée en base64 (bucket storage non disponible)"
      });
    }

    // Récupérer l'URL publique
    const { data: urlData } = supabase.storage
      .from(bucketName)
      .getPublicUrl(fileName);

    return NextResponse.json({ 
      url: urlData.publicUrl,
      path: fileName 
    });
  } catch (error) {
    console.error("[api/upload] Erreur:", error);
    return NextResponse.json({ 
      error: "Erreur serveur",
      details: error instanceof Error ? error.message : "Erreur inconnue"
    }, { status: 500 });
  }
}

