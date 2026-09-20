import { NextResponse } from "next/server";

import { getSession } from "@/lib/auth/session";
import { deriveAttendanceStatus } from "@/lib/ecole/attendance";
import { getServiceRoleClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ tagId: string }> };

/**
 * NFC : le tag identifie une SALLE. EDGE résout la session active dans cette salle.
 */
export async function GET(_req: Request, ctx: Ctx) {
  const { tagId } = await ctx.params;
  const db = getServiceRoleClient();
  if (!db) return NextResponse.json({ error: "NO_DB_CLIENT" }, { status: 500 });

  const session = await getSession();
  const { data: room } = await db
    .from("school_rooms")
    .select("id, name, school_id, nfc_tag_id")
    .eq("nfc_tag_id", tagId)
    .maybeSingle();
  if (!room) return NextResponse.json({ error: "UNKNOWN_TAG" }, { status: 404 });

  const now = new Date().toISOString();
  const { data: slots } = await db
    .from("school_planning_slots")
    .select("id, starts_at, ends_at, class_id, duration_hours")
    .eq("room_id", room.id)
    .eq("school_id", room.school_id)
    .neq("status", "cancelled")
    .lte("starts_at", now)
    .gte("ends_at", now)
    .limit(5);

  const slotIds = (slots ?? []).map((s: { id: string }) => s.id);
  let activeSession = null;
  if (slotIds.length) {
    const { data: sessions } = await db
      .from("school_attendance_sessions")
      .select("*")
      .in("slot_id", slotIds)
      .in("status", ["checkin_open", "checkout_open"])
      .order("updated_at", { ascending: false })
      .limit(1);
    activeSession = sessions?.[0] ?? null;
  }

  return NextResponse.json({
    authenticated: Boolean(session?.id),
    room: { id: room.id, name: room.name },
    active_session: activeSession,
    slots: slots ?? [],
  });
}

export async function POST(_req: Request, ctx: Ctx) {
  const auth = await getSession();
  if (!auth?.id) return NextResponse.json({ error: "AUTH_REQUIRED" }, { status: 401 });

  const { tagId } = await ctx.params;
  const db = getServiceRoleClient();
  if (!db) return NextResponse.json({ error: "NO_DB_CLIENT" }, { status: 500 });

  const { data: room } = await db
    .from("school_rooms")
    .select("id, school_id")
    .eq("nfc_tag_id", tagId)
    .maybeSingle();
  if (!room) return NextResponse.json({ error: "UNKNOWN_TAG" }, { status: 404 });

  const nowIso = new Date().toISOString();
  const { data: slots } = await db
    .from("school_planning_slots")
    .select("id, class_id, starts_at, ends_at, duration_hours")
    .eq("room_id", room.id)
    .lte("starts_at", nowIso)
    .gte("ends_at", nowIso)
    .neq("status", "cancelled");

  const slotIds = (slots ?? []).map((s: { id: string }) => s.id);
  if (!slotIds.length) return NextResponse.json({ error: "NO_ACTIVE_SLOT" }, { status: 404 });

  const { data: sessions } = await db
    .from("school_attendance_sessions")
    .select("*")
    .in("slot_id", slotIds)
    .in("status", ["checkin_open", "checkout_open"])
    .order("updated_at", { ascending: false })
    .limit(1);
  const attSession = sessions?.[0];
  if (!attSession) return NextResponse.json({ error: "NO_OPEN_SESSION" }, { status: 404 });

  const slot = (slots ?? []).find((s: { id: string }) => s.id === attSession.slot_id);
  if (!slot) return NextResponse.json({ error: "SLOT_NOT_FOUND" }, { status: 404 });

  const { data: enrollment } = await db
    .from("class_enrollments")
    .select("student_id")
    .eq("class_id", slot.class_id)
    .eq("student_id", auth.id)
    .maybeSingle();
  if (!enrollment) return NextResponse.json({ error: "NOT_ENROLLED" }, { status: 403 });

  const phase = attSession.status === "checkout_open" ? "checkout" : "checkin";
  const now = nowIso;
  const { data: existing } = await db
    .from("school_attendance_records")
    .select("*")
    .eq("session_id", attSession.id)
    .eq("learner_id", auth.id)
    .maybeSingle();

  if (phase === "checkin") {
    if (existing?.checkin_at) {
      return NextResponse.json({ error: "ALREADY_CHECKED_IN" }, { status: 409 });
    }
    const payload = {
      school_id: attSession.school_id,
      session_id: attSession.id,
      slot_id: attSession.slot_id,
      learner_id: auth.id,
      checkin_at: now,
      checkin_method: "nfc",
      expected_hours: Number(slot.duration_hours ?? 0),
      status: "incomplete",
      updated_at: now,
    };
    const { data: rec } = existing
      ? await db.from("school_attendance_records").update(payload).eq("id", existing.id).select("id").single()
      : await db.from("school_attendance_records").insert(payload).select("id").single();
    await db.from("school_attendance_events").insert({
      school_id: attSession.school_id,
      session_id: attSession.id,
      record_id: rec?.id,
      learner_id: auth.id,
      phase: "checkin",
      method: "nfc",
      success: true,
      meta: { tag_id: tagId, room_id: room.id },
    });
    return NextResponse.json({ ok: true, phase: "checkin", method: "nfc" });
  }

  if (!existing?.checkin_at) {
    return NextResponse.json({ error: "CHECKIN_REQUIRED_FIRST" }, { status: 400 });
  }
  if (existing.checkout_at) {
    return NextResponse.json({ error: "ALREADY_CHECKED_OUT" }, { status: 409 });
  }

  const status = deriveAttendanceStatus({
    checkinAt: existing.checkin_at,
    checkoutAt: now,
    slotStartsAt: slot.starts_at,
    slotEndsAt: slot.ends_at,
    closed: false,
  });
  await db
    .from("school_attendance_records")
    .update({
      checkout_at: now,
      checkout_method: "nfc",
      status,
      updated_at: now,
    })
    .eq("id", existing.id);
  await db.from("school_attendance_events").insert({
    school_id: attSession.school_id,
    session_id: attSession.id,
    record_id: existing.id,
    learner_id: auth.id,
    phase: "checkout",
    method: "nfc",
    success: true,
    meta: { tag_id: tagId, room_id: room.id },
  });
  return NextResponse.json({ ok: true, phase: "checkout", status, method: "nfc" });
}
