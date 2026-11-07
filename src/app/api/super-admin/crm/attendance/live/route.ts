import { NextRequest, NextResponse } from "next/server";
import { isSuperAdmin } from "@/lib/auth/super-admin";
import { getServiceRoleClient } from "@/lib/supabase/server";
import {
  currentRoomCode,
  deriveSlotKey,
  secondsUntilRefresh,
} from "@/lib/formation-attendance/token";
import { loadSlotContext } from "@/lib/formation-attendance/slot-context";

export async function GET(req: NextRequest) {
  if (!(await isSuperAdmin())) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }
  const service = getServiceRoleClient();
  if (!service) return NextResponse.json({ error: "Service indisponible" }, { status: 503 });

  const slotId = req.nextUrl.searchParams.get("slot_id")?.trim() || "";
  if (!slotId) return NextResponse.json({ error: "slot_id requis" }, { status: 400 });

  const ctx = await loadSlotContext(service, slotId);
  if (!ctx) return NextResponse.json({ error: "Créneau introuvable" }, { status: 404 });

  const { data: launch } = await service
    .from("attendance_slot_launches")
    .select("*")
    .eq("slot_id", slotId)
    .is("revoked_at", null)
    .order("opened_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const { data: signatures } = await service
    .from("attendance_signatures")
    .select(
      "id, profile_id, server_timestamp, source, identification_method, validation_mode, status, alerts, first_activation, person_seen, minutes_late, punctuality_ref_at, minutes_after_scheduled_start",
    )
    .eq("slot_id", slotId);

  const { data: closure } = await service
    .from("attendance_closures")
    .select("*")
    .eq("slot_id", slotId)
    .maybeSingle();

  const eligible = ctx.participants.filter((p) => p.convention_ok);
  const blocked = ctx.participants.filter((p) => !p.convention_ok);
  const signedIds = new Set((signatures ?? []).map((s) => String(s.profile_id)));
  const eligibleIds = eligible.map((p) => p.profile_id);

  const { data: credentials } = eligibleIds.length
    ? await service
        .from("attendance_credentials")
        .select("id, profile_id, synced, backed_up, created_at")
        .in("profile_id", eligibleIds)
        .is("revoked_at", null)
    : { data: [] as Array<{ id: string; profile_id: string; synced: boolean; backed_up: boolean; created_at: string }> };

  const credsByProfile = new Map<
    string,
    Array<{ id: string; synced: boolean; created_at: string }>
  >();
  for (const c of credentials ?? []) {
    const pid = String(c.profile_id);
    const list = credsByProfile.get(pid) ?? [];
    list.push({
      id: String(c.id),
      synced: Boolean(c.synced || c.backed_up),
      created_at: String(c.created_at),
    });
    credsByProfile.set(pid, list);
  }

  let codePayload: Record<string, unknown> | null = null;
  if (launch?.nonce) {
    const slotKey = deriveSlotKey(slotId, String(launch.nonce));
    const live = currentRoomCode(slotKey);
    const origin = new URL(req.url).origin;
    codePayload = {
      launch_id: launch.id,
      mode: launch.mode,
      nonce: launch.nonce,
      slot_key_b64: slotKey.toString("base64"),
      code: live.code,
      counter: live.counter,
      expires_in_ms: live.expiresInMs,
      refresh_in_s: secondsUntilRefresh(),
      public_url: `${origin}/e/s/${launch.id}`,
    };
  }

  return NextResponse.json({
    live: codePayload,
    closure: closure ?? null,
    enrolled: eligible.length,
    present: (signatures ?? []).filter((s) => s.status !== "invalidee").length,
    roster: eligible.map((p) => {
      const sig = (signatures ?? []).find((s) => String(s.profile_id) === p.profile_id);
      const passkeys = credsByProfile.get(p.profile_id) ?? [];
      const alerts = Array.isArray(sig?.alerts) ? sig.alerts : [];
      return {
        profile_id: p.profile_id,
        name: p.name,
        email: p.email,
        job_title: p.job_title,
        needs_specific_support: p.needs_specific_support,
        signed: Boolean(sig),
        signed_at: sig?.server_timestamp ?? null,
        method: sig?.identification_method ?? null,
        source: sig?.source ?? null,
        status: sig?.status ?? null,
        minutes_late: sig?.minutes_late != null ? Number(sig.minutes_late) : 0,
        first_activation: Boolean(sig?.first_activation),
        passkey: {
          has: passkeys.length > 0,
          synced: passkeys.some((c) => c.synced),
          credential_ids: passkeys.map((c) => c.id),
        },
        alerts,
      };
    }),
    blocked_without_convention: blocked.map((p) => ({
      name: p.name,
      email: p.email,
      organization_hint: p.dossier_id,
    })),
    context: {
      title: ctx.session.title || ctx.dossiers[0]?.course_title || "Formation",
      clients: ctx.dossiers.map((d) => d.organization_name),
      day_part: ctx.slot.day_part,
      slot_date: ctx.slot.slot_date,
      location: ctx.session.location_label,
    },
    signed_profile_ids: Array.from(signedIds),
  });
}
