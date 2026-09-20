import { NextResponse } from "next/server";

import { getSession } from "@/lib/auth/session";
import { getServerClient, getServiceRoleClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

/** Planning lecture seule de l’apprenant (créneaux de ses classes). */
export async function GET(req: Request) {
  const session = await getSession();
  if (!session?.id) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });

  const supabase = await getServerClient();
  if (!supabase) return NextResponse.json({ error: "NO_DB_CLIENT" }, { status: 500 });
  const db = getServiceRoleClient() ?? supabase;

  const url = new URL(req.url);
  const from = url.searchParams.get("from");
  const to = url.searchParams.get("to");

  const { data: enrollments } = await db
    .from("class_enrollments")
    .select("class_id")
    .eq("student_id", session.id);

  const classIds = [...new Set((enrollments ?? []).map((e: { class_id?: string }) => String(e.class_id ?? "")).filter(Boolean))];

  if (classIds.length === 0) {
    // Fallback : classes liées via school_id + school_class label
    const { data: profile } = await db
      .from("profiles")
      .select("school_id, school_class")
      .eq("id", session.id)
      .maybeSingle();
    const schoolId = String((profile as { school_id?: string } | null)?.school_id ?? "").trim();
    const schoolClass = String((profile as { school_class?: string } | null)?.school_class ?? "").trim();
    if (schoolId && schoolClass) {
      const { data: classes } = await db
        .from("school_classes")
        .select("id")
        .eq("school_id", schoolId)
        .ilike("name", schoolClass);
      for (const c of classes ?? []) classIds.push(String((c as { id?: string }).id));
    }
  }

  if (classIds.length === 0) {
    return NextResponse.json({ slots: [], classIds: [] });
  }

  let q = db
    .from("school_planning_slots")
    .select(
      `
      id, starts_at, ends_at, duration_hours, status, notes,
      class_id,
      module:school_planning_modules(id, name, code),
      instructor:school_instructors!school_planning_slots_instructor_id_fkey(id, first_name, last_name, email),
      room:school_rooms(id, name),
      class:school_classes(id, name)
    `,
    )
    .in("class_id", classIds)
    .neq("status", "cancelled")
    .order("starts_at", { ascending: true });

  if (from) q = q.gte("starts_at", from);
  if (to) q = q.lte("starts_at", to);

  const { data: slots, error } = await q;
  if (error) {
    // Fallback sans jointures typées si FK names mismatch
    const simple = await db
      .from("school_planning_slots")
      .select("id, starts_at, ends_at, duration_hours, status, notes, class_id, module_id, instructor_id, room_id")
      .in("class_id", classIds)
      .neq("status", "cancelled")
      .order("starts_at", { ascending: true });
    return NextResponse.json({ slots: simple.data ?? [], classIds, warning: error.message });
  }

  return NextResponse.json({ slots: slots ?? [], classIds });
}
