import { NextResponse } from "next/server";
import { assertRadarManagerAccess } from "@/lib/radar-equipe/auth";
import { getCurrentProfileWithAccess } from "@/lib/auth/profile";
import { getServerClient, getServiceRoleClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const { profile } = await getCurrentProfileWithAccess();
  if (!profile?.company_id) {
    return NextResponse.json({ error: "Entreprise non configurée" }, { status: 400 });
  }

  const access = await assertRadarManagerAccess(profile.company_id);
  if (!access.ok) {
    return NextResponse.json({ error: access.error }, { status: 403 });
  }

  const supabase = await getServerClient();
  if (!supabase) {
    return NextResponse.json({ error: "Supabase non configuré" }, { status: 500 });
  }

  let { data: equipes, error } = await supabase
    .from("equipes")
    .select("id, name, organisation_id, manager_id")
    .eq("organisation_id", profile.company_id)
    .order("created_at", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!equipes?.length) {
    const service = getServiceRoleClient();
    if (service) {
      const { data: created } = await service
        .from("equipes")
        .insert({
          organisation_id: profile.company_id,
          name: "Équipe principale",
          manager_id: access.userId,
        })
        .select("id, name, organisation_id, manager_id")
        .single();
      if (created) equipes = [created];
    }
  }

  return NextResponse.json({ equipes: equipes ?? [] });
}
