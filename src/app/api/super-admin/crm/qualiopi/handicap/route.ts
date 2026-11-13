import { NextRequest, NextResponse } from "next/server";
import { isSuperAdmin } from "@/lib/auth/super-admin";
import { requireHandicapReferentAccess } from "@/lib/handicap/access";
import { backfillCfaHandicapProfiles } from "@/lib/handicap/sync";
import { getServiceRoleClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

/** Liste des profils Handicap (référente uniquement). Super hors référente → locked. */
export async function GET(req: NextRequest) {
  const gate = await requireHandicapReferentAccess();
  if (!gate.ok) {
    if (await isSuperAdmin()) {
      return NextResponse.json(
        { locked: true, error: gate.error, profiles: [] },
        { status: 200 },
      );
    }
    return NextResponse.json({ error: gate.error }, { status: gate.status });
  }

  const service = getServiceRoleClient();
  if (!service) return NextResponse.json({ error: "Service indisponible" }, { status: 503 });

  const scope = req.nextUrl.searchParams.get("scope");
  const profileId = req.nextUrl.searchParams.get("id");
  const backfill = req.nextUrl.searchParams.get("backfill") === "1";

  if (backfill) {
    const n = await backfillCfaHandicapProfiles(service);
    return NextResponse.json({ ok: true, backfilled: n });
  }

  if (profileId) {
    const { data: profile, error } = await service
      .from("handicap_profiles")
      .select("*")
      .eq("id", profileId)
      .maybeSingle();
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    if (!profile) return NextResponse.json({ error: "Profil introuvable" }, { status: 404 });

    const { data: followups } = await service
      .from("handicap_followups")
      .select("id, body, author_user_id, created_at")
      .eq("profile_id", profileId)
      .order("created_at", { ascending: false })
      .limit(50);

    let orgName: string | null = null;
    if (profile.organization_id) {
      const { data: org } = await service
        .from("organizations")
        .select("name")
        .eq("id", profile.organization_id)
        .maybeSingle();
      orgName = org?.name ? String(org.name) : null;
    }

    return NextResponse.json({
      locked: false,
      profile: { ...profile, organization_name: orgName },
      followups: followups ?? [],
    });
  }

  let query = service
    .from("handicap_profiles")
    .select(
      "id, scope, source_kind, source_id, organization_id, person_name, person_email, rqth, active, needs_summary, updated_at, created_at",
    )
    .eq("active", true)
    .eq("rqth", true)
    .order("updated_at", { ascending: false })
    .limit(200);

  if (scope === "business" || scope === "school") {
    query = query.eq("scope", scope);
  }

  const { data: profiles, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  const orgIds = [
    ...new Set(
      (profiles ?? [])
        .map((p) => (p.organization_id ? String(p.organization_id) : null))
        .filter(Boolean) as string[],
    ),
  ];
  const orgNames = new Map<string, string>();
  if (orgIds.length) {
    const { data: orgs } = await service.from("organizations").select("id, name").in("id", orgIds);
    for (const o of orgs ?? []) orgNames.set(String(o.id), String(o.name ?? ""));
  }

  return NextResponse.json({
    locked: false,
    profiles: (profiles ?? []).map((p) => ({
      ...p,
      organization_name: p.organization_id ? orgNames.get(String(p.organization_id)) ?? null : null,
    })),
  });
}

export async function PATCH(req: NextRequest) {
  const gate = await requireHandicapReferentAccess();
  if (!gate.ok) return NextResponse.json({ error: gate.error }, { status: gate.status });

  const service = getServiceRoleClient();
  if (!service) return NextResponse.json({ error: "Service indisponible" }, { status: 503 });

  const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body) return NextResponse.json({ error: "Corps invalide" }, { status: 400 });

  const profileId = String(body.id ?? body.profile_id ?? "").trim();
  if (!profileId) return NextResponse.json({ error: "id requis" }, { status: 400 });

  if (body.action === "add_followup") {
    const text = String(body.body ?? "").trim();
    if (!text) return NextResponse.json({ error: "Note vide" }, { status: 400 });
    const { data, error } = await service
      .from("handicap_followups")
      .insert({
        profile_id: profileId,
        author_user_id: gate.userId,
        body: text,
      })
      .select("id, body, author_user_id, created_at")
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    await service
      .from("handicap_profiles")
      .update({ updated_at: new Date().toISOString() })
      .eq("id", profileId);
    return NextResponse.json({ followup: data });
  }

  const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if ("referent_notes" in body) patch.referent_notes = String(body.referent_notes ?? "").trim() || null;
  if ("needs_summary" in body) patch.needs_summary = String(body.needs_summary ?? "").trim() || null;
  if ("active" in body) patch.active = Boolean(body.active);
  if ("accommodations" in body && Array.isArray(body.accommodations)) {
    patch.accommodations = body.accommodations;
  }

  const { data, error } = await service
    .from("handicap_profiles")
    .update(patch)
    .eq("id", profileId)
    .select("*")
    .maybeSingle();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  if (!data) return NextResponse.json({ error: "Profil introuvable" }, { status: 404 });
  return NextResponse.json({ profile: data });
}
