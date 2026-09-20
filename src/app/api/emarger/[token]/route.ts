import { NextResponse } from "next/server";

import { getSession } from "@/lib/auth/session";
import { deriveAttendanceStatus, hashAttendanceToken } from "@/lib/ecole/attendance";
import { getServiceRoleClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ token: string }> };

export async function GET(_req: Request, ctx: Ctx) {
  const { token } = await ctx.params;
  const db = getServiceRoleClient();
  if (!db) return NextResponse.json({ error: "NO_DB_CLIENT" }, { status: 500 });

  const session = await getSession();
  const tokenHash = hashAttendanceToken(token);

  const { data: qr } = await db
    .from("school_attendance_qr_tokens")
    .select("*")
    .eq("token_hash", tokenHash)
    .is("revoked_at", null)
    .maybeSingle();

  if (!qr) return NextResponse.json({ error: "INVALID_TOKEN" }, { status: 404 });
  if (new Date(qr.expires_at).getTime() < Date.now()) {
    return NextResponse.json({ error: "EXPIRED" }, { status: 410 });
  }

  const { data: attSession } = await db
    .from("school_attendance_sessions")
    .select("*")
    .eq("id", qr.session_id)
    .maybeSingle();
  if (!attSession) return NextResponse.json({ error: "SESSION_NOT_FOUND" }, { status: 404 });

  const { data: slot } = await db
    .from("school_planning_slots")
    .select(
      `
      id, starts_at, ends_at, duration_hours, class_id,
      module:school_planning_modules(name),
      class:school_classes(name),
      instructor:school_instructors(first_name, last_name)
    `,
    )
    .eq("id", attSession.slot_id)
    .maybeSingle();

  return NextResponse.json({
    authenticated: Boolean(session?.id),
    phase: qr.phase,
    expires_at: qr.expires_at,
    session_status: attSession.status,
    slot,
  });
}

/** Scan QR — exige authentification EDGE. */
export async function POST(_req: Request, ctx: Ctx) {
  const session = await getSession();
  if (!session?.id) {
    return NextResponse.json({ error: "AUTH_REQUIRED" }, { status: 401 });
  }

  const { token } = await ctx.params;
  const db = getServiceRoleClient();
  if (!db) return NextResponse.json({ error: "NO_DB_CLIENT" }, { status: 500 });

  const tokenHash = hashAttendanceToken(token);
  const { data: qr } = await db
    .from("school_attendance_qr_tokens")
    .select("*")
    .eq("token_hash", tokenHash)
    .is("revoked_at", null)
    .maybeSingle();

  if (!qr) return NextResponse.json({ error: "INVALID_TOKEN" }, { status: 404 });
  if (new Date(qr.expires_at).getTime() < Date.now()) {
    return NextResponse.json({ error: "EXPIRED" }, { status: 410 });
  }

  const { data: attSession } = await db
    .from("school_attendance_sessions")
    .select("*")
    .eq("id", qr.session_id)
    .maybeSingle();
  if (!attSession || attSession.status === "closed") {
    return NextResponse.json({ error: "SESSION_CLOSED" }, { status: 400 });
  }

  const phase = qr.phase as "checkin" | "checkout";
  if (phase === "checkin" && attSession.status !== "checkin_open") {
    return NextResponse.json({ error: "CHECKIN_NOT_OPEN" }, { status: 400 });
  }
  if (phase === "checkout" && attSession.status !== "checkout_open") {
    return NextResponse.json({ error: "CHECKOUT_NOT_OPEN" }, { status: 400 });
  }

  // Vérifier inscription à la classe
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

  if (!enrollment) {
    return NextResponse.json({ error: "NOT_ENROLLED" }, { status: 403 });
  }

  const now = new Date().toISOString();
  const { data: existing } = await db
    .from("school_attendance_records")
    .select("*")
    .eq("session_id", attSession.id)
    .eq("learner_id", session.id)
    .maybeSingle();

  if (phase === "checkin") {
    if (existing?.checkin_at) {
      return NextResponse.json({ error: "ALREADY_CHECKED_IN", status: existing.status }, { status: 409 });
    }
    const row = {
      school_id: attSession.school_id,
      session_id: attSession.id,
      slot_id: attSession.slot_id,
      learner_id: session.id,
      checkin_at: now,
      checkin_method: "qr",
      expected_hours: Number(slot.duration_hours ?? 0),
      status: "incomplete",
      updated_at: now,
    };
    if (existing) {
      await db.from("school_attendance_records").update(row).eq("id", existing.id);
    } else {
      await db.from("school_attendance_records").insert(row);
    }
    return NextResponse.json({ ok: true, phase: "checkin", status: "Présent (entrée)", at: now });
  }

  // checkout
  if (!existing?.checkin_at) {
    // Sortie sans entrée → incomplet, enregistre quand même
    await db.from("school_attendance_records").upsert(
      {
        school_id: attSession.school_id,
        session_id: attSession.id,
        slot_id: attSession.slot_id,
        learner_id: session.id,
        checkout_at: now,
        checkout_method: "qr",
        status: "incomplete",
        expected_hours: Number(slot.duration_hours ?? 0),
        updated_at: now,
      },
      { onConflict: "session_id,learner_id" },
    );
    return NextResponse.json({ ok: true, phase: "checkout", status: "Émargement incomplet", at: now });
  }

  if (existing.checkout_at) {
    return NextResponse.json({ error: "ALREADY_CHECKED_OUT", status: existing.status }, { status: 409 });
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
      checkout_method: "qr",
      status,
      updated_at: now,
    })
    .eq("id", existing.id);

  return NextResponse.json({ ok: true, phase: "checkout", status, at: now });
}
