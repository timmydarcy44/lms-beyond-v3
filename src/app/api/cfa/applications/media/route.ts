import { NextRequest, NextResponse } from "next/server";

import { getServiceRoleClient } from "@/lib/supabase/server";

/** URL signée courte pour relecture candidat (token resume requis). */
export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token")?.trim();
  const path = request.nextUrl.searchParams.get("path")?.trim();
  const bucket = request.nextUrl.searchParams.get("bucket")?.trim() || "admission-media";
  if (!token || !path) {
    return NextResponse.json({ error: "Paramètres manquants." }, { status: 400 });
  }

  const db = getServiceRoleClient();
  if (!db) return NextResponse.json({ error: "Service indisponible." }, { status: 503 });

  const { data: application } = await db
    .from("cfa_applications")
    .select("id")
    .eq("resume_token", token)
    .maybeSingle();
  if (!application) return NextResponse.json({ error: "Candidature introuvable." }, { status: 404 });
  if (!path.startsWith(`${application.id}/`)) {
    return NextResponse.json({ error: "Fichier non autorisé." }, { status: 403 });
  }

  const { data, error } = await db.storage.from(bucket).createSignedUrl(path, 60 * 30);
  if (error || !data?.signedUrl) {
    return NextResponse.json({ error: error?.message || "URL impossible." }, { status: 400 });
  }
  return NextResponse.redirect(data.signedUrl);
}
