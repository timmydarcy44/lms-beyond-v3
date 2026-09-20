import { NextResponse } from "next/server";

import { getSession } from "@/lib/auth/session";
import {
  deriveAttendanceStatus,
  hashSessionCode,
} from "@/lib/ecole/attendance";
import { getServiceRoleClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

/** Valider un code temporaire (affiché ou reçu par SMS). */
export async function POST(req: Request) {
  const session = await getSession();
  if (!session?.id) {
    return NextResponse.json({ error: "AUTH_REQUIRED" }, { status: 401 });
  }

  const db = getServiceRoleClient();
  if (!db) return NextResponse.json({ error: "NO_DB_CLIENT" }, { status: 500 });

  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const code = String(body.code ?? "").trim();
  const method = String(body.method ?? "session_code") === "sms_code" ? "sms_code" : "session_code";
  if (!/^\d{6}$/.test(code)) {
    return NextResponse.json({ error: "INVALID_CODE" }, { status: 400 });
  }

  const codeHash = hashSessionCode(code);
  const { data: row } = await db
    .from("school_attendance_session_codes")
    .select("*")
    .eq("code_hash", codeHash)
    .is("revoked_at", null)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!row) return NextResponse.json({ error: "INVALID_CODE" }, { status: 404 });
  if (new Date(row.expires_at).getTime() < Date.now()) {
    return NextResponse.json({ error: "EXPIRED" }, { status: 410 });
  }

  const { data: attSession } = await db
    .from("school_attendance_sessions")
    .select("*")
    .eq("id", row.session_id)
    .maybeSingle();
  if (!attSession || attSession.status === "closed") {
    return NextResponse.json({ error: "SESSION_CLOSED" }, { status: 400 });
  }

  const phase = row.phase as "checkin" | "checkout";
  if (phase === "checkin" && attSession.status !== "checkin_open") {
    return NextResponse.json({ error: "CHECKIN_NOT_OPEN" }, { status: 400 });
  }
  if (phase === "checkout" && attSession.status !== "checkout_open") {
    return NextResponse.json({ error: "CHECKOUT_NOT_OPEN" }, { status: 400 });
  }

  const { data: slot } = await db
    .from("school_planning_slots")
    .select("id, class_id, starts_at, ends_at, duration_hours")
    .eq("id", attSession.slot_id)
    .maybeSingle();
  if (!slot) return NextResponse.json({ error: "SLOT_NOT_FOUND" }, { status: 404 });

  const { data: enrollment } = await db
    .from("class_enrollments")
    .select("student_id")
    .eq("class_id", slot.class_id)
    .eq("student_id", session.id)
    .maybeSingle();
  if (!enrollment) return NextResponse.json({ error: "NOT_ENROLLED" }, { status: 403 });

  const now = new Date().toISOString();
  const { data: existing } = await db
    .from("school_attendance_records")
    .select("*")
    .eq("session_id", attSession.id)
    .eq("learner_id", session.id)
    .maybeSingle();

  if (phase === "checkin") {
    if (existing?.checkin_at) {
      await db.from("school_attendance_events").insert({
        school_id: attSession.school_id,
        session_id: attSession.id,
        record_id: existing.id,
        learner_id: session.id,
        phase,
        method,
        success: false,
        meta: { reason: "already_checked_in" },
      });
      return NextResponse.json({ error: "ALREADY_CHECKED_IN" }, { status: 409 });
    }
    const payload = {
      school_id: attSession.school_id,
      session_id: attSession.id,
      slot_id: attSession.slot_id,
      learner_id: session.id,
      checkin_at: now,
      checkin_method: method,
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
      record_id: rec?.id ?? null,
      learner_id: session.id,
      phase,
      method,
      success: true,
    });
    return NextResponse.json({ ok: true, phase, status: "Présent (entrée)", method });
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
      checkout_method: method,
      status,
      updated_at: now,
    })
    .eq("id", existing.id);

  await db.from("school_attendance_events").insert({
    school_id: attSession.school_id,
    session_id: attSession.id,
    record_id: existing.id,
    learner_id: session.id,
    phase,
    method,
    success: true,
  });

  return NextResponse.json({ ok: true, phase, status, method });
}
