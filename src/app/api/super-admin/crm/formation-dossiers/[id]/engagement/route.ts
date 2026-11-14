import { NextRequest, NextResponse } from "next/server";
import { isSuperAdmin } from "@/lib/auth/super-admin";
import { getServerClient, getServiceRoleClient } from "@/lib/supabase/server";
import {
  addEngagementAction,
  ENGAGEMENT_ACTION_CHANNELS,
  ENGAGEMENT_ACTION_RESULTS,
  listEngagementAlerts,
  syncEngagementAlerts,
  type EngagementActionChannel,
  type EngagementActionResult,
} from "@/lib/formation-dossier/engagement";

type Ctx = { params: Promise<{ id: string }> };

async function actorId(): Promise<string | null> {
  try {
    const userClient = await getServerClient();
    const { data: auth } = userClient ? await userClient.auth.getUser() : { data: { user: null } };
    return auth.user?.id ?? null;
  } catch {
    return null;
  }
}

/** Liste les alertes engagement (+ sync optionnelle via ?sync=1). */
export async function GET(req: NextRequest, ctx: Ctx) {
  if (!(await isSuperAdmin())) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }
  const service = getServiceRoleClient();
  if (!service) return NextResponse.json({ error: "Service indisponible" }, { status: 503 });

  const { id } = await ctx.params;
  const sync = new URL(req.url).searchParams.get("sync") === "1";
  if (sync) {
    const result = await syncEngagementAlerts(service, id);
    return NextResponse.json(result);
  }
  const alerts = await listEngagementAlerts(service, id);
  return NextResponse.json({ alerts });
}

/**
 * Body:
 * - action=sync
 * - action=relance : { alert_id, channel, result, notes? }
 */
export async function POST(req: NextRequest, ctx: Ctx) {
  if (!(await isSuperAdmin())) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }
  const service = getServiceRoleClient();
  if (!service) return NextResponse.json({ error: "Service indisponible" }, { status: 503 });

  const { id } = await ctx.params;
  const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  const action = String(body?.action ?? "sync").trim();
  const actorUserId = await actorId();

  if (action === "sync") {
    const result = await syncEngagementAlerts(service, id);
    return NextResponse.json({ ok: true, ...result });
  }

  if (action === "relance") {
    const alertId = String(body?.alert_id ?? "").trim();
    const channel = String(body?.channel ?? "autre").trim();
    const result = String(body?.result ?? "en_attente").trim();
    if (!alertId) return NextResponse.json({ error: "alert_id requis" }, { status: 400 });
    if (!(ENGAGEMENT_ACTION_CHANNELS as readonly string[]).includes(channel)) {
      return NextResponse.json({ error: "channel invalide" }, { status: 400 });
    }
    if (!(ENGAGEMENT_ACTION_RESULTS as readonly string[]).includes(result)) {
      return NextResponse.json({ error: "result invalide" }, { status: 400 });
    }
    const saved = await addEngagementAction(service, {
      alertId,
      actorUserId,
      channel: channel as EngagementActionChannel,
      result: result as EngagementActionResult,
      notes: body?.notes ? String(body.notes) : null,
    });
    if (!saved.ok) return NextResponse.json({ error: saved.error }, { status: 400 });
    const alerts = await listEngagementAlerts(service, id);
    return NextResponse.json({ ok: true, action: saved.action, alerts });
  }

  return NextResponse.json({ error: "action invalide (sync|relance)" }, { status: 400 });
}
