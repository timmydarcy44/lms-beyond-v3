import { NextRequest, NextResponse } from "next/server";
import { getServiceRoleClient } from "@/lib/supabase/server";
import { assertJessicaAdmin } from "@/lib/jessica-contentin/assert-jessica-admin";

export async function POST(request: NextRequest) {
  const user = await assertJessicaAdmin();
  if (!user) return NextResponse.json({ error: "Accès refusé" }, { status: 403 });

  const formData = await request.formData();
  const file = formData.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Aucun fichier fourni" }, { status: 400 });
  }

  if (!file.type.startsWith("image/")) {
    return NextResponse.json({ error: "Le fichier doit être une image" }, { status: 400 });
  }
  if (file.size > 5 * 1024 * 1024) {
    return NextResponse.json({ error: "L'image ne doit pas dépasser 5 Mo" }, { status: 400 });
  }

  const supabase = getServiceRoleClient();
  if (!supabase) return NextResponse.json({ error: "Service indisponible" }, { status: 503 });

  const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const fileName = `newsletter/${Date.now()}-${Math.random().toString(36).slice(2, 10)}.${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  const buckets = ["jessica contentin", "Public", "public"];
  let publicUrl: string | null = null;
  let lastError: string | null = null;

  for (const bucket of buckets) {
    const { error } = await supabase.storage.from(bucket).upload(fileName, buffer, {
      contentType: file.type,
      cacheControl: "3600",
      upsert: false,
    });
    if (!error) {
      const { data } = supabase.storage.from(bucket).getPublicUrl(fileName);
      publicUrl = data.publicUrl;
      break;
    }
    lastError = error.message;
  }

  if (!publicUrl) {
    return NextResponse.json(
      { error: lastError ?? "Upload impossible" },
      { status: 400 },
    );
  }

  return NextResponse.json({ url: publicUrl });
}
