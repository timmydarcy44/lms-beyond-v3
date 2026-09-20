import { NextResponse } from "next/server";

import { getSession } from "@/lib/auth/session";
import {
  defaultCheckinWindow,
  defaultCheckoutWindow,
  deriveAttendanceStatus,
  generateAttendanceToken,
  generateSessionCode,
  hashAttendanceToken,
  hashSessionCode,
  minutesBetween,
  QR_TTL_MINUTES,
  SESSION_CODE_TTL_MINUTES,
} from "@/lib/ecole/attendance";
import { sendSms } from "@/lib/ecole/sms";
import { appOrigin } from "@/lib/onboarding/slug";
import { getServerClient, getServiceRoleClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

async function resolveFormateurDb() {
  const session = await getSession();
  if (!session?.id) return { error: NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 }) };
  const supabase = await getServerClient();
  if (!supabase) return { error: NextResponse.json({ error: "NO_DB_CLIENT" }, { status: 500 }) };
  const db = getServiceRoleClient() ?? supabase;
  return { session, db };
}

/** Liste des créneaux formateur + session d'émargement. */
export async function GET(req: Request) {
  const ctx = await resolveFormateurDb();
  if ("error" in ctx && ctx.error) return ctx.error;
  const { session, db } = ctx as {
    session: { id: string };
    db: NonNullable<ReturnType<typeof getServiceRoleClient>> | Awaited<ReturnType<typeof getServerClient>>;
  };

  const url = new URL(req.url);
  const slotId = url.searchParams.get("slotId");

  // Formateur lié via school_instructors.profile_id, id, ou email
  const email = (session.email ?? "").trim().toLowerCase();
  let instructorQuery = db.from("school_instructors").select("id, school_id");
  if (email) {
    instructorQuery = instructorQuery.or(
      `profile_id.eq.${session.id},id.eq.${session.id},email.ilike.${email}`,
    );
  } else {
    instructorQuery = instructorQuery.or(`profile_id.eq.${session.id},id.eq.${session.id}`);
  }
  const { data: instructorRows } = await instructorQuery;

  const instructorIds = (instructorRows ?? []).map((r: { id: string }) => r.id);
  if (!instructorIds.length && !slotId) {
    return NextResponse.json({ slots: [], sessions: [] });
  }

  let slotsQuery = db
    .from("school_planning_slots")
    .select(
      `
      id, starts_at, ends_at, duration_hours, status, class_id, module_id, instructor_id, school_id,
      module:school_planning_modules(id, name),
      class:school_classes(id, name)
    `,
    )
    .neq("status", "cancelled")
    .order("starts_at", { ascending: true });

  if (slotId) slotsQuery = slotsQuery.eq("id", slotId);
  else slotsQuery = slotsQuery.in("instructor_id", instructorIds).gte("starts_at", new Date(Date.now() - 7 * 86400000).toISOString());

  const { data: slots, error } = await slotsQuery.limit(80);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  const slotIds = (slots ?? []).map((s: { id: string }) => s.id);
  const { data: sessions } = slotIds.length
    ? await db.from("school_attendance_sessions").select("*").in("slot_id", slotIds)
    : { data: [] };

  return NextResponse.json({ slots: slots ?? [], sessions: sessions ?? [] });
}

