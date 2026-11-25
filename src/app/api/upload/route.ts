import { NextRequest, NextResponse } from "next/server";
import { getServerClient, getServiceRoleClient } from "@/lib/supabase/server";

const BUCKETS = ["Public", "public", "avatars"] as const;

export async function POST(request: NextRequest) {
  try {
    const supabase = await getServerClient();
    if (!supabase) {
      return NextResponse.json({ error: "Supabase non configuré" }, { status: 500 });
    }

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const folder = (formData.get("folder") as string) || "uploads";

    if (!file || !(file instanceof File) || file.size <= 0) {
      return NextResponse.json({ error: "Aucun fichier fourni" }, { status: 400 });
    }
    if (file.size > 25 * 1024 * 1024) {
      return NextResponse.json({ error: "Fichier trop volumineux (max 25 Mo)" }, { status: 400 });
    }

    const storage = getServiceRoleClient() ?? supabase;
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 15);
    const fileExtension = file.name.split(".").pop() || "bin";
    const fileName = `${folder}/${user.id}/${timestamp}-${randomString}.${fileExtension}`;
    const buffer = Buffer.from(await file.arrayBuffer());

    let bucketName: string | null = null;
    let lastError: string | null = null;

    for (const bucket of BUCKETS) {
      const { error } = await storage.storage.from(bucket).upload(fileName, buffer, {
        cacheControl: "3600",
        upsert: false,
        contentType: file.type || undefined,
      });
      if (!error) {
        bucketName = bucket;
        break;
      }
      lastError = error.message;
      if (!/bucket not found|not found/i.test(error.message)) break;
    }

    if (!bucketName) {
      console.error("[api/upload] Erreur upload:", lastError);
      return NextResponse.json(
        { error: lastError || "Espace de stockage indisponible" },
        { status: 502 },
      );
    }

    const { data: urlData } = storage.storage.from(bucketName).getPublicUrl(fileName);
    return NextResponse.json({
      url: urlData.publicUrl,
      path: fileName,
      bucket: bucketName,
    });
  } catch (error) {
    console.error("[api/upload] Erreur:", error);
    return NextResponse.json(
      {
        error: "Erreur serveur",
        details: error instanceof Error ? error.message : "Erreur inconnue",
      },
      { status: 500 },
    );
  }
}
