import { NextRequest, NextResponse } from "next/server";
import { getServerClient, getServiceRoleClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const MAX_BYTES = 25 * 1024 * 1024;

function safeName(name: string) {
  const base = name.split(/[/\\]/).pop() ?? "document";
  return base.replace(/[^\w.\-]+/g, "_").slice(0, 80) || "document";
}

export async function POST(request: NextRequest) {
  const auth = await getServerClient();
  if (!auth) return NextResponse.json({ error: "Service indisponible" }, { status: 500 });
  const { data: userData } = await auth.auth.getUser();
  if (!userData.user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const service = getServiceRoleClient();
  if (!service) return NextResponse.json({ error: "Service indisponible" }, { status: 503 });

  const form = await request.formData();
  const file = form.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return NextResponse.json({ error: "Aucun fichier" }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "Le fichier dépasse 25 Mo" }, { status: 400 });
  }

  const path = `skill-proofs/${userData.user.id}/${Date.now()}-${safeName(file.name)}`;
  const buffer = Buffer.from(await file.arrayBuffer());
  const { error } = await service.storage.from("public").upload(path, buffer, {
    contentType: file.type || "application/octet-stream",
    upsert: false,
  });
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  const { data } = service.storage.from("public").getPublicUrl(path);
  return NextResponse.json({ url: data.publicUrl, fileName: file.name });
}
