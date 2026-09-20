import { NextResponse } from "next/server";

import { resolveSchoolIdForEcoleDashboard } from "@/lib/auth/school-access";
import { getSession } from "@/lib/auth/session";
import { detectSlotConflicts, hoursBetween } from "@/lib/ecole/planning-utils";
import { getServerClient, getServiceRoleClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

async function schoolDb() {
  const session = await getSession();
  if (!session?.id) return { error: NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 }) };
  const supabase = await getServerClient();
  if (!supabase) return { error: NextResponse.json({ error: "NO_DB_CLIENT" }, { status: 500 }) };
  const schoolId = await resolveSchoolIdForEcoleDashboard(session.id, session.email, supabase);
  if (!schoolId) return { error: NextResponse.json({ error: "NO_SCHOOL" }, { status: 403 }) };
  return { schoolId, db: getServiceRoleClient() ?? supabase };
}

export async function PATCH(req: Request, ctx: Ctx) {
  const gate = await schoolDb();
  if ("error" in gate && gate.error) return gate.error;
  const { schoolId, db } = gate as { schoolId: string; db: NonNullable<ReturnType<typeof getServiceRoleClient>> };
  const { id } = await ctx.params;

  const { data: current, error: curErr } = await db
    .from("school_planning_slots")
    .select("*")
    .eq("id", id)
    .eq("school_id", schoolId)
    .maybeSingle();
  if (curErr || !current) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });

  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const startsAt = body.starts_at != null ? String(body.starts_at) : String(current.starts_at);
  const endsAt = body.ends_at != null ? String(body.ends_at) : String(current.ends_at);
  const duration = hoursBetween(startsAt, endsAt);
  if (duration <= 0) return NextResponse.json({ error: "INVALID_RANGE" }, { status: 400 });

  const next = {
    class_id: body.class_id != null ? String(body.class_id) : String(current.class_id),
    module_id: body.module_id != null ? String(body.module_id) : String(current.module_id),
    instructor_id:
      body.instructor_id === null
        ? null
        : body.instructor_id != null
          ? String(body.instructor_id)
          : (current.instructor_id as string | null),
    room_id:
      body.room_id === null
        ? null
        : body.room_id != null
          ? String(body.room_id)
          : (current.room_id as string | null),
    starts_at: startsAt,
    ends_at: endsAt,
    duration_hours: duration,
    notes: body.notes != null ? String(body.notes) : (current.notes as string | null),
    status: body.status != null ? String(body.status) : String(current.status ?? "scheduled"),
    updated_at: new Date().toISOString(),
  };

  const { data: existing } = await db
    .from("school_planning_slots")
    .select("id, instructor_id, class_id, room_id, module_id, starts_at, ends_at, duration_hours, status")
    .eq("school_id", schoolId)
    .neq("status", "cancelled");

  const { data: moduleRow } = await db
    .from("school_planning_modules")
    .select("planned_hours_total")
    .eq("id", next.module_id)
    .maybeSingle();

  const plannedExcluding = (existing ?? [])
    .filter(
      (s: { id?: string; module_id?: string; status?: string }) =>
        s.module_id === next.module_id && s.status !== "cancelled" && s.id !== id,
    )
    .reduce((acc: number, s: { duration_hours?: number }) => acc + Number(s.duration_hours ?? 0), 0);

  const conflicts = detectSlotConflicts({
    candidate: { id, ...next },
    existing: (existing ?? []) as Array<{
      id: string;
      instructor_id?: string | null;
      class_id: string;
      room_id?: string | null;
      module_id: string;
      starts_at: string;
      ends_at: string;
      duration_hours: number;
      status?: string;
    }>,
    moduleTotalHours: Number((moduleRow as { planned_hours_total?: number } | null)?.planned_hours_total ?? 0),
    modulePlannedHoursExcludingCandidate: plannedExcluding,
  });

  if (conflicts.length > 0 && !body.force) {
    return NextResponse.json({ error: "CONFLICT", conflicts }, { status: 409 });
  }

  const { data: slot, error } = await db
    .from("school_planning_slots")
    .update(next)
    .eq("id", id)
    .eq("school_id", schoolId)
    .select("*")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ slot });
}

export async function DELETE(_req: Request, ctx: Ctx) {
  const gate = await schoolDb();
  if ("error" in gate && gate.error) return gate.error;
  const { schoolId, db } = gate as { schoolId: string; db: NonNullable<ReturnType<typeof getServiceRoleClient>> };
  const { id } = await ctx.params;

  // Soft-delete → restitue automatiquement les heures (exclues des sommes status != cancelled)
  const { data: slot, error } = await db
    .from("school_planning_slots")
    .update({ status: "cancelled", updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("school_id", schoolId)
    .select("*")
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  if (!slot) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  return NextResponse.json({ slot });
}
