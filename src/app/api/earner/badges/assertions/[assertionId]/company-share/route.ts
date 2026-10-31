import { NextResponse } from "next/server";
import { createSupabaseServerClient, getServiceRoleClient } from "@/lib/supabase/server";
import { setDeliverablesSharedWithCompanies } from "@/lib/openbadges/v3/company-deliverables";

type RouteParams = { params: Promise<{ assertionId: string }> };

export async function POST(request: Request, { params }: RouteParams) {
  const { assertionId } = await params;
  const authClient = await createSupabaseServerClient();
  if (!authClient) return NextResponse.json({ error: "Configuration manquante" }, { status: 500 });
  const {
    data: { user },
  } = await authClient.auth.getUser();
  if (!user?.id) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const body = (await request.json().catch(() => null)) as { shared?: unknown } | null;
  if (typeof body?.shared !== "boolean") {
    return NextResponse.json({ error: "shared requis" }, { status: 400 });
  }

  const db = getServiceRoleClient();
  if (!db) return NextResponse.json({ error: "Configuration manquante" }, { status: 500 });
  const { data: assertion } = await db
    .from("badge_assertions")
    .select("id, recipient_profile_id, evidence")
    .eq("id", assertionId)
    .maybeSingle();
  if (!assertion || assertion.recipient_profile_id !== user.id) {
    return NextResponse.json({ error: "Introuvable" }, { status: 404 });
  }

  const evidence = setDeliverablesSharedWithCompanies(assertion.evidence, body.shared);
  const { error } = await db.from("badge_assertions").update({ evidence }).eq("id", assertionId);
  if (error) return NextResponse.json({ error: "Mise à jour impossible" }, { status: 503 });
  return NextResponse.json({ ok: true, shared: body.shared });
}
