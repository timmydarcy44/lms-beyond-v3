import { NextResponse } from "next/server";

import {
  fillPatternWeeks,
  isAlternanceWeekType,
  listWeekStarts,
  startOfIsoWeek,
  toIsoDate,
  type AlternanceWeekType,
} from "@/lib/apprenant/alternance-planning";
import {
  fetchSchoolGateProfile,
  resolveSchoolIdForEcoleDashboard,
  schoolDashboardAllowed,
} from "@/lib/auth/school-access";
import { getSession } from "@/lib/auth/session";
import { getServerClient, getServiceRoleClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

async function assertSchoolAccess(classId: string) {
  const session = await getSession();
  if (!session?.id) return { error: NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 }) };

  const supabase = await getServerClient();
  if (!supabase) return { error: NextResponse.json({ error: "NO_DB_CLIENT" }, { status: 500 }) };
  const db = getServiceRoleClient() ?? supabase;

  const gate = await fetchSchoolGateProfile(session.id, session.email, supabase);
  const ok = schoolDashboardAllowed({
    isDemoSession: session.role === "demo",
    sessionFrontendRole: session.role,
    role: gate?.role ?? "",
    roleType: gate?.roleType ?? "",
    schoolIdPresent: Boolean(gate?.school_id),
    profileRowPresent: Boolean(gate),
  });
  if (!ok) return { error: NextResponse.json({ error: "FORBIDDEN" }, { status: 403 }) };

  const schoolId = await resolveSchoolIdForEcoleDashboard(session.id, session.email, supabase);
  if (!schoolId) return { error: NextResponse.json({ error: "NO_SCHOOL" }, { status: 403 }) };

  const { data: klass } = await db
    .from("school_classes")
    .select(
      "id, name, school_id, formation_starts_on, formation_ends_on, title_label, specialty_label",
    )
    .eq("id", classId)
    .eq("school_id", schoolId)
    .maybeSingle();
  if (!klass) return { error: NextResponse.json({ error: "NOT_FOUND" }, { status: 404 }) };

  return { session, db, schoolId, klass };
}

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ classId: string }> },
) {
  const { classId } = await ctx.params;
  const access = await assertSchoolAccess(classId);
  if ("error" in access && access.error) return access.error;

  const { db, klass } = access as Awaited<ReturnType<typeof assertSchoolAccess>> & {
    db: NonNullable<ReturnType<typeof getServiceRoleClient>>;
    klass: {
      id: string;
      formation_starts_on: string | null;
      formation_ends_on: string | null;
      title_label: string | null;
      specialty_label: string | null;
    };
  };

  const { data: weeks, error } = await db
    .from("alternance_calendar")
    .select("id, week_starts_on, week_type")
    .eq("class_id", classId)
    .order("week_starts_on", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({
    class: klass,
    weeks: weeks ?? [],
  });
}

export async function PATCH(
  req: Request,
  ctx: { params: Promise<{ classId: string }> },
) {
  const { classId } = await ctx.params;
  const access = await assertSchoolAccess(classId);
  if ("error" in access && access.error) return access.error;
  const { db } = access as Awaited<ReturnType<typeof assertSchoolAccess>> & {
    db: NonNullable<ReturnType<typeof getServiceRoleClient>>;
  };

  const body = await req.json().catch(() => ({}));
  const action = String(body.action ?? "upsert_week");

  if (action === "update_meta") {
    const patch: Record<string, unknown> = {};
    if ("formation_starts_on" in body) patch.formation_starts_on = body.formation_starts_on || null;
    if ("formation_ends_on" in body) patch.formation_ends_on = body.formation_ends_on || null;
    if ("title_label" in body) patch.title_label = body.title_label ? String(body.title_label).trim() : null;
    if ("specialty_label" in body) {
      patch.specialty_label = body.specialty_label ? String(body.specialty_label).trim() : null;
    }
    const { error } = await db.from("school_classes").update(patch).eq("id", classId);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  }

  if (action === "set_week") {
    const weekStartsOn = String(body.week_starts_on ?? "").slice(0, 10);
    const weekType = body.week_type;
    if (!weekStartsOn || !isAlternanceWeekType(weekType)) {
      return NextResponse.json({ error: "INVALID_WEEK" }, { status: 400 });
    }
    const monday = toIsoDate(startOfIsoWeek(new Date(weekStartsOn + "T12:00:00")));
    const { error } = await db.from("alternance_calendar").upsert(
      {
        class_id: classId,
        week_starts_on: monday,
        week_type: weekType as AlternanceWeekType,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "class_id,week_starts_on" },
    );
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true, week_starts_on: monday, week_type: weekType });
  }

  if (action === "fill_pattern") {
    const from = String(body.from_week_starts_on ?? "").slice(0, 10);
    const until = String(body.until_ends_on ?? "").slice(0, 10);
    const schoolWeeks = Number(body.school_weeks ?? 1);
    const companyWeeks = Number(body.company_weeks ?? 3);
    if (!from || !until) return NextResponse.json({ error: "DATES_REQUIRED" }, { status: 400 });

    const rows = fillPatternWeeks({
      fromWeekStartsOn: from,
      untilEndsOn: until,
      schoolWeeks,
      companyWeeks,
    }).map((w) => ({
      class_id: classId,
      week_starts_on: w.week_starts_on,
      week_type: w.week_type,
      updated_at: new Date().toISOString(),
    }));

    if (rows.length === 0) return NextResponse.json({ error: "EMPTY" }, { status: 400 });

    // Ensure year bounds
    await db
      .from("school_classes")
      .update({
        formation_starts_on: from,
        formation_ends_on: until,
      })
      .eq("id", classId);

    const { error } = await db.from("alternance_calendar").upsert(rows, {
      onConflict: "class_id,week_starts_on",
    });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true, count: rows.length });
  }

  if (action === "ensure_range") {
    const starts = String(body.formation_starts_on ?? "").slice(0, 10);
    const ends = String(body.formation_ends_on ?? "").slice(0, 10);
    if (!starts || !ends) return NextResponse.json({ error: "DATES_REQUIRED" }, { status: 400 });
    const defaultType = isAlternanceWeekType(body.default_type) ? body.default_type : "company";
    const weeks = listWeekStarts(starts, ends);
    const { data: existing } = await db
      .from("alternance_calendar")
      .select("week_starts_on")
      .eq("class_id", classId);
    const have = new Set((existing ?? []).map((w) => String(w.week_starts_on)));
    const missing = weeks
      .filter((w) => !have.has(w))
      .map((week_starts_on) => ({
        class_id: classId,
        week_starts_on,
        week_type: defaultType,
        updated_at: new Date().toISOString(),
      }));
    if (missing.length) {
      const { error } = await db.from("alternance_calendar").insert(missing);
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    }
    await db
      .from("school_classes")
      .update({ formation_starts_on: starts, formation_ends_on: ends })
      .eq("id", classId);
    return NextResponse.json({ ok: true, added: missing.length });
  }

  return NextResponse.json({ error: "UNKNOWN_ACTION" }, { status: 400 });
}
