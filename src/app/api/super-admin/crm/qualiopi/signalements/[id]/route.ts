import { NextRequest, NextResponse } from "next/server";
import { assertSignalementStaffAccess } from "@/lib/qualiopi/is-signalement-staff";
import { getServerClient, getServiceRoleClient } from "@/lib/supabase/server";
import {
  parseSignalementStatus,
  transitionSignalement,
} from "@/lib/qualiopi/signalements";

export const dynamic = "force-dynamic";

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

/** Transition statut / notes / réponse signalement sensible. */
export async function PATCH(req: NextRequest, ctx: Ctx) {
  const service = getServiceRoleClient();
  if (!service) return NextResponse.json({ error: "Service indisponible" }, { status: 503 });
  const uid = await actorId();
  const access = await assertSignalementStaffAccess(service, uid);
  if (!access.ok) return NextResponse.json({ error: access.error }, { status: access.status });

  const { id } = await ctx.params;
  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const status = parseSignalementStatus(body.status);
  if (!status) {
    return NextResponse.json(
      { error: "status invalide (received|acked|in_progress|closed)" },
      { status: 400 },
    );
  }

  const result = await transitionSignalement(service, {
    id,
    status,
    actorUserId: await actorId(),
    response: body.response !== undefined ? String(body.response ?? "") : undefined,
    internalNotes:
      body.internal_notes !== undefined ? String(body.internal_notes ?? "") : undefined,
  });
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 400 });

  const { data } = await service
    .from("crm_qualiopi_signalements")
    .select(
      "id, category, subject, description, status, is_anonymous, requester_name, requester_email, audience, dossier_id, received_at, ack_at, in_progress_at, closed_at, response, internal_notes, notified_referent_at",
    )
    .eq("id", id)
    .maybeSingle();

  return NextResponse.json({ ok: true, signalement: data });
}
