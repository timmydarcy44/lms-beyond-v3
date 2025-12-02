import { NextRequest, NextResponse } from "next/server";
import { getServerClient, getServiceRoleClient } from "@/lib/supabase/server";
import { getSession } from "@/lib/auth/session";

/**
 * Upload de CV pour Beyond Connect
 * POST /api/beyond-connect/upload-cv
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    // Utiliser le service role client pour les uploads (bypass RLS)
    const supabaseService = getServiceRoleClient();
    const supabase = supabaseService || await getServerClient();
    
    if (!supabase) {
      return NextResponse.json({ error: "Supabase non configuré" }, { status: 500 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "Aucun fichier fourni" }, { status: 400 });
    }

    // Vérifier le type de fichier (PDF, DOC, DOCX)
    const allowedTypes = ["application/pdf", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: "Type de fichier non autorisé. Formats acceptés : PDF, DOC, DOCX" }, { status: 400 });
    }

    // Vérifier la taille (max 10 Mo)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: "Le fichier est trop volumineux. Taille maximale : 10 Mo" }, { status: 400 });
    }

    // Générer un nom de fichier unique
    const fileExt = file.name.split(".").pop();
    const fileName = `cv/${Date.now()}.${fileExt}`;
    const filePath = `${session.id}/${fileName}`;

    // Convertir le fichier en buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload vers Supabase Storage (bucket "Beyond Connect", "beyond-connect", "Public", "public", "uploads")
    const bucketsToTry = ["Beyond Connect", "beyond-connect", "Public", "public", "uploads"];
    let uploadResult = null;
    let bucketName = null;
    let lastError = null;

    console.log("[beyond-connect/upload-cv] Attempting upload to buckets:", bucketsToTry);

    for (const bucket of bucketsToTry) {
      console.log(`[beyond-connect/upload-cv] Trying bucket: ${bucket}`);
      uploadResult = await supabase.storage
        .from(bucket)
        .upload(filePath, buffer, {
          cacheControl: "3600",
          upsert: true, // Permet de remplacer un CV existant
          contentType: file.type,
        });

      if (!uploadResult.error) {
        bucketName = bucket;
        console.log(`[beyond-connect/upload-cv] Successfully uploaded to bucket: ${bucket}`);
        break;
      } else {
        lastError = uploadResult.error;
        console.log(`[beyond-connect/upload-cv] Failed to upload to ${bucket}:`, uploadResult.error.message);
      }
    }

    if (!bucketName || (uploadResult && uploadResult.error)) {
      console.error("[beyond-connect/upload-cv] Upload error:", lastError || uploadResult?.error);
      console.error("[beyond-connect/upload-cv] All buckets failed. Please verify bucket names in Supabase Storage.");
      return NextResponse.json({ 
        error: "Erreur lors de l'upload du CV. Vérifiez que les buckets 'Beyond Connect' ou 'Public' existent dans Supabase Storage et sont publics.",
        details: lastError?.message || uploadResult?.error?.message
      }, { status: 500 });
    }

    // Obtenir l'URL publique
    const { data: urlData } = supabase.storage.from(bucketName).getPublicUrl(filePath);

    // Mettre à jour le profil avec l'URL du CV
    const { error: updateError } = await supabase
      .from("profiles")
      .update({
        cv_url: urlData.publicUrl,
        cv_file_name: file.name,
        cv_uploaded_at: new Date().toISOString(),
      })
      .eq("id", session.id);

    if (updateError) {
      console.error("[beyond-connect/upload-cv] Update error:", updateError);
      return NextResponse.json({ error: "Erreur lors de la mise à jour du profil" }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      url: urlData.publicUrl,
      fileName: file.name,
    });
  } catch (error) {
    console.error("[beyond-connect/upload-cv] Error:", error);
    return NextResponse.json(
      { error: "Erreur lors de l'upload du CV" },
      { status: 500 }
    );
  }
}

