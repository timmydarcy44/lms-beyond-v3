import { NextRequest, NextResponse } from "next/server";
import { getServerClient, getServiceRoleClient } from "@/lib/supabase/server";

/**
 * Upload d'une photo de profil
 * POST /api/upload/avatar
 */
export async function POST(request: NextRequest) {
  try {
    // Utiliser le service role client pour les uploads (bypass RLS)
    const supabaseService = getServiceRoleClient();
    const supabase = supabaseService || await getServerClient();
    
    if (!supabase) {
      return NextResponse.json({ error: "Supabase non configuré" }, { status: 500 });
    }

    // Vérifier l'authentification avec le client normal
    const supabaseAuth = await getServerClient();
    if (!supabaseAuth) {
      return NextResponse.json({ error: "Supabase non configuré" }, { status: 500 });
    }

    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "Aucun fichier fourni" }, { status: 400 });
    }

    // Vérifier le type de fichier
    if (!file.type.startsWith("image/")) {
      return NextResponse.json({ error: "Le fichier doit être une image" }, { status: 400 });
    }

    // Vérifier la taille (5 Mo max)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: "L'image doit faire moins de 5 Mo" }, { status: 400 });
    }

    // Convertir le fichier en buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Générer un nom de fichier unique
    const fileExt = file.name.split(".").pop();
    const fileName = `${user.id}-${Date.now()}.${fileExt}`;
    const filePath = `${user.id}/${fileName}`;

    // Essayer plusieurs buckets (Public, Avatar, public, avatars, uploads)
    const bucketsToTry = ["Public", "Avatar", "public", "avatars", "uploads"];
    let uploadResult = null;
    let bucketName = null;
    let lastError = null;

    console.log("[upload/avatar] Attempting upload to buckets:", bucketsToTry);

    for (const bucket of bucketsToTry) {
      console.log(`[upload/avatar] Trying bucket: ${bucket}`);
      uploadResult = await supabase.storage
        .from(bucket)
        .upload(filePath, buffer, {
          contentType: file.type,
          upsert: true,
        });

      if (!uploadResult.error) {
        bucketName = bucket;
        console.log(`[upload/avatar] Successfully uploaded to bucket: ${bucket}`);
        break;
      } else {
        lastError = uploadResult.error;
        console.log(`[upload/avatar] Failed to upload to ${bucket}:`, uploadResult.error.message);
      }
    }

    if (!bucketName || (uploadResult && uploadResult.error)) {
      console.error("[upload/avatar] Upload error:", lastError || uploadResult?.error);
      console.error("[upload/avatar] All buckets failed. Please verify bucket names in Supabase Storage.");
      return NextResponse.json({ 
        error: "Erreur lors de l'upload. Vérifiez que les buckets 'Public', 'Avatar' existent dans Supabase Storage et sont publics.",
        details: lastError?.message || uploadResult?.error?.message
      }, { status: 500 });
    }

    // Récupérer l'URL publique
    const { data: urlData } = supabase.storage.from(bucketName).getPublicUrl(filePath);

    // Mettre à jour le profil avec l'URL de l'avatar
    const { error: updateError } = await supabase
      .from("profiles")
      .update({ avatar_url: urlData.publicUrl })
      .eq("id", user.id);

    if (updateError) {
      console.error("[upload/avatar] Update error:", updateError);
      // On retourne quand même l'URL même si la mise à jour a échoué
    }

    return NextResponse.json({ url: urlData.publicUrl });
  } catch (error) {
    console.error("[upload/avatar] Error:", error);
    return NextResponse.json({ error: "Erreur lors de l'upload" }, { status: 500 });
  }
}

