import { NextRequest, NextResponse } from "next/server";
import { isSuperAdmin } from "@/lib/auth/super-admin";
import { getServerClient, getServiceRoleClient } from "@/lib/supabase/server";
import {
  currentRoomCode,
  deriveSlotKey,
  newSlotNonce,
  secondsUntilRefresh,
} from "@/lib/formation-attendance/token";
import {
  loadSlotContext,
  resolveAttendanceCloseAt,
} from "@/lib/formation-attendance/slot-context";

export async function POST(req: NextRequest) {
  if (!(await isSuperAdmin())) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }
  const service = getServiceRoleClient();
  if (!service) return NextResponse.json({ error: "Service indisponible" }, { status: 503 });

  const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  const slotId = String(body?.slot_id ?? "").trim();
  const mode = body?.mode === "qr" ? "qr" : "code_oral";
  if (!slotId) return NextResponse.json({ error: "slot_id requis" }, { status: 400 });

  const ctx = await loadSlotContext(service, slotId);
  if (!ctx) return NextResponse.json({ error: "Créneau introuvable" }, { status: 404 });

  let actorUserId: string | null = null;
  try {
    const userClient = await getServerClient();
    const { data: auth } = userClient ? await userClient.auth.getUser() : { data: { user: null } };
    actorUserId = auth.user?.id ?? null;
  } catch {
    /* ignore */
  }

  // Révoquer les lancements actifs
  await service
    .from("attendance_slot_launches")
    .update({ revoked_at: new Date().toISOString(), updated_at: new Date().toISOString() })
    .eq("slot_id", slotId)
    .is("revoked_at", null);

  const nonce = newSlotNonce();
  const now = Date.now();
  const closesAt = resolveAttendanceCloseAt(ctx.slot, now).toISOString();
  // Ouvre / prolonge la fenêtre slot tant que le formateur lance l’émargement
  await service
    .from("formation_slots")
    .update({
      attendance_opens_at: new Date(
        Math.min(
          now,
          ctx.slot.attendance_opens_at
            ? Date.parse(ctx.slot.attendance_opens_at)
            : ctx.slot.starts_at
              ? Date.parse(ctx.slot.starts_at)
              : now,
        ),
      ).toISOString(),
      attendance_closes_at: closesAt,
    })
    .eq("id", slotId);

  const { data: launch, error } = await service
    .from("attendance_slot_launches")
    .insert({
      slot_id: slotId,
      session_id: ctx.session.id,
      mode,
      nonce,
      opened_by: actorUserId,
      closes_at: closesAt,
    })
    .select("*")
    .single();

  if (error || !launch) {
    return NextResponse.json({ error: error?.message || "Lancement impossible" }, { status: 400 });
  }

  const slotKey = deriveSlotKey(slotId, nonce);
  const { code, expiresInMs, counter } = currentRoomCode(slotKey);
  const origin = new URL(req.url).origin;
  const publicUrl = `${origin}/e?launch=${encodeURIComponent(String(launch.id))}`;

  return NextResponse.json({
    launch: {
      id: launch.id,
      slot_id: slotId,
      session_id: ctx.session.id,
      mode,
      nonce,
      // K_slot transmis uniquement au formateur authentifié (jamais en URL publique)
      slot_key_b64: slotKey.toString("base64"),
      code,
      counter,
      expires_in_ms: expiresInMs,
      refresh_in_s: secondsUntilRefresh(),
      public_url: publicUrl,
    },
    context: {
      title: ctx.session.title || ctx.dossiers[0]?.course_title || "Formation",
      clients: ctx.dossiers.map((d) => d.organization_name),
      day_part: ctx.slot.day_part,
      slot_date: ctx.slot.slot_date,
      location: ctx.session.location_label,
      enrolled: ctx.participants.filter((p) => p.convention_ok).length,
      blocked_without_convention: ctx.participants.filter((p) => !p.convention_ok).length,
    },
  });
}

export async function PATCH(req: NextRequest) {
  if (!(await isSuperAdmin())) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }
  const service = getServiceRoleClient();
  if (!service) return NextResponse.json({ error: "Service indisponible" }, { status: 503 });

  const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  const launchId = String(body?.launch_id ?? "").trim();
  const mode = body?.mode === "qr" ? "qr" : body?.mode === "code_oral" ? "code_oral" : null;
  if (!launchId || !mode) {
    return NextResponse.json({ error: "launch_id et mode requis" }, { status: 400 });
  }

  const { data, error } = await service
    .from("attendance_slot_launches")
    .update({ mode, updated_at: new Date().toISOString() })
    .eq("id", launchId)
    .is("revoked_at", null)
    .select("*")
    .maybeSingle();

  if (error || !data) {
    return NextResponse.json({ error: error?.message || "Lancement introuvable" }, { status: 400 });
  }
  return NextResponse.json({ launch: data });
}

/** Régénère nonce (révocation) — nouveau K_slot. */
export async function PUT(req: NextRequest) {
  if (!(await isSuperAdmin())) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }
  const service = getServiceRoleClient();
  if (!service) return NextResponse.json({ error: "Service indisponible" }, { status: 503 });

  const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  const launchId = String(body?.launch_id ?? "").trim();
  if (!launchId) return NextResponse.json({ error: "launch_id requis" }, { status: 400 });

  const nonce = newSlotNonce();
  const { data, error } = await service
    .from("attendance_slot_launches")
    .update({ nonce, updated_at: new Date().toISOString() })
    .eq("id", launchId)
    .is("revoked_at", null)
    .select("*")
    .maybeSingle();

  if (error || !data) {
    return NextResponse.json({ error: error?.message || "Lancement introuvable" }, { status: 400 });
  }

  const slotKey = deriveSlotKey(String(data.slot_id), nonce);
  const live = currentRoomCode(slotKey);
  return NextResponse.json({
    launch: {
      id: data.id,
      slot_id: data.slot_id,
      mode: data.mode,
      nonce,
      slot_key_b64: slotKey.toString("base64"),
      code: live.code,
      counter: live.counter,
      expires_in_ms: live.expiresInMs,
      refresh_in_s: secondsUntilRefresh(),
    },
  });
}
