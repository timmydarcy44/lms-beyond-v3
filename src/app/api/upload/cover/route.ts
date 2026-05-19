import { NextRequest, NextResponse } from "next/server";
import { getServiceRoleClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const bucket = (formData.get("bucket") as string) || "Public";
    const folder = (formData.get("folder") as string) || "covers";

    if (!file) {
      return NextResponse.json(
        { error: "Aucun fichier fourni" },
        { status: 400 }
      );
    }

    console.log("Fichier reçu:", file.name, file.size);

    const isImage = file.type.startsWith("image/");
    const isMp4 = file.type === "video/mp4" || /\.mp4$/i.test(file.name);
    if (!isImage && !isMp4) {
      return NextResponse.json(
        { error: "Le fichier doit être une image ou une vidéo .mp4" },
        { status: 400 }
      );
    }

    const maxBytes = isMp4 ? 40 * 1024 * 1024 : 5 * 1024 * 1024;
    if (file.size > maxBytes) {
      return NextResponse.json(
        { error: isMp4 ? "La vidéo ne doit pas dépasser 40 Mo" : "L'image ne doit pas dépasser 5 Mo" },
        { status: 400 }
      );
    }

    const supabase = getServiceRoleClient();
    if (!supabase) {
      return NextResponse.json(
        {
          error: "Supabase non configuré",
          details: "Service role client indisponible (variables d'environnement manquantes ?)",
        },
        { status: 500 }
      );
    }

    // Générer un nom de fichier unique
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 15);
    const fileExtension = file.name.split(".").pop();
    const fileName = `${folder}/${timestamp}-${randomString}.${fileExtension}`;

    // Convertir le File en ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload vers Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(fileName, buffer, {
        contentType: file.type,
        cacheControl: "3600",
        upsert: false,
      });

    if (uploadError) {
      console.error("[upload/cover] Upload error:", {
        bucket,
        folder,
        fileName,
        fileType: file.type,
        fileSize: file.size,
        code: (uploadError as any)?.code,
        message: (uploadError as any)?.message,
        details: (uploadError as any)?.details,
        hint: (uploadError as any)?.hint,
        raw: uploadError,
      });
      return NextResponse.json(
        { error: uploadError.message, code: (uploadError as any)?.code, hint: (uploadError as any)?.hint },
        { status: 500 }
      );
    }

    // Récupérer l'URL publique
    const {
      data: { publicUrl },
    } = supabase.storage.from(bucket).getPublicUrl(fileName);

    return NextResponse.json({
      url: publicUrl,
      fileName: uploadData.path,
    });
  } catch (error) {
    console.error("[upload/cover] Error:", {
      message: (error as any)?.message,
      stack: (error as any)?.stack,
      raw: error,
    });
    return NextResponse.json(
      { error: "Erreur lors de l'upload", details: (error as any)?.message ?? String(error) },
      { status: 500 }
    );
  }
}

