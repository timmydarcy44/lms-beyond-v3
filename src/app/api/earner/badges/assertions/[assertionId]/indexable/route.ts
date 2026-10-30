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

  const body = (await request.json().catch(() => null)) as { indexable?: unknown } | null;
  if (typeof body?.indexable !== "boolean") {
    return NextResponse.json({ error: "indexable requis" }, { status: 400 });
  }

  const db = getServiceRoleClient();
  if (!db) return NextResponse.json({ error: "Configuration manquante" }, { status: 500 });
  const { data: assertion } = await db
    .from("badge_assertions")
    .select("id, recipient_profile_id")
    .eq("id", assertionId)
    .maybeSingle();
  if (!assertion || assertion.recipient_profile_id !== user.id) {
    return NextResponse.json({ error: "Introuvable" }, { status: 404 });
  }

  const { error } = await db
    .from("badge_assertions")
    .update({ indexable: body.indexable })
    .eq("id", assertionId);
  if (error) return NextResponse.json({ error: "Mise à jour impossible" }, { status: 503 });
  return NextResponse.json({ ok: true, indexable: body.indexable });
}
