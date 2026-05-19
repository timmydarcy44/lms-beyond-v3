import { NextRequest, NextResponse } from "next/server";
import { getServiceRoleClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const bucket = (formData.get("bucket") as string) || "Public";
    const folder = (formData.get("folder") as string) || "pitches";

    if (!file) return NextResponse.json({ error: "Aucun fichier fourni" }, { status: 400 });

    const isVideo = file.type.startsWith("video/");
    if (!isVideo) return NextResponse.json({ error: "Le fichier doit être une vidéo" }, { status: 400 });

    // 80MB max (pitch)
    if (file.size > 80 * 1024 * 1024) {
      return NextResponse.json({ error: "La vidéo ne doit pas dépasser 80 Mo" }, { status: 400 });
    }

    const supabase = getServiceRoleClient();
    if (!supabase) {
      return NextResponse.json(
        { error: "Supabase non configuré", details: "Service role client indisponible" },
        { status: 500 },
      );
    }

    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 15);
    const fileExtension = (file.name.split(".").pop() || "webm").toLowerCase();
    const fileName = `${folder}/${timestamp}-${randomString}.${fileExtension}`;

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const { data: uploadData, error: uploadError } = await supabase.storage.from(bucket).upload(fileName, buffer, {
      contentType: file.type,
      cacheControl: "3600",
      upsert: false,
    });

    if (uploadError) {
      return NextResponse.json({ error: uploadError.message }, { status: 500 });
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from(bucket).getPublicUrl(fileName);

    return NextResponse.json({ url: publicUrl, fileName: uploadData.path });
  } catch (e) {
    console.error("[upload-video]", e);
    return NextResponse.json({ error: "Erreur lors de l'upload" }, { status: 500 });
  }
}
