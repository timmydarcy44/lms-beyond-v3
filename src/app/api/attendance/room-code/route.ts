import { NextRequest, NextResponse } from "next/server";
import { getServiceRoleClient } from "@/lib/supabase/server";
import {
  ATTENDANCE_MAX_ROOM_ATTEMPTS_PER_MIN,
  deriveSlotKey,
  verifyRoomCode,
} from "@/lib/formation-attendance/token";
import {
  buildEmargeSession,
  deviceTokenHash,
  readOrCreateDeviceToken,
  setEmargeSession,
} from "@/lib/formation-attendance/cookies";
import { hitRateLimit } from "@/lib/formation-attendance/rate-limit";
import { isAttendanceWindowOpen, loadSlotContext } from "@/lib/formation-attendance/slot-context";

export async function POST(req: NextRequest) {
  const service = getServiceRoleClient();
  if (!service) return NextResponse.json({ error: "Service indisponible" }, { status: 503 });

  const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  const code = String(body?.code ?? "").trim();
  // Optionnel : slot hint si plusieurs lancements — sinon on matche le code sur les lancements actifs
  const slotHint = String(body?.slot_id ?? "").trim();

  const { token: deviceToken } = await readOrCreateDeviceToken();
  const deviceHash = deviceTokenHash(deviceToken);

  await service.from("attendance_devices").upsert(
    {
      device_token_hash: deviceHash,
      user_agent: req.headers.get("user-agent")?.slice(0, 500) ?? null,
      last_seen_at: new Date().toISOString(),
    },
    { onConflict: "device_token_hash" },
  );

  const rate = await hitRateLimit(
    service,
    `room:${deviceHash}`,
    ATTENDANCE_MAX_ROOM_ATTEMPTS_PER_MIN,
    60_000,
  );
  if (!rate.allowed) {
    return NextResponse.json(
      { error: "Trop de tentatives. Réessayez dans une minute.", code: "rate_limited" },
      { status: 429 },
    );
  }

  let query = service
    .from("attendance_slot_launches")
    .select("*")
    .is("revoked_at", null)
    .order("opened_at", { ascending: false })
    .limit(40);
  if (slotHint) query = query.eq("slot_id", slotHint);

  const { data: launches } = await query;
  if (!launches?.length) {
    return NextResponse.json(
      { error: "Aucun émargement ouvert. Demandez le code au formateur.", code: "closed" },
      { status: 400 },
    );
  }

  const now = Date.now();
  let matched: (typeof launches)[number] | null = null;
  let matchedCounter = 0;

  for (const launch of launches) {
    const slotKey = deriveSlotKey(String(launch.slot_id), String(launch.nonce));
    const result = verifyRoomCode(slotKey, code, now);
    if (result.ok) {
      matched = launch;
      matchedCounter = result.counter;
      break;
    }
  }

  if (!matched) {
    return NextResponse.json(
      { error: "Code expiré ou invalide. Demandez le nouveau code au formateur.", code: "expired" },
      { status: 400 },
    );
  }

  const ctx = await loadSlotContext(service, String(matched.slot_id));
  if (!ctx) {
    return NextResponse.json({ error: "Créneau introuvable" }, { status: 404 });
  }
  if (!isAttendanceWindowOpen(ctx.slot, now)) {
    return NextResponse.json({ error: "Émargement fermé pour ce créneau.", code: "closed" }, { status: 400 });
  }

  const source = matched.mode === "qr" ? "qr" : "code_oral";
  await setEmargeSession(
    buildEmargeSession({
      launchId: String(matched.id),
      slotId: String(matched.slot_id),
      counter: matchedCounter,
      source,
    }),
  );

  return NextResponse.json({
    ok: true,
    slot_id: matched.slot_id,
    launch_id: matched.id,
    context: {
      title: ctx.session.title || ctx.dossiers[0]?.course_title || "Formation",
      clients: ctx.dossiers.map((d) => d.organization_name).join(" · "),
      day_part: ctx.slot.day_part,
      slot_date: ctx.slot.slot_date,
      starts_at: ctx.slot.starts_at,
      ends_at: ctx.slot.ends_at,
      location: ctx.session.location_label,
    },
  });
}
