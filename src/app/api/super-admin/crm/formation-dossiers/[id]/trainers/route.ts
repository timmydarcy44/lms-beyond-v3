import { NextRequest, NextResponse } from "next/server";
import { isSuperAdmin } from "@/lib/auth/super-admin";
import { getServerClient, getServiceRoleClient } from "@/lib/supabase/server";
import {
  listDossierTrainers,
  removeDossierTrainer,
  setPedagogicalReferent,
  upsertDossierTrainer,
  type DossierTrainerRole,
} from "@/lib/formation-dossier/trainers";
import { snapshotTrainerCvToDossier } from "@/lib/formation-documents/trainer-cv";

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

export async function GET(_req: NextRequest, ctx: Ctx) {
  if (!(await isSuperAdmin())) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }
  const service = getServiceRoleClient();
  if (!service) return NextResponse.json({ error: "Service indisponible" }, { status: 503 });

  const { id } = await ctx.params;
  const snapshot = await listDossierTrainers(service, id);
  return NextResponse.json(snapshot);
}

/**
 * Body:
 * - action=add|update : { user_id, role?, is_pedagogical_referent? }
 * - action=remove : { user_id }
 * - action=set_referent : { user_id }
 */
export async function POST(req: NextRequest, ctx: Ctx) {
  if (!(await isSuperAdmin())) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }
  const service = getServiceRoleClient();
  if (!service) return NextResponse.json({ error: "Service indisponible" }, { status: 503 });

  const { id } = await ctx.params;
  const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  const action = String(body?.action ?? "add").trim();
  const userId = String(body?.user_id ?? "").trim();
  const actorUserId = await actorId();

  if (!userId) {
    return NextResponse.json({ error: "user_id requis" }, { status: 400 });
  }

  if (action === "remove") {
    const result = await removeDossierTrainer(service, { dossierId: id, userId });
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: 400 });
    return NextResponse.json({ ok: true, ...result.snapshot });
  }

  if (action === "set_referent") {
    const result = await setPedagogicalReferent(service, { dossierId: id, userId });
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: 400 });
    return NextResponse.json({ ok: true, ...result.snapshot });
  }

  const roleRaw = String(body?.role ?? "co").trim();
  const role: DossierTrainerRole = roleRaw === "lead" ? "lead" : "co";
  const isPedagogicalReferent =
    body?.is_pedagogical_referent === true
      ? true
      : body?.is_pedagogical_referent === false
        ? false
        : undefined;

  const { assertTrainerSubcontractReady } = await import("@/lib/expert/subcontracting");
  const sst = await assertTrainerSubcontractReady(service, userId);
  if (!sst.ok) {
    return NextResponse.json({ error: sst.error, code: sst.code }, { status: 400 });
  }

  if (role === "lead") {
    const cvSnap = await snapshotTrainerCvToDossier(service, {
      dossierId: id,
      trainerUserId: userId,
      actorUserId,
    });
    if (!cvSnap.ok) {
      return NextResponse.json(
        { error: cvSnap.error, code: cvSnap.code },
        { status: 400 },
      );
    }
  }

  const result = await upsertDossierTrainer(service, {
    dossierId: id,
    userId,
    role,
    isPedagogicalReferent,
    actorUserId,
  });
  if (!result.ok) {
    return NextResponse.json(
      { error: result.error, code: result.code },
      { status: 400 },
    );
  }

  await service.from("formation_events").insert({
    dossier_id: id,
    event_type: "trainer_upserted",
    actor_user_id: actorUserId,
    payload: {
      user_id: userId,
      role,
      is_pedagogical_referent: isPedagogicalReferent ?? null,
    },
  });

  return NextResponse.json({ ok: true, ...result.snapshot });
}
