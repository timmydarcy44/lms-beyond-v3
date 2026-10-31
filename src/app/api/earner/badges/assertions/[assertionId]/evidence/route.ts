import { NextResponse } from "next/server";
import { createSupabaseServerClient, getServiceRoleClient } from "@/lib/supabase/server";
import { setEvidenceVisibility, walletEvidenceChoices } from "@/lib/openbadges/v3/wallet-privacy";

type RouteParams = { params: Promise<{ assertionId: string }> };

export async function POST(request: Request, { params }: RouteParams) {
  const { assertionId } = await params;
  const authClient = await createSupabaseServerClient();
  if (!authClient) return NextResponse.json({ error: "Configuration manquante" }, { status: 500 });
  const {
    data: { user },
  } = await authClient.auth.getUser();
  if (!user?.id) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const body = (await request.json().catch(() => null)) as { index?: unknown; public?: unknown } | null;
  if (typeof body?.index !== "number" || typeof body.public !== "boolean") {
    return NextResponse.json({ error: "index et public requis" }, { status: 400 });
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

  const evidence = setEvidenceVisibility(assertion.evidence, body.index, body.public);
  if (!evidence) return NextResponse.json({ error: "Livrable introuvable" }, { status: 404 });
  const { error } = await db.from("badge_assertions").update({ evidence }).eq("id", assertionId);
  if (error) return NextResponse.json({ error: "Mise à jour impossible" }, { status: 503 });
  return NextResponse.json({ ok: true, evidence: walletEvidenceChoices(evidence) });
}
