import { NextResponse } from "next/server";

import { resolveSchoolIdForEcoleDashboard } from "@/lib/auth/school-access";
import { getSession } from "@/lib/auth/session";
import { getServerClient, getServiceRoleClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

async function resolveSchoolClient() {
  const session = await getSession();
  if (!session?.id) return { error: NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 }) };
  const supabase = await getServerClient();
  if (!supabase) return { error: NextResponse.json({ error: "NO_DB_CLIENT" }, { status: 500 }) };
  const schoolId = await resolveSchoolIdForEcoleDashboard(session.id, session.email, supabase);
  if (!schoolId) return { error: NextResponse.json({ error: "NO_SCHOOL" }, { status: 403 }) };
  const db = getServiceRoleClient() ?? supabase;
  return { session, schoolId, db };
}

export async function GET(req: Request) {
  const ctx = await resolveSchoolClient();
  if ("error" in ctx && ctx.error) return ctx.error;
  const { schoolId, db } = ctx as {
    schoolId: string;
    db: NonNullable<ReturnType<typeof getServiceRoleClient>> | Awaited<ReturnType<typeof getServerClient>>;
  };

  const url = new URL(req.url);
  const status = url.searchParams.get("status");

  let q = db
    .from("school_absences")
    .select(
      `
      *,
      slot:school_planning_slots(
        id, starts_at, ends_at, duration_hours, class_id, module_id, instructor_id,
        module:school_planning_modules(id, name),
        instructor:school_instructors(id, first_name, last_name),
        class:school_classes(id, name)
      ),
      learner:profiles!school_absences_learner_id_fkey(id, first_name, last_name, email, full_name)
    `,
    )
    .eq("school_id", schoolId)
    .order("created_at", { ascending: false });

  if (status) q = q.eq("status", status);

  const { data, error } = await q;
  if (error) {
    const simple = await db
      .from("school_absences")
      .select("*")
      .eq("school_id", schoolId)
      .order("created_at", { ascending: false });
    return NextResponse.json({ absences: simple.data ?? [], warning: error.message });
  }
  return NextResponse.json({ absences: data ?? [] });
}

/** Enregistrer une absence sur un créneau (durée calculée depuis le slot si full). */
export async function POST(req: Request) {
  const ctx = await resolveSchoolClient();
  if ("error" in ctx && ctx.error) return ctx.error;
  const { session, schoolId, db } = ctx as {
    session: { id: string };
    schoolId: string;
    db: NonNullable<ReturnType<typeof getServiceRoleClient>> | Awaited<ReturnType<typeof getServerClient>>;
  };

  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const slotId = String(body.slot_id ?? "").trim();
  const learnerId = String(body.learner_id ?? "").trim();
  const kind = String(body.kind ?? "full");
  if (!slotId || !learnerId) {
    return NextResponse.json({ error: "MISSING_FIELDS" }, { status: 400 });
  }

  const { data: slot } = await db
    .from("school_planning_slots")
    .select("id, school_id, duration_hours")
    .eq("id", slotId)
    .eq("school_id", schoolId)
    .maybeSingle();
  if (!slot) return NextResponse.json({ error: "SLOT_NOT_FOUND" }, { status: 404 });

  let duration = Number(slot.duration_hours ?? 0);
  if (kind !== "full" && body.duration_hours != null) {
    duration = Number(body.duration_hours);
  }
  if (duration <= 0) return NextResponse.json({ error: "INVALID_DURATION" }, { status: 400 });

  const { data, error } = await db
    .from("school_absences")
    .upsert(
      {
        school_id: schoolId,
        slot_id: slotId,
        learner_id: learnerId,
        kind: ["full", "late", "early_leave", "partial"].includes(kind) ? kind : "full",
        duration_hours: duration,
        status: "to_justify",
        updated_at: new Date().toISOString(),
      },
      { onConflict: "slot_id,learner_id" },
    )
    .select("*")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  await db.from("school_absence_status_history").insert({
    absence_id: data.id,
    from_status: null,
    to_status: "to_justify",
    changed_by: session.id,
    note: "Création absence",
  });

  return NextResponse.json({ absence: data });
}

export async function PATCH(req: Request) {
  const ctx = await resolveSchoolClient();
  if ("error" in ctx && ctx.error) return ctx.error;
  const { session, schoolId, db } = ctx as {
    session: { id: string };
    schoolId: string;
    db: NonNullable<ReturnType<typeof getServiceRoleClient>> | Awaited<ReturnType<typeof getServerClient>>;
  };

  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const absenceId = String(body.id ?? "").trim();
  const action = String(body.action ?? "").trim();
  if (!absenceId) return NextResponse.json({ error: "ID_REQUIRED" }, { status: 400 });

  const { data: current } = await db
    .from("school_absences")
    .select("*")
    .eq("id", absenceId)
    .eq("school_id", schoolId)
    .maybeSingle();
  if (!current) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });

  let nextStatus = String(current.status);
  if (action === "accept") nextStatus = "justified";
  else if (action === "refuse") nextStatus = "to_justify";
  else if (body.status) nextStatus = String(body.status);

  if (!["to_justify", "proof_sent", "justified", "refused"].includes(nextStatus)) {
    return NextResponse.json({ error: "INVALID_STATUS" }, { status: 400 });
  }

  // Refus explicite : marquer refused puis laisser repasser à justifier côté UX
  if (action === "refuse") nextStatus = "refused";

  const patch: Record<string, unknown> = {
    status: nextStatus,
    updated_at: new Date().toISOString(),
    reviewed_by: session.id,
    reviewed_at: new Date().toISOString(),
  };
  if (body.admin_note !== undefined) patch.admin_note = String(body.admin_note);

  const { data, error } = await db
    .from("school_absences")
    .update(patch)
    .eq("id", absenceId)
    .select("*")
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  await db.from("school_absence_status_history").insert({
    absence_id: absenceId,
    from_status: current.status,
    to_status: nextStatus,
    changed_by: session.id,
    note: body.admin_note ? String(body.admin_note) : action || null,
  });

  return NextResponse.json({ absence: data });
}
