import { NextRequest, NextResponse } from "next/server";
import { isSuperAdmin } from "@/lib/auth/super-admin";
import { getAccountParticipants } from "@/lib/control/account-participants";
import { buildActivityRow } from "@/lib/control/policy";
import { getServerClient, getServiceRoleClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, ctx: Ctx) {
  if (!(await isSuperAdmin())) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }
  const { id } = await ctx.params;
  const payload = await getAccountParticipants(id);
  if (!payload) {
    return NextResponse.json({ error: "Compte introuvable" }, { status: 404 });
  }
  return NextResponse.json(payload);
}

/** Rattacher des participants de dossiers à un membre existant (profile_id). */
export async function POST(req: NextRequest, ctx: Ctx) {
  const supabase = await getServerClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user || !(await isSuperAdmin())) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }
  const service = getServiceRoleClient();
  if (!service) return NextResponse.json({ error: "Service indisponible" }, { status: 503 });

  const { id: orgId } = await ctx.params;
  const body = (await req.json().catch(() => null)) as {
    action?: string;
    memberUserId?: string;
    participantIds?: string[];
  } | null;

  if (body?.action !== "attach") {
    return NextResponse.json({ error: "Action inconnue" }, { status: 400 });
  }

  const memberUserId = String(body.memberUserId ?? "").trim();
  const participantIds = Array.isArray(body.participantIds)
    ? body.participantIds.map((x) => String(x)).filter(Boolean)
    : [];
  if (!memberUserId || memberUserId.startsWith("employee:") || participantIds.length === 0) {
    return NextResponse.json({ error: "Membre et participants requis" }, { status: 400 });
  }

  const { data: membership } = await service
    .from("org_memberships")
    .select("user_id")
    .eq("org_id", orgId)
    .eq("user_id", memberUserId)
    .maybeSingle();
  if (!membership) {
    return NextResponse.json({ error: "Ce membre n'appartient pas au compte" }, { status: 400 });
  }

  const { data: participants, error: partErr } = await service
    .from("formation_participants")
    .select("id, dossier_id, profile_id")
    .in("id", participantIds);
  if (partErr) return NextResponse.json({ error: partErr.message }, { status: 400 });

  const rows = participants ?? [];
  if (!rows.length) {
    return NextResponse.json({ error: "Aucun participant trouvé" }, { status: 404 });
  }

  const dossierIds = [...new Set(rows.map((r) => String(r.dossier_id)))];
  const { data: dossiers } = await service
    .from("formation_dossiers")
    .select("id")
    .eq("organization_id", orgId)
    .in("id", dossierIds);
  const allowed = new Set((dossiers ?? []).map((d) => String(d.id)));
  const scoped = rows.filter((r) => allowed.has(String(r.dossier_id)));
  if (!scoped.length) {
    return NextResponse.json({ error: "Participants hors de ce compte" }, { status: 400 });
  }

  let attached = 0;
  let skipped = 0;
  for (const row of scoped) {
    if (String(row.profile_id) === memberUserId) {
      skipped += 1;
      continue;
    }
    const { data: conflict } = await service
      .from("formation_participants")
      .select("id")
      .eq("dossier_id", row.dossier_id)
      .eq("profile_id", memberUserId)
      .maybeSingle();
    if (conflict?.id) {
      // Déjà présent sous le bon profil : retire le doublon orphelin
      await service.from("formation_participants").delete().eq("id", row.id);
      attached += 1;
      continue;
    }
    const { error } = await service
      .from("formation_participants")
      .update({ profile_id: memberUserId })
      .eq("id", row.id);
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    attached += 1;
  }

  await service.from("org_activity").insert(
    buildActivityRow({
      orgId,
      actorUserId: auth.user.id,
      actorType: "byound_on_behalf",
      action: "attach_participants",
      payload: { memberUserId, attached, participantIds: scoped.map((r) => r.id) },
    }),
  );

  return NextResponse.json({ ok: true, attached, skipped, dossierCount: scoped.length });
}