/** Ouvrir / fermer une session, générer QR, corriger un statut. */
export async function POST(req: Request) {
  const ctx = await resolveFormateurDb();
  if ("error" in ctx && ctx.error) return ctx.error;
  const { session, db } = ctx as {
    session: { id: string };
    db: NonNullable<ReturnType<typeof getServiceRoleClient>> | Awaited<ReturnType<typeof getServerClient>>;
  };

  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const action = String(body.action ?? "");

  if (action === "open_session") {
    const slotId = String(body.slot_id ?? "").trim();
    if (!slotId) return NextResponse.json({ error: "SLOT_REQUIRED" }, { status: 400 });

    const { data: slot } = await db
      .from("school_planning_slots")
      .select("*")
      .eq("id", slotId)
      .maybeSingle();
    if (!slot) return NextResponse.json({ error: "SLOT_NOT_FOUND" }, { status: 404 });

    const checkin = defaultCheckinWindow(slot.starts_at);
    const checkout = defaultCheckoutWindow(slot.ends_at);

    const { data: existing } = await db
      .from("school_attendance_sessions")
      .select("*")
      .eq("slot_id", slotId)
      .maybeSingle();

    let sessionRow = existing;
    if (!sessionRow) {
      const { data: created, error } = await db
        .from("school_attendance_sessions")
        .insert({
          school_id: slot.school_id,
          slot_id: slotId,
          status: "checkin_open",
          checkin_opens_at: checkin.opens.toISOString(),
          checkin_closes_at: checkin.closes.toISOString(),
          checkout_opens_at: checkout.opens.toISOString(),
          checkout_closes_at: checkout.closes.toISOString(),
          opened_by: session.id,
        })
        .select("*")
        .single();
      if (error) return NextResponse.json({ error: error.message }, { status: 400 });
      sessionRow = created;
    } else {
      await db
        .from("school_attendance_sessions")
        .update({
          status: "checkin_open",
          checkin_opens_at: checkin.opens.toISOString(),
          checkin_closes_at: checkin.closes.toISOString(),
          checkout_opens_at: checkout.opens.toISOString(),
          checkout_closes_at: checkout.closes.toISOString(),
          opened_by: session.id,
          updated_at: new Date().toISOString(),
        })
        .eq("id", sessionRow.id);
      sessionRow = { ...sessionRow, status: "checkin_open" };
    }

    // Pré-créer les records pour les apprenants de la classe
    const { data: enrollments } = await db
      .from("class_enrollments")
      .select("student_id")
      .eq("class_id", slot.class_id);

    const learnerIds = [...new Set((enrollments ?? []).map((e: { student_id: string }) => e.student_id))];
    if (learnerIds.length) {
      const rows = learnerIds.map((learnerId) => ({
        school_id: slot.school_id,
        session_id: sessionRow!.id,
        slot_id: slotId,
        learner_id: learnerId,
        status: "not_signed",
        expected_hours: Number(slot.duration_hours ?? 0),
      }));
      await db.from("school_attendance_records").upsert(rows, {
        onConflict: "session_id,learner_id",
        ignoreDuplicates: true,
      });
    }

    // QR check-in
    const token = generateAttendanceToken();
    const expires = new Date(Date.now() + QR_TTL_MINUTES * 60_000);
    await db
      .from("school_attendance_qr_tokens")
      .update({ revoked_at: new Date().toISOString() })
      .eq("session_id", sessionRow.id)
      .eq("phase", "checkin")
      .is("revoked_at", null);

    await db.from("school_attendance_qr_tokens").insert({
      session_id: sessionRow.id,
      school_id: slot.school_id,
      phase: "checkin",
      token_hash: hashAttendanceToken(token),
      expires_at: expires.toISOString(),
      created_by: session.id,
    });

    const origin = appOrigin();

    return NextResponse.json({
      session: sessionRow,
      phase: "checkin",
      qr_token: token,
      qr_url: `${origin.replace(/\/$/, "")}/emarger/${token}`,
      expires_at: expires.toISOString(),
      learners_count: learnerIds.length,
    });
  }

  if (action === "open_checkout") {
    const sessionId = String(body.session_id ?? "").trim();
    if (!sessionId) return NextResponse.json({ error: "SESSION_REQUIRED" }, { status: 400 });
    const { data: attSession } = await db
      .from("school_attendance_sessions")
      .select("*")
      .eq("id", sessionId)
      .maybeSingle();
    if (!attSession) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });

    await db
      .from("school_attendance_sessions")
      .update({ status: "checkout_open", updated_at: new Date().toISOString() })
      .eq("id", sessionId);

    const token = generateAttendanceToken();
    const expires = new Date(Date.now() + QR_TTL_MINUTES * 60_000);
    await db
      .from("school_attendance_qr_tokens")
      .update({ revoked_at: new Date().toISOString() })
      .eq("session_id", sessionId)
      .eq("phase", "checkout")
      .is("revoked_at", null);
    await db.from("school_attendance_qr_tokens").insert({
      session_id: sessionId,
      school_id: attSession.school_id,
      phase: "checkout",
      token_hash: hashAttendanceToken(token),
      expires_at: expires.toISOString(),
      created_by: session.id,
    });

    const origin = appOrigin();

    return NextResponse.json({
      phase: "checkout",
      qr_token: token,
      qr_url: `${origin.replace(/\/$/, "")}/emarger/${token}`,
      expires_at: expires.toISOString(),
    });
  }

  if (action === "close_session") {
    const sessionId = String(body.session_id ?? "").trim();
    if (!sessionId) return NextResponse.json({ error: "SESSION_REQUIRED" }, { status: 400 });

    const { data: attSession } = await db
      .from("school_attendance_sessions")
      .select("*")
      .eq("id", sessionId)
      .maybeSingle();
    if (!attSession) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });

    const { data: slot } = await db
      .from("school_planning_slots")
      .select("*")
      .eq("id", attSession.slot_id)
      .maybeSingle();

    const { data: records } = await db
      .from("school_attendance_records")
      .select("*")
      .eq("session_id", sessionId);

    let absencesCreated = 0;
    for (const rec of records ?? []) {
      const status = deriveAttendanceStatus({
        checkinAt: rec.checkin_at,
        checkoutAt: rec.checkout_at,
        slotStartsAt: slot?.starts_at ?? "",
        slotEndsAt: slot?.ends_at ?? "",
        closed: true,
      });

      const patch: Record<string, unknown> = {
        status,
        updated_at: new Date().toISOString(),
      };
      if (rec.checkin_at && slot?.starts_at) {
        const late = minutesBetween(slot.starts_at, rec.checkin_at);
        patch.minutes_late = late > 0 ? late : 0;
      }
      if (rec.checkout_at && slot?.ends_at) {
        const early = minutesBetween(rec.checkout_at, slot.ends_at);
        patch.minutes_early_leave = early > 0 ? early : 0;
      }

      // Absence auto si aucun émargement valide
      if (status === "absent" || status === "not_signed") {
        const duration = Number(slot?.duration_hours ?? rec.expected_hours ?? 0);
        if (duration > 0) {
          const { data: absence } = await db
            .from("school_absences")
            .upsert(
              {
                school_id: attSession.school_id,
                slot_id: attSession.slot_id,
                learner_id: rec.learner_id,
                kind: "full",
                duration_hours: duration,
                status: "to_justify",
                source: "attendance_auto",
                updated_at: new Date().toISOString(),
              },
              { onConflict: "slot_id,learner_id" },
            )
            .select("id")
            .maybeSingle();
          if (absence?.id) {
            patch.absence_id = absence.id;
            patch.status = "absent";
            absencesCreated += 1;
            await db.from("school_absence_status_history").insert({
              absence_id: absence.id,
              from_status: null,
              to_status: "to_justify",
              changed_by: session.id,
              note: "Absence automatique — aucun émargement valide",
            });
          }
        }
      }

      await db.from("school_attendance_records").update(patch).eq("id", rec.id);
    }

    await db
      .from("school_attendance_sessions")
      .update({
        status: "closed",
        closed_at: new Date().toISOString(),
        closed_by: session.id,
        updated_at: new Date().toISOString(),
      })
      .eq("id", sessionId);

    await db
      .from("school_attendance_qr_tokens")
      .update({ revoked_at: new Date().toISOString() })
      .eq("session_id", sessionId)
      .is("revoked_at", null);

    return NextResponse.json({ ok: true, absences_created: absencesCreated });
  }

  if (action === "generate_code") {
    const sessionId = String(body.session_id ?? "").trim();
    const phase = String(body.phase ?? "checkin") === "checkout" ? "checkout" : "checkin";
    if (!sessionId) return NextResponse.json({ error: "SESSION_REQUIRED" }, { status: 400 });
    const { data: attSession } = await db
      .from("school_attendance_sessions")
      .select("*")
      .eq("id", sessionId)
      .maybeSingle();
    if (!attSession) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });

    const code = generateSessionCode();
    const expires = new Date(Date.now() + SESSION_CODE_TTL_MINUTES * 60_000);
    await db
      .from("school_attendance_session_codes")
      .update({ revoked_at: new Date().toISOString() })
      .eq("session_id", sessionId)
      .eq("phase", phase)
      .is("revoked_at", null);
    await db.from("school_attendance_session_codes").insert({
      session_id: sessionId,
      school_id: attSession.school_id,
      phase,
      code_hash: hashSessionCode(code),
      code_hint: `${code.slice(0, 2)}****`,
      expires_at: expires.toISOString(),
      created_by: session.id,
    });

    return NextResponse.json({
      code,
      phase,
      expires_at: expires.toISOString(),
      ttl_minutes: SESSION_CODE_TTL_MINUTES,
    });
  }

  if (action === "send_sms_codes") {
    const sessionId = String(body.session_id ?? "").trim();
    const phase = String(body.phase ?? "checkin") === "checkout" ? "checkout" : "checkin";
    if (!sessionId) return NextResponse.json({ error: "SESSION_REQUIRED" }, { status: 400 });
    const { data: attSession } = await db
      .from("school_attendance_sessions")
      .select("*")
      .eq("id", sessionId)
      .maybeSingle();
    if (!attSession) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });

    const code = generateSessionCode();
    const expires = new Date(Date.now() + SESSION_CODE_TTL_MINUTES * 60_000);
    await db.from("school_attendance_session_codes").insert({
      session_id: sessionId,
      school_id: attSession.school_id,
      phase,
      code_hash: hashSessionCode(code),
      code_hint: `${code.slice(0, 2)}****`,
      expires_at: expires.toISOString(),
      created_by: session.id,
    });

    const { data: records } = await db
      .from("school_attendance_records")
      .select("learner_id")
      .eq("session_id", sessionId);
    const learnerIds = (records ?? []).map((r: { learner_id: string }) => r.learner_id);
    const { data: profiles } = learnerIds.length
      ? await db
          .from("profiles")
          .select("id, phone, telephone, phone_number")
          .in("id", learnerIds)
      : { data: [] };

    let sent = 0;
    const failures: string[] = [];
    for (const p of profiles ?? []) {
      const phone = String(
        (p as { phone?: string }).phone ||
          (p as { telephone?: string }).telephone ||
          (p as { phone_number?: string }).phone_number ||
          "",
      ).trim();
      if (!phone) {
        failures.push(String((p as { id: string }).id));
        continue;
      }
      const sms = await sendSms({
        to: phone,
        body: `EDGE émargement ${phase === "checkout" ? "sortie" : "entrée"} — code ${code} (valable ${SESSION_CODE_TTL_MINUTES} min)`,
        meta: { session_id: sessionId, learner_id: (p as { id: string }).id, method: "sms_code" },
      });
      await db.from("school_attendance_events").insert({
        school_id: attSession.school_id,
        session_id: sessionId,
        learner_id: (p as { id: string }).id,
        phase,
        method: "sms_code",
        success: sms.ok,
        meta: { simulated: sms.simulated ?? false, provider: sms.provider },
      });
      if (sms.ok) sent += 1;
      else failures.push(phone);
    }

    return NextResponse.json({
      code_generated: true,
      sent,
      failures: failures.slice(0, 20),
      expires_at: expires.toISOString(),
      // code renvoyé au formateur pour affichage ; SMS part aussi
      code,
    });
  }

  if (action === "correct_status") {
    const recordId = String(body.record_id ?? "").trim();
    const toStatus = String(body.status ?? "").trim();
    const reason = body.reason ? String(body.reason) : null;
    if (!recordId || !toStatus) {
      return NextResponse.json({ error: "MISSING_FIELDS" }, { status: 400 });
    }

    const { data: rec } = await db
      .from("school_attendance_records")
      .select("*")
      .eq("id", recordId)
      .maybeSingle();
    if (!rec) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });

    await db
      .from("school_attendance_records")
      .update({ status: toStatus, updated_at: new Date().toISOString() })
      .eq("id", recordId);

    await db.from("school_attendance_corrections").insert({
      record_id: recordId,
      school_id: rec.school_id,
      changed_by: session.id,
      from_status: rec.status,
      to_status: toStatus,
      reason,
    });

    // Si correction vers présent : ne pas supprimer l'absence justifiée éventuelle,
    // mais si absence auto to_justify liée → marquer source corrected / garder historique
    if (["present", "late", "early_leave", "partial"].includes(toStatus) && rec.absence_id) {
      await db
        .from("school_absences")
        .update({
          source: "attendance_corrected",
          admin_note: reason || "Corrigé par le formateur (présent)",
          updated_at: new Date().toISOString(),
        })
        .eq("id", rec.absence_id);
    }

    return NextResponse.json({ ok: true });
  }

  if (action === "list_records") {
    const sessionId = String(body.session_id ?? body.slot_id ?? "").trim();
    let q = db.from("school_attendance_records").select(
      `
      *,
      learner:profiles!school_attendance_records_learner_id_fkey(id, first_name, last_name, email, full_name)
    `,
    );
    if (body.session_id) q = q.eq("session_id", String(body.session_id));
    else if (body.slot_id) q = q.eq("slot_id", String(body.slot_id));
    else return NextResponse.json({ error: "SESSION_OR_SLOT_REQUIRED" }, { status: 400 });

    const { data, error } = await q.order("created_at");
    if (error) {
      const simple = await db
        .from("school_attendance_records")
        .select("*")
        .eq(body.session_id ? "session_id" : "slot_id", sessionId);
      return NextResponse.json({ records: simple.data ?? [], warning: error.message });
    }
    return NextResponse.json({ records: data ?? [] });
  }

  return NextResponse.json({ error: "UNKNOWN_ACTION" }, { status: 400 });
}
