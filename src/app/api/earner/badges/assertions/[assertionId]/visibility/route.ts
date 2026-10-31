import { NextResponse } from "next/server";
import { createSupabaseServerClient, getServiceRoleClient } from "@/lib/supabase/server";

type RouteParams = { params: Promise<{ assertionId: string }> };

export async function POST(request: Request, { params }: RouteParams) {
  const { assertionId } = await params;
  const authClient = await createSupabaseServerClient();
  if (!authClient) return NextResponse.json({ error: "Configuration manquante" }, { status: 500 });
  const {
    data: { user },
  } = await authClient.auth.getUser();
  if (!user?.id) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const body = (await request.json().catch(() => null)) as { isPublic?: unknown } | null;
  if (typeof body?.isPublic !== "boolean") {
    return NextResponse.json({ error: "isPublic requis" }, { status: 400 });
  }

  const db = getServiceRoleClient();
  if (!db) return NextResponse.json({ error: "Configuration manquante" }, { status: 500 });
  const { data: assertion } = await db
    .from("badge_assertions")
    .select("id, recipient_profile_id, is_public, public_since")
    .eq("id", assertionId)
    .maybeSingle();
  if (!assertion || assertion.recipient_profile_id !== user.id) {
    return NextResponse.json({ error: "Introuvable" }, { status: 404 });
  }

  const publicSince = body.isPublic
    ? assertion.is_public ? assertion.public_since : new Date().toISOString()
    : null;
  const { error } = await db
    .from("badge_assertions")
    .update({ is_public: body.isPublic, public_since: publicSince })
    .eq("id", assertionId);
  if (error) return NextResponse.json({ error: "Mise à jour impossible" }, { status: 503 });
  return NextResponse.json({ ok: true, isPublic: body.isPublic });
}
