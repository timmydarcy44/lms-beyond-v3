import { NextRequest, NextResponse } from "next/server";
import { isSuperAdmin } from "@/lib/auth/super-admin";
import { buildActivityRow } from "@/lib/control/policy";
import { createBadgeClassViaSupabase } from "@/lib/openbadges/badge-repository";
import { getServerClient, getServiceRoleClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const supabase = await getServerClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user || !(await isSuperAdmin())) {
    return NextResponse.json({ error: "Réservé au staff Byound" }, { status: 403 });
  }
  const service = getServiceRoleClient();
  if (!service) return NextResponse.json({ error: "Service indisponible" }, { status: 503 });
  const body = (await request.json().catch(() => ({}))) as { name?: string; description?: string };
  const name = String(body.name ?? "").trim();
  const description = String(body.description ?? "").trim() || "Badge délivré par Byound.";
  if (name.length < 2) return NextResponse.json({ error: "Donnez un nom au badge." }, { status: 400 });
  try {
    const created = await createBadgeClassViaSupabase({
      orgId: id,
      createdByUserId: data.user.id,
      name,
      description,
      status: "DRAFT",
    });
    await service.from("org_activity").insert(buildActivityRow({
      orgId: id,
      actorUserId: data.user.id,
      actorType: "byound_on_behalf",
      action: "create_badge",
      payload: { name, badgeId: created.id ?? null },
    }));
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Création impossible";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
