import crypto from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/require-role";
import { UserRole } from "@/lib/auth/user-role";
import { getOpenAIClient } from "@/lib/ai/openai-client";
import { getServiceRoleClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  const orgId = request.headers.get("x-org-id");
  if (!orgId) return NextResponse.json({ error: "MISSING_ORG_ID" }, { status: 400 });
  const auth = requireRole(request, [UserRole.SUPER_ADMIN]);
  if (!auth.ok) return auth.response;

  const body = (await request.json().catch(() => null)) as { name?: string; domain?: string | null; description?: string } | null;
  const name = body?.name?.trim();
  if (!name) return NextResponse.json({ error: "Nom requis" }, { status: 400 });

  const openai = getOpenAIClient();
  if (!openai) return NextResponse.json({ error: "Génération indisponible" }, { status: 503 });

  const imageRes = await openai.images.generate({
    model: "dall-e-3",
    prompt: `Emblème carré abstrait pour un badge professionnel nommé « ${name} ». ${body?.domain ? `Domaine : ${body.domain}.` : ""} Style hologramme sombre, formes géométriques, aucune lettre, aucun mot.`,
    size: "1024x1024",
    quality: "standard",
    n: 1,
  });
  const remote = imageRes.data?.[0]?.url;
  if (!remote) return NextResponse.json({ error: "Visuel vide" }, { status: 502 });

  const downloaded = await fetch(remote);
  if (!downloaded.ok) return NextResponse.json({ error: "Téléchargement du visuel impossible" }, { status: 502 });
  const buffer = Buffer.from(await downloaded.arrayBuffer());

  const supabase = getServiceRoleClient();
  if (!supabase) return NextResponse.json({ error: "Stockage indisponible" }, { status: 503 });
  const storagePath = `openbadges/badgeclasses/${orgId}/${crypto.randomUUID()}.png`;
  const { error } = await supabase.storage.from("badge-images").upload(storagePath, buffer, {
    contentType: "image/png",
    cacheControl: "3600",
    upsert: false,
  });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  const { data } = supabase.storage.from("badge-images").getPublicUrl(storagePath);
  return NextResponse.json({ imageUrl: data.publicUrl });
}
