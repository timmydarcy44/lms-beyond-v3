import { NextRequest, NextResponse } from "next/server";
import { requireEarnerSession } from "@/lib/auth/earner-session";
import { getServiceRoleClient } from "@/lib/supabase/server";

type RouteParams = { params: Promise<{ badgeClassId: string }> };

export async function POST(request: NextRequest, { params }: RouteParams) {
  const { badgeClassId } = await params;
  const session = await requireEarnerSession(request);
  if (!session.ok) {
    return NextResponse.json({ error: "Session requise." }, { status: 401 });
  }

  const form = await request.formData();
  const file = form.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return NextResponse.json({ error: "Fichier manquant." }, { status: 400 });
  }
  if (file.size > 80 * 1024 * 1024) {
    return NextResponse.json({ error: "La vidéo dépasse 80 Mo." }, { status: 413 });
  }

  const supabase = getServiceRoleClient();
  if (!supabase) {
    return NextResponse.json({ error: "Stockage indisponible." }, { status: 503 });
  }

  const safeName = file.name.replace(/[^\w.\-]+/g, "-").slice(0, 80);
  const path = `${session.user.id}/${badgeClassId}/${Date.now()}-${safeName}`;
  const buffer = Buffer.from(await file.arrayBuffer());
  const { error } = await supabase.storage.from("badge-submissions").upload(path, buffer, {
    contentType: file.type || "application/octet-stream",
    upsert: false,
  });
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 502 });
  }

  let transcript = "";
  const key = process.env.OPENAI_API_KEY?.trim();
  if (key) {
    try {
      const body = new FormData();
      body.append("file", new File([buffer], safeName, { type: file.type || "video/webm" }));
      body.append("model", "whisper-1");
      body.append("language", "fr");
      const response = await fetch("https://api.openai.com/v1/audio/transcriptions", {
        method: "POST",
        headers: { Authorization: `Bearer ${key}` },
        body,
      });
      if (response.ok) {
        const json = (await response.json()) as { text?: string };
        transcript = String(json.text ?? "").trim();
      }
    } catch {
      transcript = "";
    }
  }

  return NextResponse.json({ path, transcript });
}
