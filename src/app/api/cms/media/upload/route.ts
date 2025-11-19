import { NextRequest, NextResponse } from "next/server";
import { getServerClient } from "@/lib/supabase/server";
import { getSession } from "@/lib/auth/session";
import { isSuperAdmin } from "@/lib/auth/super-admin";

export async function POST(request: NextRequest) {
  try {
    const hasAccess = await isSuperAdmin();
    if (!hasAccess) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const session = await getSession();
    if (!session?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File;
    const type = formData.get("type") as string;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (type !== "image" && type !== "video") {
      return NextResponse.json(
        { error: "Invalid type. Must be 'image' or 'video'" },
        { status: 400 }
      );
    }

    // Validation du type de fichier
    if (type === "image" && !file.type.startsWith("image/")) {
      return NextResponse.json(
        { error: "File must be an image" },
        { status: 400 }
      );
    }

    if (type === "video" && !file.type.startsWith("video/")) {
      return NextResponse.json(
        { error: "File must be a video" },
        { status: 400 }
      );
    }

    const supabase = await getServerClient();
    if (!supabase) {
      return NextResponse.json({ error: "Service indisponible" }, { status: 503 });
    }

    // Générer un nom de fichier unique
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 15);
    const fileExt = file.name.split(".").pop();
    const fileName = `${timestamp}-${randomString}.${fileExt}`;
    const filePath = `cms/${type}s/${fileName}`;

    // Upload vers Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("public")
      .upload(filePath, file, {
        cacheControl: "3600",
        upsert: false,
      });

    if (uploadError) {
      console.error("[cms/media] Error uploading file:", uploadError);
      return NextResponse.json(
        { error: uploadError.message },
        { status: 500 }
      );
    }

    // Récupérer l'URL publique
    const {
      data: { publicUrl },
    } = supabase.storage.from("public").getPublicUrl(filePath);

    // Extraire les métadonnées
    let metadata: {
      width?: number;
      height?: number;
      alt?: string;
    } = {};

    if (type === "image") {
      // Pour les images, on peut extraire width/height via une image HTML
      // Pour l'instant, on stocke juste le nom du fichier
      metadata.alt = file.name;
    }

    // Enregistrer dans la table cms_media
    const { data: mediaData, error: mediaError } = await supabase
      .from("cms_media")
      .insert({
        filename: file.name,
        file_path: filePath,
        file_type: type,
        mime_type: file.type,
        file_size: file.size,
        created_by: session.id,
      })
      .select()
      .single();

    if (mediaError) {
      console.error("[cms/media] Error saving media record:", mediaError);
      // On continue quand même, l'upload a réussi
    }

    return NextResponse.json({
      url: publicUrl,
      metadata,
      mediaId: mediaData?.id,
    });
  } catch (error) {
    console.error("[cms/media] Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}




