import { NextRequest, NextResponse } from "next/server";
import { getCurrentProfileWithAccess } from "@/lib/auth/profile";
import { getServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const { user, profile } = await getCurrentProfileWithAccess();
  if (!user?.id) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const supabase = await getServerClient();
  if (!supabase) {
    return NextResponse.json({ error: "Supabase non configuré" }, { status: 500 });
  }

  const { data } = await supabase
    .from("collaborateur_partages")
    .select("consentement_donne, consentement_date, revocation_date, manager_id")
    .eq("collaborateur_id", user.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  let managerId: string | null = null;
  if (profile?.company_id) {
    const { getServiceRoleClient } = await import("@/lib/supabase/server");
    const service = getServiceRoleClient();
    if (service) {
      const { data: eq } = await service
        .from("equipes")
        .select("manager_id")
        .eq("organisation_id", profile.company_id)
        .not("manager_id", "is", null)
        .limit(1)
        .maybeSingle();
      managerId = (eq?.manager_id as string) ?? null;
    }
  }

  return NextResponse.json({
    consentement: data?.consentement_donne ?? false,
    consentementDate: data?.consentement_date ?? null,
    revocationDate: data?.revocation_date ?? null,
    managerId,
    mention:
      "Vos données personnelles ne sont jamais communiquées à votre employeur sans votre accord explicite.",
  });
}

export async function POST(request: NextRequest) {
  const { user } = await getCurrentProfileWithAccess();
  if (!user?.id) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  let body: { managerId?: string; consent?: boolean } = {};
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Corps invalide" }, { status: 400 });
  }

  const managerId = String(body.managerId ?? "").trim();
  const consent = Boolean(body.consent);
  if (!managerId) {
    return NextResponse.json({ error: "managerId requis" }, { status: 400 });
  }

  const supabase = await getServerClient();
  if (!supabase) {
    return NextResponse.json({ error: "Supabase non configuré" }, { status: 500 });
  }

  const now = new Date().toISOString();
  const { error } = await supabase.from("collaborateur_partages").upsert(
    {
      collaborateur_id: user.id,
      manager_id: managerId,
      consentement_donne: consent,
      consentement_date: consent ? now : null,
      revocation_date: consent ? null : now,
    },
    { onConflict: "collaborateur_id,manager_id" },
  );

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, consentement: consent });
}
